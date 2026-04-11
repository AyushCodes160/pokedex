import { useState, useEffect, useRef } from 'react';
import { Swords, RotateCcw, ArrowLeft, Loader2, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TypeBadge } from '@/components/TypeBadge';
import { useBattle } from '@/hooks/useBattle';
import type { BattlePokemon } from '@/lib/pokemon-types';
import { capitalize } from '@/lib/battle-engine';

// ─── Health Bar ─────────────────────────────────────────────────────────────

function HealthBar({ current, max, name, level, types, sprite, isPlayer }: {
  current: number; max: number; name: string; level: number;
  types: string[]; sprite: string; isPlayer: boolean;
}) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const color = pct > 50 ? '#22c55e' : pct > 20 ? '#eab308' : '#ef4444';

  return (
    <div className={`flex items-end gap-4 ${isPlayer ? 'flex-row' : 'flex-row-reverse'}`}>
      {/* Sprite */}
      <div className="relative">
        <img
          src={sprite}
          alt={name}
          className={`object-contain drop-shadow-2xl transition-all duration-300 ${
            current === 0 ? 'opacity-30 grayscale' : ''
          } ${isPlayer ? 'h-28 w-28 sm:h-36 sm:w-36' : 'h-24 w-24 sm:h-32 sm:w-32'}`}
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* Info Panel */}
      <div className={`flex-1 ${isPlayer ? '' : 'text-right'}`}>
        <div className={`flex items-center gap-2 mb-1 ${isPlayer ? '' : 'justify-end'}`}>
          <p className="font-bold text-sm sm:text-base text-foreground capitalize">{name}</p>
          <span className="text-xs text-muted-foreground">Lv.{level}</span>
        </div>
        <div className={`flex gap-1 mb-2 ${isPlayer ? '' : 'justify-end'}`}>
          {types.map(t => <TypeBadge key={t} type={t} size="sm" />)}
        </div>
        <div className="h-2.5 w-full max-w-xs rounded-full bg-muted/60 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {current} / {max} HP
        </p>
      </div>
    </div>
  );
}

// ─── Party Dots ─────────────────────────────────────────────────────────────

function PartyDots({ team, activeIdx, isPlayer }: { team: BattlePokemon[]; activeIdx: number; isPlayer: boolean }) {
  return (
    <div className={`flex gap-1 ${isPlayer ? '' : 'justify-end'}`}>
      {team.map((p, i) => (
        <div
          key={i}
          className={`h-3 w-3 rounded-full border-2 transition-all ${
            i === activeIdx
              ? 'border-primary bg-primary scale-125'
              : p.isFainted
              ? 'border-muted-foreground/40 bg-muted/40'
              : 'border-green-400 bg-green-400'
          }`}
        />
      ))}
    </div>
  );
}

// ─── Type Color Map ──────────────────────────────────────────────────────────

const TYPE_BUTTON_COLORS: Record<string, string> = {
  normal: 'bg-slate-400 hover:bg-slate-500',
  fire: 'bg-orange-500 hover:bg-orange-600',
  water: 'bg-blue-500 hover:bg-blue-600',
  grass: 'bg-green-500 hover:bg-green-600',
  electric: 'bg-yellow-400 hover:bg-yellow-500',
  ice: 'bg-cyan-300 hover:bg-cyan-400',
  fighting: 'bg-red-700 hover:bg-red-800',
  poison: 'bg-purple-500 hover:bg-purple-600',
  ground: 'bg-amber-600 hover:bg-amber-700',
  flying: 'bg-indigo-400 hover:bg-indigo-500',
  psychic: 'bg-pink-500 hover:bg-pink-600',
  bug: 'bg-lime-500 hover:bg-lime-600',
  rock: 'bg-stone-500 hover:bg-stone-600',
  ghost: 'bg-violet-700 hover:bg-violet-800',
  dragon: 'bg-blue-800 hover:bg-blue-900',
  dark: 'bg-gray-700 hover:bg-gray-800',
  steel: 'bg-slate-500 hover:bg-slate-600',
  fairy: 'bg-rose-400 hover:bg-rose-500',
};

// ─── Main Battle Page ────────────────────────────────────────────────────────

