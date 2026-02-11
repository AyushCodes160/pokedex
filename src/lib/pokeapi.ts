import axios from 'axios';
import type { PokemonBasic, PokemonFull, PokemonMove, PokemonEvolution } from './pokemon-types';

const API_BASE = 'https://pokeapi.co/api/v2';
const cache = new Map<string, any>();

async function cachedGet<T>(url: string): Promise<T> {
  if (cache.has(url)) return cache.get(url);
  const { data } = await axios.get<T>(url);
  cache.set(url, data);
  return data;
}

export async function fetchPokemonList(offset = 0, limit = 24): Promise<{ results: { name: string; url: string }[]; count: number }> {
  return cachedGet(`${API_BASE}/pokemon?offset=${offset}&limit=${limit}`);
}

export async function fetchPokemonBasic(nameOrId: string | number): Promise<PokemonBasic> {
  const data: any = await cachedGet(`${API_BASE}/pokemon/${nameOrId}`);
  return {
    id: data.id,
    name: data.name,
    types: data.types.map((t: any) => t.type.name),
    sprite: data.sprites.front_default || '',
    artwork: data.sprites.other?.['official-artwork']?.front_default || data.sprites.front_default || '',
  };
}

export async function fetchPokemonFull(nameOrId: string | number): Promise<PokemonFull> {
  const data: any = await cachedGet(`${API_BASE}/pokemon/${nameOrId}`);
  const speciesData: any = await cachedGet(data.species.url);

  const flavorEntry = speciesData.flavor_text_entries?.find((e: any) => e.language.name === 'en');

  let evolutions: PokemonEvolution[] = [];
  try {
    const evoChainData: any = await cachedGet(speciesData.evolution_chain.url);
    evolutions = parseEvolutionChain(evoChainData.chain);
  } catch { /* some pokemon have no evolution chain */ }

  const moves: PokemonMove[] = data.moves.slice(0, 80).map((m: any) => {
    const versionDetail = m.version_group_details[m.version_group_details.length - 1];
    return {
      name: m.move.name,
      type: '',
      category: '',
      power: null,
      accuracy: null,
      pp: 0,
      effect: '',
      learn_method: versionDetail?.move_learn_method?.name || 'unknown',
      level_learned_at: versionDetail?.level_learned_at || 0,
    };
  });

  return {
    id: data.id,
    name: data.name,
    types: data.types.map((t: any) => t.type.name),
    sprite: data.sprites.front_default || '',
    artwork: data.sprites.other?.['official-artwork']?.front_default || data.sprites.front_default || '',
    height: data.height,
    weight: data.weight,
    base_experience: data.base_experience,
    stats: data.stats.map((s: any) => ({
      name: s.stat.name,
      base_stat: s.base_stat,
    })),
    abilities: data.abilities.map((a: any) => ({
      name: a.ability.name,
      is_hidden: a.is_hidden,
    })),
    moves,
    evolutions,
    species_data: {
      generation: speciesData.generation?.name || 'unknown',
      is_legendary: speciesData.is_legendary,
      is_mythical: speciesData.is_mythical,
      flavor_text: flavorEntry?.flavor_text?.replace(/[\n\f]/g, ' ') || '',
    },
  };
}

function parseEvolutionChain(chain: any): PokemonEvolution[] {
  const results: PokemonEvolution[] = [];

  function walk(node: any) {
    const idMatch = node.species.url.match(/\/(\d+)\//);
    const id = idMatch ? parseInt(idMatch[1]) : 0;
    const details = node.evolution_details?.[0];

    results.push({
      id,
      name: node.species.name,
      sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
      trigger: details?.trigger?.name || 'base',
      min_level: details?.min_level || null,
      item: details?.item?.name || null,
    });

    node.evolves_to?.forEach((child: any) => walk(child));
  }

  walk(chain);
  return results;
}

export async function fetchMoveDetails(moveName: string): Promise<{
  type: string;
  category: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
  effect: string;
}> {
  const data: any = await cachedGet(`${API_BASE}/move/${moveName}`);
  const effectEntry = data.effect_entries?.find((e: any) => e.language.name === 'en');
  return {
    type: data.type.name,
    category: data.damage_class?.name || 'status',
    power: data.power,
    accuracy: data.accuracy,
    pp: data.pp,
    effect: effectEntry?.short_effect || '',
  };
}

export async function searchPokemon(query: string): Promise<PokemonBasic[]> {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  // Try exact match by name or id
  try {
    const pokemon = await fetchPokemonBasic(q);
    return [pokemon];
  } catch {
    // If not found, search through list
    const list = await cachedGet<any>(`${API_BASE}/pokemon?limit=1025&offset=0`);
    const matches = list.results
      .filter((p: any) => p.name.includes(q))
      .slice(0, 12);
    return Promise.all(matches.map((p: any) => fetchPokemonBasic(p.name)));
  }
}
