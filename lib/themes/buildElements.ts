import type { ThemeKey } from './config';
import { TBGS, TTXTS, TACCS, THEME_CONFIGS } from './config';

export interface EdElement {
  id: string;
  role: string;
  type: 'gradient' | 'image' | 'text' | 'chart';
  x: number;
  y: number;
  w: number;
  h: number;
  // gradient fields
  from?: string;
  to?: string;
  dir?: string;
  // image fields
  src?: string;
  /** How the image fills its box. Photos crop to fill (cover); diagrams,
      tables and charts are shown whole on a matte (contain) so no label or
      axis is ever cut off. Defaults to cover when unset. */
  fit?: 'cover' | 'contain';
  /** Background painted behind a contained image (the letterbox matte). */
  matte?: string;
  // text fields
  html?: string;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  align?: string;
  uppercase?: boolean;
  fontFamily?: string;
  // editor-only runtime fields
  chartType?: string;
  _hidden?: boolean;
}

/** Per-image metadata, keyed by image URL on `SlideData.imgMeta`.
    Captured at upload time (w/h) and by vision (caption/kind). Drives smart
    fit: `figure` → contain on a matte, `photo` → cover. */
export interface ImageMeta {
  w?: number;
  h?: number;
  caption?: string;
  kind?: 'photo' | 'figure';
}

export interface SlideData {
  type?: string;
  title?: string;
  subtitle?: string;
  body?: string;
  bullets?: string[];
  stat?: string;
  quote?: string;
  attribution?: string;
  steps?: string[];
  items?: { label: string; value: string }[];
  img?: string;
  /** Additional user-uploaded images on this slide (beyond img). Rendered as
      stacked cells in the split-panel layouts; max 3 images per slide total. */
  extraImgs?: string[];
  /** Per-image metadata (w/h/caption/kind), keyed by image URL. */
  imgMeta?: Record<string, ImageMeta>;
  speaker_notes?: string;
  [key: string]: unknown;
}

