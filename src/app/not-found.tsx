import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="text-4xl">That chart is not in this harbor</h1>
      <p className="mt-3 text-ink-soft">The referral or page is missing, or you do not have access.</p>
      <Link href="/" className="mt-6 text-sm font-semibold text-harbor">
        Back to Harbor
      </Link>
    </div>
  );
}
