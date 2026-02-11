import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PokemonCard } from '@/components/PokemonCard';
import { TypeBadge } from '@/components/TypeBadge';
import { fetchPokemonBasic, fetchPokemonList, searchPokemon } from '@/lib/pokeapi';
import { GENERATIONS, ALL_TYPES, type PokemonBasic } from '@/lib/pokemon-types';

const PAGE_SIZE = 24;

export default function Pokedex() {
  const [pokemon, setPokemon] = useState<PokemonBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [genFilter, setGenFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const loadPage = useCallback(async () => {
    setLoading(true);
    try {
      if (search.trim()) {
        const results = await searchPokemon(search);
        setPokemon(applyFilters(results));
        setTotal(results.length);
      } else if (genFilter !== 'all') {
        const gen = GENERATIONS[genFilter];
        const start = gen.range[0] - 1 + page * PAGE_SIZE;
        const end = Math.min(start + PAGE_SIZE, gen.range[1]);
        if (start >= gen.range[1]) { setPokemon([]); setLoading(false); return; }
        const ids = Array.from({ length: end - start }, (_, i) => start + 1 + i);
        const results = await Promise.all(ids.map(id => fetchPokemonBasic(id)));
        setPokemon(applyFilters(results));
        setTotal(gen.range[1] - gen.range[0] + 1);
      } else {
        const data = await fetchPokemonList(page * PAGE_SIZE, PAGE_SIZE);
        setTotal(data.count);
        const results = await Promise.all(
          data.results.map(p => fetchPokemonBasic(p.name))
        );
        setPokemon(applyFilters(results));
      }
    } catch { setPokemon([]); }
    setLoading(false);
  }, [page, search, genFilter, typeFilter]);

  function applyFilters(list: PokemonBasic[]): PokemonBasic[] {
    let filtered = list;
    if (typeFilter !== 'all') {
      filtered = filtered.filter(p => p.types.includes(typeFilter));
    }
    return filtered;
  }

  useEffect(() => { setPage(0); }, [search, genFilter, typeFilter]);
  useEffect(() => { loadPage(); }, [loadPage]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="container py-8">
      <h1 className="mb-6 font-display text-3xl font-black tracking-wider">POKÉDEX</h1>

      {/* Search & Filter Bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search Pokémon..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="sm:w-auto"
        >
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 flex flex-wrap gap-3 rounded-xl border border-border bg-card p-4">
          <div className="w-full sm:w-48">
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Generation</label>
            <Select value={genFilter} onValueChange={setGenFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Generations</SelectItem>
                {Object.entries(GENERATIONS).map(([key, gen]) => (
                  <SelectItem key={key} value={key}>{gen.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-48">
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Type</label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {ALL_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    <span className="capitalize">{type}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(genFilter !== 'all' || typeFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setGenFilter('all'); setTypeFilter('all'); }}
              className="self-end"
            >
              <X className="mr-1 h-3 w-3" /> Clear
            </Button>
          )}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-xl bg-card" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {pokemon.map(p => (
            <PokemonCard key={p.id} pokemon={p} />
          ))}
          {pokemon.length === 0 && (
            <p className="col-span-full py-12 text-center text-muted-foreground">
              No Pokémon found.
            </p>
          )}
        </div>
      )}

      {/* Pagination */}
      {!search.trim() && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
