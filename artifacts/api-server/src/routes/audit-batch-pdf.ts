import { Router, type IRouter } from "express";
import PDFDocument from "pdfkit";
import { inArray } from "drizzle-orm";
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
const PAGE_HEIGHT = 841.89;
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
  topSelectors?: string[];
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

function parseBody(body: unknown): { ok: true; auditIds: string[] } | { ok: false; message: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, message: "Request body must be a JSON object." };
  }
  const { auditIds } = body as Record<string, unknown>;
  if (!Array.isArray(auditIds)) return { ok: false, message: "'auditIds' must be an array of strings." };
  if (auditIds.length < 1) return { ok: false, message: "'auditIds' must contain at least 1 ID." };
  if (auditIds.length > 10) return { ok: false, message: "'auditIds' must contain at most 10 IDs." };
  for (let i = 0; i < auditIds.length; i++) {
    if (typeof auditIds[i] !== "string" || !/^[0-9a-f-]{36}$/i.test(auditIds[i])) {
      return { ok: false, message: `Invalid audit ID at index ${i}.` };
    }
  }
  return { ok: true, auditIds: auditIds as string[] };
}

function writeHeader(doc: PDFDocument, isFirstPage: boolean) {
  if (!isFirstPage) doc.addPage();
  doc.rect(0, 0, PAGE_WIDTH, 72).fill(BRAND_DARK);
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
    .text("WCAG 2.1 AA Multi-Page Compliance Report", PAGE_MARGIN, 50);
}

function writeCoverPage(doc: PDFDocument, rows: AuditRow[], scannedDate: string): void {
  writeHeader(doc, true);

  let y = 96;
  doc.fontSize(9).font("Helvetica").fillColor(BRAND_LIGHT).text("REPORT OVERVIEW", PAGE_MARGIN, y);
  y += 18;
  doc
    .fontSize(16)
    .font("Helvetica-Bold")
    .fillColor(BRAND_DARK)
    .text(`${rows.length}-Page Site Accessibility Report`, PAGE_MARGIN, y);
  y += 14;
  doc.fontSize(9).font("Helvetica").fillColor(BRAND_MID).text(`Scanned: ${scannedDate}`, PAGE_MARGIN, y);

  y += 28;
  doc
    .moveTo(PAGE_MARGIN, y)
    .lineTo(PAGE_WIDTH - PAGE_MARGIN, y)
    .strokeColor(BRAND_RULE)
    .lineWidth(0.5)
    .stroke();

  y += 20;

  const successRows = rows.filter((r) => r.score > 0 || r.totalViolations >= 0);
  const avgScore =
    successRows.length > 0
      ? Math.round(successRows.reduce((s, r) => s + r.score, 0) / successRows.length)
      : 0;

  const scoreBoxW = 110;
  const scoreBoxH = 80;
  doc.roundedRect(PAGE_MARGIN, y, scoreBoxW, scoreBoxH, 8).fillAndStroke("#FAFAFA", BRAND_RULE);
  doc
    .fontSize(36)
    .font("Helvetica-Bold")
    .fillColor(scoreColor(avgScore))
    .text(String(avgScore), PAGE_MARGIN, y + 12, { width: scoreBoxW, align: "center" });
  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor(BRAND_LIGHT)
    .text("Avg. Score / 100", PAGE_MARGIN, y + 60, { width: scoreBoxW, align: "center" });

  const totalCritical = rows.reduce((s, r) => s + r.criticalViolations, 0);
  const totalSerious = rows.reduce((s, r) => s + r.seriousViolations, 0);
  const totalViolations = rows.reduce((s, r) => s + r.totalViolations, 0);
  const statBoxW = (CONTENT_WIDTH - scoreBoxW - 12) / 3;
  const stats = [
    { label: "Critical", value: totalCritical, color: "#DC2626" },
    { label: "Serious", value: totalSerious, color: "#EA580C" },
    { label: "Total Violations", value: totalViolations, color: BRAND_MID },
  ];
  let sx = PAGE_MARGIN + scoreBoxW + 12;
  for (const stat of stats) {
    doc.roundedRect(sx, y, statBoxW - 4, scoreBoxH, 8).fillAndStroke("#FAFAFA", BRAND_RULE);
    doc
      .fontSize(26)
      .font("Helvetica-Bold")
      .fillColor(stat.color)
      .text(String(stat.value), sx, y + 14, { width: statBoxW - 4, align: "center" });
    doc
      .fontSize(6.5)
      .font("Helvetica")
      .fillColor(BRAND_LIGHT)
      .text(stat.label.toUpperCase(), sx, y + 60, { width: statBoxW - 4, align: "center" });
    sx += statBoxW;
  }

  y += scoreBoxH + 28;

  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .fillColor(BRAND_DARK)
    .text("Pages in This Report", PAGE_MARGIN, y);
  y += 16;

  for (const row of rows) {
    if (y > PAGE_HEIGHT - PAGE_MARGIN - 30) {
      doc.addPage();
      y = PAGE_MARGIN;
    }
    doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, 26).fill(y % 52 < 26 ? "#FAFAFA" : "#FFFFFF");
    doc.rect(PAGE_MARGIN, y, 3, 26).fill(scoreColor(row.score));
    doc
      .fontSize(7.5)
      .font("Helvetica-Bold")
      .fillColor(scoreColor(row.score))
      .text(String(row.score), PAGE_MARGIN + 8, y + 8, { lineBreak: false });
    doc
      .fontSize(7.5)
      .font("Helvetica")
      .fillColor(BRAND_DARK)
      .text(row.url, PAGE_MARGIN + 40, y + 8, {
        width: CONTENT_WIDTH - 120,
        lineBreak: false,
        ellipsis: true,
      });
    doc
      .fontSize(7)
      .font("Helvetica")
      .fillColor(BRAND_LIGHT)
      .text(`${row.totalViolations} violation${row.totalViolations === 1 ? "" : "s"}`, PAGE_WIDTH - PAGE_MARGIN - 80, y + 8, {
        width: 80,
        align: "right",
        lineBreak: false,
      });
    doc
      .moveTo(PAGE_MARGIN, y + 26)
      .lineTo(PAGE_WIDTH - PAGE_MARGIN, y + 26)
      .strokeColor(BRAND_RULE)
      .lineWidth(0.25)
      .stroke();
    y += 26;
  }
}

