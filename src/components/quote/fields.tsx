"use client";

import type { ReactNode } from "react";
import { US_STATES } from "@/lib/quote/options";

export const fieldId = (path: string) => `f-${path.replace(/\./g, "-")}`;

type Errors = Record<string, string>;

export function Field({
  path,
  label,
  errors,
  hint,
  required,
  children,
}: {
  path: string;
  label: string;
  errors: Errors;
  hint?: ReactNode;
  required?: boolean;
  children: (props: { id: string; "aria-invalid": boolean; "aria-describedby"?: string; required?: boolean }) => ReactNode;
}) {
  const id = fieldId(path);
  const err = errors[path];
  const describedBy = [hint ? `${id}-hint` : "", err ? `${id}-err` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
        {required ? <span aria-hidden="true" className="text-red-700"> *</span> : <span className="font-normal text-slate-500"> (optional)</span>}
      </label>
      {children({ id, "aria-invalid": Boolean(err), "aria-describedby": describedBy, required })}
      {hint && (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      )}
      {err && (
        <p id={`${id}-err`} className="field-error">
          {err}
        </p>
      )}
    </div>
  );
}

/** Radio group rendered as large tappable cards. */
export function ChoiceGroup({
  path,
  legend,
  options,
  value,
  onChange,
  errors,
  hint,
  columns = 2,
}: {
  path: string;
  legend: string;
  options: readonly { key: string; label: string; description?: string }[];
  value: string;
  onChange: (v: string) => void;
  errors: Errors;
  hint?: string;
  columns?: 2 | 3 | 4;
}) {
  const id = fieldId(path);
  const err = errors[path];
  const cols = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[columns];
  return (
    <fieldset id={id} tabIndex={-1} aria-describedby={err ? `${id}-err` : hint ? `${id}-hint` : undefined}>
      <legend className="field-label">
        {legend}
        <span aria-hidden="true" className="text-red-700"> *</span>
      </legend>
      {hint && (
        <p id={`${id}-hint`} className="field-hint -mt-1 mb-2">
          {hint}
        </p>
      )}
      <div className={`grid gap-2 ${cols}`}>
        {options.map((o) => (
          <label
            key={o.key}
            className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border p-3 has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-accent-500 ${
              value === o.key ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600" : err ? "border-red-600" : "border-slate-300"
            }`}
          >
            <input
              type="radio"
              name={path}
              value={o.key}
              checked={value === o.key}
              onChange={() => onChange(o.key)}
              className="mt-1 size-4 accent-brand-700"
            />
            <span>
              <span className="font-medium text-ink">{o.label}</span>
              {o.description && <span className="block text-sm text-muted">{o.description}</span>}
            </span>
          </label>
        ))}
      </div>
      {err && (
        <p id={`${id}-err`} className="field-error">
          {err}
        </p>
      )}
    </fieldset>
  );
}

export type AddressState = { street: string; unit: string; city: string; state: string; zip: string };

export function AddressFields({
  path,
  value,
  onChange,
  errors,
}: {
  path: string;
  value: AddressState;
  onChange: (field: keyof AddressState, v: string) => void;
  errors: Errors;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-6">
      <div className="sm:col-span-4">
        <Field path={`${path}.street`} label="Street address" errors={errors} required>
          {(p) => <input {...p} className="field-input" autoComplete="address-line1" value={value.street} onChange={(e) => onChange("street", e.target.value)} />}
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field path={`${path}.unit`} label="Apt / unit" errors={errors}>
          {(p) => <input {...p} className="field-input" autoComplete="address-line2" value={value.unit} onChange={(e) => onChange("unit", e.target.value)} />}
        </Field>
      </div>
      <div className="sm:col-span-3">
        <Field path={`${path}.city`} label="City" errors={errors} required>
          {(p) => <input {...p} className="field-input" autoComplete="address-level2" value={value.city} onChange={(e) => onChange("city", e.target.value)} />}
        </Field>
      </div>
      <div className="sm:col-span-1">
        <Field path={`${path}.state`} label="State" errors={errors} required>
          {(p) => (
            <select {...p} className="field-input" autoComplete="address-level1" value={value.state} onChange={(e) => onChange("state", e.target.value)}>
              <option value="">–</option>
              {US_STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          )}
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field path={`${path}.zip`} label="ZIP code" errors={errors} required>
          {(p) => (
            <input {...p} className="field-input" inputMode="numeric" autoComplete="postal-code" maxLength={10} value={value.zip} onChange={(e) => onChange("zip", e.target.value)} />
          )}
        </Field>
      </div>
    </div>
  );
}
