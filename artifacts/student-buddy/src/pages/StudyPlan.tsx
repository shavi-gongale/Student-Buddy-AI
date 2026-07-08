import { useState } from "react";
import { useGenerateStudyPlan } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar, Loader2, Plus, X, Clock, CheckSquare, Sparkles, Target, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const SUGGESTED_TOPICS = [
  "Arrays", "Linked Lists", "Trees", "Graphs", "Dynamic Programming",
  "Binary Search", "Sorting", "Recursion", "Stack", "Heaps",
  "Two Pointers", "Sliding Window", "BFS", "DFS", "Tries",
];
const COMPANIES = ["Google", "Meta", "Amazon", "Apple", "Microsoft", "Netflix", "Uber", "Airbnb"];
const DURATIONS = [7, 14, 21, 30];

interface StudyPlanDay {
  day: number;
  topic: string;
  tasks: string[];
  estimatedHours: number;
}
interface GeneratedPlan {
  overview: string;
  plan: StudyPlanDay[];
}

export default function StudyPlan() {
  const generatePlan = useGenerateStudyPlan();
  const { toast } = useToast();

  const [weakTopics, setWeakTopics] = useState<string[]>([]);
  const [topicInput, setTopicInput] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [customCompany, setCustomCompany] = useState("");
  const [durationDays, setDurationDays] = useState(14);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  function addTopic(topic: string) {
    const t = topic.trim();
    if (t && !weakTopics.includes(t)) {
      setWeakTopics(prev => [...prev, t]);
      setTopicInput("");
    }
  }
  function removeTopic(topic: string) {
    setWeakTopics(prev => prev.filter(x => x !== topic));
  }
  const effectiveCompany = COMPANIES.includes(targetCompany) ? targetCompany : customCompany;

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (weakTopics.length === 0) {
      toast({ title: "Select topics", description: "Pick at least one weak topic to focus on.", variant: "destructive" });
      return;
    }
    try {
      const result = await generatePlan.mutateAsync({
        data: { weakTopics, targetCompany: effectiveCompany || undefined, durationDays }
      });
      setGeneratedPlan(result as GeneratedPlan);
      toast({ title: "Plan ready! 🗓️", description: `${durationDays}-day personalized plan generated.` });
      setExpandedDay(null);
    } catch {
      toast({ title: "Error", description: "Failed to generate study plan.", variant: "destructive" });
    }
  }

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl bg-purple-400/10 border border-purple-400/20">
            <Calendar className="w-5 h-5 text-purple-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">Study Plan Generator</h1>
        </div>
        <p className="text-muted-foreground text-sm ml-14">AI-powered personalized roadmap based on your weak areas.</p>
      </motion.div>

      {/* Config form */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-white/5 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Configure Your Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-5">
              {/* Duration */}
              <div>
                <label className="text-sm font-medium mb-2 block">Plan Duration</label>
                <div className="flex gap-2">
                  {DURATIONS.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDurationDays(d)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                        durationDays === d
                          ? "bg-primary/15 text-primary border-primary/30"
                          : "border-white/8 text-muted-foreground hover:border-white/20 hover:text-foreground"
                      }`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>

              {/* Topics */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Weak Topics <span className="text-destructive">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {SUGGESTED_TOPICS.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => weakTopics.includes(t) ? removeTopic(t) : addTopic(t)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        weakTopics.includes(t)
                          ? "bg-primary/15 text-primary border-primary/30"
                          : "border-white/8 text-muted-foreground hover:border-white/20"
                      }`}
                    >
                      {weakTopics.includes(t) ? "✓ " : ""}{t}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom topic..."
                    value={topicInput}
                    onChange={e => setTopicInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTopic(topicInput); } }}
                    className="bg-background/60"
                  />
                  <Button type="button" variant="outline" size="icon" onClick={() => addTopic(topicInput)} disabled={!topicInput}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {weakTopics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {weakTopics.map(t => (
                      <Badge key={t} variant="secondary" className="gap-1 text-xs pr-1">
                        {t}
                        <button type="button" onClick={() => removeTopic(t)} className="hover:text-destructive">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Company */}
              <div>
                <label className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Target className="w-3.5 h-3.5 text-muted-foreground" />
                  Target Company <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {COMPANIES.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => { setTargetCompany(targetCompany === c ? "" : c); setCustomCompany(""); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        targetCompany === c
                          ? "bg-primary/15 text-primary border-primary/30"
                          : "border-white/8 text-muted-foreground hover:border-white/20"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                {!COMPANIES.includes(targetCompany) && (
                  <Input
                    placeholder="Type another company..."
                    value={customCompany}
                    onChange={e => setCustomCompany(e.target.value)}
                    className="bg-background/60"
                  />
                )}
              </div>

              <Button type="submit" disabled={generatePlan.isPending || weakTopics.length === 0} className="w-full gap-2">
                {generatePlan.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating your plan...</>
                  : <><Sparkles className="w-4 h-4" /> Generate {durationDays}-Day Study Plan</>
                }
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Loading skeleton */}
      {generatePlan.isPending && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      )}

      {/* Generated Plan */}
      <AnimatePresence>
        {generatedPlan && !generatePlan.isPending && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Card className="border-primary/25 bg-primary/5">
              <CardContent className="py-4 px-5">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <p className="text-sm font-semibold text-primary">Plan Overview</p>
                </div>
                <p className="text-sm text-foreground/85 leading-relaxed">{generatedPlan.overview}</p>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {generatedPlan.plan.length}-Day Schedule
              </h2>
              <span className="text-xs text-muted-foreground">
                {generatedPlan.plan.reduce((sum, d) => sum + d.estimatedHours, 0)}h total
              </span>
            </div>

            <div className="space-y-2">
              {generatedPlan.plan.map((day, i) => (
                <motion.div
                  key={day.day}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card
                    className={`cursor-pointer transition-all duration-200 border-white/5 hover:border-white/10 ${expandedDay === day.day ? "border-primary/30 bg-primary/3" : ""}`}
                    onClick={() => setExpandedDay(expandedDay === day.day ? null : day.day)}
                  >
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                          D{day.day}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{day.topic}</p>
                          <p className="text-xs text-muted-foreground">{day.tasks.length} tasks</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {day.estimatedHours}h
                          </span>
                          {expandedDay === day.day
                            ? <ChevronUp className="w-4 h-4 text-muted-foreground/60" />
                            : <ChevronDown className="w-4 h-4 text-muted-foreground/40" />
                          }
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedDay === day.day && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 pt-3 border-t border-white/5"
                          >
                            <ul className="space-y-2">
                              {day.tasks.map((task, ti) => (
                                <li key={ti} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                                  <CheckSquare className="w-4 h-4 text-primary/60 shrink-0 mt-0.5" />
                                  {task}
                                </li>
                              ))}
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
