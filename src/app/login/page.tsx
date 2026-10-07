import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "تسجيل الدخول", robots: { index: false, follow: false } };
export default function LoginPage() { redirect("/admin"); }