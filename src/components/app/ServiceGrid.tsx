import Link from "next/link";
import {
  ArrowLeftRight,
  Barcode,
  CreditCard,
  FileText,
  Gauge,
  HandCoins,
  PiggyBank,
  Receipt,
  ShieldCheck,
  Smartphone,
  Umbrella,
  Wallet,
  type LucideIcon,
} from "lucide-react";

type Servico = {
  nome: string;
  descricao: string;
  href?: string;
  icone: LucideIcon;
};

/**
 * Atalhos da conta.
 *
 * Os serviços previstos mas ainda não construídos aparecem apagados e inertes,
 * com o rótulo "em breve": o cliente enxerga o roteiro do produto sem que a
 * interface finja que já dá para usar.
 */
const DISPONIVEIS: Servico[] = [
  { nome: "Pedir crédito", descricao: "Simule e contrate", href: "/app/credito", icone: HandCoins },
  { nome: "Transferir", descricao: "Entre contas Valor", href: "/app/transferir", icone: ArrowLeftRight },
  { nome: "Depositar", descricao: "Adicionar saldo", href: "/app/extrato", icone: Wallet },
  { nome: "Pagar parcela", descricao: "Contratos abertos", href: "/app/contratos", icone: Receipt },
  { nome: "Extrato", descricao: "Toda a movimentação", href: "/app/extrato", icone: FileText },
  { nome: "Meu score", descricao: "Como é calculado", href: "/app/score", icone: Gauge },
  { nome: "Segurança", descricao: "Senha e dois fatores", href: "/app/perfil", icone: ShieldCheck },
];

const EM_BREVE: Servico[] = [
  { nome: "Cartão", descricao: "Em breve", icone: CreditCard },
  { nome: "Pagar boleto", descricao: "Em breve", icone: Barcode },
  { nome: "Investir", descricao: "Em breve", icone: PiggyBank },
  { nome: "Recarga", descricao: "Em breve", icone: Smartphone },
  { nome: "Seguros", descricao: "Em breve", icone: Umbrella },
];

function Conteudo({ servico }: { servico: Servico }) {
  const Icone = servico.icone;
  return (
    <>
      <span className="service-icon">
        <Icone size={17} aria-hidden="true" />
      </span>
      <span>
        <span className="service-name">{servico.nome}</span>
        <span className="service-hint">{servico.descricao}</span>
      </span>
    </>
  );
}

export function ServiceGrid() {
  return (
    <div className="service-grid">
      {DISPONIVEIS.map((servico) => (
        <Link key={servico.nome} href={servico.href ?? "/app"} className="service-tile">
          <Conteudo servico={servico} />
        </Link>
      ))}

      {EM_BREVE.map((servico) => (
        <span
          key={servico.nome}
          className="service-tile service-tile--soon"
          aria-disabled="true"
          title="Serviço previsto, ainda não disponível"
        >
          <Conteudo servico={servico} />
        </span>
      ))}
    </div>
  );
}
