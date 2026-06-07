export type {
  CreateLeadBody as LeadPayload,
  LeadResponse as LeadRecordResponse,
} from "@workspace/api-client-react";

export type LeadRecord = {
  leadId: string;
  name: string;
  email: string;
  auditId: string | null;
  company: string | null;
  service: string | null;
  message: string | null;
  websiteUrl: string | null;
  source: string | null;
  createdAt: string;
};
