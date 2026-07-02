// Server-side only — imported by app/api/generate-image/route.ts.
// Do NOT import this file in client components (it pulls in provider implementations).

import type { ImageProviderDef, ImageGeneratorFn } from './types'
import { replicateFlux } from './replicate'

// ── Provider registry ────────────────────────────────────────────────────────
// To add a provider:
//   1. Create lib/ai/images/<name>.ts implementing ImageGeneratorFn
//   2. Add a def to IMAGE_PROVIDERS and an entry to GENERATORS
//   3. Add the API key case to getProviderApiKey() in app/api/generate-image/route.ts
//
// TODO: DALL-E 3 (OpenAI)  — needs OPENAI_API_KEY,  ~$0.04/image
// TODO: Imagen 3 (Google)  — needs GOOGLE_AI_API_KEY, ~$0.02/image

export const IMAGE_PROVIDERS: ImageProviderDef[] = [
  { id: 'flux', label: 'Flux Schnell — fast & cheap (~$0.003/image)' },
  // { id: 'dalle',  label: 'DALL-E 3 — high quality (~$0.04/image)'   },
  // { id: 'imagen', label: 'Imagen 3 — Google (~$0.02/image)'          },
]

const GENERATORS: Record<string, ImageGeneratorFn> = {
  flux: replicateFlux,
  // dalle:  dalleProvider,
  // imagen: imagenProvider,
}

export function getGenerator(providerId: string): ImageGeneratorFn {
  const fn = GENERATORS[providerId]
  if (!fn) throw new Error(`Unknown image provider: "${providerId}"`)
  return fn
}
