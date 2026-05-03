CREATE TABLE "audits" (
	"audit_id" text PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"scanned_at" timestamp with time zone NOT NULL,
	"score" integer NOT NULL,
	"level" text NOT NULL,
	"total_violations" integer NOT NULL,
	"critical_violations" integer NOT NULL,
	"serious_violations" integer NOT NULL,
	"violations" jsonb NOT NULL,
	"passed_checks" integer NOT NULL,
	"total_checks" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"lead_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"audit_id" text,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monitored_urls" (
	"id" text PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"email" text NOT NULL,
	"frequency" text NOT NULL,
	"token" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"next_scan_at" timestamp with time zone NOT NULL,
	CONSTRAINT "monitored_urls_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "monitoring_scans" (
	"id" text PRIMARY KEY NOT NULL,
	"monitored_url_id" text NOT NULL,
	"score" integer NOT NULL,
	"level" text NOT NULL,
	"total_violations" integer NOT NULL,
	"critical_violations" integer NOT NULL,
	"serious_violations" integer NOT NULL,
	"violations" jsonb NOT NULL,
	"passed_checks" integer NOT NULL,
	"total_checks" integer NOT NULL,
	"scanned_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "monitoring_scans" ADD CONSTRAINT "monitoring_scans_monitored_url_id_monitored_urls_id_fk" FOREIGN KEY ("monitored_url_id") REFERENCES "public"."monitored_urls"("id") ON DELETE cascade ON UPDATE no action;