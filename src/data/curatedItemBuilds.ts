import type { HeroItemBuild } from '../types/itemBuild';

/**
 * Hand-curated core item paths for well-known heroes — standard, widely
 * accepted build shapes (starting → early → core), not live win-rate-derived
 * "meta" builds we don't have licensed data for. Situational items are added
 * on top of this at runtime by ItemBuildEngine, based on the actual current
 * draft. Kept intentionally small (the same "curate what's well-known,
 * derive the rest transparently" approach as curatedMatchups/curatedSynergies)
 * rather than claiming exhaustive, always-current coverage.
 */
export const CURATED_ITEM_BUILDS: HeroItemBuild[] = [
  {
    heroId: 'anti-mage',
    confidence: 'curated',
    items: [
      { name: 'Quelling Blade + Branches', category: 'starting', reason: 'Faster last-hitting to snowball his farm-dependent early game.' },
      { name: 'Battle Fury', category: 'core', reason: 'Cleave dramatically accelerates his jungle/lane farm speed.' },
      { name: 'Manta Style', category: 'core', reason: 'Illusions add damage and dispel debuffs — his signature power spike.' },
      { name: 'Abyssal Blade', category: 'luxury', reason: 'Turns him into a reliable pick-off/finisher once farmed.' },
    ],
  },
  {
    heroId: 'axe',
    confidence: 'curated',
    items: [
      { name: 'Stout Shield + Branches', category: 'starting', reason: 'Sustains him through contested early lanes.' },
      { name: 'Blade Mail', category: 'core', reason: 'Punishes anyone who focuses him after Berserker\'s Call locks them down.' },
      { name: 'Blink Dagger', category: 'core', reason: 'Lets him initiate Call reliably instead of walking in.' },
      { name: 'Heart of Tarrasque', category: 'luxury', reason: 'Turns him into a near-unkillable initiator in extended fights.' },
    ],
  },
  {
    heroId: 'bloodseeker',
    confidence: 'curated',
    items: [
      { name: 'Wraith Band', category: 'early', reason: 'Cheap stats to reinforce his lane presence.' },
      { name: 'Sange and Yasha', category: 'core', reason: 'Slow + mixed stats fit his aggressive pick-off pattern.' },
      { name: 'Basher / Abyssal Blade', category: 'core', reason: 'Extra lockdown to finish low-health targets Rupture already marked.' },
    ],
  },
  {
    heroId: 'clockwerk',
    confidence: 'curated',
    items: [
      { name: 'Boots of Speed + wards', category: 'starting', reason: 'Support-side utility and map presence.' },
      { name: 'Blink Dagger', category: 'core', reason: 'Combined with Power Cogs for a reliable initiation/pick-off combo.' },
      { name: 'Aghanim\'s Shard/Scepter', category: 'situational', reason: 'Extends his lockdown and battlefield control in a straight fight.' },
    ],
  },
  {
    heroId: 'crystal-maiden',
    confidence: 'curated',
    items: [
      { name: 'Tango + Clarity', category: 'starting', reason: 'Sustains her fragile lane presence.' },
      { name: 'Glimmer Cape', category: 'core', reason: 'Cheap survivability against burst — she has no escape of her own.' },
      { name: 'Aghanim\'s Scepter', category: 'situational', reason: 'A second Frostbite dramatically raises her teamfight lockdown.' },
    ],
  },
  {
    heroId: 'dazzle',
    confidence: 'curated',
    items: [
      { name: 'Wind Lace + Tangoes', category: 'starting', reason: 'Positioning speed for a squishy healer.' },
      { name: 'Glimmer Cape', category: 'core', reason: 'Lets him save a carry from burst without dying himself.' },
      { name: 'Aeon Disk', category: 'situational', reason: 'A second layer of save against heavy burst damage.' },
    ],
  },
  {
    heroId: 'drow-ranger',
    confidence: 'curated',
    items: [
      { name: 'Slippers of Agility', category: 'starting', reason: 'Cheap agility to snowball her right-click damage.' },
      { name: 'Dragon Lance', category: 'core', reason: 'Attack range keeps her safe while she deals sustained physical damage.' },
      { name: 'Black King Bar', category: 'situational', reason: 'She has no escape — spell immunity against a disable-heavy enemy team is often mandatory.' },
    ],
  },
  {
    heroId: 'earthshaker',
    confidence: 'curated',
    items: [
      { name: 'Boots of Speed + wards', category: 'starting', reason: 'Map presence for setting up Fissure ganks.' },
      { name: 'Blink Dagger', category: 'core', reason: 'Reliable Echo Slam initiation — his entire value depends on landing it.' },
      { name: 'Aghanim\'s Scepter', category: 'situational', reason: 'A second Blink charge for follow-up initiations mid-fight.' },
    ],
  },
  {
    heroId: 'enigma',
    confidence: 'curated',
    items: [
      { name: 'Boots of Speed', category: 'starting', reason: 'Map presence for Black Hole setups.' },
      { name: 'Blink Dagger', category: 'core', reason: 'Essential for landing Black Hole reliably.' },
      { name: 'Aghanim\'s Scepter', category: 'situational', reason: 'Instant-cast Black Hole is much harder to interrupt or juke.' },
    ],
  },
  {
    heroId: 'faceless-void',
    confidence: 'curated',
    items: [
      { name: 'Quelling Blade + Branches', category: 'starting', reason: 'Faster farm to reach his core items.' },
      { name: 'Battle Fury', category: 'core', reason: 'Cleave farm speed to scale into the late game.' },
      { name: 'Butterfly', category: 'core', reason: 'Evasion + attack speed once he\'s ahead — devastating inside his own Chronosphere.' },
    ],
  },
  {
    heroId: 'invoker',
    confidence: 'curated',
    items: [
      { name: 'Null Talisman', category: 'early', reason: 'Cheap stats and mana sustain for spell spam.' },
      { name: 'Hand of Midas', category: 'core', reason: 'Accelerates his gold-hungry item timings if the lane is safe.' },
      { name: 'Black King Bar', category: 'situational', reason: 'He is fragile and has no innate escape once caught.' },
    ],
  },
  {
    heroId: 'io',
    confidence: 'curated',
    items: [
      { name: 'Boots of Speed + wards', category: 'starting', reason: 'Support-side utility for early Tether/Spirits play.' },
      { name: 'Aghanim\'s Scepter', category: 'core', reason: 'Relocate is one of the strongest team repositioning tools in the game.' },
    ],
  },
  {
    heroId: 'juggernaut',
    confidence: 'curated',
    items: [
      { name: 'Quelling Blade + Branches', category: 'starting', reason: 'Faster last-hitting to snowball his farm.' },
      { name: 'Battle Fury', category: 'core', reason: 'Farm speed to reach his late-game right-click power.' },
      { name: 'Manta Style', category: 'core', reason: 'Dispels silences/roots so Blade Fury and Omnislash come off cleanly.' },
    ],
  },
  {
    heroId: 'kunkka',
    confidence: 'curated',
    items: [
      { name: 'Wraith Band', category: 'early', reason: 'Cheap stats while looking for Tidebringer/X Marks value.' },
      { name: 'Blink Dagger', category: 'core', reason: 'Lands Torrent/X Mark combos more reliably.' },
      { name: 'Black King Bar', category: 'situational', reason: 'Lets him stay in the fight to land Tidebringer cleaves.' },
    ],
  },
  {
    heroId: 'lich',
    confidence: 'curated',
    items: [
      { name: 'Boots of Speed + wards', category: 'starting', reason: 'Support-side utility and lane presence.' },
      { name: 'Aghanim\'s Scepter', category: 'situational', reason: 'Turns Chain Frost into a game-changing teamfight ultimate.' },
    ],
  },
  {
    heroId: 'lina',
    confidence: 'curated',
    items: [
      { name: 'Null Talisman', category: 'early', reason: 'Mana sustain for early nuke spam.' },
      { name: 'Aghanim\'s Shard', category: 'situational', reason: 'Extra utility for the flexible support/mid build.' },
      { name: 'Black King Bar', category: 'situational', reason: 'She is squishy — needed to cast her burst combo safely in a fight.' },
    ],
  },
  {
    heroId: 'lion',
    confidence: 'curated',
    items: [
      { name: 'Tango + Clarity', category: 'starting', reason: 'Sustains a fragile lane support.' },
      { name: 'Aghanim\'s Shard', category: 'situational', reason: 'A second Hex is enormous single-target lockdown.' },
      { name: 'Blink Dagger', category: 'situational', reason: 'Lets him land his Finger of Death combo on a priority target.' },
    ],
  },
  {
    heroId: 'lycan',
    confidence: 'curated',
    items: [
      { name: 'Helm of the Dominator', category: 'core', reason: 'Sustain and an extra summon while jungling/pushing.' },
      { name: 'Necronomicon', category: 'core', reason: 'Stacks his split-push and objective damage further.' },
      { name: 'Assault Cuirass', category: 'situational', reason: 'Boosts his whole wolf pack\'s armor and attack speed in a siege.' },
    ],
  },
  {
    heroId: 'magnus',
    confidence: 'curated',
    items: [
      { name: 'Boots of Speed + wards', category: 'starting', reason: 'Map presence for setting up Reverse Polarity.' },
      { name: 'Blink Dagger', category: 'core', reason: 'His entire value hinges on landing Reverse Polarity reliably.' },
      { name: 'Aghanim\'s Scepter', category: 'situational', reason: 'Empower for the whole team meaningfully raises fight damage.' },
    ],
  },
  {
    heroId: 'mars',
    confidence: 'curated',
    items: [
      { name: 'Boots of Speed + wards', category: 'starting', reason: 'Map presence for Arena of Blood setups.' },
      { name: 'Blink Dagger', category: 'core', reason: 'Reliable initiation into his Arena of Blood ultimate.' },
      { name: 'Black King Bar', category: 'situational', reason: 'Lets him stay and fight after locking enemies inside the Arena.' },
    ],
  },
  {
    heroId: 'morphling',
    confidence: 'curated',
    items: [
      { name: 'Wraith Band', category: 'early', reason: 'Cheap stats while scaling Waveform/Adaptive Strike harass.' },
      { name: 'Dragon Lance', category: 'core', reason: 'Range and stats to farm and poke safely.' },
      { name: 'Linken\'s Sphere', category: 'situational', reason: 'Blocks a single-target disable, which is his biggest weakness.' },
    ],
  },
  {
    heroId: 'omniknight',
    confidence: 'curated',
    items: [
      { name: 'Tango + Clarity', category: 'starting', reason: 'Sustain to stay in lane and cast Purification often.' },
      { name: 'Aghanim\'s Scepter', category: 'situational', reason: 'Guardian Angel on a wider radius is a huge teamfight-swinging save.' },
      { name: 'Force Staff', category: 'situational', reason: 'Extra repositioning to reach whoever needs the heal/save.' },
    ],
  },
  {
    heroId: 'oracle',
    confidence: 'curated',
    items: [
      { name: 'Tango + Clarity', category: 'starting', reason: 'Mana/HP sustain for constant False Promise/Purifying Flames use.' },
      { name: 'Glimmer Cape', category: 'situational', reason: 'Extra save layer alongside False Promise.' },
    ],
  },
  {
    heroId: 'phantom-assassin',
    confidence: 'curated',
    items: [
      { name: 'Quelling Blade + Branches', category: 'starting', reason: 'Faster last-hitting to snowball her farm.' },
      { name: 'Desolator', category: 'core', reason: 'Armor reduction massively boosts her crit damage output.' },
      { name: 'Black King Bar', category: 'situational', reason: 'She has no escape — spell immunity is often mandatory to get a crit off.' },
    ],
  },
  {
    heroId: 'puck',
    confidence: 'curated',
    items: [
      { name: 'Null Talisman', category: 'early', reason: 'Mana sustain and stats for spell spam.' },
      { name: 'Blink Dagger / Kaya', category: 'core', reason: 'Extra mobility or spell amp on top of her already-high mobility kit.' },
      { name: 'Black King Bar', category: 'situational', reason: 'Lets her dive with Phase Shift/Illusory Orb safety already available.' },
    ],
  },
  {
    heroId: 'pudge',
    confidence: 'curated',
    items: [
      { name: 'Boots of Speed + wards', category: 'starting', reason: 'Map presence for landing Meat Hooks.' },
      { name: 'Blademail', category: 'core', reason: 'Punishes whoever tries to burst him after a hooked pick-off.' },
      { name: 'Aghanim\'s Scepter', category: 'situational', reason: 'A second Rot/hook reach adds a lot of pick-off pressure.' },
    ],
  },
  {
    heroId: 'pugna',
    confidence: 'curated',
    items: [
      { name: 'Null Talisman', category: 'early', reason: 'Mana sustain for Nether Blast spam.' },
      { name: 'Aghanim\'s Scepter', category: 'situational', reason: 'Life Drain becomes a strong teamfight/anti-buyback tool.' },
    ],
  },
  {
    heroId: 'queen-of-pain',
    confidence: 'curated',
    items: [
      { name: 'Null Talisman', category: 'early', reason: 'Mana sustain for early nuke trades.' },
      { name: 'Orchid Malevolence', category: 'core', reason: 'Silences a target while she burns them down — hard to escape.' },
      { name: 'Black King Bar', category: 'situational', reason: 'She is squishy and needs to safely land her combo in a fight.' },
    ],
  },
  {
    heroId: 'rubick',
    confidence: 'curated',
    items: [
      { name: 'Tango + Clarity', category: 'starting', reason: 'Mana sustain to threaten Telekinesis/spell steal often.' },
      { name: 'Aether Lens', category: 'core', reason: 'Extra cast range makes Spell Steal and Telekinesis far safer to use.' },
    ],
  },
  {
    heroId: 'sand-king',
    confidence: 'curated',
    items: [
      { name: 'Boots of Speed + wards', category: 'starting', reason: 'Map presence for burrow-strike ganks.' },
      { name: 'Blink Dagger', category: 'core', reason: 'Reliable Epicenter/Burrowstrike initiation.' },
      { name: 'Aghanim\'s Scepter', category: 'situational', reason: 'Extends Epicenter\'s pulses for much larger fight damage.' },
    ],
  },
  {
    heroId: 'shadow-fiend',
    confidence: 'curated',
    items: [
      { name: 'Wraith Band', category: 'early', reason: 'Cheap stats to reinforce his lane presence.' },
      { name: 'Black King Bar', category: 'core', reason: 'Lets him land Requiem safely in the middle of a fight.' },
      { name: 'Aghanim\'s Scepter', category: 'situational', reason: 'A wider, faster Requiem hits far more of the enemy team.' },
    ],
  },
  {
    heroId: 'silencer',
    confidence: 'curated',
    items: [
      { name: 'Tango + Clarity', category: 'starting', reason: 'Mana sustain to spam Glaives/Curse of the Silent.' },
      { name: 'Aghanim\'s Scepter', category: 'situational', reason: 'Global Silence turns him into a genuine teamfight-deciding ultimate.' },
    ],
  },
  {
    heroId: 'slark',
    confidence: 'curated',
    items: [
      { name: 'Quelling Blade + Branches', category: 'starting', reason: 'Faster farm to reach his core items.' },
      { name: 'Shadow Blade', category: 'core', reason: 'Sets up a pounce onto an isolated target for Essence Shift stacks.' },
      { name: 'Manta Style', category: 'situational', reason: 'Dispels the debuffs that are his main counter-play.' },
    ],
  },
  {
    heroId: 'sniper',
    confidence: 'curated',
    items: [
      { name: 'Slippers of Agility', category: 'starting', reason: 'Cheap agility to snowball right-click damage.' },
      { name: 'Dragon Lance / Falcon Blade', category: 'core', reason: 'Range and stats to stay safe while dealing sustained damage.' },
      { name: 'Black King Bar', category: 'situational', reason: 'He has no escape — needed against any team with a gap-closer.' },
    ],
  },
  {
    heroId: 'spectre',
    confidence: 'curated',
    items: [
      { name: 'Quelling Blade + Branches', category: 'starting', reason: 'Faster farm through her slow early laning phase.' },
      { name: 'Radiance', category: 'core', reason: 'Passive farm and Haunt-enabled global pressure.' },
      { name: 'Black King Bar', category: 'situational', reason: 'Lets her stick to a target through Haunt without dying to focus fire.' },
    ],
  },
  {
    heroId: 'storm-spirit',
    confidence: 'curated',
    items: [
      { name: 'Null Talisman', category: 'early', reason: 'Mana sustain for Ball Lightning mobility spam.' },
      { name: 'Orchid Malevolence / Bloodstone', category: 'core', reason: 'Mana pool and lockdown to secure his pick-offs.' },
      { name: 'Black King Bar', category: 'situational', reason: 'Lets him dive with Ball Lightning without being instantly disabled.' },
    ],
  },
  {
    heroId: 'terrorblade',
    confidence: 'curated',
    items: [
      { name: 'Quelling Blade + Branches', category: 'starting', reason: 'Faster farm to reach his illusion-scaling items.' },
      { name: 'Battle Fury', category: 'core', reason: 'Cleave farm speed feeds directly into his illusions\' damage.' },
      { name: 'Manta Style', category: 'core', reason: 'More illusions plus a dispel — core to his identity.' },
    ],
  },
  {
    heroId: 'tidehunter',
    confidence: 'curated',
    items: [
      { name: 'Boots of Speed + wards', category: 'starting', reason: 'Map presence to set up Ravage.' },
      { name: 'Blink Dagger', category: 'core', reason: 'His entire value hinges on landing Ravage reliably.' },
      { name: 'Aghanim\'s Scepter', category: 'situational', reason: 'A second Kraken Shell proc and more tankiness for the frontline.' },
    ],
  },
  {
    heroId: 'tinker',
    confidence: 'curated',
    items: [
      { name: 'Null Talisman', category: 'early', reason: 'Mana sustain to keep spamming Laser/Rocket resets.' },
      { name: 'Hand of Midas', category: 'core', reason: 'Massively accelerates his gold-hungry item and level timings.' },
      { name: 'Black King Bar', category: 'situational', reason: 'Lets him stand and fight instead of only poking from range.' },
    ],
  },
  {
    heroId: 'weaver',
    confidence: 'curated',
    items: [
      { name: 'Wraith Band', category: 'early', reason: 'Cheap stats while harassing with Shukuchi.' },
      { name: 'Dragon Lance / Diffusal Blade', category: 'core', reason: 'Range/mana burn amplifies his pick-off and kiting pattern.' },
      { name: 'Linken\'s Sphere', category: 'situational', reason: 'Blocks the single-target disable he\'s otherwise very vulnerable to.' },
    ],
  },
  {
    heroId: 'witch-doctor',
    confidence: 'curated',
    items: [
      { name: 'Tango + Clarity', category: 'starting', reason: 'Mana sustain for early Maledict/Paralyzing Cask trades.' },
      { name: 'Aghanim\'s Scepter', category: 'situational', reason: 'A second Death Ward is a massive teamfight damage swing.' },
    ],
  },
  {
    heroId: 'zeus',
    confidence: 'curated',
    items: [
      { name: 'Null Talisman', category: 'early', reason: 'Mana sustain to spam Arc Lightning and poke constantly.' },
      { name: 'Aghanim\'s Scepter', category: 'situational', reason: 'Wards let him track and burst targets across the map.' },
      { name: 'Black King Bar', category: 'situational', reason: 'He is fragile up close and needs it to survive a dive.' },
    ],
  },
];
