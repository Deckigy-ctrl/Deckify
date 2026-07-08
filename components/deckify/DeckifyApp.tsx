'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { OutlineCard } from '@/lib/ai/types'
import type { ThemeKey } from '@/lib/themes/config'
import { buildImagePrompt } from '@/lib/ai/images/buildImagePrompt'
import { TBGS, TTXTS, TACCS } from '@/lib/themes/config'
import { presRenderSlide } from '@/lib/themes/presRender'
import { isUploadUrl, slideAccepts, uploadImageFile } from '@/lib/uploads'
import type { ImageMeta } from '@/lib/themes/buildElements'
import EditorOverlay from './EditorOverlay'
import { exportPdf } from '@/lib/export/exportPdf'
import { exportPptx } from '@/lib/export/exportPptx'

/* ─── types ─────────────────────────────────────────────────── */
export interface SlideData {
  type?: string
  title?: string
  subtitle?: string
  body?: string
  bullets?: string[]
  stat?: string
  quote?: string
  attribution?: string
  steps?: string[]
  items?: { label: string; value: string }[]
  columns?: string[]
  rows?: string[][]
  stats?: { value: string; label: string }[]
  caption?: string
  img?: string
  /** Additional user-uploaded images on this slide (beyond img). */
  extraImgs?: string[]
  /** Per-image metadata (w/h/caption/kind), keyed by image URL. */
  imgMeta?: Record<string, ImageMeta>
  /** How much this slide's content benefits from a picture (set by the
      generation model): 'high' | 'low' | 'none'. Drives need-based AI fill. */
  img_need?: string
  speaker_notes?: string
  [key: string]: unknown
}

export interface SavedDeck {
  id: string
  name: string
  slides: SlideData[]
  theme: ThemeKey
  createdAt: number
  /** User-uploaded images not (yet) placed on any slide — shown in the editor tray. */
  tray?: string[]
  /** Durable master of per-image metadata for the whole deck (placed + tray),
      keyed by image URL. Survives reloads so tray images keep their fit/kind. */
  imageMeta?: Record<string, ImageMeta>
}

type Page = 'home' | 'create' | 'outline' | 'theme' | 'media'

/** One image in the user's AI media library (portal-generated, reusable in
    any deck via the editor's 📥 tab). Persisted in localStorage. */
export interface MediaItem {
  url: string
  prompt: string
  style: string
  aspect: string
  createdAt: number
}

interface OutlineParams {
  topic: string
  count: number
  audience: string
  goal: string
  tone: string
}

/* ─── constants ─────────────────────────────────────────────── */
const PICSUM = [10, 20, 42, 60, 96, 160, 180, 201, 217, 250]
const picUrl = (i: number) =>
  `https://picsum.photos/id/${PICSUM[i % PICSUM.length]}/800/500`


const THEME_LIST: { key: ThemeKey; label: string }[] = [
  { key: 'clean',    label: 'Clean'    },
  { key: 'ocean',    label: 'Ocean'    },
  { key: 'warm',     label: 'Warm'     },
  { key: 'bold',     label: 'Bold'     },
  { key: 'diagonal', label: 'Diagonal' },
  { key: 'horizon',  label: 'Horizon'  },
  { key: 'typo',     label: 'Typo'     },
  { key: 'stage',    label: 'Stage'    },
  { key: 'card',     label: 'Card'     },
  { key: 'grid',     label: 'Grid'     },
  { key: 'editorial',label: 'Editorial'},
  { key: 'bands',    label: 'Bands'    },
  { key: 'portrait', label: 'Portrait' },
  { key: 'overlap',  label: 'Overlap'  },
]

const SUGGEST_TYPES = [
  { type: 'thesis',  icon: '📜', title: 'Thesis defence',  sub: 'Introduction · Literature · Methodology · Findings' },
  { type: 'seminar', icon: '🎓', title: 'Class seminar',   sub: 'Context · Key concepts · Examples · Discussion'     },
  { type: 'group',   icon: '👥', title: 'Group project',   sub: 'Problem · Solution · Process · Results'             },
  { type: 'report',  icon: '📊', title: 'Research report', sub: 'Overview · Data · Analysis · Recommendations'       },
]

const EXAMPLE_TOPICS: Record<string, { topic: string; audience: string; goal: string; tone: string }> = {
  thesis:  { topic: 'My thesis on sustainable agriculture in northern Thailand', audience: 'committee', goal: 'defend',   tone: 'academic'      },
  seminar: { topic: 'Introduction to machine learning for beginners',            audience: 'class',     goal: 'explain',  tone: 'conversational' },
  group:   { topic: 'Urban mobility solutions for Bangkok\'s traffic problem',   audience: 'class',     goal: 'propose',  tone: 'professional'   },
  report:  { topic: 'Research findings on urban air quality in Southeast Asia',  audience: 'conference',goal: 'findings', tone: 'academic'       },
}

const GEN_MSGS = [
  'Reading your research topic...',
  'Structuring your argument...',
  'Writing the introduction...',
  'Building the main content...',
  'Adding evidence and examples...',
  'Writing your conclusion...',
  'Preparing speaker notes...',
  'Almost ready...',
]

/* ─── fallback deck builder ─────────────────────────────────── */
function buildTopicFallback(topic: string, count: number): SlideData[] {
  const lc = (topic || '').toLowerCase()
  const isThesis = /thesis|research|study|dissertation|investigation|analysis/.test(lc)
  const slides: SlideData[] = []

  slides.push({ type: 'title', title: topic, subtitle: 'Presentation outline',
    speaker_notes: 'Introduce yourself and the topic.', img: picUrl(0) })

  if (count >= 3)
    slides.push({ type: 'bullets', title: 'Background & context',
      bullets: ['This topic is relevant because of its current impact.',
        'Key developments in this area have shaped understanding significantly.',
        'This presentation examines the core aspects of ' + topic + '.'],
      speaker_notes: 'Provide background so the audience understands the context.', img: picUrl(1) })

  if (count >= 4 && isThesis)
    slides.push({ type: 'bullets', title: 'Research question',
      bullets: ['The central question this research addresses is clearly defined.',
        'Previous studies have not fully examined this specific angle.',
        'This work fills an identified gap in the existing literature.'], img: picUrl(2) })

  if (count >= 5 && isThesis)
    slides.push({ type: 'methodology', title: 'Methodology',
      steps: ['Step 1: Data collection through surveys and interviews',
        'Step 2: Qualitative and quantitative analysis of findings',
        'Step 3: Validation against existing literature and frameworks'], img: picUrl(3) })

  if (count >= 4 && !isThesis)
    slides.push({ type: 'bullets', title: 'Key concepts',
      bullets: ['First key concept: define clearly and explain its significance.',
        'Second key concept: how it relates to the broader topic.',
        'Third key concept: practical implications and real-world examples.'], img: picUrl(2) })

  if (count >= 5)
    slides.push({ type: 'bullets', title: 'Main findings',
      bullets: ['Finding 1: primary result or key point.',
        'Finding 2: supporting evidence or secondary finding.',
        'Finding 3: implications for practice or understanding.'], img: picUrl(4) })

  if (count >= 6)
    slides.push({ type: 'text', title: 'Discussion',
      body: 'The findings suggest important implications for this field. Further research is needed to explore these questions in greater depth.', img: picUrl(5) })

  if (count >= 7)
    slides.push({ type: 'bullets', title: 'Limitations & future work',
      bullets: ['Current limitations include scope, sample size, and available data.',
        'Future research could expand on these findings with broader methods.',
        'Additional perspectives would strengthen the conclusions drawn here.'], img: picUrl(6) })

  while (slides.length < count - 1)
    slides.push({ type: 'bullets', title: 'Additional points',
      bullets: ['This section provides further context for the presentation.',
        'More detail is available in the full written report.',
        'Questions are welcome on any aspect of this topic.'], img: picUrl(slides.length) })

  slides.push({ type: 'text', title: 'Conclusion & Q&A',
    body: 'Thank you. The key takeaway from this presentation is that ' + topic +
      ' is an important area that warrants continued attention and study.',
    img: picUrl(slides.length) })

  return slides.slice(0, count)
}

/* ─── date helpers ──────────────────────────────────────────── */
function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return Math.floor(diff / 60_000) + 'm ago'
  if (diff < 86_400_000) return Math.floor(diff / 3_600_000) + 'h ago'
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function userInitials(email: string | undefined): string {
  if (!email) return '?'
  const [local] = email.split('@')
  return local.slice(0, 2).toUpperCase()
}

/* ─── component ─────────────────────────────────────────────── */
interface Props {
  user: { email: string | undefined; id: string } | null
  credits: number
}

