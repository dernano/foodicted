import "dotenv/config";

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  notifyEmailTo: process.env.NOTIFY_EMAIL_TO ?? "",
  notifyEmailUser: process.env.NOTIFY_EMAIL_USER ?? "",
  notifyEmailAppPassword: process.env.NOTIFY_EMAIL_APP_PASSWORD ?? "",
};

export function assertAnthropicConfigured(): void {
  if (!config.anthropicApiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Copy backend/.env.example to backend/.env and add your key."
    );
  }
}

export { requireEnv };
