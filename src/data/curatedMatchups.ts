import type { HeroMatchupOverride } from '../types/hero';

/**
 * Hand-curated hard/soft counter relationships that the tag/vector heuristic
 * alone would not reliably surface. `advantage` is from heroId's
 * perspective: positive means heroId counters vsHeroId, negative means
 * heroId is countered by vsHeroId. Scale roughly -3..3.
 *
 * These are design-level judgments (kit interactions), not win-rate data,
 * and are always labeled "curated" confidence in the UI/AI output.
 */
export const CURATED_MATCHUPS: HeroMatchupOverride[] = [
  // Silence / lockdown vs channeled ultimates
  { heroId: 'silencer', vsHeroId: 'witch-doctor', advantage: 2, reason: 'Global Silence stops Death Ward mid-channel.' },
  { heroId: 'silencer', vsHeroId: 'enigma', advantage: 2, reason: 'Silence prevents Black Hole from ever being cast.' },
  { heroId: 'nyx-assassin', vsHeroId: 'witch-doctor', advantage: 2, reason: 'Spiked Carapace reflects and interrupts the Death Ward channel.' },
  { heroId: 'nyx-assassin', vsHeroId: 'enigma', advantage: 2, reason: 'Vendetta pick-off threatens Enigma before he can set up Black Hole.' },
  { heroId: 'doom', vsHeroId: 'omniknight', advantage: 2, reason: 'Doom silences and disables Guardian Angel/Repel entirely.' },
  { heroId: 'doom', vsHeroId: 'dazzle', advantage: 2, reason: 'Doom removes Shallow Grave and passive regen abilities.' },
  { heroId: 'bane', vsHeroId: 'anti-mage', advantage: 2, reason: 'Fiend\'s Grip locks down a farmed Anti-Mage who has no disable-immunity.' },

  // Evasion / mobility carries vs their classic answers
  { heroId: 'monkey-king', vsHeroId: 'phantom-assassin', advantage: 1, reason: 'Boundless Strike and Jingu Mastery bypass evasion (true strike window).' },
  { heroId: 'ogre-magi', vsHeroId: 'phantom-assassin', advantage: 1, reason: 'Fireblast/Ignite provide true-strike-adjacent reliability into evasion carries.' },
  { heroId: 'slardar', vsHeroId: 'phantom-assassin', advantage: 1, reason: 'Amplify Damage grants true strike, negating Coup de Grace evasion RNG risk on Slardar\'s side.' },
  { heroId: 'nyx-assassin', vsHeroId: 'riki', advantage: 2, reason: 'Spiked Carapace and general detection needs shut down invisibility play.' },
  { heroId: 'bounty-hunter', vsHeroId: 'anti-mage', advantage: -1, reason: 'Anti-Mage\'s Blink and farm speed usually outpaces Bounty Hunter\'s gold-denial value once he scales.' },

  // Anti-mobility vs blink/escape carries
  { heroId: 'axe', vsHeroId: 'anti-mage', advantage: 1, reason: 'Berserker\'s Call locks down Blink-reliant melee carries who lack disable immunity.' },
  { heroId: 'mars', vsHeroId: 'drow-ranger', advantage: 2, reason: 'Arena of Blood traps ranged kiting heroes and blocks their retreat.' },
  { heroId: 'bloodseeker', vsHeroId: 'storm-spirit', advantage: 2, reason: 'Rupture punishes Ball Lightning travel distance with heavy return damage.' },
  { heroId: 'bloodseeker', vsHeroId: 'anti-mage', advantage: 1, reason: 'Rupture punishes Blink usage directly.' },
  { heroId: 'shadow-fiend', vsHeroId: 'storm-spirit', advantage: -1, reason: 'Storm Spirit\'s mobility lets him pick fights on his terms against the immobile Shadow Fiend.' },

  // Faceless Void / Chronosphere interactions
  { heroId: 'faceless-void', vsHeroId: 'crystal-maiden', advantage: 2, reason: 'Chronosphere freezes a fragile, immobile support with no way to escape or dispel.' },
  { heroId: 'faceless-void', vsHeroId: 'lion', advantage: 1, reason: 'Chronosphere neutralizes Lion before he can land Finger of Death.' },
  { heroId: 'omniknight', vsHeroId: 'faceless-void', advantage: 1, reason: 'Repel grants magic immunity, letting a key ally act freely inside Chronosphere.' },
  { heroId: 'oracle', vsHeroId: 'faceless-void', advantage: 1, reason: 'False Promise heals through Chronosphere burst on the target.' },

  // Silence / disable vs Invoker
  { heroId: 'silencer', vsHeroId: 'invoker', advantage: 2, reason: 'Global Silence shuts down Invoker\'s entire spell-dependent kit.' },
  { heroId: 'nyx-assassin', vsHeroId: 'invoker', advantage: 1, reason: 'Vendetta punishes squishy, positioning-reliant Invoker before he can combo.' },
  { heroId: 'axe', vsHeroId: 'invoker', advantage: 1, reason: 'Berserker\'s Call locks down a low-mobility Invoker in Quas-Wex forms.' },

  // Morphling interactions
  { heroId: 'outworld-destroyer', vsHeroId: 'morphling', advantage: 1, reason: 'Silence blocks Waveform, removing Morphling\'s core escape/reposition tool.' },
  { heroId: 'silencer', vsHeroId: 'morphling', advantage: 1, reason: 'Global Silence prevents Waveform and Morph Agi resets mid-fight.' },
  { heroId: 'viper', vsHeroId: 'morphling', advantage: 1, reason: 'Nethertoxin\'s attack-speed reduction and DoT punish Morphling\'s attack-reliant scaling.' },

  // Illusions vs illusion-clear / cleave / true-sight
  { heroId: 'earthshaker', vsHeroId: 'phantom-lancer', advantage: 2, reason: 'Echo Slam scales damage with every illusion hit, deleting the whole clone army.' },
  { heroId: 'sand-king', vsHeroId: 'phantom-lancer', advantage: 2, reason: 'Epicenter and Sand Storm both punish clustered illusion armies.' },
  { heroId: 'axe', vsHeroId: 'naga-siren', advantage: 1, reason: 'Counter Helix cleave shreds illusions passively.' },
  { heroId: 'templar-assassin', vsHeroId: 'chaos-knight', advantage: 1, reason: 'Meld/Psi Blades cleave clears illusion waves efficiently.' },
  { heroId: 'necrophos', vsHeroId: 'chaos-knight', advantage: 1, reason: 'Sadist and Death Pulse AoE mow down Chaos Knight illusions.' },

  // Healing denial vs sustain-heavy heroes
  { heroId: 'ancient-apparition', vsHeroId: 'lifestealer', advantage: 2, reason: 'Ice Blast blocks Lifestealer\'s Feast/Rage sustain entirely.' },
  { heroId: 'ancient-apparition', vsHeroId: 'omniknight', advantage: 1, reason: 'Ice Blast negates Omniknight\'s healing output on an ally.' },
  { heroId: 'necrophos', vsHeroId: 'lifestealer', advantage: 1, reason: 'Percent-max-HP damage from Reaper\'s Scythe scales through Lifestealer\'s high HP pool.' },

  // Break vs passive-reliant heroes
  { heroId: 'lifestealer', vsHeroId: 'juggernaut', advantage: 1, reason: 'Open Wounds removes Blade Fury dispel-immunity usage timing and punishes escape attempts.' },

  // Detection vs invisibility
  { heroId: 'slardar', vsHeroId: 'riki', advantage: 2, reason: 'Amplify Damage reveals and executes invisible heroes.' },
  { heroId: 'zeus', vsHeroId: 'riki', advantage: 1, reason: 'Thundergod\'s Wrath reveals invisible heroes anywhere on the map.' },
  { heroId: 'zeus', vsHeroId: 'clinkz', advantage: 1, reason: 'Global reveal denies Clinkz\'s invisibility-based pick-off pattern.' },

  // Armor reduction / anti-tank
  { heroId: 'slardar', vsHeroId: 'tidehunter', advantage: 1, reason: 'Amplify Damage helps physical carries shred through Kraken Shell + high armor.' },

  // Anti-kite vs kiting supports/carries
  { heroId: 'razor', vsHeroId: 'drow-ranger', advantage: 1, reason: 'Static Link drains and disables ranged auto-attack damage output.' },
  { heroId: 'viper', vsHeroId: 'templar-assassin', advantage: 1, reason: 'Nethertoxin slow locks down a mobility-reliant ranged carry in lane and skirmishes.' },

  // Duel / pick-off vs tanky farmers
  { heroId: 'legion-commander', vsHeroId: 'wraith-king', advantage: 1, reason: 'Duel isolates a farmed carry away from team support (Wraith King has no strong duel escape).' },
  { heroId: 'legion-commander', vsHeroId: 'medusa', advantage: -1, reason: 'Mana Shield and Stone Gaze make Medusa a dangerous, tanky duel target.' },

  // AoE stun teamfight vs low-mobility grouped comps
  { heroId: 'tidehunter', vsHeroId: 'necrophos', advantage: 1, reason: 'Ravage locks down grouped, low-mobility casters before they can cast Reaper\'s Scythe.' },
  { heroId: 'magnus', vsHeroId: 'medusa', advantage: 1, reason: 'Reverse Polarity punishes clumped, immobile late-game carries in Split Shot stance.' },
];