export default function DeckifyApp({ user, credits: initialCredits }: Props) {
  const [page, setPage] = useState<Page>('home')
  const [savedDecks, setSavedDecks] = useState<SavedDeck[]>([])
  const [generating, setGenerating] = useState(false)
  const [genStatus, setGenStatus] = useState('')
  const [genProgress, setGenProgress] = useState(0)
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>('clean')
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingDeck, setEditingDeck] = useState<SavedDeck | null>(null)
  const [credits, setCredits] = useState(initialCredits)
  const [upgrading, setUpgrading] = useState(false)
  const [outline, setOutline] = useState<OutlineCard[]>([])
  const [outlineParams, setOutlineParams] = useState<OutlineParams | null>(null)
  const [outlineLoading, setOutlineLoading] = useState(false)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  // Permanent Supabase URLs of user-uploaded images (uploaded at drop time,
  // never blob: URLs). Consumed by the vision-matching step at generation.
  // uploadsRef mirrors the state so async loops and background phases always
  // read the CURRENT list — `uploads` captured in a closure goes stale while
  // a multi-file drop is still uploading (that's how 15 slipped past the cap).
  const [uploads, setUploads] = useState<string[]>([])
  const [uploadingCount, setUploadingCount] = useState(0)
  const uploadsRef  = useRef<string[]>([])
  const inflightRef = useRef(0)
  const MAX_UPLOADS = 10
  // Natural pixel size of each uploaded image, keyed by its Supabase URL.
  // Captured client-side at drop time and folded into imgMeta at match time.
  const uploadDimsRef = useRef<Record<string, { w: number; h: number }>>({})
  // Vision caption + photo/figure kind per upload URL, captured by the
  // outline-time captioning call. Passed to /api/generate so the deck model
  // plans slides that can actually host these images.
  const uploadCaptionsRef = useRef<Record<string, { caption: string; kind: 'photo' | 'figure' }>>({})

  const PENDING_UPLOADS_KEY = 'deckify_pending_uploads'
  function syncUploads(next: string[]) {
    uploadsRef.current = next
    setUploads(next)
    // Persist so a page reload before generating doesn't silently drop the
    // user's uploaded images (B3). Cleared automatically when consumed ([]).
    try {
      if (next.length) {
        sessionStorage.setItem(PENDING_UPLOADS_KEY, JSON.stringify({ urls: next, dims: uploadDimsRef.current }))
      } else {
        sessionStorage.removeItem(PENDING_UPLOADS_KEY)
      }
    } catch { /* ignore */ }
  }

  /* ── Unified drop handling: docs feed the outline, images feed slides ── */
  const DOC_EXTS = ['pdf', 'docx', 'pptx']
  async function addFiles(files: File[]) {
    // Track the current document within this batch — React state (pdfFile) is
    // async and would be stale across iterations, making the replacement toast
    // wrong and letting the last doc win silently (B4).
    let docFile = pdfFile
    for (const file of files) {
      const ext = file.name.toLowerCase().split('.').pop() ?? ''
      if (DOC_EXTS.includes(ext)) {
        if (file.size > 10 * 1024 * 1024) { showToast(`${file.name}: too large (max 10 MB)`); continue }
        if (docFile) showToast(`Replacing ${docFile.name} with ${file.name}. One document per deck`)
        docFile = file
        setPdfFile(file)
      } else if (file.type.startsWith('image/')) {
        // Any image type: uploadImageFile transcodes WebP/oversized files to
        // JPEG under the 5 MB cap, so nothing valid is rejected for format/size.
        if (uploadsRef.current.length + inflightRef.current >= MAX_UPLOADS) {
          showToast(`Maximum ${MAX_UPLOADS} images per deck`); continue
        }
        inflightRef.current += 1
        setUploadingCount(c => c + 1)
        try {
          const result = await uploadImageFile(file)
          if ('error' in result) {
            showToast(result.error)
          } else {
            if (result.w && result.h) uploadDimsRef.current[result.url] = { w: result.w, h: result.h }
            syncUploads([...uploadsRef.current, result.url])
          }
        } finally {
          inflightRef.current -= 1
          setUploadingCount(c => c - 1)
        }
      } else {
        showToast(`${file.name}: unsupported. Use PDF, Word, PowerPoint, or an image`)
      }
    }
  }
  function removeUpload(url: string) {
    syncUploads(uploadsRef.current.filter(u => u !== url))
  }
  const [aiImages, setAiImages] = useState(false)
  const [imageProvider, setImageProvider] = useState('flux')
  const [imageGenProgress, setImageGenProgress] = useState<string | null>(null)

  /* ── AI media library (portal) ──────────────────────────────── */
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  // How many portal generations are still in flight. Generation keeps running
  // while the user navigates elsewhere in the app — results land in the
  // library as they finish (that's the point of the portal: no waiting).
  const [mediaPending, setMediaPending] = useState(0)
  const mediaSeqRef = useRef(0)

  function persistMedia(items: MediaItem[]) {
    setMediaItems(items)
    try { localStorage.setItem('deckify_media', JSON.stringify(items)) } catch { /* ignore */ }
  }

  const MEDIA_STYLES: Record<string, { label: string; suffix: string }> = {
    illustration: { label: '🎨 Illustration', suffix: 'flat editorial illustration, modern minimal shapes, soft gradients, muted palette, no text, no lettering' },
    photo:        { label: '📷 Photo',        suffix: 'professional photograph, natural lighting, shallow depth of field, high detail, no text' },
    abstract:     { label: '◼ Abstract',      suffix: 'abstract minimal composition, geometric shapes, soft gradients, generous negative space, no text' },
  }

  async function generateMediaImages(prompt: string, style: string, aspect: string, count: number) {
    const styled = `${prompt.trim()}. ${MEDIA_STYLES[style]?.suffix ?? MEDIA_STYLES.illustration.suffix}`.slice(0, 400)
    setMediaPending(p => p + count)
    const seq = ++mediaSeqRef.current
    for (let i = 0; i < count; i++) {
      try {
        // Generation is background work, so absorb one provider hiccup
        // (queue congestion / cold start timeout) with a single retry.
        let lastError = 'Image generation failed'
        let done = false
        for (let attempt = 0; attempt < 2 && !done; attempt++) {
          if (attempt > 0) await new Promise(r => setTimeout(r, 3_000))
          try {
            const res = await fetch('/api/generate-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: styled, provider: imageProvider, aspectRatio: aspect }),
            })
            if (res.ok) {
              const data = await res.json() as { url?: string }
              if (data.url) {
                const item: MediaItem = { url: data.url, prompt: prompt.trim(), style, aspect, createdAt: Date.now() }
                setMediaItems(prev => {
                  const next = [item, ...prev]
                  try { localStorage.setItem('deckify_media', JSON.stringify(next)) } catch { /* ignore */ }
                  return next
                })
                done = true
              }
            } else {
              const err = await res.json().catch(() => ({})) as { error?: string }
              lastError = err.error ?? lastError
            }
          } catch {
            lastError = 'Image generation failed. Check your connection'
          }
        }
        if (!done) showToast(lastError)
      } finally {
        setMediaPending(p => Math.max(0, p - 1))
      }
      // Same pacing as deck image generation (Replicate free-tier bursts).
      if (i < count - 1 && seq === mediaSeqRef.current) {
        await new Promise(r => setTimeout(r, 2_000))
      }
    }
  }

  function deleteMediaItem(url: string) {
    persistMedia(mediaItems.filter(m => m.url !== url))
  }

  const topicRef    = useRef<HTMLTextAreaElement>(null)
  const audienceRef = useRef<HTMLSelectElement>(null)
  const goalRef     = useRef<HTMLSelectElement>(null)
  const toneRef     = useRef<HTMLSelectElement>(null)
  const countRef    = useRef<HTMLSelectElement>(null)
  const toastTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const genTimer    = useRef<ReturnType<typeof setInterval> | null>(null)

  /* ── persistence ─────────────────────────────────────────── */
  useEffect(() => {
    try {
      const raw = localStorage.getItem('deckify_decks')
      if (raw) setSavedDecks(JSON.parse(raw) as SavedDeck[])
    } catch { /* ignore */ }
    // Load the AI media library.
    try {
      const raw = localStorage.getItem('deckify_media')
      if (raw) {
        const parsed = JSON.parse(raw) as unknown
        if (Array.isArray(parsed)) {
          setMediaItems(parsed.filter((m): m is MediaItem =>
            !!m && typeof m === 'object' && typeof (m as MediaItem).url === 'string'))
        }
      }
    } catch { /* ignore */ }
    // Restore pending create-page image uploads after a reload (B3).
    try {
      const raw = sessionStorage.getItem('deckify_pending_uploads')
      if (raw) {
        const { urls, dims } = JSON.parse(raw) as { urls?: unknown; dims?: unknown }
        if (Array.isArray(urls) && urls.length) {
          const clean = urls.filter((u): u is string => typeof u === 'string')
          uploadsRef.current = clean
          setUploads(clean)
          if (dims && typeof dims === 'object') uploadDimsRef.current = dims as Record<string, { w: number; h: number }>
        }
      }
    } catch { /* ignore */ }
  }, [])

  // When AI images arrive they update savedDecks but editingDeck is a snapshot from
  // openEditor() time. Keep editingDeck in sync so EditorOverlay receives the new URLs.
  useEffect(() => {
    if (!editingDeck) return
    const live = savedDecks.find(d => d.id === editingDeck.id)
    if (live && live !== editingDeck) setEditingDeck(live)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedDecks]) // intentionally omit editingDeck — stable id is all we need from it

  function persistAndSet(decks: SavedDeck[]) {
    try { localStorage.setItem('deckify_decks', JSON.stringify(decks)) } catch { /* ignore */ }
    setSavedDecks(decks)
  }

  function deleteDeck(id: string) {
    persistAndSet(savedDecks.filter(d => d.id !== id))
  }

  function renameDeck(id: string, newName: string) {
    const trimmed = newName.trim()
    if (!trimmed) return
    persistAndSet(savedDecks.map(d => d.id === id ? { ...d, name: trimmed } : d))
  }

  function duplicateDeck(id: string) {
    const src = savedDecks.find(d => d.id === id)
    if (!src) return
    const copy: SavedDeck = { ...src, id: 'deck_' + Date.now(), name: src.name + ' (copy)', createdAt: Date.now() }
    persistAndSet([copy, ...savedDecks])
    showToast('Deck duplicated')
  }

  function openEditor(deck: SavedDeck) {
    setEditingDeck(deck)
    setEditorOpen(true)
  }

  function closeEditor(updated: SavedDeck) {
    persistAndSet(savedDecks.map(d => d.id === updated.id ? updated : d))
    setEditorOpen(false)
    setEditingDeck(null)
    showToast('Changes saved ✓')
  }

  /* ── toast ───────────────────────────────────────────────── */
  function showToast(msg: string) {
    setToastMsg(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(null), 3200)
  }

  /* ── Stage 1: generate outline ──────────────────────────── */
  async function startOutline() {
    setOutlineLoading(true)
    try {
      // Source text = what the user typed + any text extracted from a document.
      // Both are optional; we combine them rather than letting one replace the
      // other, so a typed instruction survives even when a document yields no
      // text (e.g. a photo-heavy PowerPoint) and vice versa.
      const typed = topicRef.current?.value.trim() ?? ''
      let extracted = ''

      if (pdfFile) {
        try {
          const fd = new FormData()
          fd.append('file', pdfFile)
          const res = await fetch('/api/extract-doc', { method: 'POST', body: fd })
          const contentType = res.headers.get('content-type') ?? ''
          const data = contentType.includes('application/json')
            ? await res.json() as { text?: string; error?: string }
            : {}
          if (res.ok && data.text) {
            extracted = data.text
          } else if (!typed) {
            // No usable text anywhere — this is the only real dead-end.
            showToast(data.error ?? `Couldn't read text from ${pdfFile.name}. Add a short description and try again.`)
            return
          } else {
            // Document had no readable text, but the user described the deck —
            // proceed with their description and don't block.
            showToast(`Couldn't read text from ${pdfFile.name}. Using your description.`)
          }
        } catch {
          if (!typed) { showToast('Text extraction failed. Add a short description and try again.'); return }
          showToast('Text extraction failed. Using your description.')
        }
      }

      // When the user attached images, have vision caption them FIRST so their
      // content shapes the outline — a figure-heavy PowerPoint with no text
      // layer must still produce a deck about the figures, not about the
      // user's instruction sentence.
      let imageContext = ''
      if (uploadsRef.current.length > 0) {
        try {
          const res = await fetch('/api/match-images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ images: uploadsRef.current }),
          })
          if (res.ok) {
            const data = await res.json() as { matches?: { url?: string; caption: string; kind?: 'photo' | 'figure' }[] }
            const matches = (data.matches ?? []).filter(m => m.caption)
            // Remember caption + kind per URL — generateFromOutline sends these
            // to /api/generate so the model plans image-hosting slides.
            for (const m of matches) {
              if (typeof m.url === 'string') {
                uploadCaptionsRef.current[m.url] = { caption: m.caption, kind: m.kind === 'figure' ? 'figure' : 'photo' }
              }
            }
            if (matches.length) {
              imageContext =
                'The user attached these images for the deck (build the content around what they show):\n' +
                matches.map((m, i) => `${i + 1}. ${m.caption}`).join('\n')
            }
          }
        } catch { /* captioning is best-effort — proceed without it */ }
      }

      const topic = [typed, extracted, imageContext].filter(Boolean).join('\n\n')

      if (topic.length < 5) {
        showToast(uploadsRef.current.length ? 'Add a short description of the deck you want' : 'Please describe your presentation first')
        topicRef.current?.focus()
        return
      }

      const count    = parseInt(countRef.current?.value ?? '8', 10)
      const audience = audienceRef.current?.value ?? 'committee'
      const goal     = goalRef.current?.value     ?? 'defend'
      const tone     = toneRef.current?.value     ?? 'academic'
      const params: OutlineParams = { topic, count, audience, goal, tone }

      try {
        const res = await fetch('/api/generate-outline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic, count, audience, goal, tone }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json() as { outline: OutlineCard[] }
        setOutline(data.outline)
        setOutlineParams(params)
        setPage('outline')
      } catch {
        // Outline failed — fall through to direct generation without outline
        await generateFromOutline(params, undefined)
      }
    } finally {
      setOutlineLoading(false)
    }
  }

  /* ── Stage 2: generate full deck (optionally from outline) ─ */
  async function generateFromOutline(params: OutlineParams, outlineCards?: OutlineCard[]) {
    const { topic, count, audience, goal, tone } = params

    setGenerating(true)
    setGenProgress(0)
    setGenStatus(GEN_MSGS[0])

    let step = 0
    genTimer.current = setInterval(() => {
      step++
      if (step < GEN_MSGS.length) {
        setGenStatus(GEN_MSGS[step])
        setGenProgress((step + 1) / GEN_MSGS.length * 80)
      }
    }, 800)

    try {
      // Tell the deck model about attached uploads (caption + kind) so it
      // plans slides that can host them — figure slides for diagrams, etc.
      const attachedImages = uploadsRef.current
        .map(u => uploadCaptionsRef.current[u])
        .filter((x): x is { caption: string; kind: 'photo' | 'figure' } => !!x)

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic, count, theme: selectedTheme, audience, goal, tone, outline: outlineCards,
          ...(attachedImages.length ? { attachedImages } : {}),
        }),
      })

      clearInterval(genTimer.current!)

      if (res.status === 402) {
        const errData = await res.json().catch(() => ({})) as { error?: string }
        setGenerating(false)
        setGenProgress(0)
        setCredits(0)
        showToast(errData.error ?? 'No credits remaining')
        return
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json() as { slides: SlideData[]; creditsRemaining?: number }
      setGenProgress(100)
      setGenStatus('Done!')

      if (typeof data.creditsRemaining === 'number') {
        setCredits(data.creditsRemaining)
      } else {
        setCredits(c => Math.max(0, c - 1))
      }

      // No stock filler — keep only real image URLs the model may have emitted
      // (normally none). Empty img → clean text layout until an upload or AI
      // image lands. Placeholder/stock URLs are dropped.
      const slides = (data.slides ?? [])
        .map((s: SlideData) => ({
          ...s,
          img: (typeof s.img === 'string' && s.img.startsWith('http') && !s.img.includes('picsum')) ? s.img : '',
        }))
        .slice(0, count)

      // Save deck immediately with placeholder images — viewable before AI images arrive.
      // Name = the title slide's title, NOT the raw topic (which for document/
      // image flows is a huge blob of typed text + extracted document text —
      // it made deck cards and export filenames unusable).
      const firstTitle = typeof slides[0]?.title === 'string' ? slides[0].title.trim() : ''
      const deckName = firstTitle || topic.split('\n')[0].slice(0, 80).trim() || 'Untitled deck'
      const deckId = 'deck_' + Date.now()
      const deck: SavedDeck = { id: deckId, name: deckName, slides, theme: selectedTheme, createdAt: Date.now() }
      persistAndSet([deck, ...savedDecks])

      // Navigate home — deck is already saved and visible in the grid
      await new Promise(r => setTimeout(r, 400))
      setGenerating(false)
      setPage('home')
      showToast(aiImages ? 'Deck created. Generating images…' : 'Deck created. Ready to edit!')

      // Image phase in background after the deck is visible: place user
      // uploads first (vision matching), then optionally fill the rest with AI.
      void runImagePhase(deckId, slides, topic)

    } catch {
      clearInterval(genTimer.current!)
      setGenProgress(100)
      setGenStatus('AI unavailable. Using outline deck')

      const slides = buildTopicFallback(topic, count)
      const deck: SavedDeck = {
        id: 'deck_' + Date.now(),
        name: topic.split('\n')[0].slice(0, 80).trim() || 'Untitled deck',
        slides,
        theme: selectedTheme,
        createdAt: Date.now(),
      }
      persistAndSet([deck, ...savedDecks])

      await new Promise(r => setTimeout(r, 1400))
      setGenerating(false)
      setPage('home')
      showToast('Deck created (outline mode, AI unavailable)')
    }
  }

  /* ── Image phase: user uploads first, AI fill second ────────── */
  async function runImagePhase(deckId: string, slides: SlideData[], deckTopic?: string) {
    let current = slides
    const uploadList = [...uploadsRef.current] // ref, not state — closures go stale
    if (uploadList.length > 0) {
      syncUploads([]) // consumed by this deck
      current = await placeUploads(deckId, current, uploadList)
    }
    if (aiImages) {
      await generateImagesForDeck(deckId, current, deckTopic)
    } else if (uploadList.length > 0) {
      setImageGenProgress(null)
      showToast('Your images are placed ✓')
    }
  }

  // Vision-match uploaded images onto slides; leftovers go to the deck tray.
  // Best-effort: any failure sends everything to the tray so deck creation
  // never blocks on matching.
  async function placeUploads(deckId: string, slides: SlideData[], uploadUrls: string[]): Promise<SlideData[]> {
    setImageGenProgress('Placing your images…')
    const finalSlides = slides.map(s => ({ ...s }))
    let tray: string[] = []
    // Durable per-URL metadata built for every upload (placed or trayed).
    const imageMeta: Record<string, ImageMeta> = {}

    try {
      // Offer the matcher ONLY slides that can actually display an image,
      // annotated with what they can host. Without this, the model picks the
      // best slide by meaning, the layout guard trays the image, and the user
      // sees "matching doesn't work" — composed layouts made most slides
      // image-less, so this was the common case, not the edge case.
      const summaries = finalSlides
        .map((s, idx) => ({ s, idx, accepts: slideAccepts(s) }))
        .filter((x): x is { s: SlideData; idx: number; accepts: 'photo' | 'both' } => x.accepts !== null)
        .map(({ s, idx, accepts }) => ({
          idx,
          title: typeof s.title === 'string' ? s.title.slice(0, 90) : '',
          summary: Array.isArray(s.bullets) ? s.bullets.join(' ').slice(0, 120)
            : typeof s.caption === 'string' ? s.caption.slice(0, 120)
            : typeof s.body === 'string' ? s.body.slice(0, 120) : '',
          type: typeof s.type === 'string' ? s.type : 'text',
          accepts,
        }))
      const res = await fetch('/api/match-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides: summaries, images: uploadUrls }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as {
        matches?: { url: string; caption?: string; kind?: 'photo' | 'figure'; slideIdx: number | null; confidence: number }[]
      }
      const matches = data.matches ?? []

      // Fold vision (caption/kind) + upload-time dimensions into metadata for
      // every upload, so trayed images carry their fit/kind too.
      for (const url of uploadUrls) {
        const m = matches.find(x => x.url === url)
        const dims = uploadDimsRef.current[url]
        imageMeta[url] = {
          ...(m?.caption ? { caption: m.caption } : {}),
          kind: m?.kind === 'figure' ? 'figure' : 'photo',
          ...(dims ? { w: dims.w, h: dims.h } : {}),
        }
      }

      // Floor: an upload only lands on a slide when vision is reasonably
      // confident it matches. 0.8 proved too strict in practice (Haiku's
      // honest confidences sit around 0.6-0.75, so almost everything went to
      // the tray); the figure/layout guards below now catch the bad
      // placements the stricter floor was protecting against.
      const CONFIDENCE_MIN = 0.7
      for (const m of matches) {
        const slide = m.slideIdx !== null && m.confidence >= CONFIDENCE_MIN ? finalSlides[m.slideIdx] : null
        if (!slide) { tray.push(m.url); continue }
        // Re-check eligibility at placement time (capacity shrinks as earlier
        // matches land): the slide must still accept this image's kind.
        const accepts = slideAccepts(slide)
        const kind = imageMeta[m.url]?.kind ?? 'photo'
        if (accepts === null || (kind === 'figure' && accepts !== 'both')) { tray.push(m.url); continue }
        slide.imgMeta = { ...(slide.imgMeta ?? {}), [m.url]: imageMeta[m.url] }
        if (!isUploadUrl(slide.img)) {
          // Uploads always win the primary slot (over stock/placeholder).
          slide.img = m.url
        } else {
          slide.extraImgs = [...(slide.extraImgs ?? []), m.url]
        }
      }
      // Any upload the model didn't return a row for still belongs to the user.
      const seen = new Set(matches.map(m => m.url))
      tray.push(...uploadUrls.filter(u => !seen.has(u)))
    } catch {
      tray = [...uploadUrls]
    }

    setSavedDecks(prev => {
      const updated = prev.map(d => d.id === deckId
        ? { ...d, slides: finalSlides.map(s => ({ ...s })), tray, imageMeta: { ...(d.imageMeta ?? {}), ...imageMeta } }
        : d)
      try { localStorage.setItem('deckify_decks', JSON.stringify(updated)) } catch { /* ignore */ }
      return updated
    })
    return finalSlides
  }

  /* ── Image generation (runs after deck is saved and visible) ─ */
  async function generateImagesForDeck(deckId: string, slides: SlideData[], deckTopic?: string) {
    // Sequential, one at a time — Replicate free tier: 6 req/min, burst 1
    const INTER_REQUEST_DELAY_MS = 2_000

    // Only generate images for slide types that benefit visually. quote /
    // findings and the composed layouts (comparison / iconstat / timeline)
    // carry their own structure as the visual, so they get no AI image.
    // "figure" slides are explicitly about an image, so they stay eligible.
    const SKIP_TYPES = new Set(['quote', 'findings', 'comparison', 'iconstat', 'timeline'])

    // Match the region each image will fill: stat is a full-bleed 16:9
    // background; figure sits in a near-square landscape frame; every other
    // layout puts the image in a portrait side panel.
    const aspectFor = (t: string) => (t === 'stat' ? '16:9' : t === 'figure' ? '4:3' : '3:4')

    // Need-driven fill: AI images complement the user's uploads instead of
    // competing with them. A slide gets an AI image only when
    //  (a) it can display one and holds no user upload (primary or extras), AND
    //  (b) the generation model marked it img_need:"high" (a picture materially
    //      helps demonstrate the content), or it's the title slide (cover).
    // The old half-the-deck ratio survives only as a spend ceiling.
    const IMAGE_RATIO = 0.5
    const uploadCovered = slides.filter(s =>
      isUploadUrl(s.img) || (s.extraImgs ?? []).some(isUploadUrl)).length
    const cap = Math.max(0, Math.max(2, Math.ceil(slides.length * IMAGE_RATIO)) - uploadCovered)
    if (cap === 0) { setImageGenProgress(null); if (uploadCovered) showToast('Your images are placed ✓'); return }

    const allEligible = slides
      .map((slide, idx) => ({ slide, idx }))
      .filter(({ slide }) =>
        !SKIP_TYPES.has(typeof slide.type === 'string' ? slide.type : '')
        && !isUploadUrl(slide.img)
        && !(slide.extraImgs ?? []).some(isUploadUrl)
        && (slide.img_need === 'high' || slide.type === 'title'))

    // Title (cover) first, then high-need slides in deck order, up to the cap.
    const rank = (s: SlideData) => (s.type === 'title' ? 0 : 1)
    const eligible = [...allEligible]
      .sort((a, b) => rank(a.slide) - rank(b.slide) || a.idx - b.idx)
      .slice(0, cap)
      .sort((a, b) => a.idx - b.idx)

    const total = eligible.length
    if (total === 0) { setImageGenProgress(null); return }

    setImageGenProgress(`Generating images… 0 / ${total}`)

    // Work on a mutable copy; we update state after each image completes
    const finalSlides = slides.map(s => ({ ...s }))

    for (let i = 0; i < eligible.length; i++) {
      const { slide, idx } = eligible[i]
      try {
        const prompt = buildImagePrompt(slide as Record<string, unknown>, deckTopic)
        const res = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            provider: imageProvider,
            aspectRatio: aspectFor(typeof slide.type === 'string' ? slide.type : 'text'),
          }),
        })
        if (res.ok) {
          const imgData = await res.json() as { url?: string }
          if (typeof imgData.url === 'string' && imgData.url) {
            finalSlides[idx] = { ...finalSlides[idx], img: imgData.url }
          }
        } else {
          console.warn(`Image generation failed for slide ${idx}: HTTP ${res.status}`)
        }
      } catch (err) { console.warn(`Image generation failed for slide ${idx}:`, err) }

      setImageGenProgress(`Generating images… ${i + 1} / ${total}`)

      // Persist each image as it arrives so the deck card thumbnail updates live
      setSavedDecks(prev => {
        const snapshot = finalSlides.map(s => ({ ...s }))
        const updated = prev.map(d => d.id === deckId ? { ...d, slides: snapshot } : d)
        try { localStorage.setItem('deckify_decks', JSON.stringify(updated)) } catch { /* ignore */ }
        return updated
      })

      // Brief pause between requests — backoff in replicate.ts handles 429s if they still occur
      if (i < eligible.length - 1) {
        await new Promise(r => setTimeout(r, INTER_REQUEST_DELAY_MS))
      }
    }

    setImageGenProgress(null)
    showToast('Images complete ✓')
  }

  function quickGenerate() {
    startOutline()
  }

  async function handleUpgrade() {
    if (upgrading) return
    setUpgrading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Checkout failed')
      window.location.href = data.url
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Checkout failed. Try again')
      setUpgrading(false)
    }
  }

  function startFromType(type: string) {
    const cfg = EXAMPLE_TOPICS[type]
    if (!cfg) return
    setPage('create')
    setTimeout(() => {
      if (topicRef.current) {
        topicRef.current.value = cfg.topic
        topicRef.current.style.height = 'auto'
        topicRef.current.style.height = topicRef.current.scrollHeight + 'px'
      }
      if (audienceRef.current) audienceRef.current.value = cfg.audience
      if (goalRef.current)     goalRef.current.value     = cfg.goal
      if (toneRef.current)     toneRef.current.value     = cfg.tone
    }, 50)
  }

  /* ─────────────────────────────────────────────────────────── */
  /* ── RENDER ─────────────────────────────────────────────────── */

  // Show editor fullscreen when open
  if (editorOpen && editingDeck) {
    return (
      <>
        {toastMsg && <div className="toast" style={{ zIndex: 9999 }}>{toastMsg}</div>}
        <EditorOverlay deck={editingDeck} onClose={closeEditor} showToast={showToast} />
      </>
    )
  }

  return (
    <>
      {/* ── Toast ─────────────────────────────────────────── */}
      {toastMsg && (
        <div className="toast" style={{ zIndex: 9999 }}>
          {toastMsg}
        </div>
      )}

      {/* ── Generating overlay ────────────────────────────── */}
      {generating && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--white)', borderRadius: 20, padding: '40px 48px',
            maxWidth: 440, width: '90%', textAlign: 'center',
            boxShadow: '0 24px 80px rgba(0,0,0,.18)',
          }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>✨</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--black)', marginBottom: 8 }}>
              Creating your presentation
            </div>
            <div style={{ fontSize: 13, color: 'var(--grey)', marginBottom: 24, minHeight: 20 }}>
              {genStatus}
            </div>
            <div style={{
              height: 6, background: 'var(--border)', borderRadius: 99,
              overflow: 'hidden', marginBottom: 20,
            }}>
              <div style={{
                height: '100%', background: 'var(--accent)',
                borderRadius: 99, transition: 'width .6s ease',
                width: `${genProgress}%`,
              }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--grey2)' }}>
              Powered by Claude AI
            </div>
          </div>
        </div>
      )}

      {/* ── Shell ─────────────────────────────────────────── */}
      <div className="shell app-shell-locked">

        {/* ── Sidebar ─────────────────────────────────────── */}
        <div className="sidebar">
          <div className="sidebar-logo">
            Deckify <span>STUDENT</span>
          </div>
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {userInitials(user?.email)}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">
                {user?.email?.split('@')[0] ?? 'Guest'}
              </div>
              <div className="sidebar-user-plan">
                Free · {credits} {credits === 1 ? 'credit' : 'credits'} left
              </div>
            </div>
          </div>

          <div className="sidebar-nav">
            <div
              className={`nav-item${page === 'home' ? ' active' : ''}`}
              onClick={() => setPage('home')}
            >
              <span className="ni">🏠</span> My presentations
            </div>
            <div
              className={`nav-item${page === 'create' ? ' active' : ''}`}
              onClick={() => setPage('create')}
            >
              <span className="ni">✨</span> New presentation
            </div>
            <div
              className={`nav-item${page === 'media' ? ' active' : ''}`}
              onClick={() => setPage('media')}
            >
              <span className="ni">🎨</span> AI images
              {mediaPending > 0 && (
                <span style={{ marginLeft: 'auto', fontSize: 11, background: 'var(--accent)', color: '#fff', borderRadius: 10, padding: '1px 8px' }}>
                  ⟳ {mediaPending}
                </span>
              )}
            </div>

            <div className="nav-section-label">Account</div>
            <div className="nav-item" onClick={async () => { const { createClient } = await import('@/lib/supabase/client'); await createClient().auth.signOut(); window.location.href = '/login'; }}>
              <span className="ni">⏻</span> Log out
            </div>
          </div>

          <div className="sidebar-bottom">
            <button
              className="upgrade-btn"
              onClick={handleUpgrade}
              disabled={upgrading}
              style={{ opacity: upgrading ? 0.7 : undefined, cursor: upgrading ? 'wait' : undefined }}
            >
              {upgrading ? 'Redirecting…' : '⚡ Upgrade · ฿199/mo'}
            </button>
            <div style={{ fontSize: 11, color: credits === 0 ? 'var(--accent)' : 'var(--grey)', marginTop: 4 }}>
              {credits === 0 ? 'No credits remaining' : `${credits} free ${credits === 1 ? 'generation' : 'generations'} remaining`}
            </div>
          </div>
        </div>

        {/* ── Main ──────────────────────────────────────────── */}
        <div className="main">
          <div className="main-topbar">
            <div className="main-topbar-title">
              {page === 'home' ? 'My presentations' : page === 'outline' ? 'Review outline' : page === 'theme' ? 'Choose theme' : 'New presentation'}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {page === 'home' && (
                <button className="btn btn-primary btn-sm" onClick={() => setPage('create')}>
                  ✨ New presentation
                </button>
              )}
            </div>
          </div>

          {imageGenProgress && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--accent-light, #f0f4ff)',
              borderBottom: '1px solid var(--border)',
              padding: '8px 24px', fontSize: 13, color: 'var(--accent)',
              fontFamily: "'DM Sans',sans-serif", fontWeight: 500,
            }}>
              <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', fontSize: 15 }}>⟳</span>
              {imageGenProgress}
            </div>
          )}

          <div className="main-content">
            {page === 'home'    && <HomePage   decks={savedDecks} onNew={() => setPage('create')} onDelete={deleteDeck} onOpen={openEditor} onRename={renameDeck} onDuplicate={duplicateDeck} onStartFromType={startFromType} />}
            {page === 'create'  && <CreatePage topicRef={topicRef} audienceRef={audienceRef} goalRef={goalRef} toneRef={toneRef} countRef={countRef} onGenerate={quickGenerate} onStartFromType={startFromType} showToast={showToast} outlineLoading={outlineLoading} pdfFile={pdfFile} onPdfChange={setPdfFile} uploads={uploads} uploadingCount={uploadingCount} onAddFiles={addFiles} onRemoveUpload={removeUpload} />}
            {page === 'outline' && outlineParams && (
              <OutlinePage
                outline={outline}
                params={outlineParams}
                onBack={() => setPage('create')}
                onContinue={() => setPage('theme')}
                onOutlineChange={setOutline}
              />
            )}
            {page === 'theme' && outlineParams && (
              <ThemePage
                params={outlineParams}
                outline={outline}
                selectedTheme={selectedTheme}
                onThemeChange={setSelectedTheme}
                onBack={() => setPage('outline')}
                onGenerate={() => generateFromOutline(outlineParams, outline)}
                aiImages={aiImages}
                onAiImagesChange={setAiImages}
                imageProvider={imageProvider}
                onImageProviderChange={setImageProvider}
              />
            )}
            {page === 'media' && (
              <MediaPage
                items={mediaItems}
                pending={mediaPending}
                styles={MEDIA_STYLES}
                onGenerate={generateMediaImages}
                onDelete={deleteMediaItem}
                showToast={showToast}
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}

/* ══════════════════════════════════════════════════════════════
   HOME PAGE
══════════════════════════════════════════════════════════════ */
function HomePage({
  decks, onNew, onDelete, onOpen, onRename, onDuplicate, onStartFromType,
}: {
  decks: SavedDeck[]
  onNew: () => void
  onDelete: (id: string) => void
  onOpen: (deck: SavedDeck) => void
  onRename: (id: string, newName: string) => void
  onDuplicate: (id: string) => void
  onStartFromType: (type: string) => void
}) {
  const hasDecks = decks.length > 0

  return (
    <div className="page active" id="page-home">
      {!hasDecks ? (
        /* ── Welcome (first run) ─────────────────────────── */
        <div id="welcomeSection" style={{ marginBottom: 32 }}>
          <div style={{
            background: 'linear-gradient(135deg,var(--accent-light) 0%,#f0f4ff 100%)',
            border: '1.5px solid #dbe4ff', borderRadius: 16, padding: '28px 32px',
            marginBottom: 24, display: 'flex', alignItems: 'center', gap: 32,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '.6px',
                textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8,
              }}>
                Welcome to Deckify ✦
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--black)', margin: '0 0 10px', lineHeight: 1.3 }}>
                Type your topic. AI builds the whole deck.
              </h2>
              <p style={{ fontSize: 13, color: 'var(--grey)', margin: '0 0 20px', lineHeight: 1.65 }}>
                Deckify reads your topic or thesis abstract, writes the slide content,
                applies a professional theme, and hands you an editable deck in under 30 seconds.
              </p>
              <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                {[
                  'Type your topic or paste notes',
                  'AI writes all the slides',
                  'Edit, present, or export',
                ].map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--grey)' }}>
                    <span style={{
                      width: 24, height: 24, background: 'var(--accent)', color: '#fff',
                      borderRadius: '50%', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0,
                    }}>{i + 1}</span>
                    {step}
                  </div>
                ))}
              </div>
              <button
                onClick={onNew}
                style={{
                  background: 'var(--accent)', color: '#fff', border: 'none',
                  borderRadius: 10, padding: '11px 24px', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                }}
              >
                ✨ Create your first presentation →
              </button>
            </div>
          </div>

          {/* Quick-start cards */}
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--grey)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.5px' }}>
            Or start from a template
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 10, marginBottom: 24 }}>
            {SUGGEST_TYPES.map(s => (
              <div
                key={s.type}
                className="suggest-card"
                style={{ textAlign: 'center', padding: '18px 12px', cursor: 'pointer' }}
                onClick={() => onStartFromType(s.type)}
              >
                <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                <div className="suggest-card-title">{s.title}</div>
                <div className="suggest-card-sub">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ── Returning user ──────────────────────────────── */
        <>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 10, marginBottom: 20,
          }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--black)', margin: '0 0 2px' }}>
                My presentations
              </h2>
              <p style={{ fontSize: 12, color: 'var(--grey)', margin: 0 }}>
                {decks.length} deck{decks.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={onNew}
              style={{
                background: 'var(--accent)', color: '#fff', border: 'none',
                borderRadius: 9, padding: '8px 18px', fontSize: 12, fontWeight: 700,
                cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              ✨ New presentation
            </button>
          </div>
        </>
      )}

      {/* ── Deck grid ────────────────────────────────────── */}
      {hasDecks && (
        <DeckGrid decks={decks} onDelete={onDelete} onOpen={onOpen} onRename={onRename} onDuplicate={onDuplicate} />
      )}
    </div>
  )
}

