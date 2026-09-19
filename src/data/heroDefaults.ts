import type {
  Attribute,
  AttackType,
  CapabilityVector,
  DamageType,
  Role,
  ScalingCurve,
} from '../types/hero';

/**
 * Archetype-based default capability generator.
 *
 * When a hero in the roster does not have hand-curated capability numbers,
 * we derive sensible defaults from its attribute/role/attack-type/scaling
 * archetype. This keeps the heuristic engine well-behaved for the full
 * roster while clearly marking these heroes as "estimated" confidence
 * (see heroes.ts) rather than pretending the numbers are precisely tuned.
 */
export function deriveDefaultCapability(input: {
  attribute: Attribute;
  attackType: AttackType;
  roles: Role[];
  damageType: DamageType;
  scaling: ScalingCurve;
}): CapabilityVector {
  const { attribute, attackType, roles, damageType, scaling } = input;
  const has = (r: Role) => roles.includes(r);

  let control = 1;
  let mobility = 1;
  let tankiness = 1;
  let teamfight = 1;
  let pushing = 1;
  let sustain = 1;
  let burst = 1;
  let aoe = 1;

  if (has('Disabler')) control += 2;
  if (has('Nuker')) burst += 2;
  if (has('Durable')) tankiness += 2;
  if (has('Escape')) mobility += 2;
  if (has('Pusher')) pushing += 2;
  if (has('Initiator')) {
    teamfight += 1;
    control += 1;
  }
  if (has('Carry')) {
    if (scaling === 'Late') burst += 1;
    sustain += 1;
  }
  if (has('Support')) {
    sustain += 1;
    control += 1;
  }
  if (has('Jungler')) pushing += 1;

  if (attribute === 'STR') {
    tankiness += 1;
    sustain += 1;
  }
  if (attribute === 'AGI') {
    burst += 1;
    mobility += 1;
  }
  if (attribute === 'INT') {
    aoe += 1;
    burst += 1;
  }

  if (attackType === 'Ranged') burst += 1;
  else mobility += 0; // no-op, melee default

  if (damageType === 'Magical' || damageType === 'Mixed') aoe += 1;
  if (damageType === 'Pure') burst += 1;

  if (scaling === 'Late') {
    tankiness += 1;
    teamfight += 1;
  }
  if (scaling === 'Early') {
    burst += 1;
  }

  const clamp = (n: number) => Math.max(0, Math.min(3, n));

  return {
    control: clamp(control),
    mobility: clamp(mobility),
    tankiness: clamp(tankiness),
    teamfight: clamp(teamfight),
    pushing: clamp(pushing),
    sustain: clamp(sustain),
    burst: clamp(burst),
    aoe: clamp(aoe),
  };
}
