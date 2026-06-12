import type { Slide } from './types';

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
    'Slide type schemas:\n' +
    '{"type":"title","title":"...","subtitle":"...","speaker_notes":"...","img":"UNSPLASH_URL"}\n' +
    '{"type":"bullets","title":"...","bullets":["complete sentence 1","complete sentence 2","complete sentence 3"],"speaker_notes":"...","img":"UNSPLASH_URL"}\n' +
    '{"type":"stat","title":"context headline","stat":"big number or %","body":"1-2 sentences explaining significance","speaker_notes":"...","img":"UNSPLASH_URL"}\n' +
    '{"type":"quote","title":"slide label","quote":"exact quoted text","attribution":"Author, Source, Year","speaker_notes":"...","img":"UNSPLASH_URL"}\n' +
    '{"type":"text","title":"...","body":"up to 50 words","speaker_notes":"...","img":"UNSPLASH_URL"}\n' +
    '{"type":"methodology","title":"...","steps":["Step 1: description","Step 2: description","Step 3: description"],"speaker_notes":"...","img":"UNSPLASH_URL"}\n' +
    '{"type":"findings","title":"...","items":[{"label":"Finding 1","value":"result or stat"},{"label":"Finding 2","value":"result or stat"}],"speaker_notes":"...","img":"UNSPLASH_URL"}\n' +
    'Always start with a title slide. Always end with a conclusion or Q&A text slide.\n' +
    'For img: use https://images.unsplash.com/photo-REALID?w=800&h=500&fit=crop with relevant real Unsplash photo IDs.\n' +
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
): string {
  const isThaiTone = tone === 'thai_formal' || tone === 'thai_casual';
  const langInstruction = isThaiTone
    ? '\nIMPORTANT: Write EVERYTHING in Thai language (ภาษาไทย). All titles, bullets, body text, speaker notes must be in Thai only.'
    : '';
  return (
    'Topic: ' + topic +
    '\nAudience: ' + audience +
    '\nGoal: ' + goal +
    '\nTone: ' + tone +
    '\nTheme: ' + theme +
    '\nSlides: ' + count +
    langInstruction +
    '\n\nCreate a specific, academically rigorous presentation. Use real statistics, cite specific studies or sources where relevant, and give concrete examples. ' +
    'Choose the slide type that best fits each piece of content — use methodology and findings types where appropriate. ' +
    'Make speaker notes sound like a student confidently explaining to their committee or class. Return ONLY the JSON array.'
  );
}

const PICSUM_IDS = [10, 20, 42, 60, 96, 160, 180, 201, 217, 250];
const VALID_TYPES = ['title', 'bullets', 'text', 'stat', 'quote', 'methodology', 'findings'];

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
      if (s.type === 'findings' && (!Array.isArray(s.items) || (s.items as unknown[]).length === 0)) s.type = 'bullets';
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

  slides = slides.map((s, idx) => {
    if (!s.img) s.img = 'https://picsum.photos/id/' + PICSUM_IDS[idx % PICSUM_IDS.length] + '/800/500';
    return s;
  });

  return slides;
}