/* ── Deck grid ─────────────────────────────────────────────── */
/* ─── AI images portal ──────────────────────────────────────────
   Generate images from a prompt OUTSIDE the editor. Generation keeps running
   while the user does other things; results collect in a library that the
   editor's 📥 tab exposes for drag-onto-slide reuse in any deck. */
function MediaPage({ items, pending, styles, onGenerate, onDelete, showToast }: {
  items: MediaItem[]
  pending: number
  styles: Record<string, { label: string; suffix: string }>
  onGenerate: (prompt: string, style: string, aspect: string, count: number) => void
  onDelete: (url: string) => void
  showToast: (msg: string) => void
}) {
  const promptRef = useRef<HTMLTextAreaElement>(null)
  const [style, setStyle] = useState('illustration')
  const [aspect, setAspect] = useState('16:9')
  const [count, setCount] = useState(2)

  function go() {
    const prompt = promptRef.current?.value.trim() ?? ''
    if (prompt.length < 5) { showToast('Describe the image you want first'); promptRef.current?.focus(); return }
    onGenerate(prompt, style, aspect, count)
    showToast(`Generating ${count} image${count > 1 ? 's' : ''}. Feel free to keep working`)
  }

  const chip = (active: boolean): React.CSSProperties => ({
    padding: '7px 14px', borderRadius: 18, fontSize: 13, cursor: 'pointer', userSelect: 'none',
    border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
    background: active ? 'var(--accent-light, #f0f4ff)' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--grey)', fontWeight: active ? 700 : 500,
  })

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>AI images</h1>
      <p style={{ color: 'var(--grey)', fontSize: 14, marginBottom: 22 }}>
        Create images with AI, without waiting inside a deck. Everything you generate lands in this
        library and shows up in the editor&apos;s 📥 tab. Drag it onto any slide.
      </p>

      {/* Generator card */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 20, marginBottom: 30, background: 'var(--card, #fff)' }}>
        <textarea
          ref={promptRef}
          placeholder="Describe your image, e.g. a rooftop solar installation team at work on a Bangkok townhouse"
          rows={3}
          style={{ width: '100%', resize: 'vertical', border: '1.5px solid var(--border)', borderRadius: 10, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }}
          onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') go() }}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 14 }}>
          {Object.entries(styles).map(([key, s]) => (
            <span key={key} style={chip(style === key)} onClick={() => setStyle(key)}>{s.label}</span>
          ))}
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--grey)' }}>
            Aspect
            <select value={aspect} onChange={e => setAspect(e.target.value)} style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }}>
              <option value="16:9">16:9 wide</option>
              <option value="4:3">4:3 figure</option>
              <option value="3:4">3:4 panel</option>
              <option value="1:1">1:1 square</option>
            </select>
            Images
            <select value={count} onChange={e => setCount(parseInt(e.target.value, 10))} style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }}>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </span>
        </div>
        <button className="btn btn-primary" style={{ width: '100%', marginTop: 14 }} onClick={go}>
          ✨ Generate {pending > 0 ? `(⟳ ${pending} in progress)` : ''}
        </button>
      </div>

      {/* Library grid */}
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
        Your library {items.length ? `(${items.length})` : ''}
      </h2>
      {items.length === 0 && pending === 0 && (
        <p style={{ color: 'var(--grey)', fontSize: 14 }}>Nothing yet. Describe an image above and generate.</p>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 14 }}>
        {pending > 0 && Array.from({ length: pending }, (_, i) => (
          <div key={'pending' + i} style={{ aspectRatio: '16/10', borderRadius: 12, border: '1.5px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--grey)', fontSize: 13 }}>
            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: 8 }}>⟳</span> generating…
          </div>
        ))}
        {items.map(m => (
          <div key={m.url} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }} className="media-card">
            <img src={m.url} alt={m.prompt} title={m.prompt} style={{ width: '100%', aspectRatio: '16/10', objectFit: 'cover', display: 'block' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', fontSize: 12, color: 'var(--grey)' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{m.prompt}</span>
              <span
                title="Remove from library"
                style={{ cursor: 'pointer', opacity: 0.7 }}
                onClick={() => onDelete(m.url)}
              >🗑</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DeckGrid({ decks, onDelete, onOpen, onRename, onDuplicate }: { decks: SavedDeck[]; onDelete: (id: string) => void; onOpen: (d: SavedDeck) => void; onRename: (id: string, newName: string) => void; onDuplicate: (id: string) => void }) {
  return (
    <div className="deck-grid" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))',
      gap: 18,
    }}>
      {decks.map(deck => (
        <DeckCard key={deck.id} deck={deck} onDelete={onDelete} onOpen={onOpen} onRename={onRename} onDuplicate={onDuplicate} />
      ))}
    </div>
  )
}

