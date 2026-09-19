import { ALL_HEROES } from '../data/heroes';

const NAME_INDEX = new Map<string, string>();
for (const h of ALL_HEROES) {
  NAME_INDEX.set(normalize(h.localizedName), h.id);
  NAME_INDEX.set(normalize(h.id), h.id);
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function matchHero(token: string): string | undefined {
  const clean = token.trim().replace(/^[-*•\d.)\s]+/, '');
  if (!clean) return undefined;
  const norm = normalize(clean);
  if (NAME_INDEX.has(norm)) return NAME_INDEX.get(norm);
  // fuzzy: substring match against localized names
  const candidates = ALL_HEROES.filter((h) => normalize(h.localizedName).includes(norm) || norm.includes(normalize(h.localizedName)));
  return candidates.length === 1 ? candidates[0].id : undefined;
}

export interface ParsedDraft {
  ally: string[];
  enemy: string[];
  unmatched: string[];
}

const OUR_HEADER = /^(our|ally|my|friendly)\s*team\b|^team\b/i;
const ENEMY_HEADER = /^(enemy|opponent|vs)\s*team\b|^enemy\b|^vs\b/i;

/**
 * Parses a free-form pasted block of text into ally/enemy hero id lists.
 * Understands "OUR TEAM" / "ENEMY TEAM" section headers (English or
 * Russian equivalents handled loosely), one hero per line, optionally
 * bulleted/numbered. Falls back to treating the whole block as ally-only
 * if no section headers are found.
 */
export function parseDraftPaste(text: string): ParsedDraft {
  const lines = text
    .split(/\r?\n|,/)
    .map((l) => l.trim())
    .filter(Boolean);

  const ally: string[] = [];
  const enemy: string[] = [];
  const unmatched: string[] = [];

  let section: 'ally' | 'enemy' | null = null;
  let sawHeader = false;

  for (const line of lines) {
    if (OUR_HEADER.test(line) || /наша|союзн/i.test(line)) {
      section = 'ally';
      sawHeader = true;
      continue;
    }
    if (ENEMY_HEADER.test(line) || /враг|противник/i.test(line)) {
      section = 'enemy';
      sawHeader = true;
      continue;
    }

    const heroId = matchHero(line);
    if (!heroId) {
      unmatched.push(line);
      continue;
    }

    if (!sawHeader) {
      // No headers at all yet — assume ally until we hit 5, then enemy.
      if (ally.length < 5) ally.push(heroId);
      else enemy.push(heroId);
    } else if (section === 'enemy') {
      enemy.push(heroId);
    } else {
      ally.push(heroId);
    }
  }

  return { ally: ally.slice(0, 5), enemy: enemy.slice(0, 5), unmatched };
}
