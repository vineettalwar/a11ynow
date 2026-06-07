export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.ENABLE_LOCAL_SCHEDULER === "1") {
    const { startLocalScheduler } = await import("@/server/scheduler");
    startLocalScheduler();
  }
}
