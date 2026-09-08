export function appEnv(): "demo" | "production" {
  return process.env.APP_ENV === "production" ? "production" : "demo";
}

export function isDemo(): boolean {
  return appEnv() === "demo";
}

export function appUrl(): string {
  return process.env.APP_URL ?? "http://localhost:4000";
}

export function authSecret(): string {
  return process.env.AUTH_SECRET ?? "dev-only-referlink-secret-change-me-32";
}

export const DEMO_PASSWORD = "demo1234";
export const DEMO_MFA_SECRET = "JBSWY3DPEHPK3PXP";