export default function Battle() {
  const { state, startBattle, executeTurn, switchPokemon, resetBattle } = useBattle();
  const { playerTeam, opponentTeam, activePlayerIdx, activeOppIdx, battleLog, turnState, result } = state;

  const [savedTeams, setSavedTeams] = useState<any[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [showSwitch, setShowSwitch] = useState(false);

  const logEndRef = useRef<HTMLDivElement>(null);

  // Fetch saved teams on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoadingTeams(true);
    fetch('/api/teams', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setSavedTeams(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingTeams(false));
  }, []);

  // Auto-scroll battle log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [battleLog]);

  // ── Team Select Screen ────────────────────────────────────────────────────

  if (turnState === 'team-select') {
    return (
      <div className="container mx-auto max-w-3xl py-10 px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Swords className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-4xl font-black tracking-wider mb-2">BATTLE ARENA</h1>
          <p className="text-muted-foreground">Choose a saved team to enter the arena</p>
        </div>

        {loadingTeams ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : savedTeams.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-border">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">You have no saved teams yet.</p>
            <a href="/team-builder" className="text-primary underline underline-offset-4 hover:text-primary/80">
              Build a team first →
            </a>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {savedTeams.map(team => (
              <button
                key={team.id}
                onClick={() => startBattle(team.team_data)}
                className="group rounded-2xl border border-border bg-card p-5 text-left transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 active:scale-[0.98]"
              >
                <p className="font-bold text-lg mb-1 text-foreground group-hover:text-primary transition-colors">{team.name}</p>
                <p className="text-xs text-muted-foreground mb-3">{team.team_data.length} Pokémon</p>
                <div className="flex -space-x-2">
                  {team.team_data.slice(0, 6).map((m: any, idx: number) => (
                    <img
                      key={idx}
                      src={m.sprite}
                      alt={m.name}
                      className="h-10 w-10 rounded-full border-2 border-card bg-secondary object-contain"
                    />
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Loading Opponent Screen ───────────────────────────────────────────────

  if (turnState === 'loading-opponent') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <Swords className="h-10 w-10 text-primary" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold mb-1">Finding Opponent...</p>
          <p className="text-sm text-muted-foreground">Generating a wild trainer</p>
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activePlayer = playerTeam[activePlayerIdx];
  const activeOpp = opponentTeam[activeOppIdx];

  // ── Battle Arena ─────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto max-w-4xl py-6 px-4">
      <div className="grid gap-4 lg:grid-cols-3">

        {/* ── Left: Arena ──────────────────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Arena background card */}
          <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/30 p-5 min-h-[260px] flex flex-col justify-between">
            {/* Opponent side */}
            <div>
              <PartyDots team={opponentTeam} activeIdx={activeOppIdx} isPlayer={false} />
              <div className="mt-3">
                <HealthBar
                  current={activeOpp?.currentHp ?? 0}
                  max={activeOpp?.stats.hp ?? 1}
                  name={activeOpp?.name ?? ''}
                  level={activeOpp?.level ?? 50}
                  types={activeOpp?.types ?? []}
                  sprite={activeOpp?.sprite ?? ''}
                  isPlayer={false}
                />
              </div>
            </div>

            {/* VS divider */}
            <div className="flex items-center justify-center py-2">
              <span className="text-xs font-bold text-muted-foreground/50 tracking-widest">VS</span>
            </div>

            {/* Player side */}
            <div>
              <HealthBar
                current={activePlayer?.currentHp ?? 0}
                max={activePlayer?.stats.hp ?? 1}
                name={activePlayer?.name ?? ''}
                level={activePlayer?.level ?? 50}
                types={activePlayer?.types ?? []}
                sprite={activePlayer?.sprite ?? ''}
                isPlayer={true}
              />
              <div className="mt-3">
                <PartyDots team={playerTeam} activeIdx={activePlayerIdx} isPlayer={true} />
              </div>
            </div>
          </div>

          {/* ── Controls ──────────────────────────────────────────────── */}
          {turnState === 'finished' ? (
            <div className={`rounded-2xl border p-6 text-center ${result === 'win' ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'}`}>
              <p className={`text-2xl font-black mb-1 ${result === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                {result === 'win' ? '🏆 Victory!' : '💀 Defeat'}
              </p>
              <p className="text-muted-foreground text-sm mb-4">
                {result === 'win' ? 'You defeated the opponent!' : 'Your team was wiped out.'}
              </p>
              <Button onClick={resetBattle} variant="outline" className="gap-2">
                <RotateCcw className="h-4 w-4" /> Battle Again
              </Button>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-4">
              {showSwitch ? (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <button onClick={() => setShowSwitch(false)} className="text-muted-foreground hover:text-foreground">
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <p className="font-bold text-sm">Switch Pokémon</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {playerTeam.map((p, i) => (
                      <button
                        key={i}
                        disabled={p.isFainted || i === activePlayerIdx}
                        onClick={() => { switchPokemon(i); setShowSwitch(false); }}
                        className={`rounded-xl border p-2 text-center transition-all ${
                          i === activePlayerIdx
                            ? 'border-primary/50 bg-primary/10'
                            : p.isFainted
                            ? 'border-border opacity-40 cursor-not-allowed'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <img src={p.sprite} alt={p.name} className="h-10 w-10 object-contain mx-auto" />
                        <p className="text-[10px] capitalize font-semibold mt-1 text-foreground">{p.name}</p>
                        <p className="text-[9px] text-muted-foreground">{p.currentHp}/{p.stats.hp} HP</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wide">
                    Choose a move
                  </p>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {(activePlayer?.moves ?? []).map((move, i) => (
                      <button
                        key={i}
                        disabled={turnState !== 'waiting' || move.pp === 0}
                        onClick={() => executeTurn(i)}
                        className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-white text-sm font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                          TYPE_BUTTON_COLORS[move.type] || 'bg-slate-500 hover:bg-slate-600'
                        }`}
                      >
                        <span className="capitalize">{move.name.replace(/-/g, ' ')}</span>
                        <span className="text-white/70 text-xs">{move.pp}/{move.maxPp}</span>
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => setShowSwitch(true)}
                    disabled={turnState !== 'waiting'}
                  >
                    <Zap className="h-3.5 w-3.5" /> Switch Pokémon
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right: Battle Log ─────────────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-border bg-card flex flex-col h-full min-h-[420px]">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Battle Log</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1.5 max-h-[420px]">
              {battleLog.map((entry, i) => (
                <p
                  key={i}
                  className={`text-xs leading-relaxed ${
                    entry.type === 'damage'
                      ? 'text-orange-400 font-semibold'
                      : entry.type === 'faint'
                      ? 'text-red-400 font-bold'
                      : entry.type === 'victory'
                      ? 'text-yellow-400 font-black text-sm'
                      : entry.type === 'switch'
                      ? 'text-blue-400'
                      : entry.type === 'status'
                      ? 'text-purple-400'
                      : 'text-foreground/80'
                  }`}
                >
                  {entry.message}
                </p>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
