"use client";

import { ArrowLeft, ArrowRight, Check, Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { business } from "@/content/site";
import { track } from "@/lib/analytics";
import { isProductionSite } from "@/lib/site-env";
import {
  ACKNOWLEDGEMENT_TEXT,
  ACKNOWLEDGEMENT_VERSION,
  ELEVATOR,
  MAX_EXTRA_STOPS,
  MAX_ITEMS,
  SERVICE_TYPES,
  STAIRS,
  TIME_WINDOWS,
  YES_NO_UNSURE,
  labelOf,
  serviceTypeLabel,
  timeWindowLabel,
  vehicleLabel,
  VEHICLE_PREFS,
} from "@/lib/quote/options";
import { elevatorQuestionNeeded, issuesToErrors, stepSchemas } from "@/lib/quote/schema";
import { formatIsoDate, latestRequestDate, todayInTimezone } from "@/lib/quote/time";
import { AddressFields, ChoiceGroup, Field, fieldId, type AddressState } from "./fields";
import { clientCheck, PhotoUploader, type Photo } from "./PhotoUploader";
import { Turnstile, turnstileSiteKey } from "./Turnstile";

type AccessState = { stairs: string; floor: string; elevator: string; parkingNotes: string };
type ItemState = {
  /** Client-only key so removing an item never shifts another item's state. */
  uid?: string;
  description: string;
  quantity: string;
  sizeKnown: "yes" | "not-sure";
  length: string;
  width: string;
  height: string;
  dimensionUnit: "in" | "ft" | "cm";
  weight: string;
  weightUnit: "lb" | "kg";
  fragile: boolean;
  oversized: boolean;
};
type StopState = { uid?: string; kind: "pickup" | "dropoff"; address: AddressState; notes: string };

type FormState = {
  serviceType: string;
  customerType: string;
  companyName: string;
  pickup: AddressState;
  dropoff: AddressState;
  extraStops: StopState[];
  dateMode: string;
  requestedDate: string;
  timeWindow: string;
  items: ItemState[];
  vehicle: string;
  loadingHelp: string;
  pickupAccess: AccessState;
  dropoffAccess: AccessState;
  /** Drop-off has the same stairs and elevator access as pickup. Client-only. */
  dropoffSameAccess: boolean;
  specialInstructions: string;
  photoNotes: string;
  name: string;
  phone: string;
  email: string;
  preferredContact: string;
  acknowledged: boolean;
};

const emptyAddress = (): AddressState => ({ street: "", unit: "", city: "", state: "", zip: "" });
const emptyAccess = (): AccessState => ({ stairs: "", floor: "", elevator: "", parkingNotes: "" });
const uid = () => crypto.randomUUID();
const emptyItem = (): ItemState => ({
  uid: uid(),
  description: "",
  quantity: "1",
  sizeKnown: "not-sure",
  length: "",
  width: "",
  height: "",
  dimensionUnit: "in",
  weight: "",
  weightUnit: "lb",
  fragile: false,
  oversized: false,
});
const initialState = (): FormState => ({
  serviceType: "",
  customerType: "",
  companyName: "",
  pickup: emptyAddress(),
  dropoff: emptyAddress(),
  extraStops: [],
  dateMode: "",
  requestedDate: "",
  timeWindow: "",
  items: [emptyItem()],
  vehicle: "",
  loadingHelp: "",
  pickupAccess: emptyAccess(),
  dropoffAccess: emptyAccess(),
  dropoffSameAccess: false,
  specialInstructions: "",
  photoNotes: "",
  name: "",
  phone: "",
  email: "",
  preferredContact: "either",
  acknowledged: false,
});

const STEPS = ["Pickup and delivery", "Items and access", "Photos", "Contact and review"] as const;
const STORAGE_KEY = "jmt-quote-draft-v1";

function setPath<T>(obj: T, path: string, value: unknown): T {
  const copy = structuredClone(obj) as Record<string, unknown>;
  const keys = path.split(".");
  let cur: Record<string, unknown> = copy;
  for (const k of keys.slice(0, -1)) cur = cur[k] as Record<string, unknown>;
  cur[keys[keys.length - 1]] = value;
  return copy as T;
}

const storage = {
  read(): { form: FormState; step: number; token: string; idem: string; photos: Photo[] } | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  write(v: object) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(v));
    } catch {
      /* storage unavailable: the form still works, it just won't survive a reload */
    }
  },
  clear() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
  },
};

/** Draft tokens are "{draftId}.{issuedAtMs}.{signature}" and the server accepts them for 24 hours. */
const TOKEN_REFRESH_MS = 20 * 3600 * 1000;
const tokenIsFresh = (token: string) => {
  const issued = Number(token.split(".")[1]);
  return Number.isFinite(issued) && Date.now() - issued < TOKEN_REFRESH_MS;
};

/** What is actually sent: hidden questions are blanked and shared drop-off access is copied. */
function effectiveForm(f: FormState): FormState {
  const clean = (a: AccessState): AccessState => ({ ...a, elevator: elevatorQuestionNeeded(a) ? a.elevator : "" });
  const pickupAccess = clean(f.pickupAccess);
  const dropoffAccess = f.dropoffSameAccess ? { ...pickupAccess, parkingNotes: f.dropoffAccess.parkingNotes } : clean(f.dropoffAccess);
  return { ...f, pickupAccess, dropoffAccess };
}

