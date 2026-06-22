export const FONT_FLOOR = 11;

export function shrinkToFit(el: HTMLElement, containerH: number): void {
  let fs = parseFloat(el.style.fontSize) || 14;
  while (fs > FONT_FLOOR && el.scrollHeight > containerH) {
    fs--;
    el.style.fontSize = fs + 'px';
  }
}
