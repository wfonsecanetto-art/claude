"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { ArrowRight, Info, TriangleAlert } from "lucide-react";
import { applyForCreditAction, simulateAction, type Simulacao } from "@/app/actions/credit";
import type { ActionState } from "@/app/actions/auth";
import { Alert, Field, SubmitButton } from "@/components/app/ui";

const brl = (centavos: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(centavos / 100);

/** Valor compacto para tetos: arredonda para baixo, nunca prometendo a mais. */
const brlTeto = (centavos: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(Math.floor(centavos / 100));

const percentual = (bps: number, casas = 2) =>
  `${(bps / 100).toFixed(casas).replace(".", ",")}%`;

/**
 * Simulador ao vivo.
 *
 * O cálculo continua no servidor — arrastar o slider dispara uma simulação
 * com atraso curto em vez de recarregar a página. Duplicar a matemática no
 * navegador daria resposta instantânea, mas abriria espaço para o simulador
 * prometer uma parcela diferente da que o contrato cobra.
 */
export function Simulator({
  inicial,
  minimoCents,
  podeContratar,
}: {
  inicial: Simulacao;
  minimoCents: number;
  podeContratar: boolean;
}) {
  const [valor, setValor] = useState(inicial.solicitadoCents);
  const [prazo, setPrazo] = useState(inicial.prazo);
  const [dados, setDados] = useState(inicial);
  const [recalculando, iniciarRecalculo] = useTransition();
  const primeiraRenderizacao = useRef(true);

  const teto = Math.max(inicial.limiteDisponivelCents, minimoCents);

  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }

    // Espera o arrasto parar antes de consultar: sem isso, cada pixel do
    // slider viraria uma requisição.
    const temporizador = setTimeout(() => {
      iniciarRecalculo(async () => {
        setDados(await simulateAction({ amountCents: valor, termMonths: prazo }));
      });
    }, 220);

    return () => clearTimeout(temporizador);
  }, [valor, prazo]);

  const totalPrincipal = dados.solicitadoCents;
  const somaBarra = dados.totalCents;
  const fatia = (parte: number) => `${Math.max((parte / somaBarra) * 100, 0)}%`;

  const acimaDoLimite = dados.comprometimento > dados.comprometimentoMaximo;
  const larguraMedidor = Math.min(dados.comprometimento / 0.5, 1) * 100;
  const posicaoTeto = (dados.comprometimentoMaximo / 0.5) * 100;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* ---------------------------------------------------------- controles */}
      <div className="space-y-6">
        <div>
          <div className="flex items-baseline justify-between gap-4">
            <label htmlFor="sim-valor" className="field-label mb-0">
              Quanto você precisa
            </label>
            <span className="text-micro num">
              até {brlTeto(teto)}
            </span>
          </div>

          <input
            id="sim-valor"
            type="number"
            min={minimoCents / 100}
            max={teto / 100}
            step={50}
            value={(valor / 100).toFixed(2)}
            onChange={(evento) => {
              const numero = Number(evento.target.value);
              if (Number.isFinite(numero)) setValor(Math.round(numero * 100));
            }}
            className="field-input mt-3 text-lg"
          />

          <input
            type="range"
            min={minimoCents}
            max={teto}
            step={5000}
            value={valor}
            onChange={(evento) => setValor(Number(evento.target.value))}
            aria-label="Ajustar valor do crédito"
            className="field-range mt-4"
          />

          <div className="text-micro num mt-2 flex justify-between">
            <span>{brlTeto(minimoCents)}</span>
            <span>{brlTeto(teto)}</span>
          </div>
        </div>

        <div>
          <p className="field-label">Em quantas vezes</p>
          <div className="term-row" role="group" aria-label="Escolha o prazo">
            {dados.porPrazo.map((opcao) => (
              <button
                key={opcao.prazo}
                type="button"
                className="term-chip"
                aria-pressed={opcao.prazo === prazo}
                onClick={() => setPrazo(opcao.prazo)}
              >
                <span className="term-chip-term">{opcao.prazo}x</span>
                <span className="term-chip-value">{brl(opcao.parcelaCents)}</span>
              </button>
            ))}
          </div>
          <p className="text-micro mt-3">
            Prazo maior alivia a parcela e encarece o total: em {dados.porPrazo.at(-1)?.prazo}x o
            custo final é {brl((dados.porPrazo.at(-1)?.totalCents ?? 0) - (dados.porPrazo[0]?.totalCents ?? 0))}{" "}
            maior que em {dados.porPrazo[0]?.prazo}x.
          </p>
        </div>

        {/* Comprometimento de renda: o critério que mais reprova proposta. */}
        {dados.rendaCents > 0 ? (
          <div className="inset-box">
            <div className="flex items-baseline justify-between gap-3">
              <p className="tile-label">Comprometimento da renda</p>
              <p className={`num text-sm font-semibold ${acimaDoLimite ? "text-red-300" : "text-lime"}`}>
                {Math.round(dados.comprometimento * 100)}%
              </p>
            </div>

            <div className="meter mt-3">
              <div
                className={`meter-fill ${acimaDoLimite ? "meter-fill--over" : ""}`}
                style={{ width: `${larguraMedidor}%` }}
              />
              <span className="meter-limit" style={{ left: `${posicaoTeto}%` }} aria-hidden="true" />
            </div>

            <p className="text-micro mt-2">
              A parcela de {brl(dados.parcelaCents)} sobre a renda declarada de{" "}
              {brl(dados.rendaCents)}. O traço marca o teto de{" "}
              {Math.round(dados.comprometimentoMaximo * 100)}% da política.
            </p>
          </div>
        ) : null}
      </div>

      {/* ------------------------------------------------------------ resultado */}
      <div className="glass-card">
        <p className="tile-label">Parcela mensal</p>
        <p className={`sim-value ${recalculando ? "sim-pending" : ""}`}>{brl(dados.parcelaCents)}</p>
        <p className="sim-value-sub">
          {dados.prazo}x · primeira em {dados.primeiroVencimento}
        </p>

        <div className="border-hairline mt-5 grid grid-cols-2 gap-4 border-t pt-5">
          <div>
            <p className="tile-label">Você recebe</p>
            <p className="num mt-1.5 text-sm font-semibold text-white">{brl(dados.solicitadoCents)}</p>
          </div>
          <div>
            <p className="tile-label">Total a pagar</p>
            <p className="num mt-1.5 text-sm font-semibold text-white">{brl(dados.totalCents)}</p>
          </div>
          <div>
            <p className="tile-label">Juros</p>
            <p className="num mt-1.5 text-sm text-white">
              {brl(dados.jurosCents)}{" "}
              <span className="text-muted">({percentual(dados.taxaMensalBps)} a.m.)</span>
            </p>
          </div>
          <div>
            <p className="tile-label">IOF</p>
            <p className="num mt-1.5 text-sm text-white">{brl(dados.iofCents)}</p>
          </div>
        </div>

        {/* Onde cada real do total vai parar. */}
        <div className="mt-5">
          <div className="flex items-baseline justify-between">
            <p className="tile-label">Composição do total</p>
            <p className="num text-micro">CET {percentual(dados.cetAnualBps)} a.a.</p>
          </div>
          <div className="composition mt-3">
            <span className="composition-principal" style={{ width: fatia(totalPrincipal) }} />
            <span className="composition-juros" style={{ width: fatia(dados.jurosCents) }} />
            <span className="composition-iof" style={{ width: fatia(dados.iofCents) }} />
          </div>
          <div className="legend mt-3">
            <span className="legend-item">
              <span className="legend-dot composition-principal" />
              Principal {brl(totalPrincipal)}
            </span>
            <span className="legend-item">
              <span className="legend-dot composition-juros" />
              Juros {brl(dados.jurosCents)}
            </span>
            <span className="legend-item">
              <span className="legend-dot composition-iof" />
              IOF {brl(dados.iofCents)}
            </span>
          </div>
        </div>

        {dados.avisos.length > 0 ? (
          <div className="mt-5 space-y-2">
            {dados.avisos.map((aviso) => (
              <p key={aviso} className="alert alert-warning flex items-start gap-2 text-xs">
                <TriangleAlert size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                {aviso}
              </p>
            ))}
          </div>
        ) : null}

        {podeContratar ? (
          <div className="border-hairline mt-5 border-t pt-5">
            <ApplyForm
              amount={(dados.solicitadoCents / 100).toFixed(2)}
              amountCents={dados.solicitadoCents}
              term={dados.prazo}
              bloqueado={acimaDoLimite}
            />
          </div>
        ) : null}

        <details className="border-hairline mt-5 border-t pt-4">
          <summary className="cursor-pointer text-xs font-semibold text-white">
            Ver as {dados.prazo} parcelas
          </summary>
          <div className="table-scroll mt-4">
            <table className="table-valor" style={{ minWidth: "380px" }}>
              <thead>
                <tr>
                  <th>Nº</th>
                  <th>Vencimento</th>
                  <th className="cell-right">Amortização</th>
                  <th className="cell-right">Juros</th>
                  <th className="cell-right">Parcela</th>
                </tr>
              </thead>
              <tbody>
                {dados.parcelas.map((parcela) => (
                  <tr key={parcela.numero}>
                    <td className="cell-strong">{parcela.numero}</td>
                    <td>{parcela.vencimento}</td>
                    <td className="cell-right">{brl(parcela.amortizacaoCents)}</td>
                    <td className="cell-right">{brl(parcela.jurosCents)}</td>
                    <td className="cell-right cell-strong">{brl(parcela.totalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </div>
  );
}

function ApplyForm({
  amount,
  amountCents,
  term,
  bloqueado,
}: {
  amount: string;
  amountCents: number;
  term: number;
  bloqueado: boolean;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(applyForCreditAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <Alert state={state} />
      <input type="hidden" name="amount" value={amount} />
      <input type="hidden" name="termMonths" value={term} />
      <Field
        label="Finalidade do crédito"
        name="purpose"
        placeholder="Capital de giro, reforma, emergência…"
        required
      />
      {bloqueado ? (
        <p className="text-micro flex items-start gap-2">
          <Info size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
          Você pode solicitar assim mesmo, mas com este comprometimento de renda a política
          recusa automaticamente.
        </p>
      ) : null}
      <SubmitButton block pendingLabel="Analisando…">
        Solicitar {brl(amountCents)}
        <ArrowRight size={16} aria-hidden="true" />
      </SubmitButton>
    </form>
  );
}
