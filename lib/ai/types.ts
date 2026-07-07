export interface OutlineCard {
  title: string;
  bullets: string[];
}

/** An image the user attached before generation. The deck model uses these to
    plan slides that can actually HOST the images (figure slides for diagrams,
    image-friendly types for photos) — without this, decks full of composed
    layouts leave matched images nowhere to land. */
export interface AttachedImage {
  caption: string;
  kind: 'photo' | 'figure';
}

export interface DeckRequest {
  topic: string;
  slideCount: number;
  theme: string;
  audience: string;
  goal: string;
  tone: string;
  outline?: OutlineCard[];
  attachedImages?: AttachedImage[];
}

export type Slide = Record<string, unknown>;

export type ProviderFn = (request: DeckRequest) => Promise<Slide[]>;
