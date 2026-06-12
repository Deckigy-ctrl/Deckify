import { anthropicProvider } from './providers/anthropic';
// To add a new provider: import it here and add an entry to PROVIDERS below.
// Then set PROVIDER=<key> in your environment.

import type { DeckRequest, ProviderFn, Slide } from './types';

const PROVIDERS: Record<string, ProviderFn> = {
  anthropic: anthropicProvider,
};

export async function generateDeck(request: DeckRequest): Promise<Slide[]> {
  const providerName = process.env.PROVIDER ?? 'anthropic';
  const provider = PROVIDERS[providerName];
  if (!provider) {
    throw new Error(
      `Unknown AI provider "${providerName}". Available: ${Object.keys(PROVIDERS).join(', ')}`,
    );
  }
  return provider(request);
}

export type { DeckRequest, Slide } from './types';
