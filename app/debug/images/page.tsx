'use client'

import { useState } from 'react'

const TEST_PROMPTS = [
  'golden gate bridge at sunset, wide establishing shot. editorial vector illustration, flat design with subtle gradients, modern and clean, muted professional color palette, consistent art style, minimal detail, no text, no words, 16:9',
  'abstract data visualization, blue analytical tones, research findings. editorial vector illustration, flat design with subtle gradients, modern and clean, muted professional color palette, consistent art style, minimal detail, no text, no words, 16:9',
  'student giving presentation, modern classroom, confident speaker. editorial vector illustration, flat design with subtle gradients, modern and clean, muted professional color palette, consistent art style, minimal detail, no text, no words, 16:9',
]

interface Result {
  prompt: string
  url?: string
  error?: string
  ms?: number
}

export default function DebugImagesPage() {
  const [results, setResults] = useState<Result[]>([])
  const [running, setRunning] = useState(false)

  async function run() {
    setResults([])
    setRunning(true)

    for (const prompt of TEST_PROMPTS) {
      const start = Date.now()
      try {
        const res = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, provider: 'flux' }),
        })
        const data = await res.json() as { url?: string; error?: string }
        const ms = Date.now() - start
        if (data.url) {
          setResults(prev => [...prev, { prompt, url: data.url, ms }])
        } else {
          setResults(prev => [...prev, { prompt, error: data.error ?? `HTTP ${res.status}`, ms }])
        }
      } catch (err) {
        setResults(prev => [...prev, { prompt, error: String(err), ms: Date.now() - start }])
      }
    }

    setRunning(false)
  }

  return (
    <div style={{ padding: 32, fontFamily: 'monospace', maxWidth: 900 }}>
      <h1 style={{ fontSize: 18, marginBottom: 16 }}>debug: flux image generation</h1>
      <p style={{ fontSize: 13, marginBottom: 20, color: '#666' }}>
        Calls <code>/api/generate-image</code> sequentially for {TEST_PROMPTS.length} prompts.
        Must be logged in (auth-gated route). Check server terminal for raw output shape log.
      </p>

      <button
        onClick={run}
        disabled={running}
        style={{ padding: '10px 24px', fontSize: 14, cursor: running ? 'wait' : 'pointer', marginBottom: 32 }}
      >
        {running ? 'running…' : 'Run test'}
      </button>

      {results.map((r, i) => (
        <div key={i} style={{ marginBottom: 32, borderTop: '1px solid #ccc', paddingTop: 16 }}>
          <pre style={{ fontSize: 11, color: '#555', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: '0 0 8px' }}>
            [{i + 1}] {r.prompt}
          </pre>
          {r.url ? (
            <>
              <p style={{ fontSize: 12, color: '#080', margin: '0 0 8px' }}>
                OK · {r.ms}ms · <a href={r.url} target="_blank" rel="noreferrer">{r.url.slice(0, 80)}…</a>
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.url} alt={`result ${i + 1}`} style={{ width: '100%', maxWidth: 800, display: 'block', borderRadius: 4 }} />
            </>
          ) : (
            <p style={{ fontSize: 12, color: '#c00', margin: 0 }}>ERROR: {r.error}</p>
          )}
        </div>
      ))}
    </div>
  )
}
