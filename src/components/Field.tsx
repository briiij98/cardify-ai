import type { ReactNode } from "react";

interface Props { id: string; label: string; error?: string; hint?: string; required?: boolean; children: (a: { id: string; "aria-invalid": boolean; "aria-describedby"?: string; className: string }) => ReactNode }

export default function Field({ id, label, error, hint, required, children }: Props) {
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div data-field={id}>
      <label htmlFor={id} className="label">{label}{required && <span className="text-maroon"> *</span>}</label>
      {children({ id, "aria-invalid": !!error, "aria-describedby": describedBy, className: `input ${error ? "input-error" : ""}` })}
      {hint && !error && <p id={`${id}-hint`} className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p id={`${id}-err`} role="alert" className="mt-1 text-xs font-medium text-red-700">{error}</p>}
    </div>
  );
}
