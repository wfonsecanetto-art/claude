import { notFound } from "next/navigation";
import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { walletBalance } from "@/server/ledger";
import { formatBRL, formatBps } from "@/server/money";
import { refreshOverdue } from "@/server/services/payments";
import { Panel, SandboxNotice, StatTile, StatusPill } from "@/components/app/ui";
import { PayInstallmentForm, SignContractForm } from "./forms";

export default async function ContractPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ assinado?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { assinado } = await searchParams;

  await refreshOverdue(user.id);

  const [contract, balance] = await Promise.all([
    db.contract.findUnique({
      where: { id },
      include: { installments: { orderBy: { number: "asc" } }, cashback: true },
    }),
    walletBalance(user.id),
  ]);

  if (!contract || contract.userId !== user.id) notFound();

  const nextOpen = contract.installments.find((item) => item.status !== "PAID");
  const outstanding = contract.installments
    .filter((item) => item.status !== "PAID")
    .reduce((sum, item) => sum + item.totalCents - item.paidCents, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Contrato</p>
          <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-white uppercase">
            {contract.number}
          </h1>
        </div>
        <StatusPill status={contract.status} />
      </div>

      {assinado ? (
        <p className="alert alert-success">
          Contrato assinado e valor creditado na sua Conta Valor.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Valor liberado" value={formatBRL(contract.principalCents)} accent />
        <StatTile label="Saldo devedor" value={formatBRL(outstanding)} />
        <StatTile
          label="Taxa de juros"
          value={`${formatBps(contract.monthlyRateBps)} a.m.`}
          meta={`CET ${formatBps(contract.cetYearlyBps)} a.a.`}
        />
        <StatTile label="IOF" value={formatBRL(contract.iofCents)} meta="Financiado" />
      </div>

      {contract.status === "AWAITING_SIGNATURE" ? (
        <Panel
          title="Condições do contrato"
          description="Leia antes de assinar. O valor é creditado na Conta Valor imediatamente após a assinatura."
        >
          <dl className="grid gap-4 sm:grid-cols-2">
            {[
              ["Valor solicitado", formatBRL(contract.principalCents)],
              ["IOF financiado", formatBRL(contract.iofCents)],
              ["Prazo", `${contract.termMonths} meses`],
              ["Taxa de juros", `${formatBps(contract.monthlyRateBps)} ao mês`],
              ["Custo Efetivo Total", `${formatBps(contract.cetYearlyBps)} ao ano`],
              ["Total a pagar", formatBRL(contract.totalPayableCents)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="tile-label">{label}</dt>
                <dd className="num mt-1.5 text-sm text-white">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6">
            <SignContractForm contractId={contract.id} />
          </div>

          <p className="text-micro mt-4">
            O aceite registra data, hora, IP e um hash das condições. Assinatura eletrônica com fé
            pública exige provedor certificado — ponto de integração previsto na arquitetura.
          </p>
        </Panel>
      ) : null}

      {contract.installments.length > 0 ? (
        <Panel
          title="Parcelas"
          description={`Saldo em conta: ${formatBRL(balance)}. As parcelas são quitadas em ordem.`}
        >
          <div className="table-scroll">
            <table className="table-valor" style={{ minWidth: "560px" }}>
              <thead>
                <tr>
                  <th scope="col" >Nº</th>
                  <th scope="col" >Vencimento</th>
                  <th scope="col" className="cell-right">Amortização</th>
                  <th scope="col" className="cell-right">Juros</th>
                  <th scope="col" className="cell-right">Total</th>
                  <th scope="col" className="cell-right">Situação</th>
                </tr>
              </thead>
              <tbody>
                {contract.installments.map((installment) => (
                  <tr key={installment.id} >
                    <td className="cell-strong">{installment.number}</td>
                    <td >
                      {installment.dueDate.toLocaleDateString("pt-BR")}
                    </td>
                    <td className="cell-right">
                      {formatBRL(installment.principalCents)}
                    </td>
                    <td className="cell-right">
                      {formatBRL(installment.interestCents)}
                    </td>
                    <td className="cell-right cell-strong">
                      {formatBRL(installment.totalCents)}
                    </td>
                    <td className="cell-right">
                      <StatusPill status={installment.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {nextOpen ? (
            <div className="inset-box mt-6">
              <p className="text-sm text-white">
                Próxima parcela: {nextOpen.number} · {formatBRL(nextOpen.totalCents)} · vence em{" "}
                {nextOpen.dueDate.toLocaleDateString("pt-BR")}
              </p>
              <div className="mt-4">
                <PayInstallmentForm
                  installmentId={nextOpen.id}
                  amountCents={nextOpen.totalCents}
                  balanceCents={balance}
                />
              </div>
            </div>
          ) : null}
        </Panel>
      ) : null}

      {contract.cashback ? (
        <Panel title="Cashback">
          <p className="font-display num text-lime text-2xl font-extrabold">
            {formatBRL(contract.cashback.amountCents)}
          </p>
          <p className="text-muted mt-2 text-xs">
            Creditado na Conta Valor em{" "}
            {contract.cashback.grantedAt.toLocaleDateString("pt-BR")} pela quitação integral.
          </p>
        </Panel>
      ) : null}

      <SandboxNotice>
        Pagamentos por Pix e boleto usam o trilho SANDBOX: a cobrança é liquidada na hora dentro da
        plataforma, sem movimentação externa.
      </SandboxNotice>
    </div>
  );
}
