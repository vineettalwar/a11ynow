import { Router, type IRouter } from "express";
import healthRouter from "./health";
import auditRouter from "./audit";
import auditBatchRouter from "./audit-batch";
import auditBatchPdfRouter from "./audit-batch-pdf";
import auditPdfRouter from "./audit-pdf";
import a11yFixPdfRouter from "./a11y-fix-pdf";
import leadsRouter from "./leads";
import monitorRouter from "./monitor";
import screenReaderPreviewRouter from "./screen-reader-preview";
import pageScreenshotRouter from "./page-screenshot";
import focusOrderRouter from "./focus-order";

const router: IRouter = Router();

router.use(healthRouter);
router.use(auditBatchRouter);
router.use(auditBatchPdfRouter);
router.use(auditRouter);
router.use(auditPdfRouter);
router.use(a11yFixPdfRouter);
router.use(leadsRouter);
router.use(monitorRouter);
router.use(screenReaderPreviewRouter);
router.use(pageScreenshotRouter);
router.use(focusOrderRouter);

export default router;
