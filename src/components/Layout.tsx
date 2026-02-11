import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, FlaskConical, ListChecks, Megaphone, LogIn, LogOut, History, Crown, BarChart3, Zap, Wand2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { path: "/", label: "Home", icon: Sparkles },
  { path: "/analyzer", label: "Analyzer", icon: FlaskConical },
  { path: "/recommendations", label: "Picks", icon: ListChecks },
  { path: "/marketing", label: "Marketing", icon: Megaphone },
  { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { path: "/genius-pool", label: "GeniusPool", icon: Zap },
  { path: "/logo-generator", label: "UpLogo", icon: Wand2 },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const allNav = user
    ? [...navItems, { path: "/saved", label: "Saved", icon: History }, { path: "/premium", label: "Premium", icon: Crown }]
    : [...navItems, { path: "/premium", label: "Premium", icon: Crown }];

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      {/* Top nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-display text-xl font-semibold tracking-wide text-foreground">
              Audrey's Hair Advisor
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {allNav.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 rounded-lg bg-primary/10 border border-primary/20"
                      transition={{ type: "spring", duration: 0.5 }}
                    />
                  )}
                </Link>
              );
            })}
            {user ? (
              <button
                onClick={() => signOut()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            ) : (
              <Link
                to="/auth"
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === "/auth" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/90 backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-around py-2">
          {allNav.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
          {user ? (
            <button
              onClick={() => signOut()}
              className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs text-muted-foreground"
            >
              <LogOut className="h-5 w-5" />
              Out
            </button>
          ) : (
            <Link
              to="/auth"
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${
                location.pathname === "/auth" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <LogIn className="h-5 w-5" />
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {/* Main content */}
      <main className="pt-16 pb-20 md:pb-8">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
