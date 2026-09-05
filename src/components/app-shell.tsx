"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ROLE_LABEL } from "@/lib/privileges";
import type { SessionUser } from "@/lib/types";
import { PracticeMark } from "@/components/practice-mark";
import { APP_NAME } from "@/lib/brand";

function NewBadge({ count }: { count: number }) {
  if (count < 1) return null;
  return (
    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] leading-none font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

type NavLink = { href: string; label: string; badge: boolean; match: string[] };

function Brand({ session }: { session: SessionUser }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <PracticeMark name={session.practiceName ?? APP_NAME} logo={session.practiceLogo} size={40} />
      <div className="min-w-0">
        <p className="sans text-xs font-semibold tracking-[0.12em] text-teal-800">{APP_NAME}</p>
        <Link href="/consults" className="block truncate rounded text-lg leading-tight hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-800" aria-label={`${session.practiceName ?? APP_NAME} home`}>{session.practiceName ?? APP_NAME}</Link>
        <p className="sans truncate text-xs text-[#5b6573]">
          {session.firstName || session.lastName
            ? `${session.firstName} ${session.lastName}`.trim()
            : session.email}
          {session.role ? ` · ${ROLE_LABEL[session.role]}` : ""}
        </p>
      </div>
    </div>
  );
}

function NavItems({
  links,
  pathname,
  newCount,
  onLogout,
}: {
  links: NavLink[];
  pathname: string;
  newCount: number;
  onLogout: () => void;
}) {
  return (
    <div className="sans flex flex-col gap-1">
      {links.map((l) => {
        const active = l.match.some((path) => pathname === path || pathname.startsWith(`${path}/`));
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`flex items-center justify-between rounded-xl px-4 py-3 text-base font-semibold ${
              active ? "bg-teal-800 text-white" : "text-[#0f1c2e] hover:bg-[#efe8dc]"
            }`}
          >
            <span>{l.label}</span>
            {l.badge ? <NewBadge count={newCount} /> : null}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={onLogout}
        className="rounded-xl px-4 py-3 text-left text-base font-semibold text-[#5b6573] hover:bg-[#efe8dc]"
      >
        Sign out
      </button>
    </div>
  );
}

export function AppShell({
  session,
  children,
}: {
  session: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [newCount, setNewCount] = useState(0);

  function loadCount() {
    void fetch("/api/inbox/count")
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.newCount === "number") setNewCount(d.newCount);
      });
  }

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    loadCount();
    const id = window.setInterval(loadCount, 60_000);
    return () => window.clearInterval(id);
  }, [pathname]);

  async function logout() {
    setOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const links: NavLink[] = [
    { href: "/consults", label: "Home", badge: true, match: ["/consults", "/inbox"] },
    {
      href: session.isPracticeCreator ? "/team" : "/settings",
      label: "Setting",
      badge: false,
      match: ["/team", "/settings"],
    },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="sans bg-amber-100 px-4 py-2 text-center text-xs font-medium text-amber-950">
        DEMO — synthetic patients only. SMS never includes patient name, DOB, or phone.
      </div>
      <div className="lg:flex lg:items-start">
        <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-[calc(100dvh-2.5rem)] lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-[#e4ddd0] lg:bg-[#fffdf8]">
          <div className="flex h-full flex-col gap-8 px-4 py-6">
            <Brand session={session} />
            <nav className="flex-1">
              <NavItems links={links} pathname={pathname} newCount={newCount} onLogout={logout} />
            </nav>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-[#e4ddd0] bg-[#fffdf8] lg:hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <Brand session={session} />
              <button
                type="button"
                className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#0f1c2e] hover:bg-[#efe8dc]"
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
              >
                {open ? <X size={22} /> : <Menu size={22} />}
                {!open ? (
                  <span className="absolute top-0.5 right-0.5">
                    <NewBadge count={newCount} />
                  </span>
                ) : null}
              </button>
            </div>
            {open ? (
              <nav className="border-t border-[#e4ddd0] px-2 py-2">
                <NavItems links={links} pathname={pathname} newCount={newCount} onLogout={logout} />
              </nav>
            ) : null}
          </header>
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
