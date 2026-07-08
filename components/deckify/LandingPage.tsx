'use client'

/* Editorial landing page — converted from the Claude Design export
   (Deckify Landing Page.zip). Design tokens and copy live here; the
   CTAs all route to /login where the app takes over. */

import { useEffect } from 'react'

const ACCENT = '#E02D22'
const INK    = '#16161A'
const CREAM  = '#FBFAF7'
const BG     = '#F3F1EC'
const BODY   = '#46443F'
const MUTED  = '#8C897F'
const FAINT  = '#A29E93'
const SERIF  = "'Cormorant Garamond', Georgia, serif"
const HAIR   = 'rgba(22,22,26,0.12)'
const HAIR2  = 'rgba(22,22,26,0.14)'
const HAIR3  = 'rgba(22,22,26,0.10)'

const UNIVERSITY = 'Thai university' // shown as “Built for <UNIVERSITY> students.”

const label: React.CSSProperties = {
  fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em',
  color: ACCENT, marginBottom: 18,
}
const h2: React.CSSProperties = {
  fontFamily: SERIF, fontWeight: 500, fontSize: 'clamp(2rem,4.6vw,3.5rem)',
  lineHeight: 1.02, letterSpacing: '-0.01em', margin: 0,
}
const lede: React.CSSProperties = {
  maxWidth: '28rem', fontSize: 'clamp(1rem,1.1vw,1.1rem)',
  lineHeight: 1.62, color: BODY, margin: '24px 0 0',
}
const sectionPad = 'clamp(56px,10vh,128px) clamp(20px,5vw,72px)'
const container: React.CSSProperties = { maxWidth: 1320, margin: '0 auto' }

/* Prices use the clean sans stack — Cormorant Garamond's ornate numerals
   and ฿ glyph are hard to read at a glance. */
function Price({ amount, color }: { amount: string; color?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', color, lineHeight: 0.9 }}>
      <span style={{ fontSize: '0.45em', fontWeight: 500, marginRight: 2, opacity: 0.75, alignSelf: 'flex-start', marginTop: '0.18em' }}>฿</span>
      <span style={{ fontWeight: 600, letterSpacing: '-0.03em' }}>{amount}</span>
    </span>
  )
}

function Tick({ dark }: { dark?: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ marginTop: 3, flex: '0 0 auto' }}>
      <path d="M3 7.6 6 10.5 12 4" stroke={dark ? ACCENT : INK} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Feature({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start', fontSize: 14, color: dark ? '#E7E4DD' : BODY, lineHeight: 1.4 }}>
      <Tick dark={dark} />{children}
    </div>
  )
}

function Bar({ w, dark }: { w: string; dark?: boolean }) {
  return <div style={{ height: 6, width: w, background: dark ? 'rgba(255,255,255,0.16)' : HAIR3, borderRadius: 3 }} />
}

function OutlineRow({ n, w }: { n: string; w: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontFamily: SERIF, fontSize: '1.1rem', color: FAINT, width: 20 }}>{n}</span>
      <div style={{ flex: '1 1 auto', height: 9, background: HAIR3, borderRadius: 4, width: w }} />
      <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ width: 14, height: 1.5, background: 'rgba(22,22,26,0.22)' }} />
        <span style={{ width: 14, height: 1.5, background: 'rgba(22,22,26,0.22)' }} />
      </span>
    </div>
  )
}