/**
 * Phone cameras often produce photos over the 10 MB limit. Resize large
 * JPEG/PNG/WebP photos to the size the server keeps anyway (2400px) before
 * uploading. Falls back to the original file on any problem.
 */
async function shrinkImage(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 1.5 * 1024 * 1024 || typeof createImageBitmap !== "function") return file;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, 2400 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg", lastModified: file.lastModified });
  } catch {
    return file;
  }
}

class SessionExpiredError extends Error {}

async function postJson(url: string, body: unknown, signal?: AbortSignal) {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

function stepOfError(path: string): number {
  const root = path.split(".")[0];
  if (["items", "vehicle", "loadingHelp", "pickupAccess", "dropoffAccess", "specialInstructions"].includes(root)) return 1;
  if (["attachmentIds", "photoNotes"].includes(root)) return 2;
  if (["name", "phone", "email", "preferredContact", "acknowledged"].includes(root)) return 3;
  return 0;
}

export function QuoteForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [draftToken, setDraftToken] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [failedPhotoPrompt, setFailedPhotoPrompt] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [returnToReview, setReturnToReview] = useState(false);
  const [challengeToken, setChallengeToken] = useState("");
  const [challengeReset, setChallengeReset] = useState(0);
  const tokenRef = useRef("");
  const started = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const today = todayInTimezone(business.timezone);
  const latest = latestRequestDate(business.timezone);

  // Restore an in-progress request (survives reloads and recoverable errors).
  // sessionStorage only exists in the browser, so this must run after hydration.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const saved = storage.read();
    if (saved) {
      const f = { ...initialState(), ...saved.form };
      f.items = f.items.map((it) => ({ ...it, uid: it.uid ?? uid() }));
      f.extraStops = f.extraStops.map((st) => ({ ...st, uid: st.uid ?? uid() }));
      setForm(f);
      setStep(saved.step ?? 0);
      setIdempotencyKey(saved.idem || crypto.randomUUID());
      // Files are not persisted; keep only photos that finished uploading.
      const ready = (saved.photos ?? []).filter((p) => p.status === "ready").map((p) => ({ ...p, previewUrl: undefined, file: undefined }));
      if (saved.token && tokenIsFresh(saved.token)) {
        setDraftToken(saved.token);
        tokenRef.current = saved.token;
        setPhotos(ready);
      } else if (ready.length) {
        // The old session is about to expire, so its photos can't be sent. Ask for them again.
        setPhotos(ready.map((p) => ({ ...p, status: "error", attachmentId: undefined, error: "Your session timed out. Please remove this photo and add it again." })));
      }
    } else {
      setIdempotencyKey(crypto.randomUUID());
      const service = new URLSearchParams(window.location.search).get("service");
      if (service && (SERVICE_TYPES as readonly string[]).includes(service)) {
        setForm((f) => ({ ...f, serviceType: service, ...(service === "small-business" ? { customerType: "business" } : {}) }));
      }
    }
    setHydrated(true);
  }, []);

  const ensureToken = useCallback(async () => {
    if (tokenRef.current && tokenIsFresh(tokenRef.current)) return tokenRef.current;
    const { res, data } = await postJson("/api/drafts", {});
    if (!res.ok) throw new Error(data.error ?? "Could not start the form.");
    tokenRef.current = data.token;
    setDraftToken(data.token);
    return data.token as string;
  }, []);

  /**
   * The server said the form session expired: start a new one. Photos saved
   * under the old session can't be attached to the new one, so they are
   * flagged for the customer to add again. Returns how many were flagged.
   */
  const renewSession = async (): Promise<number> => {
    tokenRef.current = "";
    setDraftToken("");
    const lost = photos.filter((p) => p.status === "ready").length;
    setPhotos((ps) =>
      ps.map((p) => {
        if (p.status !== "ready") return p;
        return { ...p, status: "error", attachmentId: undefined, error: "Your session timed out. Please remove this photo and add it again." };
      }),
    );
    await ensureToken();
    return lost;
  };

  useEffect(() => {
    if (hydrated && !draftToken) ensureToken().catch(() => setBanner("We could not connect. Check your connection and refresh the page."));
  }, [hydrated, draftToken, ensureToken]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (hydrated) track("quote_step_view", { step: step + 1 });
  }, [hydrated, step]);

  useEffect(() => {
    if (!hydrated) return;
    storage.write({
      form,
      step,
      token: draftToken,
      idem: idempotencyKey,
      photos: photos.map(({ file: _f, previewUrl: _p, ...rest }) => rest),
    });
  }, [hydrated, form, step, draftToken, idempotencyKey, photos]);

  const update = (path: string, value: unknown) => {
    if (!started.current) {
      started.current = true;
      track("quote_form_start");
    }
    setForm((f) => setPath(f, path, value));
    if (errors[path]) setErrors(({ [path]: _, ...rest }) => rest);
  };

  const focusFirstError = (errs: Record<string, string>) => {
    const first = Object.keys(errs)[0];
    if (!first) return;
    requestAnimationFrame(() => {
      const el = document.getElementById(fieldId(first)) ?? document.getElementById(fieldId(first.split(".").slice(0, -1).join(".")));
      el?.focus();
      el?.scrollIntoView({ block: "center" });
    });
  };

  const goTo = (n: number) => {
    setStep(n);
    setBanner(null);
    requestAnimationFrame(() => {
      headingRef.current?.focus();
      headingRef.current?.scrollIntoView({ block: "start" });
    });
  };

  const validateStep = (n: number): boolean => {
    const eff = effectiveForm(form);
    const data = n === 2 ? { ...eff, attachmentIds: photos.filter((p) => p.status === "ready").map((p) => p.attachmentId) } : eff;
    const result = stepSchemas[n].safeParse(data);
    if (result.success) return true;
    const errs = issuesToErrors(result.error.issues);
    setErrors(errs);
    focusFirstError(errs);
    return false;
  };

  /** Validates the current step, then moves on (or back to the review when editing from it). */
  const next = () => {
    if (!validateStep(step)) return;
    if (step === 2) {
      if (photos.some((p) => p.status === "uploading")) {
        setBanner("Please wait for your photos to finish uploading.");
        return;
      }
      if (photos.some((p) => p.status === "error")) {
        setFailedPhotoPrompt(true);
        return;
      }
    }
    setErrors({});
    track("quote_step_complete", { step: step + 1, service_type: form.serviceType || undefined, customer_type: form.customerType || undefined });
    if (returnToReview) setReturnToReview(false);
    goTo(returnToReview ? 3 : step + 1);
  };

  const editFromReview = (n: number) => {
    setReturnToReview(true);
    goTo(n);
  };

  /** Removes a repeated item or stop and drops any errors shown for it, which are keyed by position. */
  const removeAt = (list: "items" | "extraStops", i: number) => {
    setForm((f) => ({ ...f, [list]: (f[list] as unknown[]).filter((_, j) => j !== i) }));
    setErrors((errs) => Object.fromEntries(Object.entries(errs).filter(([k]) => !k.startsWith(`${list}.`))));
  };

  // ---- Photos -------------------------------------------------------------
  const patchPhoto = (localId: string, patch: Partial<Photo>) =>
    setPhotos((ps) => ps.map((p) => (p.localId === localId ? { ...p, ...patch } : p)));

  const upload = async (photo: Photo, retried = false): Promise<void> => {
    const file = photo.file!;
    patchPhoto(photo.localId, { status: "uploading", error: undefined });
    try {
      const token = await ensureToken();
      const signed = await postJson("/api/uploads/sign", { draftToken: token, name: file.name, type: file.type, size: file.size });
      if (signed.data.code === "session_expired") throw new SessionExpiredError();
      if (!signed.res.ok) throw new Error(signed.data.error ?? "Upload could not start.");
      const put = await fetch(signed.data.uploadUrl, { method: "PUT", headers: signed.data.headers, body: file });
      if (!put.ok) throw new Error("The upload was interrupted. Please retry.");
      const done = await postJson("/api/uploads/complete", { draftToken: token, attachmentId: signed.data.attachmentId });
      if (done.data.code === "session_expired") throw new SessionExpiredError();
      if (!done.res.ok) throw new Error(done.data.error ?? "The photo could not be saved. Please retry.");
      patchPhoto(photo.localId, { status: "ready", attachmentId: signed.data.attachmentId });
    } catch (e) {
      if (e instanceof SessionExpiredError && !retried) {
        await renewSession().catch(() => {});
        return upload(photo, true);
      }
      patchPhoto(photo.localId, {
        status: "error",
        error: e instanceof TypeError ? "Connection lost during upload. Please retry." : (e as Error).message,
      });
    }
  };

  const addPhotos = async (picked: File[]) => {
    setFailedPhotoPrompt(false);
    const room = 5 - photos.length;
    const files = await Promise.all(picked.slice(0, room).map(shrinkImage));
    const accepted: Photo[] = [];
    for (const file of files) {
      const problem = clientCheck(file, [...photos, ...accepted]);
      const photo: Photo = {
        localId: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        status: problem ? "error" : "uploading",
        error: problem ?? undefined,
        previewUrl: problem ? undefined : URL.createObjectURL(file),
        file: problem ? undefined : file,
      };
      accepted.push(photo);
    }
    if (picked.length > room) setBanner(`Only ${room} more photo${room === 1 ? "" : "s"} can be added.`);
    setPhotos((ps) => [...ps, ...accepted]);
    accepted.filter((p) => p.status === "uploading").forEach((p) => void upload(p));
  };

  const removePhoto = async (p: Photo) => {
    setPhotos((ps) => ps.filter((x) => x.localId !== p.localId));
    if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
    if (p.attachmentId && tokenRef.current) postJson("/api/uploads/remove", { draftToken: tokenRef.current, attachmentId: p.attachmentId }).catch(() => {});
  };

  // ---- Submit -------------------------------------------------------------
  const submit = async (retried = false): Promise<void> => {
    if (submitting && !retried) return;
    if (!validateStep(3)) return;
    setSubmitting(true);
    setBanner(null);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25_000);
    try {
      const token = await ensureToken();
      const url = new URL(window.location.href);
      const { dropoffSameAccess: _same, ...sendable } = effectiveForm(form);
      const payload = {
        ...sendable,
        items: sendable.items.map(({ uid: _u, ...it }) => it),
        extraStops: sendable.extraStops.map(({ uid: _u, ...st }) => st),
        attachmentIds: photos.filter((p) => p.status === "ready").map((p) => p.attachmentId),
        meta: {
          idempotencyKey,
          draftToken: token,
          website: honeypot,
          turnstileToken: challengeToken || undefined,
          acknowledgementVersion: ACKNOWLEDGEMENT_VERSION,
          source: {
            landingPath: url.pathname,
            referrerHost: document.referrer ? new URL(document.referrer).host : "",
            utmSource: url.searchParams.get("utm_source") ?? "",
            utmMedium: url.searchParams.get("utm_medium") ?? "",
            utmCampaign: url.searchParams.get("utm_campaign") ?? "",
          },
        },
      };
      const { res, data } = await postJson("/api/quote-requests", payload, controller.signal);
      if (res.ok && data.reference) {
        track("quote_submit_success", { service_type: form.serviceType, customer_type: form.customerType });
        storage.clear();
        router.push(`/request-received?ref=${encodeURIComponent(data.reference)}`);
        return;
      }
      if (data.code === "session_expired" && !retried) {
        const lost = await renewSession();
        if (lost === 0) return submit(true);
        setFailedPhotoPrompt(false);
        goTo(2);
        setBanner(`Your form session timed out, so ${lost === 1 ? "one photo needs" : `${lost} photos need`} to be added again. Your other answers are kept.`);
        return;
      }
      if (data.code === "challenge_failed") {
        setChallengeToken("");
        setChallengeReset((n) => n + 1);
      }
      if (res.status === 422 && data.fieldErrors) {
        setErrors(data.fieldErrors);
        const firstStep = Math.min(...Object.keys(data.fieldErrors).map(stepOfError));
        setStep(firstStep);
        focusFirstError(data.fieldErrors);
      }
      setBanner(data.error ?? `Something went wrong. Please try again, or call ${business.phoneDisplay}.`);
    } catch {
      // Timeout or network loss: the same idempotency key is reused, so retrying cannot create a duplicate.
      setBanner(`We could not confirm your request was received. Your details are kept here, so please try again. Submitting again will not create a duplicate. You can also call ${business.phoneDisplay}.`);
    } finally {
      clearTimeout(timer);
      setSubmitting(false);
    }
  };

  // ---- Render helpers -----------------------------------------------------
  const accessFields = (prefix: "pickupAccess" | "dropoffAccess", title: string) => {
    const shared = prefix === "dropoffAccess" && form.dropoffSameAccess;
    const a = form[prefix];
    return (
      <fieldset className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition-colors focus-within:border-brand-300 focus-within:bg-white sm:p-6">
        <legend className="rounded-full bg-white px-3 text-lg font-bold text-brand-900">{title}</legend>
        <div className="space-y-5">
          {prefix === "dropoffAccess" && (
            <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-slate-300 bg-white p-3.5 transition-colors has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
              <input type="checkbox" className="size-5 shrink-0 accent-brand-600" checked={form.dropoffSameAccess} onChange={(e) => update("dropoffSameAccess", e.target.checked)} />
              <span className="font-medium">Same stairs and elevator access as pickup</span>
            </label>
          )}
          {!shared && (
            <>
              <ChoiceGroup path={`${prefix}.stairs`} legend="Are there stairs?" options={STAIRS} value={a.stairs} onChange={(v) => update(`${prefix}.stairs`, v)} errors={errors} columns={3} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field path={`${prefix}.floor`} label="Floor number" errors={errors} hint="Leave blank if not sure.">
                  {(p) => <input {...p} className="field-input" inputMode="numeric" value={a.floor} onChange={(e) => update(`${prefix}.floor`, e.target.value)} />}
                </Field>
              </div>
              {elevatorQuestionNeeded(a) && (
                <div className="animate-fade-up">
                  <ChoiceGroup path={`${prefix}.elevator`} legend="Elevator access" options={ELEVATOR} value={a.elevator} onChange={(v) => update(`${prefix}.elevator`, v)} errors={errors} columns={2} />
                </div>
              )}
            </>
          )}
          <Field path={`${prefix}.parkingNotes`} label="Parking or access restrictions" errors={errors} hint="For example: narrow driveway, gate code needed, loading dock hours.">
            {(p) => <textarea {...p} rows={2} className="field-input" value={a.parkingNotes} onChange={(e) => update(`${prefix}.parkingNotes`, e.target.value)} />}
          </Field>
        </div>
      </fieldset>
    );
  };

  const errorCount = Object.keys(errors).length;

  return (
    <div className="card mx-auto max-w-3xl p-5 shadow-[0_30px_80px_-30px_rgb(7_23_51/0.45)] sm:p-10">
      {/* Progress */}
      <nav aria-label="Request progress" className="mb-8">
        <div className="relative">
          <div aria-hidden="true" className="absolute left-5 right-5 top-5 h-1 rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400 transition-[width] duration-700 ease-out-expo" style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} />
          </div>
          <ol className="relative grid grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s} aria-current={i === step ? "step" : undefined} className="flex flex-col items-center text-center first:items-start first:text-left last:items-end last:text-right">
                <span
                  aria-hidden="true"
                  className={`grid size-11 place-items-center rounded-full text-sm font-extrabold ring-4 ring-white transition-all duration-500 ease-out-expo ${
                    i < step
                      ? "bg-brand-600 text-white"
                      : i === step
                        ? "scale-110 bg-gradient-to-br from-accent-500 to-accent-700 text-white shadow-lg shadow-accent-600/40"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {i < step ? <Check className="size-5" strokeWidth={3} /> : i + 1}
                </span>
                <span className={`mt-2 hidden text-sm transition-colors sm:block ${i === step ? "font-bold text-brand-900" : "text-slate-500"}`}>{s}</span>
                <span className="sr-only">{`Step ${i + 1}: ${s}${i < step ? " (completed)" : i === step ? " (current)" : ""}`}</span>
              </li>
            ))}
          </ol>
        </div>
      </nav>

      <h2 key={`h${step}`} ref={headingRef} tabIndex={-1} className="animate-step-in scroll-mt-28 text-2xl font-extrabold tracking-tight text-brand-900 outline-none sm:text-3xl">
        <span className="block text-xs font-bold uppercase tracking-[0.14em] text-accent-700">Step {step + 1} of 4</span>
        {STEPS[step]}
      </h2>

      {(banner || errorCount > 0) && (
        <div role="alert" className="mt-4 animate-fade-up rounded-2xl border border-red-200 bg-red-50 p-4 font-medium text-red-900">
          {banner ?? `Please check ${errorCount === 1 ? "the highlighted field" : `the ${errorCount} highlighted fields`}.`}
        </div>
      )}

      {!isProductionSite && (
        <p className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-950">
          Preview only: requests sent from this page do not reach JMT Enterprise. To book a real pickup, please call or email
          JMT directly.
        </p>
      )}

      <form
        noValidate
        className="mt-6 space-y-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (step < 3) next();
          else void submit();
        }}
      >
        {/* Honeypot: hidden from people and assistive tech. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Leave this field empty
            <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} name="jmt_hp_x" />
          </label>
        </div>

        <div key={step} className="animate-step-in space-y-8">
        {step === 0 && (
          <>
            <Field path="serviceType" label="What do you need?" errors={errors} required>
              {(p) => (
                <select {...p} className="field-input" value={form.serviceType} onChange={(e) => update("serviceType", e.target.value)}>
                  <option value="">Choose a service</option>
                  {SERVICE_TYPES.map((s) => (
                    <option key={s} value={s}>
                      {serviceTypeLabel(s)}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            <ChoiceGroup
              path="customerType"
              legend="Is this for you or a business?"
              options={[
                { key: "individual", label: "Individual" },
                { key: "business", label: "Business" },
              ]}
              value={form.customerType}
              onChange={(v) => update("customerType", v)}
              errors={errors}
            />
            {form.customerType === "business" && (
              <Field path="companyName" label="Company name" errors={errors}>
                {(p) => <input {...p} className="field-input" autoComplete="organization" value={form.companyName} onChange={(e) => update("companyName", e.target.value)} />}
              </Field>
            )}

            <fieldset className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition-colors focus-within:border-brand-300 focus-within:bg-white sm:p-6">
              <legend className="rounded-full bg-white px-3 text-lg font-bold text-brand-900">Pickup address</legend>
              <AddressFields path="pickup" value={form.pickup} onChange={(k, v) => update(`pickup.${k}`, v)} errors={errors} />
            </fieldset>

            {form.extraStops.map((s, i) => (
              <fieldset key={s.uid ?? i} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition-colors focus-within:border-brand-300 focus-within:bg-white sm:p-6">
                <legend className="rounded-full bg-white px-3 text-lg font-bold text-brand-900">Extra stop {i + 1}</legend>
                <div className="space-y-4">
                  <ChoiceGroup
                    path={`extraStops.${i}.kind`}
                    legend="Is this stop a pickup or a drop-off?"
                    options={[
                      { key: "pickup", label: "Pickup" },
                      { key: "dropoff", label: "Drop-off" },
                    ]}
                    value={s.kind}
                    onChange={(v) => update(`extraStops.${i}.kind`, v)}
                    errors={errors}
                  />
                  <AddressFields path={`extraStops.${i}.address`} value={s.address} onChange={(k, v) => update(`extraStops.${i}.address.${k}`, v)} errors={errors} />
                  <Field path={`extraStops.${i}.notes`} label="Notes for this stop" errors={errors}>
                    {(p) => <input {...p} className="field-input" value={s.notes} onChange={(e) => update(`extraStops.${i}.notes`, e.target.value)} />}
                  </Field>
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center gap-2 font-semibold text-red-700"
                    onClick={() => removeAt("extraStops", i)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" /> Remove stop {i + 1}
                  </button>
                </div>
              </fieldset>
            ))}
            {form.extraStops.length < MAX_EXTRA_STOPS && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setForm((f) => ({ ...f, extraStops: [...f.extraStops, { uid: uid(), kind: "pickup", address: emptyAddress(), notes: "" }] }))}
              >
                <Plus className="size-5" aria-hidden="true" /> Add another stop
              </button>
            )}

            <fieldset className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition-colors focus-within:border-brand-300 focus-within:bg-white sm:p-6">
              <legend className="rounded-full bg-white px-3 text-lg font-bold text-brand-900">Drop-off address</legend>
              <AddressFields path="dropoff" value={form.dropoff} onChange={(k, v) => update(`dropoff.${k}`, v)} errors={errors} />
            </fieldset>

            <fieldset className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition-colors focus-within:border-brand-300 focus-within:bg-white sm:p-6">
              <legend className="rounded-full bg-white px-3 text-lg font-bold text-brand-900">Requested timing</legend>
              <p className="mb-4 text-sm text-muted">
                This is your preference, not a reserved time slot. Times are in {business.timezoneLabel} ({business.timezone}). JMT
                confirms availability with your quote.
              </p>
              <div className="space-y-5">
                <ChoiceGroup
                  path="dateMode"
                  legend="Preferred date"
                  options={[
                    { key: "asap", label: "As soon as possible", description: "Same-day depends on JMT's availability" },
                    { key: "date", label: "Choose a date" },
                  ]}
                  value={form.dateMode}
                  onChange={(v) => update("dateMode", v)}
                  errors={errors}
                />
                {form.dateMode === "date" && (
                  <Field path="requestedDate" label="Requested date" errors={errors} required>
                    {(p) => <input {...p} type="date" min={today} max={latest} className="field-input sm:max-w-xs" value={form.requestedDate} onChange={(e) => update("requestedDate", e.target.value)} />}
                  </Field>
                )}
                <ChoiceGroup path="timeWindow" legend="Requested time of day" options={TIME_WINDOWS} value={form.timeWindow} onChange={(v) => update("timeWindow", v)} errors={errors} columns={4} />
              </div>
            </fieldset>
          </>
        )}

        {step === 1 && (
          <>
            <div className="space-y-4">
              {form.items.map((item, i) => (
                <fieldset key={item.uid ?? i} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition-colors focus-within:border-brand-300 focus-within:bg-white sm:p-6">
                  <legend className="rounded-full bg-white px-3 text-lg font-bold text-brand-900">Item {i + 1}</legend>
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
                      <Field path={`items.${i}.description`} label="What is it?" errors={errors} required hint="For example: 3-seat sofa, washing machine, antique mirror.">
                        {(p) => <input {...p} className="field-input" value={item.description} onChange={(e) => update(`items.${i}.description`, e.target.value)} />}
                      </Field>
                      <Field path={`items.${i}.quantity`} label="Quantity" errors={errors} required>
                        {(p) => <input {...p} className="field-input" inputMode="numeric" value={item.quantity} onChange={(e) => update(`items.${i}.quantity`, e.target.value)} />}
                      </Field>
                    </div>
                    <ChoiceGroup
                      path={`items.${i}.sizeKnown`}
                      legend="Do you know the size or weight?"
                      options={[
                        { key: "not-sure", label: "Not sure", description: "That's fine. Photos or a description help." },
                        { key: "yes", label: "Yes, I'll add what I know" },
                      ]}
                      value={item.sizeKnown}
                      onChange={(v) => update(`items.${i}.sizeKnown`, v)}
                      errors={errors}
                    />
                    {item.sizeKnown === "yes" && (
                      <div className="grid gap-4 rounded-xl bg-white p-4 ring-1 ring-slate-200 sm:grid-cols-4">
                        {(["length", "width", "height"] as const).map((d) => (
                          <Field key={d} path={`items.${i}.${d}`} label={d[0].toUpperCase() + d.slice(1)} errors={errors}>
                            {(p) => <input {...p} className="field-input" inputMode="decimal" value={item[d]} onChange={(e) => update(`items.${i}.${d}`, e.target.value)} />}
                          </Field>
                        ))}
                        <Field path={`items.${i}.dimensionUnit`} label="Units" errors={errors}>
                          {(p) => (
                            <select {...p} className="field-input" value={item.dimensionUnit} onChange={(e) => update(`items.${i}.dimensionUnit`, e.target.value)}>
                              <option value="in">inches</option>
                              <option value="ft">feet</option>
                              <option value="cm">cm</option>
                            </select>
                          )}
                        </Field>
                        <div className="sm:col-span-2">
                          <Field path={`items.${i}.weight`} label="Estimated weight" errors={errors}>
                            {(p) => <input {...p} className="field-input" inputMode="decimal" value={item.weight} onChange={(e) => update(`items.${i}.weight`, e.target.value)} />}
                          </Field>
                        </div>
                        <Field path={`items.${i}.weightUnit`} label="Units" errors={errors}>
                          {(p) => (
                            <select {...p} className="field-input" value={item.weightUnit} onChange={(e) => update(`items.${i}.weightUnit`, e.target.value)}>
                              <option value="lb">lb</option>
                              <option value="kg">kg</option>
                            </select>
                          )}
                        </Field>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                      {(
                        [
                          ["fragile", "Fragile"],
                          ["oversized", "Oversized or very heavy"],
                        ] as const
                      ).map(([k, label]) => (
                        <label key={k} className="inline-flex min-h-11 items-center gap-2">
                          <input type="checkbox" className="size-5 accent-brand-700" checked={item[k]} onChange={(e) => update(`items.${i}.${k}`, e.target.checked)} />
                          {label}
                        </label>
                      ))}
                    </div>
                    {form.items.length > 1 && (
                      <button
                        type="button"
                        className="inline-flex min-h-11 items-center gap-2 font-semibold text-red-700"
                        onClick={() => removeAt("items", i)}
                      >
                        <Trash2 className="size-4" aria-hidden="true" /> Remove item {i + 1}
                      </button>
                    )}
                  </div>
                </fieldset>
              ))}
              {form.items.length < MAX_ITEMS && (
                <button type="button" className="btn-secondary" onClick={() => setForm((f) => ({ ...f, items: [...f.items, emptyItem()] }))}>
                  <Plus className="size-5" aria-hidden="true" /> Add another item
                </button>
              )}
            </div>

            <ChoiceGroup
              path="vehicle"
              legend="Vehicle preference"
              hint="JMT reviews every request and confirms the vehicle with your quote."
              options={VEHICLE_PREFS.map((v) => ({ key: v, label: vehicleLabel(v) }))}
              value={form.vehicle}
              onChange={(v) => update("vehicle", v)}
              errors={errors}
              columns={3}
            />
            <ChoiceGroup
              path="loadingHelp"
              legend="Do you need help loading or unloading?"
              hint="JMT confirms what help is available with your quote."
              options={YES_NO_UNSURE}
              value={form.loadingHelp}
              onChange={(v) => update("loadingHelp", v)}
              errors={errors}
              columns={3}
            />
            {accessFields("pickupAccess", "Access at pickup")}
            {accessFields("dropoffAccess", "Access at drop-off")}
            <Field path="specialInstructions" label="Special handling instructions" errors={errors}>
              {(p) => <textarea {...p} rows={3} className="field-input" value={form.specialInstructions} onChange={(e) => update("specialInstructions", e.target.value)} />}
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-muted">Photos are optional, but they help JMT understand your items and prepare an accurate quote.</p>
            <PhotoUploader photos={photos} onAdd={addPhotos} onRetry={upload} onRemove={removePhoto} />
            {failedPhotoPrompt && photos.some((p) => p.status === "error") && (
              <div role="alert" className="rounded-lg border border-amber-400 bg-amber-50 p-4 text-amber-950">
                <p className="font-semibold">Some photos were not added.</p>
                <p className="mt-1 text-sm">Retry them, or remove them and continue. Photos that were not added will not be sent.</p>
                <button
                  type="button"
                  className="btn-secondary mt-3"
                  onClick={() => {
                    photos.filter((p) => p.status === "error").forEach(removePhoto);
                    setFailedPhotoPrompt(false);
                    track("quote_step_complete", { step: 3 });
                    goTo(3);
                  }}
                >
                  Remove failed photos and continue
                </button>
              </div>
            )}
            <Field path="photoNotes" label="Additional notes" errors={errors}>
              {(p) => <textarea {...p} rows={3} className="field-input" value={form.photoNotes} onChange={(e) => update("photoNotes", e.target.value)} />}
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field path="name" label="Your name" errors={errors} required>
                  {(p) => <input {...p} className="field-input" autoComplete="name" value={form.name} onChange={(e) => update("name", e.target.value)} />}
                </Field>
              </div>
              <Field path="phone" label="Phone" errors={errors} required>
                {(p) => <input {...p} type="tel" className="field-input" autoComplete="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} />}
              </Field>
              <Field path="email" label="Email" errors={errors} required>
                {(p) => <input {...p} type="email" className="field-input" autoComplete="email" value={form.email} onChange={(e) => update("email", e.target.value)} />}
              </Field>
            </div>
            <ChoiceGroup
              path="preferredContact"
              legend="How should JMT contact you?"
              options={[
                { key: "either", label: "Either" },
                { key: "phone", label: "Phone" },
                { key: "email", label: "Email" },
              ]}
              value={form.preferredContact}
              onChange={(v) => update("preferredContact", v)}
              errors={errors}
              columns={3}
            />

            <Review form={effectiveForm(form)} photos={photos} onEdit={editFromReview} />

            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition-colors focus-within:border-brand-300 focus-within:bg-white sm:p-6">
              <label className="flex items-start gap-3">
                <input
                  id={fieldId("acknowledged")}
                  type="checkbox"
                  className="mt-1 size-5 shrink-0 accent-brand-700"
                  checked={form.acknowledged}
                  aria-invalid={Boolean(errors.acknowledged)}
                  aria-describedby={errors.acknowledged ? "f-acknowledged-err" : undefined}
                  onChange={(e) => update("acknowledged", e.target.checked)}
                />
                <span className="font-medium">{ACKNOWLEDGEMENT_TEXT}</span>
              </label>
              {errors.acknowledged && (
                <p id="f-acknowledged-err" className="field-error">
                  {errors.acknowledged}
                </p>
              )}
              {turnstileSiteKey && (
                <div className="mt-4">
                  <Turnstile onToken={setChallengeToken} resetKey={challengeReset} />
                </div>
              )}
              <p className="mt-4 text-sm text-muted">
                We use your details only to review and respond to this request. See our{" "}
                <Link href="/privacy-policy" className="font-semibold text-brand-700 underline underline-offset-4" target="_blank">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </>
        )}

        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-between">
          {step > 0 ? (
            <button type="button" className="btn-secondary" onClick={() => { setReturnToReview(false); goTo(step - 1); }}>
              <ArrowLeft className="size-5" aria-hidden="true" /> Back
            </button>
          ) : (
            <span />
          )}
          {step < 3 ? (
            <button type="submit" className="btn-primary group">
              {returnToReview ? "Save and return to review" : "Continue"}{" "}
              <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
            </button>
          ) : (
            <button type="submit" className="btn-primary" disabled={submitting || !draftToken || Boolean(turnstileSiteKey && !challengeToken)} aria-disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="size-5 animate-spin" aria-hidden="true" /> Sending…
                </>
              ) : (
                "Send quote request"
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function Review({ form, photos, onEdit }: { form: FormState; photos: Photo[]; onEdit: (step: number) => void }) {
  const addr = (a: AddressState) => `${a.street}${a.unit ? `, ${a.unit}` : ""}, ${a.city}, ${a.state} ${a.zip}`;
  const access = (a: AccessState) =>
    [labelOf(STAIRS, a.stairs), a.floor && `floor ${a.floor}`, labelOf(ELEVATOR, a.elevator), a.parkingNotes].filter(Boolean).join("; ");
  const ready = photos.filter((p) => p.status === "ready");

  const sections: { title: string; step: number; rows: [string, string][] }[] = [
    {
      title: "Pickup and delivery",
      step: 0,
      rows: [
        ["Service", serviceTypeLabel(form.serviceType)],
        ["For", form.customerType === "business" ? `Business${form.companyName ? ` (${form.companyName})` : ""}` : "Individual"],
        ["Pickup", addr(form.pickup)],
        ...form.extraStops.map((s, i) => [`Extra stop ${i + 1} (${s.kind === "pickup" ? "pickup" : "drop-off"})`, addr(s.address)] as [string, string]),
        ["Drop-off", addr(form.dropoff)],
        [
          "Requested timing",
          `${form.dateMode === "asap" ? "As soon as possible" : form.requestedDate ? formatIsoDate(form.requestedDate) : ""}, ${timeWindowLabel(form.timeWindow)} (${business.timezoneLabel})`,
        ],
      ],
    },
    {
      title: "Items and access",
      step: 1,
      rows: [
        ...form.items.map(
          (it, i) =>
            [
              `Item ${i + 1}`,
              `${it.quantity} × ${it.description}${it.sizeKnown === "yes" && (it.length || it.width || it.height) ? `, ${it.length || "?"}×${it.width || "?"}×${it.height || "?"} ${it.dimensionUnit}` : ""}${it.sizeKnown === "yes" && it.weight ? `, ${it.weight} ${it.weightUnit}` : ""}${it.fragile ? ", fragile" : ""}${it.oversized ? ", oversized" : ""}`,
            ] as [string, string],
        ),
        ["Vehicle", vehicleLabel(form.vehicle)],
        ["Loading help", labelOf(YES_NO_UNSURE, form.loadingHelp)],
        ["Pickup access", access(form.pickupAccess)],
        ["Drop-off access", access(form.dropoffAccess)],
        ...(form.specialInstructions ? ([["Special handling", form.specialInstructions]] as [string, string][]) : []),
      ],
    },
    {
      title: "Photos",
      step: 2,
      rows: [
        ["Photos", ready.length ? ready.map((p) => p.name).join(", ") : "No photos"],
        ...(form.photoNotes ? ([["Notes", form.photoNotes]] as [string, string][]) : []),
      ],
    },
  ];

  return (
    <section aria-labelledby="review-h" className="rounded-2xl border border-brand-100 bg-brand-50/50 p-4 sm:p-6">
      <h3 id="review-h" className="text-lg font-bold text-brand-900">
        Review your request
      </h3>
      <div className="mt-3 space-y-5">
        {sections.map((s) => (
          <div key={s.title}>
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-brand-800">{s.title}</h4>
              <button type="button" onClick={() => onEdit(s.step)} className="min-h-11 px-2 font-semibold text-brand-700 underline">
                Edit<span className="sr-only"> {s.title.toLowerCase()}</span>
              </button>
            </div>
            <dl className="mt-1 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[10rem_1fr]">
              {s.rows.map(([k, v], i) => (
                <div key={i} className="contents">
                  <dt className="font-semibold text-slate-600">{k}</dt>
                  <dd className="mb-2 break-words text-ink sm:mb-0">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}
