import type { Slide, OutlineCard, AttachedImage } from './types';

const AUDIENCE_GUIDE: Record<string, string> = {
  committee: 'You are presenting to a thesis committee. Be precise, cite your methodology, justify every claim with evidence. They will challenge you — pre-empt questions. Demonstrate mastery of your subject.',
  class: 'You are presenting to classmates and a professor. Be clear and engaging. Explain concepts from first principles. Use relatable examples. Invite discussion.',
  professor: 'You are submitting for professor review. Be rigorous and well-structured. Show depth of research. Every claim must be supportable.',
  group: 'You are presenting with a group to classmates. Balance contributions clearly. Show clear team structure, process, and outcomes. Be concrete about what you did.',
  conference: 'You are presenting at an academic conference. Be scholarly and precise. Cite relevant literature. Contribute to the field. Connect to current research debates.',
  general: 'Clear, engaging, accessible. Every claim understandable without specialist background knowledge.',
};

const GOAL_GUIDE: Record<string, string> = {
  defend: 'You are defending a thesis. Structure: research question → literature gap → methodology → findings → contribution → limitations → future work. Every slide strengthens your argument.',
  findings: 'You are presenting research findings. Lead with the key result. Then explain how you got there. Use data visualisation. Be specific about what the numbers mean.',
  explain: 'You are explaining a concept. Build from foundational to advanced. Use concrete examples before abstractions. Check comprehension at key points.',
  summarize: 'You are summarising research for an audience. Distil the key takeaway first. Then the evidence. Then the implications. Strip everything that does not serve the main point.',
  propose: 'You are proposing a research project or initiative. State the problem clearly. Show why it matters. Propose your approach. Justify feasibility.',
  teach: 'You are teaching. Sequence content logically. Use examples and analogies. Build in moments for questions and reflection.',
};

const TONE_GUIDE: Record<string, string> = {
  academic: 'Formal academic register. Precise language. Cite types of evidence. Structured argumentation. No colloquialisms.',
  professional: 'Authoritative but accessible. Active voice. No hedging. Clear and direct.',
  conversational: 'Explain clearly as if talking to a smart friend. Warm but substantive. Contractions are fine.',
  thai_formal: 'ใช้ภาษาวิชาการไทยที่เป็นทางการ ภาษาราชการ เหมาะสำหรับการนำเสนอต่อคณะกรรมการหรืออาจารย์ที่ปรึกษา',
  thai_casual: 'ใช้ภาษาไทยที่สุภาพแต่เป็นธรรมชาติ เหมาะสำหรับการนำเสนอในชั้นเรียนหรืองานกลุ่ม',
};

