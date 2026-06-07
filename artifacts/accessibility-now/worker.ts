import { handleQueueBatch } from "./src/server/jobs/process-queue-message";
import { runDueScans } from "./src/server/scheduler";

// OpenNext emits the fetch handler from .open-next/worker.js
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error — generated at build time
import openNextWorker from "./.open-next/worker.js";

const worker = openNextWorker as {
  fetch: ExportedHandlerFetchHandler;
  scheduled?: ExportedHandlerScheduledHandler;
  queue?: ExportedHandlerQueueHandler;
};

export default {
  fetch: worker.fetch.bind(worker),
  async scheduled(
    controller: ScheduledController,
    env: CloudflareEnv,
    ctx: ExecutionContext,
  ) {
    ctx.waitUntil(
      (async () => {
        if (worker.scheduled) {
          await worker.scheduled(controller, env, ctx);
        }
        await runDueScans();
      })(),
    );
  },
  async queue(batch: MessageBatch, env: CloudflareEnv, ctx: ExecutionContext) {
    ctx.waitUntil(handleQueueBatch(batch as MessageBatch<import("./src/server/jobs/types").QueueMessage>));
  },
};
