import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, Zap, BookOpen, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TypeBadge } from '@/components/TypeBadge';
import {
  fetchAllMoveNames,
  fetchMoveLearners,
  type MoveLearner,
  type MoveLearnersResult,
} from '@/lib/pokeapi';

function formatMoveName(name: string): string {
  return name
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

function LearnerCard({ learner }: { learner: MoveLearner }) {
  return (
    <Link to={`/pokemon/${learner.id}`}>
      <div className="group relative flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/50">
        <img
          src={learner.sprite || learner.artwork}
          alt={learner.name}
          loading="lazy"
          className="h-14 w-14 shrink-0 object-contain transition-transform group-hover:scale-110"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="truncate font-display text-sm font-semibold capitalize text-foreground">
              {learner.name}
            </h4>
            <span className="font-display text-[10px] text-muted-foreground">
              #{String(learner.id).padStart(3, '0')}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {learner.types.map((t) => (
              <TypeBadge key={t} type={t} size="sm" />
            ))}
          </div>
          {learner.method === 'level-up' && (
            <p className="mt-1 text-[11px] font-bold text-primary">
              {learner.level && learner.level > 0
                ? `Learns at Lv. ${learner.level}`
                : 'Learns on evolution / start'}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function MoveSearch() {
  const [allMoves, setAllMoves] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedMove, setSelectedMove] = useState<string | null>(null);
  const [result, setResult] = useState<MoveLearnersResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAllMoveNames()
      .then(setAllMoves)
      .catch(() => {
        setError('Failed to load moves list.');
      });
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const suggestions = useMemo(() => {
    const q = query.toLowerCase().trim().replace(/\s+/g, '-');
    if (!q) return [];
    return allMoves.filter((m) => m.includes(q)).slice(0, 12);
  }, [query, allMoves]);

  async function loadMove(moveName: string) {
    setSelectedMove(moveName);
    setQuery(formatMoveName(moveName));
    setShowSuggestions(false);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await fetchMoveLearners(moveName);
      setResult(data);
    } catch (e) {
      setError(`Could not find move "${moveName}". Try another search.`);
    } finally {
      setLoading(false);
    }
  }

  function clearSearch() {
    setQuery('');
    setSelectedMove(null);
    setResult(null);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.toLowerCase().trim().replace(/\s+/g, '-');
    if (!q) return;
    if (suggestions[0]) {
      loadMove(suggestions[0]);
    } else {
      loadMove(q);
    }
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-black tracking-wider">MOVE SEARCH</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search a move to see every Pokémon that can learn it — split by Level-Up and TM/Machine.
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSubmit} ref={containerRef} className="relative mb-8 max-w-2xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search a move (e.g. Thunderbolt, Earthquake, Surf)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            className="pl-9 pr-9"
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Clear"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
            <ul className="max-h-72 overflow-y-auto">
              {suggestions.map((m) => (
                <li key={m}>
                  <button
                    type="button"
                    onClick={() => loadMove(m)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm capitalize text-popover-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    {formatMoveName(m)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </form>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-3 text-sm text-muted-foreground">
            Looking up Pokémon that learn {selectedMove ? formatMoveName(selectedMove) : 'this move'}...
          </p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !result && !error && (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
          <Search className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-display text-sm font-semibold text-foreground">
            Start by searching a move above.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            We'll show every Pokémon that can learn it via level-up or TM.
          </p>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="space-y-8">
          {/* Move header */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-display text-2xl font-black capitalize tracking-wide text-foreground">
                  {formatMoveName(result.move.name)}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <TypeBadge type={result.move.type} size="md" />
                  <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {result.move.category}
                  </span>
                </div>
                {result.move.effect && (
                  <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                    {result.move.effect}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3 text-center md:gap-4">
                <div className="rounded-xl border border-border bg-background px-4 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Power
                  </p>
                  <p className="font-display text-lg font-black text-foreground">
                    {result.move.power ?? '—'}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-background px-4 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Acc.
                  </p>
                  <p className="font-display text-lg font-black text-foreground">
                    {result.move.accuracy ?? '—'}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-background px-4 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    PP
                  </p>
                  <p className="font-display text-lg font-black text-foreground">
                    {result.move.pp || '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Level-up */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <h3 className="font-display text-xl font-black tracking-wide text-foreground">
                Learns by Level-Up
              </h3>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                {result.levelUp.length}
              </span>
            </div>
            {result.levelUp.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
                No Pokémon learn this move by level-up.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {result.levelUp.map((p) => (
                  <LearnerCard key={`lvl-${p.id}`} learner={p} />
                ))}
              </div>
            )}
          </section>

          {/* TM / Machine */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h3 className="font-display text-xl font-black tracking-wide text-foreground">
                Learns by TM / Machine
              </h3>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                {result.machine.length}
              </span>
            </div>
            {result.machine.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
                No Pokémon learn this move via TM.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {result.machine.map((p) => (
                  <LearnerCard key={`tm-${p.id}`} learner={p} />
                ))}
              </div>
            )}
          </section>

          {/* Other (egg, tutor, etc.) */}
          {result.other.length > 0 && (
            <section>
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-display text-xl font-black tracking-wide text-foreground">
                  Other Methods
                </h3>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
                  {result.other.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {result.other.map((p) => (
                  <LearnerCard key={`other-${p.id}-${p.method}`} learner={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
