"use client";

import { FormEvent, useState } from "react";

export default function AuthForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const clientConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
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
      setError("تعذّر الاتصال بخدمة المصادقة. تحقق من الاتصال وإعدادات Supabase ثم حاول مجدداً.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="auth-page page-width">
      <div className="auth-panel">
        <span className="eyebrow">ME7GAN-LIVE / ADMIN ACCESS</span>
        <h1>دخول الإدارة</h1>
        <p>يقتصر الدخول على الحسابات الممنوحة دور admin في قاعدة البيانات.</p>
        <form onSubmit={submit}>
          <label>اسم المستخدم أو البريد الإلكتروني<input autoComplete="username" type="text" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>كلمة المرور<input autoComplete="current-password" type="password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-action auth-submit" disabled={pending}>{pending ? "جارٍ التحقق…" : "تسجيل الدخول"}</button>
        </form>
        {!clientConfigured && <p className="auth-note">يلزم إعداد Supabase على الخادم لتفعيل دخول الإدارة.</p>}
      </div>
    </main>
  );
}