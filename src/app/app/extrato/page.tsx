import { requireUser } from "@/server/auth/guards";
import { walletBalance, walletStatement } from "@/server/ledger";
import { formatBRL } from "@/server/money";
import { Panel, SandboxNotice, StatTile } from "@/components/app/ui";
import { DepositForm } from "./forms";

const KIND_LABELS: Record<string, string> = {
  DISBURSEMENT: "Liberação de crédito",
  INSTALLMENT_PAYMENT: "Pagamento de parcela",
  CASHBACK: "Cashback",
  TRANSFER: "Transferência",
  DEPOSIT: "Depósito",
  FEE: "Tarifa",
};

export default async function StatementPage() {
  const user = await requireUser();
  const [balance, lines] = await Promise.all([
    walletBalance(user.id),
    walletStatement(user.id, 60),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Extrato</p>
        <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-white uppercase">
          Conta Valor
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatTile label="Saldo atual" value={formatBRL(balance)} accent />
        <StatTile label="Lançamentos" value={String(lines.length)} meta="Últimos 60" />
      </div>

      <Panel title="Adicionar saldo" description="Depósito pelo trilho de pagamento configurado.">
        <DepositForm />
      </Panel>

      <Panel title="Movimentação">
        {lines.length === 0 ? (
          <p className="text-gray-valor text-sm">Nenhuma movimentação ainda.</p>
        ) : (
          <ul className="divide-hairline divide-y">
            {lines.map((line) => (
              <li key={line.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-white">{line.description}</p>
                  <p className="text-gray-valor mt-1 text-[0.6875rem]">
                    {KIND_LABELS[line.kind] ?? line.kind} ·{" "}
                    {line.date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                </div>
                <div className="text-right whitespace-nowrap">
                  <p
                    className={`text-sm font-semibold tabular-nums ${
                      line.direction === "IN" ? "text-lime" : "text-white"
                    }`}
                  >
                    {line.direction === "IN" ? "+" : "−"} {formatBRL(line.amountCents)}
                  </p>
                  <p className="text-gray-valor mt-1 text-[0.6875rem] tabular-nums">
                    saldo {formatBRL(line.balanceCents)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <SandboxNotice>
        Cada linha deste extrato é a soma das partidas de uma transação contábil de dupla entrada.
        O saldo nunca é armazenado — é sempre recalculado a partir dos lançamentos.
      </SandboxNotice>
    </div>
  );
}
