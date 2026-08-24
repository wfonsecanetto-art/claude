"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

/** Botão que conhece o estado do formulário em que está. */
export function SubmitButton({
  children,
  variant = "primary",
  className = "",
  pendingLabel = "Enviando…",
  name,
  value,
}: {
  children: ReactNode;
  variant?: "primary" | "outline" | "danger";
  className?: string;
  pendingLabel?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();

  const styles = {
    primary: "bg-lime text-ink hover:bg-lime-bright",
    outline: "border border-hairline-strong text-white hover:border-lime/60 hover:text-lime",
    danger: "border border-red-500/40 text-red-300 hover:bg-red-500/10",
  }[variant];

  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      aria-busy={pending}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-60 ${styles} ${className}`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
