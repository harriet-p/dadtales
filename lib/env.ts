function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string): string | undefined {
  return process.env[name];
}

export const env = {
  supabaseUrl: () => requireEnv("SUPABASE_URL"),
  supabaseServiceRoleKey: () => requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  resendApiKey: () => requireEnv("RESEND_API_KEY"),
  resendWebhookSecret: () => requireEnv("RESEND_WEBHOOK_SECRET"),
  fromEmail: () => requireEnv("FROM_EMAIL"),
  /**
   * Where Reply goes so Resend Inbound can capture it.
   * Prefer a receiving subdomain, e.g. questions@reply.harrietperryer.com
   * Falls back to FROM_EMAIL if unset.
   */
  replyToEmail: () => optionalEnv("REPLY_TO_EMAIL") ?? requireEnv("FROM_EMAIL"),
  dadEmail: () => requireEnv("DAD_EMAIL"),
  /** When set, `npm run send -- --test` sends here instead of DAD_EMAIL. */
  testEmail: () => optionalEnv("TEST_EMAIL"),
  /** Gets a copy of each captured reply (defaults to TEST_EMAIL). */
  notifyEmail: () =>
    optionalEnv("NOTIFY_EMAIL") ?? optionalEnv("TEST_EMAIL"),
  cronSecret: () => optionalEnv("CRON_SECRET"),
  exportSecret: () => requireEnv("EXPORT_SECRET"),
  storageBucket: () => optionalEnv("SUPABASE_STORAGE_BUCKET") ?? "answer-photos",
};
