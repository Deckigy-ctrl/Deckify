import type { ImageGeneratorFn } from './types'

const API_BASE     = 'https://api.replicate.com/v1'
const MODEL        = 'black-forest-labs/flux-schnell'
const TIMEOUT_MS   = 30_000
const POLL_MS      = 600
const MAX_RETRIES  = 3

interface Prediction {
  id:      string
  status:  'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  output?: unknown
  error?:  string
}

async function pollUntilDone(id: string, token: string, deadline: number): Promise<Prediction> {
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, POLL_MS))
    const res = await fetch(`${API_BASE}/predictions/${id}`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
    if (!res.ok) throw new Error(`Replicate poll failed: HTTP ${res.status}`)
    const p = await res.json() as Prediction
    if (p.status === 'succeeded' || p.status === 'failed' || p.status === 'canceled') return p
  }
  throw new Error('Timed out waiting for Replicate prediction')
}

export const replicateFlux: ImageGeneratorFn = async (prompt, apiKey, opts) => {
  const deadline = Date.now() + TIMEOUT_MS

  let createRes!: Response
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    createRes = await fetch(`${API_BASE}/models/${MODEL}/predictions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          prompt,
          num_outputs:    1,
          output_format:  'webp',
          output_quality: 75,
          // Match the slide region the image will fill (3:4 for side panels,
          // 16:9 for full-bleed) so object-fit:cover barely crops.
          aspect_ratio:   opts?.aspectRatio ?? '16:9',
        },
      }),
    })

    if (createRes.status !== 429) break

    if (attempt === MAX_RETRIES) {
      throw new Error(`Replicate rate limit (429) after ${MAX_RETRIES} retries`)
    }
    // Exponential backoff: 10s, 20s, 40s — Replicate allows 6 req/min burst 1
    const delay = 10_000 * Math.pow(2, attempt)
    console.warn(`[replicate] 429 rate limit — retrying in ${delay / 1000}s (attempt ${attempt + 1}/${MAX_RETRIES})`)
    await new Promise(r => setTimeout(r, delay))
  }

  if (!createRes.ok) {
    const body = await createRes.text()
    throw new Error(`Replicate create failed: HTTP ${createRes.status} — ${body.slice(0, 200)}`)
  }

  let prediction = await createRes.json() as Prediction

  if (prediction.status !== 'succeeded') {
    prediction = await pollUntilDone(prediction.id, apiKey, deadline)
  }

  if (prediction.status !== 'succeeded') {
    throw new Error(`Prediction ${prediction.status}: ${prediction.error ?? 'unknown error'}`)
  }

  const output = prediction.output

  if (!Array.isArray(output) || output.length === 0) {
    throw new Error(`Unexpected output shape: ${JSON.stringify(output)}`)
  }

  const first = output[0]

  if (typeof first !== 'string' || !first.startsWith('http')) {
    throw new Error(`output[0] is not a URL string — got: ${JSON.stringify(first)}`)
  }

  // Delivery URLs expire (~1 hour) — the API route downloads the bytes and
  // re-uploads to Supabase Storage before returning a permanent URL.
  return first
}
