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

  function tfs(text: string, maxPx: number): number {
    const l = (text || '').length;
    const mn = Math.max(18, Math.round(maxPx * 0.48));
    if (l <= 18) return maxPx;
    if (l <= 28) return Math.round(maxPx * 0.80);
    if (l <= 42) return Math.round(maxPx * 0.66);
    if (l <= 60) return Math.round(maxPx * 0.55);
    if (l <= 80) return Math.round(maxPx * 0.46);
    return Math.max(mn, Math.round(maxPx * 0.38));
  }

  function thC(text: string, fs: number, w: number): number {
    const eff = Math.max(1, (w || 380) - 18);
    const cpl = Math.max(1, Math.floor(eff / (fs * 0.72)));
    const lines = Math.ceil((text || '').length / cpl) + 1;
    return Math.max(52, lines * Math.round(fs * 1.6) + 16);
  }

  function solid(id: string, x: number, y: number, w: number, h: number, color: string, role: string) {
    els.push({ id, role: role || 'extra', type: 'gradient', x, y, w, h, from: color, to: color, dir: 'to right' });
  }

  function imgEl(x: number, y: number, w: number, h: number) {
    els.push({ id: 'img0', role: 'img', type: 'image', src: slide.img || 'https://picsum.photos/900/562', x, y, w, h });
  }

  function grad(x: number, y: number, w: number, h: number, from: string, to: string, dir?: string) {
    els.push({ id: 'grad0', role: 'gradient', type: 'gradient', x, y, w, h, from, to, dir: dir || 'to right' });
  }

  function mkBullets(tx: number, tw: number) {
    const safeTw = Math.min(tw, 856 - tx);
    solid('rbar', 876, 0, 24, 562, TACCS[th], 'gradient');
    const bfs = tfs(slide.title || '', 28);
    const bht = Math.max(52, thC(slide.title || '', bfs, safeTw));
    els.push({ id: 'num', role: 'extra', type: 'text', html: String(idx + 1).padStart(2, '0'), x: 816, y: 18, w: 56, h: 72, fontSize: 52, bold: true, color: TACCS[th] + '13', align: 'right' });
    els.push({ id: 'tag0', role: 'tag', type: 'text', html: 'Slide ' + (idx + 1), x: tx, y: 44, w: 200, h: 22, fontSize: 11, bold: true, color: TACCS[th], align: 'left', uppercase: true });
    els.push({ id: 'title0', role: 'title', type: 'text', html: slide.title || '', x: tx, y: 72, w: safeTw, h: bht, fontSize: bfs, bold: true, color: TTXTS[th], align: 'left' });
    solid('div', tx, 72 + bht + 8, Math.min(safeTw - 20, 740), 2, TACCS[th], 'extra');
    const bY = 72 + bht + 22;
    (slide.bullets || []).forEach((b, bi) => {
      solid('bdot' + bi, tx + 2, bY + bi * 64 + 20, 9, 9, TACCS[th], 'extra');
      els.push({ id: 'b' + bi, role: 'bullet', type: 'text', html: b, x: tx + 24, y: bY + bi * 64, w: safeTw - 28, h: 58, fontSize: 13, bold: false, color: TTXTS[th] + 'ee', align: 'left' });
    });
  }

  function mkStat(tx: number, tw: number) {
    solid('topbar', 0, 0, 900, 10, TACCS[th], 'gradient');
    const st = slide.stat || slide.title || '';
    const sfs = st.length <= 4 ? 100 : st.length <= 7 ? 80 : 64;
    const tl = tfs(slide.title || '', 16);
    els.push({ id: 'tag0', role: 'tag', type: 'text', html: 'Slide ' + (idx + 1), x: tx, y: 30, w: 200, h: 22, fontSize: 11, bold: true, color: TACCS[th], align: 'left', uppercase: true });
    els.push({ id: 'title0', role: 'title', type: 'text', html: slide.title || '', x: tx, y: 58, w: tw, h: thC(slide.title || '', tl, tw), fontSize: tl, bold: false, color: TTXTS[th] + '88', align: 'center' });
    els.push({ id: 'stat0', role: 'body', type: 'text', html: st, x: tx, y: 170, w: tw, h: 150, fontSize: sfs, bold: true, color: TACCS[th], align: 'center' });
    els.push({ id: 'deco', role: 'extra', type: 'text', html: st, x: tx + tw / 2, y: 150, w: tw / 2, h: 190, fontSize: sfs + 20, bold: true, color: TACCS[th] + '0c', align: 'right' });
    if (slide.body) els.push({ id: 'body0', role: 'body', type: 'text', html: slide.body, x: tx + 60, y: 340, w: tw - 120, h: 70, fontSize: 14, bold: false, color: TTXTS[th] + '88', align: 'center' });
  }

  function mkQuote() {
    solid('bg', 0, 0, 900, 562, TACCS[th], 'gradient');
    const qt = slide.quote || slide.title || '';
    const qfs = tfs(qt, 22);
    els.push({ id: 'qbg', role: 'extra', type: 'text', html: '“', x: 20, y: -20, w: 200, h: 160, fontSize: 180, bold: false, color: 'rgba(255,255,255,0.1)', align: 'left' });
    els.push({ id: 'tag0', role: 'tag', type: 'text', html: 'Slide ' + (idx + 1), x: 64, y: 48, w: 300, h: 22, fontSize: 11, bold: true, color: toa + '99', align: 'left', uppercase: true });
    els.push({ id: 'quote0', role: 'title', type: 'text', html: qt, x: 64, y: 120, w: 780, h: thC(qt, qfs, 780), fontSize: qfs, bold: false, italic: true, color: toa, align: 'left' });
    if (slide.attribution) els.push({ id: 'attr0', role: 'body', type: 'text', html: slide.attribution, x: 64, y: 380, w: 600, h: 38, fontSize: 13, bold: true, color: toa + 'bb', align: 'left' });
    solid('bline', 64, 500, 120, 3, toa + '44', 'extra');
  }

  function mkMethod() {
    solid('topbar', 0, 0, 900, 10, TACCS[th], 'gradient');
    const steps = slide.steps || [];
    const n = steps.length || 1;
    const mfs = tfs(slide.title || '', 22);
    els.push({ id: 'tag0', role: 'tag', type: 'text', html: 'Slide ' + (idx + 1), x: 48, y: 30, w: 200, h: 22, fontSize: 11, bold: true, color: TACCS[th], align: 'left', uppercase: true });
    els.push({ id: 'title0', role: 'title', type: 'text', html: slide.title || '', x: 48, y: 58, w: 820, h: thC(slide.title || '', mfs, 820), fontSize: mfs, bold: true, color: TTXTS[th], align: 'left' });
    const sY = 58 + thC(slide.title || '', mfs, 820) + 24;
    if (n <= 4) {
      const sw = Math.floor(804 / n);
      solid('hline', 48, sY + 11, 800, 3, TACCS[th] + '33', 'extra');
      steps.forEach((s, si) => {
        const sx = 48 + si * sw;
        solid('sbl' + si, sx, sY, 26, 26, TACCS[th], 'extra');
        els.push({ id: 'sn' + si, role: 'extra', type: 'text', html: String(si + 1), x: sx, y: sY - 2, w: 26, h: 26, fontSize: 13, bold: true, color: toa, align: 'center' });
        els.push({ id: 'st' + si, role: 'extra', type: 'text', html: s.replace(/^Step\s*\d+[\:\.\-]\s*/i, ''), x: sx - 4, y: sY + 36, w: sw - 8, h: 130, fontSize: 12, bold: false, color: TTXTS[th] + 'cc', align: 'left' });
      });
    } else {
      steps.forEach((s, si) => {
        const col = si % 2, row = Math.floor(si / 2);
        const sx = 48 + col * 440, sy = sY + row * 96;
        solid('sbl' + si, sx, sy, 22, 22, TACCS[th], 'extra');
        els.push({ id: 'sn' + si, role: 'extra', type: 'text', html: String(si + 1), x: sx, y: sy - 1, w: 22, h: 22, fontSize: 12, bold: true, color: toa, align: 'center' });
        els.push({ id: 'st' + si, role: 'extra', type: 'text', html: s.replace(/^Step\s*\d+[\:\.\-]\s*/i, ''), x: sx + 30, y: sy, w: 390, h: 88, fontSize: 12, bold: false, color: TTXTS[th] + 'cc', align: 'left' });
      });
    }
  }

  function mkFindings() {
    solid('topbar', 0, 0, 900, 10, TACCS[th], 'gradient');
    const items = slide.items || [];
    const ffs = tfs(slide.title || '', 22);
    els.push({ id: 'tag0', role: 'tag', type: 'text', html: 'Slide ' + (idx + 1), x: 48, y: 30, w: 200, h: 22, fontSize: 11, bold: true, color: TACCS[th], align: 'left', uppercase: true });
    els.push({ id: 'title0', role: 'title', type: 'text', html: slide.title || '', x: 48, y: 58, w: 820, h: thC(slide.title || '', ffs, 820), fontSize: ffs, bold: true, color: TTXTS[th], align: 'left' });
    const cols = items.length > 4 ? 3 : items.length > 2 ? 2 : 1;
    const cW = Math.floor(820 / cols);
    const fY = 58 + thC(slide.title || '', ffs, 820) + 28;
    items.forEach((it, ii) => {
      const col = ii % cols, row = Math.floor(ii / cols);
      const fx = 48 + col * cW, fy = fY + row * 110;
      solid('fb' + ii, fx, fy, 4, 90, TACCS[th], 'extra');
      els.push({ id: 'fv' + ii, role: 'extra', type: 'text', html: it.value || '', x: fx + 16, y: fy, w: cW - 24, h: 56, fontSize: 30, bold: true, color: TACCS[th], align: 'left' });
      els.push({ id: 'fl' + ii, role: 'extra', type: 'text', html: it.label || '', x: fx + 16, y: fy + 58, w: cW - 24, h: 28, fontSize: 12, bold: false, color: TTXTS[th] + '77', align: 'left' });
    });
  }

  function mkText(tx: number, tw: number) {
    const gfs = tfs(slide.title || '', 26);
    const ght = Math.max(44, thC(slide.title || '', gfs, tw));
    els.push({ id: 'tag0', role: 'tag', type: 'text', html: 'Slide ' + (idx + 1), x: tx, y: 44, w: 200, h: 22, fontSize: 11, bold: true, color: TACCS[th], align: 'left', uppercase: true });
    els.push({ id: 'title0', role: 'title', type: 'text', html: slide.title || '', x: tx, y: 72, w: tw, h: ght, fontSize: gfs, bold: true, color: TTXTS[th], align: 'left' });
    solid('rule', tx, 72 + ght + 10, 64, 4, TACCS[th], 'extra');
    if (slide.body) els.push({ id: 'body0', role: 'body', type: 'text', html: slide.body, x: tx, y: 72 + ght + 26, w: tw, h: 260, fontSize: 15, bold: false, color: TTXTS[th] + 'dd', align: 'left' });
  }

  // Non-title types: shared across most layouts
  if (type !== 'title') {
    if (type === 'bullets') {
      if (layout === 'portrait') { imgEl(0, 0, 160, 562); grad(100, 0, 800, 562, 'transparent', TBGS[th], 'to right'); mkBullets(220, 640); }
      else if (layout === 'horizon') { solid('bg', 0, 0, 900, 562, TBGS[th], 'gradient'); imgEl(600, 300, 300, 262); mkBullets(48, 530); }
      else { mkBullets(48, 840); }
    } else if (type === 'stat') {
      mkStat(50, 800);
    } else if (type === 'quote') {
      mkQuote();
    } else if (type === 'methodology') {
      mkMethod();
    } else if (type === 'findings') {
      mkFindings();
    } else {
      // text/conclusion — layout-specific photo
      if (layout === 'portrait') { imgEl(0, 0, 160, 562); grad(100, 0, 800, 562, 'transparent', TBGS[th], 'to right'); mkText(220, 650); }
      else if (layout === 'horizon') { solid('bg', 0, 0, 900, 562, TBGS[th], 'gradient'); imgEl(560, 280, 340, 282); mkText(48, 490); }
      else { imgEl(520, 0, 380, 562); grad(0, 0, 620, 562, TBGS[th], 'transparent', 'to right'); mkText(48, 458); }
    }
    return els;
  }

  // Title layouts — 10 distinct structures
  const fs = tfs(slide.title || '', 38);
  const ht = Math.min(320, thC(slide.title || '', fs, 400));

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
    const hht = Math.min(240, thC(slide.title || '', hfs, 780));
    els.push({ id: 'title0', role: 'title', type: 'text', html: slide.title || '', x: 56, y: 86, w: 780, h: hht, fontSize: hfs, bold: true, color: TTXTS[th], align: 'left' });
    els.push({ id: 'sub0', role: 'subtitle', type: 'text', html: slide.subtitle || '', x: 56, y: 86 + hht + 12, w: 600, h: 50, fontSize: 15, bold: false, color: TTXTS[th] + '88', align: 'left' });

  } else if (layout === 'typo') {
    solid('bg', 0, 0, 900, 562, TBGS[th], 'gradient');
    imgEl(580, 60, 300, 440);
    grad(400, 0, 500, 562, 'transparent', TBGS[th], 'to right');
    const firstLetter = (slide.title || 'T').charAt(0).toUpperCase();
    els.push({ id: 'deco', role: 'extra', type: 'text', html: firstLetter, x: -20, y: -40, w: 440, h: 380, fontSize: 360, bold: true, color: TACCS[th] + '0e', align: 'left' });
    const tfs2 = tfs(slide.title || '', 38);
    const ht2 = Math.min(240, thC(slide.title || '', tfs2, 480));
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
    const sht = Math.min(220, thC(slide.title || '', sfs, 680));
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
    const cht = Math.min(220, thC(slide.title || '', cfs, 410));
    els.push({ id: 'title0', role: 'title', type: 'text', html: slide.title || '', x: 52, y: 132, w: 430, h: cht, fontSize: cfs, bold: true, color: TTXTS[th], align: 'left' });
    els.push({ id: 'sub0', role: 'subtitle', type: 'text', html: slide.subtitle || '', x: 52, y: 132 + cht + 12, w: 430, h: 60, fontSize: 14, bold: false, color: TTXTS[th] + '88', align: 'left' });

  } else if (layout === 'grid') {
    solid('bg', 0, 0, 900, 562, TBGS[th], 'gradient');
    for (let gi = 0; gi < 8; gi++) { solid('gh' + gi, 0, gi * 80, 900, 1, TACCS[th] + '18', 'extra'); }
    for (let gj = 0; gj < 12; gj++) { solid('gv' + gj, gj * 80, 0, 1, 562, TACCS[th] + '18', 'extra'); }
    solid('panel', 0, 0, 460, 562, TACCS[th] + '22', 'extra');
    solid('panelborder', 458, 0, 3, 562, TACCS[th], 'extra');
    const gfs2 = tfs(slide.title || '', 36);
    const ght2 = Math.min(220, thC(slide.title || '', gfs2, 400));
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
    const eht = Math.min(280, thC(slide.title || '', efs, 470));
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
    const bht2 = Math.min(200, thC(slide.title || '', bfs2, 800));
    els.push({ id: 'title0', role: 'title', type: 'text', html: slide.title || '', x: 48, y: topH + 42, w: 800, h: bht2, fontSize: bfs2, bold: true, color: toa, align: 'left' });
    els.push({ id: 'sub0', role: 'subtitle', type: 'text', html: slide.subtitle || '', x: 48, y: topH + midH + 18, w: 600, h: 44, fontSize: 15, bold: false, color: cfg.dark ? TACCS[th] : '#534ab7', align: 'left' });
    els.push({ id: 'yr', role: 'extra', type: 'text', html: new Date().getFullYear().toString(), x: 700, y: topH + midH + 16, w: 150, h: 44, fontSize: 18, bold: true, color: TACCS[th], align: 'right' });

  } else if (layout === 'portrait') {
    imgEl(0, 0, 162, 562);
    grad(100, 0, 800, 562, 'transparent', TBGS[th], 'to right');
    solid('accentfoot', 0, 480, 162, 82, TACCS[th], 'extra');
    const pfs2 = tfs(slide.title || '', 40);
    const pht = Math.min(250, thC(slide.title || '', pfs2, 660));
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
    const oht = Math.min(240, thC(slide.title || '', ofs, oW));
    els.push({ id: 'tag0', role: 'tag', type: 'text', html: 'Deckify', x: oX, y: 48, w: oW, h: 22, fontSize: 11, bold: true, color: TACCS[th], align: 'left', uppercase: true });
    els.push({ id: 'title0', role: 'title', type: 'text', html: slide.title || '', x: oX, y: 78, w: oW, h: oht, fontSize: ofs, bold: true, color: TTXTS[th], align: 'left' });
    els.push({ id: 'sub0', role: 'subtitle', type: 'text', html: slide.subtitle || '', x: oX, y: 78 + oht + 14, w: oW, h: 56, fontSize: 14, bold: false, color: TTXTS[th] + '88', align: 'left' });
  }

  return els;
}
