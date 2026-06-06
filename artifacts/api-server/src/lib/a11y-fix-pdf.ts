import PDFDocument from "pdfkit";
import {
  POUR_ORDER,
  getFixDifficultyLabel,
  groupByPour,
  type PourViolationLike,
} from "./a11y-fix-pour";

const BRAND_ORANGE = "#FF4D1C";
const BRAND_DARK = "#1a1a1a";
const BRAND_MID = "#555555";
const BRAND_LIGHT = "#888888";
const BRAND_RULE = "#e5e5e5";
const PAGE_MARGIN = 52;
const PAGE_WIDTH = 595.28;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;

const POUR_COLORS: Record<string, string> = {
  Perceivable: "#2563EB",
  Operable: "#EA580C",
  Understandable: "#7C3AED",
  Robust: "#059669",
};

export interface A11yFixPdfRow {
  auditId: string;
  url: string;
  scannedAt: Date;
  score: number;
  level: string;
  totalViolations: number;
  criticalViolations: number;
  seriousViolations: number;
  violations: unknown;
}

function scoreColor(score: number): string {
  if (score >= 80) return "#059669";
  if (score >= 60) return "#D97706";
  if (score >= 40) return "#EA580C";
  return "#DC2626";
}

export function buildA11yFixPdf(row: A11yFixPdfRow): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const violations = (row.violations as PourViolationLike[]) ?? [];
    const pourGroups = groupByPour(violations);
    const chunks: Buffer[] = [];

    const doc = new PDFDocument({
      size: "A4",
      margin: PAGE_MARGIN,
      info: {
        Title: `A11y Fix Report: ${row.url}`,
        Author: "accessibility.now",
        Subject: "BITV 2.0 / BFSG POUR-grouped fix plan",
        Creator: "accessibility.now A11y Fix",
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

    doc.rect(0, 0, PAGE_WIDTH, 76).fill(BRAND_DARK);
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .fillColor("#FFFFFF")
      .text("A11y Fix", PAGE_MARGIN, 22);
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("rgba(255,255,255,0.6)")
      .text("BITV 2.0 / BFSG · POUR-grouped fix plan · EN 301 549", PAGE_MARGIN, 44);
    doc
      .fontSize(7)
      .fillColor(BRAND_ORANGE)
      .text("accessibility.now", PAGE_MARGIN, 58);

    let y = 92;
    doc.fontSize(9).font("Helvetica").fillColor(BRAND_LIGHT).text("URL", PAGE_MARGIN, y);
    y += 12;
    doc.fontSize(10).font("Helvetica-Bold").fillColor(BRAND_DARK).text(row.url, PAGE_MARGIN, y, {
      width: CONTENT_WIDTH,
    });
    y += doc.heightOfString(row.url, { width: CONTENT_WIDTH }) + 8;
    doc.fontSize(8).font("Helvetica").fillColor(BRAND_MID).text(`Scanned ${scannedDate}`, PAGE_MARGIN, y);
    y += 22;

    const boxH = 64;
    doc.roundedRect(PAGE_MARGIN, y, 90, boxH, 6).fillAndStroke("#FAFAFA", BRAND_RULE);
    doc
      .fontSize(28)
      .font("Helvetica-Bold")
      .fillColor(scoreColor(row.score))
      .text(String(row.score), PAGE_MARGIN, y + 10, { width: 90, align: "center" });
    doc
      .fontSize(7)
      .font("Helvetica")
      .fillColor(BRAND_LIGHT)
      .text("Score / 100", PAGE_MARGIN, y + 46, { width: 90, align: "center" });

    const stats = [
      ["Critical", row.criticalViolations],
      ["Serious", row.seriousViolations],
      ["Total issues", row.totalViolations],
    ] as const;
    let sx = PAGE_MARGIN + 100;
    const statW = (CONTENT_WIDTH - 100) / 3;
    for (const [label, val] of stats) {
      doc.roundedRect(sx, y, statW - 6, boxH, 6).fillAndStroke("#FAFAFA", BRAND_RULE);
      doc
        .fontSize(18)
        .font("Helvetica-Bold")
        .fillColor(BRAND_DARK)
        .text(String(val), sx, y + 14, { width: statW - 6, align: "center" });
      doc
        .fontSize(6.5)
        .font("Helvetica")
        .fillColor(BRAND_LIGHT)
        .text(label.toUpperCase(), sx, y + 42, { width: statW - 6, align: "center" });
      sx += statW;
    }
    y += boxH + 24;

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(BRAND_DARK)
      .text("Issues by POUR principle", PAGE_MARGIN, y);
    y += 14;
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor(BRAND_MID)
      .text(
        "Perceivable · Operable · Understandable · Robust — aligned with WCAG 2.1 AA / BITV 2.0 structure.",
        PAGE_MARGIN,
        y,
        { width: CONTENT_WIDTH },
      );
    y += 20;

    for (const principle of POUR_ORDER) {
      const items = pourGroups[principle];
      if (y > doc.page.height - PAGE_MARGIN - 80) {
        doc.addPage();
        y = PAGE_MARGIN;
      }

      const pColor = POUR_COLORS[principle] ?? BRAND_DARK;
      doc.rect(PAGE_MARGIN, y, 4, 22).fill(pColor);
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(pColor)
        .text(principle, PAGE_MARGIN + 10, y + 4);
      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor(BRAND_MID)
        .text(`${items.length} issue${items.length === 1 ? "" : "s"}`, PAGE_MARGIN + 120, y + 5);
      y += 28;

      if (items.length === 0) {
        doc
          .fontSize(8)
          .font("Helvetica-Oblique")
          .fillColor(BRAND_LIGHT)
          .text("No automated issues under this principle.", PAGE_MARGIN + 10, y);
        y += 18;
        continue;
      }

      for (const v of items.slice(0, 12)) {
        const title = v.titleDe ?? v.description;
        const difficulty = getFixDifficultyLabel(v.id);
        const line = `[${difficulty}] ${title}`;
        const lineH = doc.heightOfString(line, { width: CONTENT_WIDTH - 20 }) + 6;
        if (y + lineH > doc.page.height - PAGE_MARGIN - 40) {
          doc.addPage();
          y = PAGE_MARGIN;
        }
        doc.fontSize(8).font("Helvetica-Bold").fillColor(BRAND_DARK).text(line, PAGE_MARGIN + 10, y, {
          width: CONTENT_WIDTH - 20,
        });
        y += lineH;
        const meta = [v.wcagCriteria, v.bitvSection ? `BITV ${v.bitvSection}` : ""]
          .filter(Boolean)
          .join(" · ");
        if (meta) {
          doc.fontSize(7).font("Helvetica").fillColor(BRAND_LIGHT).text(meta, PAGE_MARGIN + 10, y);
          y += 10;
        }
        if (v.help) {
          const helpH = doc.heightOfString(v.help, { width: CONTENT_WIDTH - 24 });
          if (y + helpH > doc.page.height - PAGE_MARGIN - 30) {
            doc.addPage();
            y = PAGE_MARGIN;
          }
          doc.fontSize(7).font("Helvetica").fillColor(BRAND_MID).text(`Fix: ${v.help}`, PAGE_MARGIN + 14, y, {
            width: CONTENT_WIDTH - 24,
          });
          y += helpH + 8;
        } else {
          y += 4;
        }
      }

      if (items.length > 12) {
        doc
          .fontSize(7)
          .font("Helvetica-Oblique")
          .fillColor(BRAND_LIGHT)
          .text(`+ ${items.length - 12} more under ${principle}`, PAGE_MARGIN + 10, y);
        y += 14;
      }
      y += 8;
    }

    const footerY = doc.page.height - PAGE_MARGIN + 12;
    doc
      .fontSize(7)
      .font("Helvetica")
      .fillColor(BRAND_LIGHT)
      .text(
        "Automated scan only — manual review required for full BFSG sign-off. accessibility.now",
        PAGE_MARGIN,
        footerY,
        { width: CONTENT_WIDTH, align: "center" },
      );

    doc.end();
  });
}
