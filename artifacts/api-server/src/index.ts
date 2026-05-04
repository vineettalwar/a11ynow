import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import app from "./app";
import { logger } from "./lib/logger";
import { startScheduler } from "./lib/scheduler";

const isDev = process.env.NODE_ENV === "development";

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
  if (!schedulerStarted) {
    schedulerStarted = true;
    startScheduler();
  }
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

const initialPort = parseInitialPort();
server = app.listen(initialPort);
attachListenErrorHandler(initialPort);
server.once("listening", onListening);
