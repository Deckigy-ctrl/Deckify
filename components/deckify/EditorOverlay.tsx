'use client'

import { useEffect, useRef, useState } from 'react'
import PresenterMode from './PresenterMode'
import { exportPdf } from '@/lib/export/exportPdf'
import { exportPptx } from '@/lib/export/exportPptx'
import { buildEdEls } from '@/lib/themes/buildElements'
import { isUploadUrl, MAX_IMAGES_PER_SLIDE } from '@/lib/uploads'
import type { EdElement } from '@/lib/themes/buildElements'
import { buildChartSVG, buildDiagramSVG, getDefaultChartData } from '@/lib/themes/chartBuild'
import { TBGS, TTXTS, TACCS } from '@/lib/themes/config'
import type { ThemeKey } from '@/lib/themes/config'
import type { SlideData, SavedDeck } from './DeckifyApp'

/* ─── insert-panel HTML ──────────────────────────────────────── */
const INS: Record<string, string> = {
  blocks: `
    <input class="insert-search" placeholder="Search blocks…" oninput="window._df.filterBlocks(this.value)">
    <div class="insert-section-label">Text</div>
    <div class="insert-grid">
      <div class="insert-block" onclick="window._df.insertBlock('title')"><span class="insert-block-icon" style="font-weight:900;font-size:20px">T</span><div class="insert-block-name">Title</div></div>
      <div class="insert-block" onclick="window._df.insertBlock('h1')"><span class="insert-block-icon">H1</span><div class="insert-block-name">Heading 1</div></div>
      <div class="insert-block" onclick="window._df.insertBlock('h2')"><span class="insert-block-icon">H2</span><div class="insert-block-name">Heading 2</div></div>
      <div class="insert-block" onclick="window._df.insertBlock('h3')"><span class="insert-block-icon">H3</span><div class="insert-block-name">Heading 3</div></div>
      <div class="insert-block" onclick="window._df.insertBlock('body')"><span class="insert-block-icon">¶</span><div class="insert-block-name">Body text</div></div>
      <div class="insert-block" onclick="window._df.insertBlock('label')"><span class="insert-block-icon">🏷</span><div class="insert-block-name">Label</div></div>
      <div class="insert-block" onclick="window._df.insertBlock('quote')"><span class="insert-block-icon" style="font-style:italic">"</span><div class="insert-block-name">Blockquote</div></div>
    </div>
    <div class="insert-section-label">Lists</div>
    <div class="insert-grid">
      <div class="insert-block" onclick="window._df.insertBlock('bullet-list')"><span class="insert-block-icon">•≡</span><div class="insert-block-name">Bullet list</div></div>
      <div class="insert-block" onclick="window._df.insertBlock('numbered-list')"><span class="insert-block-icon">1≡</span><div class="insert-block-name">Numbered</div></div>
      <div class="insert-block" onclick="window._df.insertBlock('arrow-list')"><span class="insert-block-icon">→≡</span><div class="insert-block-name">Arrow list</div></div>
    </div>
    <div class="insert-section-label">Tables</div>
    <div class="insert-grid">
      <div class="insert-block" onclick="window._df.insertBlock('table2x2')"><span class="insert-block-icon">▦</span><div class="insert-block-name">2×2 table</div></div>
      <div class="insert-block" onclick="window._df.insertBlock('table3x3')"><span class="insert-block-icon">▦</span><div class="insert-block-name">3×3 table</div></div>
    </div>
    <div class="insert-section-label">Callouts</div>
    <div class="insert-grid">
      <div class="insert-block" onclick="window._df.insertBlock('note-box')"><span class="insert-block-icon">📝</span><div class="insert-block-name">Note</div></div>
      <div class="insert-block" onclick="window._df.insertBlock('info-box')"><span class="insert-block-icon">ℹ️</span><div class="insert-block-name">Info</div></div>
      <div class="insert-block" onclick="window._df.insertBlock('warning-box')"><span class="insert-block-icon">⚠️</span><div class="insert-block-name">Warning</div></div>
      <div class="insert-block" onclick="window._df.insertBlock('success-box')"><span class="insert-block-icon">✅</span><div class="insert-block-name">Success</div></div>
    </div>`,

  layouts: `
    <div class="insert-section-label">Columns</div>
    <div class="insert-grid">
      <div class="insert-block" onclick="window._df.insertLayout('2col')"><span class="insert-block-icon">⊞</span><div class="insert-block-name">2 columns</div></div>
      <div class="insert-block" onclick="window._df.insertLayout('3col')"><span class="insert-block-icon">⊟</span><div class="insert-block-name">3 columns</div></div>
      <div class="insert-block" onclick="window._df.insertLayout('4col')"><span class="insert-block-icon">⊠</span><div class="insert-block-name">4 columns</div></div>
    </div>
    <div class="insert-section-label">Boxes</div>
    <div class="insert-grid">
      <div class="insert-block" onclick="window._df.insertLayout('solid-boxes')"><span class="insert-block-icon">■</span><div class="insert-block-name">Solid boxes</div></div>
      <div class="insert-block" onclick="window._df.insertLayout('outline-boxes')"><span class="insert-block-icon">□</span><div class="insert-block-name">Outline boxes</div></div>
      <div class="insert-block" onclick="window._df.insertLayout('icon-boxes')"><span class="insert-block-icon">⬡</span><div class="insert-block-name">Icon boxes</div></div>
    </div>
    <div class="insert-section-label">Flow</div>
    <div class="insert-grid">
      <div class="insert-block" onclick="window._df.insertLayout('process-steps')"><span class="insert-block-icon">→</span><div class="insert-block-name">Process steps</div></div>
      <div class="insert-block" onclick="window._df.insertLayout('large-bullets')"><span class="insert-block-icon">◉</span><div class="insert-block-name">Large bullets</div></div>
    </div>`,

  charts: `
    <div class="insert-section-label">Charts</div>
    <div class="insert-grid">
      <div class="insert-block" onclick="window._df.insertChart('line')"><span class="insert-block-icon">📈</span><div class="insert-block-name">Line</div></div>
      <div class="insert-block" onclick="window._df.insertChart('area')"><span class="insert-block-icon">📉</span><div class="insert-block-name">Area</div></div>
      <div class="insert-block" onclick="window._df.insertChart('bar')"><span class="insert-block-icon">📊</span><div class="insert-block-name">Bar</div></div>
      <div class="insert-block" onclick="window._df.insertChart('column')"><span class="insert-block-icon">▐</span><div class="insert-block-name">Column</div></div>
      <div class="insert-block" onclick="window._df.insertChart('pie')"><span class="insert-block-icon">🥧</span><div class="insert-block-name">Pie</div></div>
      <div class="insert-block" onclick="window._df.insertChart('donut')"><span class="insert-block-icon">⊙</span><div class="insert-block-name">Donut</div></div>
      <div class="insert-block" onclick="window._df.insertChart('scatter')"><span class="insert-block-icon">⠿</span><div class="insert-block-name">Scatter</div></div>
      <div class="insert-block" onclick="window._df.insertChart('bubble')"><span class="insert-block-icon">⬤</span><div class="insert-block-name">Bubble</div></div>
      <div class="insert-block" onclick="window._df.insertChart('funnel')"><span class="insert-block-icon">▽</span><div class="insert-block-name">Funnel</div></div>
    </div>
    <div class="insert-section-label">Freeform</div>
    <div class="insert-grid">
      <div class="insert-block" onclick="window._df.insertChart('gantt')"><span class="insert-block-icon">⊟</span><div class="insert-block-name">Gantt</div></div>
      <div class="insert-block" onclick="window._df.insertChart('heatmap')"><span class="insert-block-icon">🔥</span><div class="insert-block-name">Heatmap</div></div>
      <div class="insert-block" onclick="window._df.insertChart('calendar')"><span class="insert-block-icon">📅</span><div class="insert-block-name">Calendar</div></div>
    </div>`,

  diagrams: `
    <div class="insert-section-label">Diagrams</div>
    <div class="insert-grid">
      <div class="insert-block" onclick="window._df.insertDiagram('venn')"><span class="insert-block-icon">◎</span><div class="insert-block-name">Venn</div></div>
      <div class="insert-block" onclick="window._df.insertDiagram('swot')"><span class="insert-block-icon">⊞</span><div class="insert-block-name">SWOT</div></div>
      <div class="insert-block" onclick="window._df.insertDiagram('pyramid')"><span class="insert-block-icon">△</span><div class="insert-block-name">Pyramid</div></div>
      <div class="insert-block" onclick="window._df.insertDiagram('cycle')"><span class="insert-block-icon">↻</span><div class="insert-block-name">Cycle</div></div>
      <div class="insert-block" onclick="window._df.insertDiagram('timeline')"><span class="insert-block-icon">⟶</span><div class="insert-block-name">Timeline</div></div>
      <div class="insert-block" onclick="window._df.insertDiagram('flowchart')"><span class="insert-block-icon">⬡</span><div class="insert-block-name">Flowchart</div></div>
      <div class="insert-block" onclick="window._df.insertDiagram('quadrant')"><span class="insert-block-icon">⊞</span><div class="insert-block-name">Quadrant</div></div>
      <div class="insert-block" onclick="window._df.insertDiagram('mindmap')"><span class="insert-block-icon">🌐</span><div class="insert-block-name">Mind map</div></div>
      <div class="insert-block" onclick="window._df.insertDiagram('target')"><span class="insert-block-icon">🎯</span><div class="insert-block-name">Target</div></div>
      <div class="insert-block" onclick="window._df.insertDiagram('orbit')"><span class="insert-block-icon">🪐</span><div class="insert-block-name">Orbit</div></div>
      <div class="insert-block" onclick="window._df.insertDiagram('comparison')"><span class="insert-block-icon">⟺</span><div class="insert-block-name">Comparison</div></div>
    </div>`,

  images: `
    <div class="insert-section-label">Upload &amp; generate</div>
    <div class="insert-grid">
      <div class="insert-block" onclick="window._df.edTriggerImg()"><span class="insert-block-icon">⬆</span><div class="insert-block-name">Upload image</div></div>
      <div class="insert-block" onclick="window._df.insertStockPhoto()"><span class="insert-block-icon">🔍</span><div class="insert-block-name">Stock photo</div></div>
    </div>
    <div class="insert-section-label">AI image generator</div>
    <div style="padding:0 4px">
      <input id="insertAiPrompt" class="insert-search" placeholder="e.g. tropical forest, minimal dark background…" style="margin-bottom:8px">
      <button onclick="window._df.insertAiImage()" style="width:100%;background:#2a5cff;border:none;color:#fff;padding:9px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif">✨ Generate image</button>
    </div>`,

  media: `
    <div class="insert-section-label">Embed</div>
    <div class="insert-grid">
      <div class="insert-block" onclick="window._df.insertMedia('youtube')"><span class="insert-block-icon">▶️</span><div class="insert-block-name">YouTube</div></div>
      <div class="insert-block" onclick="window._df.insertMedia('figma')"><span class="insert-block-icon">🎨</span><div class="insert-block-name">Figma</div></div>
      <div class="insert-block" onclick="window._df.insertMedia('webpage')"><span class="insert-block-icon">🌐</span><div class="insert-block-name">Webpage</div></div>
    </div>
    <div style="margin-top:12px;padding:10px 12px;background:var(--ed-hover);border-radius:8px;font-size:11px;color:var(--ed-text3);line-height:1.6">
      Embeds are placeholders in the editor. They export as images in PDF/PPTX.
    </div>`,
}

/* ─── text fitting ──────────────────────────────────────────── */
const FITTABLE_ROLES = new Set(['title', 'subtitle', 'bullet', 'body'])

