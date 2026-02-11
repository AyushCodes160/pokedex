import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import Index from "./pages/Index";
import Pokedex from "./pages/Pokedex";
import PokemonDetail from "./pages/PokemonDetail";
import TeamBuilder from "./pages/TeamBuilder";
import Battle from "./pages/Battle";
import BattleHistory from "./pages/BattleHistory";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { RequireAuth } from "./components/RequireAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<RequireAuth><Index /></RequireAuth>} />
            <Route path="/pokedex" element={<RequireAuth><Pokedex /></RequireAuth>} />
            <Route path="/pokemon/:id" element={<RequireAuth><PokemonDetail /></RequireAuth>} />
            <Route path="/team-builder" element={<RequireAuth><TeamBuilder /></RequireAuth>} />
            <Route path="/battle" element={<RequireAuth><Battle /></RequireAuth>} />
            <Route path="/history" element={<RequireAuth><BattleHistory /></RequireAuth>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
