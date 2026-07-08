import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";

const router = Router();

router.get("/users/me", async (req, res): Promise<void> => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    let user = await db.query.usersTable.findFirst({
      where: eq(usersTable.clerkId, clerkId),
    });

    if (!user) {
      const [created] = await db.insert(usersTable).values({
        clerkId,
        name: "Student",
        email: `${clerkId}@placeholder.com`,
      }).returning();
      user = created;
    }

    res.json(user);
  } catch (err) {
    req.log.error({ err }, "Failed to get user");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/users/me", async (req, res): Promise<void> => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { name, preferredLanguage, darkMode } = req.body;

  try {
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.clerkId, clerkId),
    });
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    const [updated] = await db
      .update(usersTable)
      .set({
        ...(name !== undefined && { name }),
        ...(preferredLanguage !== undefined && { preferredLanguage }),
        ...(darkMode !== undefined && { darkMode }),
      })
      .where(eq(usersTable.id, user.id))
      .returning();

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update user");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
