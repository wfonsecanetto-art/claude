# BANCO VALOR DIGITAL

Plataforma financeira digital: site institucional, aplicativo do cliente e
backoffice de análise, com back-end, banco de dados, razão contábil de dupla
entrada e motor de crédito próprio.

> **Sobre o estágio do projeto.** O sistema funciona de ponta a ponta: cadastro,
> verificação, análise de crédito, contrato, liberação, pagamento, cashback e
> score. O que **não** existe é a camada regulada — autorização do Banco Central,
> Pix no SPI, emissão de cartão, bureau de crédito e KYC com fornecedor. Tudo
> isso está atrás de interfaces com adaptador `SANDBOX`, identificado na tela.
> Ver [Limites e o que falta](#limites-e-o-que-falta).

---

## Rodando

Não é preciso instalar banco de dados: o padrão é SQLite em arquivo.

```bash
npm install          # instala, cria o .env com um segredo novo e gera o Prisma Client
npm run setup        # aplica as migrações e popula o ambiente
npm run dev          # http://localhost:3000
```

O `.env` é criado na instalação com um `AUTH_SECRET` aleatório e não é
versionado — assinar sessão de produto financeiro com chave pública no
repositório não é opção.

### Acessos criados pelo seed

Senha para todos: `Valor@2026`

| Usuário | Papel | Estado |
| --- | --- | --- |
| `cliente@exemplo.com` | Cliente | 20 meses de conta, 1 contrato quitado, 1 ativo, score Ouro |
| `pendente@exemplo.com` | Cliente | Cadastro enviado, aguardando análise |
| `analista@valor.com.br` | Analista | Acessa `/backoffice` |

### Outros comandos

```bash
npm run build      npm run start      # produção
npm test                              # 24 testes da matemática de crédito
npm run typecheck  npm run lint
npm run db:studio                     # inspecionar o banco
npm run db:seed                       # restaurar o ambiente ao estado inicial
```

Para PostgreSQL, troque `provider` em `prisma/schema.prisma` e aponte
`DATABASE_URL`. O schema não usa nada específico de SQLite.

---

## O que o sistema faz

**Site institucional** (`/`) — apresenta o produto e leva ao cadastro.

**Aplicativo do cliente** (`/app`)

| Tela | O que faz |
| --- | --- |
| Início | Limite, saldo, saldo devedor, próximo vencimento, score, contratos, cashback |
| Verificação | Dados pessoais, endereço, documentos e referências → análise |
| Crédito | Simulador com parcela, IOF e CET reais; solicitação com decisão imediata |
| Contratos | Condições, cronograma completo, assinatura e pagamento de parcelas |
| Extrato | Movimentação da Conta Valor com saldo corrente |
| Transferir | Envio entre contas da plataforma |
| Score | Pontuação com a decomposição fator a fator |
| Segurança | MFA por TOTP, troca de senha, encerramento de sessões, atividade recente |

**Backoffice** (`/backoffice`, papel `ANALYST` ou `ADMIN`) — fila de cadastros,
fila de propostas que a política automática não resolveu, indicadores da
carteira e trilha de auditoria.

---

## Como funciona por dentro

### Dinheiro: razão de dupla entrada

Nenhum saldo é guardado em coluna. Saldo é sempre a soma das partidas
(`src/server/ledger.ts`), e toda transação é recusada na escrita se débitos não
igualarem créditos. Consequência prática: é impossível um saldo divergir do
histórico, e qualquer número exibido ao cliente pode ser reconstruído.

Liberação de um contrato de R$ 1.000 com R$ 30 de IOF:

```
DÉBITO   Recebíveis      1.030,00
CRÉDITO  Conta do cliente  1.000,00
CRÉDITO  Receitas/tributos    30,00
```

Todo valor é `Int` de centavos. Ponto flutuante não representa 0,1 exatamente, e
somar parcelas em decimal acumula o erro que aparece como divergência de um
centavo no fim do contrato.

### Crédito: Price, IOF e CET

`src/server/credit/schedule.ts` implementa:

- **Tabela Price** — `PMT = PV · i / (1 − (1+i)⁻ⁿ)`, com a última parcela
  liquidando o saldo remanescente para que a soma feche exatamente.
- **IOF de crédito PF** — alíquota adicional sobre a operação mais a alíquota
  diária sobre cada parcela de principal, limitada a 365 dias. O IOF é
  financiado junto com o principal, o que cria dependência circular (o IOF
  depende do cronograma, que depende do valor financiado); três iterações
  convergem na casa do centavo.
- **CET** — taxa interna de retorno do fluxo real do cliente, por bisseção.
  Bisseção em vez de Newton porque não depende de chute inicial e não diverge.

Os testes conferem a parcela contra valor de mercado conhecido (R$ 10.000 em 12x
a 2% a.m. = R$ 945,60), que a soma das parcelas feche com o total, que a
amortização feche com o valor financiado e que a TIR recupere a taxa de um fluxo
conhecido.

### Score Valor: explicável por construção

`src/server/credit/score.ts` é um conjunto de regras determinísticas, 0 a 1.000
pontos. Cada ponto atribuído tem fator nomeado, peso visível e explicação — a
tela `/app/score` mostra a decomposição completa. Decisão de crédito precisa ser
justificável ao cliente e auditável depois; caixa-preta não serve.

O score define o nível (Bronze → Black), que define taxa, teto e cashback. Como
a utilização do limite entra no score e o limite depende do nível, o cálculo é
feito em duas passagens: a primeira ignora a utilização e determina o nível, a
segunda mede a utilização contra o limite desse nível.

### Política de crédito

`src/server/credit/policy.ts` decide, e devolve os critérios um a um:

- limite = menor entre o teto do nível e 30% da renda declarada por 12 meses;
- parcela não pode passar de 30% da renda;
- nenhuma parcela vencida em aberto;
- score ≥ 300 aprova automaticamente, 250–299 vai para análise manual,
  abaixo disso recusa.

As taxas (2,90% a 6,90% a.m. por nível) são **parâmetros de configuração**, não
uma oferta: precisam de homologação da área de crédito e do jurídico.

### Segurança

- Senha com bcrypt custo 12; requisitos mínimos verificados no servidor.
- Sessão em cookie `httpOnly`, `SameSite=Lax`, JWT assinado carregando apenas o
  identificador da sessão — papel e status vêm do banco a cada requisição, então
  bloquear um usuário ou revogar sessão tem efeito imediato.
- MFA por TOTP (RFC 6238), compatível com qualquer autenticador. Sem SMS: SIM
  swap é vetor conhecido de fraude financeira no Brasil.
- Trocar a senha derruba as demais sessões.
- Limitação de taxa em login, cadastro e verificação de MFA.
- Documentos de KYC ficam fora de `/public`, servidos só por rota autenticada
  com `Cache-Control: no-store` e proteção contra escape de diretório.
- Cabeçalhos `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` e
  `Permissions-Policy` em toda resposta.
- Trilha de auditoria em toda decisão de crédito, evento de segurança e
  alteração de cadastro.
- Login não diferencia "e-mail não existe" de "senha errada".

Autorização mora nos guards do servidor (`src/server/auth/guards.ts`), chamados
em cada página e em cada server action. O middleware só evita renderizar rota
privada sem cookie — nunca é ele quem autoriza.

---

## Estrutura

```
prisma/schema.prisma       17 modelos: usuários, KYC, razão, crédito, auditoria
prisma/seed.ts             Ambiente com histórico coerente e razão balanceado

src/server/
  ledger.ts                Dupla entrada, saldos e extrato
  money.ts                 Centavos inteiros e formatação
  credit/schedule.ts       Price, IOF, CET
  credit/score.ts          Score Valor explicável
  credit/policy.ts         Limite e decisão
  credit/rates.ts          Parâmetros da política
  services/                Orquestração: crédito, pagamentos, score, onboarding
  auth/                    Senha, sessão, MFA, guards
  rails/payment.ts         Interface do trilho + adaptador SANDBOX
  audit.ts  ratelimit.ts  validation.ts

src/app/
  page.tsx                 Site institucional
  entrar/  criar-conta/    Autenticação e segundo fator
  app/                     Aplicativo do cliente
  backoffice/              Esteira de análise
  actions/                 Server actions (mutações)
  api/documentos/[id]/     Entrega autenticada de documento privado

src/components/            Seções do site, primitivas do app, objeto 3D

src/app/globals.css        Tokens, reset e animações
src/app/styles.css         Classes de componente do sistema visual
```

Mutações usam **Server Actions**; leituras acontecem em **Server Components**.
O simulador navega por GET e calcula no servidor — uma só implementação da
matemática, e a página funciona sem JavaScript.

---

## Design

Verde-limão `#B7FF00` sobre preto `#050505`, Manrope nos títulos e Inter no
texto. O contraste entre título gigante e microtexto técnico é o que dá a
linguagem editorial.

### Onde mexer no visual

O estilo mora em dois arquivos, com responsabilidades separadas:

| Arquivo | Contém |
| --- | --- |
| `src/app/globals.css` | Tokens (`@theme`), reset, base e animações contínuas |
| `src/app/styles.css` | As classes de componente: botões, formulários, painéis, indicadores, pílulas de estado, tabelas, listas e navegação |

O JSX descreve estrutura e conteúdo; a aparência de qualquer elemento recorrente
se resolve em `styles.css`. Utilitários do Tailwind ficam só para layout pontual
(grid, gap, espaçamento de página). Na prática:

```tsx
<button className="btn btn-primary">Solicitar crédito</button>
<div className="tile">
  <p className="tile-label">Limite disponível</p>
  <p className="tile-value tile-value-accent">R$ 1.068,60</p>
</div>
```

Trocar a cor de todos os botões primários, o raio das superfícies ou o
espaçamento das tabelas é uma alteração em um lugar só — e dá para ler o sistema
inteiro percorrendo um arquivo, em vez de caçar strings de utilitários no meio
do JSX.

Duas decisões que valem registro: o estado ativo da navegação é lido do
`aria-current` pelo próprio CSS (`.app-nav-link[aria-current="page"]`), então
tela e leitor de tela partem da mesma fonte de verdade; e existe um token
`--color-text-muted` um degrau mais claro que o cinza da marca, porque abaixo de
12px `#a5a5a5` sobre preto cansa a leitura.

O objeto 3D do hero (React Three Fiber) é carregado sob demanda e só em tela
grande com ponteiro fino e WebGL disponível; nos demais casos entra uma
composição SVG equivalente. O ambiente do metal é gerado em canvas e passado
pelo `PMREMGenerator` — reflexo real sem HDRI e sem requisição de rede.

Movimento entre 400ms e 1000ms, só `transform`/`opacity`/`filter`, com
`MotionConfig reducedMotion="user"`.

---

## Acessibilidade

Um `h1` por página e hierarquia contínua; seções com `aria-labelledby`; títulos
animados expõem a frase inteira via `aria-label`; gráficos SVG com `role="img"`
e descrição; link "pular para o conteúdo" como primeiro tab stop; foco visível;
formulários com rótulo associado e mensagens em `aria-live`; menu mobile fecha
com `Esc`. Sem overflow horizontal em 390, 834, 1280 e 1728px.

---

## Limites e o que falta

**Bloqueado por licença ou contrato — não é questão de código:**

- Autorização do Banco Central (SCD/SEP) ou operação via parceiro (banco, FIDC,
  securitizadora). O uso da palavra "Banco" no nome também é regulado.
- Pix no SPI, boleto registrado, emissão de cartão em bandeira.
- Bureau de crédito, KYC com validação documental e biometria.
- Assinatura eletrônica com fé pública (ICP-Brasil ou equivalente aceito).
- Reporte ao SCR e demais obrigações regulatórias.

Cada um desses tem ponto de encaixe pronto: `PaymentRail` para o trilho, o
`ScoreInput` para dados de bureau, o hash de assinatura para o provedor
certificado.

**Pendente de engenharia:**

- Régua de cobrança, negativação e tratamento de inadimplência além da marcação
  de atraso.
- Pagamento parcial e antecipação com desconto proporcional.
- Notificações (e-mail, push) — hoje o cliente descobre pelo app.
- Rate limiting em Redis: o atual é por processo e reinicia a cada deploy.
- Testes de integração dos serviços (a matemática está coberta; os fluxos foram
  verificados de ponta a ponta com navegador).
- Textos de Privacidade e Termos — nenhum texto jurídico foi inventado.
