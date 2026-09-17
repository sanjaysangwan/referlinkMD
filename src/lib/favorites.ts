import { and, desc, eq, sql } from "drizzle-orm";
import {
  favoriteConsultantStars,
  favoriteConsultants,
  practiceMemberships,
  practices,
  specialties,
  specialtySubspecialties,
  users,
} from "@/db/schema";
import { getDb } from "@/db";
import { hashPassword, randomTempPassword } from "@/lib/crypto";
import { parseClinicianName, pendingEmailForPhone, toE164 } from "@/lib/phone";
import {
  physicianSpecialtyLabel,
  resolveSpecialtyLabel,
  validatePhysicianSpecialty,
} from "@/lib/specialty";

export type FavoriteConsultant = {
  id: string;
  firstName: string;
  lastName: string;
  mobilePhone: string | null;
  officePhone: string | null;
  healthSystemName: string | null;
  healthSystemLogo: string | null;
  specialtyLabel: string | null;
  starred: boolean;
};

function practiceOfficeSql() {
  return sql<string | null>`(
    select p.phone
    from practice_memberships pm
    inner join practices p on p.id = pm.practice_id
    where pm.user_id = "users"."id"
      and pm.status = 'active'
    order by pm.created_at desc
    limit 1
  )`;
}

function healthSystemNameSql() {
  return sql<string | null>`(
    select hs.name
    from practice_memberships pm
    inner join practices p on p.id = pm.practice_id
    inner join health_systems hs on hs.id = p.health_system_id
    where pm.user_id = "users"."id"
      and pm.status = 'active'
    order by pm.created_at desc
    limit 1
  )`;
}

function healthSystemLogoSql() {
  return sql<string | null>`(
    select hs.logo
    from practice_memberships pm
    inner join practices p on p.id = pm.practice_id
    inner join health_systems hs on hs.id = p.health_system_id
    where pm.user_id = "users"."id"
      and pm.status = 'active'
    order by pm.created_at desc
    limit 1
  )`;
}

export async function listFavoriteConsultants(
  practiceId: string,
  viewerUserId: string,
): Promise<FavoriteConsultant[]> {
  const db = await getDb();
  const rows = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      mobilePhone: users.mobilePhone,
      savedOfficePhone: favoriteConsultants.officePhone,
      practiceOfficePhone: practiceOfficeSql(),
      healthSystemName: healthSystemNameSql(),
      healthSystemLogo: healthSystemLogoSql(),
      specialtyName: specialties.name,
      subspecialtyName: specialtySubspecialties.name,
      starId: favoriteConsultantStars.id,
    })
    .from(favoriteConsultants)
    .innerJoin(users, eq(users.id, favoriteConsultants.consultantUserId))
    .leftJoin(specialties, eq(specialties.id, users.specialtyId))
    .leftJoin(specialtySubspecialties, eq(specialtySubspecialties.id, users.subspecialtyId))
    .leftJoin(
      favoriteConsultantStars,
      and(
        eq(favoriteConsultantStars.consultantUserId, favoriteConsultants.consultantUserId),
        eq(favoriteConsultantStars.userId, viewerUserId),
      ),
    )
    .where(eq(favoriteConsultants.practiceId, practiceId))
    .orderBy(desc(favoriteConsultants.createdAt));

  return rows.map((row) => ({
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    mobilePhone: row.mobilePhone,
    officePhone: row.savedOfficePhone || row.practiceOfficePhone || null,
    healthSystemName: row.healthSystemName,
    healthSystemLogo: row.healthSystemLogo,
    specialtyLabel: physicianSpecialtyLabel({
      specialtyName: row.specialtyName,
      subspecialtyName: row.subspecialtyName,
    }),
    starred: Boolean(row.starId),
  }));
}

async function ensureFavorite(
  practiceId: string,
  addedByUserId: string,
  consultantUserId: string,
  officePhone: string | null,
): Promise<"added" | "exists"> {
  const db = await getDb();
  const [existing] = await db
    .select({ id: favoriteConsultants.id, officePhone: favoriteConsultants.officePhone })
    .from(favoriteConsultants)
    .where(
      and(
        eq(favoriteConsultants.practiceId, practiceId),
        eq(favoriteConsultants.consultantUserId, consultantUserId),
      ),
    )
    .limit(1);
  if (existing) {
    if (officePhone && officePhone !== existing.officePhone) {
      await db
        .update(favoriteConsultants)
        .set({ officePhone })
        .where(eq(favoriteConsultants.id, existing.id));
    }
    return "exists";
  }
  await db.insert(favoriteConsultants).values({
    id: crypto.randomUUID(),
    practiceId,
    consultantUserId,
    officePhone,
    addedByUserId,
  });
  return "added";
}

