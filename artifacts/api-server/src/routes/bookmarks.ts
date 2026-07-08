import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, bookmarksTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { getAuth } from "@clerk/express";

const router = Router();

async function resolveUserId(clerkId: string): Promise<number | null> {
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, clerkId) });
  return user?.id ?? null;
}

router.get("/bookmarks", async (req, res): Promise<void> => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const userId = await resolveUserId(clerkId);
  if (!userId) { res.json([]); return; }

  try {
    const bookmarks = await db.query.bookmarksTable.findMany({
      where: eq(bookmarksTable.userId, userId),
      orderBy: [desc(bookmarksTable.createdAt)],
    });
    res.json(bookmarks);
  } catch (err) {
    req.log.error({ err }, "Failed to list bookmarks");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/bookmarks", async (req, res): Promise<void> => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const userId = await resolveUserId(clerkId);
  if (!userId) { res.status(404).json({ error: "User not found" }); return; }

  const { problemTitle, platform, difficulty, topic, url } = req.body;
  try {
    const [bookmark] = await db.insert(bookmarksTable).values({
      userId,
      problemTitle,
      platform,
      difficulty,
      topic,
      url: url ?? null,
    }).returning();
    res.status(201).json(bookmark);
  } catch (err) {
    req.log.error({ err }, "Failed to create bookmark");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/bookmarks/:id", async (req, res): Promise<void> => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const id = parseInt(req.params.id, 10);
  try {
    await db.delete(bookmarksTable).where(eq(bookmarksTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete bookmark");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
