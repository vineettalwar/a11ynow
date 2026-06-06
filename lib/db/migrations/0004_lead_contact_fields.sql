ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "company" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "service" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "message" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "website_url" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "source" text;
