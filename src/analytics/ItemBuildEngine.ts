import type { Hero } from '../types/hero';
import type { HeroItemBuild, ItemRecommendation } from '../types/itemBuild';
import { getItemBuild } from '../data/itemBuilds';

/**
 * Level-1 data engine for item advice. Starts from the hero's base
 * (curated or estimated) item path and layers transparent, rule-based
 * situational items on top, tied to the *actual current enemy draft* —
 * the same "explain from real, inspectable properties" approach used by
 * CounterEngine/RoleAnalyzer, never a fabricated "meta build".
 *
 * Situational items added here are additive on top of the base build and
 * always carry a reason naming the enemy hero(es) that triggered them, so
 * the advice stays inspectable rather than feeling like a black box.
 */
export class ItemBuildEngine {
  /** Full build for `hero`, with situational items appended based on `enemyTeam`. */
  buildFor(hero: Hero, enemyTeam: Hero[]): HeroItemBuild {
    const base = getItemBuild(hero);
    const situational = this.situationalItems(hero, enemyTeam);

    // De-duplicate against anything the base build already recommends.
    const existingNames = new Set(base.items.map((i) => i.name));
    const extra = situational.filter((i) => !existingNames.has(i.name));

    if (extra.length === 0) return base;
    return {
      ...base,
      items: [...base.items, ...extra],
    };
  }

  private situationalItems(hero: Hero, enemyTeam: Hero[]): ItemRecommendation[] {
    if (enemyTeam.length === 0) return [];
    const hasTag = (h: Hero, t: string) => h.tags.includes(t as never);
    const items: ItemRecommendation[] = [];

    // Heavy enemy disable/control → Black King Bar.
    const controlHeavy = enemyTeam.filter((e) => e.capability.control >= 2);
    if (controlHeavy.length >= 2 && hero.capability.tankiness < 3) {
      items.push({
        name: 'Black King Bar',
        category: 'situational',
        reason: `${controlHeavy.map((h) => h.localizedName).join(' and ')} bring heavy disable — spell immunity lets you act in a fight.`,
      });
    }

    // Heavy physical damage / crit carries → armor.
    const physicalThreats = enemyTeam.filter((e) => e.damageType === 'Physical' && e.capability.burst >= 2);
    if (physicalThreats.length >= 1) {
      items.push({
        name: 'Assault Cuirass / Shiva\'s Guard',
        category: 'situational',
        reason: `${physicalThreats.map((h) => h.localizedName).join(', ')} deal heavy physical damage — armor reduces it directly.`,
      });
    }

    // Evasion on the enemy team → true strike (MKB).
    const evasive = enemyTeam.filter((e) => hasTag(e, 'evasion'));
    if (evasive.length >= 1) {
      items.push({
        name: 'Monkey King Bar',
        category: 'situational',
        reason: `${evasive.map((h) => h.localizedName).join(', ')} relies on evasion — true strike guarantees your hits land.`,
      });
    }

    // Illusion-based enemy heroes → cleave / illusion clear.
    const illusionHeroes = enemyTeam.filter((e) => hasTag(e, 'illusions'));
    if (illusionHeroes.length >= 1 && hero.capability.aoe < 2) {
      items.push({
        name: 'Battle Fury / AoE damage',
        category: 'situational',
        reason: `${illusionHeroes.map((h) => h.localizedName).join(', ')} fights with illusions — splash damage clears them fast.`,
      });
    }

    // Invisibility on the enemy team → detection.
    const invisHeroes = enemyTeam.filter((e) => hasTag(e, 'invisibility'));
    if (invisHeroes.length >= 1) {
      items.push({
        name: 'Sentry Wards / Gem of True Sight',
        category: 'situational',
        reason: `${invisHeroes.map((h) => h.localizedName).join(', ')} can go invisible — vision denies their pick-off angle.`,
      });
    }

    // Heavy magical burst → BKB or Aeon-style disc if hero is a squishy support.
    const magicalBurst = enemyTeam.filter((e) => e.damageType === 'Magical' && e.capability.burst >= 2);
    if (magicalBurst.length >= 2) {
      items.push({
        name: 'Black King Bar / Aeon Disk',
        category: 'situational',
        reason: `${magicalBurst.map((h) => h.localizedName).join(', ')} can burst you down with spells — spell immunity or a save item buys time.`,
      });
    }

    // Healing-heavy enemy team → break/healing reduction.
    const healers = enemyTeam.filter((e) => hasTag(e, 'healer') || e.capability.sustain >= 2);
    if (healers.length >= 2) {
      items.push({
        name: 'Silver Edge / Nullifier (break effect)',
        category: 'situational',
        reason: `${healers.map((h) => h.localizedName).join(', ')} bring a lot of sustain — a break effect stops their healing/passives.`,
      });
    }

    // Enemy summons-heavy team → AoE clear.
    const summoners = enemyTeam.filter((e) => hasTag(e, 'summons'));
    if (summoners.length >= 1 && hero.capability.aoe < 2) {
      items.push({
        name: 'Area damage item (e.g. Shiva\'s Guard)',
        category: 'situational',
        reason: `${summoners.map((h) => h.localizedName).join(', ')} relies on summoned units — AoE damage clears them efficiently.`,
      });
    }

    return items.slice(0, 4); // keep the situational list focused, not overwhelming
  }
}

export const itemBuildEngine = new ItemBuildEngine();
