import { Router, type IRouter } from "express";
import healthRouter from "./health";
import auditRouter from "./audit";
import leadsRouter from "./leads";
import screenReaderPreviewRouter from "./screen-reader-preview";
import pageScreenshotRouter from "./page-screenshot";

const router: IRouter = Router();

router.use(healthRouter);
router.use(auditRouter);
router.use(leadsRouter);
router.use(screenReaderPreviewRouter);
router.use(pageScreenshotRouter);

export default router;