function fitEdText(canvas: HTMLDivElement, els: EdElement[]): void {
  const FLOOR = 11
  const SLIDE_H = 550

  const toFit = [...els]
    .filter(el => el.type === 'text' && FITTABLE_ROLES.has(el.role))
    .sort((a, b) => a.y - b.y)

  for (const el of toFit) {
    const div = canvas.querySelector<HTMLElement>(`[data-id="${el.id}"]`)
    const inner = div?.querySelector<HTMLElement>('.text-inner')
    if (!div || !inner) continue

    let fs = parseFloat(inner.style.fontSize) || el.fontSize || 14
    while (fs > FLOOR && inner.scrollHeight > inner.clientHeight) {
      fs--
      inner.style.fontSize = fs + 'px'
    }

    if (inner.scrollHeight > inner.clientHeight) {
      const newH = Math.min(SLIDE_H - el.y, inner.scrollHeight)
      const delta = newH - el.h
      if (delta > 0) {
        el.h = newH
        div.style.height = newH + 'px'
        for (const other of els) {
          if (other.y > el.y && other.id !== el.id) {
            other.y += delta
            const otherDiv = canvas.querySelector<HTMLElement>(`[data-id="${other.id}"]`)
            if (otherDiv) otherDiv.style.top = other.y + 'px'
          }
        }
      }
    }
  }
}

/* ─── first-run walkthrough ─────────────────────────────────── */
const TUTORIAL_SEEN_KEY = 'deckify_tutorial_seen'

// Each step highlights real UI (sel = selectors whose union rect gets the
// spotlight); sel: null renders a centered card with no spotlight.
const TUTORIAL_STEPS: { title: string; body: string; sel: string[] | null }[] = [
  {
    title: 'AI images',
    body: 'When you create a deck, switch on “Generate AI images” at the theme step. Illustrations fill in one by one while you work — a full deck takes about 1–2 minutes.',
    sel: null,
  },
  {
    title: 'This slide’s image',
    body: 'Swap the current slide’s image for your own (🖼 BG), hide it (👁 BG), remove it (✕ BG), or add one (＋ BG). Tip: hover any image on the canvas for quick replace / delete.',
    sel: ['[title="Replace background"]', '[title="Add background"]'],
  },
  {
    title: 'Arrange anything',
    body: 'Click an element to select it, then drag the dots bar to move it and pull the corner handles to resize. Double-click any text to edit it in place.',
    sel: ['#edCanvas'],
  },
  {
    title: 'Saving',
    body: 'Your deck is saved on this device automatically — as AI images arrive and whenever you close the editor. ✓ Save applies your current edits instantly, a checkpoint before you present or export.',
    sel: ['#edSaveBtn'],
  },
]

/* ─── component ─────────────────────────────────────────────── */
interface Props {
  deck: SavedDeck
  onClose: (updated: SavedDeck) => void
  showToast: (msg: string) => void
}

