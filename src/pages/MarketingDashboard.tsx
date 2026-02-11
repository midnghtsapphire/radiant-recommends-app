import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  BarChart3, Plus, Play, Pause, CheckCircle, Trash2, 
  MapPin, DollarSign, TrendingUp, Instagram, Twitter, 
  Facebook, Clock, ArrowUpDown, FlaskConical, Loader2,
  CheckCircle2, XCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { US_STATES, getCounties } from "@/lib/us-locations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MarketingProduct {
  id: string;
  product_name: string;
  product_type: string;
  description: string | null;
  score: number;
  priority: number;
  target_state: string | null;
  target_county: string | null;
  status: string;
  created_at: string;
}

interface CampaignPost {
  id: string;
  product_id: string;
  platform: string;
  caption: string;
  status: string;
  spend_cents: number;
  engagement_likes: number;
  engagement_comments: number;
  engagement_shares: number;
  engagement_clicks: number;
  reach: number;
  created_at: string;
}

interface Expense {
  id: string;
  product_id: string | null;
  category: string;
  description: string;
  amount_cents: number;
  expense_date: string;
  tax_deductible: boolean;
}

const platformIcons: Record<string, React.ReactNode> = {
  instagram: <Instagram className="h-4 w-4" />,
  twitter: <Twitter className="h-4 w-4" />,
  facebook: <Facebook className="h-4 w-4" />,
  tiktok: <span className="text-xs font-bold">TT</span>,
};

