import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "إنشاء حساب", robots: { index: false, follow: false } };
export default function RegisterPage() { redirect("/admin"); }