export default function EditorOverlay({ deck, onClose, showToast }: Props) {
  /* ── React UI state (toolbar sync only) ── */
  const [presenterOpen, setPresenterOpen] = useState(false)
  const [presenterStartIdx, setPresenterStartIdx] = useState(0)
  const presenterOpenRef = useRef(false)
  const [isEditMode, setIsEditMode] = useState(true)
  const [undoDisabled, setUndoDisabled] = useState(true)
  const [redoDisabled, setRedoDisabled] = useState(true)
  const [fontSize, setFontSize] = useState('18')
  const [fontFamily, setFontFamily] = useState('DM Sans')
  const [color, setColor] = useState('#ffffff')
  const [bold, setBold] = useState(false)
  const [italic, setItalic] = useState(false)
  const [underline, setUnderline] = useState(false)
  const [slideCountState, setSlideCountState] = useState(deck.slides.length)
  const [insertTabKey, setInsertTabKey] = useState('blocks')

  /* ── Mutable imperative refs ── */
  const ed = useRef({
    idx: 0,
    sel: null as string | null,
    els: [] as (EdElement[] | null)[],
    drag: null as { el: EdElement; div: HTMLElement; offX: number; offY: number } | null,
    resize: null as { el: EdElement; div: HTMLElement; handle: string; startX: number; startY: number; startW: number; startH: number; startElX: number; startElY: number } | null,
    W: 900, H: 562,
  })
  const undoStack = useRef<string[]>([])
  const redoStack = useRef<string[]>([])
  const chartData = useRef<Record<string, { type: string; data: Record<string, unknown> }>>({})
  const slidesRef = useRef<SlideData[]>([...deck.slides])
  const themeRef  = useRef<ThemeKey>(deck.theme)
  const notesRef  = useRef<Record<number, string>>({})
  const ctxId     = useRef<string | null>(null)
  // Leftover uploaded images (deck.tray); edited in-session, persisted on close.
  const trayRef       = useRef<string[]>([...(deck.tray ?? [])])
  const currentTabRef = useRef('blocks')
  const [, setTrayTick] = useState(0) // re-render hook for the tray tab label

  /* ── First-run walkthrough state ── */
  const [tutStep, setTutStep] = useState<number | null>(null)
  const [tutRect, setTutRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null)

  function endTutorial() {
    try { localStorage.setItem(TUTORIAL_SEEN_KEY, '1') } catch { /* ignore */ }
    setTutStep(null)
  }

  // Show once, the first time the editor opens on this device.
  useEffect(() => {
    let seen = true
    try { seen = !!localStorage.getItem(TUTORIAL_SEEN_KEY) } catch { /* ignore */ }
    if (seen) return
    const t = setTimeout(() => setTutStep(0), 700) // let the canvas lay out first
    return () => clearTimeout(t)
  }, [])

  // Measure the current step's target; follow it through resize/scroll.
  useEffect(() => {
    if (tutStep === null) { setTutRect(null); return }
    const sels = TUTORIAL_STEPS[tutStep].sel
    const measure = () => {
      if (!sels) { setTutRect(null); return }
      const rects = sels
        .map(s => document.querySelector(s))
        .filter((el): el is HTMLElement => !!el)
        .map(el => el.getBoundingClientRect())
        .filter(r => r.width > 0 && r.height > 0)
      if (!rects.length) { setTutRect(null); return }
      const x1 = Math.min(...rects.map(r => r.left))
      const y1 = Math.min(...rects.map(r => r.top))
      const x2 = Math.max(...rects.map(r => r.right))
      const y2 = Math.max(...rects.map(r => r.bottom))
      setTutRect({ x: x1, y: y1, w: x2 - x1, h: y2 - y1 })
    }
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [tutStep])

  /* ════════════════════════════════════════
     UNDO / REDO
  ════════════════════════════════════════ */
  function edSnapshot() {
    return JSON.stringify(ed.current.els[ed.current.idx] || [])
  }
  function edPushUndo() {
    undoStack.current.push(edSnapshot())
    if (undoStack.current.length > 50) undoStack.current.shift()
    redoStack.current = []
    setUndoDisabled(false)
    setRedoDisabled(true)
  }
  function edUndo() {
    if (!undoStack.current.length) return
    redoStack.current.push(edSnapshot())
    ed.current.els[ed.current.idx] = JSON.parse(undoStack.current.pop()!)
    edRenderSlide(ed.current.idx)
    setUndoDisabled(undoStack.current.length === 0)
    setRedoDisabled(false)
    showToast('Undone')
  }
  function edRedo() {
    if (!redoStack.current.length) return
    undoStack.current.push(edSnapshot())
    ed.current.els[ed.current.idx] = JSON.parse(redoStack.current.pop()!)
    edRenderSlide(ed.current.idx)
    setRedoDisabled(redoStack.current.length === 0)
    setUndoDisabled(false)
    showToast('Redone')
  }

  /* ════════════════════════════════════════
     CANVAS SCALE
  ════════════════════════════════════════ */
  function edScaleCanvas() {
    const main   = document.getElementById('edMain')
    const canvas = document.getElementById('edCanvas') as HTMLElement | null
    if (!main || !canvas) return
    const pad = 56
    const s = Math.min(1, (main.offsetWidth - pad) / ed.current.W, (main.offsetHeight - pad) / ed.current.H)
    canvas.style.transform      = `scale(${s})`
    canvas.style.transformOrigin = 'center center'
  }

  /* ════════════════════════════════════════
     SLIDE RENDER — imperative canvas build
  ════════════════════════════════════════ */
  function edRenderSlide(idx: number) {
    ed.current.idx = idx
    ed.current.sel = null

    const canvas = document.getElementById('edCanvas') as HTMLDivElement | null
    const bg     = document.getElementById('edCanvasBg') as HTMLDivElement | null
    if (!canvas || !bg) return

    bg.style.background = TBGS[themeRef.current] || '#ffffff'
    Array.from(canvas.children).forEach(c => { if (c !== bg) c.remove() })

    // Build elements lazily
    if (!ed.current.els[idx]) {
      ed.current.els[idx] = buildEdEls(slidesRef.current[idx] || {}, themeRef.current, idx)
    }
    const els = ed.current.els[idx] || []

    const roleOrder = ['gradient', 'img', 'overlay', 'tag', 'title', 'subtitle', 'bullet', 'body', 'extra']
    ;[...els]
      .sort((a, b) => roleOrder.indexOf(a.role || 'extra') - roleOrder.indexOf(b.role || 'extra'))
      .forEach(el => edMakeEl(el, canvas))

    fitEdText(canvas, els)

    // Update topbar label
    const lbl = document.getElementById('edLabel')
    if (lbl) lbl.textContent = `${idx + 1}/${slidesRef.current.length}`
    const prev = document.getElementById('edPrevBtn') as HTMLButtonElement | null
    const next = document.getElementById('edNextBtn') as HTMLButtonElement | null
    if (prev) prev.disabled = idx === 0
    if (next) next.disabled = idx === slidesRef.current.length - 1

    // Update active thumbnail
    document.querySelectorAll('.ed-slide-thumb').forEach((t, i) =>
      t.classList.toggle('active', i === idx))

    edScaleCanvas()
    edLoadNotes(idx)
  }

  /* ════════════════════════════════════════
     MAKE ELEMENT — imperative DOM
  ════════════════════════════════════════ */
  function edMakeEl(el: EdElement, canvas: HTMLDivElement) {
    const div = document.createElement('div')
    div.className = 'ed-el'
    div.dataset.id = el.id
    div.style.cssText = `left:${el.x}px;top:${el.y}px;width:${el.w}px;height:${el.h}px`

    /* ── dark overlay (stat full-bleed) — above image, no interaction ── */
    if (el.role === 'overlay') {
      div.style.background    = el.from || 'rgba(0,0,0,0.54)'
      div.style.pointerEvents = 'none'
      canvas.appendChild(div)
      return
    }

    /* ── gradient / solid colour — non-interactive ── */
    if (el.type === 'gradient') {
      div.style.background  = `linear-gradient(${el.dir || 'to right'},${el.from} 40%,${el.to})`
      div.style.pointerEvents = 'none'
      div.style.zIndex      = '1'
      canvas.appendChild(div)
      return
    }

    /* ── image ── */
    if (el.type === 'image') {
      div.classList.add('image-el', 'draggable')
      const img = document.createElement('img')
      img.src = el.src || 'https://picsum.photos/seed/deck/900/562'
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;pointer-events:none'
      img.onerror = () => { img.src = 'https://picsum.photos/seed/deck/900/562' }
      div.appendChild(img)

      if (el._hidden) div.style.opacity = '0'

      const dragBar = makeDragBar()
      dragBar.addEventListener('mousedown', ev => {
        ev.preventDefault(); ev.stopPropagation()
        edSelect(el.id); edMouseDown(ev, el, div)
      })
      div.appendChild(dragBar)

      // Replace / Remove bar
      const imgBar = document.createElement('div')
      imgBar.className = 'ed-img-bar'
      const replBtn = document.createElement('button')
      replBtn.className = 'ed-img-bar-btn'
      replBtn.textContent = '🖼 Replace'
      replBtn.addEventListener('mousedown', ev => { ev.preventDefault(); ev.stopPropagation(); edClickReplaceImg(el.id) })
      const remBtn = document.createElement('button')
      remBtn.className = 'ed-img-bar-btn del'
      remBtn.textContent = '✕ Remove'
      remBtn.addEventListener('mousedown', ev => { ev.preventDefault(); ev.stopPropagation(); edDeleteEl(el.id) })
      imgBar.appendChild(replBtn); imgBar.appendChild(remBtn)
      // User uploads can be sent back to the leftover tray instead of deleted.
      if (isUploadUrl(el.src)) {
        const trayBtn = document.createElement('button')
        trayBtn.className = 'ed-img-bar-btn'
        trayBtn.textContent = '⇢ Tray'
        trayBtn.addEventListener('mousedown', ev => { ev.preventDefault(); ev.stopPropagation(); removeToTray(el.src!) })
        imgBar.appendChild(trayBtn)
      }
      div.appendChild(imgBar)

      addEdHandles(div)
      div.addEventListener('mousedown', ev => {
        if (dragBar.contains(ev.target as Node)) return
        if ((ev.target as HTMLElement).classList.contains('ed-img-bar-btn')) return
        if ((ev.target as HTMLElement).dataset?.handle) return
        edSelect(el.id); edMouseDown(ev, el, div)
      })
      div.addEventListener('click', () => edSelect(el.id))
      canvas.appendChild(div)
      return
    }

    /* ── chart / diagram ── */
    if (el.type === 'chart') {
      div.classList.add('text-el', 'chart-el', 'draggable')
      const chartInner = document.createElement('div')
      chartInner.className = 'chart-inner'
      chartInner.style.cssText = 'width:100%;height:100%;overflow:hidden;pointer-events:none'
      chartInner.innerHTML = el.html || ''
      div.appendChild(chartInner)

      const dragBar = makeDragBar()
      dragBar.addEventListener('mousedown', ev => {
        ev.preventDefault(); ev.stopPropagation()
        edSelect(el.id); edMouseDown(ev, el, div)
      })
      div.appendChild(dragBar)

      const editHint = document.createElement('div')
      editHint.style.cssText = "position:absolute;bottom:6px;right:6px;background:rgba(42,92,255,.9);color:#fff;font-size:10px;font-weight:600;padding:3px 8px;border-radius:5px;cursor:pointer;display:none;pointer-events:auto;z-index:20;font-family:'DM Sans',sans-serif"
      editHint.textContent = 'Edit data'
      editHint.addEventListener('click', () => openChartEditor(el.id))
      div.appendChild(editHint)

      new MutationObserver(() => {
        editHint.style.display = div.classList.contains('selected') ? 'block' : 'none'
      }).observe(div, { attributes: true, attributeFilter: ['class'] })

      div.addEventListener('click', () => edSelect(el.id))
      div.addEventListener('mousedown', ev => {
        if (dragBar.contains(ev.target as Node)) return
        if ((ev.target as HTMLElement).dataset?.handle) return
        edMouseDown(ev, el, div)
      })
      addEdHandles(div)
      addEdActions(div, el.id)
      const outline = document.createElement('div')
      outline.className = 'ed-el-outline'
      div.appendChild(outline)
      canvas.appendChild(div)
      return
    }

    /* ── text ── */
    div.classList.add('text-el', 'draggable')
    const dragBar = makeDragBar()
    dragBar.addEventListener('mousedown', ev => {
      ev.preventDefault(); ev.stopPropagation()
      edSelect(el.id); edMouseDown(ev, el, div)
    })
    div.appendChild(dragBar)

    const inner = document.createElement('div')
    inner.className = 'text-inner'
    inner.style.cssText = 'width:100%;height:100%;overflow:hidden;outline:none;word-break:break-word;cursor:default;box-sizing:border-box;padding:4px 9px'
    applyEdTextStyle(inner, el)
    inner.innerHTML = el.html || ''
    inner.contentEditable = 'false'

    inner.addEventListener('dblclick', ev => { ev.stopPropagation(); edSelect(el.id); inner.contentEditable = 'true'; inner.focus() })
    inner.addEventListener('click',    ev => { ev.stopPropagation(); edSelect(el.id) })
    inner.addEventListener('blur',     () => { inner.contentEditable = 'false'; el.html = inner.innerHTML })
    inner.addEventListener('input',    () => { el.html = inner.innerHTML })
    inner.addEventListener('mousedown',ev => { if (inner.contentEditable === 'true') ev.stopPropagation() })
    div.appendChild(inner)

    div.addEventListener('click', ev => { if (dragBar.contains(ev.target as Node)) return; edSelect(el.id) })
    div.addEventListener('mousedown', ev => {
      if (dragBar.contains(ev.target as Node)) return
      if (inner.contentEditable === 'true') return
      if ((ev.target as HTMLElement).dataset?.handle) return
      edMouseDown(ev, el, div)
    })

    addEdHandles(div)
    addEdActions(div, el.id)
    const outline = document.createElement('div')
    outline.className = 'ed-el-outline'
    div.appendChild(outline)
    canvas.appendChild(div)
  }

  /* ─── helpers for edMakeEl ─────────────────────────────────── */
  function makeDragBar(): HTMLDivElement {
    const bar = document.createElement('div')
    bar.className = 'ed-drag-bar'
    bar.title = 'Drag to move'
    for (let i = 0; i < 6; i++) {
      const dot = document.createElement('div')
      dot.className = 'ed-drag-dot'
      bar.appendChild(dot)
    }
    return bar
  }

  function applyEdTextStyle(node: HTMLElement, el: EdElement) {
    node.style.fontSize       = (el.fontSize || 14) + 'px'
    node.style.fontWeight     = el.bold ? '700' : '400'
    node.style.fontStyle      = el.italic ? 'italic' : 'normal'
    node.style.textDecoration = el.underline ? 'underline' : 'none'
    node.style.color          = el.color || '#fff'
    node.style.textAlign      = el.align || 'left'
    node.style.textTransform  = el.uppercase ? 'uppercase' : 'none'
    node.style.lineHeight     = '1.4'
    node.style.outline        = 'none'
    node.style.overflow       = 'hidden'
    node.style.wordBreak      = 'break-word'
    node.style.userSelect     = 'text'
    if (el.fontFamily) {
      node.style.fontFamily = `'${el.fontFamily}',sans-serif`
    } else {
      node.style.fontFamily = (el.fontSize || 14) >= 28
        ? "'DM Serif Display',serif"
        : "'DM Sans',sans-serif"
    }
  }

  function addEdHandles(div: HTMLElement) {
    ;['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'].forEach(pos => {
      const h = document.createElement('div')
      h.className = `ed-handle ${pos}`
      h.dataset.handle = pos
      h.addEventListener('mousedown', e => edResizeStart(e as MouseEvent, div, pos))
      div.appendChild(h)
    })
  }

  function addEdActions(div: HTMLElement, id: string) {
    const acts = document.createElement('div')
    acts.className = 'ed-el-actions'
    const dup = document.createElement('button')
    dup.className = 'ed-el-action'
    dup.textContent = '⊕ Dup'
    dup.addEventListener('mousedown', e => { e.preventDefault(); edPushUndo(); edDupEl(id) })
    const del = document.createElement('button')
    del.className = 'ed-el-action del'
    del.textContent = '✕ Del'
    del.addEventListener('mousedown', e => { e.preventDefault(); edPushUndo(); edDeleteEl(id) })
    acts.appendChild(dup)
    acts.appendChild(del)
    div.appendChild(acts)
  }

  /* ════════════════════════════════════════
     SELECT / DRAG / RESIZE
  ════════════════════════════════════════ */
  function edSelect(id: string) {
    ed.current.sel = id
    document.querySelectorAll('.ed-el').forEach(d =>
      d.classList.toggle('selected', (d as HTMLElement).dataset.id === id))

    const el = (ed.current.els[ed.current.idx] || []).find(e => e.id === id)
    if (el && el.type === 'text') {
      const rawColor = el.color || '#ffffff'
      const safeColor = rawColor.length === 7 ? rawColor : rawColor.slice(0, 7)
      setFontSize(String(el.fontSize || 16))
      setFontFamily(el.fontFamily || 'DM Sans')
      setColor(safeColor)
      setBold(!!el.bold)
      setItalic(!!el.italic)
      setUnderline(!!el.underline)
    }
  }

  function edMouseDown(e: MouseEvent, el: EdElement, div: HTMLElement) {
    if ((e.target as HTMLElement).dataset?.handle) return
    if ((e.target as HTMLElement).classList.contains('ed-img-bar-btn')) return
    const innerDiv = div.querySelector('.text-inner') as HTMLElement | null
    if (innerDiv && innerDiv.contentEditable === 'true') return
    e.preventDefault()
    const cr  = (document.getElementById('edCanvas') as HTMLElement).getBoundingClientRect()
    const sc  = cr.width / ed.current.W
    ed.current.drag = { el, div, offX: (e.clientX - cr.left) / sc - el.x, offY: (e.clientY - cr.top) / sc - el.y }
  }

  function edResizeStart(e: MouseEvent, div: HTMLElement, handle: string) {
    e.preventDefault(); e.stopPropagation()
    const el = (ed.current.els[ed.current.idx] || []).find(el => el.id === div.dataset.id)
    if (!el) return
    ed.current.resize = { el, div, handle, startX: e.clientX, startY: e.clientY, startW: el.w, startH: el.h, startElX: el.x, startElY: el.y }
  }

  /* ════════════════════════════════════════
     MODE TOGGLE
  ════════════════════════════════════════ */
  function edSetMode(mode: 'view' | 'edit') {
    const isView = mode === 'view'
    const edDiv  = document.getElementById('deckEditor')
    if (!edDiv) return
    edDiv.classList.toggle('ed-view-mode', isView)
    edDiv.classList.toggle('ed-edit-mode', !isView)
    if (isView) {
      ed.current.sel = null
      document.querySelectorAll('.ed-el').forEach(d => d.classList.remove('selected'))
    }
    setIsEditMode(!isView)
    edScaleCanvas()
  }

  /* ════════════════════════════════════════
     NAVIGATION
  ════════════════════════════════════════ */
  function edNavSlide(dir: number) {
    const n = ed.current.idx + dir
    if (n < 0 || n >= slidesRef.current.length) return
    edRenderSlide(n)
  }

  /* ════════════════════════════════════════
     SIDEBAR REBUILD
  ════════════════════════════════════════ */
  function edRebuildSidebar() {
    const list = document.getElementById('edSlideList')
    if (!list) return
    list.innerHTML = ''
    slidesRef.current.forEach((slide, i) => {
      const t = document.createElement('div')
      t.className = `ed-slide-thumb${i === ed.current.idx ? ' active' : ''}`
      t.style.backgroundImage = `url(${slide.img || ''})`
      t.innerHTML = `<div class="ed-slide-thumb-overlay"><span class="ed-slide-thumb-num">${i + 1}</span></div>`
      t.onclick = () => edRenderSlide(i)
      list.appendChild(t)
    })
    setSlideCountState(slidesRef.current.length)
  }

  /* ════════════════════════════════════════
     FORMAT TEXT
  ════════════════════════════════════════ */
  function edFormat(type: string, val?: string) {
    const el = (ed.current.els[ed.current.idx] || []).find(e => e.id === ed.current.sel)
    if (!el || el.type !== 'text') { showToast('Click a text element first'); return }
    const outer = document.querySelector(`[data-id="${el.id}"]`) as HTMLElement | null
    if (!outer) return
    const inner = (outer.querySelector('.text-inner') || outer) as HTMLElement

    switch (type) {
      case 'bold':    el.bold = !el.bold;        inner.style.fontWeight     = el.bold ? '700' : '400';          setBold(!!el.bold); break
      case 'italic':  el.italic = !el.italic;    inner.style.fontStyle      = el.italic ? 'italic' : 'normal';  setItalic(!!el.italic); break
      case 'under':   el.underline = !el.underline; inner.style.textDecoration = el.underline ? 'underline' : 'none'; setUnderline(!!el.underline); break
      case 'size':    el.fontSize = parseInt(val!); inner.style.fontSize     = val + 'px'; setFontSize(val!); break
      case 'color':   el.color = val!;            inner.style.color          = val!;                             setColor(val!); break
      case 'align':   el.align = val!;            inner.style.textAlign      = val!;                             break
      case 'font':    el.fontFamily = val!;       inner.style.fontFamily     = `'${val}',sans-serif`;            setFontFamily(val!); break
    }
  }

  /* ════════════════════════════════════════
     ADD / DUP / DELETE ELEMENT
  ════════════════════════════════════════ */
  function edAddText() {
    const el: EdElement = {
      id: 'txt_' + Date.now(), role: 'extra', type: 'text',
      html: 'New text', x: 100, y: 250, w: 250, h: 50,
      fontSize: 18, bold: false, italic: false, underline: false,
      color: TTXTS[themeRef.current], align: 'left',
    }
    const els = ed.current.els[ed.current.idx]
    if (els) els.push(el)
    edRenderSlide(ed.current.idx)
    setTimeout(() => edSelect(el.id), 30)
  }

  function edDupEl(id: string) {
    const els = ed.current.els[ed.current.idx]
    if (!els) return
    const el = els.find(e => e.id === id)
    if (!el) return
    const newId = id + '_c' + Date.now()
    const copy: EdElement = { ...JSON.parse(JSON.stringify(el)), id: newId, x: el.x + 20, y: el.y + 20 }
    if (el.chartType && chartData.current[id]) {
      chartData.current[newId] = JSON.parse(JSON.stringify(chartData.current[id]))
      if (copy.html) copy.html = copy.html.split(id).join(newId)
    }
    els.push(copy)
    edRenderSlide(ed.current.idx)
    setTimeout(() => edSelect(copy.id), 30)
  }

  function edDeleteEl(id: string) {
    const idx = ed.current.idx
    ed.current.els[idx] = (ed.current.els[idx] || []).filter(e => e.id !== id)
    delete chartData.current[id]
    if (ed.current.sel === id) ed.current.sel = null
    edRenderSlide(idx)
  }

  /* ════════════════════════════════════════
     BACKGROUND IMAGE
  ════════════════════════════════════════ */
  function edToggleBg() {
    const els = ed.current.els[ed.current.idx] || []
    const imgEl = els.find(e => e.role === 'img')
    if (!imgEl) { showToast('No background image on this slide'); return }
    imgEl._hidden = !imgEl._hidden
    const d = document.querySelector(`[data-id="${imgEl.id}"]`) as HTMLElement | null
    if (d) d.style.opacity = imgEl._hidden ? '0' : '1'
    showToast(imgEl._hidden ? 'Background hidden' : 'Background shown')
  }

  function edReplaceBg() {
    const inp = document.createElement('input')
    inp.type = 'file'; inp.accept = 'image/*'
    inp.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return
      const reader = new FileReader()
      reader.onload = ev => {
        const src = ev.target!.result as string
        const els = ed.current.els[ed.current.idx] || []
        let imgEl = els.find(e => e.role === 'img')
        if (!imgEl) {
          imgEl = { id: 'img0', role: 'img', type: 'image', src, x: 450, y: 0, w: 450, h: 562 }
          ed.current.els[ed.current.idx]!.unshift(imgEl)
        } else { imgEl.src = src; imgEl._hidden = false }
        slidesRef.current[ed.current.idx].img = src
        edRenderSlide(ed.current.idx); edRebuildSidebar(); showToast('Background replaced ✓')
      }
      reader.readAsDataURL(file)
    }
    inp.click()
  }

  function edClearBg() {
    const idx = ed.current.idx
    ed.current.els[idx] = (ed.current.els[idx] || []).filter(e => e.role !== 'img' && e.role !== 'gradient' && e.role !== 'overlay')
    slidesRef.current[idx].img = ''
    edRenderSlide(idx); edRebuildSidebar(); showToast('Background removed')
  }

  function edAddBg() {
    const idx  = ed.current.idx
    const hasImg = (ed.current.els[idx] || []).some(e => e.role === 'img')
    if (hasImg) { showToast('Slide already has a background image'); return }
    const src = slidesRef.current[idx].img || `https://picsum.photos/seed/${Date.now()}/800/500`
    const newImg:   EdElement = { id: 'img0_' + Date.now(), role: 'img',      type: 'image',    src, x: 450, y: 0, w: 450, h: 562 }
    const newGrad:  EdElement = { id: 'grad0_' + Date.now(), role: 'gradient', type: 'gradient', x: 0, y: 0, w: 560, h: 562, from: TBGS[themeRef.current], to: 'transparent', dir: 'to right' }
    ed.current.els[idx]!.unshift(newGrad)
    ed.current.els[idx]!.unshift(newImg)
    edRenderSlide(idx); showToast('Background image added')
  }

  /* ════════════════════════════════════════
     IMAGE INPUT HANDLER
  ════════════════════════════════════════ */
  function edClickReplaceImg(id: string) {
    ed.current.sel = id
    document.getElementById('edImgInput')?.click()
  }

  function edTriggerImg() { document.getElementById('edImgInput')?.click() }

  function edHandleImg(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const src = ev.target!.result as string
      const idx = ed.current.idx
      const els = ed.current.els[idx] || []
      const imgEl = els.find(e => e.id === ed.current.sel && e.type === 'image') || els.find(e => e.type === 'image')
      if (imgEl) { imgEl.src = src; slidesRef.current[idx].img = src }
      edRenderSlide(idx); edRebuildSidebar(); showToast('Image updated ✓')
    }
    reader.readAsDataURL(file)
    ;(e.target as HTMLInputElement).value = ''
  }

  /* ════════════════════════════════════════
     SLIDE MANAGEMENT
  ════════════════════════════════════════ */
  function edAddSlide() {
    const blank: SlideData = { type: 'text', title: 'New Slide', body: 'Click to edit this slide.', img: `https://picsum.photos/seed/${Date.now()}/800/500` }
    const idx = ed.current.idx
    slidesRef.current.splice(idx + 1, 0, blank)
    ed.current.els.splice(idx + 1, 0, null)
    notesRef.current = Object.fromEntries(Object.entries(notesRef.current).map(([k, v]) => [parseInt(k) > idx ? String(parseInt(k) + 1) : k, v]))
    edRebuildSidebar(); edRenderSlide(idx + 1); showToast('Blank slide added')
  }

  function edDupSlide() {
    const idx     = ed.current.idx
    const dupe    = JSON.parse(JSON.stringify(slidesRef.current[idx])) as SlideData
    const dupeEls = JSON.parse(JSON.stringify(ed.current.els[idx] || [])) as EdElement[]
    dupeEls.forEach(el => { el.id = el.id + '_d' + Date.now() + Math.floor(Math.random() * 999) })
    slidesRef.current.splice(idx + 1, 0, dupe)
    ed.current.els.splice(idx + 1, 0, dupeEls)
    edRebuildSidebar(); edRenderSlide(idx + 1); showToast('Slide duplicated')
  }

  function edDeleteSlide() {
    if (slidesRef.current.length <= 1) { showToast("Can't delete the only slide"); return }
    const idx = ed.current.idx
    slidesRef.current.splice(idx, 1)
    ed.current.els.splice(idx, 1)
    const newIdx = Math.min(idx, slidesRef.current.length - 1)
    edRebuildSidebar(); edRenderSlide(newIdx); showToast('Slide deleted')
  }

  /* ════════════════════════════════════════
     PRESENTER MODE
  ════════════════════════════════════════ */
  function openPresenter() {
    edSaveNotes()
    const startIdx = ed.current.idx
    presenterOpenRef.current = true
    setPresenterStartIdx(startIdx)
    setPresenterOpen(true)
  }

  function closePresenter(returnIdx: number) {
    presenterOpenRef.current = false
    setPresenterOpen(false)
    edRenderSlide(returnIdx)
  }

  function getPresenterNotes(slideIdx: number): string {
    return notesRef.current[slideIdx] || slidesRef.current[slideIdx]?.speaker_notes || ''
  }

  function handleExportPdf() {
    exportPdf(slidesRef.current, themeRef.current, deck.name)
  }

  const [pptxExporting, setPptxExporting] = useState(false)
  async function handleExportPptx() {
    setPptxExporting(true)
    try {
      await exportPptx(slidesRef.current, themeRef.current, deck.name)
    } finally {
      setPptxExporting(false)
    }
  }

  /* ════════════════════════════════════════
     SAVE / NOTES
  ════════════════════════════════════════ */
  function edSaveNotes() {
    const inp = document.getElementById('edNotesInput') as HTMLTextAreaElement | null
    if (inp) notesRef.current[ed.current.idx] = inp.value
  }

  function edLoadNotes(idx: number) {
    const inp = document.getElementById('edNotesInput') as HTMLTextAreaElement | null
    if (inp) inp.value = notesRef.current[idx] || ''
  }

  function edSave() {
    const idx = ed.current.idx
    ;(ed.current.els[idx] || []).forEach(el => {
      if (el.type !== 'text') return
      const outer = document.querySelector(`[data-id="${el.id}"]`) as HTMLElement | null
      if (!outer) return
      const inner = outer.querySelector('.text-inner') as HTMLElement | null
      if (inner) el.html = inner.innerHTML
    })
    const t = (ed.current.els[idx] || []).find(e => e.role === 'title')
    if (t) slidesRef.current[idx].title = (t.html || '').replace(/<[^>]*>/g, '')
    showToast('Saved ✓')
  }

  /* ════════════════════════════════════════
     CLOSE EDITOR (sync back to parent)
  ════════════════════════════════════════ */
  function handleClose() {
    // el.html is kept in sync by the input/blur listeners on each text element.
    // Do NOT re-query the DOM here: element ids repeat across slides (title0, b0…)
    // and only the current slide is mounted, so a document-wide query would stamp
    // the visible slide's text over every other slide.
    slidesRef.current.forEach((_, i) => {
      const t = (ed.current.els[i] || []).find(e => e.role === 'title')
      if (t) slidesRef.current[i].title = (t.html || '').replace(/<[^>]*>/g, '')
    })
    onClose({ ...deck, slides: [...slidesRef.current], tray: [...trayRef.current] })
  }

  /* ════════════════════════════════════════
     AI REWRITE
  ════════════════════════════════════════ */
  async function edAiRewrite() {
    const el = (ed.current.els[ed.current.idx] || []).find(e => e.id === ed.current.sel)
    if (!el || el.type !== 'text') { showToast('Select a text element first'); return }
    const current = (el.html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    if (current.length < 3) { showToast('Add some text first'); return }

    const btn = document.getElementById('edAiRewriteBtn') as HTMLButtonElement | null
    if (btn) { btn.disabled = true; btn.textContent = '...' }
    edPushUndo()

    try {
      const slideTitle = slidesRef.current[ed.current.idx]?.title || ''
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: current, context: `Slide topic: "${slideTitle}"` }),
      })
      const data = await res.json() as { result: string }
      el.html = data.result.trim()
      const outer = document.querySelector(`[data-id="${el.id}"]`) as HTMLElement | null
      const div   = (outer?.querySelector('.text-inner') || outer) as HTMLElement | null
      if (div) div.innerHTML = el.html
      showToast('AI rewrite done ✓')
    } catch {
      showToast('AI rewrite failed')
    }

    if (btn) { btn.disabled = false; btn.innerHTML = '✦ AI' }
  }

  /* ════════════════════════════════════════
     CONTEXT MENU
  ════════════════════════════════════════ */
  function edCtxAction(action: string) {
    const menu = document.getElementById('edCtxMenu')
    if (menu) menu.style.display = 'none'
    const id = ctxId.current || ed.current.sel
    if (!id) return
    const els = ed.current.els[ed.current.idx]
    if (!els) return

    if (action === 'del')  { edPushUndo(); edDeleteEl(id) }
    else if (action === 'dup')  { edPushUndo(); edDupEl(id) }
    else if (action === 'movefront') {
      const i = els.findIndex(e => e.id === id)
      if (i < 0) return
      els.push(els.splice(i, 1)[0])
      edRenderSlide(ed.current.idx)
    }
    else if (action === 'moveback') {
      const i = els.findIndex(e => e.id === id)
      if (i < 0) return
      els.unshift(els.splice(i, 1)[0])
      edRenderSlide(ed.current.idx)
    }
  }

  /* ════════════════════════════════════════
     INSERT PANEL
  ════════════════════════════════════════ */
  function switchInsertTab(key: string) {
    setInsertTabKey(key)
    currentTabRef.current = key
    const body = document.getElementById('insertPanelBody')
    if (body) body.innerHTML = key === 'uploads' ? buildTrayHtml() : (INS[key] || '')
  }

  /* ════════════════════════════════════════
     LEFTOVER TRAY (user-uploaded images)
  ════════════════════════════════════════ */
  function buildTrayHtml(): string {
    const items = trayRef.current
    if (!items.length) {
      return `<div style="padding:20px 14px;font-size:12px;color:var(--ed-text3);line-height:1.6;font-family:'DM Sans',sans-serif">
        No leftover images.<br><br>Images you upload when creating a deck land here when they don't
        clearly match a slide. Placed images can be sent back with the “⇢ Tray” button.</div>`
    }
    return `<div style="padding:10px 12px 6px;font-size:11px;color:var(--ed-text3);line-height:1.5;font-family:'DM Sans',sans-serif">
        Drag an image onto the slide to place it (max ${MAX_IMAGES_PER_SLIDE} per slide).</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;padding:6px 12px 12px">` +
      items.map(u =>
        `<img src="${u}" draggable="true" ondragstart="window._df.trayDrag(event,'${u}')"
          style="width:84px;height:84px;object-fit:cover;border-radius:8px;border:1px solid var(--ed-border);cursor:grab">`
      ).join('') +
      `</div>`
  }

  function refreshTrayPanel() {
    if (currentTabRef.current !== 'uploads') return
    const body = document.getElementById('insertPanelBody')
    if (body) body.innerHTML = buildTrayHtml()
  }

  function trayDrag(ev: DragEvent, url: string) {
    ev.dataTransfer?.setData('text/plain', url)
    if (ev.dataTransfer) ev.dataTransfer.effectAllowed = 'copy'
  }

  function placeFromTray(url: string) {
    const idx = ed.current.idx
    const slide = slidesRef.current[idx]
    if (!slide) return
    const extras = (slide.extraImgs ?? []).filter((u): u is string => typeof u === 'string')
    const count = (isUploadUrl(slide.img) ? 1 : 0) + extras.filter(isUploadUrl).length
    if (count >= MAX_IMAGES_PER_SLIDE) { showToast(`This slide already has ${MAX_IMAGES_PER_SLIDE} images`); return }
    if (!isUploadUrl(slide.img)) {
      slide.img = url // uploads take the primary slot over stock/AI
    } else {
      slide.extraImgs = [...extras, url]
    }
    trayRef.current = trayRef.current.filter(u => u !== url)
    ed.current.els[idx] = buildEdEls(slide, themeRef.current, idx)
    edRenderSlide(idx)
    edRebuildSidebar()
    refreshTrayPanel()
    showToast('Image placed ✓')
  }

  function removeToTray(src: string) {
    const idx = ed.current.idx
    const slide = slidesRef.current[idx]
    if (!slide) return
    if (slide.img === src) {
      const extras = (slide.extraImgs ?? []).filter((u): u is string => typeof u === 'string')
      slide.img = extras[0] ?? ''
      slide.extraImgs = extras.slice(1)
    } else {
      slide.extraImgs = (slide.extraImgs ?? []).filter(u => u !== src)
    }
    if (!trayRef.current.includes(src)) trayRef.current = [...trayRef.current, src]
    ed.current.els[idx] = buildEdEls(slide, themeRef.current, idx)
    edRenderSlide(idx)
    edRebuildSidebar()
    refreshTrayPanel()
    showToast('Moved to tray')
  }

  function filterInsertBlocks(query: string) {
    const q = query.toLowerCase()
    document.querySelectorAll('#insertPanelBody .insert-block').forEach(b => {
      const name = b.querySelector('.insert-block-name')?.textContent?.toLowerCase() || ''
      ;(b as HTMLElement).style.display = name.includes(q) ? '' : 'none'
    })
  }

  function insertBlock(type: string) {
    const acc = TACCS[themeRef.current]
    const txt = TTXTS[themeRef.current]
    const t   = Date.now()
    const base = { role: 'extra', type: 'text' as const, bold: false, italic: false, underline: false, align: 'left' as const }

    const cfgs: Record<string, Partial<EdElement>> = {
      title:          { html: 'Title Text',           x: 60, y: 200, w: 400, h: 70,  fontSize: 36, bold: true,   color: txt },
      h1:             { html: 'Heading 1',            x: 60, y: 200, w: 380, h: 58,  fontSize: 28, bold: true,   color: txt },
      h2:             { html: 'Heading 2',            x: 60, y: 200, w: 380, h: 48,  fontSize: 22, bold: true,   color: txt },
      h3:             { html: 'Heading 3',            x: 60, y: 200, w: 380, h: 38,  fontSize: 17, bold: true,   color: txt },
      body:           { html: 'Body text goes here. Click to edit this paragraph.', x: 60, y: 200, w: 380, h: 100, fontSize: 14, color: txt },
      label:          { html: 'LABEL',               x: 60, y: 200, w: 180, h: 28,  fontSize: 11, bold: true,   uppercase: true, color: acc },
      quote:          { html: '"A great quote here."', x: 60, y: 200, w: 380, h: 80, fontSize: 18, italic: true, color: txt },
      'bullet-list':  { html: '<ul style="margin:0;padding:0 0 0 18px"><li>First item</li><li>Second item</li><li>Third item</li></ul>',   x: 60, y: 200, w: 380, h: 100, fontSize: 14, color: txt },
      'numbered-list':{ html: '<ol style="margin:0;padding:0 0 0 18px"><li>First step</li><li>Second step</li><li>Third step</li></ol>',   x: 60, y: 200, w: 380, h: 100, fontSize: 14, color: txt },
      'arrow-list':   { html: '<ul style="margin:0;padding:0;list-style:none"><li>→ First item</li><li>→ Second item</li><li>→ Third item</li></ul>', x: 60, y: 200, w: 380, h: 100, fontSize: 14, color: txt },
      'table2x2':     { html: `<table style="border-collapse:collapse;width:100%;font-size:13px"><tr><td style="border:1px solid rgba(255,255,255,.25);padding:8px">Cell A</td><td style="border:1px solid rgba(255,255,255,.25);padding:8px">Cell B</td></tr><tr><td style="border:1px solid rgba(255,255,255,.25);padding:8px">Cell C</td><td style="border:1px solid rgba(255,255,255,.25);padding:8px">Cell D</td></tr></table>`, x: 60, y: 180, w: 400, h: 120, fontSize: 13, color: txt },
      'table3x3':     { html: `<table style="border-collapse:collapse;width:100%;font-size:12px"><tr><td style="border:1px solid rgba(255,255,255,.25);padding:6px">A1</td><td style="border:1px solid rgba(255,255,255,.25);padding:6px">B1</td><td style="border:1px solid rgba(255,255,255,.25);padding:6px">C1</td></tr><tr><td style="border:1px solid rgba(255,255,255,.25);padding:6px">A2</td><td style="border:1px solid rgba(255,255,255,.25);padding:6px">B2</td><td style="border:1px solid rgba(255,255,255,.25);padding:6px">C2</td></tr><tr><td style="border:1px solid rgba(255,255,255,.25);padding:6px">A3</td><td style="border:1px solid rgba(255,255,255,.25);padding:6px">B3</td><td style="border:1px solid rgba(255,255,255,.25);padding:6px">C3</td></tr></table>`, x: 60, y: 180, w: 440, h: 140, fontSize: 12, color: txt },
      'note-box':     { html: `<div style="background:rgba(42,92,255,.12);border:1px solid rgba(42,92,255,.3);border-radius:8px;padding:12px;font-size:13px">📝 Note: Add your note here.</div>`,    x: 60, y: 200, w: 380, h: 80, fontSize: 13, color: txt },
      'info-box':     { html: `<div style="background:rgba(96,165,250,.12);border:1px solid rgba(96,165,250,.3);border-radius:8px;padding:12px;font-size:13px">ℹ️ Info: Add information here.</div>`,  x: 60, y: 200, w: 380, h: 80, fontSize: 13, color: txt },
      'warning-box':  { html: `<div style="background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.3);border-radius:8px;padding:12px;font-size:13px">⚠️ Warning: Add your warning here.</div>`, x: 60, y: 200, w: 380, h: 80, fontSize: 13, color: txt },
      'success-box':  { html: `<div style="background:rgba(52,211,153,.12);border:1px solid rgba(52,211,153,.3);border-radius:8px;padding:12px;font-size:13px">✅ Success: note here.</div>`, x: 60, y: 200, w: 380, h: 80, fontSize: 13, color: txt },
    }

    const cfg = cfgs[type] || cfgs.body
    const el: EdElement = { ...base, ...cfg, id: 'txt_' + t } as EdElement
    edPushUndo()
    const els = ed.current.els[ed.current.idx]
    if (els) els.push(el)
    edRenderSlide(ed.current.idx)
    setTimeout(() => edSelect(el.id), 30)
  }

  function insertLayout(type: string) {
    const txt = TTXTS[themeRef.current]
    const acc = TACCS[themeRef.current]
    const t   = Date.now()
    edPushUndo()
    const els = ed.current.els[ed.current.idx]
    if (!els) return

    if (type === '2col') {
      els.push({ id:'c1_'+t, role:'extra', type:'text', html:'Column 1 text here.', x:48, y:180, w:380, h:140, fontSize:14, color:txt, align:'left' } as EdElement)
      els.push({ id:'c2_'+t, role:'extra', type:'text', html:'Column 2 text here.', x:472, y:180, w:380, h:140, fontSize:14, color:txt, align:'left' } as EdElement)
    } else if (type === '3col') {
      ;[0,1,2].forEach(i => els.push({ id:`col${i}_${t}`, role:'extra', type:'text', html:`Column ${i+1}`, x:48+i*286, y:180, w:264, h:130, fontSize:14, color:txt, align:'left' } as EdElement))
    } else if (type === '4col') {
      ;[0,1,2,3].forEach(i => els.push({ id:`col${i}_${t}`, role:'extra', type:'text', html:`Col ${i+1}`, x:48+i*213, y:180, w:195, h:130, fontSize:13, color:txt, align:'left' } as EdElement))
    } else if (type === 'solid-boxes') {
      ;[0,1,2].forEach(i => {
        els.push({ id:`sb${i}_${t}`, role:'extra', type:'gradient', x:48+i*286, y:160, w:260, h:160, from:acc, to:acc, dir:'to right' } as EdElement)
        els.push({ id:`sbt${i}_${t}`, role:'extra', type:'text', html:`Box ${i+1}`, x:64+i*286, y:188, w:228, h:100, fontSize:16, bold:true, color:'#ffffff', align:'center' } as EdElement)
      })
    } else if (type === 'outline-boxes') {
      ;[0,1,2].forEach(i => els.push({ id:`ob${i}_${t}`, role:'extra', type:'text', html:`<div style="border:2px solid ${acc};border-radius:8px;padding:16px;text-align:center;font-size:14px">Box ${i+1}<br><span style="font-size:12px;opacity:.7">Subtitle</span></div>`, x:48+i*286, y:160, w:260, h:140, fontSize:14, color:txt, align:'left' } as EdElement))
    } else if (type === 'process-steps') {
      ;[0,1,2,3].forEach(i => {
        els.push({ id:`ps${i}_${t}`, role:'extra', type:'gradient', x:48+i*213, y:200, w:26, h:26, from:acc, to:acc, dir:'to right' } as EdElement)
        els.push({ id:`pst${i}_${t}`, role:'extra', type:'text', html:String(i+1), x:48+i*213, y:200, w:26, h:26, fontSize:13, bold:true, color:'#fff', align:'center' } as EdElement)
        els.push({ id:`psl${i}_${t}`, role:'extra', type:'text', html:`Step ${i+1}`, x:48+i*213, y:238, w:195, h:80, fontSize:13, color:txt, align:'left' } as EdElement)
        if (i < 3) els.push({ id:`arr${i}_${t}`, role:'extra', type:'text', html:'→', x:185+i*213, y:200, w:40, h:28, fontSize:18, color:acc, align:'center' } as EdElement)
      })
    } else if (type === 'large-bullets') {
      ;[0,1,2].forEach(i => {
        els.push({ id:`lbd${i}_${t}`, role:'extra', type:'gradient', x:48, y:160+i*96, w:10, h:10, from:acc, to:acc, dir:'to right' } as EdElement)
        els.push({ id:`lbt${i}_${t}`, role:'extra', type:'text', html:`Bullet point ${i+1}`, x:74, y:150+i*96, w:780, h:80, fontSize:18, color:txt, align:'left' } as EdElement)
      })
    }

    edRenderSlide(ed.current.idx)
    showToast(type + ' layout inserted')
  }

  function insertChart(type: string) {
    const data  = getDefaultChartData(type)
    const svg   = buildChartSVG(type, data)
    const elId  = 'chart_' + Date.now()
    chartData.current[elId] = { type, data }
    const label = type.charAt(0).toUpperCase() + type.slice(1)
    const el: EdElement = {
      id: elId, role: 'extra', type: 'chart', chartType: type,
      html: `<div style="display:flex;flex-direction:column;align-items:center;gap:6px" ondblclick="window._df.openChartEditor('${elId}')">${svg}<div style="font-size:11px;opacity:.5">${label} chart · double-click to edit</div></div>`,
      x: 50, y: 150, w: 310, h: 220, fontSize: 13, color: '#fff', align: 'center',
    }
    edPushUndo()
    ed.current.els[ed.current.idx]?.push(el)
    edRenderSlide(ed.current.idx)
    setTimeout(() => edSelect(el.id), 30)
    showToast(label + ' chart added — double-click to edit data')
  }

  function insertDiagram(type: string) {
    const data  = getDefaultChartData(type)
    const svg   = buildDiagramSVG(type, data)
    const elId  = 'diag_' + Date.now()
    chartData.current[elId] = { type, data }
    const label = type.charAt(0).toUpperCase() + type.slice(1)
    const w = type === 'timeline' ? 340 : 280
    const h = type === 'timeline' ? 120 : 220
    const el: EdElement = {
      id: elId, role: 'extra', type: 'chart', chartType: type,
      html: `<div style="display:flex;flex-direction:column;align-items:center;gap:6px" ondblclick="window._df.openChartEditor('${elId}')">${svg}<div style="font-size:11px;opacity:.5">${label} diagram · double-click to edit</div></div>`,
      x: 50, y: 150, w, h, fontSize: 13, color: '#fff', align: 'center',
    }
    edPushUndo()
    ed.current.els[ed.current.idx]?.push(el)
    edRenderSlide(ed.current.idx)
    setTimeout(() => edSelect(el.id), 30)
    showToast(label + ' diagram added')
  }

  function insertStockPhoto() {
    const seed  = Math.floor(Math.random() * 1000)
    const url   = `https://picsum.photos/seed/${seed}/800/500`
    const idx   = ed.current.idx
    const imgEl = (ed.current.els[idx] || []).find(e => e.type === 'image')
    if (imgEl) { imgEl.src = url; slidesRef.current[idx].img = url }
    edRenderSlide(idx); edRebuildSidebar(); showToast('Stock photo inserted ✓')
  }

  async function insertAiImage() {
    const prompt = (document.getElementById('insertAiPrompt') as HTMLInputElement | null)?.value.trim()
    if (!prompt) { showToast('Enter a prompt first'); return }
    showToast('Generating image…')
    const seed = Math.floor(Math.random() * 99999)
    const url  = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=500&seed=${seed}&nologo=true`
    const tmp  = new Image()
    tmp.onload = () => {
      const idx   = ed.current.idx
      const imgEl = (ed.current.els[idx] || []).find(e => e.type === 'image')
      if (imgEl) { imgEl.src = url; slidesRef.current[idx].img = url }
      edRenderSlide(idx); edRebuildSidebar(); showToast('AI image inserted ✓')
    }
    tmp.onerror = () => showToast('Image generation failed — try again')
    tmp.src = url
  }

  function insertMedia(type: string) {
    showToast(`${type} embed coming in Pro — showing placeholder`)
    const el: EdElement = {
      id: 'media_' + Date.now(), role: 'extra', type: 'text',
      html: `<div style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:10px;padding:16px;text-align:center;font-size:13px;opacity:.7">${type==='youtube'?'▶️ YouTube embed':type==='figma'?'🎨 Figma embed':'🌐 Webpage embed'}</div>`,
      x: 60, y: 200, w: 340, h: 90, fontSize: 13, color: TTXTS[themeRef.current], align: 'center',
    }
    edPushUndo()
    ed.current.els[ed.current.idx]?.push(el)
    edRenderSlide(ed.current.idx)
    setTimeout(() => edSelect(el.id), 30)
  }

  /* ════════════════════════════════════════
     CHART EDITOR MODAL
  ════════════════════════════════════════ */
  function openChartEditor(elId: string) {
    const cd = chartData.current[elId]
    if (!cd) return
    closeChartEditor()
    const modal = document.createElement('div')
    modal.id = 'chartEditorModal'
    modal.style.cssText = 'position:fixed;inset:0;z-index:600;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.7)'
    const type   = cd.type
    const isDiag = ['venn','swot','funnel','target','orbit','pyramid','cycle','timeline','mindmap','flowchart','quadrant','comparison'].includes(type)
    const d      = cd.data as Record<string, unknown>

    let fields = ''
    if (!isDiag && d.values) {
      const vals   = d.values as number[]
      const labels = d.labels as string[]
      vals.forEach((v: number, i: number) => {
        fields += `<div style="display:flex;gap:8px;margin-bottom:6px"><input id="cel_${i}" value="${labels[i]||''}" placeholder="Label" style="${inpStyle}"><input id="cev_${i}" type="number" value="${v}" style="${inpStyle} width:70px"></div>`
      })
    } else if (type === 'venn' && d.vennLabels) {
      (d.vennLabels as string[]).forEach((l, i) => { fields += `<div style="margin-bottom:6px"><input id="vl${i}" value="${l}" style="${inpStyle}"></div>` })
    } else if (type === 'swot' && d.swotLabels) {
      const names = ['Strengths','Weaknesses','Opportunities','Threats']
      ;(d.swotLabels as string[]).forEach((l, i) => { fields += `<div style="margin-bottom:6px"><label style="font-size:11px;color:#888;display:block;margin-bottom:2px">${names[i]}</label><input id="cel_${i}" value="${l}" style="${inpStyle}"></div>` })
    } else if (d.pyramidLevels || d.cycleSteps || d.targetRings) {
      const arr = (d.pyramidLevels || d.cycleSteps || d.targetRings) as string[]
      arr.forEach((l, i) => { fields += `<div style="margin-bottom:6px"><input id="cel_${i}" value="${l}" style="${inpStyle}"></div>` })
    } else {
      fields = '<div style="color:#888;font-size:13px;padding:16px 0">Default data — select a data-driven chart type to edit values.</div>'
    }

    modal.innerHTML = `
      <div style="background:#18181e;border:1px solid #3a3a3e;border-radius:16px;padding:28px;max-width:420px;width:90%;max-height:80vh;overflow-y:auto;font-family:'DM Sans',sans-serif">
        <div style="font-size:15px;font-weight:700;color:#fff;margin-bottom:4px">${type.charAt(0).toUpperCase()+type.slice(1)} ${isDiag?'diagram':'chart'}</div>
        <div style="font-size:12px;color:#888;margin-bottom:18px">Edit the data below and click Apply.</div>
        ${fields}
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
          <button onclick="window._df.closeChartEditor()" style="background:#27272a;border:1px solid #3a3a3e;color:#aaa;padding:8px 18px;border-radius:8px;cursor:pointer;font-size:13px;font-family:'DM Sans',sans-serif">Cancel</button>
          <button onclick="window._df.applyChartEdit('${elId}')" style="background:#2a5cff;border:none;color:#fff;padding:8px 18px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;font-family:'DM Sans',sans-serif">Apply</button>
        </div>
      </div>`
    ;(modal as HTMLElement & { _elId?: string })._elId = elId
    document.body.appendChild(modal)
  }

  const inpStyle = "background:#27272a;border:1px solid #3a3a3e;border-radius:7px;padding:7px 10px;color:#fff;font-size:12px;font-family:'DM Sans',sans-serif;outline:none;flex:1"

  function closeChartEditor() {
    document.getElementById('chartEditorModal')?.remove()
  }

  function applyChartEdit(elId: string) {
    const cd = chartData.current[elId]
    if (!cd) { closeChartEditor(); return }
    const type   = cd.type
    const d      = cd.data as Record<string, unknown>
    const isDiag = ['venn','swot','funnel','target','orbit','pyramid','cycle','timeline','mindmap','flowchart','quadrant','comparison'].includes(type)

    if (!isDiag && d.values) {
      const vals = d.values as number[]
      vals.forEach((_: number, i: number) => {
        const li = document.getElementById(`cel_${i}`) as HTMLInputElement | null
        const vi = document.getElementById(`cev_${i}`) as HTMLInputElement | null
        if (li) (d.labels as string[])[i] = li.value
        if (vi) (d.values as number[])[i] = parseFloat(vi.value) || 0
      })
    } else if (type === 'venn' && d.vennLabels) {
      ;(d.vennLabels as string[]).forEach((_: string, i: number) => {
        const li = document.getElementById(`vl${i}`) as HTMLInputElement | null
        if (li) (d.vennLabels as string[])[i] = li.value
      })
    } else if (type === 'swot' && d.swotLabels) {
      ;(d.swotLabels as string[]).forEach((_: string, i: number) => {
        const li = document.getElementById(`cel_${i}`) as HTMLInputElement | null
        if (li) (d.swotLabels as string[])[i] = li.value
      })
    } else if (d.pyramidLevels || d.cycleSteps || d.targetRings) {
      const arr = (d.pyramidLevels || d.cycleSteps || d.targetRings) as string[]
      arr.forEach((_: string, i: number) => {
        const li = document.getElementById(`cel_${i}`) as HTMLInputElement | null
        if (li) arr[i] = li.value
      })
    }

    const newSVG = isDiag ? buildDiagramSVG(type, d) : buildChartSVG(type, d)
    const label  = type.charAt(0).toUpperCase() + type.slice(1)
    const el     = (ed.current.els[ed.current.idx] || []).find(e => e.id === elId)
    if (el) {
      el.html = `<div style="display:flex;flex-direction:column;align-items:center;gap:6px" ondblclick="window._df.openChartEditor('${elId}')">${newSVG}<div style="font-size:11px;opacity:.5">${label} ${isDiag?'diagram':'chart'} · double-click to edit</div></div>`
      const outer      = document.querySelector(`[data-id="${elId}"]`) as HTMLElement | null
      const chartInner = outer?.querySelector('.chart-inner') as HTMLElement | null
      if (chartInner) chartInner.innerHTML = el.html
    }
    closeChartEditor()
    showToast('Chart updated ✓')
  }

  /* ════════════════════════════════════════
     GLOBAL EVENT LISTENERS + WINDOW FUNCTIONS
  ════════════════════════════════════════ */
  useEffect(() => {
    // Build initial elements for all slides
    slidesRef.current.forEach((_, i) => {
      if (!ed.current.els[i]) {
        ed.current.els[i] = buildEdEls(slidesRef.current[i] || {}, themeRef.current, i)
      }
    })
    edRebuildSidebar()
    edRenderSlide(0)
    edSetMode('edit')
    switchInsertTab('blocks')

    // Expose functions on window for innerHTML onclick handlers
    const w = window as Window & { _df?: Record<string, unknown> }
    w._df = {
      insertBlock, insertLayout, insertChart, insertDiagram,
      insertStockPhoto, insertAiImage, insertMedia,
      openChartEditor, closeChartEditor, applyChartEdit,
      edTriggerImg, filterBlocks: filterInsertBlocks,
      trayDrag,
    }

    // Accept tray-image drops anywhere on the canvas
    const canvasEl = document.getElementById('edCanvas')
    const onCanvasDragOver = (e: DragEvent) => { e.preventDefault() }
    const onCanvasDrop = (e: DragEvent) => {
      e.preventDefault()
      const url = e.dataTransfer?.getData('text/plain') ?? ''
      if (isUploadUrl(url)) placeFromTray(url)
    }
    canvasEl?.addEventListener('dragover', onCanvasDragOver)
    canvasEl?.addEventListener('drop', onCanvasDrop)

    // Mouse drag/resize
    function onMouseMove(e: MouseEvent) {
      if (ed.current.drag) {
        const canvas = document.getElementById('edCanvas') as HTMLElement
        if (!canvas) return
        const cr = canvas.getBoundingClientRect()
        const sc = cr.width / ed.current.W
        const x  = Math.max(-50, Math.min(ed.current.W - 10, (e.clientX - cr.left) / sc - ed.current.drag.offX))
        const y  = Math.max(-30, Math.min(ed.current.H - 10, (e.clientY - cr.top) / sc - ed.current.drag.offY))
        ed.current.drag.el.x = x; ed.current.drag.el.y = y
        ed.current.drag.div.style.left = x + 'px'
        ed.current.drag.div.style.top  = y + 'px'
      }
      if (ed.current.resize) {
        const r  = ed.current.resize
        const canvas = document.getElementById('edCanvas') as HTMLElement
        if (!canvas) return
        const cr = canvas.getBoundingClientRect()
        const sc = cr.width / ed.current.W
        const dx = (e.clientX - r.startX) / sc
        const dy = (e.clientY - r.startY) / sc
        let x = r.startElX, y = r.startElY, w = r.startW, h = r.startH
        if (r.handle.includes('e')) w = Math.max(30, r.startW + dx)
        if (r.handle.includes('s')) h = Math.max(20, r.startH + dy)
        if (r.handle.includes('w')) { w = Math.max(30, r.startW - dx); x = r.startElX + (r.startW - w) }
        if (r.handle.includes('n')) { h = Math.max(20, r.startH - dy); y = r.startElY + (r.startH - h) }
        r.el.x=x; r.el.y=y; r.el.w=w; r.el.h=h
        r.div.style.left  = x + 'px'; r.div.style.top  = y + 'px'
        r.div.style.width = w + 'px'; r.div.style.height = h + 'px'
      }
    }

    function onMouseUp() {
      if (ed.current.drag || ed.current.resize) edPushUndo()
      ed.current.drag = null; ed.current.resize = null
    }

    // Deselect on canvas background click
    function onCanvasClick(e: MouseEvent) {
      const canvas = document.getElementById('edCanvas')
      const bg     = document.getElementById('edCanvasBg')
      if (e.target === canvas || e.target === bg) {
        ed.current.sel = null
        document.querySelectorAll('.ed-el').forEach(d => d.classList.remove('selected'))
      }
    }

    // Right-click context menu
    function onContextMenu(e: MouseEvent) {
      const edEl = (e.target as HTMLElement).closest('.ed-el') as HTMLElement | null
      if (!edEl) return
      e.preventDefault()
      ctxId.current = edEl.dataset.id || null
      edSelect(ctxId.current!)
      const menu = document.getElementById('edCtxMenu')
      if (!menu) return
      menu.style.display = 'block'
      let x = e.clientX, y = e.clientY
      if (x + 160 > window.innerWidth)  x = window.innerWidth  - 165
      if (y + 160 > window.innerHeight) y = window.innerHeight - 165
      menu.style.left = x + 'px'; menu.style.top = y + 'px'
    }

    function onDocClick(e: MouseEvent) {
      const menu = document.getElementById('edCtxMenu')
      if (menu && !menu.contains(e.target as Node)) menu.style.display = 'none'
    }

    // Keyboard shortcuts
    function onKeyDown(e: KeyboardEvent) {
      if (presenterOpenRef.current) return
      // Undo/redo
      const mod = navigator.platform.includes('Mac') ? e.metaKey : e.ctrlKey
      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); edUndo(); return }
      if (mod && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); edRedo(); return }

      // Delete key
      if ((e.key === 'Delete' || e.key === 'Backspace') && ed.current.sel) {
        const tgt = document.activeElement as HTMLElement
        if (tgt?.contentEditable === 'true' || tgt?.tagName === 'INPUT' || tgt?.tagName === 'TEXTAREA') return
        e.preventDefault(); edPushUndo(); edDeleteEl(ed.current.sel); return
      }

      // Arrow nav in view mode
      const edDiv = document.getElementById('deckEditor')
      if (edDiv && !document.getElementById('deckEditor')?.classList.contains('open')) return
      const tag = (document.activeElement as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (document.activeElement as HTMLElement)?.contentEditable === 'true') return
      if (!isEditMode) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); edNavSlide(1) }
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); edNavSlide(-1) }
      }
      if (e.key === 'e' || e.key === 'E') edSetMode('edit')
      if (e.key === 'v' || e.key === 'V') edSetMode('view')
      if (e.key === 'Escape') { closeChartEditor(); const menu = document.getElementById('edCtxMenu'); if (menu) menu.style.display='none' }
    }

    const canvas = document.getElementById('edCanvas')
    canvas?.addEventListener('mousedown', onCanvasClick as EventListener)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup',   onMouseUp)
    document.addEventListener('contextmenu', onContextMenu)
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', edScaleCanvas)

    return () => {
      canvas?.removeEventListener('mousedown', onCanvasClick as EventListener)
      canvasEl?.removeEventListener('dragover', onCanvasDragOver)
      canvasEl?.removeEventListener('drop', onCanvasDrop)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup',   onMouseUp)
      document.removeEventListener('contextmenu', onContextMenu)
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', edScaleCanvas)
      delete w._df
      closeChartEditor()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync incoming AI image URLs into the frozen slidesRef without blowing away user edits.
  // Fires whenever the parent deck prop updates (e.g. each time an AI image lands).
  // Only touches the .img field — all text/layout edits in ed.current.els are preserved.
  useEffect(() => {
    let sidebarDirty = false
    deck.slides.forEach((incoming, idx) => {
      if (!slidesRef.current[idx]) return
      const currentImg = slidesRef.current[idx].img as string | undefined
      const newImg = incoming.img as string | undefined
      const imgChanged = !!newImg && newImg !== currentImg

      // extraImgs can arrive late too (vision matching placing several user
      // uploads on one slide while the editor is open).
      const curExtra = JSON.stringify(slidesRef.current[idx].extraImgs ?? [])
      const newExtra = JSON.stringify(incoming.extraImgs ?? [])
      const extraChanged = newExtra !== curExtra && (incoming.extraImgs?.length ?? 0) > 0

      if (!imgChanged && !extraChanged) return

      slidesRef.current[idx] = {
        ...slidesRef.current[idx],
        ...(imgChanged ? { img: newImg } : {}),
        ...(extraChanged ? { extraImgs: [...(incoming.extraImgs ?? [])] } : {}),
      }

      // If the slide already had a real image and only the URL changed, patch
      // in place to preserve any in-session element edits. Any structural
      // change (no-image → image variant, or extra images) needs a rebuild.
      const els = ed.current.els[idx]
      if (els) {
        const hadRealImg = !!(currentImg && !currentImg.includes('picsum.photos'))
        const imgEl = els.find(e => (e as { role?: string }).role === 'img')
        if (imgChanged && !extraChanged && hadRealImg && imgEl) {
          (imgEl as { src?: string }).src = newImg
        } else {
          ed.current.els[idx] = buildEdEls(slidesRef.current[idx], themeRef.current, idx)
        }
      }

      if (idx === ed.current.idx) edRenderSlide(idx)
      sidebarDirty = true
    })
    if (sidebarDirty) edRebuildSidebar()

    // Tray sync: merge the incoming tray with local state rather than
    // replacing it — the union minus anything currently placed on a slide
    // converges whether the change came from background matching (new items)
    // or from the user dragging an item out locally (placed → filtered out).
    const placed = new Set<string>()
    slidesRef.current.forEach(s => {
      if (isUploadUrl(s.img)) placed.add(s.img as string)
      ;(s.extraImgs ?? []).forEach(u => { if (isUploadUrl(u)) placed.add(u) })
    })
    const union = Array.from(new Set([...(deck.tray ?? []), ...trayRef.current])).filter(u => !placed.has(u))
    if (JSON.stringify(union) !== JSON.stringify(trayRef.current)) {
      trayRef.current = union
      refreshTrayPanel()
      setTrayTick(t => t + 1) // update the "📥 Yours (n)" tab label
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck.slides, deck.tray]) // imperative fns are stable over refs

  /* ════════════════════════════════════════
     RENDER
  ════════════════════════════════════════ */
  const FONTS = ['DM Sans','DM Serif Display','Inter','Georgia','Helvetica Neue','Courier New','Playfair Display','Montserrat','Oswald']
  const SIZES = [10,12,14,16,18,22,24,28,32,36,48,64,80]

  return (
    <div id="deckEditor" className="open">
      {/* ── Left: Slide list ── */}
      <div className="ed-sidebar">
        <div className="ed-sidebar-hdr">
          <button className="ed-back-btn" onClick={handleClose} title="Back to My Presentations">←</button>
          <span className="ed-sidebar-title">Slides</span>
        </div>
        <div className="ed-slide-list" id="edSlideList" />
        <div className="ed-slide-ops">
          <div className="ed-slide-op" onClick={edAddSlide}    title="Add blank slide">＋ Add</div>
          <div className="ed-slide-op" onClick={edDupSlide}    title="Duplicate current">⊕ Dup</div>
          <div className="ed-slide-op danger" onClick={edDeleteSlide} title="Delete current">✕ Del</div>
        </div>
      </div>

      {/* ── Center: Topbar + Canvas ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div className="ed-topbar" id="edTopbar">

          {/* Row 1: always visible */}
          <div className="ed-topbar-row">
            <button className="ed-nav-btn" id="edPrevBtn" onClick={() => edNavSlide(-1)}>‹</button>
            <span className="ed-slide-label" id="edLabel">1/{slideCountState}</span>
            <button className="ed-nav-btn" id="edNextBtn" onClick={() => edNavSlide(1)}>›</button>
            <div className="ed-sep" />
            <button
              className={`ed-mode-btn${!isEditMode ? ' active' : ''}`}
              onClick={() => edSetMode('view')}
              title="View mode (V)"
            >👁 View</button>
            <button
              className={`ed-mode-btn${isEditMode ? ' active' : ''}`}
              onClick={() => edSetMode('edit')}
              title="Edit mode (E)"
            >✏️ Edit</button>
            <div className="ed-sep" />
            <button
              className="ed-mode-btn"
              onClick={openPresenter}
              title="Present fullscreen"
              style={{ background: 'var(--ed-accent)', color: '#fff', borderColor: 'var(--ed-accent)' }}
            >▶ Present</button>
            <div className="ed-sep" />
            <span className="ed-deck-meta" id="edDeckMeta" title="Deck topic">
              {deck.name.length > 40 ? deck.name.slice(0, 40) + '…' : deck.name}
            </span>
            <div style={{ flex: 1, minWidth: 8 }} />
            <button
              className="ed-save-btn"
              onClick={() => setTutStep(0)}
              title="Show tutorial"
              style={{ background: 'var(--ed-surface)', border: '1px solid var(--ed-border)', color: 'var(--ed-text2)', marginLeft: 4, width: 30, padding: 0 }}
            >
              ?
            </button>
            <button
              className="ed-save-btn"
              onClick={handleExportPdf}
              title="Export all slides as PDF"
              style={{ background: 'var(--ed-surface)', border: '1px solid var(--ed-border)', color: 'var(--ed-text2)', marginLeft: 4 }}
            >
              PDF
            </button>
            <button
              className="ed-save-btn"
              onClick={handleExportPptx}
              disabled={pptxExporting}
              title="Export as editable PowerPoint"
              style={{ background: 'var(--ed-surface)', border: '1px solid var(--ed-border)', color: 'var(--ed-text2)', marginLeft: 4 }}
            >
              {pptxExporting ? '…' : 'PPTX'}
            </button>
            <button className="ed-save-btn" id="edSaveBtn" onClick={edSave} style={{ marginLeft: 4 }}>✓ Save</button>
            <button
              className="ed-save-btn"
              onClick={handleClose}
              style={{ background: 'var(--ed-surface)', border: '1px solid var(--ed-border)', color: 'var(--ed-text2)', marginLeft: 4 }}
            >
              ✕ Close
            </button>
          </div>

          {/* Row 2: formatting (edit-only) */}
          <div className="ed-topbar-row2 ed-edit-only">
            <select
              className="ed-font-pick"
              value={fontFamily}
              onChange={e => edFormat('font', e.target.value)}
              title="Font family"
            >
              {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <select
              className="ed-font-size"
              value={fontSize}
              onChange={e => edFormat('size', e.target.value)}
            >
              {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <button className={`ed-tool-btn${bold ? ' active' : ''}`}      onClick={() => edFormat('bold')}><b>B</b></button>
            <button className={`ed-tool-btn${italic ? ' active' : ''}`}    onClick={() => edFormat('italic')}><i>I</i></button>
            <button className={`ed-tool-btn${underline ? ' active' : ''}`} onClick={() => edFormat('under')}><u>U</u></button>
            <div className="ed-sep" />
            <button className="ed-tool-btn" onClick={() => edFormat('align','left')}   title="Align left">⬅</button>
            <button className="ed-tool-btn" onClick={() => edFormat('align','center')} title="Align centre">⬛</button>
            <button className="ed-tool-btn" onClick={() => edFormat('align','right')}  title="Align right">➡</button>
            <div className="ed-sep" />
            <div className="ed-color-wrap" title="Text colour">
              <input
                type="color"
                value={color}
                onChange={e => edFormat('color', e.target.value)}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
              />
              <div className="ed-color-swatch" style={{ background: color }} />
            </div>
            <div className="ed-sep" />
            <button className="ed-tool-btn" onClick={() => { edPushUndo(); edAddText() }}>＋ Text</button>
            <button className="ed-tool-btn" onClick={edTriggerImg} title="Upload image">🖼</button>
            <input type="file" id="edImgInput" accept="image/*" style={{ display: 'none' }} onChange={e => edHandleImg(e.nativeEvent as Event)} />
            <div className="ed-sep" />
            <button className="ed-tool-btn" onClick={edReplaceBg} title="Replace background">🖼 BG</button>
            <button className="ed-tool-btn" onClick={edToggleBg}  title="Toggle background visibility">👁 BG</button>
            <button className="ed-tool-btn" onClick={edClearBg}   title="Remove background">✕ BG</button>
            <button className="ed-tool-btn" onClick={edAddBg}     title="Add background">＋ BG</button>
            <div className="ed-sep" />
            <button className="ed-undo-btn" disabled={undoDisabled} onClick={edUndo} title="Undo (⌘Z)">↩</button>
            <button className="ed-undo-btn" disabled={redoDisabled} onClick={edRedo} title="Redo (⌘Y)">↪</button>
            <button className="ed-ai-btn" id="edAiRewriteBtn" onClick={edAiRewrite} title="AI rewrite selected text">✦ AI</button>
          </div>
        </div>

        {/* Canvas area */}
        <div className="ed-main" id="edMain">
          <div className="ed-canvas" id="edCanvas">
            <div className="ed-canvas-bg" id="edCanvasBg" />
          </div>
          <div
            id="edHint"
            style={{
              position: 'absolute', bottom: 88, left: 0, right: 0, textAlign: 'center',
              fontSize: 11, color: 'var(--ed-muted)', pointerEvents: 'none',
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            Click to select · Drag dots to move · Resize from corners · Double-click text to edit · Right-click for menu
          </div>
        </div>

        {/* Speaker notes strip (edit mode only) */}
        <div className="ed-notes-strip ed-edit-only">
          <span className="ed-notes-label">Notes</span>
          <textarea
            id="edNotesInput"
            className="ed-notes-input"
            placeholder="Speaker notes for this slide…"
            onChange={edSaveNotes}
          />
        </div>

        {/* View mode bar: AI refine buttons */}
        <div className="ed-view-bar" id="edViewBar">
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ed-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>✦ Refine:</span>
          {[
            ['More punchy',   'make this punchier and more impactful'],
            ['Add data',      'add specific statistics and real data points'],
            ['Simplify',      'simplify for a non-technical audience'],
            ['More formal',   'make this more formal and academic'],
            ['Add CTA',       'add a compelling conclusion or call to action'],
          ].map(([label, instruction]) => (
            <button key={label} className="ed-refine-btn" onClick={() => refineSlide(instruction)}>
              {label}
            </button>
          ))}
          <span className="ed-refine-spinner" id="edRefineSpinner" style={{ display: 'none' }}>✦ Writing…</span>
        </div>
      </div>

      {/* ── Right: Insert panel ── */}
      <div className="insert-panel ed-edit-only">
        <div className="insert-panel-tabs">
          {(['blocks','layouts','charts','diagrams','images','media','uploads'] as const).map(tab => (
            <div
              key={tab}
              className={`insert-tab${insertTabKey === tab ? ' active' : ''}`}
              onClick={() => switchInsertTab(tab)}
            >
              {tab === 'blocks'   && 'Aa Blocks'}
              {tab === 'layouts'  && '⊞ Layouts'}
              {tab === 'charts'   && '📊 Charts'}
              {tab === 'diagrams' && '◎ Diagrams'}
              {tab === 'images'   && '🖼 Images'}
              {tab === 'media'    && '▶ Media'}
              {tab === 'uploads'  && `📥 Yours${trayRef.current.length ? ` (${trayRef.current.length})` : ''}`}
            </div>
          ))}
        </div>
        <div className="insert-panel-body" id="insertPanelBody" />
      </div>

      {/* Context menu */}
      <div
        id="edCtxMenu"
        style={{
          display: 'none', position: 'fixed', zIndex: 700,
          background: '#1a1a1e', border: '1px solid #3a3a3e',
          borderRadius: 10, padding: 6, minWidth: 150,
          boxShadow: '0 8px 32px rgba(0,0,0,.6)', fontFamily: "'DM Sans',sans-serif",
        }}
      >
        {[
          ['dup',       '⊕ Duplicate'],
          ['movefront', '⬆ Bring to front'],
          ['moveback',  '⬇ Send to back'],
        ].map(([action, label]) => (
          <div key={action} className="ctx-item" onClick={() => edCtxAction(action)}>{label}</div>
        ))}
        <div style={{ height: 1, background: '#2a2a2e', margin: '4px 0' }} />
        <div className="ctx-item ctx-del" onClick={() => edCtxAction('del')}>✕ Delete</div>
      </div>

      <style>{`
        .ctx-item{padding:8px 12px;font-size:12px;color:#ccc;cursor:pointer;border-radius:6px;transition:background .12s}
        .ctx-item:hover{background:#27272a;color:#fff}
        .ctx-item.ctx-del{color:#fca5a5}
        .ctx-item.ctx-del:hover{background:#7f1d1d}
        .ed-img-bar-btn{background:var(--ed-surface);color:var(--ed-text2);border:1px solid var(--ed-border);border-radius:6px;padding:4px 10px;font-size:11px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;box-shadow:0 1px 4px rgba(0,0,0,.08);transition:all .15s;white-space:nowrap}
        .ed-img-bar-btn:hover{background:var(--ed-hover);color:var(--ed-text)}
        .ed-img-bar-btn.del{color:var(--ed-danger)}
        .ed-img-bar-btn.del:hover{background:var(--ed-danger-bg)}
        .ed-slide-thumb{height:90px;background-size:cover;background-position:center;background-color:var(--ed-input);border-radius:6px;cursor:pointer;margin-bottom:6px;position:relative;border:2px solid transparent;transition:border-color .15s}
        .ed-slide-thumb.active{border-color:var(--ed-accent)}
        .ed-slide-thumb-overlay{position:absolute;inset:0;background:rgba(0,0,0,.3);border-radius:4px;display:flex;align-items:flex-start;padding:6px 8px}
        .ed-slide-thumb-num{font-size:11px;font-weight:700;color:rgba(255,255,255,.9);text-shadow:0 1px 2px rgba(0,0,0,.5)}
        .ed-slide-ops{display:flex;gap:4px;padding:8px 12px;border-top:1px solid var(--ed-border);flex-shrink:0}
        .ed-slide-op{flex:1;padding:6px 4px;text-align:center;font-size:11px;font-weight:600;cursor:pointer;border-radius:6px;color:var(--ed-text3);background:var(--ed-input);border:1px solid var(--ed-border);transition:all .15s;font-family:'DM Sans',sans-serif}
        .ed-slide-op:hover{background:var(--ed-hover);color:var(--ed-text)}
        .ed-slide-op.danger:hover{background:var(--ed-danger-bg);color:var(--ed-danger);border-color:var(--ed-danger-bd)}
        .ed-font-size{background:var(--ed-input);border:1px solid var(--ed-border);color:var(--ed-text2);height:28px;width:64px;padding:0 4px;border-radius:7px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;outline:none;flex-shrink:0}
        .ed-font-size:focus{border-color:var(--ed-accent)}
      `}</style>

      {/* ── First-run walkthrough (coachmarks) ── */}
      {tutStep !== null && (() => {
        const step = TUTORIAL_STEPS[tutStep]
        const last = tutStep === TUTORIAL_STEPS.length - 1
        const PAD = 8
        const ring = tutRect
          ? { left: tutRect.x - PAD, top: tutRect.y - PAD, width: tutRect.w + PAD * 2, height: tutRect.h + PAD * 2 }
          : null
        const CARD_W = 320
        let cardStyle: React.CSSProperties
        if (ring) {
          const below = ring.top + ring.height + 14
          const fitsBelow = typeof window !== 'undefined' && window.innerHeight - below > 210
          cardStyle = {
            left: Math.max(12, Math.min(ring.left, (typeof window !== 'undefined' ? window.innerWidth : 1280) - CARD_W - 12)),
            ...(fitsBelow ? { top: below } : { bottom: (typeof window !== 'undefined' ? window.innerHeight : 800) - ring.top + 14 }),
          }
        } else {
          cardStyle = { left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }
        }
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9000, pointerEvents: 'none', fontFamily: "'DM Sans',sans-serif" }}>
            {/* Spotlight: dim everything except the target; clicks pass through */}
            {ring ? (
              <div style={{ position: 'fixed', ...ring, border: '2px solid var(--ed-accent,#2a5cff)', borderRadius: 10, boxShadow: '0 0 0 9999px rgba(10,10,14,0.45)', transition: 'left .25s ease, top .25s ease, width .25s ease, height .25s ease' }} />
            ) : (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,14,0.45)' }} />
            )}
            <div style={{ position: 'fixed', ...cardStyle, width: CARD_W, background: 'var(--ed-surface,#fff)', color: 'var(--ed-text,#111)', border: '1px solid var(--ed-border,rgba(0,0,0,.12))', borderRadius: 12, padding: '16px 18px 14px', boxShadow: '0 18px 44px rgba(0,0,0,.35)', pointerEvents: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ed-accent,#2a5cff)' }}>
                  {tutStep + 1} / {TUTORIAL_STEPS.length}
                </span>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{step.title}</span>
                <button
                  onClick={endTutorial}
                  title="Close tutorial"
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ed-text3,#999)', fontSize: 14, lineHeight: 1, padding: 2 }}
                >
                  ✕
                </button>
              </div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: 'var(--ed-text2,#444)' }}>{step.body}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
                <span style={{ display: 'flex', gap: 5 }}>
                  {TUTORIAL_STEPS.map((_, i) => (
                    <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i === tutStep ? 'var(--ed-accent,#2a5cff)' : 'var(--ed-border,#ddd)' }} />
                  ))}
                </span>
                <button
                  onClick={endTutorial}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ed-text3,#999)', fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}
                >
                  Skip
                </button>
                <button
                  onClick={() => (last ? endTutorial() : setTutStep(tutStep + 1))}
                  style={{ background: 'var(--ed-accent,#2a5cff)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}
                >
                  {last ? 'Done' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {presenterOpen && (
        <PresenterMode
          slides={slidesRef.current}
          theme={themeRef.current}
          initialIdx={presenterStartIdx}
          getNotes={getPresenterNotes}
          onExit={closePresenter}
        />
      )}
    </div>
  )

  /* ════════════════════════════════════════
     REFINE SLIDE (called from view-mode bar)
  ════════════════════════════════════════ */
  async function refineSlide(instruction: string) {
    const idx   = ed.current.idx
    const slide = slidesRef.current[idx]
    if (!slide) return
    const spinner = document.getElementById('edRefineSpinner')
    if (spinner) spinner.style.display = 'flex'
    try {
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slide, instruction }),
      })
      const data = await res.json() as { slide: SlideData }
      slidesRef.current[idx] = { ...slide, ...data.slide, img: slide.img }
      // Rebuild elements for this slide
      ed.current.els[idx] = buildEdEls(slidesRef.current[idx], themeRef.current, idx)
      edRebuildSidebar()
      edRenderSlide(idx)
      showToast('Slide refined ✓')
    } catch {
      showToast('Refinement failed')
    }
    if (spinner) spinner.style.display = 'none'
  }
}
