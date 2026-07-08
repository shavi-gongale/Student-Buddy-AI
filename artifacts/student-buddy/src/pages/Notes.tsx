import { useState } from "react";
import { useListNotes, useCreateNote, useDeleteNote, useUpdateNote } from "@workspace/api-client-react";
import { getListNotesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, StickyNote, Edit2, Check, X, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

const NOTE_COLORS = [
  "border-primary/20 bg-primary/3",
  "border-purple-500/20 bg-purple-500/3",
  "border-yellow-500/20 bg-yellow-500/3",
  "border-green-500/20 bg-green-500/3",
  "border-pink-500/20 bg-pink-500/3",
];

export default function Notes() {
  const { data: notesRaw, isLoading } = useListNotes();
  const notes = Array.isArray(notesRaw) ? notesRaw : [];
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const updateNote = useUpdateNote();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ title: "", content: "", problemTitle: "", topic: "" });

  const filtered = (notes ?? []).filter(n =>
    !search || n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase()) ||
    (n.topic ?? "").toLowerCase().includes(search.toLowerCase())
  );

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    try {
      await createNote.mutateAsync({
        data: { title: form.title, content: form.content, problemTitle: form.problemTitle || undefined, topic: form.topic || undefined }
      });
      await qc.invalidateQueries({ queryKey: getListNotesQueryKey() });
      setForm({ title: "", content: "", problemTitle: "", topic: "" });
      setShowForm(false);
      toast({ title: "Note saved! 📝" });
    } catch {
      toast({ title: "Error", description: "Failed to save note", variant: "destructive" });
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteNote.mutateAsync({ id });
      await qc.invalidateQueries({ queryKey: getListNotesQueryKey() });
      toast({ title: "Note deleted" });
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  }

  async function handleSaveEdit(id: number) {
    try {
      await updateNote.mutateAsync({ id, data: { content: editContent } });
      await qc.invalidateQueries({ queryKey: getListNotesQueryKey() });
      setEditingId(null);
      toast({ title: "Note updated!" });
    } catch {
      toast({ title: "Error", description: "Failed to update", variant: "destructive" });
    }
  }

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-yellow-400/10 border border-yellow-400/20">
              <StickyNote className="w-5 h-5 text-yellow-400" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">Notes</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-14">Capture insights, patterns and tricky edge cases.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> New Note
        </Button>
      </motion.div>

      {/* Search */}
      {(notes ?? []).length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <input
            type="text"
            className="w-full bg-card border border-white/5 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/50 transition-all"
            placeholder="Search notes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Card className="border-primary/20 bg-primary/3">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="w-4 h-4 text-primary" /> New Note
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-3">
                  <Input placeholder="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Problem title (optional)" value={form.problemTitle} onChange={e => setForm(f => ({ ...f, problemTitle: e.target.value }))} />
                    <Input placeholder="Topic (optional)" value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} />
                  </div>
                  <textarea
                    className="flex min-h-[120px] w-full rounded-lg border border-white/8 bg-background/60 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/50"
                    placeholder="Your note content... *"
                    value={form.content}
                    onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                    required
                  />
                  <div className="flex gap-2">
                    <Button type="submit" disabled={createNote.isPending} className="flex-1">
                      {createNote.isPending ? "Saving..." : "Save Note"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="p-4 rounded-2xl bg-white/3 w-fit mx-auto mb-4">
            <StickyNote className="w-10 h-10 opacity-20" />
          </div>
          <p className="font-medium text-foreground/60">
            {search ? "No notes match your search" : "No notes yet"}
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            {search ? "Try a different search term" : "Capture patterns, tricks, and key insights as you learn."}
          </p>
        </div>
      ) : (
        <motion.div
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        >
          <AnimatePresence>
            {filtered.map((n, i) => (
              <motion.div
                key={n.id}
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                exit={{ opacity: 0, scale: 0.95 }}
                layout
              >
                <Card className={`group flex flex-col h-full border ${NOTE_COLORS[i % NOTE_COLORS.length]} hover:border-opacity-60 transition-all duration-200`}>
                  <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-sm truncate">{n.title}</CardTitle>
                      {(n.problemTitle || n.topic) && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          {[n.problemTitle, n.topic].filter(Boolean).map((tag, ti) => (
                            <span key={ti} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5">{tag}</span>
                          ))}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {editingId === n.id ? (
                        <>
                          <button onClick={() => handleSaveEdit(n.id)} className="p-1 rounded text-green-400 hover:text-green-300 hover:bg-green-400/10"><Check className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditingId(null)} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-white/5"><X className="w-3.5 h-3.5" /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditingId(n.id); setEditContent(n.content); }} className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(n.id)} className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5" /></button>
                        </>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 pt-0">
                    {editingId === n.id ? (
                      <textarea
                        className="w-full min-h-[80px] bg-transparent text-sm resize-none border-b border-primary/50 focus:outline-none text-foreground"
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4 leading-relaxed">{n.content}</p>
                    )}
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
