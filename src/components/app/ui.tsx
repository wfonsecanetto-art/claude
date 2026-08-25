import type { ReactNode } from "react";

/**
 * Primitivas de interface da área logada.
 *
 * Sem "use client": são componentes de apresentação puros, usados tanto por
 * páginas de servidor quanto por formulários de cliente. A aparência de cada
 * um está em src/app/styles.css — aqui ficam só estrutura e semântica.
 */

export { SubmitButton } from "./SubmitButton";

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
      <label htmlFor={id} className="field-label">
        {label}
        {required ? <span className="field-required"> *</span> : null}
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
        className="field-input"
      />
      {hint ? (
        <p id={`${id}-hint`} className="field-hint">
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
      <label htmlFor={id} className="field-label">
        {label}
        {required ? <span className="field-required"> *</span> : null}
      </label>
      <select id={id} name={name} defaultValue={defaultValue} required={required} className="field-input">
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Textarea({
  name,
  label,
  placeholder,
  rows = 2,
  required,
}: {
  name: string;
  label: string;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}) {
  return (
    <textarea
      name={name}
      rows={rows}
      required={required}
      placeholder={placeholder}
      aria-label={label}
      className="field-textarea"
    />
  );
}

export function Alert({ state }: { state: { ok?: string; error?: string } | null }) {
  if (!state?.ok && !state?.error) return null;

  return (
    <p
      role="status"
      aria-live="polite"
      className={`alert ${state.error ? "alert-error" : "alert-success"}`}
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
    <section className={`panel ${className}`}>
      {title ? (
        <header className="panel-header">
          <div>
            <h2 className="panel-title">{title}</h2>
            {description ? <p className="panel-description">{description}</p> : null}
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
  large,
}: {
  label: string;
  value: string;
  meta?: string;
  accent?: boolean;
  large?: boolean;
}) {
  return (
    <div className="tile">
      <p className="tile-label">{label}</p>
      <p
        className={`tile-value ${accent ? "tile-value-accent" : ""} ${large ? "tile-value-lg" : ""}`}
      >
        {value}
      </p>
      {meta ? <p className="tile-meta">{meta}</p> : null}
    </div>
  );
}

/**
 * Estado traduzido para o cliente.
 *
 * A cor carrega significado, mas nunca sozinha: o rótulo em texto sempre
 * acompanha, porque cor isolada não é informação acessível.
 */
const STATUS_MAP: Record<string, { label: string; tone: string }> = {
  ACTIVE: { label: "Ativo", tone: "pill-positive" },
  SETTLED: { label: "Quitado", tone: "pill-neutral" },
  AWAITING_SIGNATURE: { label: "Aguardando assinatura", tone: "pill-pending" },
  DEFAULTED: { label: "Inadimplente", tone: "pill-negative" },
  CANCELLED: { label: "Cancelado", tone: "pill-neutral" },
  UNDER_REVIEW: { label: "Em análise", tone: "pill-pending" },
  APPROVED: { label: "Aprovada", tone: "pill-positive" },
  REJECTED: { label: "Recusada", tone: "pill-negative" },
  CONTRACTED: { label: "Contratada", tone: "pill-positive" },
  PAID: { label: "Paga", tone: "pill-positive" },
  OPEN: { label: "Em aberto", tone: "pill-neutral" },
  LATE: { label: "Em atraso", tone: "pill-negative" },
  DRAFT: { label: "Em preenchimento", tone: "pill-neutral" },
  SUBMITTED: { label: "Enviado", tone: "pill-pending" },
  IN_REVIEW: { label: "Em análise", tone: "pill-pending" },
  PENDING_KYC: { label: "Verificação pendente", tone: "pill-pending" },
};

export function StatusPill({ status }: { status: string }) {
  const item = STATUS_MAP[status] ?? { label: status, tone: "pill-neutral" };
  return <span className={`pill ${item.tone}`}>{item.label}</span>;
}

export function SandboxNotice({ children }: { children: ReactNode }) {
  return <p className="notice-sandbox">{children}</p>;
}

/** Cabeçalho de página da área logada. */
export function PageHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="page-title">{title}</h1>
      </div>
      {action}
    </div>
  );
}
