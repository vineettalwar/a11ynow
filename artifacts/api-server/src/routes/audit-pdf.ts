import { Router, type IRouter } from "express";
import PDFDocument from "pdfkit";
import { eq } from "drizzle-orm";
import { db, auditsTable } from "@workspace/db";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const BRAND_ORANGE = "#FF4D1C";
const BRAND_DARK = "#1a1a1a";
const BRAND_MID = "#555555";
const BRAND_LIGHT = "#888888";
const BRAND_RULE = "#e5e5e5";
const PAGE_MARGIN = 52;
const PAGE_WIDTH = 595.28;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;

type ImpactLevel = "critical" | "serious" | "moderate" | "minor";

const IMPACT_COLORS: Record<ImpactLevel, string> = {
  critical: "#DC2626",
  serious: "#EA580C",
  moderate: "#D97706",
  minor: "#6B7280",
};

function impactColor(impact: string): string {
  return IMPACT_COLORS[impact as ImpactLevel] ?? "#6B7280";
}

function scoreColor(score: number): string {
  if (score >= 80) return "#059669";
  if (score >= 60) return "#D97706";
  if (score >= 40) return "#EA580C";
  return "#DC2626";
}

function levelLabel(level: string): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

interface AuditViolationData {
  id: string;
  wcagCriteria: string;
  description: string;
  impact: ImpactLevel;
  affectedElements: number;
}

interface AuditRow {
  auditId: string;
  url: string;
  scannedAt: Date;
  score: number;
  level: string;
  totalViolations: number;
  criticalViolations: number;
  seriousViolations: number;
  violations: unknown;
  passedChecks: number;
  totalChecks: number;
}

