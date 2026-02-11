import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TypeBadge } from '@/components/TypeBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchPokemonFull, fetchMoveDetails } from '@/lib/pokeapi';
import { getDefensiveMatchups } from '@/lib/type-effectiveness';
import type { PokemonFull, PokemonMove } from '@/lib/pokemon-types';

const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  attack: 'ATK',
  defense: 'DEF',
  'special-attack': 'SP.ATK',
  'special-defense': 'SP.DEF',
  speed: 'SPD',
};

export default function PokemonDetail() {
  const { id } = useParams<{ id: string }>();
  const [pokemon, setPokemon] = useState<PokemonFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrichedMoves, setEnrichedMoves] = useState<Map<string, PokemonMove>>(new Map());
  const [loadingMoves, setLoadingMoves] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchPokemonFull(id).then(setPokemon).finally(() => setLoading(false));
  }, [id]);

  const enrichMoves = async (method: string) => {
    if (!pokemon) return;
    const movesOfMethod = pokemon.moves.filter(m => m.learn_method === method);
    const toFetch = movesOfMethod.filter(m => !enrichedMoves.has(m.name));
    if (toFetch.length === 0) return;
    setLoadingMoves(true);
    const details = await Promise.all(
      toFetch.slice(0, 30).map(async m => {
        try {
          const d = await fetchMoveDetails(m.name);
          return { ...m, ...d };
        } catch { return m; }
      })
    );
    setEnrichedMoves(prev => {
      const next = new Map(prev);
      details.forEach(m => next.set(m.name, m));
      return next;
    });
    setLoadingMoves(false);
  };

  if (loading) {
    return (
      <div className="container py-8">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!pokemon) {
    return (
      <div className="container py-8 text-center">
        <p className="text-muted-foreground">Pokémon not found.</p>
        <Button variant="outline" asChild className="mt-4">
          <Link to="/pokedex">Back to Pokédex</Link>
        </Button>
      </div>
    );
  }

  const statData = pokemon.stats.map(s => ({
    stat: STAT_LABELS[s.name] || s.name,
    value: s.base_stat,
    fullMark: 255,
  }));

  const matchups = getDefensiveMatchups(pokemon.types);
  const weaknesses = matchups.filter(m => m.multiplier > 1);
  const resistances = matchups.filter(m => m.multiplier < 1 && m.multiplier > 0);
  const immunities = matchups.filter(m => m.multiplier === 0);

  const moveMethods = ['level-up', 'machine', 'egg', 'tutor'];
  const moveMethodLabels: Record<string, string> = {
    'level-up': 'Level Up',
    machine: 'TM/TR',
    egg: 'Egg',
    tutor: 'Tutor',
  };

  return (
    <div className="container py-8">
      <Link
        to="/pokedex"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Pokédex
      </Link>

      {/* Header */}
      <div className="mb-8 flex flex-col items-center gap-6 md:flex-row md:items-start">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-shrink-0"
        >
          <img
            src={pokemon.artwork}
            alt={pokemon.name}
            className="h-64 w-64 object-contain drop-shadow-2xl"
          />
        </motion.div>

        <div className="flex-1 text-center md:text-left">
          <p className="font-display text-sm text-muted-foreground">
            #{String(pokemon.id).padStart(3, '0')}
          </p>
          <h1 className="mb-2 font-display text-4xl font-black capitalize tracking-wider">
            {pokemon.name}
          </h1>
          <div className="mb-4 flex flex-wrap justify-center gap-2 md:justify-start">
            {pokemon.types.map(t => (
              <TypeBadge key={t} type={t} size="lg" />
            ))}
          </div>
          <p className="mb-4 max-w-md text-muted-foreground">
            {pokemon.species_data.flavor_text}
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm md:justify-start">
            <div>
              <span className="text-muted-foreground">Height:</span>{' '}
              <span className="font-semibold">{pokemon.height / 10}m</span>
            </div>
            <div>
              <span className="text-muted-foreground">Weight:</span>{' '}
              <span className="font-semibold">{pokemon.weight / 10}kg</span>
            </div>
            <div>
              <span className="text-muted-foreground">Base XP:</span>{' '}
              <span className="font-semibold">{pokemon.base_experience}</span>
            </div>
          </div>
          {/* Abilities */}
          <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Abilities</h3>
            <div className="mt-1 flex flex-wrap gap-2">
              {pokemon.abilities.map(a => (
                <span
                  key={a.name}
                  className={`rounded-md border border-border px-2 py-1 text-sm capitalize ${a.is_hidden ? 'border-accent text-accent' : ''}`}
                >
                  {a.name.replace('-', ' ')}
                  {a.is_hidden && <span className="ml-1 text-[10px]">(H)</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats & Type effectiveness */}
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        {/* Radar Chart */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-4 font-display text-lg font-bold">Base Stats</h2>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={statData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis
                dataKey="stat"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              />
              <PolarRadiusAxis angle={30} domain={[0, 255]} tick={false} axisLine={false} />
              <Radar
                name="Stats"
                dataKey="value"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
          <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
            {pokemon.stats.map(s => (
              <div key={s.name} className="flex items-center justify-between rounded-md bg-secondary px-2 py-1">
                <span className="text-muted-foreground">{STAT_LABELS[s.name]}</span>
                <span className="font-bold">{s.base_stat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Type Effectiveness */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-4 font-display text-lg font-bold">Type Effectiveness</h2>
          {weaknesses.length > 0 && (
            <div className="mb-3">
              <h3 className="mb-1 text-xs font-semibold text-destructive">Weak to</h3>
              <div className="flex flex-wrap gap-2">
                {weaknesses.map(m => (
                  <div key={m.type} className="flex items-center gap-1">
                    <TypeBadge type={m.type} size="sm" />
                    <span className="text-xs font-bold text-destructive">×{m.multiplier}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {resistances.length > 0 && (
            <div className="mb-3">
              <h3 className="mb-1 text-xs font-semibold text-green-500">Resists</h3>
              <div className="flex flex-wrap gap-2">
                {resistances.map(m => (
                  <div key={m.type} className="flex items-center gap-1">
                    <TypeBadge type={m.type} size="sm" />
                    <span className="text-xs font-bold text-green-500">×{m.multiplier}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {immunities.length > 0 && (
            <div>
              <h3 className="mb-1 text-xs font-semibold text-muted-foreground">Immune to</h3>
              <div className="flex flex-wrap gap-2">
                {immunities.map(m => (
                  <div key={m.type} className="flex items-center gap-1">
                    <TypeBadge type={m.type} size="sm" />
                    <span className="text-xs font-bold">×0</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evolution Chain */}
          {pokemon.evolutions.length > 1 && (
            <div className="mt-6">
              <h2 className="mb-3 font-display text-lg font-bold">Evolution</h2>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {pokemon.evolutions.map((evo, i) => (
                  <div key={evo.id} className="flex items-center gap-2">
                    {i > 0 && (
                      <div className="text-center">
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        <span className="block text-[10px] text-muted-foreground">
                          {evo.min_level ? `Lv.${evo.min_level}` : evo.item || evo.trigger}
                        </span>
                      </div>
                    )}
                    <Link
                      to={`/pokemon/${evo.id}`}
                      className={`flex flex-col items-center rounded-lg border p-2 transition-colors hover:border-primary/50 ${evo.id === pokemon.id ? 'border-primary bg-primary/10' : 'border-border'}`}
                    >
                      <img src={evo.sprite} alt={evo.name} className="h-14 w-14" />
                      <span className="text-xs font-semibold capitalize">{evo.name}</span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Moves */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-4 font-display text-lg font-bold">Learnset</h2>
        <Tabs defaultValue="level-up" onValueChange={enrichMoves}>
          <TabsList className="mb-4 flex-wrap">
            {moveMethods.map(m => (
              <TabsTrigger key={m} value={m}>{moveMethodLabels[m]}</TabsTrigger>
            ))}
          </TabsList>
          {moveMethods.map(method => {
            const methodMoves = pokemon.moves
              .filter(m => m.learn_method === method)
              .map(m => enrichedMoves.get(m.name) || m)
              .sort((a, b) => (a.level_learned_at || 0) - (b.level_learned_at || 0));
            return (
              <TabsContent key={method} value={method}>
                {loadingMoves ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : methodMoves.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">No moves in this category.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs text-muted-foreground">
                          {method === 'level-up' && <th className="px-2 py-2">Lv.</th>}
                          <th className="px-2 py-2">Move</th>
                          <th className="px-2 py-2">Type</th>
                          <th className="px-2 py-2">Cat.</th>
                          <th className="px-2 py-2">Pwr</th>
                          <th className="px-2 py-2">Acc</th>
                          <th className="px-2 py-2">PP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {methodMoves.map((m, i) => (
                          <tr key={`${m.name}-${i}`} className="border-b border-border/50 hover:bg-secondary/50">
                            {method === 'level-up' && (
                              <td className="px-2 py-2 font-mono text-xs">{m.level_learned_at || '—'}</td>
                            )}
                            <td className="px-2 py-2 font-semibold capitalize">{m.name.replace('-', ' ')}</td>
                            <td className="px-2 py-2">{m.type ? <TypeBadge type={m.type} size="sm" /> : '—'}</td>
                            <td className="px-2 py-2 capitalize text-muted-foreground">{m.category || '—'}</td>
                            <td className="px-2 py-2">{m.power || '—'}</td>
                            <td className="px-2 py-2">{m.accuracy || '—'}</td>
                            <td className="px-2 py-2">{m.pp || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}
