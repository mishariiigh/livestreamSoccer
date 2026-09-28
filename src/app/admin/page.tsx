import { redirect } from "next/navigation";
import type { Metadata } from "next";
import AdminConsole from "@/components/admin-console";
import { getAdminUser } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "إدارة المنصة", robots: { index: false, follow: false } };

export default async function AdminHome() {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!configured || !(await getAdminUser())) redirect("/admin/login");
  return <AdminConsole section="overview" />;
}