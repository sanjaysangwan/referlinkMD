import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function PracticePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  redirect("/consults");
}
