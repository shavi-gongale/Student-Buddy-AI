import { useState } from "react";
import { useListBookmarks, useCreateBookmark, useDeleteBookmark } from "@workspace/api-client-react";
import { getListBookmarksQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Bookmark, ExternalLink, Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;
const TOPICS = ["Arrays", "Linked Lists", "Trees", "Graphs", "Dynamic Programming", "Binary Search", "Sorting", "Recursion", "Stack", "Queue", "HashMaps", "Heaps", "Sliding Window", "Two Pointers", "BFS", "DFS", "Other"];

const DIFF_STYLES: Record<string, string> = {
  Easy: "border-green-500/25 text-green-400 bg-green-400/8",
  Medium: "border-yellow-500/25 text-yellow-400 bg-yellow-400/8",
  Hard: "border-red-500/25 text-red-400 bg-red-400/8",
};

export default function Bookmarks() {
  const { data: bookmarksRaw, isLoading } = useListBookmarks();
  const bookmarks = Array.isArray(bookmarksRaw) ? bookmarksRaw : [];
  const createBookmark = useCreateBookmark();
  const deleteBookmark = useDeleteBookmark();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterDiff, setFilterDiff] = useState("all");
  const [form, setForm] = useState({
    problemTitle: "",
    platform: "LeetCode",
    difficulty: "Medium" as typeof DIFFICULTIES[number],
    topic: "Arrays",
    url: "",
  });

  const filtered = (bookmarks ?? []).filter(b => {
    const matchSearch = !search ||
      b.problemTitle.toLowerCase().includes(search.toLowerCase()) ||
      (b.topic ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (b.platform ?? "").toLowerCase().includes(search.toLowerCase());
    const matchDiff = filterDiff === "all" || b.difficulty === filterDiff;
    return matchSearch && matchDiff;
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.problemTitle.trim()) return;
    try {
      await createBookmark.mutateAsync({
        data: { problemTitle: form.problemTitle, platform: form.platform, difficulty: form.difficulty, topic: form.topic, url: form.url || undefined }
      });
      await qc.invalidateQueries({ queryKey: getListBookmarksQueryKey() });
      setForm({ problemTitle: "", platform: "LeetCode", difficulty: "Medium", topic: "Arrays", url: "" });
      setShowForm(false);
      toast({ title: "Bookmarked! 🔖" });
    } catch {
      toast({ title: "Error", description: "Failed to bookmark", variant: "destructive" });
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteBookmark.mutateAsync({ id });
      await qc.invalidateQueries({ queryKey: getListBookmarksQueryKey() });
      toast({ title: "Bookmark removed" });
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  }

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-blue-400/10 border border-blue-400/20">
              <Bookmark className="w-5 h-5 text-blue-400" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">Bookmarks</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-14">Save problems to revisit later — {(bookmarks ?? []).length} saved.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Add Bookmark
        </Button>
      </motion.div>

      {/* Search + Filter */}
      {(bookmarks ?? []).length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <input
              type="text"
              className="w-full bg-card border border-white/5 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/50"
              placeholder="Search bookmarks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-muted-foreground/60 shrink-0" />
            {["all", "Easy", "Medium", "Hard"].map(d => (
              <button
                key={d}
                onClick={() => setFilterDiff(d)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  filterDiff === d
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "text-muted-foreground border-white/8 hover:border-white/20"
                }`}
              >
                {d === "all" ? "All" : d}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Card className="border-blue-400/20 bg-blue-400/3">
              <CardContent className="pt-5">
                <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-2">
                  <Input className="sm:col-span-2" placeholder="Problem title *" value={form.problemTitle} onChange={e => setForm(f => ({ ...f, problemTitle: e.target.value }))} required />
                  <Input placeholder="Platform (e.g. LeetCode)" value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))} />
                  <select className="flex h-9 w-full rounded-lg border border-input bg-background/60 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value as typeof DIFFICULTIES[number] }))}>
                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select className="flex h-9 w-full rounded-lg border border-input bg-background/60 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}>
                    {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <Input placeholder="Problem URL (optional)" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
                  <div className="sm:col-span-2 flex gap-2">
                    <Button type="submit" disabled={createBookmark.isPending} className="flex-1">
                      {createBookmark.isPending ? "Saving..." : "Save Bookmark"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="p-4 rounded-2xl bg-white/3 w-fit mx-auto mb-4">
            <Bookmark className="w-10 h-10 opacity-20" />
          </div>
          <p className="font-medium text-foreground/60">
            {search || filterDiff !== "all" ? "No bookmarks match your filters" : "No bookmarks yet"}
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            {search || filterDiff !== "all" ? "Try different filters" : "Save problems you want to revisit or haven't solved yet."}
          </p>
        </div>
      ) : (
        <motion.div
          className="space-y-2"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.04 } } }}
        >
          <AnimatePresence>
            {filtered.map(b => (
              <motion.div
                key={b.id}
                variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                exit={{ opacity: 0, x: -20 }}
                layout
              >
                <Card className="group hover:border-white/10 transition-all duration-200 border-white/5 bg-card">
                  <CardContent className="py-3 px-4 flex items-center gap-3">
                    <Bookmark className="w-4 h-4 text-blue-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{b.problemTitle}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{b.platform} • {b.topic}</p>
                    </div>
                    <Badge variant="outline" className={`text-xs shrink-0 border ${DIFF_STYLES[b.difficulty ?? "Medium"]}`}>
                      {b.difficulty}
                    </Badge>
                    {b.url && (
                      <a
                        href={b.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground/50 hover:text-primary transition-colors shrink-0 p-1 rounded hover:bg-primary/10"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-destructive p-1 rounded shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
