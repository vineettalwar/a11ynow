import { buildA11yFixPdf } from "@/server/a11y-fix-pdf";
import { dbRowToAuditResult } from "@/server/audit-mapper";
import { logger } from "@/server/logger";
import { jsonErr } from "@/server/http";
import { findAuditById } from "@/server/storage/audits";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ auditId: string }> },
) {
  const { auditId } = await params;

  if (!auditId || !/^[0-9a-f-]{36}$/i.test(auditId)) {
    return jsonErr(400, "invalid_id", "Invalid audit ID.");
  }

  try {
    const row = await findAuditById(auditId);
    if (!row) {
      return jsonErr(404, "not_found", "Audit result not found.");
    }

    logger.info({ auditId }, "Generating A11y Fix PDF report");

    const audit = await dbRowToAuditResult(row);
    const pdfBuffer = await buildA11yFixPdf({ ...row, violations: audit.violations });
    const safeHost = row.url.replace(/[^a-z0-9]/gi, "_").slice(0, 50);
    const filename = `a11y-fix-report-${safeHost}.pdf`;

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    logger.error({ err, auditId }, "A11y Fix PDF generation failed");
    return jsonErr(500, "pdf_failed", "Could not generate the A11y Fix PDF.");
  }
}
