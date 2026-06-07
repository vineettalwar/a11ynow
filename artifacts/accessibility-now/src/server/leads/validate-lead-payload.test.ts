import assert from "node:assert/strict";
import test from "node:test";
import { validateLeadPayload } from "./validate-lead-payload";

test("validateLeadPayload rejects blank trimmed names", () => {
  assert.equal(
    validateLeadPayload({
      name: "   ",
      email: "jane@example.com",
    }),
    "Name is required.",
  );
});

test("validateLeadPayload requires company, service, and message for pricing/contact sources", () => {
  assert.equal(
    validateLeadPayload({
      name: "Jane Doe",
      email: "jane@example.com",
      source: "pricing",
      company: "",
      service: "",
      message: "",
    }),
    "Company is required.",
  );

  assert.equal(
    validateLeadPayload({
      name: "Jane Doe",
      email: "jane@example.com",
      source: "contact",
      company: "Acme",
      service: "",
      message: "Need help",
    }),
    "Please select a service.",
  );

  assert.equal(
    validateLeadPayload({
      name: "Jane Doe",
      email: "jane@example.com",
      source: "pricing",
      company: "Acme",
      service: "audit",
      message: "   ",
    }),
    "Please provide more details.",
  );
});

test("validateLeadPayload allows minimal non-pricing lead payloads", () => {
  assert.equal(
    validateLeadPayload({
      name: "Jane Doe",
      email: "jane@example.com",
      auditId: "audit-123",
    }),
    null,
  );
});
