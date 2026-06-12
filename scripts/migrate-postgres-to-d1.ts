/**
 * One-time Postgres → Cloudflare D1 migration helper.
 *
 * Usage:
 *   DATABASE_URL=postgresql://... pnpm tsx scripts/migrate-postgres-to-d1.ts --dry-run
 *   DATABASE_URL=postgresql://... pnpm tsx scripts/migrate-postgres-to-d1.ts
 *
 * Requires wrangler CLI auth and a D1 database configured in
 * artifacts/accessibility-now/wrangler.jsonc.
 */
import { createDb, auditsTable, leadsTable, monitoredUrlsTable, monitoringScansTable, scanJobsTable, batchJobsTable } from "@workspace/db";

const dryRun = process.argv.includes("--dry-run");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required.");
  }

  const db = createDb(url);
  const [audits, leads, monitors, monitorScans, scanJobs, batchJobs] = await Promise.all([
    db.select().from(auditsTable),
    db.select().from(leadsTable),
    db.select().from(monitoredUrlsTable),
    db.select().from(monitoringScansTable),
    db.select().from(scanJobsTable),
    db.select().from(batchJobsTable),
  ]);

  const summary = {
    audits: audits.length,
    leads: leads.length,
    monitoredUrls: monitors.length,
    monitoringScans: monitorScans.length,
    scanJobs: scanJobs.length,
    batchJobs: batchJobs.length,
  };

  console.log("Migration summary:", summary);

  if (dryRun) {
    console.log("Dry run complete. Re-run without --dry-run to apply via wrangler d1 execute.");
    return;
  }

  const statements: string[] = [];

  for (const lead of leads) {
    statements.push(
      `INSERT OR REPLACE INTO leads (lead_id, name, email, audit_id, company, service, message, website_url, source, created_at) VALUES (${sqlQuote(lead.leadId)}, ${sqlQuote(lead.name)}, ${sqlQuote(lead.email)}, ${sqlNullable(lead.auditId)}, ${sqlNullable(lead.company)}, ${sqlNullable(lead.service)}, ${sqlNullable(lead.message)}, ${sqlNullable(lead.websiteUrl)}, ${sqlNullable(lead.source)}, ${sqlQuote(lead.createdAt.toISOString())});`,
    );
  }

  for (const audit of audits) {
    const violations = audit.violationsRef ? "[]" : JSON.stringify(audit.violations);
    statements.push(
      `INSERT OR REPLACE INTO audits (audit_id, url, scanned_at, score, level, total_violations, critical_violations, serious_violations, violations, violations_ref, passed_checks, total_checks, scan_engine, page_screenshot, scan_metadata) VALUES (${sqlQuote(audit.auditId)}, ${sqlQuote(audit.url)}, ${sqlQuote(audit.scannedAt.toISOString())}, ${audit.score}, ${sqlQuote(audit.level)}, ${audit.totalViolations}, ${audit.criticalViolations}, ${audit.seriousViolations}, ${sqlQuote(violations)}, ${sqlNullable(audit.violationsRef)}, ${audit.passedChecks}, ${audit.totalChecks}, ${sqlQuote(audit.scanEngine)}, ${sqlNullable(audit.pageScreenshot)}, ${audit.scanMetadata ? sqlQuote(JSON.stringify(audit.scanMetadata)) : "NULL"});`,
    );
  }

  for (const monitor of monitors) {
    statements.push(
      `INSERT OR REPLACE INTO monitored_urls (id, url, email, frequency, token, is_active, created_at, next_scan_at) VALUES (${sqlQuote(monitor.id)}, ${sqlQuote(monitor.url)}, ${sqlQuote(monitor.email)}, ${sqlQuote(monitor.frequency)}, ${sqlQuote(monitor.token)}, ${monitor.isActive ? 1 : 0}, ${sqlQuote(monitor.createdAt.toISOString())}, ${sqlQuote(monitor.nextScanAt.toISOString())});`,
    );
  }

  for (const scan of monitorScans) {
    const violations = scan.violationsRef ? "[]" : JSON.stringify(scan.violations);
    statements.push(
      `INSERT OR REPLACE INTO monitoring_scans (id, monitored_url_id, score, level, total_violations, critical_violations, serious_violations, violations, violations_ref, passed_checks, total_checks, scanned_at) VALUES (${sqlQuote(scan.id)}, ${sqlQuote(scan.monitoredUrlId)}, ${scan.score}, ${sqlQuote(scan.level)}, ${scan.totalViolations}, ${scan.criticalViolations}, ${scan.seriousViolations}, ${sqlQuote(violations)}, ${sqlNullable(scan.violationsRef)}, ${scan.passedChecks}, ${scan.totalChecks}, ${sqlQuote(scan.scannedAt.toISOString())});`,
    );
  }

  for (const job of scanJobs) {
    statements.push(
      `INSERT OR REPLACE INTO scan_jobs (job_id, audit_id, url, status, profile, multi_viewport, error_message, created_at, updated_at, completed_at) VALUES (${sqlQuote(job.jobId)}, ${sqlQuote(job.auditId)}, ${sqlQuote(job.url)}, ${sqlQuote(job.status)}, ${sqlQuote(job.profile)}, ${job.multiViewport ? 1 : 0}, ${sqlNullable(job.errorMessage)}, ${sqlQuote(job.createdAt.toISOString())}, ${sqlQuote(job.updatedAt.toISOString())}, ${job.completedAt ? sqlQuote(job.completedAt.toISOString()) : "NULL"});`,
    );
  }

  for (const batch of batchJobs) {
    statements.push(
      `INSERT OR REPLACE INTO batch_jobs (batch_job_id, status, discovery_source, scan_profile, multi_viewport, urls_json, progress_json, result_json, error_message, created_at, updated_at, completed_at) VALUES (${sqlQuote(batch.batchJobId)}, ${sqlQuote(batch.status)}, ${sqlNullable(batch.discoverySource)}, ${sqlQuote(batch.scanProfile)}, ${batch.multiViewport ? 1 : 0}, ${sqlQuote(JSON.stringify(batch.urlsJson))}, ${sqlQuote(JSON.stringify(batch.progressJson))}, ${batch.resultJson ? sqlQuote(JSON.stringify(batch.resultJson)) : "NULL"}, ${sqlNullable(batch.errorMessage)}, ${sqlQuote(batch.createdAt.toISOString())}, ${sqlQuote(batch.updatedAt.toISOString())}, ${batch.completedAt ? sqlQuote(batch.completedAt.toISOString()) : "NULL"});`,
    );
  }

  const outPath = "artifacts/accessibility-now/migrations/import-from-postgres.sql";
  const fs = await import("node:fs/promises");
  await fs.writeFile(outPath, statements.join("\n") + "\n", "utf8");
  console.log(`Wrote ${statements.length} statements to ${outPath}`);
  console.log("Apply with: cd artifacts/accessibility-now && pnpm wrangler d1 execute accessibility-now --remote --file=./migrations/import-from-postgres.sql");
}

function sqlQuote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlNullable(value: string | null | undefined): string {
  return value == null ? "NULL" : sqlQuote(value);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
