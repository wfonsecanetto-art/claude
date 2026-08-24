"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useScrolled } from "@/lib/hooks";
import { easeOut } from "@/lib/motion";
import { NAV } from "@/content/site";
import { Logo } from "./ui/Logo";
import { MagneticButton } from "./ui/MagneticButton";

/**
 * Header transparente que ganha vidro ao rolar.
 * No mobile, o menu abre em painel cheio com foco preso ao painel.
 */
export function Header() {
  const scrolled = useScrolled(24);
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [close, open]);

  return (
    <>
      <a
        href="#conteudo"
        className="bg-lime text-ink sr-only rounded-full px-4 py-2 text-sm font-semibold focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60]"
      >
        Pular para o conteúdo
      </a>

      <motion.header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-500 ${
          scrolled
            ? "border-b border-hairline bg-graphite/70 backdrop-blur-xl backdrop-saturate-150"
            : "border-b border-transparent bg-transparent"
        }`}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={easeOut(0.8, 0.15)}
      >
        <div className="container-valor flex h-[72px] items-center justify-between gap-6">
          <a href="#inicio" aria-label="Banco Valor Digital — início" className="shrink-0">
            <Logo />
          </a>

          <nav aria-label="Navegação principal" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="group text-gray-valor relative inline-flex items-center px-3.5 py-2 text-sm transition-colors duration-300 hover:text-white"
                  >
                    {item.label}
                    <span
                      aria-hidden="true"
                      className="bg-lime absolute inset-x-3.5 bottom-1 h-px origin-left scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <MagneticButton href="#contato" variant="ghost">
              Entrar
            </MagneticButton>
            <MagneticButton href="#contato" variant="primary" className="px-6 py-3 text-[0.8125rem]">
              Solicitar crédito
            </MagneticButton>
          </div>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="border-hairline-strong inline-flex h-10 w-10 items-center justify-center rounded-full border text-white lg:hidden"
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
          >
            {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="menu-mobile"
            className="bg-ink/97 fixed inset-0 z-40 flex flex-col justify-between pt-[72px] backdrop-blur-xl lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={easeOut(0.4)}
          >
            <nav aria-label="Navegação principal (mobile)" className="container-valor pt-8">
              <ul className="flex flex-col">
                {NAV.map((item, index) => (
                  <motion.li
                    key={item.href}
                    className="border-hairline border-b"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={easeOut(0.5, 0.05 * index)}
                  >
                    <a
                      href={item.href}
                      onClick={close}
                      className="font-display block py-5 text-2xl font-extrabold tracking-tight text-white uppercase"
                    >
                      {item.label}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </nav>

            <div className="container-valor flex flex-col gap-3 pb-10">
              <MagneticButton href="#contato" variant="primary" className="w-full">
                Solicitar crédito
              </MagneticButton>
              <MagneticButton href="#contato" variant="outline" className="w-full">
                Entrar
              </MagneticButton>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
