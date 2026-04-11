import { useState, useCallback } from 'react';
import type { BattlePokemon, BattleMove, BattleLogEntry, TeamMember } from '@/lib/pokemon-types';
import {
  calculateDamage,
  applyStatusEffects,
  getAiMove,
  calculateStat,
  capitalize,
} from '@/lib/battle-engine';
import { fetchPokemonFull, fetchMoveDetails } from '@/lib/pokeapi';

export type TurnState = 'team-select' | 'loading-opponent' | 'waiting' | 'processing' | 'switching' | 'finished';

export interface BattleState {
  playerTeam: BattlePokemon[];
  opponentTeam: BattlePokemon[];
  activePlayerIdx: number;
  activeOppIdx: number;
  battleLog: BattleLogEntry[];
  turnState: TurnState;
  result: 'win' | 'lose' | null;
}

function teamMemberToBattlePokemon(member: TeamMember): BattlePokemon {
  const stats = {
    hp: 0, attack: 0, defense: 0, special_attack: 0, special_defense: 0, speed: 0,
  };
  for (const s of member.stats as any[]) {
    const n = s.name ?? s.stat?.name ?? '';
    const val = s.base_stat ?? 0;
    if (n === 'hp') stats.hp = calculateStat(val, member.level, true);
    else if (n === 'attack') stats.attack = calculateStat(val, member.level);
    else if (n === 'defense') stats.defense = calculateStat(val, member.level);
    else if (n === 'special-attack') stats.special_attack = calculateStat(val, member.level);
    else if (n === 'special-defense') stats.special_defense = calculateStat(val, member.level);
    else if (n === 'speed') stats.speed = calculateStat(val, member.level);
  }

  return {
    id: member.pokemonId,
    name: member.name,
    types: member.types,
    sprite: member.sprite,
    level: member.level,
    stats,
    currentHp: stats.hp,
    moves: member.moves.map(m => ({ ...m })),
    status: null,
    isFainted: false,
  };
}

const GEN1_POKEMON_IDS = [
  4, 7, 25, 39, 52, 54, 58, 63, 66, 74, 79, 92, 95, 98, 102, 109,
  111, 116, 120, 129, 131, 143, 147,
];

export async function generateOpponentTeam(): Promise<BattlePokemon[]> {
  const shuffled = [...GEN1_POKEMON_IDS].sort(() => Math.random() - 0.5);
  const chosen = shuffled.slice(0, 3);

  const team: BattlePokemon[] = await Promise.all(
    chosen.map(async (id) => {
      const full = await fetchPokemonFull(id);

      // Get first 20 moves, enrich them, then pick best 4
      const enriched = await Promise.all(
        full.moves.slice(0, 20).map(async (m) => {
          try {
            const d = await fetchMoveDetails(m.name);
            return { name: m.name, ...d, maxPp: d.pp } as BattleMove;
          } catch {
            return null;
          }
        })
      );

      const validMoves = enriched
        .filter((m): m is BattleMove => m !== null && !!m.power && m.power > 0)
        .slice(0, 4);

      // Pad with Tackle if needed
      while (validMoves.length < 4) {
        validMoves.push({ name: 'tackle', type: 'normal', category: 'physical', power: 40, accuracy: 100, pp: 35, maxPp: 35 });
      }

      const level = 50;
      const stats = {
        hp: 0, attack: 0, defense: 0, special_attack: 0, special_defense: 0, speed: 0,
      };
      for (const s of full.stats) {
        if (s.name === 'hp') stats.hp = calculateStat(s.base_stat, level, true);
        else if (s.name === 'attack') stats.attack = calculateStat(s.base_stat, level);
        else if (s.name === 'defense') stats.defense = calculateStat(s.base_stat, level);
        else if (s.name === 'special-attack') stats.special_attack = calculateStat(s.base_stat, level);
        else if (s.name === 'special-defense') stats.special_defense = calculateStat(s.base_stat, level);
        else if (s.name === 'speed') stats.speed = calculateStat(s.base_stat, level);
      }

      return {
        id: full.id,
        name: full.name,
        types: full.types,
        sprite: full.sprite,
        level,
        stats,
        currentHp: stats.hp,
        moves: validMoves,
        status: null,
        isFainted: false,
      } as BattlePokemon;
    })
  );

  return team;
}

function log(log: BattleLogEntry[], message: string, type: BattleLogEntry['type'] = 'info'): void {
  log.push({ message, type });
}

