// Pure function — safe to import in client components. No server dependencies.

type SlideRecord = Record<string, unknown>

const STYLE_SUFFIX = 'editorial vector illustration, flat design with subtle gradients, modern and clean, muted professional color palette, consistent art style, minimal detail, no text, no words, 16:9'

// Returns a non-empty subject string or the fallback so the prompt always has a subject.
function subject(primary: string, fallback: string): string {
  const s = primary.trim()
  return s.length > 0 ? s : fallback.trim() || 'education and learning'
}

export function buildImagePrompt(slide: SlideRecord): string {
  const title = typeof slide.title === 'string' ? slide.title.slice(0, 80) : ''
  const type  = typeof slide.type  === 'string' ? slide.type  : 'text'

  let visual: string

  switch (type) {
    case 'title': {
      const sub = typeof slide.subtitle === 'string' ? slide.subtitle.slice(0, 60) : ''
      // Combine title + subtitle for richer subject context; guard against both being empty.
      const combined = [title, sub].filter(Boolean).join(', ')
      visual = subject(combined, 'academic presentation cover')
      break
    }

    case 'stat': {
      const stat = typeof slide.stat === 'string' ? slide.stat : ''
      const combined = [stat, title].filter(Boolean).join(', ')
      visual = subject(combined, 'data and numbers concept')
      break
    }

    case 'quote': {
      const attr = typeof slide.attribution === 'string'
        ? slide.attribution.split(',')[0].trim()
        : ''
      const combined = [attr, title].filter(Boolean).join(', ')
      visual = subject(combined, 'ideas and insight')
      break
    }

    case 'methodology': {
      visual = subject(title, 'process and workflow steps')
      break
    }

    case 'findings': {
      visual = subject(title, 'research results and findings')
      break
    }

    case 'bullets':
    case 'text':
    default: {
      // Use first bullet or body as secondary context if title is short.
      const extra =
        Array.isArray(slide.bullets) && typeof slide.bullets[0] === 'string'
          ? slide.bullets[0].slice(0, 60)
          : typeof slide.body === 'string'
            ? slide.body.slice(0, 60)
            : ''
      const combined = extra ? `${title}, ${extra}` : title
      visual = subject(combined, 'concept and ideas')
      break
    }
  }

  return `${visual}. ${STYLE_SUFFIX}`.slice(0, 280)
}