export default function MarketingDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [products, setProducts] = useState<MarketingProduct[]>([]);
  const [posts, setPosts] = useState<CampaignPost[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activeTab, setActiveTab] = useState("queue");

  // Add product form
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("hair_care");
  const [newDesc, setNewDesc] = useState("");
  const [newState, setNewState] = useState("");
  const [newCounty, setNewCounty] = useState("");
  const [newScore, setNewScore] = useState("50");

  // Add expense form
  const [expDesc, setExpDesc] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expCategory, setExpCategory] = useState("ad_spend");

  // Add post form
  const [postProductId, setPostProductId] = useState("");
  const [postPlatform, setPostPlatform] = useState("instagram");
  const [postCaption, setPostCaption] = useState("");
  const [postSpend, setPostSpend] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchPosts();
      fetchExpenses();
    }
  }, [user]);

  async function fetchProducts() {
    const { data } = await supabase
      .from("marketing_products")
      .select("*")
      .order("score", { ascending: false });
    if (data) setProducts(data as MarketingProduct[]);
  }

  async function fetchPosts() {
    const { data } = await supabase
      .from("campaign_posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setPosts(data as CampaignPost[]);
  }

  async function fetchExpenses() {
    const { data } = await supabase
      .from("marketing_expenses")
      .select("*")
      .order("expense_date", { ascending: false });
    if (data) setExpenses(data as Expense[]);
  }

  async function addProduct() {
    if (!newName.trim()) return;
    const { error } = await supabase.from("marketing_products").insert({
      user_id: user!.id,
      product_name: newName,
      product_type: newType,
      description: newDesc || null,
      score: parseFloat(newScore) || 50,
      target_state: newState || null,
      target_county: newCounty || null,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setNewName(""); setNewDesc(""); setNewScore("50");
    fetchProducts();
    toast({ title: "Product added to queue" });
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from("marketing_products").update({ status }).eq("id", id);
    fetchProducts();
  }

  async function deleteProduct(id: string) {
    await supabase.from("marketing_products").delete().eq("id", id);
    fetchProducts();
  }

  async function addPost() {
    if (!postProductId || !postCaption.trim()) return;
    const { error } = await supabase.from("campaign_posts").insert({
      user_id: user!.id,
      product_id: postProductId,
      platform: postPlatform,
      caption: postCaption,
      spend_cents: Math.round(parseFloat(postSpend || "0") * 100),
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setPostCaption(""); setPostSpend("");
    fetchPosts();
    toast({ title: "Post created" });
  }

  async function addExpense() {
    if (!expDesc.trim() || !expAmount) return;
    const { error } = await supabase.from("marketing_expenses").insert({
      user_id: user!.id,
      category: expCategory,
      description: expDesc,
      amount_cents: Math.round(parseFloat(expAmount) * 100),
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setExpDesc(""); setExpAmount("");
    fetchExpenses();
    toast({ title: "Expense recorded" });
  }

  // Stats
  const totalSpend = expenses.reduce((s, e) => s + e.amount_cents, 0) + posts.reduce((s, p) => s + p.spend_cents, 0);
  const totalReach = posts.reduce((s, p) => s + p.reach, 0);
  const totalEngagement = posts.reduce((s, p) => s + p.engagement_likes + p.engagement_comments + p.engagement_shares, 0);
  const queuedCount = products.filter(p => p.status === "queued").length;
  const marketingCount = products.filter(p => p.status === "marketing").length;
  const top10 = [...products].sort((a, b) => b.score - a.score).slice(0, 10);

  if (loading) return <div className="container mx-auto px-4 py-24 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="h-6 w-6 text-blossom" />
          <h1 className="font-display text-3xl font-semibold">Marketing Dashboard</h1>
        </div>
        <p className="text-muted-foreground mb-6">
          Manage your product marketing queue, track campaigns, and monitor performance.
        </p>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Queued", value: queuedCount, icon: Clock, color: "text-muted-foreground" },
            { label: "Active", value: marketingCount, icon: Play, color: "text-mint" },
            { label: "Total Spend", value: `$${(totalSpend / 100).toFixed(2)}`, icon: DollarSign, color: "text-blossom" },
            { label: "Total Reach", value: totalReach.toLocaleString(), icon: TrendingUp, color: "text-primary" },
          ].map((stat) => (
            <div key={stat.label} className="p-4 rounded-2xl gradient-card border border-border/50">
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-xl font-display font-semibold">{stat.value}</p>
            </div>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 w-full justify-start">
            <TabsTrigger value="queue">Queue & Top 10</TabsTrigger>
            <TabsTrigger value="posts">Campaign Posts</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="stats">Performance</TabsTrigger>
            <TabsTrigger value="tests" className="gap-1.5"><FlaskConical className="h-3.5 w-3.5" />Test Suite</TabsTrigger>
          </TabsList>

          {/* QUEUE TAB */}
          <TabsContent value="queue" className="space-y-6">
            {/* Add product form */}
            <div className="p-5 rounded-2xl gradient-card border border-border/50 space-y-3">
              <h3 className="font-display text-lg font-medium">Add Product to Queue</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input placeholder="Product name" value={newName} onChange={e => setNewName(e.target.value)} />
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hair_care">Hair Care Product</SelectItem>
                    <SelectItem value="own_product">My Own Product</SelectItem>
                    <SelectItem value="affiliate">Affiliate Product</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Description (optional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
                <Input placeholder="Score 0-100" type="number" value={newScore} onChange={e => setNewScore(e.target.value)} />
                <Select value={newState} onValueChange={(v) => { setNewState(v); setNewCounty(""); }}>
                  <SelectTrigger><SelectValue placeholder="Target State" /></SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                {newState && (
                  <Select value={newCounty} onValueChange={setNewCounty}>
                    <SelectTrigger><SelectValue placeholder="Target County" /></SelectTrigger>
                    <SelectContent>
                      {getCounties(newState).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <Button onClick={addProduct} className="gap-2">
                <Plus className="h-4 w-4" /> Add to Queue
              </Button>
            </div>

            {/* Top 10 */}
            <div className="p-5 rounded-2xl gradient-card border border-border/50">
              <div className="flex items-center gap-2 mb-4">
                <ArrowUpDown className="h-4 w-4 text-primary" />
                <h3 className="font-display text-lg font-medium">Top 10 Products by Score</h3>
              </div>
              {top10.length === 0 ? (
                <p className="text-sm text-muted-foreground">No products yet. Add some above!</p>
              ) : (
                <div className="space-y-2">
                  {top10.map((p, i) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-sm font-bold text-primary w-6 text-center">#{i + 1}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{p.product_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.product_type.replace("_", " ")} · Score: {p.score}
                            {p.target_state && ` · ${p.target_state}`}
                            {p.target_county && `, ${p.target_county}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          p.status === "queued" ? "bg-muted text-muted-foreground" :
                          p.status === "marketing" ? "bg-primary/20 text-primary" :
                          p.status === "completed" ? "bg-mint/20 text-mint" : "bg-muted text-muted-foreground"
                        }`}>{p.status}</span>
                        {p.status === "queued" && (
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateStatus(p.id, "marketing")}>
                            <Play className="h-3.5 w-3.5 text-mint" />
                          </Button>
                        )}
                        {p.status === "marketing" && (
                          <>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateStatus(p.id, "paused")}>
                              <Pause className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateStatus(p.id, "completed")}>
                              <CheckCircle className="h-3.5 w-3.5 text-mint" />
                            </Button>
                          </>
                        )}
                        {p.status === "paused" && (
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateStatus(p.id, "marketing")}>
                            <Play className="h-3.5 w-3.5 text-mint" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteProduct(p.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Full queue */}
            {products.length > 10 && (
              <div className="p-5 rounded-2xl gradient-card border border-border/50">
                <h3 className="font-display text-lg font-medium mb-3">Full Queue ({products.length} products)</h3>
                <div className="space-y-1">
                  {products.slice(10).map(p => (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/20 text-sm">
                      <span>{p.product_name} <span className="text-muted-foreground">· {p.score}</span></span>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => deleteProduct(p.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* POSTS TAB */}
          <TabsContent value="posts" className="space-y-6">
            <div className="p-5 rounded-2xl gradient-card border border-border/50 space-y-3">
              <h3 className="font-display text-lg font-medium">Create Campaign Post</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Select value={postProductId} onValueChange={setPostProductId}>
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>
                    {products.map(p => <SelectItem key={p.id} value={p.id}>{p.product_name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={postPlatform} onValueChange={setPostPlatform}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="twitter">X / Twitter</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Ad spend budget ($)" type="number" value={postSpend} onChange={e => setPostSpend(e.target.value)} className="md:col-span-2" />
              </div>
              <textarea
                placeholder="Caption / post content…"
                value={postCaption}
                onChange={e => setPostCaption(e.target.value)}
                className="w-full rounded-xl border border-border bg-card p-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm min-h-[80px]"
              />
              <Button onClick={addPost} className="gap-2">
                <Plus className="h-4 w-4" /> Create Post
              </Button>
            </div>

            {posts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No campaign posts yet.</p>
            ) : (
              <div className="space-y-2">
                {posts.map(post => {
                  const product = products.find(p => p.id === post.product_id);
                  return (
                    <div key={post.id} className="p-4 rounded-2xl gradient-card border border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        {platformIcons[post.platform]}
                        <span className="text-xs text-muted-foreground capitalize">{post.platform}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{post.status}</span>
                        {product && <span className="text-xs text-primary ml-auto">{product.product_name}</span>}
                      </div>
                      <p className="text-sm mb-2">{post.caption}</p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>💰 ${(post.spend_cents / 100).toFixed(2)}</span>
                        <span>❤️ {post.engagement_likes}</span>
                        <span>💬 {post.engagement_comments}</span>
                        <span>🔁 {post.engagement_shares}</span>
                        <span>👁 {post.reach}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* EXPENSES TAB */}
          <TabsContent value="expenses" className="space-y-6">
            <div className="p-5 rounded-2xl gradient-card border border-border/50 space-y-3">
              <h3 className="font-display text-lg font-medium">Record Expense</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input placeholder="Description" value={expDesc} onChange={e => setExpDesc(e.target.value)} />
                <Input placeholder="Amount ($)" type="number" value={expAmount} onChange={e => setExpAmount(e.target.value)} />
                <Select value={expCategory} onValueChange={setExpCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ad_spend">Ad Spend</SelectItem>
                    <SelectItem value="content_creation">Content Creation</SelectItem>
                    <SelectItem value="tools">Tools & Software</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addExpense} className="gap-2">
                <DollarSign className="h-4 w-4" /> Record Expense
              </Button>
            </div>

            {expenses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No expenses recorded.</p>
            ) : (
              <div className="space-y-2">
                {expenses.map(exp => (
                  <div key={exp.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">{exp.description}</p>
                      <p className="text-xs text-muted-foreground">{exp.category.replace("_", " ")} · {exp.expense_date} {exp.tax_deductible && "· 🏷 Tax deductible"}</p>
                    </div>
                    <span className="text-sm font-medium text-blossom">${(exp.amount_cents / 100).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <span className="text-sm font-medium">Total Expenses</span>
                  <span className="text-sm font-bold text-primary">${(expenses.reduce((s, e) => s + e.amount_cents, 0) / 100).toFixed(2)}</span>
                </div>
              </div>
            )}
          </TabsContent>

          {/* STATS TAB */}
          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl gradient-card border border-border/50">
                <h3 className="font-display text-lg font-medium mb-3">Product Performance</h3>
                {products.filter(p => p.status === "completed" || p.status === "marketing").length === 0 ? (
                  <p className="text-sm text-muted-foreground">Start marketing products to see performance data.</p>
                ) : (
                  <div className="space-y-2">
                    {products.filter(p => p.status === "completed" || p.status === "marketing").map(p => {
                      const productPosts = posts.filter(post => post.product_id === p.id);
                      const prodEngagement = productPosts.reduce((s, post) => s + post.engagement_likes + post.engagement_comments + post.engagement_shares, 0);
                      const prodSpend = productPosts.reduce((s, post) => s + post.spend_cents, 0);
                      return (
                        <div key={p.id} className="p-3 rounded-lg bg-muted/30">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">{p.product_name}</span>
                            <span className={`text-xs ${prodEngagement > 0 ? "text-mint" : "text-muted-foreground"}`}>
                              {prodEngagement} engagements
                            </span>
                          </div>
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>{productPosts.length} posts</span>
                            <span>${(prodSpend / 100).toFixed(2)} spent</span>
                            <span>{prodSpend > 0 ? `$${(prodSpend / Math.max(prodEngagement, 1) / 100).toFixed(2)}/engagement` : "—"}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="p-5 rounded-2xl gradient-card border border-border/50">
                <h3 className="font-display text-lg font-medium mb-3">Platform Breakdown</h3>
                {posts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No campaign data yet.</p>
                ) : (
                  <div className="space-y-2">
                    {["instagram", "facebook", "tiktok", "twitter"].map(platform => {
                      const platPosts = posts.filter(p => p.platform === platform);
                      if (platPosts.length === 0) return null;
                      const platSpend = platPosts.reduce((s, p) => s + p.spend_cents, 0);
                      const platReach = platPosts.reduce((s, p) => s + p.reach, 0);
                      return (
                        <div key={platform} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-2">
                            {platformIcons[platform]}
                            <span className="text-sm capitalize">{platform}</span>
                          </div>
                          <div className="text-xs text-muted-foreground text-right">
                            <p>{platPosts.length} posts · ${(platSpend / 100).toFixed(2)}</p>
                            <p>{platReach.toLocaleString()} reach</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 rounded-2xl gradient-card border border-border/50">
              <h3 className="font-display text-lg font-medium mb-3">Accounting Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Total Ad Spend</p>
                  <p className="text-lg font-display font-semibold">${(posts.reduce((s, p) => s + p.spend_cents, 0) / 100).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Other Expenses</p>
                  <p className="text-lg font-display font-semibold">${(expenses.reduce((s, e) => s + e.amount_cents, 0) / 100).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Marketing Cost</p>
                  <p className="text-lg font-display font-semibold text-blossom">${(totalSpend / 100).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tax Deductible</p>
                  <p className="text-lg font-display font-semibold text-mint">
                    ${(expenses.filter(e => e.tax_deductible).reduce((s, e) => s + e.amount_cents, 0) / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
          {/* TEST SUITE TAB */}
          <TabsContent value="tests">
            <DashboardTestSuite userId={user?.id ?? null} onRefresh={() => { fetchProducts(); fetchPosts(); fetchExpenses(); }} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

/* ─── Dashboard Test Suite Component ─── */
interface TestResult {
  name: string;
  status: "pass" | "fail" | "running" | "pending";
  detail?: string;
  durationMs?: number;
}

function DashboardTestSuite({ userId, onRefresh }: { userId: string | null; onRefresh: () => void }) {
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);

  const updateResult = (idx: number, patch: Partial<TestResult>) =>
    setResults(prev => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const runAll = useCallback(async () => {
    if (!userId || running) return;
    setRunning(true);

    const tests: TestResult[] = [
      { name: "Insert marketing product", status: "pending" },
      { name: "Read marketing products", status: "pending" },
      { name: "Update product status", status: "pending" },
      { name: "Insert campaign post", status: "pending" },
      { name: "Read campaign posts", status: "pending" },
      { name: "Insert expense", status: "pending" },
      { name: "Read expenses", status: "pending" },
      { name: "Delete expense", status: "pending" },
      { name: "Delete campaign post", status: "pending" },
      { name: "Delete marketing product", status: "pending" },
    ];
    setResults([...tests]);

    let productId = "";
    let postId = "";
    let expenseId = "";

    // 1 — Insert product
    const run = async (idx: number, fn: () => Promise<string>) => {
      setResults(prev => prev.map((r, i) => (i === idx ? { ...r, status: "running" } : r)));
      const start = performance.now();
      try {
        const detail = await fn();
        updateResult(idx, { status: "pass", detail, durationMs: Math.round(performance.now() - start) });
      } catch (e: any) {
        updateResult(idx, { status: "fail", detail: e.message ?? String(e), durationMs: Math.round(performance.now() - start) });
      }
    };

    await run(0, async () => {
      const { data, error } = await supabase.from("marketing_products").insert({
        user_id: userId,
        product_name: `__test_product_${Date.now()}`,
        product_type: "hair_care",
        description: "Automated test product",
        score: 88,
        target_state: "California",
        target_county: "Los Angeles",
      }).select("id").single();
      if (error) throw error;
      productId = data.id;
      return `Created id=${productId}`;
    });

    await run(1, async () => {
      const { data, error } = await supabase.from("marketing_products").select("*").eq("id", productId);
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Product not found after insert");
      return `Found ${data.length} row(s)`;
    });

    await run(2, async () => {
      const { error } = await supabase.from("marketing_products").update({ status: "marketing" }).eq("id", productId);
      if (error) throw error;
      const { data } = await supabase.from("marketing_products").select("status").eq("id", productId).single();
      if (data?.status !== "marketing") throw new Error(`Expected 'marketing', got '${data?.status}'`);
      return "Status → marketing ✓";
    });

    await run(3, async () => {
      const { data, error } = await supabase.from("campaign_posts").insert({
        user_id: userId,
        product_id: productId,
        platform: "instagram",
        caption: "__test_post automated test caption",
        spend_cents: 500,
      }).select("id").single();
      if (error) throw error;
      postId = data.id;
      return `Created post id=${postId}`;
    });

    await run(4, async () => {
      const { data, error } = await supabase.from("campaign_posts").select("*").eq("id", postId);
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Post not found");
      return `Found ${data.length} row(s), spend=$${(data[0].spend_cents / 100).toFixed(2)}`;
    });

    await run(5, async () => {
      const { data, error } = await supabase.from("marketing_expenses").insert({
        user_id: userId,
        category: "ad_spend",
        description: "__test_expense automated",
        amount_cents: 1234,
      }).select("id").single();
      if (error) throw error;
      expenseId = data.id;
      return `Created expense id=${expenseId}`;
    });

    await run(6, async () => {
      const { data, error } = await supabase.from("marketing_expenses").select("*").eq("id", expenseId);
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Expense not found");
      return `Found, amount=$${(data[0].amount_cents / 100).toFixed(2)}`;
    });

    await run(7, async () => {
      const { error } = await supabase.from("marketing_expenses").delete().eq("id", expenseId);
      if (error) throw error;
      const { data } = await supabase.from("marketing_expenses").select("id").eq("id", expenseId);
      if (data && data.length > 0) throw new Error("Expense still exists after delete");
      return "Deleted ✓";
    });

    await run(8, async () => {
      const { error } = await supabase.from("campaign_posts").delete().eq("id", postId);
      if (error) throw error;
      return "Deleted ✓";
    });

    await run(9, async () => {
      const { error } = await supabase.from("marketing_products").delete().eq("id", productId);
      if (error) throw error;
      return "Deleted ✓";
    });

    onRefresh();
    setRunning(false);
  }, [userId, running, onRefresh]);

  const passCount = results.filter(r => r.status === "pass").length;
  const failCount = results.filter(r => r.status === "fail").length;
  const total = results.length;

  return (
    <div className="space-y-4">
      <div className="p-5 rounded-2xl gradient-card border border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-lg font-medium flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              Dashboard Test Suite
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Runs end-to-end CRUD tests against all 3 tables. Test data is cleaned up automatically.
            </p>
          </div>
          <Button onClick={runAll} disabled={running || !userId} className="gap-2">
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {running ? "Running…" : "Run All Tests"}
          </Button>
        </div>

        {total > 0 && (
          <div className="mb-4 flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">{total} tests</span>
            {passCount > 0 && <span className="text-mint font-medium">{passCount} passed</span>}
            {failCount > 0 && <span className="text-destructive font-medium">{failCount} failed</span>}
            {running && <span className="text-muted-foreground">running…</span>}
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-1.5">
            {results.map((r, i) => (
              <div
                key={i}
                className={`flex items-center justify-between p-3 rounded-lg text-sm ${
                  r.status === "pass" ? "bg-mint/10" :
                  r.status === "fail" ? "bg-destructive/10" :
                  r.status === "running" ? "bg-primary/10" : "bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {r.status === "pass" && <CheckCircle2 className="h-4 w-4 text-mint shrink-0" />}
                  {r.status === "fail" && <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                  {r.status === "running" && <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />}
                  {r.status === "pending" && <Clock className="h-4 w-4 text-muted-foreground shrink-0" />}
                  <span className="font-medium">{r.name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                  {r.detail && <span className="max-w-[200px] truncate">{r.detail}</span>}
                  {r.durationMs !== undefined && <span>{r.durationMs}ms</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {total === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            Click "Run All Tests" to exercise every dashboard feature end-to-end.
          </p>
        )}
      </div>
    </div>
  );
}
