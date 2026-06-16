'use client'

import { useEffect, useRef, useState } from 'react'
import type { ThemeKey } from '@/lib/themes/config'
import { TBGS, TTXTS, TACCS } from '@/lib/themes/config'
import EditorOverlay from './EditorOverlay'

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
  img?: string
  speaker_notes?: string
  [key: string]: unknown
}

export interface SavedDeck {
  id: string
  name: string
  slides: SlideData[]
  theme: ThemeKey
  createdAt: number
}

type Page = 'home' | 'create'

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
  }, [])

  function persistAndSet(decks: SavedDeck[]) {
    try { localStorage.setItem('deckify_decks', JSON.stringify(decks)) } catch { /* ignore */ }
    setSavedDecks(decks)
  }

  function deleteDeck(id: string) {
    persistAndSet(savedDecks.filter(d => d.id !== id))
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

  /* ── generate ────────────────────────────────────────────── */
  async function generate() {
    const topic = topicRef.current?.value.trim() ?? ''
    if (topic.length < 5) {
      showToast('Please describe your presentation first')
      topicRef.current?.focus()
      return
    }
    const count    = parseInt(countRef.current?.value ?? '8', 10)
    const audience = audienceRef.current?.value ?? 'committee'
    const goal     = goalRef.current?.value     ?? 'defend'
    const tone     = toneRef.current?.value     ?? 'academic'

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
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, count, theme: selectedTheme, audience, goal, tone }),
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

      const slides = (data.slides ?? [])
        .map((s: SlideData, i: number) => ({
          ...s,
          img: (s.img && s.img.includes('unsplash')) ? s.img : picUrl(i),
        }))
        .slice(0, count)

      const deck: SavedDeck = {
        id: 'deck_' + Date.now(),
        name: topic,
        slides,
        theme: selectedTheme,
        createdAt: Date.now(),
      }
      persistAndSet([deck, ...savedDecks])

      setTimeout(() => {
        setGenerating(false)
        setPage('home')
        showToast('Deck created — ready to edit!')
      }, 500)

    } catch (err) {
      clearInterval(genTimer.current!)
      setGenProgress(100)
      setGenStatus('AI unavailable — using outline deck')

      const slides = buildTopicFallback(topic, count)
      const deck: SavedDeck = {
        id: 'deck_' + Date.now(),
        name: topic,
        slides,
        theme: selectedTheme,
        createdAt: Date.now(),
      }
      persistAndSet([deck, ...savedDecks])

      setTimeout(() => {
        setGenerating(false)
        setPage('home')
        showToast('Deck created (outline mode — AI unavailable)')
      }, 1400)
    }
  }

  function quickGenerate() {
    generate()
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
      <div className="shell">

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
                Free — {credits} {credits === 1 ? 'credit' : 'credits'} left
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

            <div className="nav-section-label">Resources</div>
            <div className="nav-item" style={{ opacity: .45, cursor: 'not-allowed' }}>
              <span className="ni">🖼</span> Media library
            </div>
            <div className="nav-item" style={{ opacity: .45, cursor: 'not-allowed' }}>
              <span className="ni">📋</span> Templates
            </div>
            <div className="nav-item" style={{ opacity: .45, cursor: 'not-allowed' }}>
              <span className="ni">🎨</span> Themes
            </div>

            <div className="nav-section-label">Account</div>
            <div className="nav-item" style={{ opacity: .45, cursor: 'not-allowed' }}>
              <span className="ni">⚙️</span> Settings
            </div>
          </div>

          <div className="sidebar-bottom">
            <button
              className="upgrade-btn"
              onClick={() => showToast('Upgrade plan coming soon!')}
            >
              ⚡ Upgrade — ฿199/mo
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
              {page === 'home' ? 'My presentations' : 'New presentation'}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {page === 'home' && (
                <button className="btn btn-primary btn-sm" onClick={() => setPage('create')}>
                  ✨ New presentation
                </button>
              )}
            </div>
          </div>

          <div className="main-content">
            {page === 'home'   && <HomePage   decks={savedDecks} onNew={() => setPage('create')} onDelete={deleteDeck} onOpen={openEditor} onStartFromType={startFromType} />}
            {page === 'create' && <CreatePage selectedTheme={selectedTheme} onThemeChange={setSelectedTheme} topicRef={topicRef} audienceRef={audienceRef} goalRef={goalRef} toneRef={toneRef} countRef={countRef} onGenerate={quickGenerate} onStartFromType={startFromType} showToast={showToast} />}
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
  decks, onNew, onDelete, onOpen, onStartFromType,
}: {
  decks: SavedDeck[]
  onNew: () => void
  onDelete: (id: string) => void
  onOpen: (deck: SavedDeck) => void
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
        <DeckGrid decks={decks} onDelete={onDelete} onOpen={onOpen} />
      )}
    </div>
  )
}

/* ── Deck grid ─────────────────────────────────────────────── */
function DeckGrid({ decks, onDelete, onOpen }: { decks: SavedDeck[]; onDelete: (id: string) => void; onOpen: (d: SavedDeck) => void }) {
  return (
    <div className="deck-grid" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))',
      gap: 18,
    }}>
      {decks.map(deck => (
        <DeckCard key={deck.id} deck={deck} onDelete={onDelete} onOpen={onOpen} />
      ))}
    </div>
  )
}

