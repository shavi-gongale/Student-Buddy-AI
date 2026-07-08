import { useState } from "react";
import { useGetHint } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Lightbulb, ChevronRight, Loader2, Lock, Unlock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const HINT_LABELS = [
  { level: 1, title: "Concept Hint", description: "What type of problem is this?", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20" },
  { level: 2, title: "Approach Hint", description: "What strategy would work?", color: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/20" },
  { level: 3, title: "Data Structures", description: "Which data structures help?", color: "text-teal-400", bg: "bg-teal-400/10 border-teal-400/20" },
  { level: 4, title: "Pseudocode", description: "Step-by-step approach", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" },
  { level: 5, title: "Full Solution", description: "Code-level guidance", color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
];

export default function Hints() {
  const [problemTitle, setProblemTitle] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [language, setLanguage] = useState("python");
  const [hintLevel, setHintLevel] = useState(1);
  const [hints, setHints] = useState<{ level: number; text: string }[]>([]);

  const { toast } = useToast();
  const getHint = useGetHint();

  const handleGetHint = () => {
    if (!problemTitle) {
      toast({ variant: "destructive", description: "Problem title is required" });
      return;
    }

    getHint.mutate(
      { data: { problemTitle, problemDescription, language, hintLevel } },
      {
        onSuccess: (data) => {
          setHints(prev => {
            const next = [...prev];
            const idx = next.findIndex(h => h.level === data.hintLevel);
            if (idx >= 0) next[idx].text = data.hint;
            else next.push({ level: data.hintLevel, text: data.hint });
            return next.sort((a, b) => a.level - b.level);
          });
          if (data.nextLevelAvailable) setHintLevel(data.hintLevel + 1);
        },
        onError: () => {
          toast({ variant: "destructive", description: "Failed to get hint" });
        }
      }
    );
  };

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl bg-yellow-400/10 border border-yellow-400/20">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">Smart Hints</h1>
        </div>
        <p className="text-muted-foreground text-sm mt-1 ml-14">Progressive hints from concept to full solution — without spoiling it.</p>
      </motion.div>

      {/* Level progress indicator */}
      <div className="flex items-center gap-2">
        {HINT_LABELS.map((h, i) => (
          <div key={h.level} className="flex items-center gap-2 flex-1">
            <div className={`flex-1 flex items-center justify-center py-1.5 px-2 rounded-lg text-xs font-medium border transition-all ${
              hints.find(hint => hint.level === h.level)
                ? h.bg + " " + h.color
                : hintLevel === h.level
                ? "border-white/15 bg-white/5 text-foreground"
                : "border-white/5 bg-transparent text-muted-foreground/40"
            }`}>
              <span className="hidden sm:inline">{h.title}</span>
              <span className="sm:hidden">{h.level}</span>
            </div>
            {i < HINT_LABELS.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground/30 shrink-0" />}
          </div>
        ))}
      </div>

      {/* Input form */}
      <Card className="border-white/5 bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Problem Context</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Problem Title <span className="text-destructive">*</span></label>
            <input
              type="text"
              className="w-full bg-background/60 border border-white/8 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/50 transition-all"
              placeholder="e.g., Two Sum, Valid Parentheses..."
              value={problemTitle}
              onChange={e => setProblemTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Problem Description <span className="text-muted-foreground/50">(Optional)</span></label>
            <textarea
              className="w-full bg-background/60 border border-white/8 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[80px] resize-none placeholder:text-muted-foreground/50 transition-all"
              placeholder="Paste the problem description for more accurate hints..."
              value={problemDescription}
              onChange={e => setProblemDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Language</label>
              <select
                className="w-full bg-background/60 border border-white/8 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                value={language}
                onChange={e => setLanguage(e.target.value)}
              >
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Hint Level</label>
              <div className="flex items-center gap-2 h-9 px-3 bg-background/60 border border-white/8 rounded-lg">
                <span className={`text-sm font-semibold ${HINT_LABELS[Math.min(hintLevel - 1, 4)].color}`}>
                  Level {hintLevel}
                </span>
                <span className="text-xs text-muted-foreground">— {HINT_LABELS[Math.min(hintLevel - 1, 4)].title}</span>
              </div>
            </div>
          </div>
          <Button
            onClick={handleGetHint}
            disabled={getHint.isPending || !problemTitle}
            className="w-full gap-2"
          >
            {getHint.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Getting hint...</>
              : <><Lightbulb className="w-4 h-4" /> Get Level {hintLevel} Hint</>
            }
          </Button>
        </CardContent>
      </Card>

      {/* Hint cards */}
      <AnimatePresence>
        {hints.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Unlock className="w-4 h-4 text-primary" /> Unlocked Hints
            </h2>
            {hints.map((hint, i) => {
              const meta = HINT_LABELS[hint.level - 1];
              return (
                <motion.div
                  key={hint.level}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Card className={`border ${meta.bg}`}>
                    <CardHeader className="py-3 pb-2">
                      <CardTitle className={`text-sm flex items-center gap-2 ${meta.color}`}>
                        <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${meta.bg}`}>
                          Level {hint.level}
                        </span>
                        {meta.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 pb-4">
                      <p className="text-sm text-foreground/90 leading-relaxed">{hint.text}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
            {hints.length < 5 && (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-white/2">
                <Lock className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                <p className="text-xs text-muted-foreground/60">
                  {5 - hints.length} more hint level{5 - hints.length !== 1 ? "s" : ""} available — click above to unlock
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
