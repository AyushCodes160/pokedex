import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TypeBadge } from '@/components/TypeBadge';
import { fetchPokemonBasic, fetchPokemonFull, fetchMoveDetails } from '@/lib/pokeapi';
import { calculateDamage, applyStatusEffects, getAiMove, calculateStat, capitalize } from '@/lib/battle-engine';
import type { BattlePokemon, BattleMove, BattleLogEntry } from '@/lib/pokemon-types';

function buildBattlePokemon(data: any, moves: BattleMove[], level: number): BattlePokemon {
  const stats = {
    hp: calculateStat(data.stats.find((s: any) => s.name === 'hp')?.base_stat || 50, level, true),
    attack: calculateStat(data.stats.find((s: any) => s.name === 'attack')?.base_stat || 50, level),
    defense: calculateStat(data.stats.find((s: any) => s.name === 'defense')?.base_stat || 50, level),
    special_attack: calculateStat(data.stats.find((s: any) => s.name === 'special-attack')?.base_stat || 50, level),
    special_defense: calculateStat(data.stats.find((s: any) => s.name === 'special-defense')?.base_stat || 50, level),
    speed: calculateStat(data.stats.find((s: any) => s.name === 'speed')?.base_stat || 50, level),
  };
  return {
    id: data.id,
    name: data.name,
    types: data.types,
    sprite: data.sprite || data.artwork,
    level,
    stats,
    currentHp: stats.hp,
    moves,
    status: null,
    isFainted: false,
  };
}

