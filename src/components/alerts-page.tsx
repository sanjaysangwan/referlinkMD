import { redirect } from "next/navigation";
import { updateAlertPreferencesAction } from "@/app/actions/referrals";
import { SubmitButton } from "@/components/submit-button";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPhone } from "@/lib/notifications";
import { can } from "@/lib/rbac";

export default async function AlertsPage({
  portal,
}: {
  portal: "pcp" | "specialist";
}) {
  const user = await requireUser(portal === "pcp" ? "PCP" : "SPECIALIST");
  if (!can(user, "MANAGE_ALERTS")) {
    redirect(portal === "pcp" ? "/pcp" : "/specialist");
  }
  const pref = db.preferencesFor(user.id);
  const logs =
    portal === "specialist"
      ? db.alertsForOrg(user.organizationId).slice(0, 12)
      : db.alerts().filter((a) => a.recipientUserId === user.id).slice(0, 8);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-harbor">
          Notifications
        </p>
        <h1 className="mt-2 text-4xl">Text and phone alerts</h1>
        <p className="mt-2 text-ink-soft">
          Phase one uses a Twilio-shaped adapter. Without credentials, Harbor records a
          delivered mock so the referral flow is still demonstrable. Wire{" "}
          <code className="text-xs">TWILIO_*</code> env vars for live SMS and voice.
        </p>
      </div>

      <form
        action={updateAlertPreferencesAction}
        className="space-y-4 rounded-3xl border border-line bg-white p-6"
      >
        <label className="flex items-center justify-between gap-4 rounded-2xl bg-sand/50 px-4 py-3">
          <span>
            <span className="block font-medium">Text message</span>
            <span className="text-sm text-ink-soft">{formatPhone(user.phone)}</span>
          </span>
          <input
            type="checkbox"
            name="smsEnabled"
            defaultChecked={pref.smsEnabled}
            className="h-4 w-4"
          />
        </label>
        <label className="flex items-center justify-between gap-4 rounded-2xl bg-sand/50 px-4 py-3">
          <span>
            <span className="block font-medium">Phone call</span>
            <span className="text-sm text-ink-soft">Used for urgent referrals</span>
          </span>
          <input
            type="checkbox"
            name="voiceEnabled"
            defaultChecked={pref.voiceEnabled}
            className="h-4 w-4"
          />
        </label>
        <label className="flex items-center justify-between gap-4 rounded-2xl bg-sand/50 px-4 py-3">
          <span>
            <span className="block font-medium">Also call after hours</span>
            <span className="text-sm text-ink-soft">Voice on routine traffic if enabled</span>
          </span>
          <input
            type="checkbox"
            name="afterHoursVoice"
            defaultChecked={pref.afterHoursVoice}
            className="h-4 w-4"
          />
        </label>
        <SubmitButton className="rounded-full bg-harbor px-5 py-2.5 text-sm font-semibold text-white">
          Save alert preferences
        </SubmitButton>
      </form>

      {can(user, "VIEW_ALERT_LOG") || portal === "specialist" ? (
        <section className="rounded-3xl border border-line bg-white p-6">
          <h2 className="text-xl">Recent deliveries</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {logs.map((a) => (
              <li key={a.id} className="border-b border-line pb-3 last:border-0">
                <div className="font-medium">
                  {a.channel} · {a.status} · {formatPhone(a.to)}
                </div>
                <div className="text-ink-soft">{a.message}</div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
