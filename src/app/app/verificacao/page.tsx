import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { DOCUMENT_TYPES, onboardingState, type DocumentType } from "@/server/services/onboarding";
import { formatBRL } from "@/server/money";
import { Panel, StatusPill } from "@/components/app/ui";
import { KycForm, DocumentUpload, ReferenceForm, SubmitKycForm } from "./forms";

export default async function VerificationPage() {
  const user = await requireUser();
  const [state, kyc, documents, references] = await Promise.all([
    onboardingState(user.id),
    db.kycProfile.findUnique({ where: { userId: user.id } }),
    db.document.findMany({ where: { userId: user.id } }),
    db.personalReference.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
  ]);

  const locked = state.kycStatus === "SUBMITTED" || state.kycStatus === "APPROVED";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Verificação de identidade</p>
          <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-white uppercase">
            Seu cadastro
          </h1>
        </div>
        <StatusPill status={state.kycStatus} />
      </div>

      {kyc?.status === "REJECTED" && kyc.rejectionReason ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Cadastro recusado: {kyc.rejectionReason} Corrija os dados e envie novamente.
        </p>
      ) : null}

      {state.kycStatus === "APPROVED" ? (
        <p className="border-lime/30 bg-lime/10 text-lime rounded-xl border px-4 py-3 text-sm">
          Cadastro aprovado. Seu limite já está disponível na página de crédito.
        </p>
      ) : null}

      <Panel
        title="Dados pessoais e endereço"
        description="Precisamos destes dados para confirmar sua identidade e calcular seu limite."
      >
        {locked ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            {[
              ["Nome da mãe", kyc?.motherName],
              ["Ocupação", kyc?.occupation],
              ["Renda mensal", kyc ? formatBRL(kyc.monthlyIncomeCents) : null],
              [
                "Endereço",
                kyc ? `${kyc.street}, ${kyc.number} — ${kyc.district}, ${kyc.city}/${kyc.state}` : null,
              ],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <dt className="eyebrow text-[0.5625rem]">{label}</dt>
                <dd className="mt-1.5 text-sm text-white">{value ?? "—"}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <KycForm
            defaults={{
              birthDate: kyc?.birthDate.toISOString().slice(0, 10) ?? "",
              motherName: kyc?.motherName ?? "",
              occupation: kyc?.occupation ?? "",
              monthlyIncome: kyc ? (kyc.monthlyIncomeCents / 100).toFixed(2).replace(".", ",") : "",
              zipCode: kyc?.zipCode ?? "",
              street: kyc?.street ?? "",
              number: kyc?.number ?? "",
              complement: kyc?.complement ?? "",
              district: kyc?.district ?? "",
              city: kyc?.city ?? "",
              state: kyc?.state ?? "",
            }}
          />
        )}
      </Panel>

      <Panel
        title="Documentos"
        description="Arquivos ficam em armazenamento privado, acessíveis apenas a você e à análise."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {(Object.keys(DOCUMENT_TYPES) as DocumentType[]).map((type) => {
            const document = documents.find((item) => item.type === type);
            return (
              <DocumentUpload
                key={type}
                type={type}
                label={DOCUMENT_TYPES[type]}
                current={document ? { fileName: document.fileName, status: document.status } : null}
                locked={locked}
                optional={type === "PROOF_OF_INCOME"}
              />
            );
          })}
        </div>
      </Panel>

      <Panel
        title="Referências pessoais"
        description="Duas pessoas que possam confirmar suas informações. Não fazemos consulta sem seu conhecimento."
      >
        <ReferenceForm references={references} locked={locked} />
      </Panel>

      {!locked ? (
        <Panel title="Enviar para análise">
          {state.missing.length > 0 ? (
            <div>
              <p className="text-gray-valor text-sm">Ainda falta:</p>
              <ul className="mt-3 space-y-1.5">
                {state.missing.map((item) => (
                  <li key={item} className="text-gray-valor flex items-center gap-2 text-xs">
                    <span className="h-1 w-1 rounded-full bg-amber-400" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <SubmitKycForm />
          )}
        </Panel>
      ) : null}
    </div>
  );
}