export default function Battle() {
  const [phase, setPhase] = useState<'setup' | 'battle' | 'victory'>('setup');
  const [player, setPlayer] = useState<BattlePokemon | null>(null);
  const [opponent, setOpponent] = useState<BattlePokemon | null>(null);
  const [log, setLog] = useState<BattleLogEntry[]>([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winner, setWinner] = useState<'player' | 'opponent' | null>(null);
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string, type: BattleLogEntry['type'] = 'info') => {
    setLog(prev => [...prev, { message, type }]);
  };

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [log]);

  const startQuickBattle = async () => {
    setLoading(true);
    try {
      // Random player and opponent
      const playerId = Math.floor(Math.random() * 151) + 1;
      const oppId = Math.floor(Math.random() * 151) + 1;
      const [pFull, oFull] = await Promise.all([fetchPokemonFull(playerId), fetchPokemonFull(oppId)]);

      // Get 4 random damaging moves for each
      const getMoves = async (pokemon: any): Promise<BattleMove[]> => {
        const moveNames = pokemon.moves.slice(0, 20).map((m: any) => m.name);
        const enriched: BattleMove[] = [];
        for (const name of moveNames) {
          if (enriched.length >= 8) break;
          try {
            const d = await fetchMoveDetails(name);
            if (d.power && d.power > 0) {
              enriched.push({ name, ...d, maxPp: d.pp });
            }
          } catch { }
        }
        // Pick 4 or pad with Tackle
        const selected = enriched.slice(0, 4);
        while (selected.length < 4) {
          selected.push({ name: 'tackle', type: 'normal', category: 'physical', power: 40, accuracy: 100, pp: 35, maxPp: 35 });
        }
        return selected;
      };

      const [pMoves, oMoves] = await Promise.all([getMoves(pFull), getMoves(oFull)]);

      const pData = { ...pFull, stats: pFull.stats.map(s => ({ name: s.name.replace('special-attack', 'special-attack').replace('special-defense', 'special-defense'), base_stat: s.base_stat })) };
      const oData = { ...oFull, stats: oFull.stats.map(s => ({ name: s.name, base_stat: s.base_stat })) };

      const p = buildBattlePokemon(pData, pMoves, 50);
      const o = buildBattlePokemon(oData, oMoves, 50);

      setPlayer(p);
      setOpponent(o);
      setLog([]);
      setWinner(null);
      addLog(`A wild ${capitalize(o.name)} appeared!`);
      addLog(`Go, ${capitalize(p.name)}!`);

      // Speed determines first turn
      setIsPlayerTurn(p.stats.speed >= o.stats.speed);
      setPhase('battle');
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const executeMove = async (move: BattleMove) => {
    if (!player || !opponent || animating || !isPlayerTurn) return;
    setAnimating(true);

    // Reduce PP
    move.pp--;

    // Player status check
    const pStatus = applyStatusEffects(player);
    pStatus.messages.forEach(m => addLog(m, 'status'));
    if (player.currentHp <= 0) { handleFaint('player'); setAnimating(false); return; }

    if (pStatus.canMove) {
      addLog(`${capitalize(player.name)} used ${capitalize(move.name.replace('-', ' '))}!`, 'info');
      const result = calculateDamage(player, opponent, move);
      opponent.currentHp = Math.max(0, opponent.currentHp - result.damage);
      result.messages.forEach(m => { if (m) addLog(m, result.effectiveness > 1 ? 'damage' : 'info'); });
      if (result.damage > 0) addLog(`${capitalize(opponent.name)} took ${result.damage} damage!`, 'damage');

      setOpponent({ ...opponent });

      if (opponent.currentHp <= 0) {
        handleFaint('opponent');
        setAnimating(false);
        return;
      }
    }

    // Opponent turn
    await new Promise(r => setTimeout(r, 800));

    const oStatus = applyStatusEffects(opponent);
    oStatus.messages.forEach(m => addLog(m, 'status'));
    if (opponent.currentHp <= 0) { handleFaint('opponent'); setAnimating(false); return; }

    if (oStatus.canMove) {
      const aiMove = getAiMove(opponent, player);
      aiMove.pp--;
      addLog(`${capitalize(opponent.name)} used ${capitalize(aiMove.name.replace('-', ' '))}!`, 'info');
      const aiResult = calculateDamage(opponent, player, aiMove);
      player.currentHp = Math.max(0, player.currentHp - aiResult.damage);
      aiResult.messages.forEach(m => { if (m) addLog(m, aiResult.effectiveness > 1 ? 'damage' : 'info'); });
      if (aiResult.damage > 0) addLog(`${capitalize(player.name)} took ${aiResult.damage} damage!`, 'damage');

      setPlayer({ ...player });

      if (player.currentHp <= 0) {
        handleFaint('player');
        setAnimating(false);
        return;
      }
    }

    setAnimating(false);
  };

  const saveBattleResult = async (result: 'win' | 'loss', p: BattlePokemon, o: BattlePokemon) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await fetch('/api/battles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          opponent_type: 'Wild ' + o.name,
          player_team: p,
          opponent_team: o,
          battle_log: log,
          result
        })
      });
    } catch (e) {
      console.error("Failed to save battle", e);
    }
  };

  const handleFaint = (who: 'player' | 'opponent') => {
    const w = who === 'player' ? 'opponent' : 'player';
    const fainted = who === 'player' ? player : opponent;
    addLog(`${capitalize(fainted!.name)} fainted!`, 'faint');
    setWinner(w);
    setPhase('victory');
    addLog(`${w === 'player' ? 'You' : 'Opponent'} won the battle!`, 'victory');

    // Save result
    if (player && opponent) {
      saveBattleResult(w === 'player' ? 'win' : 'loss', player, opponent);
    }
  };

  const hpPercent = (current: number, max: number) => Math.max(0, (current / max) * 100);
  const hpColor = (pct: number) => pct > 50 ? 'bg-green-500' : pct > 20 ? 'bg-yellow-500' : 'bg-red-500';

  // Setup screen
  if (phase === 'setup') {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <Swords className="mx-auto mb-4 h-16 w-16 text-primary" />
          <h1 className="mb-2 font-display text-4xl font-black tracking-wider">BATTLE ARENA</h1>
          <p className="mb-8 text-muted-foreground">Choose your battle mode</p>

          {/* Coming Soon Notice */}
          <div className="mb-6 rounded-lg border-2 border-yellow-500/50 bg-yellow-500/10 p-4 text-center">
            <p className="font-bold text-yellow-500">⚠️ COMING SOON</p>
            <p className="text-sm text-muted-foreground mt-1">
              With some problems we are facing and we will fix it soon and this feature will be available sooon.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button size="lg" onClick={startQuickBattle} disabled={loading} className="font-display">
              {loading ? 'Preparing...' : '⚡ Quick Battle (Random 1v1)'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Build a team in the Team Builder for custom battles
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Battle screen
  return (
    <div className="flex min-h-[80vh] flex-col">
      {/* Battle field - GBA style */}
      <div className="relative flex-1 overflow-hidden border-b-4 border-border bg-gradient-to-b from-secondary via-secondary to-background p-4">
        {/* Opponent */}
        {opponent && (
          <div className="mb-8 flex items-start justify-between md:px-12">
            <div className="rounded-lg border-2 border-border bg-card/90 px-4 py-2 font-pixel">
              <p className="text-xs font-bold capitalize">{opponent.name}</p>
              <p className="text-[10px] text-muted-foreground">Lv{opponent.level}</p>
              <div className="mt-1 h-2 w-32 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className={`h-full ${hpColor(hpPercent(opponent.currentHp, opponent.stats.hp))}`}
                  animate={{ width: `${hpPercent(opponent.currentHp, opponent.stats.hp)}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="mt-0.5 text-right text-[8px] text-muted-foreground">
                {opponent.currentHp}/{opponent.stats.hp}
              </p>
            </div>
            <motion.img
              src={opponent.sprite}
              alt={opponent.name}
              className="h-32 w-32 object-contain md:h-40 md:w-40"
              animate={animating ? { x: [0, -5, 5, 0] } : {}}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}

        {/* Player */}
        {player && (
          <div className="flex items-end justify-between md:px-12">
            <motion.img
              src={player.sprite}
              alt={player.name}
              className="h-32 w-32 object-contain md:h-40 md:w-40"
              animate={animating ? { x: [0, 5, -5, 0] } : {}}
              transition={{ duration: 0.3 }}
            />
            <div className="rounded-lg border-2 border-border bg-card/90 px-4 py-2 font-pixel">
              <p className="text-xs font-bold capitalize">{player.name}</p>
              <p className="text-[10px] text-muted-foreground">Lv{player.level}</p>
              <div className="mt-1 h-2 w-32 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className={`h-full ${hpColor(hpPercent(player.currentHp, player.stats.hp))}`}
                  animate={{ width: `${hpPercent(player.currentHp, player.stats.hp)}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="mt-0.5 text-right text-[8px] text-muted-foreground">
                {player.currentHp}/{player.stats.hp}
              </p>
            </div>
          </div>
        )}

        {/* Victory overlay */}
        <AnimatePresence>
          {phase === 'victory' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            >
              <div className="text-center">
                <h2 className="mb-2 font-pixel text-2xl text-primary">
                  {winner === 'player' ? 'YOU WIN!' : 'YOU LOSE!'}
                </h2>
                <Button onClick={() => { setPhase('setup'); setLog([]); }} className="font-pixel text-xs">
                  <RotateCcw className="mr-2 h-4 w-4" /> Battle Again
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom panel */}
      <div className="border-t-2 border-border bg-card">
        {/* Battle log */}
        <div ref={logRef} className="h-20 overflow-y-auto border-b border-border px-4 py-2 font-pixel text-[10px] leading-relaxed md:text-xs">
          {log.map((entry, i) => (
            <p
              key={i}
              className={
                entry.type === 'damage' ? 'text-primary' :
                  entry.type === 'faint' ? 'text-destructive' :
                    entry.type === 'victory' ? 'text-accent' :
                      entry.type === 'status' ? 'text-purple-400' :
                        'text-foreground'
              }
            >
              {entry.message}
            </p>
          ))}
        </div>

        {/* Move buttons */}
        {phase === 'battle' && player && (
          <div className="grid grid-cols-2 gap-2 p-3">
            {player.moves.map(move => (
              <button
                key={move.name}
                onClick={() => executeMove(move)}
                disabled={animating || phase !== 'battle' || move.pp <= 0}
                className="flex items-center justify-between rounded-lg border-2 border-border bg-secondary px-3 py-2 text-left transition-colors hover:border-primary disabled:opacity-40"
              >
                <div>
                  <p className="font-pixel text-[10px] capitalize">{move.name.replace('-', ' ')}</p>
                  <TypeBadge type={move.type} size="sm" />
                </div>
                <span className="font-pixel text-[8px] text-muted-foreground">
                  {move.pp}/{move.maxPp}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
