import Link from "next/link";
import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { formatBRL } from "@/server/money";
import { refreshOverdue } from "@/server/services/payments";
import { Panel, StatusPill } from "@/components/app/ui";

export default async function ContractsPage() {
  const user = await requireUser();
  await refreshOverdue(user.id);

  const [contracts, applications] = await Promise.all([
    db.contract.findMany({
      where: { userId: user.id },
      include: { installments: true },
      orderBy: { createdAt: "desc" },
    }),
    db.creditApplication.findMany({
      where: { userId: user.id, status: { in: ["UNDER_REVIEW", "REJECTED", "CANCELLED"] } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Contratos</p>
        <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-white uppercase">
          Suas operações
        </h1>
      </div>

      {contracts.length === 0 ? (
        <Panel>
          <p className="text-gray-valor text-sm">
            Você ainda não tem contratos.{" "}
            <Link href="/app/credito" className="text-lime hover:underline">
              Simular crédito
            </Link>
            .
          </p>
        </Panel>
      ) : (
        <div className="space-y-4">
          {contracts.map((contract) => {
            const paid = contract.installments.filter((item) => item.status === "PAID").length;
            const outstanding = contract.installments
              .filter((item) => item.status !== "PAID")
              .reduce((sum, item) => sum + item.totalCents - item.paidCents, 0);

            return (
              <Link
                key={contract.id}
                href={`/app/contratos/${contract.id}`}
                className="surface-card hover:border-lime/30 block rounded-2xl p-5 transition-colors duration-300"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-sm font-extrabold tracking-[0.12em] text-white uppercase">
                      {contract.number}
                    </p>
                    <p className="text-gray-valor mt-1.5 text-xs tabular-nums">
                      {formatBRL(contract.principalCents)} em {contract.termMonths}x ·{" "}
                      {contract.installments.length > 0
                        ? `${paid}/${contract.installments.length} parcelas pagas`
                        : "aguardando liberação"}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusPill status={contract.status} />
                    {outstanding > 0 ? (
                      <p className="text-gray-valor mt-2 text-xs tabular-nums">
                        Saldo devedor {formatBRL(outstanding)}
                      </p>
                    ) : null}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {applications.length > 0 ? (
        <Panel title="Propostas sem contrato">
          <ul className="space-y-3">
            {applications.map((application) => (
              <li
                key={application.id}
                className="border-hairline flex items-center justify-between gap-3 border-b pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <Link
                    href={`/app/propostas/${application.id}`}
                    className="text-sm text-white hover:text-lime"
                  >
                    {formatBRL(application.amountCents)} em {application.termMonths}x
                  </Link>
                  <p className="text-gray-valor mt-1 text-[0.6875rem]">
                    {application.createdAt.toLocaleDateString("pt-BR")} · {application.purpose}
                  </p>
                </div>
                <StatusPill status={application.status} />
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}