async function resolveOfficePhone(
  consultantUserId: string,
  savedOfficePhone: string | null,
): Promise<string | null> {
  if (savedOfficePhone) return savedOfficePhone;
  const db = await getDb();
  const [membership] = await db
    .select({ officePhone: practices.phone })
    .from(practiceMemberships)
    .innerJoin(practices, eq(practices.id, practiceMemberships.practiceId))
    .where(
      and(eq(practiceMemberships.userId, consultantUserId), eq(practiceMemberships.status, "active")),
    )
    .orderBy(desc(practiceMemberships.createdAt))
    .limit(1);
  return membership?.officePhone ?? null;
}

export async function addFavoriteConsultant(input: {
  practiceId: string;
  addedByUserId: string;
  name: string;
  mobilePhone?: string;
  officePhone?: string;
  specialtyId: string;
  subspecialtyId?: string | null;
}): Promise<
  | { ok: true; status: "found" | "created" | "exists"; message: string; consultant: FavoriteConsultant }
  | { ok: false; error: string; status: number }
> {
  const mobileRaw = input.mobilePhone?.trim() ?? "";
  const officeRaw = input.officePhone?.trim() ?? "";
  if (!mobileRaw && !officeRaw) {
    return { ok: false, error: "Enter at least one phone number (office or cell).", status: 400 };
  }

  const mobile = mobileRaw ? toE164(mobileRaw) : null;
  const office = officeRaw ? toE164(officeRaw) : null;
  if (mobileRaw && !mobile) {
    return { ok: false, error: "Enter a valid US cell number.", status: 400 };
  }
  if (officeRaw && !office) {
    return { ok: false, error: "Enter a valid US office number.", status: 400 };
  }

  const parsedName = parseClinicianName(input.name);
  if (!parsedName) {
    return { ok: false, error: "Enter the consultant's name.", status: 400 };
  }

  const specialtyId = input.specialtyId?.trim() || "";
  if (!specialtyId) {
    return { ok: false, error: "Select a specialty.", status: 400 };
  }
  const subspecialtyId = input.subspecialtyId || null;

  const db = await getDb();
  const check = await validatePhysicianSpecialty(db, { specialtyId, subspecialtyId });
  if (!check.ok) return { ok: false, error: check.error, status: 400 };

  async function applySpecialtyToExisting(userId: string) {
    await db
      .update(users)
      .set({ specialtyId, subspecialtyId })
      .where(eq(users.id, userId));
  }

  if (mobile) {
    const [byPhone] = await db.select().from(users).where(eq(users.mobilePhone, mobile)).limit(1);
    if (byPhone) {
      if (byPhone.id === input.addedByUserId) {
        return { ok: false, error: "You cannot add yourself as a favorite consultant.", status: 400 };
      }
      await applySpecialtyToExisting(byPhone.id);
      const link = await ensureFavorite(input.practiceId, input.addedByUserId, byPhone.id, office);
      const specialty = await resolveSpecialtyLabel(db, specialtyId, subspecialtyId);
      const displayName = `${byPhone.firstName} ${byPhone.lastName}`.trim() || "That consultant";
      const consultant: FavoriteConsultant = {
        id: byPhone.id,
        firstName: byPhone.firstName,
        lastName: byPhone.lastName,
        mobilePhone: byPhone.mobilePhone,
        officePhone: await resolveOfficePhone(byPhone.id, office),
        healthSystemName: null,
        healthSystemLogo: null,
        specialtyLabel: specialty.specialtyLabel,
        starred: false,
      };
      if (link === "exists") {
        return {
          ok: true,
          status: "exists",
          message: `${displayName} is already in the practice directory (matched by cell phone).`,
          consultant,
        };
      }
      return {
        ok: true,
        status: "found",
        message: `Matched existing account ${displayName} and added them to the practice directory.`,
        consultant,
      };
    }

    const userId = crypto.randomUUID();
    try {
      await db.insert(users).values({
        id: userId,
        email: pendingEmailForPhone(mobile),
        passwordHash: await hashPassword(randomTempPassword() + randomTempPassword()),
        firstName: parsedName.firstName,
        lastName: parsedName.lastName,
        npi: null,
        mobilePhone: mobile,
        mobileVerifiedAt: null,
        mustChangePassword: false,
        status: "invited",
        specialtyId,
        subspecialtyId,
      });
    } catch {
      const [again] = await db.select().from(users).where(eq(users.mobilePhone, mobile)).limit(1);
      if (again) {
        return {
          ok: false,
          error: `That cell phone is already registered to ${again.firstName} ${again.lastName}.`.trim(),
          status: 409,
        };
      }
      return { ok: false, error: "Could not add that consultant. Try again.", status: 500 };
    }
    await ensureFavorite(input.practiceId, input.addedByUserId, userId, office);
    const specialty = await resolveSpecialtyLabel(db, specialtyId, subspecialtyId);
    return {
      ok: true,
      status: "created",
      message: "Added to the practice directory. They will get a text when you request a consult.",
      consultant: {
        id: userId,
        firstName: parsedName.firstName,
        lastName: parsedName.lastName,
        mobilePhone: mobile,
        officePhone: office,
        healthSystemName: null,
        healthSystemLogo: null,
        specialtyLabel: specialty.specialtyLabel,
        starred: false,
      },
    };
  }

  const userId = crypto.randomUUID();
  await db.insert(users).values({
    id: userId,
    email: `pending+office-${userId.replace(/-/g, "")}@referlink.pending`,
    passwordHash: await hashPassword(randomTempPassword() + randomTempPassword()),
    firstName: parsedName.firstName,
    lastName: parsedName.lastName,
    npi: null,
    mobilePhone: null,
    mobileVerifiedAt: null,
    mustChangePassword: false,
    status: "invited",
    specialtyId,
    subspecialtyId,
  });
  await ensureFavorite(input.practiceId, input.addedByUserId, userId, office);
  const specialty = await resolveSpecialtyLabel(db, specialtyId, subspecialtyId);
  return {
    ok: true,
    status: "created",
    message: "Added to the practice directory (office phone only).",
    consultant: {
      id: userId,
      firstName: parsedName.firstName,
      lastName: parsedName.lastName,
      mobilePhone: null,
      officePhone: office,
      healthSystemName: null,
      healthSystemLogo: null,
      specialtyLabel: specialty.specialtyLabel,
      starred: false,
    },
  };
}

