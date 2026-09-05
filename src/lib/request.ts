import { headers } from "next/headers";

export async function requestMeta(): Promise<{ ip: string; userAgent: string }> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || h.get("x-real-ip") || "127.0.0.1";
  const userAgent = h.get("user-agent") || "unknown";
  return { ip, userAgent };
}
