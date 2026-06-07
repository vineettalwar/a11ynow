import { runAuditJob } from "../run-audit-job";
import { runBatchJob } from "./run-batch-job";
import { runMonitorJob } from "./run-monitor-job";
import type { QueueMessage } from "./types";
import { logger } from "../logger";

export async function processQueueMessage(message: QueueMessage): Promise<void> {
  switch (message.type) {
    case "audit":
      await runAuditJob(message.auditId, message.url, {
        profile: message.profile,
        multiViewport: message.multiViewport,
        jobId: message.jobId,
      });
      return;
    case "batch":
      await runBatchJob(message.batchJobId);
      return;
    case "monitor":
      await runMonitorJob(message.monitoredUrlId);
      return;
    default: {
      const _exhaustive: never = message;
      logger.warn({ message: _exhaustive }, "Unknown queue message type");
    }
  }
}

export async function handleQueueBatch(batch: MessageBatch<QueueMessage>): Promise<void> {
  for (const msg of batch.messages) {
    try {
      await processQueueMessage(msg.body);
      msg.ack();
    } catch (err) {
      logger.error({ err, message: msg.body }, "Queue message failed");
      msg.retry();
    }
  }
}
