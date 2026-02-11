import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TypeBadge } from './TypeBadge';
import type { PokemonBasic } from '@/lib/pokemon-types';

interface PokemonCardProps {
  pokemon: PokemonBasic;
}

export function PokemonCard({ pokemon }: PokemonCardProps) {
  return (
    <Link to={`/pokemon/${pokemon.id}`}>
      <motion.div
        whileHover={{ y: -6, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
      >
        <span className="absolute right-3 top-2 font-display text-xs text-muted-foreground">
          #{String(pokemon.id).padStart(3, '0')}
        </span>

        <div className="flex items-center justify-center py-4">
          <img
            src={pokemon.artwork || pokemon.sprite}
            alt={pokemon.name}
            loading="lazy"
            className="h-28 w-28 object-contain drop-shadow-lg transition-transform group-hover:scale-110"
          />
        </div>

        <h3 className="mb-2 text-center font-display text-sm font-semibold capitalize tracking-wide text-foreground">
          {pokemon.name}
        </h3>

        <div className="flex justify-center gap-2">
          {pokemon.types.map(type => (
            <TypeBadge key={type} type={type} size="sm" />
          ))}
        </div>
      </motion.div>
    </Link>
  );
}
