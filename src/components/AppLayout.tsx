import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Swords, Users, LogIn, LogOut, History, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/pokedex', icon: BookOpen, label: 'Pokédex' },
  { to: '/team-builder', icon: Users, label: 'Teams' },
  { to: '/battle', icon: Swords, label: 'Battle' },
  { to: '/history', icon: History, label: 'History' },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      setIsLoggedIn(!!token);
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setUserName(user.name?.split(' ')[0] || user.name);
        } catch (e) {
          console.error("Error parsing user data", e);
        }
      }
    };

    checkAuth();
    // Listen for storage events to update auth state across tabs or after login
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUserName(null);
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate('/');
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Desktop top nav */}
      <header className="sticky top-0 z-50 hidden border-b border-border bg-background/90 backdrop-blur-md md:block">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-3xl tracking-wider pokemon-logo-text hover:scale-105 transition-transform pb-2">
              Pokemon Arena
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition-colors',
                  location.pathname === item.to
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="group relative flex h-9 w-9 items-center justify-center rounded-lg border border-border transition-colors hover:bg-accent hover:text-accent-foreground"
              title={`Switch to ${theme === 'light' ? 'Dark (Ultra Ball)' : 'Light (Pokeball)'} Mode`}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </button>

            {/* Auth Button */}
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <span className="mr-2 hidden text-sm font-bold text-muted-foreground md:inline-block">
                  {userName ? `Hi, ${userName}` : 'Welcome'}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-lg border border-border bg-destructive/10 px-3 py-2 text-sm font-bold text-destructive transition-colors hover:bg-destructive/20"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-0">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md md:hidden">
        <div className="flex items-center justify-between px-4 py-2">
          {/* Theme Toggle Mobile */}
          <button
            onClick={toggleTheme}
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-bold transition-colors text-muted-foreground"
          >
            {theme === 'light' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            Theme
          </button>

          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-bold transition-colors',
                location.pathname === item.to
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
