import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { APP_NAME } from "@/lib/brand";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
      <p className="sans text-center text-sm font-medium tracking-[0.16em] text-teal-800">
        {APP_NAME}
      </p>
      <h1 className="mt-2 text-center text-4xl">Sign in or create a login</h1>
      <p className="sans mx-auto mt-3 max-w-xl text-center text-[#3d4a5c]">
        Start with your practice name and ZIP. If that practice already exists, contact its
        administrator for an invite — or claim the name if the listing is incorrect.
      </p>
      <div className="mt-8">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
