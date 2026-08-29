import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { Brand } from "@/components/brand";
import { can, privilegeLabel, roleLabel } from "@/lib/rbac";
import { clinicianName, initials } from "@/lib/format";
import type { Privilege, SessionUser } from "@/lib/types";

type NavItem = {
  href: string;
  label: string;
  privilege?: Privilege;
};

export function AppShell({
  user,
  children,
  nav,
  eyebrow,
}: {
  user: SessionUser;
  children: React.ReactNode;
  nav: NavItem[];
  eyebrow: string;
}) {
  const items = nav.filter((item) => !item.privilege || can(user, item.privilege));
  const home = user.organizationType === "PCP" ? "/pcp" : "/specialist";

  return (
    <div className="min-h-screen bg-paper">
      <div className="flex min-h-screen">
        <aside className="hidden w-[248px] shrink-0 border-r border-line bg-[#f7f1e8] md:flex md:flex-col">
          <div className="border-b border-line px-5 py-5">
            <Link href={home}>
              <Brand subtitle={eyebrow} />
            </Link>
          </div>
          <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-white hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-line p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
              Your access
            </div>
            <ul className="mt-2 space-y-1 text-[12px] text-ink-soft">
              {user.privileges.slice(0, 4).map((p) => (
                <li key={p}>· {privilegeLabel(p)}</li>
              ))}
            </ul>
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-4 border-b border-line bg-white/80 px-4 py-3 backdrop-blur md:px-8">
            <div className="md:hidden">
              <Brand />
            </div>
            <div className="hidden text-sm text-ink-soft md:block">
              {user.organizationName}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right leading-tight">
                <div className="text-sm font-medium">
                  {clinicianName(user.name, user.credentials)}
                </div>
                <div className="text-[11px] uppercase tracking-[0.12em] text-ink-soft">
                  {roleLabel(user.role)}
                </div>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-xs font-semibold text-sand">
                {initials(user.name)}
              </div>
              <form action={logoutAction}>
                <button className="text-sm text-ink-soft hover:text-ink" type="submit">
                  Sign out
                </button>
              </form>
            </div>
          </header>
          <div className="flex gap-2 overflow-x-auto border-b border-line px-4 py-2 md:hidden">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs text-ink-soft"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <main className="flex-1 px-4 py-8 md:px-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
