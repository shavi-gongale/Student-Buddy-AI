import { useState } from "react";
import { useExplainConcept } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Loader2, Key, Code2, Network, ChevronRight } from "lucide-react";
import type { ExplainResponse } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";

const COMMON_CONCEPTS = [
  "Arrays", "Linked Lists", "Binary Trees", "Graphs",
  "Dynamic Programming", "Recursion", "Two Pointers",
  "Sliding Window", "Binary Search", "Hash Tables",
  "Sorting Algorithms", "Trie", "Backtracking", "Heaps",
  "BFS / DFS", "Divide & Conquer",
];

const DEPTH_OPTIONS = [
  { value: "beginner", label: "Beginner", desc: "Analogy focused" },
  { value: "intermediate", label: "Intermediate", desc: "Implementation focused" },
  { value: "advanced", label: "Advanced", desc: "Optimization focused" },
];

export default function Explain() {
  const [concept, setConcept] = useState("");
  const [depth, setDepth] = useState("intermediate");
  const [explanation, setExplanation] = useState<ExplainResponse | null>(null);

  const { toast } = useToast();
  const explainConcept = useExplainConcept();

  const handleExplain = (targetConcept = concept) => {
    if (!targetConcept) {
      toast({ variant: "destructive", description: "Concept is required" });
      return;
    }
    if (targetConcept !== concept) setConcept(targetConcept);

    explainConcept.mutate(
      { data: { concept: targetConcept, depth } },
      {
        onSuccess: (data) => setExplanation(data),
        onError: () => toast({ variant: "destructive", description: "Failed to explain concept" }),
      }
    );
  };

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl bg-blue-400/10 border border-blue-400/20">
            <BookOpen className="w-5 h-5 text-blue-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">Concept Explainer</h1>
        </div>
        <p className="text-muted-foreground text-sm ml-14">Deep dive into Data Structures & Algorithms concepts.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-white/5 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">What to learn?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Concept</label>
                <input
                  type="text"
                  className="w-full bg-background/60 border border-white/8 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/50 transition-all"
                  placeholder="e.g., Dynamic Programming..."
                  value={concept}
                  onChange={e => setConcept(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleExplain()}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Depth Level</label>
                <div className="space-y-1.5">
                  {DEPTH_OPTIONS.map(d => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setDepth(d.value)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-all ${
                        depth === d.value
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "border-white/8 text-muted-foreground hover:border-white/15"
                      }`}
                    >
                      <span className="font-medium">{d.label}</span>
                      <span className="text-xs opacity-70">{d.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => handleExplain()}
                disabled={explainConcept.isPending || !concept}
                className="w-full gap-2"
              >
                {explainConcept.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Explaining...</>
                  : <><BookOpen className="w-4 h-4" /> Explain</>
                }
              </Button>
            </CardContent>
          </Card>

          <Card className="border-white/5 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Popular Topics</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-1.5">
                {COMMON_CONCEPTS.map(c => (
                  <button
                    key={c}
                    onClick={() => handleExplain(c)}
                    disabled={explainConcept.isPending}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                      concept === c
                        ? "bg-primary/10 border-primary/30 text-primary font-medium"
                        : "border-white/8 text-muted-foreground hover:border-white/20 hover:text-foreground"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right panel */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {explainConcept.isPending ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-xl bg-white/3 border border-white/5 animate-pulse" style={{ height: i === 0 ? 80 : 120 }} />
                ))}
              </motion.div>
            ) : explanation ? (
              <motion.div
                key={concept + depth}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-white/5 bg-card">
                  <CardHeader className="border-b border-white/5 bg-white/2 rounded-t-xl">
                    <CardTitle className="text-xl text-primary">{concept}</CardTitle>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      {depth} level · {DEPTH_OPTIONS.find(d => d.value === depth)?.desc}
                    </p>
                  </CardHeader>
                  <CardContent className="p-5 space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
                        <BookOpen className="w-4 h-4 text-blue-400" /> The Concept
                      </h3>
                      <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">{explanation.explanation}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
                        <Key className="w-4 h-4 text-yellow-400" /> Key Points
                      </h3>
                      <ul className="space-y-2">
                        {explanation.keyPoints.map((kp, i) => (
                          <li key={i} className="text-sm flex items-start gap-2.5 text-foreground/85">
                            <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            {kp}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
                        <Code2 className="w-4 h-4 text-green-400" /> Examples in Practice
                      </h3>
                      <div className="space-y-3">
                        {explanation.examples.map((ex, i) => (
                          <div key={i} className="bg-background/60 border border-white/5 rounded-xl p-4 text-xs font-mono text-foreground/90 whitespace-pre-wrap leading-relaxed">
                            {ex}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
                        <Network className="w-4 h-4 text-purple-400" /> Related Concepts
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {explanation.relatedConcepts.map((rc, i) => (
                          <button
                            key={i}
                            onClick={() => handleExplain(rc)}
                            className="px-3 py-1.5 bg-purple-400/8 border border-purple-400/15 text-purple-300 text-sm rounded-lg hover:bg-purple-400/15 transition-colors"
                          >
                            {rc}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full min-h-[400px] border border-dashed border-white/8 rounded-xl flex flex-col items-center justify-center p-8 text-center"
              >
                <div className="p-4 rounded-2xl bg-white/3 mb-4">
                  <BookOpen className="w-10 h-10 text-muted-foreground/30" />
                </div>
                <p className="font-medium text-foreground/60">Select a topic to explore</p>
                <p className="text-sm text-muted-foreground/60 mt-1 max-w-xs">Click a popular topic or type any DSA concept to get a detailed, tailored explanation.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
