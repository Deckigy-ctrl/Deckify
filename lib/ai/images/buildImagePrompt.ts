// Pure function — safe to import in client components. No server dependencies.

type SlideRecord = Record<string, unknown>

// Flux has no negative prompts, so the only defence against text-in-image is
// (a) never feeding it text-like subjects (numbers, "conclusions", "Q&A"…) and
// (b) describing a concrete visual scene it can draw instead.
const STYLE_SUFFIX =
  'flat vector illustration, editorial style, subtle gradients, muted professional color palette, ' +
  'clean geometric shapes, generous negative space, consistent art style, minimal detail, ' +
  'purely pictorial scene with no text, no letters, no numbers, no labels, no charts, no diagrams'

// Words that describe presentation structure rather than visual content.
// Passing them to Flux makes it draw a fake slide full of garbled text.
const META_WORDS = /\b(conclusions?|summary|summaries|recommendations?|q\s*&\s*a|q&amp;a|questions?|overview|introduction|agenda|references?|discussion|limitations?|next steps?|key takeaways?|findings?|results?|methodology|framework|committee|thank you)\b/gi

// Strip numbers, percentages, and meta-presentation words so Flux never sees
// anything it might be tempted to typeset.
function toVisualPhrase(raw: string): string {
  return raw
    .replace(/\d+([.,]\d+)?\s*(%|percent|mw|gw|km|kg|µg\/m³|ug\/m3)?/gi, '')
    .replace(META_WORDS, '')
    .replace(/[&:;"()\[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s,.-]+|[\s,.-]+$/g, '')
    .trim()
}

// Returns a non-empty subject string or the fallback so the prompt always has a subject.
function subject(primary: string, fallback: string): string {
  const s = toVisualPhrase(primary)
  // If cleaning removed everything (e.g. title was "Conclusions & Q&A"),
  // fall back to a safe generic scene rather than an empty/degenerate subject.
  return s.length >= 6 ? s : fallback.trim()
}

export function buildImagePrompt(slide: SlideRecord, deckTopic?: string): string {
  const title = typeof slide.title === 'string' ? slide.title.slice(0, 80) : ''
  const type  = typeof slide.type  === 'string' ? slide.type  : 'text'
  // The deck topic makes a far better fallback than a generic phrase —
  // a "Conclusions" slide in an air-quality deck should show the city skyline,
  // not an abstract "ideas" blob.
  const topicScene = toVisualPhrase(deckTopic ?? '') || 'modern education and research'

  let visual: string

  switch (type) {
    case 'title': {
      const sub = typeof slide.subtitle === 'string' ? slide.subtitle.slice(0, 60) : ''
      visual = subject([title, sub].filter(Boolean).join(', '), topicScene)
      break
    }

    case 'stat':
      // Never pass the stat value — Flux will happily typeset "65%".
      visual = subject(title, topicScene)
      break

    case 'quote': {
      const attr = typeof slide.attribution === 'string'
        ? slide.attribution.split(',')[0].trim()
        : ''
      visual = subject([attr, title].filter(Boolean).join(', '), topicScene)
      break
    }

    case 'methodology':
      visual = subject(title, topicScene)
      break

    case 'findings':
      visual = subject(title, topicScene)
      break

    case 'bullets':
    case 'text':
    default: {
      const extra =
        Array.isArray(slide.bullets) && typeof slide.bullets[0] === 'string'
          ? slide.bullets[0].slice(0, 60)
          : typeof slide.body === 'string'
            ? slide.body.slice(0, 60)
            : ''
      visual = subject(extra ? `${title}, ${extra}` : title, topicScene)
      break
    }
  }

  return `wide establishing scene depicting ${visual}. ${STYLE_SUFFIX}`.slice(0, 400)
}