export function useBattle() {
  const [state, setState] = useState<BattleState>({
    playerTeam: [],
    opponentTeam: [],
    activePlayerIdx: 0,
    activeOppIdx: 0,
    battleLog: [],
    turnState: 'team-select',
    result: null,
  });

  const startBattle = useCallback(async (selectedTeam: TeamMember[]) => {
    setState(s => ({ ...s, turnState: 'loading-opponent' }));

    const playerTeam = selectedTeam.map(teamMemberToBattlePokemon);
    const opponentTeam = await generateOpponentTeam();

    const initialLog: BattleLogEntry[] = [
      { message: 'A wild trainer appeared!', type: 'info' },
      { message: `Go, ${capitalize(playerTeam[0].name)}!`, type: 'switch' },
      { message: `Opponent sends out ${capitalize(opponentTeam[0].name)}!`, type: 'switch' },
    ];

    setState({
      playerTeam,
      opponentTeam,
      activePlayerIdx: 0,
      activeOppIdx: 0,
      battleLog: initialLog,
      turnState: 'waiting',
      result: null,
    });
  }, []);

  const executeTurn = useCallback((moveIdx: number) => {
    setState(prev => {
      if (prev.turnState !== 'waiting') return prev;

      const newLog: BattleLogEntry[] = [...prev.battleLog];
      const playerTeam = prev.playerTeam.map(p => ({ ...p, moves: p.moves.map(m => ({ ...m })) }));
      const opponentTeam = prev.opponentTeam.map(p => ({ ...p, moves: p.moves.map(m => ({ ...m })) }));

      const player = playerTeam[prev.activePlayerIdx];
      const opponent = opponentTeam[prev.activeOppIdx];
      const playerMove = player.moves[moveIdx];
      const aiMove = getAiMove(opponent, player);

      // Determine who goes first by speed
      const playerGoesFirst = player.stats.speed >= opponent.stats.speed;

      const attacker1 = playerGoesFirst ? player : opponent;
      const defender1 = playerGoesFirst ? opponent : player;
      const move1 = playerGoesFirst ? playerMove : aiMove;
      const isPlayer1 = playerGoesFirst;

      const attacker2 = playerGoesFirst ? opponent : player;
      const defender2 = playerGoesFirst ? player : opponent;
      const move2 = playerGoesFirst ? aiMove : playerMove;

      function doAttack(atk: BattlePokemon, def: BattlePokemon, mv: BattleMove, isPlayerAtk: boolean) {
        if (atk.isFainted) return;

        const statusResult = applyStatusEffects(atk);
        statusResult.messages.forEach(m => log(newLog, m, 'status'));
        if (!statusResult.canMove) return;

        log(newLog, `${capitalize(atk.name)} used ${mv.name.replace(/-/g, ' ')}!`, 'info');
        mv.pp = Math.max(0, mv.pp - 1);

        const { damage, effectiveness, isCritical, messages } = calculateDamage(atk, def, mv);
        messages.filter(Boolean).forEach(m => log(newLog, m, effectiveness > 1 ? 'damage' : 'info'));

        if (damage > 0) {
          def.currentHp = Math.max(0, def.currentHp - damage);
          log(newLog, `${capitalize(def.name)} took ${damage} damage!`, 'damage');
        }

        if (def.currentHp === 0) {
          def.isFainted = true;
          log(newLog, `${capitalize(def.name)} fainted!`, 'faint');
        }
      }

      doAttack(attacker1, defender1, move1, isPlayer1);
      if (!defender1.isFainted) {
        doAttack(attacker2, defender2, move2, !isPlayer1);
      }

      // Check win/loss
      const allPlayerFainted = playerTeam.every(p => p.isFainted);
      const allOppFainted = opponentTeam.every(p => p.isFainted);

      if (allPlayerFainted || allOppFainted) {
        const result = allOppFainted ? 'win' : 'lose';
        log(newLog, result === 'win' ? '🎉 You won the battle!' : '😔 You lost the battle...', 'victory');

        // Save battle history
        const token = localStorage.getItem('token');
        if (token) {
          fetch('/api/battles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              opponent_type: 'ai',
              player_team: prev.playerTeam,
              opponent_team: prev.opponentTeam,
              battle_log: newLog,
              result,
            }),
          }).catch(() => {});
        }

        return { ...prev, playerTeam, opponentTeam, battleLog: newLog, turnState: 'finished' as TurnState, result };
      }

      // Auto-switch if active pokemon fainted
      let nextPlayerIdx = prev.activePlayerIdx;
      let nextOppIdx = prev.activeOppIdx;
      let needsSwitch = false;

      if (playerTeam[prev.activePlayerIdx].isFainted) {
        const next = playerTeam.findIndex((p, i) => !p.isFainted && i !== prev.activePlayerIdx);
        if (next !== -1) {
          needsSwitch = true;
          nextPlayerIdx = next;
          log(newLog, `Go, ${capitalize(playerTeam[next].name)}!`, 'switch');
        }
      }

      if (opponentTeam[prev.activeOppIdx].isFainted) {
        const next = opponentTeam.findIndex((p, i) => !p.isFainted && i !== prev.activeOppIdx);
        if (next !== -1) {
          nextOppIdx = next;
          log(newLog, `Opponent sends out ${capitalize(opponentTeam[next].name)}!`, 'switch');
        }
      }

      return {
        ...prev,
        playerTeam,
        opponentTeam,
        activePlayerIdx: nextPlayerIdx,
        activeOppIdx: nextOppIdx,
        battleLog: newLog,
        turnState: needsSwitch ? 'switching' : 'waiting' as TurnState,
        result: null,
      };
    });
  }, []);

  const switchPokemon = useCallback((idx: number) => {
    setState(prev => {
      if (prev.playerTeam[idx].isFainted || idx === prev.activePlayerIdx) return prev;
      const newLog: BattleLogEntry[] = [...prev.battleLog];
      log(newLog, `Come back, ${capitalize(prev.playerTeam[prev.activePlayerIdx].name)}!`, 'switch');
      log(newLog, `Go, ${capitalize(prev.playerTeam[idx].name)}!`, 'switch');
      return { ...prev, activePlayerIdx: idx, battleLog: newLog, turnState: 'waiting' };
    });
  }, []);

  const resetBattle = useCallback(() => {
    setState({
      playerTeam: [], opponentTeam: [], activePlayerIdx: 0, activeOppIdx: 0,
      battleLog: [], turnState: 'team-select', result: null,
    });
  }, []);

  return { state, startBattle, executeTurn, switchPokemon, resetBattle };
}
