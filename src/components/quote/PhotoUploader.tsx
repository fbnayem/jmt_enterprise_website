"use client";

import { ImagePlus, Loader2, RotateCcw, Trash2, TriangleAlert } from "lucide-react";
import { useRef } from "react";
import { PHOTO_LIMITS } from "@/lib/quote/options";

export type Photo = {
  localId: string;
  name: string;
  size: number;
  status: "uploading" | "ready" | "error";
  attachmentId?: string;
  previewUrl?: string;
  error?: string;
  /** Kept in memory so a failed upload can be retried. Not persisted. */
  file?: File;
};

const mb = (n: number) => (n < 100 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

export function clientCheck(file: File, existing: Photo[]): string | null {
  const isHeic = /\.(heic|heif)$/i.test(file.name) || /heic|heif/i.test(file.type);
  if (isHeic) return "HEIC photos are not supported yet. On iPhone, choose Most Compatible in camera settings or share the photo as JPEG.";
  if (!(PHOTO_LIMITS.acceptedTypes as readonly string[]).includes(file.type)) return "Only JPEG, PNG and WebP photos are accepted.";
  if (file.size > PHOTO_LIMITS.maxBytesEach) return `This photo is ${mb(file.size)}. Each photo must be 10 MB or smaller.`;
  const total = existing.filter((p) => p.status !== "error").reduce((n, p) => n + p.size, 0);
  if (total + file.size > PHOTO_LIMITS.maxBytesTotal) return "Photos can total up to 50 MB.";
  return null;
}

export function PhotoUploader({
  photos,
  onAdd,
  onRetry,
  onRemove,
}: {
  photos: Photo[];
  onAdd: (files: File[]) => void;
  onRetry: (p: Photo) => void;
  onRemove: (p: Photo) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const remaining = PHOTO_LIMITS.maxFiles - photos.length;

  return (
    <div>
      <input
        ref={input}
        id="f-photos"
        type="file"
        accept={PHOTO_LIMITS.acceptAttr}
        multiple
        className="sr-only"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length) onAdd(files);
        }}
      />
      <button
        type="button"
        disabled={remaining <= 0}
        onClick={() => input.current?.click()}
        className="group flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-brand-200 bg-gradient-to-b from-brand-50 to-white px-4 py-10 text-brand-800 transition-all duration-300 hover:border-brand-500 hover:shadow-[0_16px_40px_-20px_rgb(31_72_146/0.5)] disabled:cursor-not-allowed disabled:opacity-60"
        aria-describedby="photos-hint"
      >
        <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-lg shadow-brand-500/30 transition-transform duration-500 ease-out-expo group-hover:-translate-y-1 group-hover:rotate-6" aria-hidden="true">
          <ImagePlus className="size-7" />
        </span>
        <span className="font-bold">{remaining > 0 ? "Add photos" : "Photo limit reached"}</span>
      </button>
      <p id="photos-hint" className="field-hint">
        Up to {PHOTO_LIMITS.maxFiles} photos, JPEG, PNG or WebP, 10 MB each. Location data is removed from photos when they are saved.
      </p>

      {photos.length > 0 && (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2" aria-live="polite">
          {photos.map((p) => (
            <li key={p.localId} className={`flex animate-fade-up gap-3 rounded-2xl border bg-white p-3 ${p.status === "error" ? "border-red-600 bg-red-50" : "border-slate-200 shadow-sm"}`}>
              <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                {p.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
                  <img src={p.previewUrl} alt={`Preview of ${p.name}`} className="size-full object-cover" />
                ) : (
                  <ImagePlus className="m-6 size-8 text-slate-400" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.name}</p>
                <p className="text-sm text-muted">{mb(p.size)}</p>
                {p.status === "uploading" && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-brand-700">
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Uploading…
                  </p>
                )}
                {p.status === "ready" && <p className="mt-1 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-sm font-semibold text-emerald-700">Added</p>}
                {p.status === "error" && (
                  <p className="mt-1 flex gap-1 text-sm font-medium text-red-700">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {p.error}
                  </p>
                )}
                <div className="mt-2 flex gap-2">
                  {p.status === "error" && p.file && (
                    <button type="button" onClick={() => onRetry(p)} className="inline-flex min-h-10 items-center gap-1 rounded-full border border-slate-300 bg-white px-3 text-sm font-medium transition-colors hover:border-brand-400">
                      <RotateCcw className="size-4" aria-hidden="true" /> Retry
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemove(p)}
                    disabled={p.status === "uploading"}
                    className="inline-flex min-h-10 items-center gap-1 rounded-full border border-slate-300 bg-white px-3 text-sm font-medium transition-colors hover:border-brand-400 disabled:opacity-50"
                  >
                    <Trash2 className="size-4" aria-hidden="true" /> Remove<span className="sr-only"> {p.name}</span>
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
