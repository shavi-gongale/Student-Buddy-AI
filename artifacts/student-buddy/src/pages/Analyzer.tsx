import { useState } from "react";
import { useAnalyzeProblem } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Activity, Loader2, BrainCircuit, Clock, Database, Tag, AlignLeft, Lightbulb } from "lucide-react";
import type { AnalyzeResponse } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";

const DIFF_STYLES: Record<string, string> = {
  easy: "bg-green-500/10 text-green-400 border-green-500/25",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/25",
  hard: "bg-red-500/10 text-red-400 border-red-500/25",
};

const PLATFORMS = ["LeetCode", "HackerRank", "CodeForces", "GeeksForGeeks", "InterviewBit", "AtCoder"];

export default function Analyzer() {
  const [problemTitle, setProblemTitle] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [platform, setPlatform] = useState("");
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);

  const { toast } = useToast();
  const analyzeProblem = useAnalyzeProblem();

  const handleAnalyze = () => {
    if (!problemTitle) {
      toast({ variant: "destructive", description: "Problem title is required" });
      return;
    }
    analyzeProblem.mutate(
      { data: { problemTitle, problemDescription, platform: platform || undefined } },
      {
        onSuccess: (data) => setAnalysis(data),
        onError: () => toast({ variant: "destructive", description: "Failed to analyze problem" }),
      }
    );
  };

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl bg-cyan-400/10 border border-cyan-400/20">
            <BrainCircuit className="w-5 h-5 text-cyan-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">Problem Analyzer</h1>
        </div>
        <p className="text-muted-foreground text-sm ml-14">Break down the problem, understand complexity, and identify required patterns.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input panel */}
        <Card className="border-white/5 bg-card h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Problem Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Problem Title <span className="text-destructive">*</span></label>
              <input
                type="text"
                className="w-full bg-background/60 border border-white/8 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/50 transition-all"
                placeholder="e.g., LRU Cache, Merge K Sorted Lists..."
                value={problemTitle}
                onChange={e => setProblemTitle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAnalyze()}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Platform <span className="text-muted-foreground/50">(optional)</span></label>
              <div className="flex flex-wrap gap-1.5">
                {PLATFORMS.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlatform(platform === p ? "" : p)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      platform === p
                        ? "bg-primary/15 text-primary border-primary/30"
                        : "border-white/8 text-muted-foreground hover:border-white/15 hover:text-foreground"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Problem Description <span className="text-muted-foreground/50">(optional)</span></label>
              <textarea
                className="w-full bg-background/60 border border-white/8 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[200px] resize-none placeholder:text-muted-foreground/50 transition-all font-mono text-xs leading-relaxed"
                placeholder="Paste the full problem description here for more accurate analysis..."
                value={problemDescription}
                onChange={e => setProblemDescription(e.target.value)}
              />
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={analyzeProblem.isPending || !problemTitle}
              className="w-full gap-2"
            >
              {analyzeProblem.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                : <><BrainCircuit className="w-4 h-4" /> Analyze Problem</>
              }
            </Button>
          </CardContent>
        </Card>

        {/* Results panel */}
        <div>
          <AnimatePresence mode="wait">
            {analyzeProblem.isPending ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-white/3 border border-white/5 animate-pulse" />
                ))}
              </motion.div>
            ) : analysis ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Difficulty + Topics */}
                <Card className="border-white/5 bg-card">
                  <CardContent className="p-5 space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Difficulty</p>
                        <span className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${DIFF_STYLES[analysis.difficulty.toLowerCase()] ?? "bg-primary/10 text-primary border-primary/20"}`}>
                          {analysis.difficulty}
                        </span>
                      </div>
                      {platform && (
                        <span className="text-xs text-muted-foreground bg-white/5 border border-white/8 px-2.5 py-1 rounded-lg">{platform}</span>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Tag className="w-3 h-3" /> Topics
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.topics.map(t => (
                          <span key={t} className="bg-primary/8 text-primary border border-primary/20 px-2.5 py-1 rounded-lg text-xs font-medium">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-background/60 rounded-xl p-3.5 border border-white/5">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                          <Clock className="w-3 h-3" /> Time
                        </p>
                        <div className="font-mono text-sm font-bold text-foreground">{analysis.timeComplexity}</div>
                      </div>
                      <div className="bg-background/60 rounded-xl p-3.5 border border-white/5">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                          <Database className="w-3 h-3" /> Space
                        </p>
                        <div className="font-mono text-sm font-bold text-foreground">{analysis.spaceComplexity}</div>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                        <AlignLeft className="w-3 h-3" /> Summary
                      </p>
                      <p className="text-sm leading-relaxed text-foreground/90">{analysis.summary}</p>
                    </div>

                    <div className="bg-primary/5 border border-primary/15 rounded-xl p-4">
                      <p className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5 mb-2">
                        <Lightbulb className="w-3 h-3" /> Approach Suggestion
                      </p>
                      <p className="text-sm leading-relaxed text-foreground/90">{analysis.approachSuggestion}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full min-h-[400px] border border-dashed border-white/8 rounded-xl flex flex-col items-center justify-center p-8 text-center text-muted-foreground"
              >
                <div className="p-4 rounded-2xl bg-white/3 mb-4">
                  <Activity className="w-10 h-10 opacity-30" />
                </div>
                <p className="font-medium text-foreground/60">Enter a problem to analyze</p>
                <p className="text-sm text-muted-foreground/60 mt-1 max-w-xs">Get detailed insights on difficulty, time/space complexity, and recommended approaches.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
