'use client'

/* Deckify landing page — "scholarly editorial" direction.
   Design system: design-system/deckify/MASTER.md (Editorial Grid / Magazine).
   Palette is scholarly navy + citation gold; type is Libre Bodoni over
   Public Sans. Every muted tone here is checked to clear 4.5:1 on the page
   background, so no text sits below WCAG AA. CTAs all route to /login. */

import { useEffect } from 'react'

/* ---- tokens (see MASTER.md) ---------------------------------------- */
const BG      = '#F8FAFC'  // page
const SURFACE = '#FFFFFF'  // cards
const INK     = '#0F172A'  // headings
const NAVY    = '#1E3A5F'  // primary
const GOLD    = '#B45309'  // accent fills/borders; white on it = 5.0:1
/* Gold as *text* needs to be a step darker: #B45309 measures only 4.31:1 on
   the tinted sections (#E9EEF5) and fails AA. #92400E clears it everywhere
   (6.1:1 on tint, 7.1:1 on white). Use GOLD for fills, GOLD_TEXT for type. */
const GOLD_TEXT = '#92400E'
const BODY    = '#334155'  // body copy — 10.4:1
const MUTED   = '#475569'  // secondary — 8.0:1
const FAINT   = '#64748B'  // labels — 5.3:1 (still AA for normal text)
const BORDER  = '#CBD5E1'
const RULE    = '#E2E8F0'
const TINT    = '#E9EEF5'  // muted surface

const DISPLAY = "'Libre Bodoni', Georgia, 'Times New Roman', serif"
const SANS    = "'Public Sans', system-ui, -apple-system, 'Segoe UI', sans-serif"

const UNIVERSITY = 'Thai university' // shown as "Built for <UNIVERSITY> students."

/* ---- shared style objects ------------------------------------------ */
const label: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.18em',
  color: GOLD_TEXT, marginBottom: 18,
}
const h2: React.CSSProperties = {
  fontFamily: DISPLAY, fontWeight: 600, fontSize: 'clamp(2rem,4.4vw,3.4rem)',
  lineHeight: 1.06, letterSpacing: '-0.015em', margin: 0, color: INK,
}
const lede: React.CSSProperties = {
  maxWidth: '30rem', fontSize: 'clamp(1rem,1.05vw,1.08rem)',
  lineHeight: 1.68, color: BODY, margin: '24px 0 0',
}
const folio: React.CSSProperties = {
  fontFamily: DISPLAY, fontSize: '1.15rem', color: FAINT, marginBottom: 12,
  letterSpacing: '0.04em',
}
/* Spacious density (dial 3/10): 24–96px rhythm. */
const sectionPad = 'clamp(64px,11vh,120px) clamp(20px,5vw,72px)'
const container: React.CSSProperties = { maxWidth: 1280, margin: '0 auto' }

/* Prices use the sans stack — Bodoni's numerals and ฿ read poorly small. */
function Price({ amount, color }: { amount: string; color?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', color, lineHeight: 0.9, fontFamily: SANS }}>
      <span style={{ fontSize: '0.42em', fontWeight: 600, marginRight: 3, opacity: 0.8, alignSelf: 'flex-start', marginTop: '0.22em' }}>฿</span>
      <span style={{ fontWeight: 700, letterSpacing: '-0.035em' }}>{amount}</span>
    </span>
  )
}

function Tick({ tone = INK }: { tone?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true" style={{ marginTop: 3, flex: '0 0 auto' }}>
      <path d="M3 7.6 6 10.5 12 4" stroke={tone} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Feature({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start', fontSize: 14, color: dark ? '#DCE4EE' : BODY, lineHeight: 1.45 }}>
      <Tick tone={dark ? '#E0A458' : NAVY} />{children}
    </div>
  )
}

function Bar({ w, dark }: { w: string; dark?: boolean }) {
  return <div style={{ height: 6, width: w, background: dark ? 'rgba(255,255,255,0.18)' : RULE, borderRadius: 3 }} />
}

function OutlineRow({ n, w }: { n: string; w: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontFamily: DISPLAY, fontSize: '1.05rem', color: FAINT, width: 20 }}>{n}</span>
      <div style={{ flex: '1 1 auto', height: 9, background: RULE, borderRadius: 4, width: w }} />
      <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }} aria-hidden="true">
        <span style={{ width: 14, height: 1.5, background: BORDER }} />
        <span style={{ width: 14, height: 1.5, background: BORDER }} />
      </span>
    </div>
  )
}

