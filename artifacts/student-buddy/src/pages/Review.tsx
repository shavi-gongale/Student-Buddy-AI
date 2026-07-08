import { useState } from "react";
import { useReviewCode } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileCode2, Loader2, CheckCircle, AlertTriangle, Zap, ShieldAlert, Clock, Database } from "lucide-react";
import type { CodeReviewResponse } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";

const LANGUAGES = ["python", "java", "cpp", "javascript", "typescript", "go", "rust"];

function ScoreRing({ score }: { score: number }) {
  const radius = 28;
  const circ = 2 * Math.PI * radius;
  const dash = (score / 100) * circ;
  const color = score > 80 ? "#22c55e" : score > 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative w-20 h-20">
      <svg width={64} height={64} className="-rotate-90 mx-auto" viewBox="0 0 64 64">
        <circle cx={32} cy={32} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
        <circle
          cx={32} cy={32} r={radius}
          fill="none" stroke={color} strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - dash}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-base font-bold leading-none" style={{ color }}>{score}</span>
        <span className="text-xs text-muted-foreground leading-none mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

export default function Review() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [problemTitle, setProblemTitle] = useState("");
  const [review, setReview] = useState<CodeReviewResponse | null>(null);

  const { toast } = useToast();
  const reviewCode = useReviewCode();

  const handleReview = () => {
    if (!code) {
      toast({ variant: "destructive", description: "Code is required" });
      return;
    }
    reviewCode.mutate(
      { data: { code, language, problemTitle } },
      {
        onSuccess: (data) => setReview(data),
        onError: () => toast({ variant: "destructive", description: "Failed to review code" }),
      }
    );
  };

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl bg-green-400/10 border border-green-400/20">
            <FileCode2 className="w-5 h-5 text-green-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">Code Review</h1>
        </div>
        <p className="text-muted-foreground text-sm ml-14">Get senior-level feedback on your implementation.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Code Input */}
        <Card className="border-white/5 bg-card flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Your Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 flex flex-col">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Problem</label>
                <input
                  type="text"
                  className="w-full bg-background/60 border border-white/8 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/50 transition-all"
                  placeholder="e.g., Valid Parentheses"
                  value={problemTitle}
                  onChange={e => setProblemTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Language</label>
                <select
                  className="w-full bg-background/60 border border-white/8 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all capitalize"
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                >
                  {LANGUAGES.map(l => <option key={l} value={l} className="capitalize">{l}</option>)}
                </select>
              </div>
            </div>

            <div className="flex-1 flex flex-col space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Code <span className="text-destructive">*</span></label>
              <textarea
                className="flex-1 w-full bg-background/40 border border-white/8 rounded-xl px-4 py-3 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[360px] resize-none placeholder:text-muted-foreground/40 transition-all"
                placeholder={`# Paste your ${language} code here...\n\ndef solution(...):\n    pass`}
                value={code}
                onChange={e => setCode(e.target.value)}
                spellCheck={false}
              />
            </div>

            <Button onClick={handleReview} disabled={reviewCode.isPending || !code} className="w-full gap-2">
              {reviewCode.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Reviewing...</>
                : <><FileCode2 className="w-4 h-4" /> Review Code</>
              }
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <div>
          <AnimatePresence mode="wait">
            {reviewCode.isPending ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-white/3 border border-white/5 animate-pulse" />
                ))}
              </motion.div>
            ) : review ? (
              <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Score header */}
                <Card className="border-white/5 bg-card">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-semibold">Confidence Score</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Overall solution quality</p>
                      </div>
                      <ScoreRing score={review.confidenceScore} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-background/60 rounded-xl p-3 border border-white/5">
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                          <Clock className="w-3 h-3" /> Time
                        </p>
                        <p className="font-mono text-sm font-bold">{review.timeComplexity}</p>
                      </div>
                      <div className="bg-background/60 rounded-xl p-3 border border-white/5">
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                          <Database className="w-3 h-3" /> Space
                        </p>
                        <p className="font-mono text-sm font-bold">{review.spaceComplexity}</p>
                      </div>
                    </div>

                    <div className="mt-4 p-3.5 rounded-xl bg-white/3 border border-white/5">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <CheckCircle className="w-3 h-3 text-primary" /> Overall Feedback
                      </p>
                      <p className="text-sm leading-relaxed text-foreground/90">{review.overallFeedback}</p>
                    </div>
                  </CardContent>
                </Card>

                {review.bugs.length > 0 && (
                  <Card className="border-red-500/20 bg-red-500/3">
                    <CardContent className="p-4 space-y-2">
                      <p className="text-xs font-semibold text-destructive uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Bugs Detected ({review.bugs.length})
                      </p>
                      <ul className="space-y-2">
                        {review.bugs.map((bug, i) => (
                          <li key={i} className="text-sm bg-red-500/8 border border-red-500/15 rounded-lg p-3 text-foreground/90">
                            {bug}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {review.optimizations.length > 0 && (
                  <Card className="border-primary/20 bg-primary/3">
                    <CardContent className="p-4 space-y-2">
                      <p className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" /> Optimizations ({review.optimizations.length})
                      </p>
                      <ul className="space-y-2">
                        {review.optimizations.map((opt, i) => (
                          <li key={i} className="text-sm bg-primary/8 border border-primary/15 rounded-lg p-3 text-foreground/90">
                            {opt}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {review.edgeCases.length > 0 && (
                  <Card className="border-orange-500/20 bg-orange-500/3">
                    <CardContent className="p-4 space-y-2">
                      <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5" /> Edge Cases ({review.edgeCases.length})
                      </p>
                      <ul className="space-y-1.5">
                        {review.edgeCases.map((ec, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-orange-400 shrink-0 mt-0.5">•</span> {ec}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full min-h-[400px] border border-dashed border-white/8 rounded-xl flex flex-col items-center justify-center p-8 text-center"
              >
                <div className="p-4 rounded-2xl bg-white/3 mb-4">
                  <CheckCircle className="w-10 h-10 text-muted-foreground/30" />
                </div>
                <p className="font-medium text-foreground/60">Submit your code for review</p>
                <p className="text-sm text-muted-foreground/60 mt-1 max-w-xs">Get bugs detected, optimizations, edge cases, and a confidence score.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
