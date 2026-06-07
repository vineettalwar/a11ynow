import * as z from "zod";

export const LEAD_SERVICE_OPTIONS = [
  { value: "audit", label: "Full Accessibility Audit" },
  { value: "remediation", label: "Remediation & Development" },
  { value: "monitoring", label: "Ongoing Monitoring" },
  { value: "unsure", label: "Not sure - need a consultation" },
] as const;

export type LeadServiceValue = (typeof LEAD_SERVICE_OPTIONS)[number]["value"];

export const CONTACT_LEAD_FORM_SCHEMA = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Must be a valid email"),
  company: z.string().min(2, "Company is required"),
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  service: z.string().min(1, "Please select a service"),
  message: z.string().min(10, "Please provide more details"),
});

export const PRICING_LEAD_FORM_SCHEMA = CONTACT_LEAD_FORM_SCHEMA.omit({
  url: true,
});

export type ContactLeadFormValues = z.infer<typeof CONTACT_LEAD_FORM_SCHEMA>;
export type PricingLeadFormValues = z.infer<typeof PRICING_LEAD_FORM_SCHEMA>;