export function buildSystemPrompt(audience: string, goal: string, tone: string, count: number): string {
  const audGuide = AUDIENCE_GUIDE[audience] ?? AUDIENCE_GUIDE.general;
  const goalGuide = GOAL_GUIDE[goal] ?? GOAL_GUIDE.explain;
  const toneGuide = TONE_GUIDE[tone] ?? TONE_GUIDE.professional;
  const isThaiTone = tone === 'thai_formal' || tone === 'thai_casual';
  const langNote = isThaiTone
    ? 'Write ALL slide content (titles, bullets, body, notes, subtitles) entirely in Thai (ภาษาไทย). For thai_formal use ภาษาวิชาการ/ราชการ. For thai_casual use ภาษาปกติที่สุภาพ. Do NOT mix English and Thai — Thai only throughout.'
    : 'Write in English.';

  return (
    'You are an expert academic presentation writer specialising in student presentations at Thai and Southeast Asian universities. ' +
    'Language: ' + langNote + ' ' +
    'Audience: ' + audGuide + ' ' +
    'Goal: ' + goalGuide + ' ' +
    'Tone: ' + toneGuide + '\n\n' +
    'ACADEMIC STRUCTURE RULES:\n' +
    '- For thesis/research: use this structure — title → research context → literature review → methodology → findings → discussion → conclusion → Q&A.\n' +
    '- For seminar/class: title → introduction → key concept 1 → key concept 2 → real examples → critical analysis → summary.\n' +
    '- For group project: title → problem statement → approach → process → results → recommendations → next steps.\n' +
    '- Every bullet must be a complete, specific sentence with a real fact, statistic, or cited example. Never vague filler.\n' +
    '- Headlines: max 8 words, clear and informative. No generic fillers like "Introduction to" or "Overview of".\n' +
    '- Use stat slides for key quantitative findings — they land harder than burying numbers in bullets.\n' +
    '- speaker_notes: 2-3 sentences the student would say aloud to their committee or class, in the same language as the slide.\n' +
    '- Vary slide types — never more than 2 bullets slides in a row.\n\n' +
    'OUTPUT: Return ONLY a valid JSON array of exactly ' + count + ' slides. No markdown fences, no prose.\n' +
    'Slide type schemas (every slide also gets an "img_concept" field — see rule below):\n' +
    '{"type":"title","title":"...","subtitle":"...","speaker_notes":"...","img_concept":"..."}\n' +
    '{"type":"bullets","title":"...","bullets":["complete sentence 1","complete sentence 2","complete sentence 3"],"speaker_notes":"...","img_concept":"..."}\n' +
    '{"type":"stat","title":"context headline","stat":"big number or %","body":"1-2 sentences explaining significance","speaker_notes":"...","img_concept":"..."}\n' +
    '{"type":"quote","title":"slide label","quote":"exact quoted text","attribution":"Author, Source, Year","speaker_notes":"...","img_concept":"..."}\n' +
    '{"type":"text","title":"...","body":"up to 50 words","speaker_notes":"...","img_concept":"..."}\n' +
    '{"type":"methodology","title":"...","steps":["Step 1: description","Step 2: description","Step 3: description"],"speaker_notes":"...","img_concept":"..."}\n' +
    '{"type":"findings","title":"...","items":[{"label":"Finding 1","value":"result or stat"},{"label":"Finding 2","value":"result or stat"}],"speaker_notes":"...","img_concept":"..."}\n' +
    '{"type":"comparison","title":"...","columns":["Dimension","Option A","Option B"],"rows":[["Cost","High","Low"],["Speed","Slow","Fast"]],"speaker_notes":"...","img_concept":"..."}\n' +
    '{"type":"iconstat","title":"...","stats":[{"value":"−43%","label":"what it measures"},{"value":"2.4×","label":"what it measures"}],"speaker_notes":"...","img_concept":"..."}\n' +
    '{"type":"timeline","title":"...","steps":["Phase name — what happens","Phase name — what happens","Phase name — what happens"],"speaker_notes":"...","img_concept":"..."}\n' +
    '{"type":"figure","title":"...","caption":"one-line description of the figure/diagram","body":"1-2 sentences of interpretation","speaker_notes":"...","img_concept":"..."}\n' +
    'COMPOSED-LAYOUT RULES — prefer these designed layouts over plain bullets whenever the content fits:\n' +
    '- "comparison": ANY time you contrast two or more options/approaches/materials/periods across shared dimensions — put the dimensions in the first column, one option per further column (2-4 columns, 2-6 rows). Cells are short (≤22 chars).\n' +
    '- "iconstat": a row of 2-4 headline numbers that quantify impact (percentages, multipliers, counts) — each with a short label. Use instead of burying several numbers in bullets.\n' +
    '- "timeline": a chronological or staged process (phases, a roadmap, historical sequence) — 3-5 ordered steps, each "Name — short description".\n' +
    '- "figure": when a slide is fundamentally ABOUT one diagram, chart, schematic, or photograph — give a caption and a short interpretation. The image itself is added by the app.\n' +
    'Use at least one comparison, iconstat, or timeline slide when the topic supports it. Never more than 2 bullets slides in a row — reach for a composed layout instead.\n' +
    'Always start with a title slide. Always end with a conclusion or Q&A text slide.\n' +
    'Do NOT include an "img" field or any image URLs — images are added separately by the app.\n' +
    'img_concept rule: 8-15 words, ALWAYS in English regardless of the slide language, describing one concrete PICTURABLE scene for a flat illustration that matches this slide\'s meaning — real places, objects, and settings (e.g. "mourners with flowers outside a Tehran mosque at dusk"). Never abstract words, never text, numbers, charts, flags, or named individuals.\n' +
    'FIELD LENGTH LIMITS — exceeding these causes text to be cut off on the slide:\n' +
    '- title: ≤70 characters\n' +
    '- subtitle: ≤120 characters\n' +
    '- body: ≤350 characters\n' +
    '- each bullet: ≤110 characters\n' +
    '- stat: ≤12 characters (the big number only — e.g. "76%" or "1.4M")\n' +
    '- quote: ≤220 characters\n' +
    '- attribution: ≤80 characters\n' +
    '- each step: ≤100 characters\n' +
    '- finding value: ≤20 characters\n' +
    '- finding label: ≤50 characters\n' +
    '- comparison column header: ≤22 characters; comparison cell: ≤22 characters\n' +
    '- iconstat value: ≤10 characters; iconstat label: ≤40 characters\n' +
    '- timeline step: ≤90 characters ("Name — description")\n' +
    '- figure caption: ≤90 characters\n' +
    'Return ONLY the JSON array. COUNT = ' + count + '.'
  );
}

