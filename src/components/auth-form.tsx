"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { z } from "zod";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const credentials = z.object({ email: z.string().email("أدخل بريداً إلكترونياً صحيحاً."), password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل.") });

export default function AuthForm({ mode }: { mode: "login" | "register" | "admin" }) {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const heading = mode === "register" ? "أنشئ حسابك" : mode === "admin" ? "دخول الإدارة" : "مرحباً بعودتك";
  const clientConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (mode === "admin") {
      if (!email.trim() || password.length < 8) {
        setError("أدخل اسم المستخدم admin أو البريد الإلكتروني وكلمة المرور.");
        return;
      }
      setPending(true);
      try {
        const response = await fetch("/api/auth/admin-login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ identifier: email.trim(), password }),
        });
        const result = await response.json().catch(() => ({})) as { error?: string };
        if (!response.ok) {
          setError(result.error ?? "تعذر تسجيل الدخول.");
          return;
        }
        window.location.replace("/admin");
      } catch {
        setError("تعذّر الاتصال بخدمة المصادقة. تحقق من الاتصال وإعدادات Supabase.");
      } finally {
        setPending(false);
      }
      return;
    }
    const parsed = credentials.safeParse({ email, password });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "تحقق من البيانات."); return; }
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setError("المصادقة غير مهيأة بعد. أضف مفاتيح Supabase إلى ملف البيئة المحلي."); return; }
    setPending(true);
    try {
      const result = mode === "register"
        ? await supabase.auth.signUp({ email: parsed.data.email, password: parsed.data.password, options: { data: { display_name: email.split("@")[0] } } })
        : await supabase.auth.signInWithPassword(parsed.data);
      if (result.error) {
        const authMessage = result.error.message.toLowerCase();
        if (authMessage.includes("email not confirmed")) setError("البريد الإلكتروني غير مؤكّد. أكمل التحقق من رسالة Supabase ثم حاول مجدداً.");
        else setError(result.error.message);
        return;
      }
      if (mode === "register" && !result.data.session) { setMessage("تحقق من بريدك الإلكتروني لإكمال التسجيل."); return; }
      window.location.replace("/account");
    } catch {
      setError("تعذّر الاتصال بخدمة المصادقة. تحقق من الاتصال وإعدادات Supabase ثم حاول مجدداً.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="auth-page page-width">
      <div className="auth-panel">
        <span className="eyebrow">MADA / {mode === "admin" ? "ADMIN ACCESS" : "YOUR ACCOUNT"}</span>
        <h1>{heading}</h1>
        <p>{mode === "admin" ? "يقتصر الدخول على الحسابات الممنوحة دور admin في قاعدة البيانات." : "سجّل الدخول لمتابعة فعالياتك المفضلة."}</p>
        <form onSubmit={submit}>
          <label>{mode === "admin" ? "اسم المستخدم أو البريد الإلكتروني" : "البريد الإلكتروني"}<input autoComplete={mode === "admin" ? "username" : "email"} type={mode === "admin" ? "text" : "email"} required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>كلمة المرور<input autoComplete={mode === "register" ? "new-password" : "current-password"} type="password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          {error && <p className="form-error" role="alert">{error}</p>}{message && <p className="form-success" role="status">{message}</p>}
          <button className="primary-action auth-submit" disabled={pending}>{pending ? "جارٍ التحقق…" : mode === "register" ? "إنشاء الحساب" : "تسجيل الدخول"}</button>
        </form>
        {!clientConfigured && <p className="auth-note">وضع المعاينة: إعداد Supabase مطلوب لتفعيل الحسابات.</p>}
        {mode !== "admin" && <div className="auth-switch">{mode === "register" ? <>لديك حساب؟ <Link href="/login">تسجيل الدخول</Link></> : <>ليس لديك حساب؟ <Link href="/register">إنشاء حساب</Link></>}</div>}
        {mode === "admin" && <div className="auth-switch"><Link href="/">العودة إلى مدى</Link></div>}
      </div>
    </main>
  );
}