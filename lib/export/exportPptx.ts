import { buildEdEls } from '@/lib/themes/buildElements';
import type { SlideData, EdElement } from '@/lib/themes/buildElements';
import type { ThemeKey } from '@/lib/themes/config';
import { TBGS } from '@/lib/themes/config';
import { safeFilename } from './filename';

// 900px wide × 562px tall → 10in × 6.25in (16:9)
const S = 1 / 90;

function px(n: number): number {
  return Math.round(n * S * 1000) / 1000;
}

// Strip HTML tags to plain text for PPTX text boxes
function stripHtml(html: string): string {
  return (html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Normalise any color string to 6-char hex for PptxGenJS
function toHex6(color: string | undefined): string {
  if (!color) return '888888';
  const c = color.replace('#', '').replace(/;.*/, '').trim();
  if (c.length === 6) return c.toUpperCase();
  if (c.length === 8) return c.slice(0, 6).toUpperCase();
  if (c.length === 3) return (c[0]+c[0]+c[1]+c[1]+c[2]+c[2]).toUpperCase();
  // rgb()/rgba() — return grey fallback
  if (color.startsWith('rgb')) {
    const m = color.match(/\d+/g);
    if (m && m.length >= 3) {
      return [m[0], m[1], m[2]].map(n => parseInt(n).toString(16).padStart(2, '0')).join('').toUpperCase();
    }
  }
  return '888888';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function addElement(pptxSlide: any, el: EdElement): Promise<void> {
  if (el._hidden) return;

  const x = px(el.x);
  const y = px(el.y);
  const w = px(el.w);
  const h = px(el.h);

  if (w <= 0 || h <= 0) return;

  if (el.type === 'gradient') {
    const fillColor = toHex6(el.from);
    pptxSlide.addShape('rect', {
      x, y, w, h,
      fill: { color: fillColor },
      line: { color: fillColor, width: 0 },
    });
    return;
  }

  if (el.type === 'image' && el.src) {
    try {
      // Figures render `contain` on a matte so nothing is cropped; photos cover.
      if (el.fit === 'contain') {
        if (el.matte) {
          pptxSlide.addShape('rect', { x, y, w, h, fill: { color: toHex6(el.matte) }, line: { color: toHex6(el.matte), width: 0 } });
        }
        pptxSlide.addImage({ path: el.src, x, y, w, h, sizing: { type: 'contain', w, h } });
      } else {
        pptxSlide.addImage({ path: el.src, x, y, w, h, sizing: { type: 'cover', w, h } });
      }
    } catch {
      // Remote image fetch failed — skip silently
    }
    return;
  }

  if (el.type === 'text' || el.type === 'chart') {
    if (el.type === 'chart') {
      // Placeholder for chart elements
      pptxSlide.addShape('rect', { x, y, w, h, fill: { color: '444444' }, line: { color: '444444' } });
      pptxSlide.addText('Chart', {
        x, y, w, h,
        color: 'FFFFFF', fontSize: 12, bold: true, align: 'center', valign: 'middle',
      });
      return;
    }

    const text = stripHtml(el.html || '');
    if (!text) return;

    const fs = el.fontSize || 14;
    const fontFace = fs >= 28 ? 'DM Serif Display' : 'DM Sans';
    const color = toHex6(el.color);
    const align = (el.align as 'left' | 'center' | 'right') || 'left';

    pptxSlide.addText(text, {
      x, y, w, h,
      fontSize: fs,
      bold: !!el.bold,
      italic: !!el.italic,
      underline: el.underline ? { style: 'sng' } : false,
      color,
      fontFace,
      align,
      valign: 'top',
      wrap: true,
      charSpacing: 0,
    });
    return;
  }
}

export async function exportPptx(
  slides: SlideData[],
  theme: ThemeKey,
  deckName: string,
): Promise<void> {
  const PptxGenJS = (await import('pptxgenjs')).default;
  const pptx = new PptxGenJS();

  pptx.layout = 'LAYOUT_WIDE'; // 10in × 5.625in — close enough, we'll set custom
  pptx.defineLayout({ name: 'DECKIFY', width: 10, height: 6.25 });
  pptx.layout = 'DECKIFY';

  const ROLE_ORDER = ['gradient', 'img', 'tag', 'title', 'subtitle', 'bullet', 'body', 'extra'];

  for (let i = 0; i < slides.length; i++) {
    const slideData = slides[i];
    const els = buildEdEls(slideData, theme, i);
    const sorted = [...els].sort(
      (a, b) => ROLE_ORDER.indexOf(a.role || 'extra') - ROLE_ORDER.indexOf(b.role || 'extra')
    );

    const bgHex = toHex6(TBGS[theme] || '#ffffff');
    const pptxSlide = pptx.addSlide();
    pptxSlide.background = { color: bgHex };

    for (const el of sorted) {
      await addElement(pptxSlide, el);
    }
  }

  await pptx.writeFile({ fileName: `${safeFilename(deckName)}.pptx` });
}
