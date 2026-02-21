import { useState, useEffect } from 'react';
import { Search, Plus, X, Save, Trash2, FolderOpen, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TypeBadge } from '@/components/TypeBadge';
import { searchPokemon, fetchPokemonFull, fetchMoveDetails } from '@/lib/pokeapi';
import { calculateStat } from '@/lib/battle-engine';
import type { PokemonBasic, TeamMember, BattleMove, PokemonFull } from '@/lib/pokemon-types';
import { useToast } from '@/hooks/use-toast';

export default function TeamBuilder() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [teamName, setTeamName] = useState('My Team');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<PokemonBasic[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonFull | null>(null);
  const [selectedMoves, setSelectedMoves] = useState<BattleMove[]>([]);
  const [availableMoves, setAvailableMoves] = useState<BattleMove[]>([]);
  const [level, setLevel] = useState(50);
  const [loadingMoves, setLoadingMoves] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [savedTeams, setSavedTeams] = useState<any[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [searching, setSearching] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check localStorage for user
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      const u = JSON.parse(storedUser);
      setUser(u);
      fetchTeams(token);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim().length >= 2) {
        handleSearch();
      } else if (search.trim().length === 0) {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const fetchTeams = async (token: string) => {
    setLoadingTeams(true);
    try {
      const res = await fetch('/api/teams', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSavedTeams(data);
      }
    } catch (error) {
      console.error("Failed to fetch teams", error);
    }
    setLoadingTeams(false);
  };

  const loadTeam = (savedTeam: any) => {
    setTeam(savedTeam.team_data);
    setTeamName(savedTeam.name);
    toast({ title: `Loaded team: ${savedTeam.name}` });
  };

  const deleteTeam = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`/api/teams/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast({ title: 'Team deleted' });
        fetchTeams(token);
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error: any) {
      toast({ title: 'Error deleting team', description: error.message, variant: 'destructive' });
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await searchPokemon(search);
      setSearchResults(results);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setSearching(false);
    }
  };

  const selectPokemon = async (p: PokemonBasic) => {
    setLoadingMoves(true);
    const full = await fetchPokemonFull(p.id);
    setSelectedPokemon(full);

    // Enrich first 30 moves
    const enriched = await Promise.all(
      full.moves.slice(0, 30).map(async m => {
        try {
          const d = await fetchMoveDetails(m.name);
          return { name: m.name, ...d, maxPp: d.pp } as BattleMove;
        } catch {
          return { name: m.name, type: 'normal', category: 'physical', power: null, accuracy: null, pp: 0, maxPp: 0 } as BattleMove;
        }
      })
    );
    setAvailableMoves(enriched.filter(m => m.power && m.power > 0));
    setSelectedMoves([]);
    setLoadingMoves(false);
  };

  const toggleMove = (move: BattleMove) => {
    if (selectedMoves.find(m => m.name === move.name)) {
      setSelectedMoves(prev => prev.filter(m => m.name !== move.name));
    } else if (selectedMoves.length < 4) {
      setSelectedMoves(prev => [...prev, move]);
    }
  };

  const addToTeam = () => {
    if (!selectedPokemon || selectedMoves.length !== 4 || team.length >= 6) return;
    const member: TeamMember = {
      pokemonId: selectedPokemon.id,
      name: selectedPokemon.name,
      types: selectedPokemon.types,
      sprite: selectedPokemon.artwork || selectedPokemon.sprite,
      level,
      moves: selectedMoves,
      stats: selectedPokemon.stats,
    };
    setTeam(prev => [...prev, member]);
    setSelectedPokemon(null);
    setSelectedMoves([]);
    setSearchResults([]);
    setSearch('');
  };

  const removeFromTeam = (index: number) => {
    setTeam(prev => prev.filter((_, i) => i !== index));
  };

  const saveTeam = async () => {
    if (!user) {
      toast({ title: 'Sign in to save teams', variant: 'destructive' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: teamName,
          team_data: team
        })
      });

      if (res.ok) {
        toast({ title: 'Team saved!' });
        fetchTeams(token!);
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }
    } catch (error: any) {
      toast({ title: 'Error saving team', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="container py-8">
      <h1 className="mb-6 font-display text-3xl font-black tracking-wider">TEAM BUILDER</h1>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          {/* Current Team */}
          <div className="mb-8 rounded-xl border border-border bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Input
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  className="w-48 font-display text-sm"
                />
                <span className="text-sm text-muted-foreground">{team.length}/6</span>
              </div>
              <Button size="sm" onClick={saveTeam} disabled={team.length === 0}>
                <Save className="mr-1 h-4 w-4" /> Save
              </Button>
            </div>

            {team.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                Search and add Pokémon to build your team.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
                {team.map((member, i) => (
                  <div key={i} className="relative rounded-lg border border-border bg-secondary p-3 text-center">
                    <button
                      onClick={() => removeFromTeam(i)}
                      className="absolute right-1 top-1 rounded-full p-1 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <img src={member.sprite} alt={member.name} className="mx-auto h-16 w-16 object-contain" />
                    <p className="text-xs font-bold capitalize">{member.name}</p>
                    <p className="text-[10px] text-muted-foreground">Lv.{member.level}</p>
                    <div className="mt-1 flex flex-wrap justify-center gap-1">
                      {member.types.map(t => <TypeBadge key={t} type={t} size="sm" />)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Pokémon */}
          {team.length < 6 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="mb-4 font-display text-lg font-bold">Add Pokémon</h2>

              <div className="mb-4 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search Pokémon..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9"
                  />
                  {searching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>

              {/* Search results */}
              {searchResults.length > 0 && !selectedPokemon && (
                <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                  {searchResults.map(p => (
                    <button
                      key={p.id}
                      onClick={() => selectPokemon(p)}
                      className="rounded-lg border border-border p-2 text-center transition-colors hover:border-primary/50"
                    >
                      <img src={p.artwork || p.sprite} alt={p.name} className="mx-auto h-14 w-14 object-contain" />
                      <p className="text-xs font-semibold capitalize">{p.name}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Move selection */}
              {selectedPokemon && (
                <div>
                  <div className="mb-4 flex items-center gap-4">
                    <img src={selectedPokemon.artwork} alt={selectedPokemon.name} className="h-20 w-20 object-contain" />
                    <div>
                      <h3 className="font-display text-lg font-bold capitalize">{selectedPokemon.name}</h3>
                      <div className="flex gap-1">{selectedPokemon.types.map(t => <TypeBadge key={t} type={t} size="sm" />)}</div>
                      <div className="mt-2 flex items-center gap-2">
                        <label className="text-sm text-muted-foreground">Level:</label>
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={level}
                          onChange={e => setLevel(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                          className="w-20"
                        />
                      </div>
                    </div>
                  </div>

                  <p className="mb-2 text-sm text-muted-foreground">
                    Select exactly 4 moves ({selectedMoves.length}/4):
                  </p>

                  {loadingMoves ? (
                    <p className="text-sm text-muted-foreground">Loading moves...</p>
                  ) : (
                    <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {availableMoves.map(move => {
                        const isSelected = selectedMoves.find(m => m.name === move.name);
                        return (
                          <button
                            key={move.name}
                            onClick={() => toggleMove(move)}
                            disabled={!isSelected && selectedMoves.length >= 4}
                            className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors ${isSelected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30'
                              } disabled:opacity-40`}
                          >
                            <div className="flex items-center gap-2">
                              <TypeBadge type={move.type} size="sm" />
                              <span className="capitalize">{move.name.replace('-', ' ')}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {move.power || '—'} / {move.accuracy || '—'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={addToTeam} disabled={selectedMoves.length !== 4}>
                      <Plus className="mr-1 h-4 w-4" /> Add to Team
                    </Button>
                    <Button variant="outline" onClick={() => { setSelectedPokemon(null); setSelectedMoves([]); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Saved Teams Sidebar */}
        <div className="lg:col-span-4">
          <div className="rounded-xl border border-border bg-card p-4 h-fit">
            <div className="mb-4 flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-bold">My Saved Teams</h2>
            </div>

            {loadingTeams ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : savedTeams.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No saved teams yet.
              </p>
            ) : (
              <div className="space-y-3">
                {savedTeams.map((st) => (
                  <div key={st.id} className="group relative rounded-lg border border-border bg-secondary p-3 transition-colors hover:border-primary/50">
                    <div className="flex items-center justify-between gap-2">
                      <div className="overflow-hidden">
                        <p className="truncate text-sm font-bold">{st.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {st.team_data.length} Pokemon • {new Date(st.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => loadTeam(st)}>
                          <FolderOpen className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => deleteTeam(st.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {/* Tiny sprites preview */}
                    <div className="mt-2 flex -space-x-2">
                      {st.team_data.slice(0, 6).map((m: any, idx: number) => (
                        <img key={idx} src={m.sprite} alt="" className="h-6 w-6 rounded-full border border-border bg-background object-contain" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
