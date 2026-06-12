import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateDeck } from '@/lib/ai';

export async function POST(request: NextRequest) {
  // Auth check — must happen before reading the body.
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { topic?: unknown; slideCount?: unknown; theme?: unknown; audience?: unknown; goal?: unknown; tone?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { topic, slideCount, theme, audience, goal, tone } = body;

  if (!topic || typeof topic !== 'string' || !topic.trim()) {
    return NextResponse.json({ error: 'topic is required' }, { status: 400 });
  }

  try {
    const slides = await generateDeck({
      topic: topic.trim(),
      slideCount: typeof slideCount === 'number' ? Math.min(Math.max(Math.round(slideCount), 3), 30) : 10,
      theme: typeof theme === 'string' && theme ? theme : 'default',
      audience: typeof audience === 'string' && audience ? audience : 'general',
      goal: typeof goal === 'string' && goal ? goal : 'explain',
      tone: typeof tone === 'string' && tone ? tone : 'professional',
    });
    return NextResponse.json({ slides });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