function writePageSection(doc: PDFDocument, row: AuditRow): void {
  doc.addPage();

  doc.rect(0, 0, PAGE_WIDTH, 72).fill(BRAND_DARK);
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
    .text("Page Report", PAGE_MARGIN, 50);

  const violations = (row.violations as AuditViolationData[]) ?? [];
  const impactOrder: Record<ImpactLevel, number> = { critical: 0, serious: 1, moderate: 2, minor: 3 };
  const top10 = [...violations]
    .sort((a, b) => (impactOrder[a.impact] ?? 4) - (impactOrder[b.impact] ?? 4))
    .slice(0, 10);

  const scannedDate = new Date(row.scannedAt).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  let y = 96;
  doc.fontSize(9).font("Helvetica").fillColor(BRAND_LIGHT).text("URL AUDITED", PAGE_MARGIN, y);
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
  y += 20;

  const scoreBoxW = 110;
  const scoreBoxH = 70;
  doc.roundedRect(PAGE_MARGIN, y, scoreBoxW, scoreBoxH, 8).fillAndStroke("#FAFAFA", BRAND_RULE);
  const sColor = scoreColor(row.score);
  doc
    .fontSize(32)
    .font("Helvetica-Bold")
    .fillColor(sColor)
    .text(String(row.score), PAGE_MARGIN, y + 10, { width: scoreBoxW, align: "center" });
  doc
    .fontSize(8)
    .font("Helvetica-Bold")
    .fillColor(BRAND_DARK)
    .text(levelLabel(row.level), PAGE_MARGIN, y + 48, { width: scoreBoxW, align: "center" });
  doc
    .fontSize(6.5)
    .font("Helvetica")
    .fillColor(BRAND_LIGHT)
    .text("Score / 100", PAGE_MARGIN, y + 58, { width: scoreBoxW, align: "center" });

  const moderateViolations = violations.filter((v) => v.impact === "moderate").length;
  const minorViolations = violations.filter((v) => v.impact === "minor").length;
  const statBoxW = (CONTENT_WIDTH - scoreBoxW - 12) / 4;
  const stats = [
    { label: "Critical", value: row.criticalViolations, color: "#DC2626" },
    { label: "Serious", value: row.seriousViolations, color: "#EA580C" },
    { label: "Moderate", value: moderateViolations, color: "#D97706" },
    { label: "Minor / Passed", value: `${minorViolations} / ${row.passedChecks}`, color: "#6B7280" },
  ];
  let sx = PAGE_MARGIN + scoreBoxW + 12;
  for (const stat of stats) {
    doc.roundedRect(sx, y, statBoxW - 3, scoreBoxH, 8).fillAndStroke("#FAFAFA", BRAND_RULE);
    const valStr = String(stat.value);
    const fSize = valStr.length > 4 ? 11 : 18;
    const topPad = valStr.length > 4 ? 18 : 10;
    doc
      .fontSize(fSize)
      .font("Helvetica-Bold")
      .fillColor(stat.color)
      .text(valStr, sx, y + topPad, { width: statBoxW - 3, align: "center" });
    doc
      .fontSize(6.5)
      .font("Helvetica")
      .fillColor(BRAND_LIGHT)
      .text(stat.label.toUpperCase(), sx, y + 54, { width: statBoxW - 3, align: "center" });
    sx += statBoxW;
  }

  y += scoreBoxH + 24;

  doc.fontSize(10).font("Helvetica-Bold").fillColor(BRAND_DARK).text("Top Violations", PAGE_MARGIN, y);
  y += 14;
  doc
    .fontSize(7.5)
    .font("Helvetica")
    .fillColor(BRAND_LIGHT)
    .text(`${top10.length} of ${row.totalViolations} violation${row.totalViolations === 1 ? "" : "s"}`, PAGE_MARGIN, y);
  y += 14;

  const COL = {
    severity: PAGE_MARGIN,
    wcag: PAGE_MARGIN + 68,
    description: PAGE_MARGIN + 118,
    elements: PAGE_WIDTH - PAGE_MARGIN - 42,
  };
  const descWidth = COL.elements - COL.description - 8;

  doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, 18).fill("#F3F4F6");
  const headerLabels: Array<[string, number, object?]> = [
    ["SEVERITY", COL.severity + 4, {}],
    ["WCAG", COL.wcag + 4, {}],
    ["DESCRIPTION", COL.description + 4, { width: descWidth }],
    ["ELEMENTS", COL.elements, { width: 42, align: "right" as const }],
  ];
  for (const [label, x, opts] of headerLabels) {
    doc
      .fontSize(6)
      .font("Helvetica-Bold")
      .fillColor(BRAND_LIGHT)
      .text(label, x, y + 6, { lineBreak: false, ...opts });
  }
  y += 18;

  if (top10.length === 0) {
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor(BRAND_MID)
      .text("No violations detected.", PAGE_MARGIN, y + 10, { width: CONTENT_WIDTH });
    return;
  }

  for (let i = 0; i < top10.length; i++) {
    const v = top10[i];
    const descH = doc.heightOfString(v.description, { width: descWidth });
    const rowH = Math.max(26, descH + 12);

    if (y + rowH > PAGE_HEIGHT - PAGE_MARGIN - 50) {
      doc.addPage();
      y = PAGE_MARGIN;
    }

    if (i % 2 === 0) doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, rowH).fill("#FAFAFA");
    const iColor = impactColor(v.impact);
    doc.rect(COL.severity, y, 3, rowH).fill(iColor);
    doc
      .fontSize(7)
      .font("Helvetica-Bold")
      .fillColor(iColor)
      .text(v.impact.toUpperCase(), COL.severity + 8, y + 7, { lineBreak: false });
    doc
      .fontSize(7)
      .font("Helvetica")
      .fillColor(BRAND_MID)
      .text(v.wcagCriteria, COL.wcag + 4, y + 7, { lineBreak: false, width: 44 });
    doc
      .fontSize(7.5)
      .font("Helvetica")
      .fillColor(BRAND_DARK)
      .text(v.description, COL.description + 4, y + 5, { width: descWidth, lineBreak: true });
    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .fillColor(iColor)
      .text(String(v.affectedElements), COL.elements, y + 7, {
        width: 42,
        align: "right",
        lineBreak: false,
      });
    doc
      .moveTo(PAGE_MARGIN, y + rowH)
      .lineTo(PAGE_WIDTH - PAGE_MARGIN, y + rowH)
      .strokeColor(BRAND_RULE)
      .lineWidth(0.25)
      .stroke();
    y += rowH;
  }
}

