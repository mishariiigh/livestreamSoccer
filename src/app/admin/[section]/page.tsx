import { notFound, redirect } from "next/navigation";
import AdminConsole from "@/components/admin-console";
import { getAdminUser } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";
const sections = ["events", "streams", "ads", "users", "analytics", "settings"] as const;

export default async function AdminSection({ params }: PageProps<"/admin/[section]">) {
  const { section } = await params;
  if (!sections.includes(section as typeof sections[number])) notFound();
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!configured || !(await getAdminUser())) redirect("/admin/login");
  return <AdminConsole section={section} />;
}