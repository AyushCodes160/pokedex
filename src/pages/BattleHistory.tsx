import { useEffect, useState } from 'react';
import { History } from 'lucide-react';

export default function BattleHistory() {
  const [user, setUser] = useState<any>(null);
  const [battles, setBattles] = useState<any[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('/api/battles', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setBattles(data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchHistory();
  }, [user]);

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Sign in to view your battle history.</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="mb-6 font-display text-3xl font-black tracking-wider">BATTLE HISTORY</h1>
      {battles.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16">
          <History className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No battles yet. Start fighting!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {battles.map(b => (
            <div key={b.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className={`font-display font-bold ${b.result === 'win' ? 'text-green-500' : 'text-destructive'}`}>
                  {b.result === 'win' ? 'VICTORY' : 'DEFEAT'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(b.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">vs {b.opponent_type}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
