ALTER TABLE "audits" ADD COLUMN IF NOT EXISTS "violations_ref" text;
ALTER TABLE "monitoring_scans" ADD COLUMN IF NOT EXISTS "violations_ref" text;
