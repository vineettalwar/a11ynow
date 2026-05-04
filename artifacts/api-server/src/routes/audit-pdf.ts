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

interface AuditViolationInstanceData {
  selector: string;
  htmlSnippet: string;
  failureSummary?: string;
  checkDetails?: string[];
}

interface AuditViolationData {
  id: string;
  wcagCriteria: string;
  description: string;
  impact: ImpactLevel;
  affectedElements: number;
  topSelectors?: string[];
  instanceDetails?: AuditViolationInstanceData[];
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

function buildPdf(row: AuditRow): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const violations = (row.violations as AuditViolationData[]) ?? [];
    const impactOrder: Record<ImpactLevel, number> = { critical: 0, serious: 1, moderate: 2, minor: 3 };
    const top10 = [...violations]
      .sort((a, b) => (impactOrder[a.impact] ?? 4) - (impactOrder[b.impact] ?? 4))
      .slice(0, 10);

    const moderateViolations = violations.filter((v) => v.impact === "moderate").length;
    const minorViolations = violations.filter((v) => v.impact === "minor").length;

    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: "A4",
      margin: PAGE_MARGIN,
      info: {
        Title: `Accessibility Audit: ${row.url}`,
        Author: "accessibility.now",
        Subject: "WCAG 2.1 AA Compliance Report",
        Creator: "accessibility.now automated scanner",
      },
      compress: true,
    });

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const scannedDate = new Date(row.scannedAt).toLocaleString("en-GB", {
      dateStyle: "long",
      timeStyle: "short",
    });

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
      .text("WCAG 2.1 AA Compliance Report", PAGE_MARGIN, 50);

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
    const scoreBoxH = 80;
    doc.roundedRect(PAGE_MARGIN, y, scoreBoxW, scoreBoxH, 8).fillAndStroke("#FAFAFA", BRAND_RULE);

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

    const statBoxW = (CONTENT_WIDTH - scoreBoxW - 12) / 5;
    const stats = [
      { label: "Critical", value: row.criticalViolations, color: "#DC2626" },
      { label: "Serious", value: row.seriousViolations, color: "#EA580C" },
      { label: "Moderate", value: moderateViolations, color: "#D97706" },
      { label: "Minor", value: minorViolations, color: "#6B7280" },
      { label: "Passed", value: `${row.passedChecks}/${row.totalChecks}`, color: "#059669" },
    ];
    let sx = PAGE_MARGIN + scoreBoxW + 12;
    for (const stat of stats) {
      doc.roundedRect(sx, y, statBoxW - 3, scoreBoxH, 8).fillAndStroke("#FAFAFA", BRAND_RULE);

      const valStr = String(stat.value);
      const fontSize = valStr.length > 4 ? 14 : 22;
      const topPad = valStr.length > 4 ? 20 : 14;

      doc
        .fontSize(fontSize)
        .font("Helvetica-Bold")
        .fillColor(stat.color)
        .text(valStr, sx, y + topPad, { width: statBoxW - 3, align: "center" });

      doc
        .fontSize(6.5)
        .font("Helvetica")
        .fillColor(BRAND_LIGHT)
        .text(stat.label.toUpperCase(), sx, y + 60, { width: statBoxW - 3, align: "center" });

      sx += statBoxW;
    }

    y += scoreBoxH + 28;

    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor(BRAND_DARK)
      .text("Top Violations Found", PAGE_MARGIN, y);

    y += 16;
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor(BRAND_LIGHT)
      .text(
        `${top10.length} of ${row.totalViolations} violation${row.totalViolations === 1 ? "" : "s"} · automated WCAG 2.1 AA scan`,
        PAGE_MARGIN,
        y,
      );

    y += 16;

    const COL = {
      severity: PAGE_MARGIN,
      wcag: PAGE_MARGIN + 72,
      description: PAGE_MARGIN + 126,
      elements: PAGE_WIDTH - PAGE_MARGIN - 44,
    };
    const descWidth = COL.elements - COL.description - 8;

    doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, 20).fill("#F3F4F6");

    const headerLabels: Array<[string, number, object?]> = [
      ["SEVERITY", COL.severity + 4, {}],
      ["WCAG", COL.wcag + 4, {}],
      ["DESCRIPTION / SELECTORS", COL.description + 4, { width: descWidth }],
      ["ELEMENTS", COL.elements, { width: 44, align: "right" as const }],
    ];
    for (const [label, x, opts] of headerLabels) {
      doc
        .fontSize(6.5)
        .font("Helvetica-Bold")
        .fillColor(BRAND_LIGHT)
        .text(label, x, y + 7, { lineBreak: false, ...opts });
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
        const v = top10[i] as AuditViolationData;
        const selectors = (v.topSelectors ?? []).filter(Boolean);
        const instanceLines: string[] = [];
        for (const inst of v.instanceDetails ?? []) {
          const bits = [
            inst.failureSummary,
            ...(Array.isArray(inst.checkDetails) ? inst.checkDetails : []),
            inst.selector,
            inst.htmlSnippet,
          ].filter(Boolean);
          if (bits.length) instanceLines.push(bits.join("\n"));
        }
        const selText = [selectors.join("\n"), instanceLines.slice(0, 2).join("\n\n---\n")].filter(Boolean).join("\n\n");

        const descH = doc.heightOfString(v.description, { width: descWidth });
        const selH = selText ? doc.heightOfString(selText, { width: descWidth }) + 4 : 0;
        const rowH = Math.max(30, descH + selH + 14);

        if (y + rowH > doc.page.height - PAGE_MARGIN - 50) {
          doc.addPage();
          y = PAGE_MARGIN;
        }

        if (i % 2 === 0) {
          doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, rowH).fill("#FAFAFA");
        }

        const iColor = impactColor(v.impact);
        doc.rect(COL.severity, y, 3, rowH).fill(iColor);

        doc
          .fontSize(7.5)
          .font("Helvetica-Bold")
          .fillColor(iColor)
          .text(v.impact.toUpperCase(), COL.severity + 8, y + 8, { lineBreak: false });

        doc
          .fontSize(7.5)
          .font("Helvetica")
          .fillColor(BRAND_MID)
          .text(v.wcagCriteria, COL.wcag + 4, y + 8, { lineBreak: false, width: 48 });

        doc
          .fontSize(8)
          .font("Helvetica")
          .fillColor(BRAND_DARK)
          .text(v.description, COL.description + 4, y + 6, { width: descWidth, lineBreak: true });

        if (selText) {
          const descBottom = y + 6 + descH;
          doc
            .fontSize(6.5)
            .font("Helvetica")
            .fillColor(BRAND_LIGHT)
            .text(selText, COL.description + 4, descBottom + 2, {
              width: descWidth,
              lineBreak: true,
            });
        }

        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .fillColor(iColor)
          .text(String(v.affectedElements), COL.elements, y + 8, {
            width: 44,
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

    y += 20;
    if (y > doc.page.height - PAGE_MARGIN - 90) {
      doc.addPage();
      y = PAGE_MARGIN;
    }

    doc
      .roundedRect(PAGE_MARGIN, y, CONTENT_WIDTH, 52, 6)
      .fillAndStroke("#FFF7F5", BRAND_ORANGE);

    doc
      .fontSize(8.5)
      .font("Helvetica-Bold")
      .fillColor(BRAND_ORANGE)
      .text(
        "Important: Automated scans detect ~30% of WCAG violations",
        PAGE_MARGIN + 12,
        y + 10,
      );

    doc
      .fontSize(7.5)
      .font("Helvetica")
      .fillColor(BRAND_MID)
      .text(
        "This report is generated by an automated scanner and should not be used as a sole basis for EAA compliance claims. " +
          "A full manual audit including screen reader testing is required for legal sign-off. " +
          "Contact accessibility.now for a comprehensive audit.",
        PAGE_MARGIN + 12,
        y + 24,
        { width: CONTENT_WIDTH - 24 },
      );

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
      .text("accessibility.now · WCAG 2.1 AA Automated Report", PAGE_MARGIN, footerY, {
        width: CONTENT_WIDTH,
        align: "center",
      });

    doc.end();
  });
}

router.get("/audit/:auditId/pdf", async (req, res): Promise<void> => {
  const { auditId } = req.params;

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

    const pdfBuffer = await buildPdf(row);
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
