import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Crown, Check, Loader2, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const PREMIUM_PRICE_ID = "price_1SzgKIP8T6VGDCG5swpmcfYv";

const features = [
  "Unlimited ingredient analyses",
  "Save & revisit analysis history",
  "Voice readback of results",
  "Personalized hair-type recommendations",
  "Priority support",
];

export default function Premium() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [subEnd, setSubEnd] = useState<string | null>(null);

  useEffect(() => {
    if (user) checkSubscription();
    else setChecking(false);
  }, [user]);

  const checkSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setSubscribed(data.subscribed);
      setSubEnd(data.subscription_end);
    } catch {
      // ignore
    } finally {
      setChecking(false);
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      toast({ title: "Sign in first", description: "You need an account to subscribe." });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: PREMIUM_PRICE_ID },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Checkout error", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handlePortal = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Portal error", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-xl">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <Crown className="h-10 w-10 text-primary mx-auto mb-3" />
        <h1 className="font-display text-3xl font-semibold mb-2">CurlCare Premium</h1>
        <p className="text-muted-foreground mb-8">Unlock the full power of ingredient analysis</p>

        <div className="rounded-2xl gradient-card border border-border/50 p-8 text-left space-y-4">
          <div className="flex items-baseline gap-1">
            <span className="font-display text-4xl font-bold">$9.99</span>
            <span className="text-muted-foreground text-sm">/month</span>
          </div>

          <ul className="space-y-3">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {checking ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : subscribed ? (
            <div className="space-y-3 pt-2">
              <div className="px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-sm text-primary text-center">
                ✓ You're a Premium member{subEnd ? ` until ${new Date(subEnd).toLocaleDateString()}` : ""}
              </div>
              <button
                onClick={handlePortal}
                disabled={loading}
                className="w-full py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                Manage Subscription
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {!user && (
                <p className="text-xs text-muted-foreground text-center">
                  <Link to="/auth" className="text-primary hover:underline">Sign in</Link> to subscribe
                </p>
              )}
              <button
                onClick={handleCheckout}
                disabled={loading || !user}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium shadow-warm hover:shadow-glow transition-shadow disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
                Subscribe Now
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