export function buildUserPrompt(
  topic: string,
  audience: string,
  goal: string,
  tone: string,
  theme: string,
  count: number,
  outline?: OutlineCard[],
  attachedImages?: AttachedImage[],
): string {
  const isThaiTone = tone === 'thai_formal' || tone === 'thai_casual';
  const langInstruction = isThaiTone
    ? '\nIMPORTANT: Write EVERYTHING in Thai language (ภาษาไทย). All titles, bullets, body text, speaker notes must be in Thai only.'
    : '';

  // The user's images are placed onto slides AFTER generation by a matcher
  // that can only use image-capable slide types. Plan homes for them here,
  // or the matcher has nowhere to put them and they end up in the tray.
  let imagesInstruction = '';
  if (attachedImages && attachedImages.length > 0) {
    const list = attachedImages
      .map((im, i) => `${i + 1}. [${im.kind}] ${im.caption}`)
      .join('\n');
    imagesInstruction =
      '\n\nATTACHED IMAGES — the user uploaded these images; after you generate the deck, each will be auto-placed on a slide whose topic matches it:\n' +
      list +
      '\nPLANNING RULES for attached images (these override the composed-layout preference where they conflict):\n' +
      '- Only these slide types can DISPLAY an image: "figure" (framed figure + caption — the best home for any [figure] image: diagram, chart, table, screenshot, document), "bullets", "text", "methodology" (side panel — good for [photo]), "title" and "stat" (full-bleed background — [photo] only, never [figure]).\n' +
      '- For EACH [figure] image above, include one "figure"-type slide whose topic is that image (write its title and caption from the image description; body = 1-2 sentences of interpretation).\n' +
      '- For EACH [photo] image, make sure at least one topically-matching slide uses an image-capable type.\n' +
      '- Stay within the requested slide count — convert what would have been a bullets slide into the figure slide rather than adding extra slides.';
  }

  if (outline && outline.length > 0) {
    const outlineStr = outline.map((card, i) =>
      'Slide ' + (i + 1) + ': "' + card.title + '"\n' +
      (card.bullets.length > 0
        ? card.bullets.map(b => '  - ' + b).join('\n')
        : '  (choose appropriate content)')
    ).join('\n');

    return (
      'Topic: ' + topic +
      '\nAudience: ' + audience +
      '\nGoal: ' + goal +
      '\nTone: ' + tone +
      '\nTheme: ' + theme +
      '\nSlides: ' + count +
      langInstruction +
      '\n\nAPPROVED OUTLINE — the user has reviewed and approved this structure. Follow it exactly:\n' +
      outlineStr +
      '\n\nTASK: Generate exactly ' + count + ' slides following this outline.' +
      '\n1. Use each slide\'s title verbatim (trim to ≤70 chars only if needed).' +
      '\n2. Choose the slide type that best fits each card\'s bullet hints:' +
      '\n   - Mentions a number, percentage, or statistic → "stat" (put the key figure in the stat field)' +
      '\n   - Describes a step-by-step process → "methodology"' +
      '\n   - Lists multiple results or metrics → "findings"' +
      '\n   - Contains a direct quotation → "quote"' +
      '\n   - First slide → always "title"' +
      '\n   - Final slide → "text" (conclusion or Q&A)' +
      '\n   - Everything else → "bullets"' +
      '\n3. Fill all required fields using the bullet hints as content direction. Add specific facts, real stats, concrete examples.' +
      '\n4. Add speaker_notes (2-3 sentences the student would say aloud). Do NOT include an "img" field.' +
      '\n5. Do NOT invent new slides, skip slides, or change the order (but you may choose "figure" as a slide\'s type to host an attached image whose topic matches that outline card).' +
      imagesInstruction +
      '\nReturn ONLY the JSON array.'
    );
  }

  return (
    'Topic: ' + topic +
    '\nAudience: ' + audience +
    '\nGoal: ' + goal +
    '\nTone: ' + tone +
    '\nTheme: ' + theme +
    '\nSlides: ' + count +
    langInstruction +
    '\n\nCreate a presentation about: "' + topic + '".' +
    '\nCRITICAL REQUIREMENTS:' +
    '\n1. Every single slide must be SPECIFICALLY about "' + topic + '" — no generic placeholder text, no filler.' +
    '\n2. Each slide must cover a DIFFERENT aspect. No two slides may share the same title or repeat the same information.' +
    '\n3. Use REAL statistics, real studies, and concrete real-world examples that are specifically relevant to "' + topic + '".' +
    '\n4. Titles must be specific and informative (e.g. "Thailand Ranks 76th on Global Gender Gap Index" not "Key Statistics").' +
    '\n5. Choose the slide type that best fits each piece of content — stat for numbers, methodology for processes, findings for results.' +
    imagesInstruction +
    '\nSpeaker notes: 2-3 sentences the student would say aloud. Return ONLY the JSON array.'
  );
}

