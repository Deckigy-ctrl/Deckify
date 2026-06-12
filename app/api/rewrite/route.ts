import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

const MODEL = process.env.MODEL ?? 'claude-sonnet-4-6';

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { text?: unknown; slideTitle?: unknown };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { text, slideTitle } = body;
  if (!text || typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: 'You are a presentation writing expert. Rewrite the given text to be more professional, clear and impactful. Keep it roughly the same length. Return ONLY the rewritten text with no quotes, preamble, or explanation.',
      messages: [{
        role: 'user',
        content: `Slide topic: "${slideTitle || ''}". Rewrite this text:\n\n${text.trim()}`
      }]
    });
    const t = msg.content.find(b => b.type === 'text');
    return NextResponse.json({ result: t ? t.text : text });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Rewrite failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
