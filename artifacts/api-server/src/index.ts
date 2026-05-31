import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import app from "./app";
import { logger } from "./lib/logger";
import { probeChromium, CHROMIUM_INSTALL_COMMAND } from "./lib/playwright-chromium";
import { beginScanGateShutdown, waitForScanDrain } from "./lib/scan-gate";
import { startScheduler } from "./lib/scheduler";

const isDev = process.env.NODE_ENV === "development";

function parseShutdownDrainMs(): number {
  const raw = process.env.SHUTDOWN_DRAIN_MS;
  if (raw === undefined || raw === "") return 120_000;
  const n = Number.parseInt(raw, 10);
  return Number.isNaN(n) || n < 5_000 ? 120_000 : n;
}

function parseInitialPort(): number {
  const rawPort = process.env["PORT"];
  if (rawPort === undefined || rawPort === "") {
    if (isDev) {
      return 0;
    }
    throw new Error(
      "PORT environment variable is required but was not provided.",
    );
  }
  const port = Number(rawPort);
  if (Number.isNaN(port) || port < 0 || (port === 0 && !isDev)) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }
  return port;
}

let server: Server;
let schedulerStarted = false;
let shuttingDown = false;

function listeningPort(): number {
  const addr = server.address();
  if (typeof addr === "object" && addr !== null && "port" in addr) {
    return (addr as AddressInfo).port;
  }
  return 0;
}

function onListening(): void {
  const port = listeningPort();
  logger.info({ port }, "Server listening");
  void probeChromium().then((ready) => {
    if (ready) {
      logger.info("Chromium scan engine ready");
    } else {
      logger.warn(
        { installCommand: CHROMIUM_INSTALL_COMMAND },
        "Chromium unavailable; audits will use static HTML fallback until browser is installed",
      );
    }
    if (!schedulerStarted) {
      schedulerStarted = true;
      startScheduler();
    }
  });
}

function fatalListen(err: NodeJS.ErrnoException): void {
  logger.error({ err }, "Error listening on port");
  process.exit(1);
}

function attachListenErrorHandler(requestedPort: number): void {
  server.on("error", (err: NodeJS.ErrnoException) => {
    if (isDev && err.code === "EADDRINUSE" && requestedPort !== 0) {
      logger.warn(
        { port: requestedPort },
        "Port in use; binding to a free port (development only)",
      );
      server.removeAllListeners("error");
      server.close(() => {
        server = app.listen(0);
        attachListenErrorHandler(0);
        server.once("listening", onListening);
      });
      return;
    }
    fatalListen(err);
  });
}

function requestShutdown(signal: string): void {
  if (shuttingDown) return;
  shuttingDown = true;

  const drainMs = parseShutdownDrainMs();
  logger.info({ signal, drainMs }, "Shutdown requested; draining scans and closing server");

  beginScanGateShutdown();

  server.close(() => {
    void waitForScanDrain(drainMs).then((drained) => {
      if (!drained) {
        logger.warn({ drainMs }, "Scan drain timed out; exiting anyway");
      } else {
        logger.info("All in-flight scans drained");
      }
      process.exit(0);
    });
  });

  // Force exit if close hangs (e.g. keep-alive connections)
  setTimeout(() => {
    logger.warn({ drainMs }, "Forced shutdown after grace period");
    process.exit(1);
  }, drainMs + 5_000).unref();
}

process.on("SIGTERM", () => requestShutdown("SIGTERM"));
process.on("SIGINT", () => requestShutdown("SIGINT"));

const initialPort = parseInitialPort();
server = app.listen(initialPort);
attachListenErrorHandler(initialPort);
server.once("listening", onListening);