export default function LandingPage() {
  /* Prototype-style motion: scroll-reveal, staggered cards, count-up timer.
     All skipped when the user prefers reduced motion. */
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const sections = Array.from(document.querySelectorAll<HTMLElement>('.lp2 section, .lp2 footer'))
    sections.forEach(s => s.classList.add('lp2-reveal'))

    // Stagger direct children of the pricing grid and the coursework chips
    document.querySelectorAll<HTMLElement>('.lp2-stagger').forEach(group => {
      Array.from(group.children).forEach((child, i) => {
        (child as HTMLElement).style.transitionDelay = `${i * 90}ms`
        child.classList.add('lp2-reveal')
      })
    })

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return
        e.target.classList.add('lp2-in')
        io.unobserve(e.target)
      })
    }, { threshold: 0.12 })
    document.querySelectorAll('.lp2-reveal').forEach(el => io.observe(el))

    // Count the hero badge up from 0:00 to 0:52
    const timer = document.getElementById('lp2-timer')
    let raf = 0
    if (timer) {
      const start = performance.now()
      const DURATION = 1400
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / DURATION)
        const eased = 1 - Math.pow(1 - t, 3)
        const secs = Math.round(eased * 52)
        timer.textContent = `0:${String(secs).padStart(2, '0')}`
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
    <div style={{ background: BG, color: INK, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", WebkitFontSmoothing: 'antialiased', overflowX: 'hidden', minWidth: 0 }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap" rel="stylesheet" />
      <style>{`
        .lp2-btn { background: ${ACCENT}; color: ${CREAM}; text-transform: uppercase; letter-spacing: 0.12em; white-space: nowrap; transition: background .18s, color .18s; }
        .lp2-btn:hover { background: ${INK}; }
        .lp2-btn-outline { border: 1px solid ${INK}; color: ${INK}; text-transform: uppercase; letter-spacing: 0.12em; transition: background .18s, color .18s; }
        .lp2-btn-outline:hover { background: ${INK}; color: ${CREAM}; }
        .lp2-btn-inverse { background: ${ACCENT}; color: ${CREAM}; text-transform: uppercase; letter-spacing: 0.12em; transition: background .18s, color .18s; }
        .lp2-btn-inverse:hover { background: ${CREAM}; color: ${INK}; }
        .lp2-nav-link { transition: color .15s; }
        .lp2-nav-link:hover { color: ${INK}; }
        .lp2 a { text-decoration: none; color: inherit; }
        @media (max-width: 640px) { .lp2-nav-link { display: none; } }
        html { scroll-behavior: smooth; }
        .lp2-reveal { opacity: 0; transform: translateY(26px); transition: opacity .7s cubic-bezier(.22,.8,.35,1), transform .7s cubic-bezier(.22,.8,.35,1); }
        .lp2-in { opacity: 1; transform: none; }
        .lp2-caret { display: inline-block; border-left: 1.5px solid ${ACCENT}; margin-left: 2px; animation: lp2-blink 1.05s step-end infinite; }
        .lp2-float { animation: lp2-float 4.5s ease-in-out infinite; }
        .lp2-card-hover { transition: transform .25s ease, box-shadow .25s ease; }
        .lp2-card-hover:hover { transform: translateY(-4px); box-shadow: 0 28px 56px -30px rgba(22,22,26,0.35); }
        .lp2-spin { display: inline-block; animation: lp2-spin 1.1s linear infinite; }
        @keyframes lp2-blink { 50% { border-color: transparent; } }
        @keyframes lp2-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes lp2-spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          .lp2-reveal { opacity: 1; transform: none; transition: none; }
          .lp2-caret, .lp2-float, .lp2-spin { animation: none; }
        }
      `}</style>

      <div className="lp2">

      {/* ============ NAV ============ */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(243,241,236,0.86)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderBottom: `1px solid ${HAIR}` }}>
        <div style={{ ...container, padding: '0 clamp(20px,5vw,72px)', height: 66, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <a href="#top" style={{ fontFamily: SERIF, fontSize: 25, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1, whiteSpace: 'nowrap' }}>Deckify<span style={{ color: ACCENT }}>.</span></a>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 'clamp(14px,2.4vw,32px)' }}>
            {[['#features', 'Features'], ['#speed', 'Speed'], ['#academic', 'Academic'], ['#pricing', 'Pricing']].map(([href, text]) => (
              <a key={href} href={href} className="lp2-nav-link" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: BODY, whiteSpace: 'nowrap' }}>{text}</a>
            ))}
          </nav>
          <a href="/login" className="lp2-btn" style={{ fontSize: 11, padding: '11px 18px' }}>Try it free</a>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section id="top" style={{ position: 'relative', ...container, padding: 'clamp(40px,7vh,96px) clamp(20px,5vw,72px) clamp(48px,8vh,90px)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(32px,5vw,72px)', alignItems: 'center' }}>

          <div style={{ flex: '1 1 420px', minWidth: 0 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.24em', color: MUTED, marginBottom: 'clamp(20px,4vh,36px)' }}>AI presentations for students</div>
            <h1 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 'clamp(2.9rem,8.5vw,6.6rem)', lineHeight: 0.96, letterSpacing: '-0.015em', margin: 0 }}>
              From topic<br />to defense-<br />ready deck<span style={{ color: ACCENT }}>.</span>
            </h1>
            <p style={{ maxWidth: '30rem', fontSize: 'clamp(1rem,1.15vw,1.15rem)', lineHeight: 1.62, color: BODY, margin: 'clamp(22px,3.5vh,32px) 0 0' }}>
              Type a topic or drop in a PDF. Deckify writes the full slide deck in under a minute: outline, copy, and designed layouts. You edit; it does the busywork.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 18, marginTop: 'clamp(28px,4vh,40px)' }}>
              <a href="/login" className="lp2-btn" style={{ fontSize: 12, padding: '15px 30px' }}>Try it free</a>
              <span style={{ fontSize: 12, letterSpacing: '0.06em', color: MUTED }}>Free to try · No credit card</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px,1fr))', gap: 20, marginTop: 'clamp(40px,6vh,64px)', paddingTop: 20, borderTop: `1px solid ${HAIR2}` }}>
              {[['Input', 'Topic or PDF'], ['Speed', '~60 seconds'], ['Output', 'Editable deck']].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.16em', color: FAINT, marginBottom: 7 }}>{k}</div>
                  <div style={{ fontSize: 13, color: INK }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero product mockup */}
          <div style={{ flex: '1 1 440px', minWidth: 0, position: 'relative' }}>
            <div style={{ background: CREAM, border: `1px solid ${HAIR2}`, boxShadow: '0 40px 80px -40px rgba(22,22,26,0.28)', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: `1px solid ${HAIR3}` }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: ACCENT }} />
                <span style={{ fontSize: 11, letterSpacing: '0.05em', color: MUTED }}>Photosynthesis: Thesis Defense</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: INK, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2 5 8.5 9.5 3.5" stroke={ACCENT} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Generated
                </span>
              </div>
              <div style={{ display: 'flex', minHeight: 320 }}>
                <div style={{ flex: '0 0 78px', borderRight: `1px solid ${HAIR3}`, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 9, background: '#F6F4EF' }}>
                  <div style={{ aspectRatio: '16/10', background: CREAM, border: `1.5px solid ${ACCENT}`, borderRadius: 2 }} />
                  {[0, 1, 2].map(i => <div key={i} style={{ aspectRatio: '16/10', background: CREAM, border: `1px solid ${HAIR2}`, borderRadius: 2 }} />)}
                </div>
                <div style={{ flex: '1 1 auto', padding: '22px clamp(18px,3vw,30px)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.18em', color: FAINT, marginBottom: 14 }}>Thesis Defense · 14 slides</div>
                  <h3 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 'clamp(1.5rem,3vw,2.1rem)', lineHeight: 1.04, margin: '0 0 16px' }}>The Role of Chloroplasts in Energy Conversion</h3>
                  <div style={{ flex: '1 1 auto', minHeight: 120, borderRadius: 3, background: 'repeating-linear-gradient(45deg,#ECEAE4,#ECEAE4 7px,#F5F3EE 7px,#F5F3EE 14px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: "ui-monospace,'SF Mono',Menlo,monospace", fontSize: 10, letterSpacing: '0.08em', color: FAINT, background: 'rgba(251,250,247,0.85)', padding: '4px 9px' }}>AI illustration</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="lp2-float" style={{ position: 'absolute', bottom: -18, left: -14, background: INK, color: CREAM, padding: '12px 18px', boxShadow: '0 16px 32px -16px rgba(0,0,0,0.5)' }}>
              <div id="lp2-timer" style={{ fontFamily: SERIF, fontSize: '1.6rem', lineHeight: 1, minWidth: '2.6ch' }}>0:52</div>
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.16em', color: FAINT, marginTop: 3 }}>Topic → deck</div>
            </div>
          </div>
        </div>

        {/* editorial chrome dots */}
        <div style={{ position: 'absolute', right: 'clamp(20px,5vw,72px)', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 12, pointerEvents: 'none' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT }} />
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(22,22,26,0.22)' }} />
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(22,22,26,0.22)' }} />
        </div>
      </section>

      {/* ============ BUILT FOR STUDENTS ============ */}
      <section style={{ borderTop: `1px solid ${HAIR}`, borderBottom: `1px solid ${HAIR}` }}>
        <div style={{ ...container, padding: 'clamp(40px,6vh,64px) clamp(20px,5vw,72px)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'clamp(24px,4vw,56px)' }}>
          <div style={{ flex: '1 1 300px', minWidth: 0 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: MUTED, marginBottom: 12 }}>Made for coursework</div>
            <p style={{ fontFamily: SERIF, fontSize: 'clamp(1.6rem,3.2vw,2.4rem)', lineHeight: 1.12, margin: 0, fontWeight: 500 }}>Built for <span style={{ fontStyle: 'italic' }}>{UNIVERSITY}</span> students.</p>
          </div>
          <div className="lp2-stagger" style={{ flex: '1 1 360px', minWidth: 0, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {['Thesis defense', 'Class seminar', 'Group project', 'Conference talk'].map(t => (
              <span key={t} style={{ border: '1px solid rgba(22,22,26,0.18)', padding: '9px 16px', fontSize: 12, letterSpacing: '0.03em' }}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <div id="features">

        {/* F1: speed */}
        <section style={{ ...container, padding: sectionPad }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(36px,5vw,80px)', alignItems: 'center' }}>
            <div style={{ flex: '1 1 360px', minWidth: 0 }}>
              <div style={{ fontFamily: SERIF, fontSize: '1.4rem', color: '#C9C4B8', marginBottom: 10 }}>01 / 05</div>
              <div style={label}>Speed</div>
              <h2 style={h2}>A full deck<br />before your<br />coffee&rsquo;s cold.</h2>
              <p style={lede}>One line of input becomes a structured, on-topic presentation in about sixty seconds. Titles, talking points, and layout all done. No blank first slide staring back at you.</p>
            </div>
            <div style={{ flex: '1 1 380px', minWidth: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
                <div style={{ width: '100%', maxWidth: 400, background: CREAM, border: `1px solid ${HAIR2}`, borderRadius: 4, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 13, color: FAINT, flex: '1 1 auto' }}>Type a topic or drop a PDF…</span>
                  <span style={{ background: ACCENT, width: 30, height: 30, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M7 2 3.5 5.5M7 2l3.5 3.5" stroke={CREAM} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                </div>
                <svg width="20" height="34" viewBox="0 0 20 34" fill="none"><path d="M10 1v28M10 29l-6-6M10 29l6-6" stroke={ACCENT} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <div style={{ position: 'relative', width: '100%', maxWidth: 400 }}>
                  <div style={{ position: 'absolute', inset: '14px -10px -14px 10px', background: '#EDEAE3', border: `1px solid ${HAIR3}`, borderRadius: 4 }} />
                  <div style={{ position: 'absolute', inset: '7px -5px -7px 5px', background: '#F1EEE7', border: `1px solid ${HAIR3}`, borderRadius: 4 }} />
                  <div style={{ position: 'relative', background: CREAM, border: `1px solid ${HAIR2}`, borderRadius: 4, padding: 22, boxShadow: '0 20px 44px -28px rgba(22,22,26,0.3)' }}>
                    <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.18em', color: FAINT, marginBottom: 12 }}>Slide 1 of 14</div>
                    <div style={{ fontFamily: SERIF, fontSize: '1.5rem', lineHeight: 1.06 }}>Photosynthesis: Light Into Life</div>
                    <div style={{ marginTop: 14, height: 6, background: 'rgba(22,22,26,0.08)', borderRadius: 3, width: '90%' }} />
                    <div style={{ marginTop: 8, height: 6, background: 'rgba(22,22,26,0.08)', borderRadius: 3, width: '70%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* F2: outline first (reversed) */}
        <section style={{ borderTop: `1px solid ${HAIR}` }}>
          <div style={{ ...container, padding: sectionPad }}>
            <div style={{ display: 'flex', flexWrap: 'wrap-reverse', gap: 'clamp(36px,5vw,80px)', alignItems: 'center' }}>
              <div style={{ flex: '1 1 380px', minWidth: 0 }}>
                <div style={{ background: CREAM, border: `1px solid ${HAIR2}`, borderRadius: 4, padding: 22, boxShadow: '0 24px 50px -34px rgba(22,22,26,0.3)' }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.18em', color: FAINT, marginBottom: 18 }}>Outline: edit before you generate</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <OutlineRow n="1" w="100%" />
                    <OutlineRow n="2" w="80%" />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: `1px solid ${ACCENT}`, borderRadius: 4, padding: '10px 12px', margin: '-6px -8px' }}>
                      <span style={{ fontFamily: SERIF, fontSize: '1.1rem', color: ACCENT, width: 20 }}>3</span>
                      <span style={{ flex: '1 1 auto', fontSize: 13, color: INK }}>Methodology &amp; sample size<span className="lp2-caret">&nbsp;</span></span>
                      <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: ACCENT }}>editing</span>
                    </div>
                    <OutlineRow n="4" w="90%" />
                    <OutlineRow n="5" w="65%" />
                  </div>
                </div>
              </div>
              <div style={{ flex: '1 1 360px', minWidth: 0 }}>
                <div style={{ fontFamily: SERIF, fontSize: '1.4rem', color: '#C9C4B8', marginBottom: 10 }}>02 / 05</div>
                <div style={label}>Control</div>
                <h2 style={h2}>See the outline<br />before it builds<br />the slides.</h2>
                <p style={lede}>Deckify drafts an editable outline first. Reorder sections, rewrite a heading, cut what you don&rsquo;t need. <span style={{ fontStyle: 'italic', fontFamily: SERIF, fontSize: '1.15em' }}>Then</span> it generates. You&rsquo;re never stuck deleting a bad deck and starting over.</p>
              </div>
            </div>
          </div>
        </section>

        {/* F3: image handling */}
        <section style={{ borderTop: `1px solid ${HAIR}` }}>
          <div style={{ ...container, padding: sectionPad }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(36px,5vw,80px)', alignItems: 'center' }}>
              <div style={{ flex: '1 1 360px', minWidth: 0 }}>
                <div style={{ fontFamily: SERIF, fontSize: '1.4rem', color: '#C9C4B8', marginBottom: 10 }}>03 / 05</div>
                <div style={label}>Visuals</div>
                <h2 style={h2}>Every image,<br />exactly where it<br />earns its place.</h2>
                <p style={lede}>Upload your own figures and Deckify places them intelligently. A diagram or table is shown <span style={{ fontStyle: 'italic', fontFamily: SERIF, fontSize: '1.15em' }}>whole</span>, never cropped, on a clean matte; a photo fills its frame. No stock-photo filler, and AI illustration lands only on the few slides that genuinely need a picture, never as decoration on every slide.</p>
              </div>
              <div style={{ flex: '1 1 380px', minWidth: 0 }}>
                <div className="lp2-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, alignItems: 'start' }}>
                  {/* Framed figure — shown whole on a matte, with caption */}
                  <div className="lp2-card-hover" style={{ background: CREAM, border: `1px solid ${HAIR2}`, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ margin: 12, background: '#EEEBE4', border: `1px solid ${HAIR3}`, borderRadius: 3, aspectRatio: '4/3', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 6, padding: '16px 14px 12px' }}>
                      {[38, 58, 72, 90, 64].map((h, i) => (
                        <div key={i} style={{ width: '11%', height: `${h}%`, background: ACCENT, opacity: 0.85, borderRadius: '2px 2px 0 0' }} />
                      ))}
                    </div>
                    <div style={{ padding: '0 14px 13px', fontFamily: SERIF, fontStyle: 'italic', fontSize: '0.95rem', color: MUTED }}>Figure 1: contained, not cropped</div>
                  </div>
                  {/* Clean text-only slide — no image forced on */}
                  <div className="lp2-card-hover" style={{ background: CREAM, border: `1px solid ${HAIR2}`, borderRadius: 4, padding: 20 }}>
                    <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.18em', color: FAINT, marginBottom: 12 }}>No image needed</div>
                    <div style={{ fontFamily: SERIF, fontSize: '1.35rem', lineHeight: 1.1, marginBottom: 16 }}>Three findings that hold up</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <Bar w="100%" /><Bar w="86%" /><Bar w="70%" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* F4: academic (reversed) */}
        <section id="academic" style={{ borderTop: `1px solid ${HAIR}` }}>
          <div style={{ ...container, padding: sectionPad }}>
            <div style={{ display: 'flex', flexWrap: 'wrap-reverse', gap: 'clamp(36px,5vw,80px)', alignItems: 'center' }}>
              <div style={{ flex: '1 1 380px', minWidth: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ background: INK, color: CREAM, borderRadius: 4, padding: 'clamp(22px,3vw,32px)', boxShadow: '0 24px 50px -34px rgba(22,22,26,0.4)' }}>
                    <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#6b6860', marginBottom: 14 }}>Findings</div>
                    <div style={{ fontFamily: SERIF, fontSize: 'clamp(3rem,8vw,5rem)', lineHeight: 0.9, color: ACCENT }}>87<span style={{ fontSize: '0.5em' }}>%</span></div>
                    <div style={{ fontSize: 13, color: '#B9B5AB', marginTop: 12 }}>of variance explained by the model (p &lt; 0.001)</div>
                  </div>
                  <div style={{ background: CREAM, border: `1px solid ${HAIR2}`, borderRadius: 4, padding: 'clamp(20px,3vw,28px)' }}>
                    <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.18em', color: FAINT, marginBottom: 14 }}>Methodology</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                      {['100%', '82%', '68%'].map(w => (
                        <div key={w} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: ACCENT, marginTop: 7, flex: '0 0 auto' }} />
                          <div style={{ height: 7, background: HAIR3, borderRadius: 3, flex: '1 1 auto', maxWidth: w }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ flex: '1 1 360px', minWidth: 0 }}>
                <div style={{ fontFamily: SERIF, fontSize: '1.4rem', color: '#C9C4B8', marginBottom: 10 }}>04 / 05</div>
                <div style={label}>Academic</div>
                <h2 style={h2}>It speaks<br />the language<br />of research.</h2>
                <p style={lede}>Deckify knows what a defense needs: methodology, findings, limitations, big stat callouts. It structures your deck around academic formats instead of generic marketing layouts.</p>
              </div>
            </div>
          </div>
        </section>

        {/* F5: composed layouts */}
        <section style={{ borderTop: `1px solid ${HAIR}` }}>
          <div style={{ ...container, padding: sectionPad }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(36px,5vw,80px)', alignItems: 'center' }}>
              <div style={{ flex: '1 1 360px', minWidth: 0 }}>
                <div style={{ fontFamily: SERIF, fontSize: '1.4rem', color: '#C9C4B8', marginBottom: 10 }}>05 / 05</div>
                <div style={label}>Layouts</div>
                <h2 style={h2}>Slide types that<br />argue your point,<br />not just hold text.</h2>
                <p style={lede}>Deckify chooses from designed layouts instead of defaulting to bullets beside a photo. A comparison table for contrasting options, a stat row for headline numbers, a timeline for a process. Output that looks <span style={{ fontStyle: 'italic', fontFamily: SERIF, fontSize: '1.15em' }}>intentionally</span> composed.</p>
              </div>
              <div style={{ flex: '1 1 380px', minWidth: 0 }}>
                <div className="lp2-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Comparison table */}
                  <div className="lp2-card-hover" style={{ background: CREAM, border: `1px solid ${HAIR2}`, borderRadius: 4, overflow: 'hidden', boxShadow: '0 20px 44px -30px rgba(22,22,26,0.3)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr' }}>
                      {['', 'Battery EV', 'Hydrogen'].map((h, i) => (
                        <div key={i} style={{ background: ACCENT, color: CREAM, fontSize: 10, fontWeight: 600, letterSpacing: '0.02em', padding: '8px 12px' }}>{h}</div>
                      ))}
                      {[['Range', '480 km', '650 km'], ['Refuel', '30 min', '5 min'], ['Network', 'Broad', 'Sparse']].map((row, ri) => (
                        row.map((c, ci) => (
                          <div key={ri + '-' + ci} style={{ background: ri % 2 ? 'rgba(224,45,34,0.05)' : 'transparent', fontSize: 11, color: ci === 0 ? INK : BODY, fontWeight: ci === 0 ? 600 : 400, padding: '8px 12px', borderTop: `1px solid ${HAIR3}` }}>{c}</div>
                        ))
                      ))}
                    </div>
                  </div>
                  {/* Stat row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {[['−43%', 'Lighter'], ['2.4×', 'Faster'], ['+75%', 'Retained']].map(([v, l], i) => (
                      <div key={i} className="lp2-card-hover" style={{ background: CREAM, border: `1px solid ${HAIR2}`, borderRadius: 4, padding: '14px 12px' }}>
                        <div style={{ fontFamily: SERIF, fontSize: '1.9rem', color: ACCENT, lineHeight: 1 }}>{v}</div>
                        <div style={{ fontSize: 10, color: FAINT, marginTop: 6 }}>{l}</div>
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
      <section style={{ borderTop: `1px solid ${HAIR}`, background: CREAM }}>
        <div style={{ ...container, padding: 'clamp(48px,8vh,96px) clamp(20px,5vw,72px)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(32px,5vw,72px)', alignItems: 'center' }}>
            <div style={{ flex: '1 1 340px', minWidth: 0 }}>
              <div style={label}>AI images</div>
              <h2 style={{ ...h2, fontSize: 'clamp(1.9rem,4vw,3rem)' }}>Generate images<br />without waiting<br />on them.</h2>
              <p style={lede}>Describe an image, pick a style, and keep working. It lands in your library when it&rsquo;s ready, reusable across every deck you build. No sitting and watching a spinner inside the editor.</p>
            </div>
            <div style={{ flex: '1 1 400px', minWidth: 0 }}>
              <div style={{ background: BG, border: `1px solid ${HAIR2}`, borderRadius: 6, padding: 18, boxShadow: '0 24px 50px -34px rgba(22,22,26,0.3)' }}>
                <div style={{ background: CREAM, border: `1px solid ${HAIR2}`, borderRadius: 4, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: BODY, flex: '1 1 auto' }}>a rooftop solar team at work, golden hour</span>
                  <span style={{ background: ACCENT, color: CREAM, fontSize: 11, fontWeight: 600, borderRadius: 3, padding: '5px 10px' }}>Generate</span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  {[['Illustration', true], ['Photo', false], ['Abstract', false]].map(([t, on], i) => (
                    <span key={i} style={{ fontSize: 11, padding: '5px 11px', borderRadius: 16, border: `1px solid ${on ? ACCENT : HAIR2}`, color: on ? ACCENT : MUTED, background: on ? 'rgba(224,45,34,0.06)' : 'transparent', fontWeight: on ? 600 : 500 }}>{t}</span>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ aspectRatio: '1', borderRadius: 4, background: `repeating-linear-gradient(${i % 2 ? '-45deg' : '45deg'},#E9E6DF,#E9E6DF 5px,#F4F2EC 5px,#F4F2EC 10px)`, border: `1px solid ${HAIR3}` }} />
                  ))}
                  <div style={{ aspectRatio: '1', borderRadius: 4, border: `1.5px dashed ${HAIR2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: FAINT }}>
                    <span className="lp2-spin" style={{ fontSize: 15 }}>⟳</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SPEED COMPARISON (RED) ============ */}
      <section id="speed" style={{ position: 'relative', background: ACCENT, color: CREAM, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: '-4%', top: '50%', transform: 'translateY(-50%)', fontFamily: SERIF, fontSize: 'clamp(20rem,42vw,46rem)', lineHeight: 0.7, color: 'rgba(255,255,255,0.07)', pointerEvents: 'none', userSelect: 'none' }}>/</div>
        <div style={{ position: 'relative', ...container, padding: 'clamp(64px,12vh,140px) clamp(20px,5vw,72px)' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.24em', color: 'rgba(255,255,255,0.7)', marginBottom: 22 }}>The difference</div>
          <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 'clamp(2.4rem,6vw,4.8rem)', lineHeight: 1, letterSpacing: '-0.01em', margin: '0 0 clamp(40px,7vh,72px)', maxWidth: '16ch' }}>Fewer steps. Better decks.</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(32px,5vw,72px)' }}>
            <div style={{ flex: '1 1 300px', minWidth: 0 }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'rgba(255,255,255,0.7)', paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.28)', marginBottom: 18 }}>The usual way</div>
              <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Open the tool, pick a blank', 'Write a careful prompt', 'Generate, wait, regenerate', 'Fight the theme & layout', 'Hunt for images', 'Rewrite half the text'].map((step, i) => (
                  <li key={i} style={{ display: 'flex', gap: 14, alignItems: 'baseline', fontSize: 'clamp(1rem,1.3vw,1.2rem)', color: 'rgba(255,255,255,0.82)' }}>
                    <span style={{ fontFamily: SERIF, fontSize: '1.1rem', color: 'rgba(255,255,255,0.55)', width: 22 }}>{String(i + 1).padStart(2, '0')}</span> {step}
                  </li>
                ))}
              </ol>
            </div>
            <div style={{ flex: '1 1 300px', minWidth: 0 }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.16em', color: CREAM, paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.28)', marginBottom: 18 }}>Deckify</div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
                <span style={{ fontFamily: SERIF, fontSize: 'clamp(3.5rem,9vw,6rem)', lineHeight: 0.85 }}>1</span>
                <div>
                  <div style={{ fontFamily: SERIF, fontSize: 'clamp(1.6rem,3.4vw,2.6rem)', lineHeight: 1.05 }}>Type your topic.</div>
                  <div style={{ fontSize: 'clamp(1.1rem,1.6vw,1.4rem)', color: 'rgba(255,255,255,0.85)', marginTop: 6 }}>→ Done in ~60 seconds.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section id="pricing" style={{ borderTop: `1px solid ${HAIR}` }}>
        <div style={{ ...container, padding: sectionPad }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, marginBottom: 'clamp(36px,6vh,60px)' }}>
            <div>
              <div style={label}>Pricing</div>
              <h2 style={h2}>Priced like a<br />student budget.</h2>
            </div>
            <p style={{ maxWidth: '26rem', fontSize: 'clamp(1rem,1.1vw,1.1rem)', lineHeight: 1.6, color: BODY, margin: 0 }}>Start free. No card, no trial clock. Upgrade when you need more decks in a busy semester.</p>
          </div>

          <div className="lp2-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18, alignItems: 'stretch' }}>

            {/* Free */}
            <div className="lp2-card-hover" style={{ background: CREAM, border: `1px solid ${HAIR2}`, borderRadius: 5, padding: 'clamp(26px,3vw,36px)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.16em', color: MUTED }}>Free</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, margin: '20px 0 6px' }}>
                <span style={{ fontSize: 'clamp(2.6rem,5vw,3.4rem)' }}><Price amount="0" /></span>
              </div>
              <div style={{ fontSize: 12, color: FAINT, marginBottom: 26 }}>forever · no credit card</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 30, flex: '1 1 auto' }}>
                <Feature>3 free decks to start</Feature>
                <Feature>Editable outline + slides</Feature>
                <Feature>Export to PDF &amp; PPTX</Feature>
              </div>
              <a href="/login" className="lp2-btn-outline" style={{ textAlign: 'center', fontSize: 11, padding: 14 }}>Start free</a>
            </div>

            {/* Student Pro */}
            <div className="lp2-card-hover" style={{ background: INK, color: CREAM, border: `1px solid ${INK}`, borderRadius: 5, padding: 'clamp(26px,3vw,36px)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, right: 24, transform: 'translateY(-50%)', background: ACCENT, color: CREAM, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', padding: '6px 12px' }}>Most popular</div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#B9B5AB' }}>Student Pro</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '20px 0 6px' }}>
                <span style={{ fontSize: 'clamp(2.6rem,5vw,3.4rem)' }}><Price amount="199" color={ACCENT} /></span>
                <span style={{ fontSize: 13, color: '#B9B5AB' }}>/ month</span>
              </div>
              <div style={{ fontSize: 12, color: '#6b6860', marginBottom: 26 }}>≈ US$6 · cancel anytime</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 30, flex: '1 1 auto' }}>
                <Feature dark>Unlimited decks all semester</Feature>
                <Feature dark>Smart image placement &amp; AI images</Feature>
                <Feature dark>PDF import &amp; academic templates</Feature>
                <Feature dark>Priority generation</Feature>
              </div>
              <a href="/login" className="lp2-btn-inverse" style={{ textAlign: 'center', fontSize: 11, padding: 14 }}>Get Student Pro</a>
            </div>

            {/* Group — coming soon */}
            <div className="lp2-card-hover" style={{ background: CREAM, border: `1px solid ${HAIR2}`, borderRadius: 5, padding: 'clamp(26px,3vw,36px)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, right: 24, transform: 'translateY(-50%)', background: BG, border: `1px solid ${HAIR2}`, color: MUTED, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', padding: '6px 12px' }}>Coming soon</div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.16em', color: MUTED }}>Group</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '20px 0 6px' }}>
                <span style={{ fontSize: 'clamp(2.6rem,5vw,3.4rem)' }}><Price amount="129" /></span>
                <span style={{ fontSize: 13, color: FAINT }}>/ seat</span>
              </div>
              <div style={{ fontSize: 12, color: FAINT, marginBottom: 26 }}>3+ seats · for project teams</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 30, flex: '1 1 auto' }}>
                <Feature>Everything in Student Pro</Feature>
                <Feature>Shared deck workspace</Feature>
                <Feature>Real-time co-editing</Feature>
              </div>
              <span style={{ textAlign: 'center', border: `1px solid ${HAIR2}`, color: FAINT, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', padding: 14, cursor: 'default' }}>Coming soon</span>
            </div>

          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section id="cta" style={{ ...container, padding: 'clamp(72px,14vh,160px) clamp(20px,5vw,72px)', textAlign: 'center' }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.24em', color: MUTED, marginBottom: 24 }}>Ready when you are</div>
        <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 'clamp(2.6rem,7vw,5.6rem)', lineHeight: 0.98, letterSpacing: '-0.015em', margin: '0 auto', maxWidth: '15ch' }}>Your deck is sixty seconds away.</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 18, marginTop: 'clamp(32px,5vh,44px)' }}>
          <a href="/login" className="lp2-btn" style={{ fontSize: 12, padding: '16px 34px' }}>Try it free</a>
          <span style={{ fontSize: 12, letterSpacing: '0.06em', color: MUTED }}>Free to try · No credit card required</span>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer style={{ borderTop: `1px solid ${HAIR2}` }}>
        <div style={{ ...container, padding: 'clamp(40px,6vh,64px) clamp(20px,5vw,72px)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(32px,5vw,64px)', justifyContent: 'space-between' }}>
            <div style={{ flex: '1 1 240px', minWidth: 0 }}>
              <div style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 600, letterSpacing: '-0.01em' }}>Deckify<span style={{ color: ACCENT }}>.</span></div>
              <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, margin: '12px 0 0', maxWidth: '22rem' }}>AI presentations for students. From topic to defense-ready deck in under a minute.</p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(32px,5vw,64px)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.16em', color: FAINT, marginBottom: 4 }}>Product</div>
                <a href="#features" style={{ fontSize: 13, color: BODY }}>Features</a>
                <a href="#speed" style={{ fontSize: 13, color: BODY }}>Speed</a>
                <a href="#pricing" style={{ fontSize: 13, color: BODY }}>Pricing</a>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.16em', color: FAINT, marginBottom: 4 }}>Get started</div>
                <a href="/login" style={{ fontSize: 13, color: BODY }}>Sign up free</a>
                <a href="/login" style={{ fontSize: 13, color: BODY }}>Log in</a>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center', marginTop: 'clamp(32px,5vh,48px)', paddingTop: 22, borderTop: `1px solid ${HAIR3}` }}>
            <span style={{ fontSize: 12, color: FAINT }}>© 2026 Deckify. Built for students.</span>
            <span style={{ fontSize: 12, color: FAINT }}>Made with restraint.</span>
          </div>
        </div>
      </footer>

      </div>
    </div>
  )
}
