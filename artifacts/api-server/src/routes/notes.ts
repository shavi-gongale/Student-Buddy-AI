import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, notesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { getAuth } from "@clerk/express";

const router = Router();

async function resolveUserId(clerkId: string): Promise<number | null> {
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, clerkId) });
  return user?.id ?? null;
}

router.get("/notes", async (req, res): Promise<void> => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const userId = await resolveUserId(clerkId);
  if (!userId) { res.json([]); return; }

  try {
    const notes = await db.query.notesTable.findMany({
      where: eq(notesTable.userId, userId),
      orderBy: [desc(notesTable.updatedAt)],
    });
    res.json(notes);
  } catch (err) {
    req.log.error({ err }, "Failed to list notes");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/notes", async (req, res): Promise<void> => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const userId = await resolveUserId(clerkId);
  if (!userId) { res.status(404).json({ error: "User not found" }); return; }

  const { title, content, problemTitle, topic } = req.body;
  try {
    const [note] = await db.insert(notesTable).values({
      userId,
      title,
      content,
      problemTitle: problemTitle ?? null,
      topic: topic ?? null,
    }).returning();
    res.status(201).json(note);
  } catch (err) {
    req.log.error({ err }, "Failed to create note");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/notes/:id", async (req, res): Promise<void> => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const id = parseInt(req.params.id, 10);
  try {
    const note = await db.query.notesTable.findFirst({ where: eq(notesTable.id, id) });
    if (!note) { res.status(404).json({ error: "Not found" }); return; }
    res.json(note);
  } catch (err) {
    req.log.error({ err }, "Failed to get note");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/notes/:id", async (req, res): Promise<void> => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const id = parseInt(req.params.id, 10);
  const { title, content, problemTitle, topic } = req.body;
  try {
    const [updated] = await db.update(notesTable).set({
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(problemTitle !== undefined && { problemTitle }),
      ...(topic !== undefined && { topic }),
    }).where(eq(notesTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update note");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/notes/:id", async (req, res): Promise<void> => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const id = parseInt(req.params.id, 10);
  try {
    await db.delete(notesTable).where(eq(notesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete note");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
