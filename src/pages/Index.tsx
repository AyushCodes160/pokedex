import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Swords, BookOpen, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PokemonCard } from '@/components/PokemonCard';
import { fetchPokemonBasic, searchPokemon } from '@/lib/pokeapi';
import type { PokemonBasic } from '@/lib/pokemon-types';

export default function Index() {
  const [featured, setFeatured] = useState<PokemonBasic[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PokemonBasic[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load 8 random featured Pokémon
    const ids = Array.from({ length: 8 }, () => Math.floor(Math.random() * 898) + 1);
    Promise.all(ids.map(id => fetchPokemonBasic(id)))
      .then(setFeatured)
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) { setSearchResults(null); return; }
    setLoading(true);
    const results = await searchPokemon(searchQuery);
    setSearchResults(results);
    setLoading(false);
  };

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container relative text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="mb-4 font-display text-4xl font-black tracking-wider md:text-6xl">
              POKÉDEX <span className="text-primary">BATTLE</span> ARENA
            </h1>
            <p className="mx-auto mb-8 max-w-lg text-lg text-muted-foreground">
              Browse all 1000+ Pokémon. Build your team. Battle GBA-style.
            </p>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto flex max-w-md gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or number..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch}>Search</Button>
          </motion.div>

          {/* Quick actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 flex flex-wrap justify-center gap-3"
          >
            <Button variant="outline" asChild>
              <Link to="/pokedex">
                <BookOpen className="mr-2 h-4 w-4" />
                Browse Pokédex
              </Link>
            </Button>
            <Button asChild>
              <Link to="/battle">
                <Swords className="mr-2 h-4 w-4" />
                Start Battle
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Featured / Search Results */}
      <section className="container py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold tracking-wide">
            {searchResults ? 'Search Results' : 'Featured Pokémon'}
          </h2>
          {!searchResults && (
            <Link
              to="/pokedex"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-52 animate-pulse rounded-xl bg-card" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {(searchResults || featured).map(pokemon => (
              <PokemonCard key={pokemon.id} pokemon={pokemon} />
            ))}
            {searchResults?.length === 0 && (
              <p className="col-span-full text-center text-muted-foreground">
                No Pokémon found. Try another search.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