export async function removeFavoriteConsultant(
  practiceId: string,
  consultantUserId: string,
): Promise<boolean> {
  const db = await getDb();
  const [existing] = await db
    .select({ id: favoriteConsultants.id })
    .from(favoriteConsultants)
    .where(
      and(
        eq(favoriteConsultants.practiceId, practiceId),
        eq(favoriteConsultants.consultantUserId, consultantUserId),
      ),
    )
    .limit(1);
  if (!existing) return false;
  await db.delete(favoriteConsultants).where(eq(favoriteConsultants.id, existing.id));
  return true;
}

export async function setFavoriteStar(input: {
  practiceId: string;
  userId: string;
  consultantUserId: string;
  starred: boolean;
}): Promise<{ ok: true; starred: boolean } | { ok: false; error: string; status: number }> {
  const db = await getDb();
  const [inDirectory] = await db
    .select({ id: favoriteConsultants.id })
    .from(favoriteConsultants)
    .where(
      and(
        eq(favoriteConsultants.practiceId, input.practiceId),
        eq(favoriteConsultants.consultantUserId, input.consultantUserId),
      ),
    )
    .limit(1);
  if (!inDirectory) {
    return { ok: false, error: "That consultant is not in the practice directory.", status: 404 };
  }

  const [existing] = await db
    .select({ id: favoriteConsultantStars.id })
    .from(favoriteConsultantStars)
    .where(
      and(
        eq(favoriteConsultantStars.userId, input.userId),
        eq(favoriteConsultantStars.consultantUserId, input.consultantUserId),
      ),
    )
    .limit(1);

  if (input.starred) {
    if (!existing) {
      await db.insert(favoriteConsultantStars).values({
        id: crypto.randomUUID(),
        userId: input.userId,
        consultantUserId: input.consultantUserId,
      });
    }
    return { ok: true, starred: true };
  }

  if (existing) {
    await db.delete(favoriteConsultantStars).where(eq(favoriteConsultantStars.id, existing.id));
  }
  return { ok: true, starred: false };
}
