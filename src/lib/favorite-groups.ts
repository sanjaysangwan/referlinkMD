/** Group directory consultants under specialty headings (label already includes subspecialty when set). */

export type SpecialtyGroupItem = {
  id: string;
  firstName: string;
  lastName: string;
  specialtyLabel?: string | null;
};

export type SpecialtyGroup<T extends SpecialtyGroupItem> = {
  specialty: string;
  consultants: T[];
};

const UNSPECIFIED = "Specialty not set";

export function groupFavoritesBySpecialty<T extends SpecialtyGroupItem>(items: T[]): SpecialtyGroup<T>[] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = item.specialtyLabel?.trim() || UNSPECIFIED;
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }

  const keys = [...map.keys()].sort((a, b) => {
    if (a === UNSPECIFIED) return 1;
    if (b === UNSPECIFIED) return -1;
    return a.localeCompare(b, undefined, { sensitivity: "base" });
  });

  return keys.map((specialty) => ({
    specialty,
    consultants: (map.get(specialty) ?? []).slice().sort((a, b) => {
      const byLast = a.lastName.localeCompare(b.lastName, undefined, { sensitivity: "base" });
      if (byLast) return byLast;
      return a.firstName.localeCompare(b.firstName, undefined, { sensitivity: "base" });
    }),
  }));
}
