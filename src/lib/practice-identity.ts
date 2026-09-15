/** Stable identity for a practice: lowercased name + digits-only ZIP. */
export function normalizePostalCode(zip: string): string {
  return zip.replace(/\D/g, "").slice(0, 9);
}

export function practiceNameZipKey(name: string, postalCode: string): string {
  const n = name.trim().toLowerCase().replace(/\s+/g, " ");
  const z = normalizePostalCode(postalCode);
  return `${n}|${z}`;
}

export function isValidUsZip(postalCode: string): boolean {
  const z = normalizePostalCode(postalCode);
  return z.length === 5 || z.length === 9;
}

export function formatZipDisplay(postalCode: string): string {
  const z = normalizePostalCode(postalCode);
  if (z.length === 9) return `${z.slice(0, 5)}-${z.slice(5)}`;
  return z || "—";
}
