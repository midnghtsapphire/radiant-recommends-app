import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Analyzer from "./pages/Analyzer";
import Recommendations from "./pages/Recommendations";
import Marketing from "./pages/Marketing";
import MarketingDashboard from "./pages/MarketingDashboard";
import Auth from "./pages/Auth";
import SavedAnalyses from "./pages/SavedAnalyses";
import Premium from "./pages/Premium";
import GeniusPool from "./pages/GeniusPool";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/analyzer" element={<Analyzer />} />
              <Route path="/recommendations" element={<Recommendations />} />
              <Route path="/marketing" element={<Marketing />} />
              <Route path="/dashboard" element={<MarketingDashboard />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/saved" element={<SavedAnalyses />} />
              <Route path="/premium" element={<Premium />} />
              <Route path="/genius-pool" element={<GeniusPool />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
