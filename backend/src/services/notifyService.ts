import { config } from "../config.js";

function isConfigured(): boolean {
  return !!(config.resendApiKey && config.notifyEmailTo);
}

export function isNotifyConfigured(): boolean {
  return isConfigured();
}

/**
 * Usage notification for the app owner - never throws (callers can safely
 * await it without try/catch) and never surfaces anything to the app/user.
 * Silently does nothing if the notify env vars aren't set.
 *
 * Uses Resend's HTTPS API rather than SMTP - many hosts (including Render's
 * free tier) block outbound SMTP ports to prevent spam abuse, but plain
 * HTTPS requests work the same as any other API call this backend makes.
 */
export async function notifyUsage(action: string): Promise<void> {
  if (!isConfigured()) return;
  const timestamp = new Date().toLocaleString("de-DE", { timeZone: "Europe/Vienna" });
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Foodicted <onboarding@resend.dev>",
        to: config.notifyEmailTo,
        subject: `Foodicted: ${action}`,
        text: `${action}\n${timestamp}`,
      }),
    });
    if (!res.ok) {
      console.warn("[notify] Resend request failed", res.status, await res.text());
      return;
    }
    console.log(`[notify] Sent usage email: ${action}`);
  } catch (err) {
    console.warn("[notify] Failed to send usage notification email", err);
  }
}
