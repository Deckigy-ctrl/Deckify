// Deck names can be long and messy (older decks stored the raw topic text —
// typed prompt + extracted document text, with newlines and URLs). Browsers
// truncate/mangle such download names (a stray "example.com" in the text once
// became the whole filename, extension lost). Reduce to a safe, short name.
export function safeFilename(name: string, fallback = 'deckify-deck'): string {
  const clean = (name || '')
    .replace(/<[^>]+>/g, ' ')            // HTML tags
    .replace(/https?:\/\/\S+/gi, ' ')    // URLs — the "example.com" culprit
    .replace(/[\r\n\t]+/g, ' ')          // newlines from document-blob names
    .replace(/[/\\:*?"<>|#%&{}$!'@+`=]/g, ' ') // filesystem/URL-unsafe chars
    .replace(/\./g, ' ')                 // dots — keep the real extension unambiguous
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60)
    .trim()
  return clean || fallback
}
