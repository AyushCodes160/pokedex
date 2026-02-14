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
    name: data.name
      .split('-')
      .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' '),
    types: data.types.map((t: any) => t.type.name),
    sprite: data.sprites.front_default || '',
    artwork: data.sprites.other?.['official-artwork']?.front_default || data.sprites.front_default || '',
    species: data.species?.name,
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
  // Try exact match by name or id -> BUT don't return immediately, as we want variants
  let exactMatch: PokemonBasic | null = null;
  try {
    exactMatch = await fetchPokemonBasic(q);
  } catch { /* ignore if not found */ }

  // Search through list for variants (e.g. searching "charizard" should find "charizard-mega")
  // If we found an exact match (e.g. "charizard-mega-x"), use its species name ("charizard") to find all variants
  const searchTerm = exactMatch?.species || q;

  const list = await cachedGet<any>(`${API_BASE}/pokemon?limit=2000&offset=0`);
  const matches = list.results
    .filter((p: any) => p.name.includes(searchTerm))
    .slice(0, 20); // Increased slice to show more variants

  const results = await Promise.all(matches.map((p: any) => fetchPokemonBasic(p.name)));

  // If exact match exists and isn't in results (unlikely if loop works right, but safe), add it
  // Actually, the loop will find "charizard" in the list if we search "charizard".
  // So we just need to ensure we return the list results.

  // If no list results but we had an exact match (e.g. searching by ID), return that
  if (results.length === 0 && exactMatch) return [exactMatch];

  return results;
}
