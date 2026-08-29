"use client";

import { useActionState } from "react";
import { demoLoginAction, loginAction, type LoginState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, roleLabel } from "@/lib/rbac";

export function LoginForm({
  portal,
}: {
  portal: "pcp" | "specialist";
}) {
  const [state, action] = useActionState<LoginState, FormData>(loginAction, null);
  const accounts = DEMO_ACCOUNTS[portal];

  return (
    <div className="space-y-8">
      <form action={action} className="space-y-4">
        <input type="hidden" name="portal" value={portal} />
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
            Email
          </span>
          <input
            name="email"
            type="email"
            autoComplete="username"
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 outline-none ring-harbor/30 focus:ring-2"
            placeholder={accounts[0].email}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
            Password
          </span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 outline-none ring-harbor/30 focus:ring-2"
          />
        </label>
        {state?.error ? (
          <p className="rounded-xl bg-[#f8e8e4] px-3 py-2 text-sm text-coral">{state.error}</p>
        ) : null}
        <SubmitButton className="w-full rounded-full bg-harbor py-3 text-sm font-semibold text-white hover:bg-harbor-deep disabled:opacity-60">
          Sign in
        </SubmitButton>
      </form>

      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">Demo roster</h2>
          <p className="text-xs text-ink-soft">Password {DEMO_PASSWORD}</p>
        </div>
        <div className="grid gap-2">
          {accounts.map((account) => (
            <form key={account.email} action={demoLoginAction}>
              <input type="hidden" name="portal" value={portal} />
              <input type="hidden" name="email" value={account.email} />
              <button
                type="submit"
                className="flex w-full items-start justify-between rounded-2xl border border-line bg-white px-4 py-3 text-left hover:border-harbor/40 hover:bg-mist/40"
              >
                <span>
                  <span className="block text-sm font-medium">
                    {account.name}, {account.credentials}
                  </span>
                  <span className="block text-xs text-ink-soft">{account.note}</span>
                </span>
                <span className="rounded-full bg-sand px-2 py-0.5 text-[11px] font-semibold text-ink-soft">
                  {roleLabel(account.role)}
                </span>
              </button>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
