export interface DeckRequest {
  topic: string;
  slideCount: number;
  theme: string;
  audience: string;
  goal: string;
  tone: string;
}

export type Slide = Record<string, unknown>;

export type ProviderFn = (request: DeckRequest) => Promise<Slide[]>;
