import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, progressTable, bookmarksTable, notesTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { getAuth } from "@clerk/express";

const router = Router();

const DAILY_CHALLENGES = [
  { title: "Two Sum", platform: "LeetCode", difficulty: "Easy", topic: "Arrays", url: "https://leetcode.com/problems/two-sum/", description: "Find two numbers that add up to a target value." },
  { title: "Longest Substring Without Repeating Characters", platform: "LeetCode", difficulty: "Medium", topic: "Sliding Window", url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/", description: "Find the length of the longest substring without repeating characters." },
  { title: "Merge K Sorted Lists", platform: "LeetCode", difficulty: "Hard", topic: "Linked Lists", url: "https://leetcode.com/problems/merge-k-sorted-lists/", description: "Merge k sorted linked lists and return it as one sorted list." },
  { title: "Valid Parentheses", platform: "LeetCode", difficulty: "Easy", topic: "Stack", url: "https://leetcode.com/problems/valid-parentheses/", description: "Determine if the input string of brackets is valid." },
  { title: "Binary Search", platform: "LeetCode", difficulty: "Easy", topic: "Binary Search", url: "https://leetcode.com/problems/binary-search/", description: "Given an array of integers, implement binary search." },
  { title: "Maximum Subarray", platform: "LeetCode", difficulty: "Medium", topic: "Dynamic Programming", url: "https://leetcode.com/problems/maximum-subarray/", description: "Find the contiguous subarray with the largest sum." },
  { title: "Climbing Stairs", platform: "LeetCode", difficulty: "Easy", topic: "Dynamic Programming", url: "https://leetcode.com/problems/climbing-stairs/", description: "Count ways to climb n stairs taking 1 or 2 steps at a time." },
  { title: "Number of Islands", platform: "LeetCode", difficulty: "Medium", topic: "Graphs", url: "https://leetcode.com/problems/number-of-islands/", description: "Count the number of islands in a 2D grid." },
  { title: "LRU Cache", platform: "LeetCode", difficulty: "Medium", topic: "HashMaps", url: "https://leetcode.com/problems/lru-cache/", description: "Design a data structure that implements LRU cache." },
  { title: "Word Ladder", platform: "LeetCode", difficulty: "Hard", topic: "BFS", url: "https://leetcode.com/problems/word-ladder/", description: "Find the shortest transformation sequence from beginWord to endWord." },
];

async function resolveUserId(clerkId: string): Promise<number | null> {
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, clerkId) });
  return user?.id ?? null;
}

router.get("/dashboard/stats", async (req, res): Promise<void> => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const userId = await resolveUserId(clerkId);
  if (!userId) {
    res.json({
      totalSolved: 0, easyCount: 0, mediumCount: 0, hardCount: 0,
      currentStreak: 0, xp: 0, level: 1, interviewReadinessScore: 0,
      totalBookmarks: 0, totalNotes: 0, topicsCount: 0,
    });
    return;
  }

  try {
    const [user, allProgress, bookmarkRows, noteRows] = await Promise.all([
      db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) }),
      db.query.progressTable.findMany({ where: eq(progressTable.userId, userId) }),
      db.select({ count: sql<number>`count(*)` }).from(bookmarksTable).where(eq(bookmarksTable.userId, userId)),
      db.select({ count: sql<number>`count(*)` }).from(notesTable).where(eq(notesTable.userId, userId)),
    ]);

    const solvedProblems = allProgress.filter((p: any) => p.status === "solved");
    const topicsSet = new Set(allProgress.map((p: any) => p.topic));

    res.json({
      totalSolved: solvedProblems.length,
      easyCount: solvedProblems.filter((p: any) => p.difficulty === "Easy").length,
      mediumCount: solvedProblems.filter((p: any) => p.difficulty === "Medium").length,
      hardCount: solvedProblems.filter((p: any) => p.difficulty === "Hard").length,
      currentStreak: user?.streak ?? 0,
      xp: user?.xp ?? 0,
      level: user?.level ?? 1,
      interviewReadinessScore: user?.interviewReadinessScore ?? 0,
      totalBookmarks: Number(bookmarkRows[0]?.count ?? 0),
      totalNotes: Number(noteRows[0]?.count ?? 0),
      topicsCount: topicsSet.size,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get dashboard stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/topic-breakdown", async (req, res): Promise<void> => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const userId = await resolveUserId(clerkId);
  if (!userId) { res.json([]); return; }

  try {
    const allProgress = await db.query.progressTable.findMany({
      where: eq(progressTable.userId, userId),
    });

    const topicMap: Record<string, number> = {};
    for (const p of allProgress) {
      topicMap[p.topic] = (topicMap[p.topic] ?? 0) + 1;
    }

    const total = allProgress.length;
    const breakdown = Object.entries(topicMap)
      .map(([topic, count]) => ({
        topic,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    res.json(breakdown);
  } catch (err) {
    req.log.error({ err }, "Failed to get topic breakdown");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/recent-activity", async (req, res): Promise<void> => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const userId = await resolveUserId(clerkId);
  if (!userId) { res.json([]); return; }

  try {
    const recent = await db.query.progressTable.findMany({
      where: eq(progressTable.userId, userId),
      orderBy: [desc(progressTable.createdAt)],
      limit: 10,
    });
    res.json(recent);
  } catch (err) {
    req.log.error({ err }, "Failed to get recent activity");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/daily-challenge", async (_req, res): Promise<void> => {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const dayOfYear = Math.floor((Date.now() - start.getTime()) / 86400000);
  const challenge = DAILY_CHALLENGES[dayOfYear % DAILY_CHALLENGES.length];
  res.json(challenge);
});

export default router;
