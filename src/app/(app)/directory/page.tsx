import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FavoriteConsultantsManager } from "@/components/favorite-consultants";

export default async function ConsultantDirectoryPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.practiceId) redirect("/create-practice");

  return (
    <div>
      <h1 className="text-3xl">Consultant directory</h1>
      <p className="sans mt-2 mb-6 max-w-xl text-sm text-[#3d4a5c]">
        Shared consultants for your practice. Anyone on the team can add. Star people for your
        personal short list.
      </p>
      <div className="max-w-2xl">
        <FavoriteConsultantsManager />
      </div>
    </div>
  );
}
