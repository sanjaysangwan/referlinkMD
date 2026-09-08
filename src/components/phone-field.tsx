"use client";

import { Smartphone } from "lucide-react";
import { formatPhoneInput } from "@/lib/phone";

const inputClass =
  "w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2 text-base text-[#0f1c2e]";

type PhoneFieldProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  /** Show smartphone icon — cell/mobile fields only */
  mobile?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  autoComplete?: string;
  disabled?: boolean;
};

export function PhoneField({
  id,
  value,
  onChange,
  mobile = false,
  required,
  placeholder = "xxx-xxx-xxxx",
  className = "",
  autoComplete = "tel",
  disabled,
}: PhoneFieldProps) {
  const display = value.startsWith("+")
    ? formatPhoneInput(value)
    : formatPhoneInput(value);

  return (
    <div className={`relative ${className}`}>
      {mobile ? (
        <Smartphone
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-teal-800"
        />
      ) : null}
      <input
        id={id}
        type="tel"
        inputMode="tel"
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
        title="Enter a 10-digit phone number: xxx-xxx-xxxx"
        placeholder={placeholder}
        className={`${inputClass} ${mobile ? "pl-10" : ""}`}
        value={display}
        onChange={(e) => onChange(formatPhoneInput(e.target.value))}
      />
      {mobile ? <span className="sr-only">Mobile phone</span> : null}
    </div>
  );
}

export function MobilePhoneText({
  phone,
  className = "",
}: {
  phone: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <Smartphone aria-hidden className="h-3.5 w-3.5 shrink-0 text-teal-800" />
      <span>{phone}</span>
    </span>
  );
}
