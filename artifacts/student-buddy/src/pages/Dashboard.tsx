import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Flame, Target, Star, ExternalLink, Trophy, Activity, TrendingUp, TrendingDown, Zap, Brain, BookMarked, StickyNote } from "lucide-react";
import { RadialBarChart, RadialBar, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  useGetDashboardStats,
  useGetTopicBreakdown,
  useGetRecentActivity,
  useGetDailyChallenge,
  useGetMe,
} from "@workspace/api-client-react";

const DIFF_COLORS: Record<string, string> = {
  Easy: "text-green-400",
  Medium: "text-yellow-400",
  Hard: "text-red-400",
};

const DIFF_BG: Record<string, string> = {
  Easy: "border-green-500/20 bg-green-500/5 text-green-400",
  Medium: "border-yellow-500/20 bg-yellow-500/5 text-yellow-400",
  Hard: "border-red-500/20 bg-red-500/5 text-red-400",
};

const PIE_COLORS = ["#00e5ff", "#7c3aed", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899", "#14b8a6"];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } }
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

function CircularProgress({ value, size = 80, strokeWidth = 6, color = "#00e5ff", label, sublabel }: {
  value: number; size?: number; strokeWidth?: number; color?: string; label: string; sublabel?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - dash}
            style={{ transition: "stroke-dashoffset 1s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-bold leading-none" style={{ color }}>{value}%</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-medium text-foreground">{label}</p>
        {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, gradient, glow }: {
  icon: ReactNode; label: string; value: string | number; sub?: string;
  gradient: string; glow?: string;
}) {
  return (
    <motion.div variants={item}>
      <Card className="relative overflow-hidden border-white/5 bg-card hover:border-white/10 transition-all duration-300 group">
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${gradient}`} />
        <CardContent className="p-5 relative">
          <div className="flex items-start justify-between mb-3">
            <div className={`p-2 rounded-lg ${glow ?? "bg-white/5"}`}>
              {icon}
            </div>
            <TrendingUp className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
          </div>
          <div className="text-2xl font-bold tracking-tight">{value}</div>
          <p className="text-sm text-muted-foreground mt-1">{label}</p>
          {sub && <p className="text-xs text-muted-foreground/60 mt-0.5">{sub}</p>}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: topicsRaw, isLoading: topicsLoading } = useGetTopicBreakdown();
  const { data: recentRaw, isLoading: recentLoading } = useGetRecentActivity();
  const { data: challenge, isLoading: challengeLoading } = useGetDailyChallenge();
  const { data: user } = useGetMe({ query: { queryKey: [] } });

  // Normalize array responses — API may return wrapped objects in some cases
  const topics = Array.isArray(topicsRaw) ? topicsRaw : [];
  const recent = Array.isArray(recentRaw) ? recentRaw : [];

  const xpInLevel = (stats?.xp ?? 0) % 100;
  const readiness = stats?.interviewReadinessScore ?? 0;

  return (
    <motion.div
      className="p-5 md:p-8 space-y-6 max-w-7xl mx-auto"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"} 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Here's your coding progress at a glance.</p>
        </div>
        {stats && (
          <div className="hidden sm:flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-4 py-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">{stats.xp?.toLocaleString()} XP</span>
          </div>
        )}
      </motion.div>

      {/* Stat Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              icon={<CheckCircle className="w-4 h-4 text-primary" />}
              label="Total Solved"
              value={stats?.totalSolved ?? 0}
              sub={`E${stats?.easyCount} M${stats?.mediumCount} H${stats?.hardCount}`}
              gradient="bg-gradient-to-br from-primary/5 to-transparent"
              glow="bg-primary/10"
            />
            <StatCard
              icon={<Flame className="w-4 h-4 text-orange-400" />}
              label="Day Streak"
              value={`${stats?.currentStreak ?? 0} 🔥`}
              sub="Keep it going!"
              gradient="bg-gradient-to-br from-orange-500/5 to-transparent"
              glow="bg-orange-400/10"
            />
            <StatCard
              icon={<Star className="w-4 h-4 text-yellow-400" />}
              label="Current Level"
              value={`Lvl ${stats?.level ?? 1}`}
              sub={`${xpInLevel}/100 XP to next`}
              gradient="bg-gradient-to-br from-yellow-500/5 to-transparent"
              glow="bg-yellow-400/10"
            />
            <StatCard
              icon={<Target className="w-4 h-4 text-green-400" />}
              label="Readiness"
              value={`${readiness}%`}
              sub={readiness >= 70 ? "Interview ready!" : "Keep practicing"}
              gradient="bg-gradient-to-br from-green-500/5 to-transparent"
              glow="bg-green-400/10"
            />
          </>
        )}
      </div>

      {/* Progress + Readiness Ring Row */}
      {!statsLoading && stats && (
        <motion.div variants={item} className="grid gap-4 md:grid-cols-3">
          {/* XP Progress */}
          <Card className="md:col-span-2 border-white/5 bg-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium">Level {stats?.level ?? 1} → {(stats?.level ?? 1) + 1}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{xpInLevel} / 100 XP to next level</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{stats.xp?.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total XP</p>
                </div>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-cyan-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpInLevel}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                />
              </div>
              {/* Difficulty mini stats */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { label: "Easy", count: stats.easyCount ?? 0, color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
                  { label: "Medium", count: stats.mediumCount ?? 0, color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" },
                  { label: "Hard", count: stats.hardCount ?? 0, color: "text-red-400", bg: "bg-red-400/10 border-red-400/20" },
                ].map(d => (
                  <div key={d.label} className={`rounded-lg border p-3 text-center ${d.bg}`}>
                    <div className={`text-xl font-bold ${d.color}`}>{d.count}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{d.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Interview Readiness Ring */}
          <Card className="border-white/5 bg-card">
            <CardContent className="p-5 flex flex-col items-center justify-center h-full gap-4">
              <p className="text-sm font-medium text-muted-foreground">Interview Readiness</p>
              <CircularProgress
                value={readiness}
                size={100}
                strokeWidth={8}
                color={readiness >= 70 ? "#22c55e" : readiness >= 40 ? "#f59e0b" : "#00e5ff"}
                label=""
              />
              <div className="text-center">
                <p className="text-sm font-semibold">
                  {readiness >= 70 ? "🎯 Ready to Interview!" : readiness >= 40 ? "📈 Making Progress" : "🚀 Just Getting Started"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {readiness >= 70 ? "Apply to your dream company" : `${70 - readiness}% more to reach ready status`}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Weak / Strong Topics */}
      {user && (user.weakTopics?.length > 0 || user.strongTopics?.length > 0) && (
        <motion.div variants={item} className="grid gap-4 md:grid-cols-2">
          {user.weakTopics?.length > 0 && (
            <Card className="border-white/5 bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TrendingDown className="w-4 h-4 text-orange-400" />
                  <span>Topics to Improve</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {user.weakTopics.map(t => (
                    <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-orange-400/10 border border-orange-400/20 text-orange-400 font-medium">
                      {t}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {user.strongTopics?.length > 0 && (
            <Card className="border-white/5 bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Brain className="w-4 h-4 text-green-400" />
                  <span>Strong Topics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {user.strongTopics.map(t => (
                    <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-green-400/10 border border-green-400/20 text-green-400 font-medium">
                      {t}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Daily Challenge */}
        <motion.div variants={item}>
          <Card className="border-white/5 bg-card hover:border-primary/20 transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-1.5 rounded-lg bg-yellow-400/10">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                </div>
                Daily Challenge
              </CardTitle>
            </CardHeader>
            <CardContent>
              {challengeLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ) : challenge ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-base leading-tight">{challenge.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{challenge.platform} • {challenge.topic}</p>
                    </div>
                    <Badge className={`shrink-0 text-xs border ${DIFF_BG[challenge.difficulty ?? "Medium"]}`} variant="outline">
                      {challenge.difficulty}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{challenge.description}</p>
                  {challenge.url && (
                    <a
                      href={challenge.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:glow-primary-sm"
                    >
                      Solve Today's Challenge <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={item}>
          <Card className="border-white/5 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Activity className="w-4 h-4 text-primary" />
                </div>
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-11 w-full rounded-lg" />)}
                </div>
              ) : !recent || recent.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">No activity yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Start solving problems to track progress!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recent.slice(0, 5).map((p, i) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/3 transition-colors"
                    >
                      <div className={`w-1.5 h-8 rounded-full shrink-0 ${
                        p.difficulty === "Easy" ? "bg-green-400" :
                        p.difficulty === "Hard" ? "bg-red-400" : "bg-yellow-400"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.problemTitle}</p>
                        <p className="text-xs text-muted-foreground">{p.platform} • {p.topic}</p>
                      </div>
                      <Badge variant="outline" className={`text-xs shrink-0 border ${DIFF_BG[p.difficulty] ?? ""}`}>
                        {p.difficulty}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Topic Breakdown Chart */}
      {!topicsLoading && topics && topics.length > 0 && (
        <motion.div variants={item}>
          <Card className="border-white/5 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="p-1.5 rounded-lg bg-purple-400/10">
                  <BookMarked className="w-4 h-4 text-purple-400" />
                </div>
                Topic Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="w-full md:w-44 h-44 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topics}
                        dataKey="count"
                        nameKey="topic"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        innerRadius={32}
                        paddingAngle={3}
                      >
                        {topics.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "hsl(222,47%,8%)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 10,
                          color: "hsl(213,31%,91%)",
                          fontSize: 12,
                        }}
                        formatter={(v: number, n: string) => [`${v} problems`, n]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-2.5 w-full">
                  {topics.slice(0, 10).map((t, i) => (
                    <div key={t.topic} className="flex items-center gap-2 text-sm">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="truncate text-muted-foreground text-xs">{t.topic}</span>
                      <span className="ml-auto font-semibold text-xs shrink-0">{t.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick Stats Row */}
      {!statsLoading && stats && (
        <motion.div variants={item} className="grid grid-cols-3 gap-3">
          {[
            { icon: BookMarked, label: "Bookmarks", value: stats.totalBookmarks ?? 0, color: "text-blue-400", bg: "bg-blue-400/10" },
            { icon: StickyNote, label: "Notes", value: stats.totalNotes ?? 0, color: "text-purple-400", bg: "bg-purple-400/10" },
            { icon: Brain, label: "Topics Covered", value: stats.topicsCount ?? 0, color: "text-teal-400", bg: "bg-teal-400/10" },
          ].map(s => (
            <Card key={s.label} className="border-white/5 bg-card">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${s.bg}`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <div>
                  <p className="text-lg font-bold leading-none">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
