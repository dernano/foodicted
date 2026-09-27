import nodemailer, { type Transporter } from "nodemailer";
import { config } from "../config.js";

let transporter: Transporter | null = null;

function isConfigured(): boolean {
  return !!(config.notifyEmailUser && config.notifyEmailAppPassword && config.notifyEmailTo);
}

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: config.notifyEmailUser, pass: config.notifyEmailAppPassword },
    });
  }
  return transporter;
}

export function isNotifyConfigured(): boolean {
  return isConfigured();
}

/**
 * Usage notification for the app owner - never throws (callers can safely
 * await it without try/catch) and never surfaces anything to the app/user.
 * Silently does nothing if the notify env vars aren't set. Awaited by
 * callers (rather than truly fire-and-forget) so the email actually gets
 * sent before a low-traffic instance might spin back down.
 */
export async function notifyUsage(action: string): Promise<void> {
  if (!isConfigured()) return;
  const timestamp = new Date().toLocaleString("de-DE", { timeZone: "Europe/Vienna" });
  try {
    await getTransporter().sendMail({
      from: config.notifyEmailUser,
      to: config.notifyEmailTo,
      subject: `Foodicted: ${action}`,
      text: `${action}\n${timestamp}`,
    });
    console.log(`[notify] Sent usage email: ${action}`);
  } catch (err) {
    console.warn("[notify] Failed to send usage notification email", err);
  }
}
