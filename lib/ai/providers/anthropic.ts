import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt, buildUserPrompt, parseAndValidateSlides } from '../prompt';
import type { DeckRequest, ProviderFn, Slide } from '../types';

const MODEL = process.env.MODEL ?? 'claude-sonnet-4-6';

async function attempt(
  client: Anthropic,
  request: DeckRequest,
  strict: boolean,
): Promise<Slide[]> {
  const { topic, slideCount, theme, audience, goal, tone } = request;
  const systemPrompt = buildSystemPrompt(audience, goal, tone, slideCount);
  const userPrompt = buildUserPrompt(topic, audience, goal, tone, theme, slideCount);

  const messages: Anthropic.MessageParam[] = strict
    ? [{
        role: 'user',
        content:
          'Return ONLY a valid JSON array of ' + slideCount + ' presentation slides for the topic: ' + topic + '. ' +
          'No prose, no markdown, no explanation. Start your response with [ and end with ]. ' +
          userPrompt,
      }]
    : [{ role: 'user', content: userPrompt }];

  const system = strict
    ? systemPrompt + '\nCRITICAL: Your response must start with [ and end with ]. Nothing else.'
    : systemPrompt;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system,
    messages,
  });

  const raw = response.content[0].type === 'text' ? response.content[0].text : '';
  return parseAndValidateSlides(raw, slideCount, topic);
}

export const anthropicProvider: ProviderFn = async (request: DeckRequest): Promise<Slide[]> => {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    return await attempt(client, request, false);
  } catch {
    return await attempt(client, request, true);
  }
};
