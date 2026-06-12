import type { ThemeKey } from './config';
import { TBGS } from './config';
import { buildEdEls } from './buildElements';
import type { EdElement, SlideData } from './buildElements';

export type { SlideData };

function elToHtml(el: EdElement): string {
  if (el._hidden) return '';

  const pos = `position:absolute;left:${el.x}px;top:${el.y}px;width:${el.w}px;height:${el.h}px;box-sizing:border-box;overflow:hidden;`;

  if (el.type === 'gradient') {
    const bg = el.from === el.to
      ? el.from
      : `linear-gradient(${el.dir || 'to right'},${el.from} 40%,${el.to})`;
    return `<div style="${pos}background:${bg};"></div>`;
  }

  if (el.type === 'image') {
    const src = el.src || 'https://picsum.photos/900/562';
    return `<div style="${pos}"><img src="${src}" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.src='https://picsum.photos/900/562'"></div>`;
  }

  if (el.type === 'text' || el.type === 'chart') {
    const fs = el.fontSize || 14;
    const ff = el.fontFamily
      ? `'${el.fontFamily}',sans-serif`
      : fs >= 28 ? "'DM Serif Display',serif" : "'DM Sans',sans-serif";
    const style = [
      pos,
      `font-size:${fs}px;`,
      `font-weight:${el.bold ? '700' : '400'};`,
      `font-style:${el.italic ? 'italic' : 'normal'};`,
      `text-decoration:${el.underline ? 'underline' : 'none'};`,
      `color:${el.color || '#ffffff'};`,
      `text-align:${el.align || 'left'};`,
      `text-transform:${el.uppercase ? 'uppercase' : 'none'};`,
      `font-family:${ff};`,
      `line-height:1.4;`,
      `word-break:break-word;`,
      `padding:4px 9px;`,
    ].join('');
    return `<div style="${style}">${el.html || ''}</div>`;
  }

  return '';
}

const ROLE_ORDER = ['gradient', 'img', 'tag', 'title', 'subtitle', 'bullet', 'body', 'extra'];

export function presRenderSlide(slide: SlideData, theme: ThemeKey, idx: number): string {
  const els = buildEdEls(slide, theme, idx);
  const sorted = [...els].sort(
    (a, b) => ROLE_ORDER.indexOf(a.role || 'extra') - ROLE_ORDER.indexOf(b.role || 'extra')
  );
  const bg = TBGS[theme] || '#ffffff';
  return `<div style="width:900px;height:562px;position:relative;overflow:hidden;background:${bg}">`
    + sorted.map(elToHtml).join('')
    + `</div>`;
}