function DeckCard({ deck, onDelete, onOpen, onRename, onDuplicate }: { deck: SavedDeck; onDelete: (id: string) => void; onOpen: (d: SavedDeck) => void; onRename: (id: string, newName: string) => void; onDuplicate: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(deck.name)
  const menuRef = useRef<HTMLDivElement>(null)
  const thumb = deck.slides[0]?.img || picUrl(0)
  const accent = TACCS[deck.theme] || '#2a5cff'
  const bg     = TBGS[deck.theme]  || '#ffffff'

  useEffect(() => {
    if (!menuOpen) return
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [menuOpen])

  return (
    <div
      className="deck-card"
      style={{ position: 'relative', zIndex: menuOpen ? 100 : undefined }}
    >
      {/* Thumbnail */}
      <div
        onClick={() => onOpen(deck)}
        style={{
          aspectRatio: '16/10', borderRadius: '10px 10px 0 0', overflow: 'hidden',
          background: bg, position: 'relative', cursor: 'pointer',
        }}
      >
        <img
          src={thumb}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        {/* Theme accent stripe */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: accent,
        }} />
        {/* Hover overlay */}
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,.0)',
          transition: 'background .18s', display: 'flex', alignItems: 'center',
          justifyContent: 'center', opacity: 0,
        }}
          className="deck-card-hover"
        >
          <span style={{
            background: 'rgba(0,0,0,.7)', color: '#fff', borderRadius: 8,
            padding: '8px 18px', fontSize: 13, fontWeight: 600,
          }}>Open editor</span>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px 14px' }}>
        {renaming ? (
          <input
            autoFocus
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            onBlur={() => { onRename(deck.id, renameValue); setRenaming(false) }}
            onKeyDown={e => {
              if (e.key === 'Enter') { onRename(deck.id, renameValue); setRenaming(false) }
              if (e.key === 'Escape') { setRenameValue(deck.name); setRenaming(false) }
            }}
            onClick={e => e.stopPropagation()}
            style={{
              fontSize: 13, fontWeight: 600, width: '100%', marginBottom: 4,
              border: '1px solid var(--accent)', borderRadius: 5,
              padding: '2px 6px', fontFamily: "'DM Sans',sans-serif",
              color: 'var(--black)', outline: 'none', background: 'var(--white)',
            }}
          />
        ) : (
          <div style={{
            fontSize: 13, fontWeight: 600, color: 'var(--black)',
            marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {deck.name}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 11, color: 'var(--grey)' }}>
            {deck.slides.length} slides · {deck.theme} · {relativeTime(deck.createdAt)}
          </div>
          {/* Kebab menu */}
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button
              onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--grey)', padding: '2px 6px', borderRadius: 5,
                fontSize: 16, lineHeight: 1,
              }}
              title="Options"
            >
              ⋯
            </button>
            {menuOpen && (
              <div style={{
                position: 'absolute', right: 0, top: '100%', background: 'var(--white)',
                border: '1px solid var(--border)', borderRadius: 10, minWidth: 150,
                boxShadow: '0 8px 24px rgba(0,0,0,.1)', zIndex: 50,
              }}>
                <button
                  onClick={() => { setMenuOpen(false); onOpen(deck) }}
                  style={menuItemStyle}
                >
                  ✏️ Open editor
                </button>
                <button
                  onClick={() => { setMenuOpen(false); setRenameValue(deck.name); setRenaming(true) }}
                  style={menuItemStyle}
                >
                  ✏ Rename
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onDuplicate(deck.id) }}
                  style={menuItemStyle}
                >
                  ⧉ Duplicate
                </button>
                <button
                  onClick={() => { setMenuOpen(false); exportPdf(deck.slides, deck.theme, deck.name) }}
                  style={menuItemStyle}
                >
                  ⬇ Download PDF
                </button>
                <button
                  onClick={() => { setMenuOpen(false); exportPptx(deck.slides, deck.theme, deck.name) }}
                  style={menuItemStyle}
                >
                  ⬇ Download PPTX
                </button>
                <div style={{ height: 1, background: 'var(--border)', margin: '0 12px' }} />
                <button
                  onClick={() => { setMenuOpen(false); onDelete(deck.id) }}
                  style={{ ...menuItemStyle, color: '#c0392b' }}
                >
                  🗑 Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const menuItemStyle: React.CSSProperties = {
  display: 'block', width: '100%', textAlign: 'left',
  background: 'none', border: 'none', cursor: 'pointer',
  padding: '10px 16px', fontSize: 13, color: 'var(--black)',
  fontFamily: "'DM Sans',sans-serif", transition: 'background .12s',
}

