-- Applied when audits / monitoring_scans exist on D1 (Cloudflare prod).
ALTER TABLE audits ADD COLUMN violations_ref TEXT;
ALTER TABLE monitoring_scans ADD COLUMN violations_ref TEXT;
