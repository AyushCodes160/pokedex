import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Swords, Users, LogIn, User, History } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/pokedex', icon: BookOpen, label: 'Pokédex' },
  { to: '/team-builder', icon: Users, label: 'Teams' },
  { to: '/battle', icon: Swords, label: 'Battle' },
  { to: '/history', icon: History, label: 'History' },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Desktop top nav */}
      <header className="sticky top-0 z-50 hidden border-b border-border bg-background/90 backdrop-blur-md md:block">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-pixel text-[10px] text-primary-foreground">
              PB
            </div>
            <span className="font-display text-lg font-bold tracking-wider">
              Pokédex <span className="text-primary">Arena</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                  location.pathname === item.to
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/auth"
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-0">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md md:hidden">
        <div className="flex items-center justify-around py-2">
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-semibold transition-colors',
                location.pathname === item.to
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