/* ══════════════════════════════════════════════════════════════
   CREATE PAGE
══════════════════════════════════════════════════════════════ */
function CreatePage({
  topicRef, audienceRef, goalRef, toneRef, countRef,
  onGenerate, onStartFromType, showToast, outlineLoading, pdfFile, onPdfChange,
  uploads, uploadingCount, onAddFiles, onRemoveUpload,
}: {
  topicRef:    React.RefObject<HTMLTextAreaElement>
  audienceRef: React.RefObject<HTMLSelectElement>
  goalRef:     React.RefObject<HTMLSelectElement>
  toneRef:     React.RefObject<HTMLSelectElement>
  countRef:    React.RefObject<HTMLSelectElement>
  onGenerate:  () => void
  onStartFromType: (type: string) => void
  showToast: (msg: string) => void
  outlineLoading: boolean
  pdfFile: File | null
  onPdfChange: (f: File | null) => void
  uploads: string[]
  uploadingCount: number
  onAddFiles: (files: File[]) => void
  onRemoveUpload: (url: string) => void
}) {
  const [focused,     setFocused]     = useState(false)
  const [helpOpen,    setHelpOpen]    = useState(false)
  const [helpTopic,   setHelpTopic]   = useState('')
  const [helpFor,     setHelpFor]     = useState('')
  const [helpLoading, setHelpLoading] = useState(false)
  const [helpError,   setHelpError]   = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [dragOver, setDragOver] = useState(false)

  function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = '' // reset so the same file can be re-selected after removal
    if (files.length) onAddFiles(files)
  }

  function removePdf() {
    onPdfChange(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function submitHelp() {
    const trimmed = helpTopic.trim()
    if (!trimmed) { setHelpError('Please enter a topic first.'); return }

    // If the user already wrote a detailed description, skip the AI call and use it directly
    if (trimmed.length > 200) {
      dropIntoTextarea(trimmed)
      return
    }

    setHelpError('')
    setHelpLoading(true)
    try {
      const res = await fetch('/api/expand-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic:    trimmed,
          context:  helpFor.trim(),
          audience: audienceRef.current?.value ?? 'general',
          goal:     goalRef.current?.value     ?? 'explain',
          tone:     toneRef.current?.value     ?? 'professional',
        }),
      })
      const data = await res.json() as { expanded?: string; error?: string }
      if (!res.ok || !data.expanded) {
        setHelpError(data.error ?? 'Something went wrong. Try again.')
        return
      }
      dropIntoTextarea(data.expanded)
    } catch {
      setHelpError('Network error. Check your connection.')
    } finally {
      setHelpLoading(false)
    }
  }

  function dropIntoTextarea(text: string) {
    const ta = topicRef.current
    if (!ta) return
    ta.value = text
    ta.style.height = 'auto'
    ta.style.height = ta.scrollHeight + 'px'
    ta.focus()
    ta.setSelectionRange(text.length, text.length)
    setHelpOpen(false)
    setHelpTopic('')
    setHelpFor('')
    setHelpError('')
  }

  return (
    <div className="page active" id="page-create">
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 0 40px' }}>

        {/* ── Prompt box (also the file drop zone) ─────── */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault()
            setDragOver(false)
            const files = Array.from(e.dataTransfer.files ?? [])
            if (files.length) onAddFiles(files)
          }}
          style={{
            background: dragOver ? 'var(--accent-light, #f0f4ff)' : 'var(--white)',
            border: `2px ${dragOver ? 'dashed var(--accent)' : `solid ${focused ? 'var(--accent)' : 'var(--border)'}`}`,
            borderRadius: 16, overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,.06)',
            marginBottom: 24, transition: 'border-color .2s, background .2s',
          }}
        >
          {/* Topic textarea */}
          <div style={{ padding: '20px 22px 0', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--grey)', letterSpacing: '.3px', textTransform: 'uppercase' }}>
                Your topic
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => { setHelpOpen(true); setHelpError('') }}
                  style={{
                    fontSize: 11, fontWeight: 700, color: 'var(--accent)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: 0, fontFamily: "'DM Sans',sans-serif",
                  }}
                >
                  ✨ Help me write this
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    fontSize: 11, fontWeight: 600, color: (pdfFile || uploads.length) ? 'var(--accent)' : 'var(--grey)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: 0, fontFamily: "'DM Sans',sans-serif",
                  }}
                  title="PDF, Word, or PowerPoint feed the outline; JPEG/PNG images go onto your slides"
                >
                  📎 Add files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.pptx,.jpg,.jpeg,.png"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleFilesChange}
                />
              </div>
            </div>
            <textarea
              ref={topicRef}
              placeholder="Describe your presentation… e.g. My thesis on sustainable agriculture in northern Thailand, or a seminar on machine learning basics, or research findings on urban air quality"
              rows={4}
              style={{
                width: '100%', border: 'none', outline: 'none',
                fontFamily: "'DM Sans',sans-serif", fontSize: 15, resize: 'none',
                color: 'var(--black)', lineHeight: 1.6, background: 'transparent',
              }}
              onInput={e => {
                const t = e.currentTarget
                t.style.height = 'auto'
                t.style.height = t.scrollHeight + 'px'
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !outlineLoading) onGenerate()
              }}
            />
          </div>

          {/* ── PDF badge ─────────────────────────────── */}
          {pdfFile && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              margin: '8px 22px 4px', padding: '6px 12px',
              background: 'var(--accent-light, #f0f4ff)',
              border: '1px solid #dbe4ff', borderRadius: 8,
              fontSize: 12, color: 'var(--accent)',
            }}>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                📄 {pdfFile.name}
              </span>
              <button
                onClick={removePdf}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--grey)', fontSize: 14, padding: '0 2px',
                  lineHeight: 1, flexShrink: 0, fontFamily: "'DM Sans',sans-serif",
                }}
                title="Remove document"
              >
                ✕
              </button>
            </div>
          )}

          {/* ── Uploaded images row ───────────────────── */}
          {(uploads.length > 0 || uploadingCount > 0) && (
            <div style={{ margin: '8px 22px 4px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: 6, fontFamily: "'DM Sans',sans-serif" }}>
                Your images: placed on matching slides after generation
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {uploads.map(url => (
                  <div key={url} style={{ position: 'relative', width: 56, height: 56, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <button
                      onClick={() => onRemoveUpload(url)}
                      title="Remove image"
                      style={{
                        position: 'absolute', top: 2, right: 2, width: 18, height: 18,
                        borderRadius: '50%', border: 'none', cursor: 'pointer',
                        background: 'rgba(0,0,0,.55)', color: '#fff', fontSize: 11,
                        lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {uploadingCount > 0 && (
                  <div style={{
                    width: 56, height: 56, borderRadius: 8, border: '1px dashed var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: 'var(--grey)', fontFamily: "'DM Sans',sans-serif", flexShrink: 0,
                  }}>
                    …
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Intake row ────────────────────────────── */}
          <div style={{
            display: 'flex', gap: 8, padding: '10px 14px',
            borderTop: '1px solid var(--border)', background: '#fafaf8',
            flexWrap: 'wrap', alignItems: 'center',
          }}>
            <select
              ref={audienceRef}
              defaultValue="committee"
              style={intakeSelectStyle}
              title="Who is this for?"
            >
              <option value="committee">👨‍🏫 Thesis committee</option>
              <option value="class">🎓 Class / seminar</option>
              <option value="professor">📝 Professor review</option>
              <option value="group">👥 Group presentation</option>
              <option value="conference">🏛 Academic conference</option>
              <option value="general">📢 General audience</option>
            </select>
            <select ref={goalRef} defaultValue="defend" style={intakeSelectStyle} title="Goal">
              <option value="defend">🎓 Defend thesis</option>
              <option value="findings">🔬 Present findings</option>
              <option value="explain">💡 Explain a concept</option>
              <option value="summarize">📋 Summarize research</option>
              <option value="propose">✍️ Propose a project</option>
              <option value="teach">🧑‍🏫 Teach / educate</option>
            </select>
            <select ref={toneRef} defaultValue="academic" style={intakeSelectStyle} title="Tone">
              <option value="academic">📖 Academic / formal</option>
              <option value="professional">🧑‍💼 Professional</option>
              <option value="conversational">💬 Conversational</option>
              <option value="thai_formal">🇹🇭 ภาษาวิชาการ (Thai)</option>
              <option value="thai_casual">🇹🇭 ภาษาทั่วไป (Thai)</option>
            </select>
          </div>

          {/* ── Bottom bar ────────────────────────────── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 14px', borderTop: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <select ref={countRef} defaultValue="8" style={intakeSelectStyle}>
                <option value="5">5 slides</option>
                <option value="8">8 slides</option>
                <option value="10">10 slides</option>
                <option value="12">12 slides</option>
                <option value="15">15 slides</option>
              </select>
            </div>
            <button
              onClick={outlineLoading ? undefined : onGenerate}
              disabled={outlineLoading}
              style={{
                background: outlineLoading ? 'var(--border)' : 'var(--accent)',
                color: outlineLoading ? 'var(--grey)' : '#fff',
                border: 'none', borderRadius: 10, padding: '10px 24px',
                fontSize: 14, fontWeight: 700,
                cursor: outlineLoading ? 'not-allowed' : 'pointer',
                fontFamily: "'DM Sans',sans-serif",
                display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: outlineLoading ? 'none' : '0 2px 12px rgba(42,92,255,.3)',
                transition: 'all .15s',
              }}
            >
              {outlineLoading ? 'Building outline…' : (
                <>✨ Generate <span style={{ fontSize: 11, opacity: .7, fontWeight: 400 }}>⌘↵</span></>
              )}
            </button>
          </div>
        </div>

        {/* ── Quick-start templates ─────────────────────── */}
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--grey)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.5px' }}>
          Or start from a template
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10 }}>
          {SUGGEST_TYPES.map(s => (
            <div
              key={s.type}
              className="suggest-card"
              style={{ textAlign: 'center', padding: '16px 12px', cursor: 'pointer' }}
              onClick={() => onStartFromType(s.type)}
            >
              <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
              <div className="suggest-card-title" style={{ fontSize: 12 }}>{s.title}</div>
              <div className="suggest-card-sub" style={{ fontSize: 10 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Help me write this modal ──────────────────── */}
      {helpOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 400, padding: 20,
          }}
          onClick={e => { if (e.target === e.currentTarget) setHelpOpen(false) }}
        >
          <div style={{
            background: 'var(--white)', borderRadius: 16, padding: '32px 28px',
            width: '100%', maxWidth: 420,
            boxShadow: '0 16px 48px rgba(0,0,0,.18)',
            animation: 'fadeUp .2s ease',
          }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4, color: 'var(--black)' }}>
              ✨ Help me write this
            </h3>
            <p style={{ fontSize: 13, color: 'var(--grey)', marginBottom: 20, lineHeight: 1.55 }}>
              A few words is enough. We&apos;ll turn it into a full description using your audience, goal, and tone settings.
            </p>

            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: 6 }}>
              What&apos;s your topic?
            </label>
            <input
              type="text"
              placeholder="e.g. sustainable agriculture in Thailand"
              value={helpTopic}
              onChange={e => { setHelpTopic(e.target.value); setHelpError('') }}
              onKeyDown={e => { if (e.key === 'Enter') submitHelp() }}
              autoFocus
              style={{
                width: '100%', boxSizing: 'border-box',
                border: `1.5px solid ${helpError ? '#dc2626' : 'var(--border)'}`,
                borderRadius: 9, padding: '10px 13px', fontSize: 14,
                fontFamily: "'DM Sans',sans-serif", outline: 'none',
                marginBottom: helpError ? 6 : 16, transition: 'border-color .15s',
              }}
            />
            {helpError && (
              <p style={{ fontSize: 12, color: '#dc2626', marginBottom: 14 }}>{helpError}</p>
            )}

            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--grey)', textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: 6 }}>
              What&apos;s it for? <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. final year thesis defence, group seminar"
              value={helpFor}
              onChange={e => setHelpFor(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submitHelp() }}
              style={{
                width: '100%', boxSizing: 'border-box',
                border: '1.5px solid var(--border)',
                borderRadius: 9, padding: '10px 13px', fontSize: 14,
                fontFamily: "'DM Sans',sans-serif", outline: 'none',
                marginBottom: 22,
              }}
            />

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={submitHelp}
                disabled={helpLoading}
                style={{
                  flex: 1, background: 'var(--accent)', color: '#fff', border: 'none',
                  borderRadius: 9, padding: '11px 0', fontSize: 14, fontWeight: 700,
                  cursor: helpLoading ? 'default' : 'pointer',
                  fontFamily: "'DM Sans',sans-serif", opacity: helpLoading ? .65 : 1,
                  transition: 'opacity .15s',
                }}
              >
                {helpLoading ? 'Writing…' : 'Write it for me'}
              </button>
              <button
                onClick={() => { setHelpOpen(false); setHelpError('') }}
                style={{
                  background: 'none', border: '1.5px solid var(--border)',
                  borderRadius: 9, padding: '11px 18px', fontSize: 14,
                  cursor: 'pointer', color: 'var(--grey)',
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const intakeSelectStyle: React.CSSProperties = {
  background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 7,
  padding: '5px 10px', fontSize: 12, fontFamily: "'DM Sans',sans-serif",
  cursor: 'pointer', outline: 'none', color: 'var(--black)', flex: 1, minWidth: 110,
}

/* ══════════════════════════════════════════════════════════════
   OUTLINE PAGE
══════════════════════════════════════════════════════════════ */
function OutlinePage({
  outline, params, onBack, onContinue, onOutlineChange,
}: {
  outline: OutlineCard[]
  params: OutlineParams
  onBack: () => void
  onContinue: () => void
  onOutlineChange: (cards: OutlineCard[]) => void
}) {
  const [cards, setCards] = useState<OutlineCard[]>(outline)

  function updateCards(next: OutlineCard[]) {
    setCards(next)
    onOutlineChange(next)
  }

  function moveUp(i: number) {
    if (i === 0) return
    const next = [...cards]
    ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
    updateCards(next)
  }

  function moveDown(i: number) {
    if (i === cards.length - 1) return
    const next = [...cards]
    ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
    updateCards(next)
  }

  function deleteCard(i: number) {
    updateCards(cards.filter((_, idx) => idx !== i))
  }

  function updateTitle(i: number, title: string) {
    updateCards(cards.map((c, idx) => idx === i ? { ...c, title } : c))
  }

  function updateBullet(i: number, bi: number, text: string) {
    updateCards(cards.map((c, idx) =>
      idx === i ? { ...c, bullets: c.bullets.map((b, bIdx) => bIdx === bi ? text : b) } : c
    ))
  }

  function deleteBullet(i: number, bi: number) {
    updateCards(cards.map((c, idx) =>
      idx === i ? { ...c, bullets: c.bullets.filter((_, bIdx) => bIdx !== bi) } : c
    ))
  }

  function addBullet(i: number) {
    updateCards(cards.map((c, idx) =>
      idx === i ? { ...c, bullets: [...c.bullets, ''] } : c
    ))
  }

  function addCard() {
    updateCards([...cards, { title: 'New slide', bullets: [] }])
  }

  const canGenerate = cards.length > 0

  return (
    <div className="page active" id="page-outline">
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 0 40px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <button onClick={onBack} style={backBtnStyle}>← Back to create</button>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--black)', margin: '12px 0 4px' }}>
            Review your outline
          </h2>
          <p style={{ fontSize: 13, color: 'var(--grey)', margin: 0, lineHeight: 1.5 }}>
            {params.topic} · {cards.length} slide{cards.length !== 1 ? 's' : ''}. Edit the structure, then generate your deck
          </p>
        </div>

        {/* Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {cards.map((card, i) => (
            <div key={i} style={{
              background: 'var(--white)', border: '1.5px solid var(--border)',
              borderRadius: 12, padding: '14px 16px',
              boxShadow: '0 2px 8px rgba(0,0,0,.04)',
            }}>
              {/* Card header row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', minWidth: 22, paddingTop: 3 }}>
                  {i + 1}
                </span>
                <input
                  value={card.title}
                  onChange={e => updateTitle(i, e.target.value)}
                  style={{
                    flex: 1, border: 'none', outline: 'none', fontSize: 14,
                    fontWeight: 700, color: 'var(--black)',
                    fontFamily: "'DM Sans',sans-serif", background: 'transparent', padding: 0,
                  }}
                />
                <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                  <button onClick={() => moveUp(i)} disabled={i === 0} style={arrowBtnStyle} title="Move up">↑</button>
                  <button onClick={() => moveDown(i)} disabled={i === cards.length - 1} style={arrowBtnStyle} title="Move down">↓</button>
                  <button onClick={() => deleteCard(i)} style={deleteBtnStyle} title="Delete slide">✕</button>
                </div>
              </div>

              {/* Bullet hints */}
              <div style={{ paddingLeft: 32, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {card.bullets.map((b, bi) => (
                  <div key={bi} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: 'var(--grey2)', fontSize: 11, flexShrink: 0 }}>–</span>
                    <input
                      value={b}
                      onChange={e => updateBullet(i, bi, e.target.value)}
                      placeholder="Content hint…"
                      style={{
                        flex: 1, border: 'none', outline: 'none', fontSize: 12,
                        color: 'var(--grey)', fontFamily: "'DM Sans',sans-serif",
                        background: 'transparent', padding: '2px 0',
                        borderBottom: '1px solid transparent',
                      }}
                      onFocus={e => { e.currentTarget.style.borderBottomColor = 'var(--border)' }}
                      onBlur={e => { e.currentTarget.style.borderBottomColor = 'transparent' }}
                    />
                    <button onClick={() => deleteBullet(i, bi)} style={deleteBtnStyle} title="Remove hint">✕</button>
                  </div>
                ))}
                <button
                  onClick={() => addBullet(i)}
                  style={{
                    fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none',
                    cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
                    textAlign: 'left', padding: '3px 0', marginTop: 2,
                  }}
                >
                  + Add hint
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add slide */}
        {cards.length < 20 && (
          <button
            onClick={addCard}
            style={{
              width: '100%', padding: '12px', background: 'none',
              border: '1.5px dashed var(--border)', borderRadius: 12,
              fontSize: 13, color: 'var(--grey)', cursor: 'pointer',
              fontFamily: "'DM Sans',sans-serif", marginBottom: 24,
              display: 'block',
            }}
          >
            + Add slide
          </button>
        )}

        {/* Continue button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => canGenerate && onContinue()}
            disabled={!canGenerate}
            style={{
              background: canGenerate ? 'var(--accent)' : 'var(--border)',
              color: canGenerate ? '#fff' : 'var(--grey)',
              border: 'none', borderRadius: 10, padding: '12px 28px',
              fontSize: 14, fontWeight: 700,
              cursor: canGenerate ? 'pointer' : 'not-allowed',
              fontFamily: "'DM Sans',sans-serif",
              boxShadow: canGenerate ? '0 2px 12px rgba(42,92,255,.3)' : 'none',
              transition: 'all .15s',
            }}
          >
            Choose theme →
          </button>
        </div>
      </div>
    </div>
  )
}

const backBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 13, color: 'var(--grey)', fontFamily: "'DM Sans',sans-serif", padding: 0,
}

const arrowBtnStyle: React.CSSProperties = {
  background: 'none', border: '1px solid var(--border)', cursor: 'pointer',
  borderRadius: 5, padding: '2px 6px', fontSize: 12, color: 'var(--grey)',
}

const deleteBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  borderRadius: 5, padding: '2px 6px', fontSize: 11, color: 'var(--grey2)',
}

/* ══════════════════════════════════════════════════════════════
   THEME PAGE
══════════════════════════════════════════════════════════════ */
function ThemePage({
  params, outline, selectedTheme, onThemeChange, onBack, onGenerate,
  aiImages, onAiImagesChange, imageProvider, onImageProviderChange,
}: {
  params: OutlineParams
  outline: OutlineCard[]
  selectedTheme: ThemeKey
  onThemeChange: (t: ThemeKey) => void
  onBack: () => void
  onGenerate: () => void
  aiImages: boolean
  onAiImagesChange: (v: boolean) => void
  imageProvider: string
  onImageProviderChange: (v: string) => void
}) {
  // Live preview of the selected theme, rendered with the same code that
  // draws real slides — using the user's own outline so the preview shows
  // their deck, not lorem ipsum. Fixed picsum seed keeps the placeholder
  // photo stable while flipping through themes.
  const PREVIEW_IMG = 'https://picsum.photos/seed/deckify-theme-preview/900/562'
  const previewHtml = useMemo(() => {
    const titleSlide = {
      type: 'title',
      title: outline[0]?.title || params.topic.slice(0, 60),
      subtitle: params.topic.slice(0, 100),
      img: PREVIEW_IMG,
    }
    const second = outline[1]
    const bodySlide = second?.bullets?.length
      ? { type: 'bullets', title: second.title, bullets: second.bullets.slice(0, 3), img: '' }
      : { type: 'text', title: second?.title || 'Key points', body: 'Your slide content appears here in this style.', img: '' }
    return [presRenderSlide(titleSlide, selectedTheme, 0), presRenderSlide(bodySlide, selectedTheme, 1)]
  }, [selectedTheme, outline, params.topic])

  const PREVIEW_SCALE = 0.348 // 900px slide → ~313px card, two per 680px row

  return (
    <div className="page active" id="page-theme">
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 0 40px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <button onClick={onBack} style={backBtnStyle}>← Back to outline</button>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--black)', margin: '12px 0 4px' }}>
            Choose a theme
          </h2>
          <p style={{ fontSize: 13, color: 'var(--grey)', margin: 0, lineHeight: 1.5 }}>
            {params.topic} · {outline.length} slide{outline.length !== 1 ? 's' : ''}. Pick a visual style, then generate your deck
          </p>
        </div>

        {/* Theme grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: 12,
          marginBottom: 32,
        }}>
          {THEME_LIST.map(({ key, label }) => {
            const acc    = TACCS[key]
            const bg     = TBGS[key]
            const active = selectedTheme === key
            return (
              <button
                key={key}
                onClick={() => onThemeChange(key)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  background: active ? 'var(--accent-light, #f0f4ff)' : 'var(--white)',
                  border: active ? `2px solid ${acc}` : '2px solid var(--border)',
                  borderRadius: 12, padding: '14px 10px', cursor: 'pointer',
                  transition: 'all .15s', boxShadow: active ? `0 0 0 3px ${acc}22` : 'none',
                }}
              >
                {/* Swatch */}
                <div style={{
                  width: 72, height: 44, borderRadius: 8, overflow: 'hidden',
                  background: bg, border: '1px solid rgba(0,0,0,.08)',
                  display: 'flex', flexShrink: 0,
                }}>
                  <div style={{ width: '55%', background: acc, opacity: .85 }} />
                  <div style={{ flex: 1, background: bg }} />
                </div>
                <span style={{
                  fontSize: 12, fontWeight: active ? 700 : 500,
                  color: active ? acc : 'var(--black)',
                  fontFamily: "'DM Sans',sans-serif",
                }}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Live theme preview — real render of the user's first two slides */}
        <div style={{
          background: 'var(--white)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '16px 20px 20px', marginBottom: 28,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--black)', fontFamily: "'DM Sans',sans-serif" }}>
              Preview: {THEME_LIST.find(t => t.key === selectedTheme)?.label ?? selectedTheme}
            </span>
            <span style={{ fontSize: 11, color: 'var(--grey)', fontFamily: "'DM Sans',sans-serif" }}>
              your title + first content slide in this style
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            {previewHtml.map((html, i) => (
              <div
                key={selectedTheme + i}
                style={{
                  width: 900 * PREVIEW_SCALE, height: 562 * PREVIEW_SCALE,
                  borderRadius: 8, overflow: 'hidden', flexShrink: 0,
                  border: '1px solid var(--border)', boxShadow: '0 4px 14px rgba(0,0,0,.08)',
                }}
              >
                <div
                  style={{ width: 900, height: 562, transform: `scale(${PREVIEW_SCALE})`, transformOrigin: 'top left', pointerEvents: 'none' }}
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* AI image toggle */}
        <div style={{
          background: 'var(--white)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '16px 20px', marginBottom: 28,
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={aiImages}
              onChange={e => onAiImagesChange(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer', flexShrink: 0 }}
            />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--black)', fontFamily: "'DM Sans',sans-serif" }}>
                Generate AI images for each slide
              </div>
              <div style={{ fontSize: 12, color: 'var(--grey)', marginTop: 2, fontFamily: "'DM Sans',sans-serif" }}>
                Deck appears instantly with placeholders. Images fill in after (~30s per batch)
              </div>
            </div>
          </label>

          {aiImages && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--grey)', fontFamily: "'DM Sans',sans-serif", display: 'block', marginBottom: 6 }}>
                Image provider
              </label>
              <select
                value={imageProvider}
                onChange={e => onImageProviderChange(e.target.value)}
                style={{
                  fontSize: 13, color: 'var(--black)', background: 'var(--bg, #f6f7fb)',
                  border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px',
                  fontFamily: "'DM Sans',sans-serif", cursor: 'pointer', width: '100%',
                }}
              >
                <option value="flux">Flux Schnell · fast &amp; cheap (~$0.003/image)</option>
              </select>
            </div>
          )}
        </div>

        {/* Generate */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onGenerate}
            style={{
              background: 'var(--accent)', color: '#fff', border: 'none',
              borderRadius: 10, padding: '13px 32px', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
              boxShadow: '0 2px 12px rgba(42,92,255,.3)', transition: 'opacity .15s',
            }}
          >
            ✨ Generate deck
          </button>
        </div>
      </div>
    </div>
  )
}
