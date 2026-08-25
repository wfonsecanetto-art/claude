"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

type Variant = "primary" | "outline" | "danger" | "ghost";

/**
 * Botão que conhece o estado do formulário em que está.
 *
 * A aparência vem das classes de styles.css; aqui fica só o comportamento:
 * desabilitar durante o envio e trocar o rótulo.
 */
export function SubmitButton({
  children,
  variant = "primary",
  size,
  block,
  className = "",
  pendingLabel = "Enviando…",
  name,
  value,
}: {
  children: ReactNode;
  variant?: Variant;
  size?: "sm" | "lg";
  block?: boolean;
  className?: string;
  pendingLabel?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();

  const classes = [
    "btn",
    `btn-${variant}`,
    size ? `btn-${size}` : "",
    block ? "btn-block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type="submit" name={name} value={value} disabled={pending} aria-busy={pending} className={classes}>
      {pending ? pendingLabel : children}
    </button>
  );
}
