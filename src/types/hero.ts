/**
 * Core hero domain types.
 *
 * These describe a hero's *capabilities* rather than fabricated performance
 * numbers. Capability tags/vectors are the input to the Level-1 data engine
 * (see analytics/) which computes counters/synergies/role-fit transparently.
 *
 * Anything performance-related (win rate, pick rate, ban rate) is modeled
 * separately in `HeroLiveStats` and is only ever populated from a real data
 * source (see data/DataSource.ts). It is never invented.
 */

export type Attribute = 'STR' | 'AGI' | 'INT' | 'UNIVERSAL';

export type AttackType = 'Melee' | 'Ranged';

export type DamageType = 'Physical' | 'Magical' | 'Pure' | 'Mixed';

export type ScalingCurve = 'Early' | 'Mid' | 'Late' | 'Flexible';

/** Standard Dota 2 role labels (a hero can have several). */
export type Role =
  | 'Carry'
  | 'Support'
  | 'Nuker'
  | 'Disabler'
  | 'Jungler'
  | 'Durable'
  | 'Escape'
  | 'Pusher'
  | 'Initiator';

/** Standard draft position, 1 (safelane carry) through 5 (hard support). */
export type Position = 1 | 2 | 3 | 4 | 5;

/**
 * Boolean capability tags used by the heuristic engine to detect hard
 * counters/synergies that a pure numeric vector would miss (e.g.
 * "silence beats channeled ultimates").
 */
export type HeroTag =
  | 'illusions'
  | 'illusion-clear'
  | 'invisibility'
  | 'detection'
  | 'channeling-ultimate'
  | 'summons'
  | 'evasion'
  | 'blink-mobility'
  | 'ranged-burst'
  | 'melee-burst'
  | 'aoe-stun'
  | 'silence'
  | 'root'
  | 'healer'
  | 'armor-reduction'
  | 'magic-immunity-piercing'
  | 'global-presence'
  | 'teamwipe-ultimate'
  | 'pick-off'
  | 'split-push'
  | 'anti-kite'
  | 'lockdown'
  | 'high-ground-siege'
  | 'buyback-punish'
  | 'ministun-lockdown'
  | 'break'
  | 'dispel-heavy'
  | 'strong-laner'
  | 'weak-laner';

/**
 * Numeric capability vector, each on a 0-3 scale (0 = none/very low,
 * 3 = defining trait of the hero). These are curated design judgments,
 * not statistics, and are always labeled as such in the UI.
 */
export interface CapabilityVector {
  control: number; // stuns / roots / hard disables
  mobility: number; // blink, haste, escape tools
  tankiness: number; // effective HP, armor, self-sustain under focus
  teamfight: number; // impact of ultimate/kit in 5v5 fights
  pushing: number; // lane push / split push power
  sustain: number; // self or team healing / regen
  burst: number; // single-target burst damage potential
  aoe: number; // area damage / area control
}

export type DataConfidence = 'curated' | 'estimated' | 'live';

export interface Hero {
  id: string; // kebab-case slug, e.g. "anti-mage"
  localizedName: string;
  attribute: Attribute;
  attackType: AttackType;
  damageType: DamageType;
  roles: Role[];
  positions: Position[];
  complexity: 1 | 2 | 3; // execution difficulty, 1 = easy, 3 = hard
  scaling: ScalingCurve;
  tags: HeroTag[];
  capability: CapabilityVector;
  /** Whether this hero's capability data was hand-curated or auto-derived. */
  confidence: DataConfidence;
  /** Optional short design note surfaced in Pick Explorer. */
  notes?: string;
}

/**
 * Live/statistical data about a hero for the *current patch*, when a real
 * data source (e.g. OpenDota) is reachable. Any field may be absent, in
 * which case the UI/AI must say "Insufficient data" rather than guess.
 */
export interface HeroLiveStats {
  heroId: string;
  patch: string;
  winRate?: number; // 0-100
  pickRate?: number; // 0-100
  banRate?: number; // 0-100
  sampleSize?: number;
  source: string; // e.g. "opendota"
  fetchedAt: string; // ISO timestamp
}

export interface HeroMatchupOverride {
  heroId: string;
  vsHeroId: string;
  /** Positive = heroId counters vsHeroId. Negative = vsHeroId counters heroId. Range roughly -3..3 */
  advantage: number;
  reason: string;
}

export interface HeroSynergyOverride {
  heroA: string;
  heroB: string;
  /** 0..3, how much stronger the pair is together than apart. */
  strength: number;
  reason: string;
}
