"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  FileText,
  Gauge,
  LayoutDashboard,
  Receipt,
  ShieldCheck,
  Wallet,
} from "lucide-react";

const ITEMS = [
  { href: "/app", label: "Início", icon: LayoutDashboard },
  { href: "/app/credito", label: "Crédito", icon: Wallet },
  { href: "/app/contratos", label: "Contratos", icon: FileText },
  { href: "/app/extrato", label: "Extrato", icon: Receipt },
  { href: "/app/transferir", label: "Transferir", icon: ArrowLeftRight },
  { href: "/app/score", label: "Score", icon: Gauge },
  { href: "/app/perfil", label: "Segurança", icon: ShieldCheck },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegação da conta" className="no-scrollbar overflow-x-auto">
      <ul className="app-nav-list">
        {ITEMS.map((item) => {
          const active = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              {/* O estado ativo é lido do aria-current, inclusive pelo CSS —
                  uma fonte de verdade só, para a tela e para a leitura. */}
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="app-nav-link"
              >
                <Icon size={16} aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
