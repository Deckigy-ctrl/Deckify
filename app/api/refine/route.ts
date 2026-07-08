import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

const MODEL = process.env.MODEL ?? 'claude-sonnet-4-6';

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { slide?: unknown; instruction?: unknown };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { slide, instruction } = body;
  if (!slide || typeof slide !== 'object') {
    return NextResponse.json({ error: 'slide is required' }, { status: 400 });
  }
  if (!instruction || typeof instruction !== 'string' || !instruction.trim()) {
    return NextResponse.json({ error: 'instruction is required' }, { status: 400 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const system = 'You are a presentation expert. You receive a single slide object as JSON and an instruction. Apply the instruction and return ONLY the updated slide JSON object — same fields, same structure. Do not add explanation, markdown fences, or any text outside the JSON object. Preserve the img field exactly as-is. Keep speaker_notes updated to match. For stat slides: stat field holds the big number/percentage. For quote slides: quote field holds the quoted text. Never use em dashes (—) in any text; write shorter sentences or use a comma or colon.';
  const prompt = `Current slide:\n${JSON.stringify(slide, null, 2)}\n\nInstruction: ${instruction.trim()}\n\nReturn only the updated JSON object.`;

  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: prompt }]
    });
    const t = msg.content.find(b => b.type === 'text');
    if (!t) return NextResponse.json({ error: 'Empty response' }, { status: 500 });
    const clean = t.text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    const updated = JSON.parse(clean);
    const originalSlide = slide as Record<string, unknown>;
    return NextResponse.json({ slide: { ...originalSlide, ...updated, img: originalSlide.img } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Refine failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
