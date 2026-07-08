import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, achievementsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { getAuth } from "@clerk/express";

const router = Router();

async function resolveUserId(clerkId: string): Promise<number | null> {
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, clerkId) });
  return user?.id ?? null;
}

router.get("/achievements", async (req, res): Promise<void> => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const userId = await resolveUserId(clerkId);
  if (!userId) { res.json([]); return; }

  try {
    const achievements = await db.query.achievementsTable.findMany({
      where: eq(achievementsTable.userId, userId),
      orderBy: [desc(achievementsTable.earnedAt)],
    });
    res.json(achievements);
  } catch (err) {
    req.log.error({ err }, "Failed to list achievements");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
