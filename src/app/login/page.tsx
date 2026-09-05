import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { APP_NAME } from "@/lib/brand";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
      <p className="sans text-center text-sm font-medium tracking-[0.16em] text-teal-800">
        {APP_NAME}
      </p>
      <h1 className="mt-2 text-center text-4xl">Sign in or create a practice</h1>
      <p className="sans mx-auto mt-3 max-w-xl text-center text-[#3d4a5c]">
        New practices need only email, password, practice name, and your credential. Add staff later
        by email — they set their own password from the invite link.
      </p>
      <div className="mt-8">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
