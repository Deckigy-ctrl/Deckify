import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

const AUDIENCE_LABEL: Record<string, string> = {
  committee:  'a thesis committee',
  class:      'classmates and a professor',
  professor:  'a professor for review',
  group:      'a group presentation to classmates',
  conference: 'an academic conference',
  general:    'a general audience',
};

const GOAL_LABEL: Record<string, string> = {
  defend:    'defend a thesis',
  findings:  'present research findings',
  explain:   'explain a concept',
  summarize: 'summarize research',
  propose:   'propose a project or initiative',
  teach:     'teach or educate',
};

const TONE_LABEL: Record<string, string> = {
  academic:       'formal academic',
  professional:   'professional',
  conversational: 'conversational',
  thai_formal:    'formal Thai academic (ภาษาวิชาการ)',
  thai_casual:    'casual Thai (ภาษาทั่วไป)',
};

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { topic?: unknown; context?: unknown; audience?: unknown; goal?: unknown; tone?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const topic    = typeof body.topic    === 'string' ? body.topic.trim()    : '';
  const context  = typeof body.context  === 'string' ? body.context.trim()  : '';
  const audience = typeof body.audience === 'string' ? body.audience        : 'general';
  const goal     = typeof body.goal     === 'string' ? body.goal            : 'explain';
  const tone     = typeof body.tone     === 'string' ? body.tone            : 'professional';

  if (!topic) {
    return NextResponse.json({ error: 'topic is required' }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
    return NextResponse.json({ error: 'AI not configured' }, { status: 500 });
  }

  const audienceStr = AUDIENCE_LABEL[audience] ?? 'a general audience';
  const goalStr     = GOAL_LABEL[goal]         ?? 'explain a concept';
  const toneStr     = TONE_LABEL[tone]         ?? 'professional';
  const isThai      = tone === 'thai_formal' || tone === 'thai_casual';

  const systemPrompt = isThai
    ? 'คุณเป็นผู้ช่วยเขียนสำหรับนักศึกษา เขียนคำอธิบายการนำเสนอเป็นภาษาไทยที่ชัดเจน 2-3 ประโยค ห้ามขึ้นต้นด้วย "นี่คือ" หรือคำนำ ให้ตอบเฉพาะคำอธิบายเท่านั้น'
    : 'You are a writing assistant for university students. Given a short topic phrase and context, write a clear 2–3 sentence presentation description in a ' + toneStr + ' tone. Output only the description — no preamble, no quotes, no labels.';

  const userMessage = isThai
    ? `หัวข้อ: ${topic}${context ? `\nบริบท: ${context}` : ''}\nผู้ฟัง: ${audienceStr}\nเป้าหมาย: ${goalStr}`
    : `Topic: ${topic}${context ? `\nContext: ${context}` : ''}\nAudience: ${audienceStr}\nGoal: ${goalStr}\n\nWrite the 2–3 sentence presentation description.`;

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: process.env.MODEL ?? 'claude-haiku-4-5-20251001',
      max_tokens: 220,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const expanded = response.content[0].type === 'text'
      ? response.content[0].text.trim()
      : '';

    if (!expanded) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    return NextResponse.json({ expanded });
  } catch (err) {
    console.error('[expand-topic] error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'AI call failed' }, { status: 500 });
  }
}
