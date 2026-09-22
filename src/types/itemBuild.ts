import type { DataConfidence } from './hero';

export type ItemSlotCategory = 'starting' | 'early' | 'core' | 'situational' | 'luxury';

export interface ItemRecommendation {
  name: string;
  category: ItemSlotCategory;
  /** Why this item, in plain language. For situational items, tied to the current draft when possible. */
  reason: string;
}

export interface HeroItemBuild {
  heroId: string;
  confidence: DataConfidence; // 'curated' for hand-picked builds, 'estimated' for the generic archetype fallback
  items: ItemRecommendation[];
}
