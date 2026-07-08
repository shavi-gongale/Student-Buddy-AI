import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import progressRouter from "./progress";
import notesRouter from "./notes";
import bookmarksRouter from "./bookmarks";
import achievementsRouter from "./achievements";
import aiRouter from "./ai";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(progressRouter);
router.use(notesRouter);
router.use(bookmarksRouter);
router.use(achievementsRouter);
router.use(aiRouter);
router.use(dashboardRouter);

export default router;
