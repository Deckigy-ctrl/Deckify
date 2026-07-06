import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

// Vision matching: caption each uploaded image and assign it to the
// best-fitting slide. Haiku handles caption-and-match comfortably at a
// third of Sonnet's price (~$0.01 per deck with 5 photos).
const MODEL = 'claude-haiku-4-5-20251001';
const MAX_IMAGES = 10;
const MAX_SLIDES = 30;

interface MatchResult {
  url: string;
  caption: string;
  slideIdx: number | null; // null → tray
  confidence: number;      // 0..1
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI not configured' }, { status: 500 });
    }

    let body: { slides?: unknown; images?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const slides = (Array.isArray(body.slides) ? body.slides : [])
      .filter((s): s is { idx: number; title: string; summary?: string } =>
        !!s && typeof s === 'object' && typeof (s as Record<string, unknown>).idx === 'number'
        && typeof (s as Record<string, unknown>).title === 'string')
      .slice(0, MAX_SLIDES);

    const images = (Array.isArray(body.images) ? body.images : [])
      .filter((u): u is string => typeof u === 'string' && u.startsWith('https://'))
      .slice(0, MAX_IMAGES);

    if (!images.length) {
      return NextResponse.json({ error: 'images are required' }, { status: 400 });
    }

    // Two modes, one endpoint:
    //  - with slides  → caption AND assign each image to its best slide
    //  - without      → caption only (used before the outline exists, so the
    //    images' CONTENT can inform what the deck is about)
    const content: Anthropic.ContentBlockParam[] = [];
    images.forEach((url, i) => {
      content.push({ type: 'text', text: `IMAGE ${i}:` });
      content.push({ type: 'image', source: { type: 'url', url } });
    });

    if (slides.length) {
      const slideList = slides
        .map(s => `${s.idx}: "${s.title}"${s.summary ? ` — ${String(s.summary).slice(0, 120)}` : ''}`)
        .join('\n');
      content.push({
        type: 'text',
        text:
          `These ${images.length} images were uploaded by a student for their slide deck.\n` +
          `The deck's slides are:\n${slideList}\n\n` +
          `For EACH image, write a short caption (8-15 words, English) and pick the single best-matching ` +
          `slide by meaning, with a confidence from 0 to 1. If no slide is a genuine fit, use slideIdx null ` +
          `and confidence 0. Several images may match the same slide.\n` +
          `Return ONLY a JSON array, one object per image in order: ` +
          `[{"image":0,"caption":"...","slideIdx":2,"confidence":0.85}, ...]`,
      });
    } else {
      content.push({
        type: 'text',
        text:
          `These ${images.length} images were uploaded by a student who wants a slide deck built from them.\n` +
          `For EACH image, write a specific caption (10-20 words, English) describing what it shows — ` +
          `include any readable figure captions, labels, or technical subject matter, since these captions ` +
          `will be used to work out what the deck is about.\n` +
          `Return ONLY a JSON array, one object per image in order: ` +
          `[{"image":0,"caption":"..."}, ...]`,
      });
    }

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1200,
      messages: [{ role: 'user', content }],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';
    const arrMatch = raw.match(/\[[\s\S]*\]/);
    if (!arrMatch) throw new Error('No JSON array in model response');

    const parsed = JSON.parse(arrMatch[0]) as unknown[];
    const validIdx = new Set(slides.map(s => s.idx));

    const results: MatchResult[] = images.map((url, i) => {
      const m = (parsed[i] ?? {}) as Record<string, unknown>;
      const rawIdx = typeof m.slideIdx === 'number' ? m.slideIdx : null;
      const confidence = typeof m.confidence === 'number' ? Math.max(0, Math.min(1, m.confidence)) : 0;
      return {
        url,
        caption: typeof m.caption === 'string' ? m.caption.slice(0, 200) : '',
        slideIdx: rawIdx !== null && validIdx.has(rawIdx) ? rawIdx : null,
        confidence,
      };
    });

    return NextResponse.json({ matches: results });

  } catch (err) {
    console.error('[match-images] error:', err instanceof Error ? err.message : err);
    // Matching is best-effort — the client treats a failure as "everything
    // goes to the tray", so a 500 here never blocks deck creation.
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Matching failed' },
      { status: 500 },
    );
  }
}
