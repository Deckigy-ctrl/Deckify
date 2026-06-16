import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateDeck } from '@/lib/ai';

export async function POST(request: NextRequest) {
  // Auth check — must happen before reading the body.
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Credit check via service role (bypasses RLS, reads the real value).
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('credits')
    .eq('user_id', user.id)
    .single();

  const currentCredits = profile?.credits ?? 0;
  if (currentCredits <= 0) {
    return NextResponse.json({ error: 'No credits remaining' }, { status: 402 });
  }

  let body: { topic?: unknown; slideCount?: unknown; count?: unknown; theme?: unknown; audience?: unknown; goal?: unknown; tone?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Accept both `count` (DeckifyApp) and `slideCount` for compatibility.
  const { topic, count, slideCount, theme, audience, goal, tone } = body;
  const rawCount = typeof count === 'number' ? count : (typeof slideCount === 'number' ? slideCount : undefined);

  if (!topic || typeof topic !== 'string' || !topic.trim()) {
    return NextResponse.json({ error: 'topic is required' }, { status: 400 });
  }

  console.log('[generate] request:', { topic, count: rawCount, theme, audience, goal, tone, credits: currentCredits });

  try {
    const slides = await generateDeck({
      topic: topic.trim(),
      slideCount: typeof rawCount === 'number' ? Math.min(Math.max(Math.round(rawCount), 3), 30) : 10,
      theme: typeof theme === 'string' && theme ? theme : 'default',
      audience: typeof audience === 'string' && audience ? audience : 'general',
      goal: typeof goal === 'string' && goal ? goal : 'explain',
      tone: typeof tone === 'string' && tone ? tone : 'professional',
    });

    // Decrement only after successful generation.
    await admin
      .from('profiles')
      .update({ credits: currentCredits - 1 })
      .eq('user_id', user.id);

    console.log('[generate] success:', slides.length, 'slides, credits remaining:', currentCredits - 1);
    return NextResponse.json({ slides, creditsRemaining: currentCredits - 1 });
  } catch (err) {
    console.error('[generate] error:', err instanceof Error ? err.message : err);
    const message = err instanceof Error ? err.message : 'Generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
