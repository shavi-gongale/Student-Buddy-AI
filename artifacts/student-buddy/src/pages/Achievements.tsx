import type { ElementType } from "react";
import { useListAchievements } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Lock, Trophy, Star, Flame, Zap, CheckCircle, Target, BookOpen, Brain } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, ElementType> = {
  star: Star, flame: Flame, zap: Zap, checkCircle: CheckCircle,
  target: Target, bookOpen: BookOpen, brain: Brain, trophy: Trophy, award: Award,
};

const COLOR_MAP: Record<string, { ring: string; glow: string; bg: string; text: string }> = {
  bronze: { ring: "border-amber-600/40", glow: "shadow-amber-600/15", bg: "bg-amber-600/10", text: "text-amber-500" },
  silver: { ring: "border-slate-400/40", glow: "shadow-slate-400/15", bg: "bg-slate-400/10", text: "text-slate-300" },
  gold: { ring: "border-yellow-400/40", glow: "shadow-yellow-400/20", bg: "bg-yellow-400/10", text: "text-yellow-400" },
  platinum: { ring: "border-primary/40", glow: "shadow-primary/20", bg: "bg-primary/10", text: "text-primary" },
};

export default function Achievements() {
  const { data: achievementsRaw, isLoading } = useListAchievements();
  const achievements = Array.isArray(achievementsRaw) ? achievementsRaw : [];

  const earned = achievements.filter((a: any) => a.earnedAt);
  const locked = achievements.filter((a: any) => !a.earnedAt);

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl bg-yellow-400/10 border border-yellow-400/20">
            <Trophy className="w-5 h-5 text-yellow-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">Achievements</h1>
        </div>
        <p className="text-muted-foreground text-sm ml-14">
          {earned.length} of {(achievements ?? []).length} unlocked
        </p>
      </motion.div>

      {/* Progress bar */}
      {!isLoading && (achievements ?? []).length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>{earned.length} earned</span>
            <span>{Math.round((earned.length / Math.max((achievements ?? []).length, 1)) * 100)}% complete</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-yellow-400 to-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(earned.length / Math.max((achievements ?? []).length, 1)) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </motion.div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
        </div>
      ) : (achievements ?? []).length === 0 ? (
        <div className="text-center py-16">
          <div className="p-4 rounded-2xl bg-white/3 w-fit mx-auto mb-4">
            <Award className="w-10 h-10 opacity-20" />
          </div>
          <p className="font-medium text-foreground/60">No achievements yet</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Start solving problems to earn achievements!</p>
        </div>
      ) : (
        <div className="space-y-8">
          {earned.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" /> Earned ({earned.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {earned.map((a: any, i: number) => {
                  const tier = a.tier ?? "bronze";
                  const colors = COLOR_MAP[tier] ?? COLOR_MAP.bronze;
                  const Icon = ICON_MAP[a.icon ?? "star"] ?? Star;
                  return (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, y: 12, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: i * 0.06 }}
                    >
                      <Card className={cn("border relative overflow-hidden hover:scale-[1.02] transition-all duration-300", colors.ring)}>
                        <div className={cn("absolute inset-0 opacity-30", colors.bg)} />
                        <CardContent className="relative p-5">
                          <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center mb-3", colors.ring, colors.bg)}>
                            <Icon className={cn("w-5 h-5", colors.text)} />
                          </div>
                          <h3 className="font-semibold text-sm mb-1">{a.title}</h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">{a.description}</p>
                          <div className="flex items-center gap-2 mt-3">
                            <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border capitalize", colors.text, colors.ring, colors.bg)}>
                              {tier}
                            </span>
                            {a.earnedAt && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(a.earnedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {locked.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground/60 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Lock className="w-4 h-4" /> Locked ({locked.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {locked.map((a: any, i: number) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Card className="border-white/5 bg-card opacity-50 hover:opacity-70 transition-opacity">
                      <CardContent className="p-5">
                        <div className="w-10 h-10 rounded-xl border border-white/8 bg-white/3 flex items-center justify-center mb-3">
                          <Lock className="w-4 h-4 text-muted-foreground/40" />
                        </div>
                        <h3 className="font-semibold text-sm mb-1 text-muted-foreground">{a.title}</h3>
                        <p className="text-xs text-muted-foreground/60 leading-relaxed">{a.description}</p>
                        {a.requirement && (
                          <p className="text-xs text-primary/60 mt-2 border-t border-white/5 pt-2">{a.requirement}</p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
