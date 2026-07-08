import { useState } from "react";
import { useListProgress, useCreateProgress, useDeleteProgress } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, TrendingUp, Filter, CheckCircle, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getListProgressQueryKey } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";

const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;
const LANGUAGES = ["python", "javascript", "typescript", "java", "c++", "go", "rust"] as const;
const TOPICS = ["Arrays", "Linked Lists", "Trees", "Graphs", "Dynamic Programming", "Binary Search", "Sorting", "Recursion", "Stack", "Queue", "HashMaps", "Heaps", "Sliding Window", "Two Pointers", "BFS", "DFS", "Other"];

const DIFF_STYLES: Record<string, string> = {
  Easy: "border-green-500/25 text-green-400 bg-green-400/8",
  Medium: "border-yellow-500/25 text-yellow-400 bg-yellow-400/8",
  Hard: "border-red-500/25 text-red-400 bg-red-400/8",
};

const XP_MAP: Record<string, number> = { Easy: 10, Medium: 25, Hard: 50 };

export default function Progress() {
  const { data: progressRaw, isLoading } = useListProgress();
  const progress = Array.isArray(progressRaw) ? progressRaw : [];
  const createProgress = useCreateProgress();
  const deleteProgress = useDeleteProgress();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [filterDiff, setFilterDiff] = useState<string>("all");
  const [form, setForm] = useState({
    problemTitle: "",
    platform: "LeetCode",
    difficulty: "Medium" as typeof DIFFICULTIES[number],
    topic: "Arrays",
    language: "python",
    timeSpentMins: "",
  });

  const filtered = (progress ?? []).filter(p => filterDiff === "all" || p.difficulty === filterDiff);
  const totalXp = (progress ?? []).reduce((sum, p) => sum + (XP_MAP[p.difficulty] ?? 0), 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.problemTitle.trim()) return;
    try {
      await createProgress.mutateAsync({
        data: {
          problemTitle: form.problemTitle,
          platform: form.platform,
          difficulty: form.difficulty,
          topic: form.topic,
          status: "solved",
          language: form.language,
          timeSpentMins: form.timeSpentMins ? parseInt(form.timeSpentMins) : undefined,
        }
      });
      await qc.invalidateQueries({ queryKey: getListProgressQueryKey() });
      setForm({ problemTitle: "", platform: "LeetCode", difficulty: "Medium", topic: "Arrays", language: "python", timeSpentMins: "" });
      setShowForm(false);
      toast({
        title: "Problem logged! 🎉",
        description: `+${XP_MAP[form.difficulty] ?? 10} XP earned`,
      });
    } catch {
      toast({ title: "Error", description: "Failed to save progress", variant: "destructive" });
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteProgress.mutateAsync({ id });
      await qc.invalidateQueries({ queryKey: getListProgressQueryKey() });
      toast({ title: "Removed" });
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  }

  const counts = {
    Easy: (progress ?? []).filter(p => p.difficulty === "Easy").length,
    Medium: (progress ?? []).filter(p => p.difficulty === "Medium").length,
    Hard: (progress ?? []).filter(p => p.difficulty === "Hard").length,
  };

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">Progress Tracker</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-14">Log solved problems and track your growth over time.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Log Problem
        </Button>
      </motion.div>

      {/* Stats mini-bar */}
      {!isLoading && (progress ?? []).length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-4 gap-3">
          {[
            { label: "Total", value: (progress ?? []).length, color: "text-foreground", bg: "bg-white/5" },
            { label: "Easy", value: counts.Easy, color: "text-green-400", bg: "bg-green-400/8" },
            { label: "Medium", value: counts.Medium, color: "text-yellow-400", bg: "bg-yellow-400/8" },
            { label: "Hard", value: counts.Hard, color: "text-red-400", bg: "bg-red-400/8" },
          ].map(s => (
            <Card key={s.label} className={`border-white/5 ${s.bg}`}>
              <CardContent className="p-3 text-center">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      {/* XP earned indicator */}
      {!isLoading && totalXp > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/8 border border-primary/20">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary font-semibold">{totalXp.toLocaleString()} XP earned</span>
          <span className="text-xs text-muted-foreground ml-1">from {(progress ?? []).length} problems solved</span>
        </div>
      )}

      {/* Log form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-primary/20 bg-primary/3">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="w-4 h-4 text-primary" /> Log a Solved Problem
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Input
                      placeholder="Problem title (e.g. Two Sum) *"
                      value={form.problemTitle}
                      onChange={e => setForm(f => ({ ...f, problemTitle: e.target.value }))}
                      required
                    />
                  </div>
                  <Input
                    placeholder="Platform (e.g. LeetCode)"
                    value={form.platform}
                    onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
                  />
                  <select
                    className="flex h-9 w-full rounded-lg border border-input bg-background/60 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={form.difficulty}
                    onChange={e => setForm(f => ({ ...f, difficulty: e.target.value as typeof DIFFICULTIES[number] }))}
                  >
                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d} (+{XP_MAP[d]} XP)</option>)}
                  </select>
                  <select
                    className="flex h-9 w-full rounded-lg border border-input bg-background/60 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={form.topic}
                    onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                  >
                    {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select
                    className="flex h-9 w-full rounded-lg border border-input bg-background/60 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 capitalize"
                    value={form.language}
                    onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
                  >
                    {LANGUAGES.map(l => <option key={l} value={l} className="capitalize">{l}</option>)}
                  </select>
                  <Input
                    type="number"
                    placeholder="Time spent (mins)"
                    value={form.timeSpentMins}
                    onChange={e => setForm(f => ({ ...f, timeSpentMins: e.target.value }))}
                    className="sm:col-span-2"
                  />
                  <div className="sm:col-span-2 flex gap-2">
                    <Button type="submit" disabled={createProgress.isPending} className="flex-1 gap-2">
                      {createProgress.isPending ? "Saving..." : <><CheckCircle className="w-4 h-4" /> Log Problem (+{XP_MAP[form.difficulty]} XP)</>}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground/60" />
        {["all", "Easy", "Medium", "Hard"].map(d => (
          <button
            key={d}
            onClick={() => setFilterDiff(d)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              filterDiff === d
                ? "bg-primary/15 text-primary border-primary/30"
                : "text-muted-foreground border-white/8 hover:border-white/20"
            }`}
          >
            {d === "all" ? `All (${(progress ?? []).length})` : `${d} (${counts[d as keyof typeof counts]})`}
          </button>
        ))}
      </div>

      {/* Problem list */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="p-4 rounded-2xl bg-white/3 w-fit mx-auto mb-4">
            <TrendingUp className="w-10 h-10 opacity-20" />
          </div>
          <p className="font-medium text-foreground/60">No problems logged yet</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Click "Log Problem" to start tracking your progress.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {filtered.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="group hover:border-white/10 transition-all duration-200 border-white/5 bg-card">
                  <CardContent className="py-3 px-4 flex items-center gap-3">
                    <div className={`w-1 h-10 rounded-full shrink-0 ${
                      p.difficulty === "Easy" ? "bg-green-400" :
                      p.difficulty === "Hard" ? "bg-red-400" : "bg-yellow-400"
                    }`} />
                    <CheckCircle className="w-4 h-4 text-primary/60 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{p.problemTitle}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {p.platform} • {p.topic} • {p.language}
                        {p.timeSpentMins ? ` • ${p.timeSpentMins}m` : ""}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-xs shrink-0 border ${DIFF_STYLES[p.difficulty]}`}>
                      {p.difficulty}
                    </Badge>
                    <span className="text-xs text-primary/60 font-medium shrink-0">+{XP_MAP[p.difficulty]} XP</span>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-destructive p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
