'use client'

import { useEffect, useRef } from 'react'

const T = {
  bg:     '#EFE6D3',
  cream:  '#EFE6D3',
  accent: '#A6442F',
  gold:   '#CB8A3E',
  teal:   '#6E8B86',
  text:   '#2C1F14',
  text2:  '#6B5344',
  text3:  '#9C8070',
  border: '#D4C8B0',
}

const CARDS = [
  { rot: -6, tx: -22, ty:  8, delay: '0s'   },
  { rot: -2, tx:  -6, ty:  3, delay: '0.1s' },
  { rot:  2, tx:   6, ty:  3, delay: '0.2s' },
  { rot:  6, tx:  22, ty:  8, delay: '0.3s' },
]

const STEPS = [
  { n: '1', title: 'Type your topic',          body: 'Paste a sentence, a thesis abstract, or rough notes — Deckify handles the rest.' },
  { n: '2', title: 'AI writes every slide',    body: 'Deckify structures the content and writes each slide for you, with speaker notes included.' },
  { n: '3', title: 'Edit, present, or export', body: 'Tweak anything in the editor, present full-screen, or download as PDF or PowerPoint.' },
]

const BFO = "'Alfa Slab One', serif"
const DMS = "'DM Sans', sans-serif"

export default function LandingPage() {
  const stackRef = useRef<HTMLDivElement>(null)
  const rafRef   = useRef<number | null>(null)
  const stepsRef = useRef<HTMLDivElement>(null)

  /* ── cursor tilt ── */
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || 'ontouchstart' in window) return
    const onMove = (e: MouseEvent) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const el = stackRef.current
        if (!el) return
        const r  = el.getBoundingClientRect()
        const rx = -((e.clientY - (r.top  + r.height / 2)) / window.innerHeight) * 8
        const ry =  ((e.clientX - (r.left + r.width  / 2)) / window.innerWidth)  * 8
        el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`
      })
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMove)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  /* ── scroll reveal for steps ── */
  useEffect(() => {
    const el = stepsRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('steps-visible'); obs.disconnect() } },
      { threshold: 0.15 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div style={{ fontFamily: DMS, background: T.bg, color: T.text, overflowX: 'clip' }}>

        {/* ══ 1. Nav ══ */}
        <nav style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 48px',
          background: T.bg,
          borderBottom: `3px solid ${T.text}`,
        }}>
          <span style={{ fontFamily: BFO, fontSize: 28, color: T.text, letterSpacing: '0.01em', lineHeight: 1 }}>
            Deckify
          </span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <a href="/login" className="lp-login lp-nomob" style={{
              fontSize: 13, fontWeight: 700, color: T.text2,
              textDecoration: 'none', padding: '8px 16px',
              transition: 'color .15s',
            }}>
              Log in
            </a>
            <a href="/login" className="lp-pill" style={{
              fontFamily: DMS, fontSize: 13, fontWeight: 700,
              color: T.cream, background: T.accent,
              textDecoration: 'none', padding: '11px 24px', borderRadius: 99,
              display: 'inline-block',
              boxShadow: `3px 3px 0 ${T.text}`,
              transition: 'background .15s, transform .1s',
            }}>
              Get started
            </a>
          </div>
        </nav>

        {/* ══ 2. Hero ══ */}
        <section className="lp-grain" style={{ padding: '72px 48px 88px', background: T.bg }}>
          <div className="lp-hero-grid" style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 56, alignItems: 'center',
            maxWidth: 1120, margin: '0 auto',
          }}>

            {/* — text — */}
            <div>
              <h1 className="lp-h1" style={{
                fontFamily: BFO, fontSize: 60, lineHeight: 1.06,
                color: T.accent,
                textShadow: `5px 5px 0 ${T.gold}`,
                marginBottom: 24,
                animation: 'float-up 0.6s 0s ease both',
              }}>
                Type your topic.<br />
                AI builds the<br />
                whole deck.
              </h1>
              <p style={{
                fontSize: 17, color: T.text2, lineHeight: 1.72,
                maxWidth: 420, marginBottom: 36,
                animation: 'float-up 0.6s 0.12s ease both',
              }}>
                Deckify reads your topic or thesis abstract, writes every slide,
                applies a professional theme, and hands you an editable presentation
                in under 30 seconds.
              </p>
              <div style={{ animation: 'float-up 0.6s 0.22s ease both', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
                <a href="/login" className="lp-pill" style={{
                  fontFamily: DMS, fontSize: 15, fontWeight: 700,
                  color: T.cream, background: T.accent,
                  textDecoration: 'none', padding: '14px 32px', borderRadius: 99,
                  display: 'inline-block',
                  boxShadow: `4px 4px 0 ${T.text}`,
                  transition: 'background .15s, transform .1s',
                }}>
                  Get started free →
                </a>
                <span style={{ fontSize: 12, color: T.text3, paddingLeft: 4 }}>No credit card needed</span>
              </div>
            </div>

            {/* — deck-shuffle stack — */}
            <div className="lp-stack-col" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ perspective: 900 }}>
                <div ref={stackRef} style={{
                  position: 'relative', width: 300, height: 188,
                  transformStyle: 'preserve-3d',
                  transition: 'transform 0.12s ease-out',
                }}>
                  {CARDS.map((c, i) => (
                    <div
                      key={i}
                      className="lp-card"
                      style={{
                        ['--fanned' as string]: `rotate(${c.rot}deg) translate(${c.tx}px, ${c.ty}px)`,
                        animationDelay: c.delay,
                        position: 'absolute', inset: 0,
                        background: '#F2E8D5',
                        border: `2px solid ${T.text}`,
                        borderRadius: 18,
                        boxShadow: `5px 5px 0 ${T.text}`,
                        padding: '22px 22px 16px',
                        overflow: 'hidden',
                      } as React.CSSProperties}
                    >
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: T.accent, borderRadius: '18px 18px 0 0' }} />
                      <div style={{ marginTop: 8 }}>
                        <div style={{ height: 10, width: '52%', background: T.border, borderRadius: 5, marginBottom: 14 }} />
                        <div style={{ height: 7, width: '82%', background: '#D9CEBA', borderRadius: 4, marginBottom: 7 }} />
                        <div style={{ height: 7, width: '68%', background: '#D9CEBA', borderRadius: 4, marginBottom: 7 }} />
                        <div style={{ height: 7, width: '75%', background: '#D9CEBA', borderRadius: 4, marginBottom: 16 }} />
                        <div style={{ display: 'flex', gap: 6 }}>
                          <div style={{ height: 5, width: 34, background: T.border,   borderRadius: 3 }} />
                          <div style={{ height: 5, width: 22, background: '#D9CEBA', borderRadius: 3 }} />
                        </div>
                      </div>
                      <div style={{ position: 'absolute', bottom: 10, right: 14, fontSize: 11, fontFamily: BFO, color: T.text3 }}>
                        0{i + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ 3. Our Story ══ */}
        <section className="lp-grain" style={{
          background: T.bg,
          borderTop: `3px solid ${T.text}`,
          padding: '80px 48px',
        }}>
          <div className="lp-story-grid" style={{
            display: 'grid', gridTemplateColumns: '220px 1fr',
            gap: 56, maxWidth: 1120, margin: '0 auto', alignItems: 'start',
          }}>
            <div>
              <h2 className="lp-story-h" style={{
                fontFamily: BFO, fontSize: 52, lineHeight: 1.0,
                color: T.accent,
                textShadow: `4px 4px 0 ${T.text}`,
                margin: 0,
              }}>
                Our<br />Story
              </h2>
              <div style={{ width: 56, height: 4, background: T.gold, borderRadius: 2, marginTop: 14 }} />
            </div>
            <div className="lp-story-cols" style={{ columnCount: 2, columnGap: 40 } as React.CSSProperties}>
              <p style={{ fontSize: 15, color: T.text, lineHeight: 1.82, marginBottom: 16, breakInside: 'avoid' as React.CSSProperties['breakInside'] }}>
                Deckify is a student-built tool for students. We know the all-nighter
                before a presentation is due — staring at a blank slide, fighting the
                formatting instead of the ideas.
              </p>
              <p style={{ fontSize: 15, color: T.text, lineHeight: 1.82, breakInside: 'avoid' as React.CSSProperties['breakInside'] }}>
                Deckify turns the part you dread into the part you don&apos;t think about,
                so you can spend your time on the work that actually matters.
                Paste your topic. Walk away with a deck.
              </p>
            </div>
          </div>
        </section>

        {/* ══ 4. Full-bleed terracotta block ══ */}
        <section style={{
          background: '#8C3828',
          borderTop: `3px solid ${T.text}`,
          borderBottom: `3px solid ${T.text}`,
          padding: '96px 48px',
          textAlign: 'center',
        }}>
          <p style={{
            fontFamily: DMS, fontSize: 11, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: 'rgba(245,240,232,0.55)',
            marginBottom: 28,
          }}>
            From idea to slides in 30 seconds
          </p>
          <h2 className="lp-big-h" style={{
            fontFamily: BFO,
            fontSize: 76, lineHeight: 1.0,
            color: T.cream,
            textShadow: `6px 6px 0 ${T.text}`,
            maxWidth: 880, margin: '0 auto 48px',
          }}>
            Your next <span style={{ color: T.gold }}>great</span><br />presentation starts<br />with one sentence.
          </h2>
          <a href="/login" className="lp-pill-gold" style={{
            fontFamily: DMS, fontSize: 15, fontWeight: 700,
            color: T.text, background: T.gold,
            textDecoration: 'none', padding: '14px 36px', borderRadius: 99,
            display: 'inline-block',
            boxShadow: `4px 4px 0 ${T.text}`,
            transition: 'background .15s, transform .1s',
          }}>
            Get started free →
          </a>
        </section>

        {/* ══ 5. How it works ══ */}
        <section className="lp-grain" style={{
          background: T.bg,
          borderTop: `3px solid ${T.text}`,
          padding: '80px 48px',
        }}>
          <div style={{ maxWidth: 1060, margin: '0 auto' }}>
            <h2 style={{
              fontFamily: BFO, fontSize: 52,
              color: T.text,
              textShadow: `4px 4px 0 ${T.accent}`,
              marginBottom: 48, lineHeight: 1,
            }}>
              How it works
            </h2>
            <div ref={stepsRef} className="lp-steps-grid" style={{
              display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24,
            }}>
              {STEPS.map((s, i) => (
                <div key={i} className="lp-step" style={{
                  background: '#F2E8D5',
                  border: `2px solid ${T.text}`,
                  borderRadius: 18, padding: '32px 28px',
                  boxShadow: `4px 4px 0 ${T.text}`,
                }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%',
                    background: [T.accent, T.teal, T.gold][i],
                    border: `2px solid ${T.text}`,
                    color: i === 2 ? T.text : T.cream,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: BFO, fontSize: 20, lineHeight: 1,
                    marginBottom: 18, flexShrink: 0,
                    boxShadow: `2px 2px 0 ${T.text}`,
                  }}>
                    {s.n}
                  </div>
                  <h3 style={{ fontFamily: BFO, fontSize: 22, color: T.text, marginBottom: 10, lineHeight: 1.15 }}>
                    {s.title}
                  </h3>
                  <p style={{ fontFamily: DMS, fontSize: 14, color: T.text2, lineHeight: 1.65 }}>
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ 6. Footer ══ */}
        <footer style={{
          background: T.accent,
          borderTop: `4px solid ${T.gold}`,
          padding: '36px 48px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16,
        }}>
          <span style={{ fontFamily: BFO, fontSize: 26, color: T.cream, lineHeight: 1 }}>
            Deckify
          </span>
          <span style={{ fontFamily: DMS, fontSize: 13, color: 'rgba(245,240,232,0.65)' }}>
            Made by students, for students · hello@deckify.app
          </span>
          <a href="/login" style={{
            fontFamily: DMS, fontSize: 13, fontWeight: 700,
            color: T.cream, textDecoration: 'none', opacity: 0.85,
          }}>
            Sign in →
          </a>
        </footer>

      </div>
  )
}
