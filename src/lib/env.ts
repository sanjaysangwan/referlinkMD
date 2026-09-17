export function appEnv(): "demo" | "production" {
  return process.env.APP_ENV === "production" ? "production" : "demo";
}

export function isDemo(): boolean {
  return appEnv() === "demo";
}

export function appUrl(): string {
  const configured = process.env.APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const railwayHost =
    process.env.RAILWAY_STATIC_URL?.trim() ||
    process.env.RAILWAY_SERVICE_REFERLINKMD_URL?.trim() ||
    process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (railwayHost) {
    return railwayHost.startsWith("http")
      ? railwayHost.replace(/\/$/, "")
      : `https://${railwayHost.replace(/\/$/, "")}`;
  }

  return "http://localhost:4000";
}

export function authSecret(): string {
  return process.env.AUTH_SECRET ?? "dev-only-referlink-secret-change-me-32";
}

export const DEMO_PASSWORD = "demo1234";
export const DEMO_MFA_SECRET = "JBSWY3DPEHPK3PXP";

/** Password reset link lifetime. */
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