export default function LandingPage() {
  /* Scroll-reveal + staggered cards + hero count-up. Motion dial 4/10:
     standard reveals only, 300–450ms, no pinning or parallax. All of it is
     skipped when the user prefers reduced motion. */
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const sections = Array.from(document.querySelectorAll<HTMLElement>('.lp3 section, .lp3 footer'))
    sections.forEach(s => s.classList.add('lp3-reveal'))

    document.querySelectorAll<HTMLElement>('.lp3-stagger').forEach(group => {
      Array.from(group.children).forEach((child, i) => {
        (child as HTMLElement).style.transitionDelay = `${i * 70}ms`
        child.classList.add('lp3-reveal')
      })
    })

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return
        e.target.classList.add('lp3-in')
        io.unobserve(e.target)
      })
    }, { threshold: 0.12 })
    document.querySelectorAll('.lp3-reveal').forEach(el => io.observe(el))

    const timer = document.getElementById('lp3-timer')
    let raf = 0
    if (timer) {
      const start = performance.now()
      const DURATION = 1400
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / DURATION)
        const eased = 1 - Math.pow(1 - t, 3)
        timer.textContent = `0:${String(Math.round(eased * 52)).padStart(2, '0')}`
        if (t < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }

    return () => {
      io.disconnect()
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div style={{ background: BG, color: INK, fontFamily: SANS, WebkitFontSmoothing: 'antialiased', overflowX: 'hidden', minWidth: 0 }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Libre+Bodoni:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Public+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      {/* Keep the CSS below free of apostrophes and angle brackets: React
          escapes them differently on the server than on the client inside a
          style tag, which produces a hydration mismatch. Explanatory notes
          therefore live out here, not in the stylesheet.

          Specificity note: the `.lp3 a` rule scores (0,1,1), which outranks a
          bare single-class rule such as `.lp3-btn` at (0,1,0). Every
          button/link rule is therefore scoped as `.lp3 a.CLASSNAME` (0,2,1)
          so its own color wins instead of inheriting the parent color. Without
          that, the white button on the navy pricing card renders white text on
          a white background and disappears. Do not un-scope these rules.

          Link colors also live in CSS rather than inline style props, because
          an inline color would outrank the :hover rule and kill the hover. */}
      <style>{`
        .lp3 a { text-decoration: none; color: inherit; }
        .lp3 *:focus-visible { outline: 2px solid ${GOLD}; outline-offset: 3px; border-radius: 2px; }
        .lp3 a.lp3-btn { background: ${NAVY}; color: #fff; font-weight: 600; letter-spacing: 0.03em; white-space: nowrap; border-radius: 3px; cursor: pointer; transition: background .2s ease, transform .2s ease; }
        .lp3 a.lp3-btn:hover { background: ${INK}; color: #fff; transform: translateY(-1px); }
        .lp3 a.lp3-btn-gold { background: ${GOLD}; color: #fff; font-weight: 600; letter-spacing: 0.03em; white-space: nowrap; border-radius: 3px; cursor: pointer; transition: background .2s ease, transform .2s ease; }
        .lp3 a.lp3-btn-gold:hover { background: #92400E; color: #fff; transform: translateY(-1px); }
        .lp3 a.lp3-btn-outline { border: 1px solid ${NAVY}; color: ${NAVY}; font-weight: 600; letter-spacing: 0.03em; border-radius: 3px; cursor: pointer; transition: background .2s ease, color .2s ease; }
        .lp3 a.lp3-btn-outline:hover { background: ${NAVY}; color: #fff; }
        .lp3 a.lp3-btn-inverse { background: #fff; color: ${NAVY}; font-weight: 600; letter-spacing: 0.03em; border-radius: 3px; cursor: pointer; transition: background .2s ease, color .2s ease; }
        .lp3 a.lp3-btn-inverse:hover { background: ${GOLD}; color: #fff; }
        .lp3 a.lp3-nav-link { color: ${MUTED}; transition: color .18s ease; cursor: pointer; display: inline-flex; align-items: center; min-height: 44px; }
        .lp3 a.lp3-nav-link:hover { color: ${GOLD}; }
        html { scroll-behavior: smooth; }
        .lp3-reveal { opacity: 0; transform: translateY(20px); transition: opacity .45s cubic-bezier(.22,.8,.35,1), transform .45s cubic-bezier(.22,.8,.35,1); }
        .lp3-in { opacity: 1; transform: none; }
        .lp3-caret { display: inline-block; border-left: 1.5px solid ${GOLD}; margin-left: 2px; animation: lp3-blink 1.05s step-end infinite; }
        .lp3-card { transition: transform .25s ease, box-shadow .25s ease; }
        .lp3-card:hover { transform: translateY(-3px); box-shadow: 0 24px 48px -28px rgba(15,23,42,0.28); }
        .lp3-spin { display: inline-block; animation: lp3-spin 1.1s linear infinite; }
        @keyframes lp3-blink { 50% { border-color: transparent; } }
        @keyframes lp3-spin { to { transform: rotate(360deg); } }
        @media (max-width: 680px) { .lp3-nav-link { display: none; } }
        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          .lp3-reveal { opacity: 1; transform: none; transition: none; }
          .lp3-caret, .lp3-spin { animation: none; }
          .lp3-btn:hover, .lp3-btn-gold:hover, .lp3-card:hover { transform: none; }
        }
      `}</style>

      <div className="lp3">

      {/* ============ NAV ============ */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(248,250,252,0.88)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: `1px solid ${RULE}` }}>
        <div style={{ ...container, padding: '0 clamp(20px,5vw,72px)', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          {/* minHeight 44 keeps the tap target at the accessible minimum —
              the text alone is only ~26px tall. */}
          <a href="#top" style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, whiteSpace: 'nowrap', color: INK, display: 'inline-flex', alignItems: 'center', minHeight: 44 }}>
            Deckify<span style={{ color: GOLD }}>.</span>
          </a>
          <nav aria-label="Main" style={{ display: 'flex', alignItems: 'center', gap: 'clamp(16px,2.4vw,34px)' }}>
            {/* The link padding widens the tap target for short words such as
                "Speed"; the matching negative margin cancels it visually so the
                nav gap looks unchanged. */}
            {[['#features', 'Features'], ['#speed', 'Speed'], ['#academic', 'Academic'], ['#pricing', 'Pricing']].map(([href, text]) => (
              <a key={href} href={href} className="lp3-nav-link" style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', padding: '0 6px', margin: '0 -6px' }}>{text}</a>
            ))}
          </nav>
          <a href="/login" className="lp3-btn" style={{ fontSize: 13, padding: '14px 20px' }}>Try it free</a>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section id="top" style={{ position: 'relative', ...container, padding: 'clamp(48px,8vh,104px) clamp(20px,5vw,72px) clamp(56px,9vh,96px)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(36px,5vw,76px)', alignItems: 'center' }}>

          <div style={{ flex: '1 1 430px', minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', color: GOLD_TEXT, marginBottom: 'clamp(20px,4vh,34px)' }}>
              AI presentations for students
            </div>
            <h1 style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 'clamp(2.9rem,8vw,6.2rem)', lineHeight: 0.98, letterSpacing: '-0.028em', margin: 0, color: INK }}>
              From topic<br />to defense-<br />ready deck<span style={{ color: GOLD }}>.</span>
            </h1>
            <p style={{ maxWidth: '32rem', fontSize: 'clamp(1.03rem,1.15vw,1.16rem)', lineHeight: 1.66, color: BODY, margin: 'clamp(24px,3.5vh,32px) 0 0' }}>
              Type a topic or drop in a PDF. Deckify writes the full slide deck in under a minute: outline, copy, and designed layouts. You edit; it does the busywork.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 18, marginTop: 'clamp(28px,4vh,40px)' }}>
              <a href="/login" className="lp3-btn-gold" style={{ fontSize: 15, padding: '16px 32px' }}>Try it free</a>
              <span style={{ fontSize: 13.5, color: MUTED }}>Free to try · No credit card</span>
            </div>

            <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px,1fr))', gap: 22, marginTop: 'clamp(40px,6vh,64px)', paddingTop: 22, borderTop: `1px solid ${BORDER}`, margin: 'clamp(40px,6vh,64px) 0 0' }}>
              {[['Input', 'Topic or PDF'], ['Speed', '~60 seconds'], ['Output', 'Editable deck']].map(([k, v]) => (
                <div key={k}>
                  <dt style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: FAINT, marginBottom: 7 }}>{k}</dt>
                  <dd style={{ fontSize: 14, color: INK, margin: 0, fontWeight: 500 }}>{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Hero product mockup */}
          <div style={{ flex: '1 1 430px', minWidth: 0, position: 'relative' }}>
            <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, boxShadow: '0 40px 80px -44px rgba(15,23,42,0.34)', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', borderBottom: `1px solid ${RULE}`, background: '#FCFDFE' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: GOLD }} aria-hidden="true" />
                <span style={{ fontSize: 12, color: MUTED }}>Photosynthesis: Thesis Defense</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: NAVY, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.5 6.2 5 8.5 9.5 3.5" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Generated
                </span>
              </div>
              <div style={{ display: 'flex', minHeight: 320 }}>
                <div style={{ flex: '0 0 78px', borderRight: `1px solid ${RULE}`, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 9, background: '#F1F5F9' }}>
                  <div style={{ aspectRatio: '16/10', background: SURFACE, border: `1.5px solid ${GOLD}`, borderRadius: 2 }} />
                  {[0, 1, 2].map(i => <div key={i} style={{ aspectRatio: '16/10', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 2 }} />)}
                </div>
                <div style={{ flex: '1 1 auto', padding: '24px clamp(18px,3vw,30px)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.16em', color: FAINT, marginBottom: 14 }}>Thesis Defense · 14 slides</div>
                  <h3 style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 'clamp(1.5rem,3vw,2.05rem)', lineHeight: 1.08, margin: '0 0 18px', letterSpacing: '-0.015em' }}>The Role of Chloroplasts in Energy Conversion</h3>
                  <div style={{ flex: '1 1 auto', minHeight: 120, borderRadius: 4, background: 'repeating-linear-gradient(45deg,#E8EDF3,#E8EDF3 7px,#F1F5F9 7px,#F1F5F9 14px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: "ui-monospace,'SF Mono',Menlo,monospace", fontSize: 10.5, letterSpacing: '0.06em', color: MUTED, background: 'rgba(255,255,255,0.9)', padding: '5px 10px', borderRadius: 2 }}>AI illustration</span>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ position: 'absolute', bottom: -20, left: -16, background: NAVY, color: '#fff', padding: '14px 20px', borderRadius: 4, boxShadow: '0 18px 36px -18px rgba(15,23,42,0.55)' }}>
              <div id="lp3-timer" style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: '1.7rem', lineHeight: 1, minWidth: '2.6ch' }}>0:52</div>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#A9BDD4', marginTop: 4 }}>Topic → deck</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ BUILT FOR STUDENTS ============ */}
      <section style={{ borderTop: `1px solid ${RULE}`, borderBottom: `1px solid ${RULE}`, background: TINT }}>
        <div style={{ ...container, padding: 'clamp(40px,6vh,64px) clamp(20px,5vw,72px)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'clamp(24px,4vw,56px)' }}>
          <div style={{ flex: '1 1 300px', minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.18em', color: GOLD_TEXT, marginBottom: 12 }}>Made for coursework</div>
            <p style={{ fontFamily: DISPLAY, fontSize: 'clamp(1.6rem,3.2vw,2.3rem)', lineHeight: 1.14, margin: 0, fontWeight: 600, letterSpacing: '-0.015em' }}>
              Built for <span style={{ fontStyle: 'italic' }}>{UNIVERSITY}</span> students.
            </p>
          </div>
          <ul className="lp3-stagger" style={{ flex: '1 1 380px', minWidth: 0, display: 'flex', flexWrap: 'wrap', gap: 10, listStyle: 'none', margin: 0, padding: 0 }}>
            {['Thesis defense', 'Class seminar', 'Group project', 'Conference talk'].map(t => (
              <li key={t} style={{ border: `1px solid ${BORDER}`, background: SURFACE, borderRadius: 3, padding: '10px 16px', fontSize: 13.5, color: BODY, fontWeight: 500 }}>{t}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <div id="features">

        {/* 01 — speed */}
        <section style={{ ...container, padding: sectionPad }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(36px,5vw,80px)', alignItems: 'center' }}>
            <div style={{ flex: '1 1 360px', minWidth: 0 }}>
              <div style={folio}>01 / 05</div>
              <div style={label}>Speed</div>
              <h2 style={h2}>A full deck<br />before your<br />coffee&rsquo;s cold.</h2>
              <p style={lede}>One line of input becomes a structured, on-topic presentation in about sixty seconds. Titles, talking points, and layout all done. No blank first slide staring back at you.</p>
            </div>
            <div style={{ flex: '1 1 380px', minWidth: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
                <div style={{ width: '100%', maxWidth: 400, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 4, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 13.5, color: FAINT, flex: '1 1 auto' }}>Type a topic or drop a PDF…</span>
                  <span style={{ background: GOLD, width: 32, height: 32, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M7 2 3.5 5.5M7 2l3.5 3.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                </div>
                <svg width="20" height="34" viewBox="0 0 20 34" fill="none" aria-hidden="true"><path d="M10 1v28M10 29l-6-6M10 29l6-6" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <div style={{ position: 'relative', width: '100%', maxWidth: 400 }}>
                  <div style={{ position: 'absolute', inset: '14px -10px -14px 10px', background: '#EDF2F7', border: `1px solid ${RULE}`, borderRadius: 4 }} />
                  <div style={{ position: 'absolute', inset: '7px -5px -7px 5px', background: '#F4F7FA', border: `1px solid ${RULE}`, borderRadius: 4 }} />
                  <div style={{ position: 'relative', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 4, padding: 24, boxShadow: '0 20px 44px -30px rgba(15,23,42,0.3)' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.16em', color: FAINT, marginBottom: 12 }}>Slide 1 of 14</div>
                    <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: '1.5rem', lineHeight: 1.1, letterSpacing: '-0.015em' }}>Photosynthesis: Light Into Life</div>
                    <div style={{ marginTop: 16, height: 6, background: RULE, borderRadius: 3, width: '90%' }} />
                    <div style={{ marginTop: 8, height: 6, background: RULE, borderRadius: 3, width: '70%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 02 — outline first (reversed) */}
        <section style={{ borderTop: `1px solid ${RULE}` }}>
          <div style={{ ...container, padding: sectionPad }}>
            <div style={{ display: 'flex', flexWrap: 'wrap-reverse', gap: 'clamp(36px,5vw,80px)', alignItems: 'center' }}>
              <div style={{ flex: '1 1 380px', minWidth: 0 }}>
                <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 4, padding: 24, boxShadow: '0 24px 50px -34px rgba(15,23,42,0.3)' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.16em', color: FAINT, marginBottom: 18 }}>Outline: edit before you generate</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <OutlineRow n="1" w="100%" />
                    <OutlineRow n="2" w="80%" />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: `1px solid ${GOLD}`, background: 'rgba(180,83,9,0.04)', borderRadius: 4, padding: '11px 12px', margin: '-6px -8px' }}>
                      <span style={{ fontFamily: DISPLAY, fontSize: '1.05rem', color: GOLD_TEXT, width: 20 }}>3</span>
                      <span style={{ flex: '1 1 auto', fontSize: 13.5, color: INK }}>Methodology &amp; sample size<span className="lp3-caret">&nbsp;</span></span>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: GOLD_TEXT }}>editing</span>
                    </div>
                    <OutlineRow n="4" w="90%" />
                    <OutlineRow n="5" w="65%" />
                  </div>
                </div>
              </div>
              <div style={{ flex: '1 1 360px', minWidth: 0 }}>
                <div style={folio}>02 / 05</div>
                <div style={label}>Control</div>
                <h2 style={h2}>See the outline<br />before it builds<br />the slides.</h2>
                <p style={lede}>Deckify drafts an editable outline first. Reorder sections, rewrite a heading, cut what you don&rsquo;t need. <span style={{ fontFamily: DISPLAY, fontStyle: 'italic', fontSize: '1.12em' }}>Then</span> it generates. You&rsquo;re never stuck deleting a bad deck and starting over.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 03 — image handling */}
        <section style={{ borderTop: `1px solid ${RULE}` }}>
          <div style={{ ...container, padding: sectionPad }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(36px,5vw,80px)', alignItems: 'center' }}>
              <div style={{ flex: '1 1 360px', minWidth: 0 }}>
                <div style={folio}>03 / 05</div>
                <div style={label}>Visuals</div>
                <h2 style={h2}>Every image,<br />exactly where it<br />earns its place.</h2>
                <p style={lede}>Upload your own figures and Deckify places them intelligently. A diagram or table is shown <span style={{ fontFamily: DISPLAY, fontStyle: 'italic', fontSize: '1.12em' }}>whole</span>, never cropped, on a clean matte; a photo fills its frame. No stock-photo filler, and AI illustration lands only on the few slides that genuinely need a picture, never as decoration on every slide.</p>
              </div>
              <div style={{ flex: '1 1 380px', minWidth: 0 }}>
                <div className="lp3-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, alignItems: 'start' }}>
                  <div className="lp3-card" style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ margin: 12, background: '#EEF3F8', border: `1px solid ${RULE}`, borderRadius: 3, aspectRatio: '4/3', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 6, padding: '16px 14px 12px' }}>
                      {[38, 58, 72, 90, 64].map((h, i) => (
                        <div key={i} style={{ width: '11%', height: `${h}%`, background: NAVY, opacity: 0.82, borderRadius: '2px 2px 0 0' }} />
                      ))}
                    </div>
                    <div style={{ padding: '0 14px 14px', fontFamily: DISPLAY, fontStyle: 'italic', fontSize: '0.95rem', color: MUTED }}>Figure 1: contained, not cropped</div>
                  </div>
                  <div className="lp3-card" style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 4, padding: 20 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.16em', color: FAINT, marginBottom: 12 }}>No image needed</div>
                    <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: '1.3rem', lineHeight: 1.14, marginBottom: 16, letterSpacing: '-0.015em' }}>Three findings that hold up</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <Bar w="100%" /><Bar w="86%" /><Bar w="70%" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 04 — academic (reversed) */}
        <section id="academic" style={{ borderTop: `1px solid ${RULE}` }}>
          <div style={{ ...container, padding: sectionPad }}>
            <div style={{ display: 'flex', flexWrap: 'wrap-reverse', gap: 'clamp(36px,5vw,80px)', alignItems: 'center' }}>
              <div style={{ flex: '1 1 380px', minWidth: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ background: NAVY, color: '#fff', borderRadius: 5, padding: 'clamp(24px,3vw,34px)', boxShadow: '0 24px 50px -34px rgba(15,23,42,0.45)' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#A9BDD4', marginBottom: 14 }}>Findings</div>
                    <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 'clamp(3rem,8vw,5rem)', lineHeight: 0.92, color: '#E0A458' }}>87<span style={{ fontSize: '0.5em' }}>%</span></div>
                    <div style={{ fontSize: 13.5, color: '#DCE4EE', marginTop: 12 }}>of variance explained by the model (p &lt; 0.001)</div>
                  </div>
                  <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 5, padding: 'clamp(20px,3vw,28px)' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.16em', color: FAINT, marginBottom: 14 }}>Methodology</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                      {['100%', '82%', '68%'].map(w => (
                        <div key={w} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: GOLD, marginTop: 7, flex: '0 0 auto' }} />
                          <div style={{ height: 7, background: RULE, borderRadius: 3, flex: '1 1 auto', maxWidth: w }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ flex: '1 1 360px', minWidth: 0 }}>
                <div style={folio}>04 / 05</div>
                <div style={label}>Academic</div>
                <h2 style={h2}>It speaks<br />the language<br />of research.</h2>
                <p style={lede}>Deckify knows what a defense needs: methodology, findings, limitations, big stat callouts. It structures your deck around academic formats instead of generic marketing layouts.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 05 — composed layouts */}
        <section style={{ borderTop: `1px solid ${RULE}` }}>
          <div style={{ ...container, padding: sectionPad }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(36px,5vw,80px)', alignItems: 'center' }}>
              <div style={{ flex: '1 1 360px', minWidth: 0 }}>
                <div style={folio}>05 / 05</div>
                <div style={label}>Layouts</div>
                <h2 style={h2}>Slide types that<br />argue your point,<br />not just hold text.</h2>
                <p style={lede}>Deckify chooses from designed layouts instead of defaulting to bullets beside a photo. A comparison table for contrasting options, a stat row for headline numbers, a timeline for a process. Output that looks <span style={{ fontFamily: DISPLAY, fontStyle: 'italic', fontSize: '1.12em' }}>intentionally</span> composed.</p>
              </div>
              <div style={{ flex: '1 1 380px', minWidth: 0 }}>
                <div className="lp3-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="lp3-card" style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 4, overflow: 'hidden', boxShadow: '0 20px 44px -32px rgba(15,23,42,0.3)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr' }}>
                      {['', 'Battery EV', 'Hydrogen'].map((h, i) => (
                        <div key={i} style={{ background: NAVY, color: '#fff', fontSize: 11, fontWeight: 600, padding: '9px 12px' }}>{h}</div>
                      ))}
                      {[['Range', '480 km', '650 km'], ['Refuel', '30 min', '5 min'], ['Network', 'Broad', 'Sparse']].map((row, ri) => (
                        row.map((c, ci) => (
                          <div key={ri + '-' + ci} style={{ background: ri % 2 ? '#F4F7FA' : 'transparent', fontSize: 11.5, color: ci === 0 ? INK : BODY, fontWeight: ci === 0 ? 600 : 400, padding: '9px 12px', borderTop: `1px solid ${RULE}` }}>{c}</div>
                        ))
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {[['−43%', 'Lighter'], ['2.4×', 'Faster'], ['+75%', 'Retained']].map(([v, l], i) => (
                      <div key={i} className="lp3-card" style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 4, padding: '16px 12px' }}>
                        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: '1.85rem', color: NAVY, lineHeight: 1 }}>{v}</div>
                        <div style={{ fontSize: 11, color: MUTED, marginTop: 6, fontWeight: 500 }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ============ AI IMAGE PORTAL ============ */}
      <section style={{ borderTop: `1px solid ${RULE}`, background: TINT }}>
        <div style={{ ...container, padding: 'clamp(56px,9vh,104px) clamp(20px,5vw,72px)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(32px,5vw,72px)', alignItems: 'center' }}>
            <div style={{ flex: '1 1 340px', minWidth: 0 }}>
              <div style={label}>AI images</div>
              <h2 style={{ ...h2, fontSize: 'clamp(1.9rem,3.8vw,2.9rem)' }}>Generate images<br />without waiting<br />on them.</h2>
              <p style={lede}>Describe an image, pick a style, and keep working. It lands in your library when it&rsquo;s ready, reusable across every deck you build. No sitting and watching a spinner inside the editor.</p>
            </div>
            <div style={{ flex: '1 1 400px', minWidth: 0 }}>
              <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 6, padding: 20, boxShadow: '0 24px 50px -36px rgba(15,23,42,0.3)' }}>
                <div style={{ background: '#F8FAFC', border: `1px solid ${BORDER}`, borderRadius: 4, padding: '11px 12px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: BODY, flex: '1 1 auto' }}>a rooftop solar team at work, golden hour</span>
                  <span style={{ background: GOLD, color: '#fff', fontSize: 11.5, fontWeight: 600, borderRadius: 3, padding: '6px 11px' }}>Generate</span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  {[['Illustration', true], ['Photo', false], ['Abstract', false]].map(([t, on], i) => (
                    <span key={i} style={{ fontSize: 11.5, padding: '6px 12px', borderRadius: 16, border: `1px solid ${on ? GOLD : BORDER}`, color: on ? GOLD_TEXT : MUTED, background: on ? 'rgba(180,83,9,0.06)' : 'transparent', fontWeight: on ? 600 : 500 }}>{t}</span>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ aspectRatio: '1', borderRadius: 4, background: `repeating-linear-gradient(${i % 2 ? '-45deg' : '45deg'},#E4EBF2,#E4EBF2 5px,#F1F5F9 5px,#F1F5F9 10px)`, border: `1px solid ${RULE}` }} />
                  ))}
                  <div style={{ aspectRatio: '1', borderRadius: 4, border: `1.5px dashed ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: FAINT }}>
                    <span className="lp3-spin" style={{ fontSize: 15 }} aria-hidden="true">⟳</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SPEED COMPARISON (NAVY) ============ */}
      <section id="speed" style={{ position: 'relative', background: NAVY, color: '#fff', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{ position: 'absolute', right: '-4%', top: '50%', transform: 'translateY(-50%)', fontFamily: DISPLAY, fontSize: 'clamp(20rem,42vw,46rem)', lineHeight: 0.7, color: 'rgba(255,255,255,0.055)', pointerEvents: 'none', userSelect: 'none' }}>/</div>
        <div style={{ position: 'relative', ...container, padding: 'clamp(72px,13vh,144px) clamp(20px,5vw,72px)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#E0A458', marginBottom: 22 }}>The difference</div>
          <h2 style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 'clamp(2.4rem,5.6vw,4.4rem)', lineHeight: 1.04, letterSpacing: '-0.025em', margin: '0 0 clamp(44px,7vh,76px)', maxWidth: '16ch', color: '#fff' }}>Fewer steps. Better decks.</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(32px,5vw,72px)' }}>
            <div style={{ flex: '1 1 300px', minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#A9BDD4', paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.24)', marginBottom: 20 }}>The usual way</div>
              <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 13 }}>
                {['Open the tool, pick a blank', 'Write a careful prompt', 'Generate, wait, regenerate', 'Fight the theme & layout', 'Hunt for images', 'Rewrite half the text'].map((step, i) => (
                  <li key={i} style={{ display: 'flex', gap: 14, alignItems: 'baseline', fontSize: 'clamp(1rem,1.25vw,1.15rem)', color: '#DCE4EE' }}>
                    <span style={{ fontFamily: DISPLAY, fontSize: '1.05rem', color: '#8FA8C4', width: 24, flex: '0 0 auto' }}>{String(i + 1).padStart(2, '0')}</span> {step}
                  </li>
                ))}
              </ol>
            </div>
            <div style={{ flex: '1 1 300px', minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#fff', paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.24)', marginBottom: 20 }}>Deckify</div>
              <div style={{ display: 'flex', gap: 18, alignItems: 'baseline' }}>
                <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 'clamp(3.5rem,9vw,6rem)', lineHeight: 0.85, color: '#E0A458' }}>1</span>
                <div>
                  <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 'clamp(1.6rem,3.2vw,2.4rem)', lineHeight: 1.08, letterSpacing: '-0.015em' }}>Type your topic.</div>
                  <div style={{ fontSize: 'clamp(1.05rem,1.5vw,1.3rem)', color: '#DCE4EE', marginTop: 8 }}>→ Done in ~60 seconds.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section id="pricing" style={{ borderTop: `1px solid ${RULE}` }}>
        <div style={{ ...container, padding: sectionPad }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 'clamp(40px,6vh,64px)' }}>
            <div>
              <div style={label}>Pricing</div>
              <h2 style={h2}>Priced like a<br />student budget.</h2>
            </div>
            <p style={{ maxWidth: '27rem', fontSize: 'clamp(1rem,1.05vw,1.08rem)', lineHeight: 1.65, color: BODY, margin: 0 }}>Start free. No card, no trial clock. Upgrade when you need more decks in a busy semester.</p>
          </div>

          <div className="lp3-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(268px, 1fr))', gap: 20, alignItems: 'stretch' }}>

            {/* Free */}
            <div className="lp3-card" style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 6, padding: 'clamp(26px,3vw,36px)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: MUTED }}>Free</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, margin: '22px 0 6px' }}>
                <span style={{ fontSize: 'clamp(2.6rem,5vw,3.3rem)', color: INK }}><Price amount="0" /></span>
              </div>
              <div style={{ fontSize: 12.5, color: FAINT, marginBottom: 28 }}>forever · no credit card</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 30, flex: '1 1 auto' }}>
                <Feature>3 free decks to start</Feature>
                <Feature>Editable outline + slides</Feature>
                <Feature>Export to PDF &amp; PPTX</Feature>
              </div>
              <a href="/login" className="lp3-btn-outline" style={{ textAlign: 'center', fontSize: 13.5, padding: 14 }}>Start free</a>
            </div>

            {/* Student Pro */}
            <div className="lp3-card" style={{ background: NAVY, color: '#fff', border: `1px solid ${NAVY}`, borderRadius: 6, padding: 'clamp(26px,3vw,36px)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, right: 24, transform: 'translateY(-50%)', background: GOLD, color: '#fff', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', padding: '6px 12px', borderRadius: 3 }}>Most popular</div>
              <div style={{ fontSize: 11.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#A9BDD4' }}>Student Pro</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '22px 0 6px' }}>
                <span style={{ fontSize: 'clamp(2.6rem,5vw,3.3rem)' }}><Price amount="199" color="#E0A458" /></span>
                <span style={{ fontSize: 13.5, color: '#A9BDD4' }}>/ month</span>
              </div>
              <div style={{ fontSize: 12.5, color: '#8FA8C4', marginBottom: 28 }}>≈ US$6 · cancel anytime</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 30, flex: '1 1 auto' }}>
                <Feature dark>Unlimited decks all semester</Feature>
                <Feature dark>Smart image placement &amp; AI images</Feature>
                <Feature dark>PDF import &amp; academic templates</Feature>
                <Feature dark>Priority generation</Feature>
              </div>
              <a href="/login" className="lp3-btn-inverse" style={{ textAlign: 'center', fontSize: 13.5, padding: 14 }}>Get Student Pro</a>
            </div>

            {/* Group — coming soon */}
            <div className="lp3-card" style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 6, padding: 'clamp(26px,3vw,36px)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, right: 24, transform: 'translateY(-50%)', background: TINT, border: `1px solid ${BORDER}`, color: MUTED, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', padding: '6px 12px', borderRadius: 3 }}>Coming soon</div>
              <div style={{ fontSize: 11.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: MUTED }}>Group</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '22px 0 6px' }}>
                <span style={{ fontSize: 'clamp(2.6rem,5vw,3.3rem)', color: INK }}><Price amount="129" /></span>
                <span style={{ fontSize: 13.5, color: FAINT }}>/ seat</span>
              </div>
              <div style={{ fontSize: 12.5, color: FAINT, marginBottom: 28 }}>3+ seats · for project teams</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 30, flex: '1 1 auto' }}>
                <Feature>Everything in Student Pro</Feature>
                <Feature>Shared deck workspace</Feature>
                <Feature>Real-time co-editing</Feature>
              </div>
              <span style={{ textAlign: 'center', border: `1px solid ${BORDER}`, borderRadius: 3, color: FAINT, fontSize: 13.5, fontWeight: 600, padding: 14, cursor: 'default' }}>Coming soon</span>
            </div>

          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section id="cta" style={{ borderTop: `1px solid ${RULE}`, background: TINT }}>
        <div style={{ ...container, padding: 'clamp(76px,14vh,152px) clamp(20px,5vw,72px)', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', color: GOLD_TEXT, marginBottom: 24 }}>Ready when you are</div>
          <h2 style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 'clamp(2.6rem,6.4vw,5rem)', lineHeight: 1.02, letterSpacing: '-0.028em', margin: '0 auto', maxWidth: '15ch', color: INK }}>
            Your deck is sixty seconds away.
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 18, marginTop: 'clamp(32px,5vh,44px)' }}>
            <a href="/login" className="lp3-btn-gold" style={{ fontSize: 15, padding: '17px 36px' }}>Try it free</a>
            <span style={{ fontSize: 13.5, color: MUTED }}>Free to try · No credit card required</span>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer style={{ borderTop: `1px solid ${BORDER}` }}>
        <div style={{ ...container, padding: 'clamp(44px,7vh,72px) clamp(20px,5vw,72px)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(32px,5vw,64px)', justifyContent: 'space-between' }}>
            <div style={{ flex: '1 1 240px', minWidth: 0 }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 25, fontWeight: 700, letterSpacing: '-0.02em', color: INK }}>Deckify<span style={{ color: GOLD }}>.</span></div>
              <p style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.65, margin: '12px 0 0', maxWidth: '22rem' }}>AI presentations for students. From topic to defense-ready deck in under a minute.</p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(32px,5vw,64px)' }}>
              <nav aria-label="Product" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: FAINT, marginBottom: 4 }}>Product</div>
                <a href="#features" className="lp3-nav-link" style={{ fontSize: 13.5 }}>Features</a>
                <a href="#speed" className="lp3-nav-link" style={{ fontSize: 13.5 }}>Speed</a>
                <a href="#pricing" className="lp3-nav-link" style={{ fontSize: 13.5 }}>Pricing</a>
              </nav>
              <nav aria-label="Get started" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: FAINT, marginBottom: 4 }}>Get started</div>
                <a href="/login" className="lp3-nav-link" style={{ fontSize: 13.5 }}>Sign up free</a>
                <a href="/login" className="lp3-nav-link" style={{ fontSize: 13.5 }}>Log in</a>
              </nav>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center', marginTop: 'clamp(32px,5vh,48px)', paddingTop: 24, borderTop: `1px solid ${RULE}` }}>
            <span style={{ fontSize: 12.5, color: FAINT }}>© 2026 Deckify. Built for students.</span>
            <span style={{ fontSize: 12.5, color: FAINT }}>Made with restraint.</span>
          </div>
        </div>
      </footer>

      </div>
    </div>
  )
}
