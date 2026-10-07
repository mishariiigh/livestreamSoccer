import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "دخول الإدارة", robots: { index: false, follow: false } };
export default function AdminLoginPage() { redirect("/admin"); }