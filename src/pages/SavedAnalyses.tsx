import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { History, Trash2, FlaskConical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import ScoreRing from "@/components/ScoreRing";
import { useToast } from "@/hooks/use-toast";

interface SavedAnalysis {
  id: string;
  analysis_name: string;
  analysis_data: {
    score: number;
    maxScore: number;
    summary: string;
    hairNeeds: string[];
  };
  created_at: string;
}

export default function SavedAnalyses() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchAnalyses = async () => {
      const { data, error } = await supabase
        .from("saved_analyses")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) setAnalyses(data as unknown as SavedAnalysis[]);
      setLoading(false);
    };
    fetchAnalyses();
  }, [user]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("saved_analyses").delete().eq("id", id);
    if (!error) {
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
      toast({ title: "Deleted" });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl text-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <History className="h-6 w-6 text-primary" />
          <h1 className="font-display text-3xl font-semibold">Saved Analyses</h1>
        </div>
        <p className="text-muted-foreground mb-8">Your analysis history — review past results anytime.</p>

        {analyses.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No saved analyses yet. Run an analysis and save it!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {analyses.map((a) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 p-4 rounded-2xl gradient-card border border-border/50"
              >
                <ScoreRing score={a.analysis_data.score} maxScore={a.analysis_data.maxScore} size={60} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-lg font-medium truncate capitalize">{a.analysis_name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(a.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
