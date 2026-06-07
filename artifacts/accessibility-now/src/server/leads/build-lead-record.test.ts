import assert from "node:assert/strict";
import test from "node:test";
import { buildLeadRecord } from "./build-lead-record";

test("buildLeadRecord trims text fields and converts blanks to null", () => {
  const now = new Date("2026-06-07T10:30:00.000Z");
  const record = buildLeadRecord(
    {
      name: "  Jane Doe  ",
      email: "  jane@example.com  ",
      auditId: "  audit-123  ",
      company: "  Acme Corp  ",
      service: "  audit  ",
      message: "  Need help with EAA readiness.  ",
      websiteUrl: "  https://example.com  ",
      source: "  pricing  ",
    },
    now,
  );

  assert.equal(record.name, "Jane Doe");
  assert.equal(record.email, "jane@example.com");
  assert.equal(record.auditId, "audit-123");
  assert.equal(record.company, "Acme Corp");
  assert.equal(record.service, "audit");
  assert.equal(record.message, "Need help with EAA readiness.");
  assert.equal(record.websiteUrl, "https://example.com");
  assert.equal(record.source, "pricing");
  assert.equal(record.createdAt, now.toISOString());
  assert.match(record.leadId, /^[0-9a-f-]{36}$/);
});

test("buildLeadRecord converts empty optional values to null", () => {
  const record = buildLeadRecord({
    name: "Jane Doe",
    email: "jane@example.com",
    company: "   ",
    service: "",
    message: " ",
    source: "",
  });

  assert.equal(record.auditId, null);
  assert.equal(record.company, null);
  assert.equal(record.service, null);
  assert.equal(record.message, null);
  assert.equal(record.websiteUrl, null);
  assert.equal(record.source, null);
});
