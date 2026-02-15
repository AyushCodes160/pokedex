import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PokemonCard } from '@/components/PokemonCard';
import { fetchPokemonBasic, fetchPokemonList, searchPokemon } from '@/lib/pokeapi';
import { GENERATIONS, ALL_TYPES, type PokemonBasic } from '@/lib/pokemon-types';

const PAGE_SIZE = 24;

export default function Pokedex() {
  const [pokemon, setPokemon] = useState<PokemonBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [genFilter, setGenFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const observerTarget = useRef<HTMLDivElement>(null);

  const resetList = useCallback(() => {
    setPokemon([]);
    setPage(0);
    setHasMore(true);
    setLoading(true);
  }, []);

  const loadPokemon = useCallback(async (currentPage: number, isNewSearch = false) => {
    try {
      if (isNewSearch) setLoading(true);
      else setLoadingMore(true);

      let newPokemon: PokemonBasic[] = [];
      let totalCount = 0;

      if (search.trim()) {
        const results = await searchPokemon(search);
        newPokemon = applyFilters(results);
        setHasMore(false); // Search returns all results at once usually
      } else if (genFilter !== 'all') {
        const gen = GENERATIONS[genFilter];
        const start = gen.range[0] - 1 + currentPage * PAGE_SIZE;
        const end = Math.min(start + PAGE_SIZE, gen.range[1]);

        if (start >= gen.range[1]) {
          setHasMore(false);
        } else {
          const ids = Array.from({ length: end - start }, (_, i) => start + 1 + i);
          const results = await Promise.all(
            ids.map(id => fetchPokemonBasic(id).catch(() => null))
          );
          newPokemon = applyFilters(results.filter((p): p is PokemonBasic => p !== null));
          if (end >= gen.range[1]) setHasMore(false);
        }
      } else {
        const data = await fetchPokemonList(currentPage * PAGE_SIZE, PAGE_SIZE);
        totalCount = data.count;
        const results = await Promise.all(
          data.results.map(p => fetchPokemonBasic(p.name).catch(() => null))
        );
        newPokemon = applyFilters(results.filter((p): p is PokemonBasic => p !== null));
        if (pokemon.length + newPokemon.length >= totalCount && !isNewSearch) setHasMore(false);
      }

      if (isNewSearch) {
        setPokemon(newPokemon);
      } else {
        setPokemon(prev => [...prev, ...newPokemon]);
      }
    } catch (error) {
      console.error("Failed to load pokemon:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [search, genFilter, typeFilter]);

  function applyFilters(list: PokemonBasic[]): PokemonBasic[] {
    let filtered = list;
    if (typeFilter !== 'all') {
      filtered = filtered.filter(p => p.types.includes(typeFilter));
    }
    return filtered;
  }

  // Initial load and filter changes
  useEffect(() => {
    resetList();
    loadPokemon(0, true);
  }, [search, genFilter, typeFilter]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore && !search.trim()) {
          setPage(prevPage => {
            const nextPage = prevPage + 1;
            loadPokemon(nextPage, false);
            return nextPage;
          });
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loading, loadingMore, loadPokemon, search]);

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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {pokemon.map(p => (
          <PokemonCard key={p.id} pokemon={p} />
        ))}
        {loading && pokemon.length === 0 && Array.from({ length: PAGE_SIZE }).map((_, i) => (
          <div key={i} className="h-52 animate-pulse rounded-xl bg-card" />
        ))}
        {pokemon.length === 0 && !loading && (
          <p className="col-span-full py-12 text-center text-muted-foreground">
            No Pokémon found.
          </p>
        )}
      </div>

      {/* Infinite Scroll Sentinel / Loading More Indicator */}
      <div ref={observerTarget} className="mt-8 flex h-20 items-center justify-center">
        {loadingMore && (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            <span className="text-sm text-muted-foreground">Loading more Pokémon...</span>
          </div>
        )}
      </div>
    </div>
  );
}

