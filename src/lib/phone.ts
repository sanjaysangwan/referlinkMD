/** Normalize US-centric clinician/patient phones to E.164. */
export function toE164(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (input.trim().startsWith("+") && digits.length >= 11 && digits.length <= 15) {
    return `+${digits}`;
  }
  return null;
}

export function formatPhone(e164: string): string {
  const m = e164.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (!m) return e164;
  return `(${m[1]}) ${m[2]}-${m[3]}`;
}

/** Mask for phone inputs: xxx-xxx-xxxx */
export function formatPhoneInput(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  digits = digits.slice(0, 10);
  return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 10)].filter(Boolean).join("-");
}

export function parseClinicianName(name: string): { firstName: string; lastName: string } | null {
  const cleaned = name
    .trim()
    .replace(/,/g, " ")
    .replace(/\b(md|do|np|pa|pa-c|app|rn)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return null;
  const parts = cleaned.split(" ");
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export function pendingEmailForPhone(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  return `pending+${digits}@referlink.pending`;
}
