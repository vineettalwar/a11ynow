import test from "node:test";
import assert from "node:assert/strict";
import { ScanGate, ScanGateShutdownError, getScanMaxConcurrent } from "./scan-gate";

test("getScanMaxConcurrent defaults to 2", () => {
  const prev = process.env.SCAN_MAX_CONCURRENT;
  delete process.env.SCAN_MAX_CONCURRENT;
  assert.equal(getScanMaxConcurrent(), 2);
  if (prev !== undefined) process.env.SCAN_MAX_CONCURRENT = prev;
});

test("getScanMaxConcurrent respects env cap at 4", () => {
  const prev = process.env.SCAN_MAX_CONCURRENT;
  process.env.SCAN_MAX_CONCURRENT = "99";
  assert.equal(getScanMaxConcurrent(), 4);
  if (prev !== undefined) process.env.SCAN_MAX_CONCURRENT = prev;
  else delete process.env.SCAN_MAX_CONCURRENT;
});

test("ScanGate limits concurrent holders", async () => {
  const gate = new ScanGate(2);
  let peak = 0;
  let active = 0;

  const job = async (ms: number) => {
    await gate.acquire();
    active++;
    peak = Math.max(peak, active);
    await new Promise<void>((r) => setTimeout(r, ms));
    active--;
    gate.release();
  };

  await Promise.all([job(30), job(30), job(30), job(30)]);
  assert.equal(peak, 2);
  assert.equal(gate.getActiveCount(), 0);
  assert.equal(gate.getQueueLength(), 0);
});

test("ScanGate serves queued acquirers in FIFO order", async () => {
  const gate = new ScanGate(1);
  const order: number[] = [];

  const job = async (id: number, ms: number) => {
    await gate.acquire();
    order.push(id);
    await new Promise<void>((r) => setTimeout(r, ms));
    gate.release();
  };

  await Promise.all([job(1, 20), job(2, 5), job(3, 5)]);
  assert.deepEqual(order, [1, 2, 3]);
});

test("ScanGate rejects new acquire after shutdown begins", async () => {
  const gate = new ScanGate(1);
  await gate.acquire();
  gate.beginShutdown();
  await assert.rejects(() => gate.acquire(), ScanGateShutdownError);
  gate.release();
});

test("ScanGate waitForDrain resolves when active hits zero", async () => {
  const gate = new ScanGate(2);
  await gate.acquire();
  const drainPromise = gate.waitForDrain(2_000);
  setTimeout(() => gate.release(), 50);
  assert.equal(await drainPromise, true);
});
