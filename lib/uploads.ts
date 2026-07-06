// Shared helper — client-safe, no server deps.
// User uploads are stored under {userId}/uploads/ in the deck-images bucket
// (see app/api/upload-image); that path segment is the provenance marker
// distinguishing them from AI-generated images in the same bucket.
export function isUploadUrl(url: unknown): url is string {
  return typeof url === 'string' && url.includes('/uploads/')
}

/** Max user images rendered on one slide (primary + extras). Overflow stays in the tray. */
export const MAX_IMAGES_PER_SLIDE = 3

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
