import Link from "next/link";
import { eq } from "drizzle-orm";
import { practices } from "@/db/schema";
import { getDb } from "@/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { can } from "@/lib/privileges";
import { ConsultsHome } from "@/components/consults-home";
import { isDemo } from "@/lib/env";

export default async function ConsultsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const db = await getDb();
  const practice = session.practiceId
    ? (await db.select().from(practices).where(eq(practices.id, session.practiceId)).limit(1))[0]
    : null;
  const settingsHref = session.isPracticeCreator ? "/team" : "/settings";
  const profileIncomplete = session.isPracticeCreator
    ? Boolean(session.practiceId) &&
      (!session.firstName.trim() || !session.lastName.trim() || !practice?.phone)
    : !session.firstName.trim() || !session.lastName.trim();
  const canRequest = can(session.role, "createConsult") && Boolean(session.practiceId);

  return (
    <div>
      <ConsultsHome
        showIdentifiers
        canRequest={canRequest}
        settingsHref={settingsHref}
      />
      {profileIncomplete ? (
        <p className="sans mt-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <Link href={settingsHref} className="font-semibold underline underline-offset-2">
            Add practice details, invite other users
          </Link>
        </p>
      ) : null}
      {isDemo() ? (
        <p className="sans mt-8 text-xs text-[#5b6573]">
          SMS is stubbed in demo.{" "}
          <Link href="/demo/outbox" className="underline underline-offset-2">
            Open demo messages
          </Link>
        </p>
      ) : null}
    </div>
  );
}
