import { presRenderSlide } from '@/lib/themes/presRender';
import type { SlideData } from '@/lib/themes/buildElements';
import type { ThemeKey } from '@/lib/themes/config';

export function exportPdf(slides: SlideData[], theme: ThemeKey, deckName: string): void {
  const slideHtmlParts = slides.map((slide, i) =>
    `<div class="slide">${presRenderSlide(slide, theme, i)}</div>`
  );

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${deckName}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700&family=DM+Serif+Display:ital@0;1&display=swap">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #888; }
  .slide {
    width: 900px;
    height: 562px;
    overflow: hidden;
    position: relative;
    display: block;
  }
  @media screen {
    body { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 24px; }
  }
  @media print {
    body { background: #fff; margin: 0; padding: 0; }
    .slide {
      page-break-after: always;
      break-after: page;
      margin: 0;
    }
    @page { size: 10in 6.25in landscape; margin: 0; }
  }
</style>
</head>
<body>
${slideHtmlParts.join('\n')}
</body>
</html>`;

  const newWin = window.open('', '_blank');
  if (!newWin) {
    alert('Pop-up blocked. Please allow pop-ups for this site to export PDF.');
    return;
  }

  newWin.document.write(html);
  newWin.document.close();

  // Wait for fonts and images to load before printing
  newWin.onload = () => {
    setTimeout(() => {
      newWin.print();
      newWin.addEventListener('afterprint', () => newWin.close());
    }, 800);
  };
}
