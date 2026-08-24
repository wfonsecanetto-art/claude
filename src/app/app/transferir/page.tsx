import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { walletBalance } from "@/server/ledger";
import { formatBRL } from "@/server/money";
import { Panel, SandboxNotice, StatTile } from "@/components/app/ui";
import { TransferForm } from "./forms";

export default async function TransferPage() {
  const user = await requireUser();
  const [balance, transfers] = await Promise.all([
    walletBalance(user.id),
    db.transfer.findMany({
      where: { OR: [{ fromUserId: user.id }, { toUserId: user.id }] },
      include: { fromUser: true, toUser: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Transferir</p>
        <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-white uppercase">
          Enviar dinheiro
        </h1>
      </div>

      <StatTile label="Saldo disponível" value={formatBRL(balance)} accent />

      <Panel title="Nova transferência" description="Informe o e-mail ou o CPF de quem vai receber.">
        <TransferForm />
      </Panel>

      <Panel title="Últimas transferências">
        {transfers.length === 0 ? (
          <p className="text-gray-valor text-sm">Nenhuma transferência ainda.</p>
        ) : (
          <ul className="divide-hairline divide-y">
            {transfers.map((transfer) => {
              const sent = transfer.fromUserId === user.id;
              const counterpart = sent ? transfer.toUser.name : transfer.fromUser.name;
              return (
                <li key={transfer.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm text-white">
                      {sent ? "Para" : "De"} {counterpart}
                    </p>
                    <p className="text-gray-valor mt-1 text-[0.6875rem]">
                      {transfer.createdAt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                      {transfer.description ? ` · ${transfer.description}` : ""}
                    </p>
                  </div>
                  <p className={`text-sm font-semibold tabular-nums ${sent ? "text-white" : "text-lime"}`}>
                    {sent ? "−" : "+"} {formatBRL(transfer.amountCents)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <SandboxNotice>
        Transferências acontecem entre contas da própria plataforma. Enviar para fora exige
        participação no arranjo de pagamentos — hoje não há integração com o Pix do Banco Central.
      </SandboxNotice>
    </div>
  );
}
