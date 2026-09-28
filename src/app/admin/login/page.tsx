import type { Metadata } from "next";
import AuthForm from "@/components/auth-form";

export const metadata: Metadata = { title: "دخول الإدارة", robots: { index: false, follow: false } };
export default function AdminLoginPage() { return <AuthForm mode="admin" />; }