function DeckCard({ deck, onDelete, onOpen }: { deck: SavedDeck; onDelete: (id: string) => void; onOpen: (d: SavedDeck) => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const thumb = deck.slides[0]?.img || picUrl(0)
  const accent = TACCS[deck.theme] || '#2a5cff'
  const bg     = TBGS[deck.theme]  || '#ffffff'

  return (
    <div
      className="deck-card"
      style={{ position: 'relative' }}
      onMouseLeave={() => setMenuOpen(false)}
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
        <div style={{
          fontSize: 13, fontWeight: 600, color: 'var(--black)',
          marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {deck.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 11, color: 'var(--grey)' }}>
            {deck.slides.length} slides · {deck.theme} · {relativeTime(deck.createdAt)}
          </div>
          {/* Kebab menu */}
          <div style={{ position: 'relative' }}>
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
                boxShadow: '0 8px 24px rgba(0,0,0,.1)', zIndex: 50, overflow: 'hidden',
              }}>
                <button
                  onClick={() => { setMenuOpen(false); onOpen(deck) }}
                  style={menuItemStyle}
                >
                  ✏️ Open editor
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
  selectedTheme, onThemeChange, topicRef, audienceRef, goalRef, toneRef, countRef,
  onGenerate, onStartFromType, showToast,
}: {
  selectedTheme: ThemeKey
  onThemeChange: (t: ThemeKey) => void
  topicRef:    React.RefObject<HTMLTextAreaElement>
  audienceRef: React.RefObject<HTMLSelectElement>
  goalRef:     React.RefObject<HTMLSelectElement>
  toneRef:     React.RefObject<HTMLSelectElement>
  countRef:    React.RefObject<HTMLSelectElement>
  onGenerate:  () => void
  onStartFromType: (type: string) => void
  showToast: (msg: string) => void
}) {
  const [focused, setFocused] = useState(false)

  return (
    <div className="page active" id="page-create">
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 0 40px' }}>

        {/* ── Prompt box ────────────────────────────────── */}
        <div
          style={{
            background: 'var(--white)',
            border: `2px solid ${focused ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 16, overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,.06)',
            marginBottom: 24, transition: 'border-color .2s',
          }}
        >
          {/* Topic textarea */}
          <div style={{ padding: '20px 22px 0', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--grey)', letterSpacing: '.3px', textTransform: 'uppercase' }}>
                Your topic
              </span>
              <label style={{ fontSize: 11, color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}>
                📎 Upload PDF abstract
                <input
                  type="file" accept=".pdf,.txt,.doc,.docx"
                  style={{ display: 'none' }}
                  onChange={() => showToast('PDF parsing coming soon — paste your abstract into the text field for now')}
                />
              </label>
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
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onGenerate()
              }}
            />
          </div>

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

          {/* ── Theme picker ──────────────────────────── */}
          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', background: '#fafaf8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--grey)', whiteSpace: 'nowrap' }}>
                🎨 Theme
              </span>
              <span style={{ fontSize: 11, color: 'var(--grey2)' }}>
                {THEME_LIST.find(t => t.key === selectedTheme)?.label ?? 'Clean'}
              </span>
            </div>
            <div style={{
              display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4,
              scrollbarWidth: 'thin',
            }}>
              {THEME_LIST.map(({ key, label }) => {
                const acc = TACCS[key]
                const bg  = TBGS[key]
                const active = selectedTheme === key
                return (
                  <button
                    key={key}
                    onClick={() => onThemeChange(key)}
                    title={label}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      gap: 5, flexShrink: 0, background: 'none', border: 'none',
                      cursor: 'pointer', padding: '6px 8px', borderRadius: 10,
                      outline: active ? `2px solid ${acc}` : '2px solid transparent',
                      outlineOffset: 1, transition: 'all .15s',
                    }}
                  >
                    {/* Mini theme swatch */}
                    <div style={{
                      width: 44, height: 28, borderRadius: 6, overflow: 'hidden',
                      background: bg, border: '1px solid rgba(0,0,0,.08)',
                      display: 'flex',
                    }}>
                      <div style={{ width: '55%', background: acc, opacity: .85 }} />
                      <div style={{ flex: 1, background: bg }} />
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: active ? 700 : 500,
                      color: active ? acc : 'var(--grey)', whiteSpace: 'nowrap',
                    }}>
                      {label}
                    </span>
                  </button>
                )
              })}
            </div>
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
              onClick={onGenerate}
              style={{
                background: 'var(--accent)', color: '#fff', border: 'none',
                borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
                display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 2px 12px rgba(42,92,255,.3)',
              }}
            >
              ✨ Generate
              <span style={{ fontSize: 11, opacity: .7, fontWeight: 400 }}>⌘↵</span>
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
    </div>
  )
}

const intakeSelectStyle: React.CSSProperties = {
  background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 7,
  padding: '5px 10px', fontSize: 12, fontFamily: "'DM Sans',sans-serif",
  cursor: 'pointer', outline: 'none', color: 'var(--black)', flex: 1, minWidth: 110,
}
