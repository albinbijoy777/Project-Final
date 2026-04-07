import { useState } from "react";
import { Camera, LoaderCircle } from "lucide-react";
import { motion as Motion } from "framer-motion";
import { getInitials } from "../utils/formatters.js";

export default function AvatarUploader({ name, avatarUrl, onUpload }) {
  const [uploading, setUploading] = useState(false);

  async function handleChange(event) {
    const file = event.target.files?.[0];
    if (!file || !onUpload) return;

    setUploading(true);
    try {
      await onUpload(file);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Motion.div
        whileHover={{ scale: 1.04 }}
        className="relative flex size-[5.5rem] items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-slate-900"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={name || "Avatar"} className="size-full object-cover" />
        ) : (
          <span className="text-2xl font-semibold text-slate-200">{getInitials(name)}</span>
        )}
        <div className="absolute inset-0 rounded-[28px] ring-1 ring-inset ring-white/8" />
      </Motion.div>

      <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-medium text-slate-100 transition hover:border-amber-200/40 hover:bg-white/10">
        {uploading ? <LoaderCircle className="size-4 animate-spin" /> : <Camera className="size-4" />}
        {uploading ? "Uploading..." : "Upload photo"}
        <input type="file" accept="image/*" className="hidden" onChange={handleChange} />
      </label>
    </div>
  );
}