export function buildEdEls(slide: SlideData, theme: ThemeKey, idx: number): EdElement[] {
  const th = theme;
  const els: EdElement[] = [];
  const type = slide.type || 'text';
  const cfg = THEME_CONFIGS[th] || THEME_CONFIGS.clean;
  const layout = cfg.layout;
  const toa = cfg.toa;

  // True when the slide carries a real AI/stock image (not a picsum placeholder).
  const hasImg = !!(slide.img && !slide.img.includes('picsum.photos'));

  // ── Smart image fit ─────────────────────────────────────────────────────
  // Diagrams / tables / charts (kind:'figure') must be shown whole, so they
  // render `contain` on a neutral matte; photographs crop to fill (`cover`).
  const imgMeta = slide.imgMeta || {};
  const MATTE = cfg.dark ? '#16161c' : '#f2f1ec';
  const isFigure = (src?: string): boolean =>
    !!src && imgMeta[src]?.kind === 'figure';
  // Applies fit + matte to the most recently pushed image element.
  function applyFit(src?: string) {
    const last = els[els.length - 1];
    if (!last || last.type !== 'image') return;
    if (isFigure(src)) { last.fit = 'contain'; last.matte = MATTE; }
    else { last.fit = 'cover'; }
  }

  function tfs(text: string, maxPx: number): number {
    const l = (text || '').length;
    // Readability floor: long titles shrink, but never below 14px (or half the
    // max for large display sizes). Without this, an 80-char stat title
    // rendered at 9px — unreadable on a projector.
    const mn = Math.max(14, Math.round(maxPx * 0.5));
    if (l <= 18) return maxPx;
    if (l <= 28) return Math.max(mn, Math.round(maxPx * 0.80));
    if (l <= 42) return Math.max(mn, Math.round(maxPx * 0.66));
    if (l <= 60) return Math.max(mn, Math.round(maxPx * 0.55));
    if (l <= 80) return Math.max(mn, Math.round(maxPx * 0.46));
    return Math.max(mn, Math.round(maxPx * 0.38));
  }

  // 0.58 matches DM Sans average char width more accurately than the old 0.72
  function thC(text: string, fs: number, w: number): number {
    const eff = Math.max(1, (w || 380) - 18);
    const cpl = Math.max(1, Math.floor(eff / (fs * 0.58)));
    const lines = Math.ceil((text || '').length / cpl) + 1;
    return Math.max(52, lines * Math.round(fs * 1.6) + 16);
  }

  function solid(id: string, x: number, y: number, w: number, h: number, color: string, role: string) {
    els.push({ id, role: role || 'extra', type: 'gradient', x, y, w, h, from: color, to: color, dir: 'to right' });
  }

  function imgEl(x: number, y: number, w: number, h: number) {
    if (!hasImg) {
      // No real image → fill the would-be image region with a themed gradient
      // so the composition stays intentional instead of showing a stock photo.
      els.push({ id: 'img0', role: 'img', type: 'gradient', x, y, w, h, from: TACCS[th], to: TBGS[th], dir: 'to bottom right' });
      return;
    }
    els.push({ id: 'img0', role: 'img', type: 'image', src: slide.img!, x, y, w, h });
    applyFit(slide.img);
  }

  function grad(x: number, y: number, w: number, h: number, from: string, to: string, dir?: string) {
    els.push({ id: 'grad0', role: 'gradient', type: 'gradient', x, y, w, h, from, to, dir: dir || 'to right' });
  }

  function mkBullets(tx: number, tw: number) {
    const safeTw = Math.min(tw, 856 - tx);
    if (!hasImg) {
      solid('rbar', 876, 0, 24, 562, TACCS[th], 'gradient');
      els.push({ id: 'num', role: 'extra', type: 'text', html: String(idx + 1).padStart(2, '0'), x: 816, y: 18, w: 56, h: 72, fontSize: 52, bold: true, color: TACCS[th] + '13', align: 'right' });
    }
    const bfs = tfs(slide.title || '', 30);
    const bht = Math.max(52, thC(slide.title || '', bfs, safeTw));
    els.push({ id: 'tag0', role: 'tag', type: 'text', html: 'Slide ' + (idx + 1), x: tx, y: 40, w: 200, h: 22, fontSize: 11, bold: true, color: TACCS[th], align: 'left', uppercase: true });
    els.push({ id: 'title0', role: 'title', type: 'text', html: slide.title || '', x: tx, y: 68, w: safeTw, h: bht, fontSize: bfs, bold: true, color: TTXTS[th], align: 'left' });
    solid('div', tx, 68 + bht + 8, 56, 3, TACCS[th], 'extra');
    const bullets = slide.bullets || [];
    const twoCol = bullets.length >= 4 && !hasImg;
    const gap = 24;
    const colW = twoCol ? Math.floor((safeTw - gap) / 2) : safeTw;
    const startY = 68 + bht + 30;
    const bulletFs = 15;
    if (twoCol) {
      const colY = [startY, startY];
      bullets.forEach((b, bi) => {
        const col = bi % 2;
        const bx = tx + col * (colW + gap);
        const bh = Math.max(44, thC(b, bulletFs, colW - 24));
        solid('bdot' + bi, bx + 2, colY[col] + 12, 3, 18, TACCS[th], 'extra');
        els.push({ id: 'b' + bi, role: 'bullet', type: 'text', html: b, x: bx + 20, y: colY[col], w: colW - 24, h: bh, fontSize: bulletFs, bold: false, color: TTXTS[th] + 'ee', align: 'left' });
        colY[col] += bh + 12;
      });
    } else {
      let curBY = startY;
      bullets.forEach((b, bi) => {
        const bh = Math.max(46, thC(b, bulletFs, safeTw - 24));
        solid('bdot' + bi, tx + 2, curBY + 12, 3, 18, TACCS[th], 'extra');
        els.push({ id: 'b' + bi, role: 'bullet', type: 'text', html: b, x: tx + 20, y: curBY, w: safeTw - 24, h: bh, fontSize: bulletFs, bold: false, color: TTXTS[th] + 'ee', align: 'left' });
        curBY += bh + 12;
      });
    }
  }

  function mkStat(tx: number, tw: number) {
    const st = slide.stat || slide.title || '';
    const sfs = st.length <= 4 ? 120 : st.length <= 7 ? 96 : st.length <= 12 ? 72 : 56;
    // The title is the context line for the number — it must stay readable.
    const tl = tfs(slide.title || '', 20);
    const light = hasImg;
    const txtMain  = light ? '#ffffff'   : TACCS[th];
    const txtLabel = light ? '#ffffffd9' : TTXTS[th];
    const txtBody  = light ? '#ffffffb3' : TTXTS[th] + '99';
    if (hasImg) {
      // Full-bleed image with a vertical scrim: darker at the bottom where the
      // supporting text sits, lighter up top so the image still reads.
      els.push({ id: 'img0', role: 'img', type: 'image', src: slide.img!, x: 0, y: 0, w: 900, h: 562 });
      els.push({ id: 'overlay0', role: 'overlay', type: 'gradient', x: 0, y: 0, w: 900, h: 562, from: 'rgba(10,10,14,0.44)', to: 'rgba(10,10,14,0.72)', dir: 'to bottom' });
      solid('topbar', 0, 0, 900, 6, TACCS[th], 'gradient');
    } else {
      solid('topbar', 0, 0, 900, 8, TACCS[th], 'gradient');
      // Oversized ghost number anchors the composition without an image.
      els.push({ id: 'deco0', role: 'extra', type: 'text', html: st.slice(0, 4), x: 470, y: 210, w: 430, h: 340, fontSize: 230, bold: true, color: TACCS[th] + '0d', align: 'right' });
    }
    els.push({ id: 'tag0', role: 'tag', type: 'text', html: 'Slide ' + (idx + 1), x: tx, y: 34, w: 200, h: 22, fontSize: 11, bold: true, color: light ? '#ffffffaa' : TACCS[th], align: 'left', uppercase: true });
    // Composition: number is the hero in the upper middle, context line under
    // it, supporting body anchored near the bottom. Fixed bands, no overlap.
    els.push({ id: 'stat0', role: 'body', type: 'text', html: st, x: tx, y: 120, w: tw, h: sfs + 50, fontSize: sfs, bold: true, color: txtMain, align: 'center' });
    els.push({ id: 'title0', role: 'title', type: 'text', html: slide.title || '', x: tx + 40, y: 130 + sfs + 50, w: tw - 80, h: thC(slide.title || '', tl, tw - 80), fontSize: tl, bold: true, color: txtLabel, align: 'center' });
    if (slide.body) els.push({ id: 'body0', role: 'body', type: 'text', html: slide.body, x: tx + 90, y: 420, w: tw - 180, h: Math.max(52, thC(slide.body, 14, tw - 180)), fontSize: 14, bold: false, color: txtBody, align: 'center' });
  }

  function mkQuote() {
    solid('bg', 0, 0, 900, 562, TACCS[th], 'gradient');
    const qt = slide.quote || slide.title || '';
    const qfs = tfs(qt, 22);
    els.push({ id: 'qbg', role: 'extra', type: 'text', html: '"', x: 20, y: -20, w: 200, h: 160, fontSize: 180, bold: false, color: 'rgba(255,255,255,0.1)', align: 'left' });
    els.push({ id: 'tag0', role: 'tag', type: 'text', html: 'Slide ' + (idx + 1), x: 64, y: 48, w: 300, h: 22, fontSize: 11, bold: true, color: toa + '99', align: 'left', uppercase: true });
    els.push({ id: 'quote0', role: 'title', type: 'text', html: qt, x: 64, y: 120, w: 780, h: thC(qt, qfs, 780), fontSize: qfs, bold: false, italic: true, color: toa, align: 'left' });
    if (slide.attribution) els.push({ id: 'attr0', role: 'body', type: 'text', html: slide.attribution, x: 64, y: 380, w: 600, h: 38, fontSize: 13, bold: true, color: toa + 'bb', align: 'left' });
    solid('bline', 64, 500, 120, 3, toa + '44', 'extra');
  }

  function mkMethod(tx: number, tw: number) {
    // Keep the accent bar off the image panel when the slide is split.
    solid('topbar', 0, 0, hasImg ? 510 : 900, 8, TACCS[th], 'gradient');
    const steps = slide.steps || [];
    const mfs = tfs(slide.title || '', 26);
    const titleH = thC(slide.title || '', mfs, tw);
    els.push({ id: 'tag0', role: 'tag', type: 'text', html: 'Slide ' + (idx + 1), x: tx, y: 32, w: 200, h: 22, fontSize: 11, bold: true, color: TACCS[th], align: 'left', uppercase: true });
    els.push({ id: 'title0', role: 'title', type: 'text', html: slide.title || '', x: tx, y: 58, w: tw, h: titleH, fontSize: mfs, bold: true, color: TTXTS[th], align: 'left' });
    const numW = 56;
    const textW = tw - numW - 24;
    let cardY = 58 + titleH + 20;
    steps.forEach((s, si) => {
      const text = s.replace(/^Step\s*\d+[\:\.\-]\s*/i, '');
      const textH = Math.max(38, thC(text, 14, textW));
      const cH = Math.max(64, textH + 22);
      solid('cb' + si, tx, cardY, tw, cH, TACCS[th] + '0f', 'gradient');
      solid('cl' + si, tx, cardY, 4, cH, TACCS[th], 'extra');
      els.push({ id: 'sn' + si, role: 'extra', type: 'text', html: String(si + 1), x: tx + 8, y: cardY + 8, w: numW - 8, h: cH - 16, fontSize: 28, bold: true, color: TACCS[th], align: 'center' });
      els.push({ id: 'st' + si, role: 'extra', type: 'text', html: text, x: tx + numW + 14, y: cardY + 11, w: textW, h: cH - 22, fontSize: 14, bold: false, color: TTXTS[th] + 'dd', align: 'left' });
      cardY += cH + 10;
    });
  }

  function mkFindings(tx: number, tw: number) {
    solid('topbar', 0, 0, 900, 8, TACCS[th], 'gradient');
    const items = (slide.items || []).slice(0, 4);
    const n = items.length || 1;
    const ffs = tfs(slide.title || '', 26);
    const titleH = thC(slide.title || '', ffs, tw);
    els.push({ id: 'tag0', role: 'tag', type: 'text', html: 'Slide ' + (idx + 1), x: tx, y: 32, w: 200, h: 22, fontSize: 11, bold: true, color: TACCS[th], align: 'left', uppercase: true });
    els.push({ id: 'title0', role: 'title', type: 'text', html: slide.title || '', x: tx, y: 58, w: tw, h: titleH, fontSize: ffs, bold: true, color: TTXTS[th], align: 'left' });
    // 1-2 items sit side by side comfortably; 3-4 wrap into a 2x2 grid so
    // values stay large instead of being crushed into narrow columns.
    const gap = 14;
    const cols = n <= 2 ? n : 2;
    const rows = Math.ceil(n / cols);
    const cardW = Math.floor((tw - gap * (cols - 1)) / cols);
    const cardH = rows > 1 ? 172 : 190;
    const cardY = 58 + titleH + 26;
    items.forEach((it, ii) => {
      const cx = tx + (ii % cols) * (cardW + gap);
      const cy = cardY + Math.floor(ii / cols) * (cardH + gap);
      solid('fb' + ii,   cx, cy, cardW, cardH, TACCS[th] + '10', 'gradient');
      solid('fbar' + ii, cx, cy, cardW, 4,     TACCS[th],        'extra');
      els.push({ id: 'fv' + ii, role: 'extra', type: 'text', html: it.value || '', x: cx + 16, y: cy + 20, w: cardW - 32, h: 60, fontSize: 34, bold: true, color: TACCS[th], align: 'left' });
      els.push({ id: 'fl' + ii, role: 'extra', type: 'text', html: it.label || '', x: cx + 16, y: cy + 86, w: cardW - 32, h: cardH - 96, fontSize: 13, bold: false, color: TTXTS[th] + 'aa', align: 'left' });
    });
  }

  function mkText(tx: number, tw: number) {
    const gfs = tfs(slide.title || '', 30);
    const ght = Math.max(44, thC(slide.title || '', gfs, tw));
    els.push({ id: 'tag0', role: 'tag', type: 'text', html: 'Slide ' + (idx + 1), x: tx, y: 40, w: 200, h: 22, fontSize: 11, bold: true, color: TACCS[th], align: 'left', uppercase: true });
    els.push({ id: 'title0', role: 'title', type: 'text', html: slide.title || '', x: tx, y: 68, w: tw, h: ght, fontSize: gfs, bold: true, color: TTXTS[th], align: 'left' });
    solid('rule', tx, 68 + ght + 12, 56, 3, TACCS[th], 'extra');
    if (slide.body) els.push({ id: 'body0', role: 'body', type: 'text', html: slide.body, x: tx, y: 68 + ght + 32, w: tw, h: Math.max(100, thC(slide.body, 18, tw)), fontSize: 18, bold: false, color: TTXTS[th] + 'dd', align: 'left' });
  }

  // Non-title: theme controls image placement, type controls content arrangement
  if (type !== 'title') {
    let tx = 48, tw = 840;
    // Bullets / text / methodology with a real image → split layout (image right, content left)
    if (hasImg && (type === 'bullets' || type === 'text' || type === 'methodology')) {
      // The panel holds the primary image plus up to two user-uploaded extras,
      // stacked vertically with thin gaps.
      const extras = Array.isArray(slide.extraImgs)
        ? slide.extraImgs.filter((u): u is string => typeof u === 'string' && u.length > 0)
        : [];
      const panelImgs = [slide.img!, ...extras].slice(0, 3);
      const GAP = 4;
      const cellH = Math.floor((562 - GAP * (panelImgs.length - 1)) / panelImgs.length);
      panelImgs.forEach((src, i) => {
        els.push({
          id: 'img' + i, role: 'img', type: 'image', src,
          x: 514, y: i * (cellH + GAP), w: 386,
          h: i === panelImgs.length - 1 ? 562 - i * (cellH + GAP) : cellH,
        });
        applyFit(src);
      });
      solid('imgdiv', 510, 0, 4, 562, TACCS[th], 'gradient');
      tw = 440;
    } else if (type !== 'quote' && type !== 'stat') {
      // quote and stat own their full canvas; all other types get theme image placement
      if (layout === 'portrait') {
        imgEl(0, 0, 160, 562);
        grad(100, 0, 800, 562, 'transparent', TBGS[th], 'to right');
        tx = 220; tw = 620;
      } else if (layout === 'horizon') {
        solid('bg', 0, 0, 900, 562, TBGS[th], 'gradient');
        imgEl(560, 280, 340, 282);
        tw = 500;
      }
    }
    switch (type) {
      case 'stat':        mkStat(50, 800);      break;
      case 'quote':       mkQuote();            break;
      case 'findings':    mkFindings(tx, tw);   break;
      case 'methodology': mkMethod(tx, tw);     break;
      case 'bullets':     mkBullets(tx, tw);    break;
      default:            mkText(tx, tw);       break;
    }
    return els;
  }

  // Title layouts — 10 distinct structures
  const fs = tfs(slide.title || '', 38);
  const ht = thC(slide.title || '', fs, 400);

  if (layout === 'split' || layout === 'clean' || layout === 'ocean' || layout === 'warm' || layout === 'bold') {
    solid('panel', 0, 0, 450, 562, TACCS[th], 'gradient');
    imgEl(450, 0, 450, 562);
    els.push({ id: 'tag0', role: 'tag', type: 'text', html: 'Deckify', x: 44, y: 44, w: 380, h: 22, fontSize: 11, bold: true, color: toa, align: 'left', uppercase: true });
    solid('rule', 44, 74, 56, 3, toa + '66', 'extra');
    els.push({ id: 'title0', role: 'title', type: 'text', html: slide.title || '', x: 44, y: 88, w: 390, h: ht, fontSize: fs, bold: true, color: toa, align: 'left' });
    els.push({ id: 'sub0', role: 'subtitle', type: 'text', html: slide.subtitle || '', x: 44, y: 88 + ht + 14, w: 390, h: 70, fontSize: 15, bold: false, color: toa + 'bb', align: 'left' });

  } else if (layout === 'diagonal') {
    solid('panel1', 0, 0, 480, 562, TACCS[th], 'gradient');
    solid('panel2', 420, 0, 560, 562, TBGS[th], 'gradient');
    imgEl(500, 0, 400, 562);
    solid('diag', 400, 0, 80, 562, TACCS[th], 'gradient');
    els.push({ id: 'tag0', role: 'tag', type: 'text', html: 'Deckify', x: 40, y: 44, w: 360, h: 22, fontSize: 11, bold: true, color: toa, align: 'left', uppercase: true });
    solid('rule', 40, 72, 56, 3, toa + '66', 'extra');
    els.push({ id: 'title0', role: 'title', type: 'text', html: slide.title || '', x: 40, y: 86, w: 380, h: ht, fontSize: fs, bold: true, color: toa, align: 'left' });
    els.push({ id: 'sub0', role: 'subtitle', type: 'text', html: slide.subtitle || '', x: 40, y: 86 + ht + 14, w: 380, h: 60, fontSize: 14, bold: false, color: toa + 'bb', align: 'left' });

  } else if (layout === 'horizon') {
    solid('bg', 0, 0, 900, 562, TBGS[th], 'gradient');
    imgEl(0, 325, 900, 237);
    solid('bar', 0, 320, 900, 5, TACCS[th], 'gradient');
    els.push({ id: 'tag0', role: 'tag', type: 'text', html: 'Deckify', x: 56, y: 56, w: 300, h: 22, fontSize: 11, bold: true, color: TACCS[th], align: 'left', uppercase: true });
    const hfs = tfs(slide.title || '', 44);
    const hht = thC(slide.title || '', hfs, 780);
    els.push({ id: 'title0', role: 'title', type: 'text', html: slide.title || '', x: 56, y: 86, w: 780, h: hht, fontSize: hfs, bold: true, color: TTXTS[th], align: 'left' });
    els.push({ id: 'sub0', role: 'subtitle', type: 'text', html: slide.subtitle || '', x: 56, y: 86 + hht + 12, w: 600, h: 50, fontSize: 15, bold: false, color: TTXTS[th] + '88', align: 'left' });

  } else if (layout === 'typo') {
    solid('bg', 0, 0, 900, 562, TBGS[th], 'gradient');
    imgEl(580, 60, 300, 440);
    grad(400, 0, 500, 562, 'transparent', TBGS[th], 'to right');
    const firstLetter = (slide.title || 'T').charAt(0).toUpperCase();
    els.push({ id: 'deco', role: 'extra', type: 'text', html: firstLetter, x: -20, y: -40, w: 440, h: 380, fontSize: 360, bold: true, color: TACCS[th] + '0e', align: 'left' });
    const tfs2 = tfs(slide.title || '', 38);
    const ht2 = thC(slide.title || '', tfs2, 480);
    els.push({ id: 'tag0', role: 'tag', type: 'text', html: 'Deckify', x: 48, y: 48, w: 300, h: 22, fontSize: 11, bold: true, color: TACCS[th], align: 'left', uppercase: true });
    solid('rule', 48, 76, 56, 3, TACCS[th], 'extra');
    els.push({ id: 'title0', role: 'title', type: 'text', html: slide.title || '', x: 48, y: 90, w: 500, h: ht2, fontSize: tfs2, bold: true, color: TTXTS[th], align: 'left' });
    els.push({ id: 'sub0', role: 'subtitle', type: 'text', html: slide.subtitle || '', x: 48, y: 90 + ht2 + 12, w: 480, h: 60, fontSize: 15, bold: false, color: TTXTS[th] + '77', align: 'left' });

  } else if (layout === 'stage') {
    solid('bg', 0, 0, 900, 562, TBGS[th], 'gradient');
    solid('btmbar', 0, 550, 900, 12, TACCS[th], 'gradient');
    solid('topline', 0, 0, 900, 1, TACCS[th] + '33', 'extra');
    imgEl(0, 0, 900, 562);
    solid('overlay', 0, 0, 900, 562, TBGS[th], 'gradient');
    const sfs = tfs(slide.title || '', 42);
    const sht = thC(slide.title || '', sfs, 680);
    els.push({ id: 'tag0', role: 'tag', type: 'text', html: 'Deckify', x: 110, y: 52, w: 680, h: 22, fontSize: 11, bold: true, color: TACCS[th], align: 'center', uppercase: true });
    els.push({ id: 'title0', role: 'title', type: 'text', html: slide.title || '', x: 110, y: 84, w: 680, h: sht, fontSize: sfs, bold: true, color: TTXTS[th], align: 'center' });
    els.push({ id: 'sub0', role: 'subtitle', type: 'text', html: slide.subtitle || '', x: 110, y: 84 + sht + 14, w: 680, h: 50, fontSize: 15, bold: false, color: TTXTS[th] + '77', align: 'center' });

  } else if (layout === 'card') {
    solid('bg', 0, 0, 900, 562, TBGS[th], 'gradient');
    solid('tint', 450, 0, 450, 562, TACCS[th] + '15', 'gradient');
    imgEl(540, 40, 320, 482);
    solid('cardBg', 30, 80, 480, 400, cfg.dark ? '#1a1a22' : '#ffffff', 'gradient');
    solid('cardBorder', 30, 80, 4, 400, TACCS[th], 'extra');
    els.push({ id: 'tag0', role: 'tag', type: 'text', html: 'Deckify', x: 52, y: 102, w: 300, h: 22, fontSize: 11, bold: true, color: TACCS[th], align: 'left', uppercase: true });
    const cfs = tfs(slide.title || '', 34);
    const cht = thC(slide.title || '', cfs, 410);
    els.push({ id: 'title0', role: 'title', type: 'text', html: slide.title || '', x: 52, y: 132, w: 430, h: cht, fontSize: cfs, bold: true, color: TTXTS[th], align: 'left' });
    els.push({ id: 'sub0', role: 'subtitle', type: 'text', html: slide.subtitle || '', x: 52, y: 132 + cht + 12, w: 430, h: 60, fontSize: 14, bold: false, color: TTXTS[th] + '88', align: 'left' });

  } else if (layout === 'grid') {
    solid('bg', 0, 0, 900, 562, TBGS[th], 'gradient');
    for (let gi = 0; gi < 8; gi++) { solid('gh' + gi, 0, gi * 80, 900, 1, TACCS[th] + '18', 'extra'); }
    for (let gj = 0; gj < 12; gj++) { solid('gv' + gj, gj * 80, 0, 1, 562, TACCS[th] + '18', 'extra'); }
    solid('panel', 0, 0, 460, 562, TACCS[th] + '22', 'extra');
    solid('panelborder', 458, 0, 3, 562, TACCS[th], 'extra');
    const gfs2 = tfs(slide.title || '', 36);
    const ght2 = thC(slide.title || '', gfs2, 400);
    els.push({ id: 'tag0', role: 'tag', type: 'text', html: 'DECKIFY.SYS', x: 44, y: 44, w: 400, h: 22, fontSize: 10, bold: true, color: TACCS[th], align: 'left', uppercase: true });
    els.push({ id: 'title0', role: 'title', type: 'text', html: slide.title || '', x: 44, y: 74, w: 420, h: ght2, fontSize: gfs2, bold: true, color: TTXTS[th], align: 'left' });
    els.push({ id: 'sub0', role: 'subtitle', type: 'text', html: slide.subtitle || '', x: 44, y: 74 + ght2 + 12, w: 400, h: 50, fontSize: 13, bold: false, color: TTXTS[th] + '66', align: 'left' });

  } else if (layout === 'editorial') {
    solid('bg', 0, 0, 900, 562, TBGS[th], 'gradient');
    solid('topthick', 0, 30, 900, 4, TACCS[th], 'extra');
    solid('topthin', 0, 44, 900, 1, TACCS[th] + '55', 'extra');
    els.push({ id: 'hdr1', role: 'tag', type: 'text', html: 'Deckify', x: 48, y: 6, w: 200, h: 24, fontSize: 11, bold: true, color: TTXTS[th], align: 'left', uppercase: true });
    els.push({ id: 'hdr2', role: 'extra', type: 'text', html: 'Academic Presentation', x: 650, y: 6, w: 220, h: 24, fontSize: 10, bold: false, color: TTXTS[th] + '66', align: 'right' });
    imgEl(540, 55, 360, 440);
    grad(340, 55, 560, 507, 'transparent', TBGS[th], 'to right');
    const efs = tfs(slide.title || '', 42);
    const eht = thC(slide.title || '', efs, 470);
    els.push({ id: 'title0', role: 'title', type: 'text', html: slide.title || '', x: 48, y: 62, w: 480, h: eht, fontSize: efs, bold: true, color: TTXTS[th], align: 'left' });
    solid('colrule', 48, 62 + eht + 8, 480, 1, TTXTS[th] + '33', 'extra');
    els.push({ id: 'sub0', role: 'subtitle', type: 'text', html: slide.subtitle || '', x: 48, y: 62 + eht + 18, w: 460, h: 50, fontSize: 14, bold: false, color: TTXTS[th] + '88', align: 'left' });

  } else if (layout === 'bands') {
    const topH = 100, midH = 240;
    solid('band1', 0, 0, 900, topH, cfg.dark ? '#1a0a2e' : TBGS[th], 'gradient');
    solid('band2', 0, topH, 900, midH, TACCS[th], 'gradient');
    solid('band3', 0, topH + midH, 900, 222, cfg.dark ? '#eeedfe' : '#f7f6f2', 'gradient');
    els.push({ id: 'tag0', role: 'tag', type: 'text', html: 'Deckify', x: 48, y: topH + 12, w: 300, h: 22, fontSize: 11, bold: true, color: toa + 'cc', align: 'left', uppercase: true });
    const bfs2 = tfs(slide.title || '', 40);
    const bht2 = thC(slide.title || '', bfs2, 800);
    els.push({ id: 'title0', role: 'title', type: 'text', html: slide.title || '', x: 48, y: topH + 42, w: 800, h: bht2, fontSize: bfs2, bold: true, color: toa, align: 'left' });
    els.push({ id: 'sub0', role: 'subtitle', type: 'text', html: slide.subtitle || '', x: 48, y: topH + midH + 18, w: 600, h: 44, fontSize: 15, bold: false, color: cfg.dark ? TACCS[th] : '#534ab7', align: 'left' });
    els.push({ id: 'yr', role: 'extra', type: 'text', html: new Date().getFullYear().toString(), x: 700, y: topH + midH + 16, w: 150, h: 44, fontSize: 18, bold: true, color: TACCS[th], align: 'right' });

  } else if (layout === 'portrait') {
    imgEl(0, 0, 162, 562);
    grad(100, 0, 800, 562, 'transparent', TBGS[th], 'to right');
    solid('accentfoot', 0, 480, 162, 82, TACCS[th], 'extra');
    const pfs2 = tfs(slide.title || '', 40);
    const pht = thC(slide.title || '', pfs2, 660);
    els.push({ id: 'tag0', role: 'tag', type: 'text', html: 'Deckify', x: 200, y: 56, w: 300, h: 22, fontSize: 11, bold: true, color: TACCS[th], align: 'left', uppercase: true });
    solid('rule2', 200, 84, 40, 3, TACCS[th], 'extra');
    els.push({ id: 'title0', role: 'title', type: 'text', html: slide.title || '', x: 200, y: 98, w: 670, h: pht, fontSize: pfs2, bold: true, color: TTXTS[th], align: 'left' });
    els.push({ id: 'sub0', role: 'subtitle', type: 'text', html: slide.subtitle || '', x: 200, y: 98 + pht + 14, w: 640, h: 56, fontSize: 14, bold: false, color: TTXTS[th] + '88', align: 'left' });

  } else if (layout === 'overlap') {
    solid('panelL', 0, 0, 480, 562, cfg.dark ? '#1e1e1c' : '#f0ede6', 'gradient');
    solid('panelR', 480, 0, 420, 562, TBGS[th], 'gradient');
    solid('seam', 464, 0, 32, 562, TACCS[th], 'gradient');
    imgEl(0, 0, 462, 562);
    grad(280, 0, 200, 562, 'transparent', cfg.dark ? '#1e1e1c' : '#f0ede6', 'to right');
    const oX = 530, oW = 340;
    const ofs = tfs(slide.title || '', 34);
    const oht = thC(slide.title || '', ofs, oW);
    els.push({ id: 'tag0', role: 'tag', type: 'text', html: 'Deckify', x: oX, y: 48, w: oW, h: 22, fontSize: 11, bold: true, color: TACCS[th], align: 'left', uppercase: true });
    els.push({ id: 'title0', role: 'title', type: 'text', html: slide.title || '', x: oX, y: 78, w: oW, h: oht, fontSize: ofs, bold: true, color: TTXTS[th], align: 'left' });
    els.push({ id: 'sub0', role: 'subtitle', type: 'text', html: slide.subtitle || '', x: oX, y: 78 + oht + 14, w: oW, h: 56, fontSize: 14, bold: false, color: TTXTS[th] + '88', align: 'left' });
  }

  return els;
}