function buildBatchPdf(rows: AuditRow[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: "A4",
      margin: PAGE_MARGIN,
      info: {
        Title: `Multi-Page Accessibility Report (${rows.length} pages)`,
        Author: "accessibility.now",
        Subject: "WCAG 2.1 AA Multi-Page Compliance Report",
        Creator: "accessibility.now automated scanner",
      },
      compress: true,
    });

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const scannedDate = rows.length > 0
      ? new Date(rows[0].scannedAt).toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" })
      : new Date().toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" });

    writeCoverPage(doc, rows, scannedDate);

    for (const row of rows) {
      writePageSection(doc, row);
    }

    doc.end();
  });
}

router.post("/audit/batch-pdf", async (req, res): Promise<void> => {
  const parsed = parseBody(req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: "validation_error", message: parsed.message });
    return;
  }

  const { auditIds } = parsed;

  try {
    const rows = await db
      .select()
      .from(auditsTable)
      .where(inArray(auditsTable.auditId, auditIds));

    if (rows.length === 0) {
      res.status(404).json({ error: "not_found", message: "No audit results found." });
      return;
    }

    const ordered = auditIds
      .map((id) => rows.find((r) => r.auditId === id))
      .filter((r): r is typeof rows[0] => r !== undefined);

    logger.info({ count: ordered.length }, "Generating batch PDF report");

    const pdfBuffer = await buildBatchPdf(ordered);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="accessibility-batch-report-${ordered.length}pages.pdf"`,
    );
    res.setHeader("Content-Length", pdfBuffer.length);
    res.setHeader("Cache-Control", "no-store");
    res.send(pdfBuffer);
  } catch (err) {
    logger.error({ err }, "Batch PDF generation failed");
    res.status(500).json({ error: "pdf_failed", message: "Could not generate the batch PDF report." });
  }
});

export default router;
