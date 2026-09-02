import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { drizzleDb } from "./database";
import * as schema from "./schema";

export const auth = betterAuth({
  secret: process.env.AUTH_SECRET || "referlinkmd-prototype-secret-change-in-prod",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  database: drizzleAdapter(drizzleDb, {
    provider: "sqlite",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      organizationId: { type: "string", required: true, input: true },
      role: { type: "string", required: true, input: true },
      credentials: { type: "string", required: false, input: true },
      phone: { type: "string", required: false, input: true },
    },
  },
  session: {
    expiresIn: 60 * 60 * 12,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  advanced: {
    cookiePrefix: "referlinkmd",
  },
  plugins: [nextCookies()],
});
