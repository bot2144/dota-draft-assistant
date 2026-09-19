import type { HeroSynergyOverride } from '../types/hero';

/**
 * Hand-curated synergy pairs where two heroes' kits combo well beyond what
 * the generic capability-vector heuristic would infer (chain-disables,
 * setup-into-ultimate combos, hard save + hard commit combos, etc.).
 * `strength` is 0-3. Always surfaced as "curated" confidence.
 */
export const CURATED_SYNERGIES: HeroSynergyOverride[] = [
  { heroA: 'earthshaker', heroB: 'magnus', strength: 3, reason: 'Reverse Polarity into Echo Slam chain-stuns and multiplies AoE damage on a grouped enemy team.' },
  { heroA: 'enigma', heroB: 'magnus', strength: 3, reason: 'Reverse Polarity or Black Hole into the other guarantees a follow-up teamwipe window.' },
  { heroA: 'tidehunter', heroB: 'enigma', strength: 3, reason: 'Ravage/Black Hole layering removes any chance of the enemy team disjointing or escaping.' },
  { heroA: 'earthshaker', heroB: 'enigma', strength: 2, reason: 'Either ultimate groups or locks the enemy for the other to follow up cleanly.' },
  { heroA: 'crystal-maiden', heroB: 'faceless-void', strength: 2, reason: 'Freezing Field/Frostbite peel and slow help set up and protect Chronosphere windows.' },
  { heroA: 'io', heroB: 'faceless-void', strength: 3, reason: 'Relocate delivers Void directly into position for a perfectly timed Chronosphere.' },
  { heroA: 'keeper-of-the-light', heroB: 'faceless-void', strength: 2, reason: 'Mana refill and long-range poke let Void enter fights safely before chronoing.' },
  { heroA: 'lion', heroB: 'faceless-void', strength: 2, reason: 'Hex/stun chains extend crowd control leading into or out of Chronosphere.' },
  { heroA: 'dark-seer', heroB: 'sven', strength: 2, reason: 'Vacuum groups enemies directly into Great Cleave/Storm Hammer AoE.' },
  { heroA: 'dark-seer', heroB: 'tidehunter', strength: 2, reason: 'Vacuum can group enemies into Ravage range, or vice versa.' },
  { heroA: 'sand-king', heroB: 'lina', strength: 2, reason: 'Epicenter groups and stuns; Laguna Blade finishes a priority target instantly.' },
  { heroA: 'ogre-magi', heroB: 'earthshaker', strength: 2, reason: 'Chain-stun potential between Fireblast and Echo Slam locks down fights.' },
  { heroA: 'shadow-demon', heroB: 'sand-king', strength: 2, reason: 'Disruption isolates a target for Sand King to follow up with burst and stun.' },
  { heroA: 'vengeful-spirit', heroB: 'phantom-assassin', strength: 2, reason: 'Nether Swap repositions PA into a clean backline pick-off angle.' },
  { heroA: 'io', heroB: 'wraith-king', strength: 2, reason: 'Tether sustain and Relocate mobility patch Wraith King\'s lack of an escape/initiation tool.' },
  { heroA: 'oracle', heroB: 'spirit-breaker', strength: 2, reason: 'False Promise lets Spirit Breaker commit to a Charge without dying to the retaliation burst.' },
  { heroA: 'shadow-demon', heroB: 'invoker', strength: 2, reason: 'Disruption isolates a target so Invoker can safely land his full combo.' },
  { heroA: 'ancient-apparition', heroB: 'necrophos', strength: 2, reason: 'Ice Blast blocking heals lets Reaper\'s Scythe/percent-HP damage finish targets that would otherwise heal through it.' },
  { heroA: 'treant-protector', heroB: 'timbersaw', strength: 1, reason: 'Living Armor and slows help protect a farming Timbersaw from ganks.' },
  { heroA: 'phoenix', heroB: 'enigma', strength: 2, reason: 'Supernova can bait or protect while Black Hole resolves; both are strong grouped-fight ultimates.' },
  { heroA: 'undying', heroB: 'axe', strength: 1, reason: 'Decay strength-steal and zoning pairs well with Axe\'s early-game dominance pattern.' },
  { heroA: 'batrider', heroB: 'tidehunter', strength: 2, reason: 'Flaming Lasso can drag a priority target directly into a Ravage-ready group.' },
  { heroA: 'winter-wyvern', heroB: 'sven', strength: 2, reason: "Winter's Curse forces the enemy team to focus one ally while Sven cleaves down the rest." },
  { heroA: 'disruptor', heroB: 'tidehunter', strength: 2, reason: 'Static Storm silences the enemy team before or after Ravage, preventing any dispel/counter-initiation.' },
  { heroA: 'grimstroke', heroB: 'enigma', strength: 2, reason: "Ink Swell/Soul Bind hold targets in place, extending Black Hole's effective lockdown." },
];
