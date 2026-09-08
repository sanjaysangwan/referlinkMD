import { and, desc, eq } from "drizzle-orm";
import { favoriteConsultants, users } from "@/db/schema";
import { getDb } from "@/db";
import { hashPassword, randomTempPassword } from "@/lib/crypto";
import { parseClinicianName, pendingEmailForPhone, toE164 } from "@/lib/phone";

export type FavoriteConsultant = {
  id: string;
  firstName: string;
  lastName: string;
  mobilePhone: string | null;
};

export async function listFavoriteConsultants(ownerUserId: string): Promise<FavoriteConsultant[]> {
  const db = await getDb();
  const rows = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      mobilePhone: users.mobilePhone,
    })
    .from(favoriteConsultants)
    .innerJoin(users, eq(users.id, favoriteConsultants.consultantUserId))
    .where(eq(favoriteConsultants.ownerUserId, ownerUserId))
    .orderBy(desc(favoriteConsultants.createdAt));
  return rows;
}

async function ensureFavorite(ownerUserId: string, consultantUserId: string): Promise<"added" | "exists"> {
  const db = await getDb();
  const [existing] = await db
    .select({ id: favoriteConsultants.id })
    .from(favoriteConsultants)
    .where(
      and(
        eq(favoriteConsultants.ownerUserId, ownerUserId),
        eq(favoriteConsultants.consultantUserId, consultantUserId),
      ),
    )
    .limit(1);
  if (existing) return "exists";
  await db.insert(favoriteConsultants).values({
    id: crypto.randomUUID(),
    ownerUserId,
    consultantUserId,
  });
  return "added";
}

export async function addFavoriteConsultant(input: {
  ownerUserId: string;
  name: string;
  phone: string;
}): Promise<
  | { ok: true; status: "found" | "created" | "exists"; message: string; consultant: FavoriteConsultant }
  | { ok: false; error: string; status: number }
> {
  const phone = toE164(input.phone);
  if (!phone) {
    return { ok: false, error: "Enter a valid US mobile number.", status: 400 };
  }
  const parsedName = parseClinicianName(input.name);
  if (!parsedName) {
    return { ok: false, error: "Enter the consultant's name.", status: 400 };
  }

  const db = await getDb();
  const [byPhone] = await db.select().from(users).where(eq(users.mobilePhone, phone)).limit(1);

  if (byPhone) {
    if (byPhone.id === input.ownerUserId) {
      return { ok: false, error: "You cannot add yourself as a favorite consultant.", status: 400 };
    }
    const link = await ensureFavorite(input.ownerUserId, byPhone.id);
    const consultant: FavoriteConsultant = {
      id: byPhone.id,
      firstName: byPhone.firstName,
      lastName: byPhone.lastName,
      mobilePhone: byPhone.mobilePhone,
    };
    if (link === "exists") {
      return {
        ok: true,
        status: "exists",
        message: "Already in your favorite consultants.",
        consultant,
      };
    }
    return {
      ok: true,
      status: "found",
      message: "Found and added to favorite consultants.",
      consultant,
    };
  }

  const userId = crypto.randomUUID();
  await db.insert(users).values({
    id: userId,
    email: pendingEmailForPhone(phone),
    passwordHash: await hashPassword(randomTempPassword() + randomTempPassword()),
    firstName: parsedName.firstName,
    lastName: parsedName.lastName,
    npi: null,
    mobilePhone: phone,
    mobileVerifiedAt: null,
    mustChangePassword: false,
    status: "invited",
  });
  await ensureFavorite(input.ownerUserId, userId);
  return {
    ok: true,
    status: "created",
    message: "Added to favorite consultants. They will get a text when you request a consult.",
    consultant: {
      id: userId,
      firstName: parsedName.firstName,
      lastName: parsedName.lastName,
      mobilePhone: phone,
    },
  };
}

export async function removeFavoriteConsultant(
  ownerUserId: string,
  consultantUserId: string,
): Promise<boolean> {
  const db = await getDb();
  const removed = await db
    .delete(favoriteConsultants)
    .where(
      and(
        eq(favoriteConsultants.ownerUserId, ownerUserId),
        eq(favoriteConsultants.consultantUserId, consultantUserId),
      ),
    )
    .returning({ id: favoriteConsultants.id });
  return removed.length > 0;
}
