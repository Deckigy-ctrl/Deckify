'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { presRenderSlide } from '@/lib/themes/presRender'
import type { ThemeKey } from '@/lib/themes/config'
import type { SlideData } from './DeckifyApp'

interface Props {
  slides: SlideData[]
  theme: ThemeKey
  initialIdx: number
  getNotes: (idx: number) => string
  onExit: (idx: number) => void
}

export default function PresenterMode({ slides, theme, initialIdx, getNotes, onExit }: Props) {
  const [idx, setIdx] = useState(initialIdx)
  const [notesOpen, setNotesOpen] = useState(false)
  const [scale, setScale] = useState(1)
  const onExitRef = useRef(onExit)
  const canvasRef = useRef<HTMLDivElement>(null)
  useEffect(() => { onExitRef.current = onExit }, [onExit])

  useEffect(() => {
    function calcScale() {
      setScale(Math.min(window.innerWidth / 900, (window.innerHeight - 60) / 562))
    }
    calcScale()
    window.addEventListener('resize', calcScale)
    return () => window.removeEventListener('resize', calcScale)
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault()
        setIdx(i => Math.min(i + 1, slides.length - 1))
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        setIdx(i => Math.max(i - 1, 0))
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setIdx(i => { onExitRef.current(i); return i })
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [slides.length])

  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const FITTABLE = new Set(['title', 'subtitle', 'bullet', 'body'])
    const FLOOR = 11
    canvas.querySelectorAll<HTMLElement>('[data-role="text"]').forEach(div => {
      if (!FITTABLE.has(div.dataset.elRole || '')) return
      let fs = parseFloat(div.style.fontSize) || 14
      while (fs > FLOOR && div.scrollHeight > div.clientHeight) {
        fs--
        div.style.fontSize = fs + 'px'
      }
    })
  }, [idx, theme])

  const slide = slides[idx]
  const slideHtml = presRenderSlide(slide as Parameters<typeof presRenderSlide>[0], theme, idx)
  const notes = getNotes(idx)
  const progress = slides.length > 1 ? (idx / (slides.length - 1)) * 100 : 100

  return (
    <div id="presenterMode" className="open">
      <div className="pres-slide-area">
        <div
          ref={canvasRef}
          className="pres-slide-canvas"
          style={{ width: 900, height: 562, transform: `scale(${scale})`, transformOrigin: 'center center' }}
          dangerouslySetInnerHTML={{ __html: slideHtml }}
        />
      </div>

      <div className={`pres-notes-drawer${notesOpen ? ' show' : ''}`}>
        <div className="pres-notes-drawer-label">Speaker notes</div>
        <div className="pres-notes-drawer-text">{notes || 'No notes for this slide.'}</div>
      </div>

      <div className="pres-controls">
        <div className="pres-prog-bar" style={{ width: `${progress}%` }} />
        <button
          className={`pres-notes-btn${notesOpen ? ' on' : ''}`}
          onClick={() => setNotesOpen(v => !v)}
        >
          Notes
        </button>
        <button
          className="pres-btn"
          disabled={idx === 0}
          onClick={() => setIdx(i => Math.max(i - 1, 0))}
          title="Previous (←)"
        >
          ‹
        </button>
        <span className="pres-counter">{idx + 1} / {slides.length}</span>
        <button
          className="pres-btn"
          disabled={idx === slides.length - 1}
          onClick={() => setIdx(i => Math.min(i + 1, slides.length - 1))}
          title="Next (→)"
        >
          ›
        </button>
        <button className="pres-exit-btn" onClick={() => onExitRef.current(idx)}>
          ✕ Exit
        </button>
      </div>
    </div>
  )
}
