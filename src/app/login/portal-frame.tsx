import Link from "next/link";
import { Brand } from "@/components/brand";
import { LoginForm } from "./login-form";

export function PortalFrame({
  portal,
  title,
  kicker,
  copy,
}: {
  portal: "pcp" | "specialist";
  title: string;
  kicker: string;
  copy: string;
}) {
  const other = portal === "pcp" ? "/login/specialist" : "/login/pcp";
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <section
        className={`relative hidden flex-col justify-between p-12 text-sand lg:flex ${
          portal === "pcp" ? "bg-ink" : "bg-harbor-deep"
        }`}
      >
        <Brand light subtitle={kicker} />
        <div>
          <h1 className="max-w-md text-5xl leading-[1.05] text-white">{title}</h1>
          <p className="mt-5 max-w-md text-base leading-7 text-white/75">{copy}</p>
        </div>
        <p className="text-sm text-white/50">
          Demo clinic data only. Do not enter real patient information.
        </p>
      </section>
      <section className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Brand subtitle={kicker} />
          </div>
          <h2 className="text-3xl">{portal === "pcp" ? "Primary care sign in" : "Specialist sign in"}</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Need the other door?{" "}
            <Link className="font-semibold text-harbor" href={other}>
              {portal === "pcp" ? "Specialist portal" : "PCP portal"}
            </Link>
          </p>
          <div className="mt-8">
            <LoginForm portal={portal} />
          </div>
        </div>
      </section>
    </div>
  );
}
