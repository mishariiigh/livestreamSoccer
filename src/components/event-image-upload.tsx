"use client";

import { ImagePlus, LoaderCircle } from "lucide-react";
import { ChangeEvent, useState } from "react";

export default function EventImageUpload({ onUploaded }: { onUploaded: (url: string) => void }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) {
      setMessage("اختر JPEG أو PNG أو WebP أو AVIF حتى 5 MB.");
      return;
    }
    setPending(true);
    setMessage("");
    const body = new FormData();
    body.set("file", file);
    try {
      const response = await fetch("/api/admin/uploads", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "تعذر رفع الصورة.");
      onUploaded(result.data.publicUrl as string);
      setMessage("تم الرفع، سيُحفظ الرابط مع الفعالية.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر رفع الصورة.");
    } finally {
      setPending(false);
      event.target.value = "";
    }
  }

  return <label className="upload-control"><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={upload} disabled={pending} /><span>{pending ? <LoaderCircle size={15} className="spin" /> : <ImagePlus size={15} />}{pending ? "جارٍ الرفع…" : "رفع إلى Supabase Storage"}</span>{message && <small role="status">{message}</small>}</label>;
}