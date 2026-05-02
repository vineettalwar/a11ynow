import nodemailer from "nodemailer";
import { logger } from "./logger";

function createTransport() {
  const host = process.env["SMTP_HOST"];
  const port = Number(process.env["SMTP_PORT"] ?? 587);
  const user = process.env["SMTP_USER"];
  const pass = process.env["SMTP_PASS"];

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

const FROM = process.env["FROM_EMAIL"] ?? "noreply@accessibility.now";

export async function sendMonitoringConfirmation(opts: {
  to: string;
  url: string;
  frequency: string;
  token: string;
  appBaseUrl: string;
}) {
  const resultsUrl = `${opts.appBaseUrl}/monitor/${opts.token}`;
  const subject = `Monitoring set up for ${opts.url}`;
  const text = [
    `Hi,`,
    ``,
    `You've registered ${opts.url} for ${opts.frequency} accessibility monitoring with accessibility.now.`,
    ``,
    `We'll scan your site and email you a summary after each scan. You can view your score history anytime at:`,
    `${resultsUrl}`,
    ``,
    `Keep this link safe — it's your unique results page.`,
    ``,
    `— The accessibility.now team`,
  ].join("\n");

  await sendEmail({ to: opts.to, subject, text });
}

export async function sendMonitoringSummary(opts: {
  to: string;
  url: string;
  token: string;
  appBaseUrl: string;
  score: number;
  previousScore: number | null;
  criticalViolations: number;
  seriousViolations: number;
  totalViolations: number;
  topIssues: Array<{ description: string; impact: string }>;
}) {
  const resultsUrl = `${opts.appBaseUrl}/monitor/${opts.token}`;
  const scoreDelta =
    opts.previousScore !== null ? opts.score - opts.previousScore : null;
  const deltaStr =
    scoreDelta === null
      ? ""
      : scoreDelta > 0
        ? ` (▲ ${scoreDelta} from last scan)`
        : scoreDelta < 0
          ? ` (▼ ${Math.abs(scoreDelta)} from last scan)`
          : " (no change from last scan)";

  const issueLines = opts.topIssues
    .slice(0, 5)
    .map((i) => `  • [${i.impact.toUpperCase()}] ${i.description}`)
    .join("\n");

  const subject = `Accessibility scan complete — ${opts.url} scored ${opts.score}/100`;
  const text = [
    `Scan complete for ${opts.url}`,
    ``,
    `Score: ${opts.score}/100${deltaStr}`,
    `Critical violations: ${opts.criticalViolations}`,
    `Serious violations:  ${opts.seriousViolations}`,
    `Total violations:    ${opts.totalViolations}`,
    ``,
    opts.topIssues.length > 0 ? `Top issues:\n${issueLines}` : "No violations detected.",
    ``,
    `View your full score history: ${resultsUrl}`,
    ``,
    `— The accessibility.now team`,
  ].join("\n");

  await sendEmail({ to: opts.to, subject, text });
}

async function sendEmail(opts: { to: string; subject: string; text: string }) {
  const transport = createTransport();

  if (!transport) {
    logger.info(
      { to: opts.to, subject: opts.subject },
      "[email] SMTP not configured — would send email",
    );
    logger.debug({ body: opts.text }, "[email] body");
    return;
  }

  try {
    await transport.sendMail({ from: FROM, ...opts });
    logger.info({ to: opts.to, subject: opts.subject }, "[email] sent");
  } catch (err) {
    logger.error({ err, to: opts.to, subject: opts.subject }, "[email] send failed");
  }
}
