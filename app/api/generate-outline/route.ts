import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';
import type { OutlineCard } from '@/lib/ai/types';

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { topic?: unknown; audience?: unknown; goal?: unknown; tone?: unknown; count?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const topic    = typeof body.topic    === 'string' ? body.topic.trim() : '';
  const audience = typeof body.audience === 'string' ? body.audience     : 'general';
  const goal     = typeof body.goal     === 'string' ? body.goal         : 'explain';
  const tone     = typeof body.tone     === 'string' ? body.tone         : 'professional';
  const count    = typeof body.count    === 'number'
    ? Math.min(Math.max(Math.round(body.count), 3), 20)
    : 8;

  if (!topic) {
    return NextResponse.json({ error: 'topic is required' }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
    return NextResponse.json({ error: 'AI not configured' }, { status: 500 });
  }

  const isThaiTone = tone === 'thai_formal' || tone === 'thai_casual';
  const langNote = isThaiTone ? 'Write all titles and bullets in Thai (ภาษาไทย).' : 'Write in English.';

  const systemPrompt =
    'You are a presentation structure expert. ' + langNote + ' ' +
    'Return ONLY a valid JSON array of exactly ' + count + ' outline cards. ' +
    'Schema: {"title":"slide title (max 70 chars)","bullets":["hint 1","hint 2","hint 3"]} ' +
    'Each card must have 2–4 short bullet hints (not full sentences — brief phrases guiding content). ' +
    'No markdown, no prose, no code fences. Start your response with [ and end with ].';

  const userMessage =
    'Topic: ' + topic +
    '\nAudience: ' + audience +
    '\nGoal: ' + goal +
    '\nTone: ' + tone +
    '\nSlide count: ' + count +
    '\n\nCreate a ' + count + '-slide outline for: "' + topic + '". ' +
    'Slide 1 must be the title slide. Last slide must be conclusion or Q&A. ' +
    'Make every title specific — no generic labels like "Introduction" or "Overview". ' +
    'Return only the JSON array.';

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1600,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '';

    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('No JSON array in response');

    let parsed: unknown;
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      throw new Error('JSON parse failed');
    }

    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Empty outline');

    const outline: OutlineCard[] = (parsed as unknown[])
      .filter(c => c && typeof c === 'object')
      .map(c => {
        const card = c as Record<string, unknown>;
        return {
          title: typeof card.title === 'string' ? card.title.slice(0, 80) : topic,
          bullets: Array.isArray(card.bullets)
            ? (card.bullets as unknown[]).filter(b => typeof b === 'string').slice(0, 6) as string[]
            : [],
        };
      })
      .slice(0, 20);

    if (outline.length === 0) throw new Error('No valid cards after validation');

    return NextResponse.json({ outline });
  } catch (err) {
    console.error('[generate-outline]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Outline generation failed' }, { status: 500 });
  }
}
