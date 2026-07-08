import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, progressTable, achievementsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { getAuth } from "@clerk/express";

const router = Router();

const ACHIEVEMENT_DEFS = [
  { name: "first_solve",   icon: "🚀", description: "Solve your first problem",           xpReward: 50  },
  { name: "streak_7",      icon: "🔥", description: "Maintain a 7-day streak",             xpReward: 100 },
  { name: "streak_30",     icon: "🎯", description: "Maintain a 30-day streak",            xpReward: 300 },
  { name: "solve_100",     icon: "💎", description: "Solve 100 problems",                  xpReward: 500 },
  { name: "hard_10",       icon: "🧠", description: "Solve 10 Hard problems",              xpReward: 200 },
  { name: "speed_solve",   icon: "⚡", description: "Solve a problem in under 10 minutes", xpReward: 75  },
  { name: "topics_5",      icon: "🌟", description: "Solve problems in 5 different topics",xpReward: 150 },
  { name: "leetcode_50",   icon: "🏆", description: "Solve 50 problems on LeetCode",       xpReward: 250 },
];

async function resolveUserId(clerkId: string): Promise<number | null> {
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, clerkId) });
  return user?.id ?? null;
}

async function computeAndUpdateUserStats(
  userId: number,
  newXpBase: number,
  newStreak: number,
  today: string,
  allProgress: Array<{ status: string; difficulty: string; topic: string; platform: string | null; timeSpentMins: number | null }>,
  currentTimeSpentMins?: number | null,
): Promise<void> {
  // --- Compute topic stats ---
  const topicMap: Record<string, { easy: number; medium: number; hard: number }> = {};
  for (const p of allProgress) {
    if (!topicMap[p.topic]) topicMap[p.topic] = { easy: 0, medium: 0, hard: 0 };
    if (p.difficulty === "Easy") topicMap[p.topic].easy++;
    else if (p.difficulty === "Medium") topicMap[p.topic].medium++;
    else if (p.difficulty === "Hard") topicMap[p.topic].hard++;
  }

  const weakTopics: string[] = [];
  const strongTopics: string[] = [];
  for (const [topic, counts] of Object.entries(topicMap)) {
    const total = counts.easy + counts.medium + counts.hard;
    const hardRatio = counts.hard / total;
    if (total >= 5 && (hardRatio >= 0.3 || counts.medium + counts.hard >= 3)) {
      strongTopics.push(topic);
    } else if (total < 3 || hardRatio < 0.1) {
      weakTopics.push(topic);
    }
  }

  // --- Interview readiness score ---
  const solved = allProgress.filter(p => p.status === "solved");
  const totalSolved = solved.length;
  const hardCount = solved.filter(p => p.difficulty === "Hard").length;
  const mediumCount = solved.filter(p => p.difficulty === "Medium").length;
  const uniqueTopics = Object.keys(topicMap).length;
  const leetcodeSolved = solved.filter(p => p.platform?.toLowerCase().includes("leetcode")).length;

  const baseScore  = Math.min(40, Math.round(totalSolved * 0.5));
  const diffScore  = Math.min(30, Math.round(hardCount * 1.5 + mediumCount * 0.5));
  const topicScore = Math.min(20, uniqueTopics * 2);
  const streakScore = Math.min(10, newStreak);
  const interviewReadinessScore = Math.min(100, baseScore + diffScore + topicScore + streakScore);

  // --- Achievement checking ---
  const existingAchievements = await db.query.achievementsTable.findMany({
    where: eq(achievementsTable.userId, userId),
  });
  const earnedNames = new Set(existingAchievements.map(a => a.name));

  const conditions: Record<string, boolean> = {
    first_solve:  totalSolved >= 1,
    streak_7:     newStreak >= 7,
    streak_30:    newStreak >= 30,
    solve_100:    totalSolved >= 100,
    hard_10:      hardCount >= 10,
    speed_solve:  !!(currentTimeSpentMins && currentTimeSpentMins <= 10),
    topics_5:     uniqueTopics >= 5,
    leetcode_50:  leetcodeSolved >= 50,
  };

  let bonusXp = 0;
  for (const def of ACHIEVEMENT_DEFS) {
    if (!earnedNames.has(def.name) && conditions[def.name]) {
      await db.insert(achievementsTable).values({
        userId,
        name: def.name,
        description: def.description,
        icon: def.icon,
        xpReward: def.xpReward,
      });
      bonusXp += def.xpReward;
    }
  }

  // --- Final XP and level (including achievement bonuses) ---
  const finalXp = newXpBase + bonusXp;
  const finalLevel = Math.floor(finalXp / 100) + 1;

  await db.update(usersTable)
    .set({
      xp: finalXp,
      level: finalLevel,
      streak: newStreak,
      lastActiveDate: today,
      weakTopics,
      strongTopics,
      interviewReadinessScore,
    })
    .where(eq(usersTable.id, userId));
}

router.get("/progress", async (req, res): Promise<void> => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const userId = await resolveUserId(clerkId);
  if (!userId) { res.json([]); return; }

  try {
    const entries = await db.query.progressTable.findMany({
      where: eq(progressTable.userId, userId),
      orderBy: [desc(progressTable.createdAt)],
    });
    res.json(entries);
  } catch (err) {
    req.log.error({ err }, "Failed to list progress");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/progress", async (req, res): Promise<void> => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const userId = await resolveUserId(clerkId);
  if (!userId) { res.status(404).json({ error: "User not found" }); return; }

  const { problemTitle, platform, difficulty, topic, status, language, timeSpentMins } = req.body;

  try {
    const [entry] = await db.insert(progressTable).values({
      userId,
      problemTitle,
      platform,
      difficulty,
      topic,
      status: status ?? "solved",
      language,
      timeSpentMins: timeSpentMins ?? null,
    }).returning();

    // --- XP gain for this solve ---
    const xpMap: Record<string, number> = { Easy: 10, Medium: 25, Hard: 50 };
    const xpGain = xpMap[difficulty] ?? 10;

    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });
    if (user) {
      const newXpBase = user.xp + xpGain;

      // --- Streak calculation ---
      const today = new Date().toISOString().split("T")[0];
      let newStreak = 1;
      if (user.lastActiveDate) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];
        if (user.lastActiveDate === today) {
          newStreak = user.streak;           // already active today — keep streak
        } else if (user.lastActiveDate === yesterdayStr) {
          newStreak = user.streak + 1;       // consecutive day
        } else {
          newStreak = 1;                     // streak broken
        }
      }

      // --- Fetch all progress AFTER the insert so totals are accurate ---
      const allProgress = await db.query.progressTable.findMany({
        where: eq(progressTable.userId, userId),
      });

      await computeAndUpdateUserStats(
        userId,
        newXpBase,
        newStreak,
        today,
        allProgress,
        timeSpentMins ?? null,
      );
    }

    res.status(201).json(entry);
  } catch (err) {
    req.log.error({ err }, "Failed to create progress");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/progress/:id", async (req, res): Promise<void> => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const id = parseInt(req.params.id, 10);
  try {
    await db.delete(progressTable).where(eq(progressTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete progress");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
