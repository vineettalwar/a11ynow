import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, auditsTable } from "@workspace/db";
import { buildA11yFixPdf } from "../lib/a11y-fix-pdf";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/audit/:auditId/a11y-fix-pdf", async (req, res): Promise<void> => {
  const { auditId } = req.params;

  if (!auditId || !/^[0-9a-f-]{36}$/i.test(auditId)) {
    res.status(400).json({ error: "invalid_id", message: "Invalid audit ID." });
    return;
  }

  try {
    const rows = await db.select().from(auditsTable).where(eq(auditsTable.auditId, auditId)).limit(1);

    if (rows.length === 0) {
      res.status(404).json({ error: "not_found", message: "Audit result not found." });
      return;
    }

    const row = rows[0]!;
    logger.info({ auditId }, "Generating A11y Fix PDF report");

    const pdfBuffer = await buildA11yFixPdf(row);
    const safeHost = row.url.replace(/[^a-z0-9]/gi, "_").slice(0, 50);
    const filename = `a11y-fix-report-${safeHost}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.setHeader("Cache-Control", "no-store");
    res.send(pdfBuffer);
  } catch (err) {
    logger.error({ err, auditId }, "A11y Fix PDF generation failed");
    res.status(500).json({ error: "pdf_failed", message: "Could not generate the A11y Fix PDF." });
  }
});

export default router;
