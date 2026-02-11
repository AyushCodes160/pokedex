import type { BattlePokemon, BattleMove, BattleLogEntry, StatusCondition } from './pokemon-types';
import { getEffectiveness } from './type-effectiveness';

export function calculateStat(baseStat: number, level: number, isHp = false): number {
  const iv = 15; // simplified
  const ev = 0;
  if (isHp) {
    return Math.floor(((2 * baseStat + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
  }
  return Math.floor(((2 * baseStat + iv + Math.floor(ev / 4)) * level) / 100) + 5;
}

export function calculateDamage(
  attacker: BattlePokemon,
  defender: BattlePokemon,
  move: BattleMove
): { damage: number; effectiveness: number; isCritical: boolean; messages: string[] } {
  const messages: string[] = [];

  if (!move.power || move.category === 'status') {
    return { damage: 0, effectiveness: 1, isCritical: false, messages: ['But nothing happened!'] };
  }

  // Accuracy check
  if (move.accuracy && Math.random() * 100 > move.accuracy) {
    return { damage: 0, effectiveness: 1, isCritical: false, messages: [`${capitalize(attacker.name)}'s attack missed!`] };
  }

  const level = attacker.level;
  const isPhysical = move.category === 'physical';
  const atk = isPhysical ? attacker.stats.attack : attacker.stats.special_attack;
  const def = isPhysical ? defender.stats.defense : defender.stats.special_defense;

  // Base damage formula
  let damage = Math.floor(((2 * level / 5 + 2) * move.power * atk / def) / 50 + 2);

  // STAB
  const stab = attacker.types.includes(move.type) ? 1.5 : 1;
  if (stab > 1) messages.push('');
  damage = Math.floor(damage * stab);

  // Type effectiveness
  const effectiveness = getEffectiveness(move.type, defender.types);
  damage = Math.floor(damage * effectiveness);

  if (effectiveness > 1) messages.push("It's super effective!");
  else if (effectiveness < 1 && effectiveness > 0) messages.push("It's not very effective...");
  else if (effectiveness === 0) {
    messages.push(`It doesn't affect ${capitalize(defender.name)}...`);
    return { damage: 0, effectiveness, isCritical: false, messages };
  }

  // Critical hit (1/16 chance)
  const isCritical = Math.random() < 1 / 16;
  if (isCritical) {
    damage = Math.floor(damage * 1.5);
    messages.push('A critical hit!');
  }

  // Random factor (0.85 - 1.00)
  const random = 0.85 + Math.random() * 0.15;
  damage = Math.max(1, Math.floor(damage * random));

  // Burn halves physical damage
  if (attacker.status === 'burn' && isPhysical) {
    damage = Math.floor(damage / 2);
  }

  return { damage, effectiveness, isCritical, messages };
}

export function applyStatusEffects(pokemon: BattlePokemon): { canMove: boolean; messages: string[] } {
  const messages: string[] = [];

  if (!pokemon.status) return { canMove: true, messages };

  switch (pokemon.status) {
    case 'paralysis':
      if (Math.random() < 0.25) {
        messages.push(`${capitalize(pokemon.name)} is paralyzed! It can't move!`);
        return { canMove: false, messages };
      }
      break;
    case 'sleep':
      if (Math.random() < 0.33) {
        pokemon.status = null;
        messages.push(`${capitalize(pokemon.name)} woke up!`);
      } else {
        messages.push(`${capitalize(pokemon.name)} is fast asleep.`);
        return { canMove: false, messages };
      }
      break;
    case 'freeze':
      if (Math.random() < 0.2) {
        pokemon.status = null;
        messages.push(`${capitalize(pokemon.name)} thawed out!`);
      } else {
        messages.push(`${capitalize(pokemon.name)} is frozen solid!`);
        return { canMove: false, messages };
      }
      break;
    case 'burn':
      const burnDmg = Math.max(1, Math.floor(pokemon.stats.hp / 16));
      pokemon.currentHp = Math.max(0, pokemon.currentHp - burnDmg);
      messages.push(`${capitalize(pokemon.name)} is hurt by its burn!`);
      break;
    case 'poison':
      const poisonDmg = Math.max(1, Math.floor(pokemon.stats.hp / 8));
      pokemon.currentHp = Math.max(0, pokemon.currentHp - poisonDmg);
      messages.push(`${capitalize(pokemon.name)} is hurt by poison!`);
      break;
  }

  return { canMove: true, messages };
}

export function getAiMove(ai: BattlePokemon, player: BattlePokemon): BattleMove {
  const availableMoves = ai.moves.filter(m => m.pp > 0);
  if (availableMoves.length === 0) {
    return { name: 'Struggle', type: 'normal', category: 'physical', power: 50, accuracy: 100, pp: 999, maxPp: 999 };
  }

  // Prioritize super-effective moves with power
  const scoredMoves = availableMoves.map(move => {
    let score = move.power || 0;
    const eff = getEffectiveness(move.type, player.types);
    score *= eff;
    if (ai.types.includes(move.type)) score *= 1.5; // STAB
    return { move, score };
  });

  scoredMoves.sort((a, b) => b.score - a.score);

  // Some randomness: 70% best move, 30% random
  if (Math.random() < 0.7 && scoredMoves[0].score > 0) {
    return scoredMoves[0].move;
  }
  return availableMoves[Math.floor(Math.random() * availableMoves.length)];
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
