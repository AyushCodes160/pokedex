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
    <div className="relative min-h-screen font-sans text-foreground">

      <div className="relative z-10 flex min-h-screen flex-col">
        <section className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "circOut" }}
            className="mb-12 max-w-4xl"
          >
            <h1 className="mb-6 font-display text-5xl font-black tracking-tight text-white drop-shadow-lg md:text-7xl lg:text-8xl">
              POKÉDEX <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">ARENA</span>
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-white/90 drop-shadow-md md:text-2xl">
              Explore the world of Pokémon. Build your team. Become the champion.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-2xl rounded-2xl bg-white/10 p-2 backdrop-blur-xl border border-white/20 shadow-2xl"
          >
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-6 w-6 text-white/70" />
              <Input
                placeholder="Search Pokémon by name or number..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="h-14 border-none bg-transparent pl-14 text-lg text-white placeholder:text-white/50 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button
                onClick={handleSearch}
                size="lg"
                className="ml-2 h-12 rounded-xl bg-primary px-8 font-bold text-white hover:bg-primary/90 shadow-lg transition-all hover:scale-105"
              >
                Search
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-10 flex flex-wrap justify-center gap-4"
          >
            <Button
              variant="outline"
              size="lg"
              asChild
              className="h-12 rounded-xl border-white/20 bg-black/40 text-white backdrop-blur-md hover:bg-white/20 hover:text-white border-2 hover:border-white/40 transition-all"
            >
              <Link to="/pokedex">
                <BookOpen className="mr-2 h-5 w-5" />
                Browse Pokédex
              </Link>
            </Button>
            <Button
              size="lg"
              asChild
              className="h-12 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg hover:from-red-500 hover:to-red-400 border-2 border-transparent transition-all hover:scale-105"
            >
              <Link to="/battle">
                <Swords className="mr-2 h-5 w-5" />
                Battle Arena
              </Link>
            </Button>
          </motion.div>
        </section>

        {(featured.length > 0 || searchResults) && (
          <section className="container mx-auto px-4 pb-20">
            <div className="rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 p-8 shadow-2xl">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="font-display text-3xl font-bold text-white tracking-wide drop-shadow-sm">
                  {searchResults ? 'Search Results' : 'Featured Pokémon'}
                </h2>
                {!searchResults && (
                  <Link
                    to="/pokedex"
                    className="group flex items-center gap-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
                  >
                    View all
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                )}
              </div>

              {loading ? (
                <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="aspect-[2/3] animate-pulse rounded-2xl bg-white/5" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {(searchResults || featured).map(pokemon => (
                    <div key={pokemon.id} className="transition-transform hover:scale-105">
                      <PokemonCard pokemon={pokemon} />
                    </div>
                  ))}
                  {searchResults?.length === 0 && (
                    <div className="col-span-full py-20 text-center">
                      <p className="text-2xl text-white/60">No Pokémon found matching your search.</p>
                      <Button
                        variant="link"
                        onClick={() => { setSearchQuery(''); setSearchResults(null); }}
                        className="mt-4 text-primary text-lg"
                      >
                        Clear search
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
