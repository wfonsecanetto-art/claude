import type { ReactNode } from "react";

/**
 * Primitivas de interface da área logada.
 *
 * Sem "use client": são componentes de apresentação puros, usados tanto por
 * páginas de servidor quanto por formulários de cliente.
 */

export { SubmitButton } from "./SubmitButton";

const inputClass =
  "w-full rounded-xl border border-hairline bg-ink/70 px-4 py-3 text-sm text-white placeholder:text-gray-valor/60 transition-colors duration-300 focus:border-lime/60 focus:outline-none focus-visible:outline-none";

export function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  defaultValue,
  hint,
  inputMode,
  autoComplete,
  maxLength,
  min,
  step,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number;
  hint?: string;
  inputMode?: "text" | "numeric" | "decimal" | "tel" | "email";
  autoComplete?: string;
  maxLength?: number;
  min?: string | number;
  step?: string;
}) {
  const id = `field-${name}`;
  return (
    <div>
      <label htmlFor={id} className="eyebrow mb-2 block text-[0.625rem]">
        {label}
        {required ? <span className="text-lime"> *</span> : null}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        inputMode={inputMode}
        autoComplete={autoComplete}
        maxLength={maxLength}
        min={min}
        step={step}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={inputClass}
      />
      {hint ? (
        <p id={`${id}-hint`} className="text-gray-valor mt-1.5 text-[0.6875rem]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function SelectField({
  label,
  name,
  options,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
  required?: boolean;
}) {
  const id = `field-${name}`;
  return (
    <div>
      <label htmlFor={id} className="eyebrow mb-2 block text-[0.625rem]">
        {label}
        {required ? <span className="text-lime"> *</span> : null}
      </label>
      <select id={id} name={name} defaultValue={defaultValue} required={required} className={inputClass}>
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-graphite">
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Alert({ state }: { state: { ok?: string; error?: string } | null }) {
  if (!state?.ok && !state?.error) return null;
  const isError = Boolean(state.error);

  return (
    <p
      role="status"
      aria-live="polite"
      className={`rounded-xl border px-4 py-3 text-sm ${
        isError
          ? "border-red-500/30 bg-red-500/10 text-red-200"
          : "border-lime/30 bg-lime/10 text-lime"
      }`}
    >
      {state.error ?? state.ok}
    </p>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`surface-card rounded-2xl p-6 ${className}`}>
      {title ? (
        <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-sm font-extrabold tracking-[0.14em] text-white uppercase">
              {title}
            </h2>
            {description ? (
              <p className="text-gray-valor mt-1.5 text-xs leading-relaxed">{description}</p>
            ) : null}
          </div>
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function StatTile({
  label,
  value,
  meta,
  accent,
}: {
  label: string;
  value: string;
  meta?: string;
  accent?: boolean;
}) {
  return (
    <div className="border-hairline bg-ink/60 rounded-xl border p-4">
      <p className="eyebrow text-[0.5625rem]">{label}</p>
      <p
        className={`font-display mt-2 text-xl font-extrabold tracking-tight tabular-nums ${
          accent ? "text-lime" : "text-white"
        }`}
      >
        {value}
      </p>
      {meta ? <p className="text-gray-valor mt-1 text-[0.6875rem]">{meta}</p> : null}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: "Ativo", className: "border-lime/40 bg-lime/10 text-lime" },
    SETTLED: { label: "Quitado", className: "border-hairline-strong text-gray-valor" },
    AWAITING_SIGNATURE: { label: "Aguardando assinatura", className: "border-amber-400/40 bg-amber-400/10 text-amber-300" },
    DEFAULTED: { label: "Inadimplente", className: "border-red-500/40 bg-red-500/10 text-red-300" },
    CANCELLED: { label: "Cancelado", className: "border-hairline-strong text-gray-valor" },
    UNDER_REVIEW: { label: "Em análise", className: "border-amber-400/40 bg-amber-400/10 text-amber-300" },
    APPROVED: { label: "Aprovada", className: "border-lime/40 bg-lime/10 text-lime" },
    REJECTED: { label: "Recusada", className: "border-red-500/40 bg-red-500/10 text-red-300" },
    CONTRACTED: { label: "Contratada", className: "border-lime/40 bg-lime/10 text-lime" },
    PAID: { label: "Paga", className: "border-lime/40 bg-lime/10 text-lime" },
    OPEN: { label: "Em aberto", className: "border-hairline-strong text-gray-valor" },
    LATE: { label: "Em atraso", className: "border-red-500/40 bg-red-500/10 text-red-300" },
    DRAFT: { label: "Em preenchimento", className: "border-hairline-strong text-gray-valor" },
    SUBMITTED: { label: "Enviado", className: "border-amber-400/40 bg-amber-400/10 text-amber-300" },
    IN_REVIEW: { label: "Em análise", className: "border-amber-400/40 bg-amber-400/10 text-amber-300" },
    PENDING_KYC: { label: "Verificação pendente", className: "border-amber-400/40 bg-amber-400/10 text-amber-300" },
  };

  const item = map[status] ?? { label: status, className: "border-hairline-strong text-gray-valor" };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[0.625rem] font-semibold tracking-[0.14em] uppercase ${item.className}`}
    >
      {item.label}
    </span>
  );
}

export function SandboxNotice({ children }: { children: ReactNode }) {
  return (
    <p className="border-amber-400/25 bg-amber-400/5 text-amber-200/90 rounded-xl border px-4 py-3 text-xs leading-relaxed">
      {children}
    </p>
  );
}
