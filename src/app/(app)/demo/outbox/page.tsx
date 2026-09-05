"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Message = {
  id: string;
  channel: string;
  to: string;
  templateKey: string;
  body: string;
  createdAt: string;
};

export default function DemoOutboxPage() {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    void fetch("/api/outbox")
      .then((r) => r.json())
      .then((d) => setMessages(d.messages ?? []));
  }, []);

  return (
    <div>
      <h1 className="text-3xl">Demo inbox</h1>
      <p className="sans mt-2 max-w-2xl text-sm text-[#3d4a5c]">
        Carrier SMS is stubbed. These messages contain a secure link and public clinician names only —
        never patient name, DOB, or phone.
      </p>
      <ul className="mt-6 space-y-4">
        {messages.length === 0 ? (
          <li className="chart-card p-6 text-sm text-[#5b6573]">No demo messages yet. Request a consult or send an invite.</li>
        ) : (
          messages.map((m) => (
            <li key={m.id} className="chart-card p-5">
              <div className="sans flex justify-between text-xs font-semibold tracking-wide text-[#5b6573] uppercase">
                <span>
                  {m.channel} · {m.templateKey}
                </span>
                <span>{new Date(m.createdAt).toLocaleString()}</span>
              </div>
              <p className="sans mt-2 text-sm text-[#3d4a5c]">To {m.to}</p>
              <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed">{m.body}</p>
              {m.body.includes("/c/") || m.body.includes("/invite/") ? (
                <p className="sans mt-3 text-xs text-teal-900">
                  Open the path from the message, or start at the{" "}
                  <Link className="underline" href="/login">
                    login
                  </Link>{" "}
                  page.
                </p>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
