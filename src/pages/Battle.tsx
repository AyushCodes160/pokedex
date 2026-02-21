import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, RotateCcw, Loader2 } from 'lucide-react';
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
  const [arenaTheme, setArenaTheme] = useState({ primary: 'rgba(59, 130, 246, 0.5)', background: 'from-blue-600/20 via-slate-900 to-black' });
  const [savedTeams, setSavedTeams] = useState<any[]>([]);
  const [damagePopup, setDamagePopup] = useState<{ value: number, effectiveness: number, side: 'player' | 'opponent' } | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string, type: BattleLogEntry['type'] = 'info') => {
    setLog(prev => [...prev, { message, type }]);
  };

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [log]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/teams', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setSavedTeams(data))
        .catch(err => console.error("Failed to fetch teams", err));
    }
  }, []);

  const updateTheme = (p: BattlePokemon, o: BattlePokemon) => {
    const type = p.types[0];
    const themes: Record<string, { primary: string, background: string }> = {
      fire: { primary: 'rgba(239, 68, 68, 0.5)', background: 'from-red-600/20 via-slate-950 to-black' },
      water: { primary: 'rgba(59, 130, 246, 0.5)', background: 'from-blue-600/20 via-cyan-950 to-black' },
      grass: { primary: 'rgba(16, 185, 129, 0.5)', background: 'from-emerald-600/20 via-slate-950 to-black' },
      electric: { primary: 'rgba(245, 158, 11, 0.5)', background: 'from-amber-500/20 via-slate-950 to-black' },
      psychic: { primary: 'rgba(236, 72, 153, 0.5)', background: 'from-pink-600/20 via-purple-950 to-black' },
      dark: { primary: 'rgba(75, 85, 99, 0.5)', background: 'from-slate-800/20 via-slate-950 to-black' },
      ghost: { primary: 'rgba(139, 92, 246, 0.5)', background: 'from-violet-900/40 via-slate-950 to-black' },
      ice: { primary: 'rgba(6, 182, 212, 0.5)', background: 'from-cyan-400/20 via-slate-900 to-black' },
    };
    setArenaTheme(themes[type] || { primary: 'rgba(59, 130, 246, 0.5)', background: 'from-blue-600/20 via-slate-950 to-black' });
  };

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
      updateTheme(p, o);
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

      if (result.damage > 0) {
        setDamagePopup({ value: result.damage, effectiveness: result.effectiveness, side: 'opponent' });
        setTimeout(() => setDamagePopup(null), 1000);
      }

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

      if (aiResult.damage > 0) {
        setDamagePopup({ value: aiResult.damage, effectiveness: aiResult.effectiveness, side: 'player' });
        setTimeout(() => setDamagePopup(null), 1000);
      }

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

  // Victory screen overlay
  const VictoryOverlay = () => (
    <AnimatePresence>
      {phase === 'victory' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <div className="mb-4 inline-block rounded-full bg-primary/20 p-4 ring-2 ring-primary">
              <Swords className="h-12 w-12 text-primary" />
            </div>
            <h2 className="mb-2 font-display text-5xl font-black tracking-tighter text-white">
              {winner === 'player' ? 'VICTORY' : 'DEFEATED'}
            </h2>
            <p className="mb-6 text-slate-300">
              {winner === 'player' ? 'You have emerged at the peak!' : 'The battle was fierce, but you fell.'}
            </p>
            <Button size="lg" onClick={() => { setPhase('setup'); setLog([]); }} className="font-display shadow-lg shadow-primary/20">
              <RotateCcw className="mr-2 h-5 w-5" /> RE-ENTER ARENA
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Health Bar Component
  const HealthBar = ({ pokemon, side }: { pokemon: BattlePokemon, side: 'player' | 'opponent' }) => (
    <div className={`relative flex flex-col ${side === 'player' ? 'items-end' : 'items-start'}`}>
      <div className="group relative z-10 w-48 sm:w-64 overflow-hidden rounded-xl border border-white/20 bg-white/5 p-3 sm:p-4 backdrop-blur-xl transition-all hover:border-white/40 hover:bg-white/10">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2 text-white">
          <span className="font-display text-xs sm:text-sm font-bold uppercase tracking-wider">{pokemon.name}</span>
          <span className="font-display text-[10px] sm:text-xs font-medium text-slate-400">LVL {pokemon.level}</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800/50 p-[2px]">
          <motion.div
            className={`h-full rounded-full ${hpColor(hpPercent(pokemon.currentHp, pokemon.stats.hp))}`}
            animate={{ width: `${hpPercent(pokemon.currentHp, pokemon.stats.hp)}%` }}
            transition={{ type: 'spring', stiffness: 50 }}
          />
        </div>
        <div className="mt-2 flex justify-between items-center">
          <div className="flex gap-1">
            {pokemon.types.map(t => <TypeBadge key={t} type={t} size="sm" />)}
          </div>
          <span className="font-mono text-[10px] text-slate-300">
            {pokemon.currentHp.toFixed(0)} / {pokemon.stats.hp}
          </span>
        </div>
      </div>
      {/* Decorative pulse element */}
      <div className={`absolute -bottom-1 h-1 w-2/3 bg-gradient-to-r from-transparent via-primary/50 to-transparent blur-sm opacity-0 group-hover:opacity-100 transition-opacity`} />
    </div>
  );

  // Damage Popup Component
  const DamagePopup = ({ value, effectiveness, side }: { value: number, effectiveness: number, side: 'player' | 'opponent' }) => (
    <motion.div
      initial={{ y: 0, opacity: 0, scale: 0.5 }}
      animate={{ y: -100, opacity: 1, scale: [1, 1.5, 1.2] }}
      className={`absolute z-30 font-display text-4xl font-black italic tracking-tighter ${effectiveness > 1 ? 'text-yellow-400' : effectiveness < 1 ? 'text-slate-400' : 'text-white'} drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]`}
      style={{ left: side === 'player' ? '25%' : '75%', top: '40%' }}
    >
      -{value}
      {effectiveness > 1 && <span className="block text-xs font-bold uppercase tracking-widest text-yellow-500">SUPER EFFECTIVE</span>}
      {effectiveness < 1 && effectiveness > 0 && <span className="block text-xs font-bold uppercase tracking-widest text-slate-500">NOT VERY EFFECTIVE</span>}
    </motion.div>
  );

  if (phase === 'setup') {
    return (
      <div className="relative flex min-h-[80vh] items-center justify-center overflow-hidden bg-slate-950 px-4">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-purple-600/10 blur-[120px]" />
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative z-10 w-full max-w-lg text-center"
        >
          <div className="mb-8 inline-block rounded-3xl bg-primary/20 p-6 ring-1 ring-primary/50 shadow-2xl shadow-primary/20">
            <Swords className="h-16 w-16 text-primary" />
          </div>
          <h1 className="mb-2 font-display text-6xl font-black italic tracking-tighter text-white">APEX ARENA</h1>
          <p className="mb-10 text-slate-400">Master the battlefield. Claim your glory.</p>

          <div className="space-y-4">
            <Button
              size="lg"
              onClick={startQuickBattle}
              disabled={loading}
              className="h-16 w-full font-display text-xl transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-primary/20"
            >
              {loading ? (
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              ) : (
                <>⚡ QUICK STRIKE</>
              )}
            </Button>

            {savedTeams.length > 0 && (
              <div className="grid grid-cols-1 gap-2">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 text-left mb-1">SELECT YOUR TEAM</p>
                {savedTeams.map((team) => (
                  <button
                    key={team.id}
                    onClick={async () => {
                      setLoading(true);
                      const oppId = Math.floor(Math.random() * 151) + 1;
                      const oFull = await fetchPokemonFull(oppId);
                      const oMoves = await (async (pokemon: any) => {
                        const moveNames = pokemon.moves.slice(0, 20).map((m: any) => m.name);
                        const enriched: BattleMove[] = [];
                        for (const name of moveNames) {
                          if (enriched.length >= 8) break;
                          try {
                            const d = await fetchMoveDetails(name);
                            if (d.power && d.power > 0) enriched.push({ name, ...d, maxPp: d.pp });
                          } catch { }
                        }
                        const selected = enriched.slice(0, 4);
                        while (selected.length < 4) selected.push({ name: 'tackle', type: 'normal', category: 'physical', power: 40, accuracy: 100, pp: 35, maxPp: 35 });
                        return selected;
                      })(oFull);

                      const playerMember = team.team_data[0];
                      const p = {
                        ...playerMember,
                        id: playerMember.pokemonId,
                        currentHp: playerMember.stats.find((s: any) => s.name === 'hp')?.base_stat || 100, // This is simplified, should use calculateStat but for now...
                        stats: {
                          hp: calculateStat(playerMember.stats.find((s: any) => s.name === 'hp')?.base_stat || 50, playerMember.level, true),
                          attack: calculateStat(playerMember.stats.find((s: any) => s.name === 'attack')?.base_stat || 50, playerMember.level),
                          defense: calculateStat(playerMember.stats.find((s: any) => s.name === 'defense')?.base_stat || 50, playerMember.level),
                          special_attack: calculateStat(playerMember.stats.find((s: any) => s.name.includes('special-attack'))?.base_stat || 50, playerMember.level),
                          special_defense: calculateStat(playerMember.stats.find((s: any) => s.name.includes('special-defense'))?.base_stat || 50, playerMember.level),
                          speed: calculateStat(playerMember.stats.find((s: any) => s.name === 'speed')?.base_stat || 50, playerMember.level),
                        },
                        status: null,
                        isFainted: false
                      };
                      p.currentHp = p.stats.hp;

                      const o = buildBattlePokemon(oFull, oMoves, 50);
                      setPlayer(p as any);
                      setOpponent(o);
                      updateTheme(p as any, o);
                      setLog([]);
                      setWinner(null);
                      addLog(`Battling with team: ${team.name}`);
                      addLog(`A wild ${capitalize(o.name)} appeared!`);
                      setIsPlayerTurn(p.stats.speed >= o.stats.speed);
                      setPhase('battle');
                      setLoading(false);
                    }}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-left transition-all hover:border-primary/50 hover:bg-white/10"
                  >
                    <div>
                      <p className="font-display text-sm font-bold text-white tracking-wide uppercase">{team.name}</p>
                      <p className="text-[10px] text-slate-500">6 POKEMON // LEVEL 50</p>
                    </div>
                    <div className="flex -space-x-3">
                      {team.team_data.slice(0, 3).map((m: any, idx: number) => (
                        <img key={idx} src={m.sprite} alt="" className="h-8 w-8 rounded-full border border-slate-800 bg-slate-900 object-contain" />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm">
              <p className="text-sm text-slate-400">
                <span className="text-primary font-bold">PRO TIP:</span> Build your perfect squad in the Team Builder for specialized combat.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[90vh] flex-col overflow-hidden bg-slate-950 font-sans selection:bg-primary selection:text-white">
      {/* Cinematic Battle Ground */}
      <div className={`relative flex-1 overflow-hidden transition-all duration-1000 bg-gradient-to-br ${arenaTheme.background}`}>

        {/* Dynamic Fog/Particles */}
        <div className="pointer-events-none absolute inset-0 z-10 opacity-30">
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
        </div>

        {/* 3D Perspective Stage */}
        <div className="absolute inset-0 flex items-center justify-center [perspective:1400px]">
          <div className="relative h-full w-full max-w-6xl [transform-style:preserve-3d]">

            {/* The Floor */}
            <div
              className="absolute left-1/2 top-1/2 h-[500px] w-[800px] sm:h-[800px] sm:w-[1200px] -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white/10 bg-gradient-radial from-white/10 to-transparent [transform:rotateX(70deg)_translateZ(-200px)]"
            >
              <div className="absolute inset-0 animate-pulse bg-gradient-radial from-primary/10 to-transparent" />
              <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_40px,rgba(255,255,255,0.03)_40px,rgba(255,255,255,0.03)_80px)]" />
            </div>

            {/* Combatants Positioning */}
            <div className="relative z-20 flex h-full items-center justify-between px-4 sm:px-8 md:px-24">

              {/* Player Side */}
              <div className="flex flex-col items-center">
                {player && (
                  <motion.div
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="flex flex-col-reverse items-center gap-4 sm:gap-8"
                  >
                    <HealthBar pokemon={player} side="player" />
                    <div className="relative">
                      <motion.img
                        src={player.sprite}
                        alt={player.name}
                        className="h-40 w-40 sm:h-64 sm:w-64 object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] filter brightness-125"
                        animate={animating ? {
                          x: [0, 10, -10, 0],
                          filter: ['brightness(1)', 'brightness(2)', 'brightness(1)']
                        } : {
                          y: [0, 8, 0]
                        }}
                        transition={animating ? { duration: 0.3 } : { duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      {/* Reflection/Shadow */}
                      <div className="absolute -bottom-4 sm:-bottom-8 left-1/2 h-4 sm:h-6 w-32 sm:w-48 -translate-x-1/2 rounded-full bg-black/50 blur-xl" />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Opponent Side */}
              <div className="flex flex-col items-center">
                {opponent && (
                  <motion.div
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="flex flex-col items-center gap-4 sm:gap-8"
                  >
                    <HealthBar pokemon={opponent} side="opponent" />
                    <div className="relative">
                      <motion.img
                        src={opponent.sprite}
                        alt={opponent.name}
                        className="h-32 w-32 sm:h-48 sm:w-48 object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] filter brightness-110 [transform:scaleX(-1)]"
                        animate={animating ? {
                          x: [0, -10, 10, 0],
                          filter: ['brightness(1)', 'brightness(2)', 'brightness(1)']
                        } : {
                          y: [0, -10, 0]
                        }}
                        transition={animating ? { duration: 0.3 } : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      {/* Reflection/Shadow */}
                      <div className="absolute -bottom-4 sm:-bottom-8 left-1/2 h-4 w-24 sm:w-32 -translate-x-1/2 rounded-full bg-black/40 blur-xl" />
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {damagePopup && <DamagePopup {...damagePopup} />}
        </AnimatePresence>

        <VictoryOverlay />
      </div>

      {/* Control Module - Glass Interface */}
      <div className="relative z-30 border-t border-white/10 bg-black/40 backdrop-blur-2xl">
        <div className="container mx-auto flex flex-col items-stretch gap-0 p-0 md:flex-row">

          {/* Action Log Widget */}
          <div className="relative w-full border-b border-white/5 md:w-1/3 md:border-b-0 md:border-r">
            <div className="absolute left-0 top-0 h-full w-1 bg-primary" />
            <div
              ref={logRef}
              className="h-32 overflow-y-auto px-6 py-4 font-mono text-xs scrollbar-hide md:h-48"
            >
              {log.map((entry, i) => (
                <div key={i} className="mb-1.5 flex gap-3 opacity-90">
                  <span className="text-slate-500">[{100 + i}]</span>
                  <p className={
                    entry.type === 'damage' ? 'text-red-400 font-bold' :
                      entry.type === 'faint' ? 'text-red-600 font-black' :
                        entry.type === 'victory' ? 'text-green-400 font-black tracking-widest' :
                          entry.type === 'status' ? 'text-purple-400' :
                            'text-slate-200'
                  }>
                    {entry.message.toUpperCase()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Interaction Grid */}
          <div className="flex-1 p-4 md:p-6 bg-gradient-to-br from-white/5 to-transparent">
            {phase === 'battle' && player && (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
                {player.moves.map(move => (
                  <button
                    key={move.name}
                    onClick={() => executeMove(move)}
                    disabled={animating || phase !== 'battle' || move.pp <= 0}
                    className="group relative flex h-24 flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:border-primary/50 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] active:scale-95 disabled:opacity-30"
                  >
                    <div className="flex items-start justify-between">
                      <TypeBadge type={move.type} size="sm" />
                      <span className="rounded-md bg-black/40 px-1.5 py-0.5 font-mono text-[9px] text-slate-400">
                        {move.pp}/{move.maxPp}
                      </span>
                    </div>
                    <div>
                      <p className="font-display text-sm font-black uppercase tracking-tight text-white group-hover:text-primary transition-colors">
                        {move.name.replace('-', ' ')}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <div className="h-1 flex-1 rounded-full bg-slate-800">
                          <div className="h-full rounded-full bg-primary/40" style={{ width: `${(move.pp / move.maxPp) * 100}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{move.category}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
