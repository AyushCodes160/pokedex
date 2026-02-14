export interface PokemonBasic {
  id: number;
  name: string;
  types: string[];
  sprite: string;
  artwork: string;
  species?: string;
}

export interface PokemonStat {
  name: string;
  base_stat: number;
}

export interface PokemonAbility {
  name: string;
  is_hidden: boolean;
}

export interface PokemonMove {
  name: string;
  type: string;
  category: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
  effect: string;
  learn_method: string;
  level_learned_at: number;
}

export interface PokemonEvolution {
  id: number;
  name: string;
  sprite: string;
  trigger: string;
  min_level: number | null;
  item: string | null;
}

export interface PokemonFull extends PokemonBasic {
  height: number;
  weight: number;
  base_experience: number;
  stats: PokemonStat[];
  abilities: PokemonAbility[];
  moves: PokemonMove[];
  evolutions: PokemonEvolution[];
  species_data: {
    generation: string;
    is_legendary: boolean;
    is_mythical: boolean;
    flavor_text: string;
  };
}

export interface BattlePokemon {
  id: number;
  name: string;
  types: string[];
  sprite: string;
  level: number;
  stats: {
    hp: number;
    attack: number;
    defense: number;
    special_attack: number;
    special_defense: number;
    speed: number;
  };
  currentHp: number;
  moves: BattleMove[];
  status: StatusCondition | null;
  isFainted: boolean;
}

export interface BattleMove {
  name: string;
  type: string;
  category: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
  maxPp: number;
}

export type StatusCondition = 'burn' | 'poison' | 'paralysis' | 'sleep' | 'freeze';

export interface BattleLogEntry {
  message: string;
  type: 'info' | 'damage' | 'status' | 'faint' | 'switch' | 'victory';
}

export interface TeamMember {
  pokemonId: number;
  name: string;
  types: string[];
  sprite: string;
  level: number;
  moves: BattleMove[];
  stats: PokemonStat[];
}

export const TYPE_COLORS: Record<string, string> = {
  normal: 'bg-pokemon-normal',
  fire: 'bg-pokemon-fire',
  water: 'bg-pokemon-water',
  grass: 'bg-pokemon-grass',
  electric: 'bg-pokemon-electric',
  ice: 'bg-pokemon-ice',
  fighting: 'bg-pokemon-fighting',
  poison: 'bg-pokemon-poison',
  ground: 'bg-pokemon-ground',
  flying: 'bg-pokemon-flying',
  psychic: 'bg-pokemon-psychic',
  bug: 'bg-pokemon-bug',
  rock: 'bg-pokemon-rock',
  ghost: 'bg-pokemon-ghost',
  dragon: 'bg-pokemon-dragon',
  dark: 'bg-pokemon-dark',
  steel: 'bg-pokemon-steel',
  fairy: 'bg-pokemon-fairy',
};

export const GENERATIONS: Record<string, { name: string; range: [number, number] }> = {
  'generation-i': { name: 'Gen I (Kanto)', range: [1, 151] },
  'generation-ii': { name: 'Gen II (Johto)', range: [152, 251] },
  'generation-iii': { name: 'Gen III (Hoenn)', range: [252, 386] },
  'generation-iv': { name: 'Gen IV (Sinnoh)', range: [387, 493] },
  'generation-v': { name: 'Gen V (Unova)', range: [494, 649] },
  'generation-vi': { name: 'Gen VI (Kalos)', range: [650, 721] },
  'generation-vii': { name: 'Gen VII (Alola)', range: [722, 809] },
  'generation-viii': { name: 'Gen VIII (Galar)', range: [810, 905] },
  'generation-ix': { name: 'Gen IX (Paldea)', range: [906, 1025] },
  'forms': { name: 'Mega & Special Forms', range: [10001, 10400] },
};

export const ALL_TYPES = [
  'normal', 'fire', 'water', 'grass', 'electric', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
];
