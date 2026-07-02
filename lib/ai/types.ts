export interface OutlineCard {
  title: string;
  bullets: string[];
}

export interface DeckRequest {
  topic: string;
  slideCount: number;
  theme: string;
  audience: string;
  goal: string;
  tone: string;
  outline?: OutlineCard[];
}

export type Slide = Record<string, unknown>;

export type ProviderFn = (request: DeckRequest) => Promise<Slide[]>;
