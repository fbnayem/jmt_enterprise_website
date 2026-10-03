"use client";

import { ArrowLeft, ArrowRight, Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { business } from "@/content/site";
import { track } from "@/lib/analytics";
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
import { issuesToErrors, stepSchemas } from "@/lib/quote/schema";
import { formatIsoDate, todayInTimezone } from "@/lib/quote/time";
import { AddressFields, ChoiceGroup, Field, fieldId, type AddressState } from "./fields";
import { clientCheck, PhotoUploader, type Photo } from "./PhotoUploader";

type AccessState = { stairs: string; floor: string; elevator: string; parkingNotes: string };
type ItemState = {
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
type StopState = { kind: "pickup" | "dropoff"; address: AddressState; notes: string };

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
const emptyItem = (): ItemState => ({
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
  const params = useSearchParams();
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
  const started = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const today = todayInTimezone(business.timezone);

  // Restore an in-progress request (survives reloads and recoverable errors).
  // sessionStorage only exists in the browser, so this must run after hydration.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const saved = storage.read();
    if (saved) {
      setForm({ ...initialState(), ...saved.form });
      setStep(saved.step ?? 0);
      setDraftToken(saved.token ?? "");
      setIdempotencyKey(saved.idem || crypto.randomUUID());
      // Files are not persisted; keep only photos that finished uploading.
      setPhotos((saved.photos ?? []).filter((p) => p.status === "ready").map((p) => ({ ...p, previewUrl: undefined, file: undefined })));
    } else {
      setIdempotencyKey(crypto.randomUUID());
      const service = params.get("service");
      if (service && (SERVICE_TYPES as readonly string[]).includes(service)) {
        setForm((f) => ({ ...f, serviceType: service, ...(service === "small-business" ? { customerType: "business" } : {}) }));
      }
    }
    setHydrated(true);
  }, [params]);

  const ensureToken = useCallback(async () => {
    if (draftToken) return draftToken;
    const { res, data } = await postJson("/api/drafts", {});
    if (!res.ok) throw new Error(data.error ?? "Could not start the form.");
    setDraftToken(data.token);
    return data.token as string;
  }, [draftToken]);

  useEffect(() => {
    if (hydrated && !draftToken) ensureToken().catch(() => setBanner("We could not connect. Check your connection and refresh the page."));
  }, [hydrated, draftToken, ensureToken]);
  /* eslint-enable react-hooks/set-state-in-effect */

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
    const data = n === 2 ? { ...form, attachmentIds: photos.filter((p) => p.status === "ready").map((p) => p.attachmentId) } : form;
    const result = stepSchemas[n].safeParse(data);
    if (result.success) return true;
    const errs = issuesToErrors(result.error.issues);
    setErrors(errs);
    focusFirstError(errs);
    return false;
  };

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
    goTo(step + 1);
  };

  // ---- Photos -------------------------------------------------------------
  const patchPhoto = (localId: string, patch: Partial<Photo>) =>
    setPhotos((ps) => ps.map((p) => (p.localId === localId ? { ...p, ...patch } : p)));

  const upload = async (photo: Photo) => {
    const file = photo.file!;
    patchPhoto(photo.localId, { status: "uploading", error: undefined });
    try {
      const token = await ensureToken();
      const signed = await postJson("/api/uploads/sign", { draftToken: token, name: file.name, type: file.type, size: file.size });
      if (!signed.res.ok) throw new Error(signed.data.error ?? "Upload could not start.");
      const put = await fetch(signed.data.uploadUrl, { method: "PUT", headers: signed.data.headers, body: file });
      if (!put.ok) throw new Error("The upload was interrupted. Please retry.");
      const done = await postJson("/api/uploads/complete", { draftToken: token, attachmentId: signed.data.attachmentId });
      if (!done.res.ok) throw new Error(done.data.error ?? "The photo could not be saved. Please retry.");
      patchPhoto(photo.localId, { status: "ready", attachmentId: signed.data.attachmentId });
    } catch (e) {
      patchPhoto(photo.localId, {
        status: "error",
        error: e instanceof TypeError ? "Connection lost during upload. Please retry." : (e as Error).message,
      });
    }
  };

  const addPhotos = (files: File[]) => {
    setFailedPhotoPrompt(false);
    const room = 5 - photos.length;
    const accepted: Photo[] = [];
    for (const file of files.slice(0, room)) {
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
    if (files.length > room) setBanner(`Only ${room} more photo${room === 1 ? "" : "s"} can be added.`);
    setPhotos((ps) => [...ps, ...accepted]);
    accepted.filter((p) => p.status === "uploading").forEach(upload);
  };

  const removePhoto = async (p: Photo) => {
    setPhotos((ps) => ps.filter((x) => x.localId !== p.localId));
    if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
    if (p.attachmentId && draftToken) postJson("/api/uploads/remove", { draftToken, attachmentId: p.attachmentId }).catch(() => {});
  };

  // ---- Submit -------------------------------------------------------------
  const submit = async () => {
    if (submitting) return;
    if (!validateStep(3)) return;
    setSubmitting(true);
    setBanner(null);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25_000);
    try {
      const token = await ensureToken();
      const url = new URL(window.location.href);
      const payload = {
        ...form,
        attachmentIds: photos.filter((p) => p.status === "ready").map((p) => p.attachmentId),
        meta: {
          idempotencyKey,
          draftToken: token,
          website: honeypot,
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
  const accessFields = (prefix: "pickupAccess" | "dropoffAccess", title: string) => (
    <fieldset className="rounded-xl border border-slate-200 p-4 sm:p-5">
      <legend className="px-1 text-lg font-bold text-brand-900">{title}</legend>
      <div className="space-y-5">
        <ChoiceGroup path={`${prefix}.stairs`} legend="Are there stairs?" options={STAIRS} value={form[prefix].stairs} onChange={(v) => update(`${prefix}.stairs`, v)} errors={errors} columns={3} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field path={`${prefix}.floor`} label="Floor number" errors={errors} hint="Leave blank if not sure.">
            {(p) => <input {...p} className="field-input" inputMode="numeric" value={form[prefix].floor} onChange={(e) => update(`${prefix}.floor`, e.target.value)} />}
          </Field>
        </div>
        <ChoiceGroup path={`${prefix}.elevator`} legend="Elevator access" options={ELEVATOR} value={form[prefix].elevator} onChange={(v) => update(`${prefix}.elevator`, v)} errors={errors} columns={2} />
        <Field path={`${prefix}.parkingNotes`} label="Parking or access restrictions" errors={errors} hint="For example: narrow driveway, gate code needed, loading dock hours.">
          {(p) => <textarea {...p} rows={2} className="field-input" value={form[prefix].parkingNotes} onChange={(e) => update(`${prefix}.parkingNotes`, e.target.value)} />}
        </Field>
      </div>
    </fieldset>
  );

  const errorCount = Object.keys(errors).length;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Progress */}
      <nav aria-label="Request progress" className="mb-8">
        <ol className="grid grid-cols-4 gap-2">
          {STEPS.map((s, i) => (
            <li key={s} aria-current={i === step ? "step" : undefined}>
              <span className={`block h-2 rounded-full ${i <= step ? "bg-brand-700" : "bg-slate-200"}`} aria-hidden="true" />
              <span className={`mt-2 hidden text-sm sm:block ${i === step ? "font-bold text-brand-900" : "text-slate-500"}`}>
                {i + 1}. {s}
              </span>
              <span className="sr-only">
                {`Step ${i + 1}: ${s}${i < step ? " (completed)" : i === step ? " (current)" : ""}`}
              </span>
            </li>
          ))}
        </ol>
      </nav>

      <h2 ref={headingRef} tabIndex={-1} className="scroll-mt-28 text-2xl font-extrabold text-brand-900 outline-none">
        <span className="block text-sm font-semibold uppercase tracking-wide text-brand-600">Step {step + 1} of 4</span>
        {STEPS[step]}
      </h2>

      {(banner || errorCount > 0) && (
        <div role="alert" className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4 text-red-900">
          {banner ?? `Please check ${errorCount === 1 ? "the highlighted field" : `the ${errorCount} highlighted fields`}.`}
        </div>
      )}

      <form
        noValidate
        className="mt-6 space-y-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (step < 3) next();
          else submit();
        }}
      >
        {/* Honeypot: hidden from people and assistive tech. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} name="website" />
          </label>
        </div>

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

            <fieldset className="rounded-xl border border-slate-200 p-4 sm:p-5">
              <legend className="px-1 text-lg font-bold text-brand-900">Pickup address</legend>
              <AddressFields path="pickup" value={form.pickup} onChange={(k, v) => update(`pickup.${k}`, v)} errors={errors} />
            </fieldset>

            {form.extraStops.map((s, i) => (
              <fieldset key={i} className="rounded-xl border border-slate-200 p-4 sm:p-5">
                <legend className="px-1 text-lg font-bold text-brand-900">Extra stop {i + 1}</legend>
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
                    onClick={() => setForm((f) => ({ ...f, extraStops: f.extraStops.filter((_, j) => j !== i) }))}
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
                onClick={() => setForm((f) => ({ ...f, extraStops: [...f.extraStops, { kind: "pickup", address: emptyAddress(), notes: "" }] }))}
              >
                <Plus className="size-5" aria-hidden="true" /> Add another stop
              </button>
            )}

            <fieldset className="rounded-xl border border-slate-200 p-4 sm:p-5">
              <legend className="px-1 text-lg font-bold text-brand-900">Drop-off address</legend>
              <AddressFields path="dropoff" value={form.dropoff} onChange={(k, v) => update(`dropoff.${k}`, v)} errors={errors} />
            </fieldset>

            <fieldset className="rounded-xl border border-slate-200 p-4 sm:p-5">
              <legend className="px-1 text-lg font-bold text-brand-900">Requested timing</legend>
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
                    {(p) => <input {...p} type="date" min={today} className="field-input sm:max-w-xs" value={form.requestedDate} onChange={(e) => update("requestedDate", e.target.value)} />}
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
                <fieldset key={i} className="rounded-xl border border-slate-200 p-4 sm:p-5">
                  <legend className="px-1 text-lg font-bold text-brand-900">Item {i + 1}</legend>
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
                      <div className="grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-4">
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
                        onClick={() => setForm((f) => ({ ...f, items: f.items.filter((_, j) => j !== i) }))}
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

            <Review form={form} photos={photos} onEdit={goTo} />

            <div className="rounded-xl border border-slate-200 p-4 sm:p-5">
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
              <p className="mt-4 text-sm text-muted">
                We use your details only to review and respond to this request. See our{" "}
                <Link href="/privacy-policy" className="font-semibold text-brand-700 underline" target="_blank">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-between">
          {step > 0 ? (
            <button type="button" className="btn-secondary" onClick={() => goTo(step - 1)}>
              <ArrowLeft className="size-5" aria-hidden="true" /> Back
            </button>
          ) : (
            <span />
          )}
          {step < 3 ? (
            <button type="submit" className="btn-primary">
              Continue <ArrowRight className="size-5" aria-hidden="true" />
            </button>
          ) : (
            <button type="submit" className="btn-primary" disabled={submitting || !draftToken} aria-disabled={submitting}>
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
    <section aria-labelledby="review-h" className="rounded-xl bg-slate-50 p-4 sm:p-5">
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