const VALID_TYPES = ['title', 'bullets', 'text', 'stat', 'quote', 'methodology', 'findings', 'comparison', 'iconstat', 'timeline', 'figure'];

export function parseAndValidateSlides(raw: string, count: number, topic: string): Slide[] {
  let clean = raw.replace(/^```(?:json)?[\s]*/i, '').replace(/```[\s]*$/i, '').trim();

  const arrayMatch = clean.match(/\[[\s\S]*\]/);
  if (!arrayMatch) throw new Error('No JSON array found in response');
  clean = arrayMatch[0];

  let slides: Slide[];
  try {
    slides = JSON.parse(clean);
  } catch (e) {
    const lastBrace = clean.lastIndexOf('},');
    if (lastBrace > 0) {
      try {
        slides = JSON.parse(clean.slice(0, lastBrace + 1) + ']');
      } catch {
        throw new Error('JSON parse failed: ' + (e as Error).message);
      }
    } else {
      throw new Error('JSON parse failed: ' + (e as Error).message);
    }
  }

  if (!Array.isArray(slides)) throw new Error('Response was not a JSON array');
  if (slides.length === 0) throw new Error('AI returned an empty array');

  slides = slides
    .map((s, i) => {
      if (!s || typeof s !== 'object') return null as unknown as Slide;
      if (!s.type || !VALID_TYPES.includes(s.type as string)) {
        s.type = i === 0 ? 'title' : 'bullets';
      }
      if (!s.title || typeof s.title !== 'string') s.title = topic + ' — Slide ' + (i + 1);
      s.title = (s.title as string).slice(0, 120);

      if (s.type === 'bullets') {
        if (!Array.isArray(s.bullets) || (s.bullets as unknown[]).length === 0) {
          s.type = 'text';
          s.body = s.body ?? s.subtitle ?? '';
        } else {
          s.bullets = (s.bullets as unknown[])
            .filter((b) => b && typeof b === 'string')
            .slice(0, 6);
          if ((s.bullets as unknown[]).length === 0) { s.type = 'text'; s.body = ''; }
        }
      }
      if (s.type === 'stat' && (!s.stat || typeof s.stat !== 'string')) s.type = 'text';
      if (s.type === 'quote' && (!s.quote || typeof s.quote !== 'string')) s.type = 'text';
      if (s.type === 'methodology' && (!Array.isArray(s.steps) || (s.steps as unknown[]).length === 0)) s.type = 'bullets';
      if (s.type === 'timeline' && (!Array.isArray(s.steps) || (s.steps as unknown[]).length === 0)) s.type = 'bullets';
      if (s.type === 'findings' && (!Array.isArray(s.items) || (s.items as unknown[]).length === 0)) s.type = 'bullets';

      // Composed layouts — normalise or fall back when the required shape is absent.
      if (s.type === 'comparison') {
        const cols = Array.isArray(s.columns) ? (s.columns as unknown[]).filter(c => typeof c === 'string').map(c => (c as string).slice(0, 40)) : [];
        const rows = Array.isArray(s.rows)
          ? (s.rows as unknown[])
              .filter(Array.isArray)
              .map(r => (r as unknown[]).filter(c => typeof c === 'string').map(c => (c as string).slice(0, 60)))
              .filter(r => r.length > 0)
              .slice(0, 6)
          : [];
        // Bullets validation already ran above, so fall back to text (not
        // bullets) to avoid an empty-bullets slide.
        if (cols.length < 2 || rows.length === 0) { s.type = 'text'; s.body = typeof s.body === 'string' ? s.body : ''; }
        else { s.columns = cols.slice(0, 4); s.rows = rows; }
      }
      if (s.type === 'iconstat') {
        const stats = Array.isArray(s.stats)
          ? (s.stats as unknown[])
              .filter((x): x is { value: unknown; label: unknown } => !!x && typeof x === 'object')
              .map(x => ({ value: String((x as { value?: unknown }).value ?? '').slice(0, 16), label: String((x as { label?: unknown }).label ?? '').slice(0, 50) }))
              .filter(x => x.value)
              .slice(0, 4)
          : [];
        if (stats.length < 2) {
          if (stats.length === 1) { s.type = 'stat'; s.stat = stats[0].value; s.body = typeof s.body === 'string' ? s.body : ''; }
          else { s.type = 'text'; s.body = typeof s.body === 'string' ? s.body : ''; }
        } else { s.stats = stats; }
      }
      if (s.type === 'figure') {
        if (typeof s.caption !== 'string' || !s.caption) s.caption = typeof s.subtitle === 'string' ? s.subtitle : '';
      }
      if (!s.img || typeof s.img !== 'string' || !String(s.img).startsWith('http')) s.img = '';

      return s as Slide;
    })
    .filter(Boolean);

  while (slides.length < count) {
    slides.splice(slides.length - 1, 0, {
      type: 'text',
      title: topic,
      body: 'Additional context for this presentation.',
      speaker_notes: '',
      img: '',
    });
  }
  if (slides.length > count) {
    const conclusion = slides[slides.length - 1];
    slides = [...slides.slice(0, count - 1), conclusion];
  }

  if (slides[0].type !== 'title') {
    slides[0].type = 'title';
    slides[0].subtitle = slides[0].subtitle ?? slides[0].body ?? '';
  }

  // No stock filler: slides with no user upload and no AI image stay a clean
  // text layout (img stays empty). Images are added only by upload-matching or
  // the AI image toggle downstream.
  return slides;
}
