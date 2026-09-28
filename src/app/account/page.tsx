import type { Metadata } from "next";
import AccountPanel from "@/components/account-panel";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "حسابي", robots: { index: false, follow: false } };

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  return <AccountPanel email={data.user?.email ?? null} />;
}