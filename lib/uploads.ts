// Shared helper — client-safe, no server deps.
// User uploads are stored under {userId}/uploads/ in the deck-images bucket
// (see app/api/upload-image); that path segment is the provenance marker
// distinguishing them from AI-generated images in the same bucket.
export function isUploadUrl(url: unknown): url is string {
  return typeof url === 'string' && url.includes('/uploads/')
}

/** Max user images rendered on one slide (primary + extras). Overflow stays in the tray. */
export const MAX_IMAGES_PER_SLIDE = 3
