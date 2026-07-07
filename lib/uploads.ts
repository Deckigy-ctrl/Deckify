// Shared helper — client-safe, no server deps.
// User uploads are stored under {userId}/uploads/ in the deck-images bucket
// (see app/api/upload-image); that path segment is the provenance marker
// distinguishing them from AI-generated images in the same bucket.
export function isUploadUrl(url: unknown): url is string {
  return typeof url === 'string' && url.includes('/uploads/')
}

/** Max user images rendered on one slide (primary + extras). Overflow stays in the tray. */
export const MAX_IMAGES_PER_SLIDE = 3

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024 // must match /api/upload-image
const MAX_UPLOAD_DIM = 2400              // px — plenty for a 900px slide panel

/** Read an image file's natural pixel dimensions. Best-effort — resolves 0×0
    on decode failure so it never blocks an upload. */
export async function readImageSize(file: Blob): Promise<{ w: number; h: number }> {
  try {
    if (typeof createImageBitmap === 'function') {
      const bmp = await createImageBitmap(file)
      const dims = { w: bmp.width, h: bmp.height }
      bmp.close()
      return dims
    }
  } catch { /* fall through to <img> decode */ }
  return new Promise(resolve => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { resolve({ w: img.naturalWidth, h: img.naturalHeight }); URL.revokeObjectURL(url) }
    img.onerror = () => { resolve({ w: 0, h: 0 }); URL.revokeObjectURL(url) }
    img.src = url
  })
}

/** Make any image file acceptable to /api/upload-image (JPEG/PNG, ≤5 MB).
    JPEG/PNG within the size cap pass through untouched; anything else (WebP,
    oversized screenshots, huge camera photos) is downscaled to ≤2400px and
    re-encoded as JPEG. Returns null when the browser can't decode the file. */
export async function prepareImageUpload(file: File): Promise<File | null> {
  const passthrough = (file.type === 'image/jpeg' || file.type === 'image/png') && file.size <= MAX_UPLOAD_BYTES
  if (passthrough) return file
  try {
    const bmp = await createImageBitmap(file)
    const scale = Math.min(1, MAX_UPLOAD_DIM / Math.max(bmp.width, bmp.height))
    const w = Math.max(1, Math.round(bmp.width * scale))
    const h = Math.max(1, Math.round(bmp.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    // JPEG has no alpha — paint white behind transparent PNGs/WebPs.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(bmp, 0, 0, w, h)
    bmp.close()
    for (const quality of [0.87, 0.7, 0.55]) {
      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', quality))
      if (blob && blob.size <= MAX_UPLOAD_BYTES) {
        const base = file.name.replace(/\.[a-z0-9]+$/i, '') || 'image'
        return new File([blob], `${base}.jpg`, { type: 'image/jpeg' })
      }
    }
    return null
  } catch {
    return null
  }
}

/** Prepare + upload one image file. Returns the permanent URL and natural
    dimensions, or an error message suitable for a toast. */
export async function uploadImageFile(file: File): Promise<{ url: string; w: number; h: number } | { error: string }> {
  const prepared = await prepareImageUpload(file)
  if (!prepared) return { error: `${file.name}: couldn't be read as an image` }
  const dims = await readImageSize(prepared)
  const fd = new FormData()
  fd.append('file', prepared)
  try {
    const res = await fetch('/api/upload-image', { method: 'POST', body: fd })
    const data = await res.json() as { url?: string; error?: string }
    if (res.ok && data.url) return { url: data.url, w: dims.w, h: dims.h }
    return { error: data.error ?? `Upload failed: ${file.name}` }
  } catch {
    return { error: `Upload failed: ${file.name}` }
  }
}

/** Slide types whose layout reliably renders a primary image. quote, findings
    and the composed layouts (comparison/iconstat/timeline) show no image, so an
    upload placed there would be silently invisible — keep those in the tray. */
export function layoutRendersImage(type: unknown): boolean {
  return type === 'title' || type === 'stat' || type === 'bullets'
    || type === 'text' || type === 'methodology' || type === 'figure';
}

/** Slide types whose layout actually renders extra images (a stacked side
    panel) beyond the primary. Placing an extra on any other type would be
    silently invisible (bug B2), so callers keep those images in the tray. */
export function layoutRendersExtras(type: unknown): boolean {
  return type === 'bullets' || type === 'text' || type === 'methodology'
}

/** Which image kinds a slide can accept RIGHT NOW, or null if it can't take
    another upload at all. This is what makes matching work: the vision matcher
    is only offered slides it can actually land an image on, instead of picking
    the best slide by meaning and having a guard tray the image afterwards
    (composed layouts made most slides image-less, so that happened constantly). */
export function slideAccepts(slide: { type?: unknown; img?: unknown; extraImgs?: unknown }): 'photo' | 'both' | null {
  const type = slide.type
  if (!layoutRendersImage(type)) return null
  const extras = Array.isArray(slide.extraImgs) ? (slide.extraImgs as unknown[]).filter(isUploadUrl) : []
  const placed = (isUploadUrl(slide.img) ? 1 : 0) + extras.length
  if (placed >= MAX_IMAGES_PER_SLIDE) return null
  if (isUploadUrl(slide.img)) {
    // Primary slot taken by an upload — only the split layouts show extras.
    return layoutRendersExtras(type) ? 'both' : null
  }
  // Primary slot open: full-bleed backgrounds (title/stat) crop, so figures
  // (diagrams/tables) are banned there; framed/panel layouts take anything.
  return (type === 'title' || type === 'stat') ? 'photo' : 'both'
}
