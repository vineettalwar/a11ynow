export type ScanJobStatus = "pending" | "running" | "completed" | "failed";
export type BatchJobStatus = "pending" | "running" | "completed" | "failed";

export type QueueMessage =
  | { type: "audit"; jobId: string; auditId: string; url: string; profile: "default" | "strict"; multiViewport: boolean }
  | { type: "batch"; batchJobId: string }
  | { type: "monitor"; monitoredUrlId: string };

export interface BatchJobUrlState {
  url: string;
  status: "queued" | "scanning" | "done" | "error";
  score?: number;
  level?: string;
  auditId?: string;
  error?: string;
}

export interface BatchJobProgress {
  discoverySource?: "sitemap" | "links" | "single";
  discovering: boolean;
  urlStates: BatchJobUrlState[];
}

export interface BatchJobResultPayload {
  siteScore: number;
  siteLevel: string;
  scannedAt: string;
  pages: Array<Record<string, unknown>>;
  crossPageViolations: Array<Record<string, unknown>>;
}
