import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { Suspense, lazy } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import Layout from "./components/Layout";

const Index = lazy(() => import("./pages/Index"));
const Analyzer = lazy(() => import("./pages/Analyzer"));
const Recommendations = lazy(() => import("./pages/Recommendations"));
const Marketing = lazy(() => import("./pages/Marketing"));
const MarketingDashboard = lazy(() => import("./pages/MarketingDashboard"));
const Auth = lazy(() => import("./pages/Auth"));
const SavedAnalyses = lazy(() => import("./pages/SavedAnalyses"));
const Premium = lazy(() => import("./pages/Premium"));
const GeniusPool = lazy(() => import("./pages/GeniusPool"));
const LogoGenerator = lazy(() => import("./pages/LogoGenerator"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-pulse text-primary text-lg">Loading…</div>
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Layout>
              <Suspense fallback={<PageLoader />}>
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
                  <Route path="/logo-generator" element={<LogoGenerator />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </Layout>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
