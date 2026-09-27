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

/**
 * Fire-and-forget usage notification for the app owner - never throws, never
 * awaited by callers, and never delays or affects the actual API response.
 * Silently does nothing if the notify env vars aren't set.
 */
export function notifyUsage(action: string): void {
  if (!isConfigured()) return;
  const timestamp = new Date().toLocaleString("de-DE", { timeZone: "Europe/Vienna" });
  getTransporter()
    .sendMail({
      from: config.notifyEmailUser,
      to: config.notifyEmailTo,
      subject: `Foodicted: ${action}`,
      text: `${action}\n${timestamp}`,
    })
    .catch((err: unknown) => console.warn("Failed to send usage notification email", err));
}