function buildPdf(row: AuditRow): Buffer {
  const violations = (row.violations as AuditViolationData[]) ?? [];
  const top10 = violations.slice(0, 10);

  const chunks: Buffer[] = [];
  const doc = new PDFDocument({
    size: "A4",
    margin: PAGE_MARGIN,
    info: {
      Title: `Accessibility Audit — ${row.url}`,
      Author: "accessibility.now",
      Subject: "WCAG 2.1 AA Compliance Report",
      Creator: "accessibility.now automated scanner",
    },
    compress: true,
  });

  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const scannedDate = new Date(row.scannedAt).toLocaleString("en-GB", {
    dateStyle: "long",
    timeStyle: "short",
  });

  /* ── Header bar ─────────────────────────────────────────────── */
  doc
    .rect(0, 0, PAGE_WIDTH, 72)
    .fill(BRAND_DARK);

  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .fillColor("#FFFFFF")
    .text("accessibility", PAGE_MARGIN, 24, { continued: true })
    .fillColor(BRAND_ORANGE)
    .text(".now");

  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor("rgba(255,255,255,0.55)")
    .text("WCAG 2.1 AA Compliance Report", PAGE_MARGIN, 50);

  /* ── Meta block ─────────────────────────────────────────────── */
  let y = 96;

  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor(BRAND_LIGHT)
    .text("URL AUDITED", PAGE_MARGIN, y);

  y += 14;
  doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .fillColor(BRAND_DARK)
    .text(row.url, PAGE_MARGIN, y, { width: CONTENT_WIDTH - 120, lineBreak: false });

  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor(BRAND_LIGHT)
    .text("SCAN DATE", PAGE_WIDTH - PAGE_MARGIN - 110, y - 14, { width: 110 });

  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor(BRAND_MID)
    .text(scannedDate, PAGE_WIDTH - PAGE_MARGIN - 110, y, { width: 110 });

  y += 28;
  doc
    .moveTo(PAGE_MARGIN, y)
    .lineTo(PAGE_WIDTH - PAGE_MARGIN, y)
    .strokeColor(BRAND_RULE)
    .lineWidth(0.5)
    .stroke();

  /* ── Score callout ──────────────────────────────────────────── */
  y += 20;

  const scoreBoxW = 120;
  const scoreBoxH = 80;
  doc
    .roundedRect(PAGE_MARGIN, y, scoreBoxW, scoreBoxH, 8)
    .fillAndStroke("#FAFAFA", BRAND_RULE);

  const sColor = scoreColor(row.score);
  doc
    .fontSize(36)
    .font("Helvetica-Bold")
    .fillColor(sColor)
    .text(String(row.score), PAGE_MARGIN, y + 12, { width: scoreBoxW, align: "center" });

  doc
    .fontSize(9)
    .font("Helvetica-Bold")
    .fillColor(BRAND_DARK)
    .text(levelLabel(row.level), PAGE_MARGIN, y + 52, { width: scoreBoxW, align: "center" });

  doc
    .fontSize(7)
    .font("Helvetica")
    .fillColor(BRAND_LIGHT)
    .text("Automated score / 100", PAGE_MARGIN, y + 65, { width: scoreBoxW, align: "center" });

  /* stat boxes */
  const statBoxW = (CONTENT_WIDTH - scoreBoxW - 12) / 4;
  const statBoxH = scoreBoxH;
  const stats = [
    { label: "Critical", value: row.criticalViolations, color: "#DC2626" },
    { label: "Serious", value: row.seriousViolations, color: "#EA580C" },
    { label: "Total Violations", value: row.totalViolations, color: BRAND_DARK },
    { label: "Passed Checks", value: `${row.passedChecks}/${row.totalChecks}`, color: "#059669" },
  ];
  let sx = PAGE_MARGIN + scoreBoxW + 12;
  for (const stat of stats) {
    doc
      .roundedRect(sx, y, statBoxW - 4, statBoxH, 8)
      .fillAndStroke("#FAFAFA", BRAND_RULE);

    doc
      .fontSize(22)
      .font("Helvetica-Bold")
      .fillColor(stat.color)
      .text(String(stat.value), sx, y + 14, { width: statBoxW - 4, align: "center" });

    doc
      .fontSize(7)
      .font("Helvetica")
      .fillColor(BRAND_LIGHT)
      .text(stat.label.toUpperCase(), sx, y + 56, { width: statBoxW - 4, align: "center" });

    sx += statBoxW;
  }

  y += scoreBoxH + 28;

  /* ── Violations table ───────────────────────────────────────── */
  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .fillColor(BRAND_DARK)
    .text("Violations Found", PAGE_MARGIN, y);

  y += 6;
  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor(BRAND_LIGHT)
    .text(
      `Showing ${top10.length} of ${row.totalViolations} violation${row.totalViolations === 1 ? "" : "s"} — automated WCAG 2.1 AA scan`,
      PAGE_MARGIN, y + 10,
    );

  y += 28;

  /* table header */
  const COL = {
    severity: PAGE_MARGIN,
    wcag: PAGE_MARGIN + 88,
    description: PAGE_MARGIN + 148,
    elements: PAGE_WIDTH - PAGE_MARGIN - 52,
  };

  doc
    .rect(PAGE_MARGIN, y, CONTENT_WIDTH, 20)
    .fill("#F3F4F6");

  const headerLabels: Array<[string, number, object?]> = [
    ["SEVERITY", COL.severity, {}],
    ["WCAG", COL.wcag, {}],
    ["DESCRIPTION", COL.description, { width: COL.elements - COL.description - 8 }],
    ["ELEMENTS", COL.elements, { width: 52, align: "right" as const }],
  ];
  for (const [label, x, opts] of headerLabels) {
    doc
      .fontSize(6.5)
      .font("Helvetica-Bold")
      .fillColor(BRAND_LIGHT)
      .text(label, x + 4, y + 7, { lineBreak: false, ...opts });
  }

  y += 20;

  if (top10.length === 0) {
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor(BRAND_MID)
      .text("No violations detected. Well done!", PAGE_MARGIN, y + 12, { width: CONTENT_WIDTH });
    y += 40;
  } else {
    for (let i = 0; i < top10.length; i++) {
      const v = top10[i];

      /* measure row height for description wrap */
      const descWidth = COL.elements - COL.description - 12;
      const descHeight = doc.heightOfString(v.description, {
        width: descWidth,
        fontSize: 8,
      });
      const rowH = Math.max(28, descHeight + 12);

      /* check page overflow */
      if (y + rowH > doc.page.height - PAGE_MARGIN - 50) {
        doc.addPage();
        y = PAGE_MARGIN;
      }

      /* alternating row background */
      if (i % 2 === 0) {
        doc
          .rect(PAGE_MARGIN, y, CONTENT_WIDTH, rowH)
          .fill("#FAFAFA");
      }

      /* severity pill (left accent line) */
      const iColor = impactColor(v.impact);
      doc
        .rect(COL.severity, y, 3, rowH)
        .fill(iColor);

      doc
        .fontSize(7.5)
        .font("Helvetica-Bold")
        .fillColor(iColor)
        .text(v.impact.toUpperCase(), COL.severity + 8, y + (rowH / 2) - 5, { lineBreak: false });

      /* wcag */
      doc
        .fontSize(7.5)
        .font("Helvetica")
        .fillColor(BRAND_MID)
        .text(v.wcagCriteria, COL.wcag, y + (rowH / 2) - 5, { lineBreak: false, width: 56 });

      /* description */
      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor(BRAND_DARK)
        .text(v.description, COL.description, y + 6, { width: descWidth, lineBreak: true });

      /* elements count */
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(iColor)
        .text(String(v.affectedElements), COL.elements, y + (rowH / 2) - 7, {
          width: 48,
          align: "right",
          lineBreak: false,
        });

      /* row separator */
      doc
        .moveTo(PAGE_MARGIN, y + rowH)
        .lineTo(PAGE_WIDTH - PAGE_MARGIN, y + rowH)
        .strokeColor(BRAND_RULE)
        .lineWidth(0.25)
        .stroke();

      y += rowH;
    }
  }

  /* ── EAA compliance note ────────────────────────────────────── */
  y += 20;
  if (y > doc.page.height - PAGE_MARGIN - 90) {
    doc.addPage();
    y = PAGE_MARGIN;
  }

  doc
    .rect(PAGE_MARGIN, y, CONTENT_WIDTH, 52)
    .fill("#FFF7F5")
    .stroke(BRAND_ORANGE);

  doc
    .fontSize(8.5)
    .font("Helvetica-Bold")
    .fillColor(BRAND_ORANGE)
    .text("Important — Automated scans detect ~30% of WCAG violations", PAGE_MARGIN + 12, y + 10);

  doc
    .fontSize(7.5)
    .font("Helvetica")
    .fillColor(BRAND_MID)
    .text(
      "This report is generated by an automated scanner and should not be used as a sole basis for EAA compliance claims. " +
      "A full manual audit including screen reader testing is required for legal sign-off. Contact accessibility.now for a comprehensive audit.",
      PAGE_MARGIN + 12, y + 24,
      { width: CONTENT_WIDTH - 24 },
    );

  y += 62;

  /* ── Footer ─────────────────────────────────────────────────── */
  const footerY = doc.page.height - PAGE_MARGIN + 10;
  doc
    .moveTo(PAGE_MARGIN, footerY - 8)
    .lineTo(PAGE_WIDTH - PAGE_MARGIN, footerY - 8)
    .strokeColor(BRAND_RULE)
    .lineWidth(0.5)
    .stroke();

  doc
    .fontSize(7)
    .font("Helvetica")
    .fillColor(BRAND_LIGHT)
    .text("accessibility.now · sometech.work · WCAG 2.1 AA Automated Report", PAGE_MARGIN, footerY, {
      width: CONTENT_WIDTH,
      align: "center",
    });

  doc.end();

  return Buffer.concat(chunks);
}

router.get("/audit/:auditId/pdf", async (req, res): Promise<void> => {
  const auditId = Array.isArray(req.params.auditId)
    ? req.params.auditId[0]
    : req.params.auditId;

  if (!auditId || !/^[0-9a-f-]{36}$/i.test(auditId)) {
    res.status(400).json({ error: "invalid_id", message: "Invalid audit ID." });
    return;
  }

  try {
    const rows = await db
      .select()
      .from(auditsTable)
      .where(eq(auditsTable.auditId, auditId))
      .limit(1);

    if (rows.length === 0) {
      res.status(404).json({ error: "not_found", message: "Audit result not found." });
      return;
    }

    const row = rows[0];
    logger.info({ auditId }, "Generating PDF report");

    const pdfBuffer = buildPdf(row);
    const safeHost = row.url.replace(/[^a-z0-9]/gi, "_").slice(0, 60);
    const filename = `accessibility-report-${safeHost}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.setHeader("Cache-Control", "no-store");
    res.send(pdfBuffer);
  } catch (err) {
    logger.error({ err, auditId }, "PDF generation failed");
    res.status(500).json({ error: "pdf_failed", message: "Could not generate the PDF report." });
  }
});

export default router;
