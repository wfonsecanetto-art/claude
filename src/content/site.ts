/**
 * Conteúdo institucional do projeto piloto.
 *
 * Nada aqui descreve operação bancária em produção: o site apresenta o produto
 * previsto, e todo dado numérico de interface vive em `src/lib/mock` — marcado
 * como demonstração.
 */

export const BRAND = {
  name: "VALOR",
  legalName: "Banco Valor Digital",
  tagline: "Plataforma financeira digital",
} as const;

export type NavItem = { label: string; href: string };

export const NAV: NavItem[] = [
  { label: "Início", href: "#inicio" },
  { label: "Soluções", href: "#solucoes" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Tecnologia", href: "#tecnologia" },
  { label: "Sobre", href: "#sobre" },
  { label: "Contato", href: "#contato" },
];

export const HERO = {
  eyebrow: "Banco Valor Digital",
  meta: ["Digital finance", "Brazil"],
  titleTop: "CRÉDITO QUE",
  titleBottom: "GERA VALOR.",
  subtitle:
    "Uma experiência financeira digital simples, inteligente e construída para acompanhar sua evolução.",
  primaryCta: "Solicitar crédito",
  secondaryCta: "Conhecer a Valor",
  badges: [
    { label: "Plataforma financeira digital", meta: "Microcrédito · Tecnologia" },
  ],
} as const;

export const ABOUT_INTRO = {
  eyebrow: "O que é a Valor",
  titleTop: "MAIS DO QUE CRÉDITO.",
  titleBottom: "UMA EXPERIÊNCIA FINANCEIRA.",
  body: "A Banco Valor Digital nasce com uma proposta simples: transformar tecnologia em uma experiência financeira mais acessível, transparente e inteligente.",
  pillars: [
    {
      title: "Transparência",
      description:
        "Condições, prazos e custos apresentados antes da contratação — sem letra miúda.",
    },
    {
      title: "Inteligência",
      description:
        "Análise automatizada que aprende com o histórico e responde em minutos, não em dias.",
    },
    {
      title: "Evolução",
      description:
        "Cada operação quitada melhora o Score Valor e destrava condições melhores.",
    },
  ],
} as const;

export const MICROCREDIT = {
  eyebrow: "Microcrédito",
  titleTop: "MICROCRÉDITO",
  titleBottom: "DO SEU JEITO.",
  intro:
    "Do cadastro à liberação, o fluxo previsto para a plataforma é linear, auditável e acompanhado em tempo real pelo cliente.",
  steps: [
    {
      id: "01",
      title: "Cadastro",
      description: "Dados pessoais, contato e criação de conta com verificação em duas etapas.",
      details: ["Conta e credenciais", "Verificação de contato", "Aceite de termos"],
    },
    {
      id: "02",
      title: "Análise",
      description:
        "KYC, documentos e referências entram na esteira de verificação antes de qualquer proposta.",
      details: ["KYC e documentos", "Referências", "Checagem antifraude"],
    },
    {
      id: "03",
      title: "Score",
      description:
        "O Score Valor consolida cadastro, histórico e comportamento de pagamento em uma nota única.",
      details: ["0 a 1.000 pontos", "Níveis de relacionamento", "Recalculado por evento"],
    },
    {
      id: "04",
      title: "Aprovação",
      description:
        "Limite e condições são definidos por política de crédito, com decisão registrada e rastreável.",
      details: ["Limite sugerido", "Política de crédito", "Decisão auditável"],
    },
    {
      id: "05",
      title: "Liberação",
      description:
        "Contrato assinado digitalmente e recursos liberados na conta indicada pelo cliente.",
      details: ["Contrato digital", "Assinatura eletrônica", "Liberação registrada"],
    },
    {
      id: "06",
      title: "Pagamento",
      description:
        "Parcelas acompanhadas no app, com lembretes, comprovantes e histórico completo.",
      details: ["Agenda de parcelas", "Comprovantes", "Quitação e cashback"],
    },
  ],
} as const;

export const DASHBOARD = {
  eyebrow: "Aplicativo",
  titleTop: "SEU DINHEIRO.",
  titleBottom: "SUA VISÃO.",
  body: "Um painel único para entender a própria posição financeira: limite, uso, parcelas, contratos e as ofertas liberadas pelo seu nível de relacionamento.",
  highlights: [
    "Score Valor e nível de relacionamento",
    "Limite total, utilizado e disponível",
    "Parcela do dia e próximo vencimento",
    "Cashback acumulado e histórico de contratos",
  ],
} as const;

export const SCORE = {
  eyebrow: "Score Valor",
  titleTop: "SEU SCORE.",
  titleBottom: "SUA EVOLUÇÃO.",
  body: "O Score Valor vai de 0 a 1.000 pontos e evolui conforme o histórico financeiro do cliente na plataforma. Cada nível corresponde a um conjunto de condições e benefícios previstos na política de crédito.",
  levels: [
    { name: "Bronze", range: "0 – 299" },
    { name: "Prata", range: "300 – 549" },
    { name: "Ouro", range: "550 – 749" },
    { name: "Diamante", range: "750 – 899" },
    { name: "Black", range: "900 – 1.000" },
  ],
} as const;

export const TECH = {
  eyebrow: "Tecnologia",
  titleTop: "TECNOLOGIA",
  titleBottom: "POR TRÁS DO VALOR.",
  body: "A arquitetura prevista para a plataforma é modular, orientada a eventos e preparada para crescer de um produto de microcrédito para uma operação financeira completa.",
  cards: [
    {
      icon: "shield-check",
      title: "KYC",
      description:
        "Identificação, validação documental e checagem de consistência antes da concessão.",
    },
    {
      icon: "lock",
      title: "Segurança",
      description: "OAuth/JWT com MFA, sessões controladas e armazenamento privado criptografado.",
    },
    {
      icon: "scan-face",
      title: "Antifraude",
      description: "Sinais de dispositivo, comportamento e reincidência avaliados na esteira.",
    },
    {
      icon: "brain-circuit",
      title: "Inteligência",
      description: "Modelos de score e priorização de esteira apoiando decisões de crédito.",
    },
    {
      icon: "database",
      title: "Dados",
      description: "PostgreSQL como fonte de verdade e Redis para cache e filas de trabalho.",
    },
    {
      icon: "workflow",
      title: "Automação",
      description: "Eventos e webhooks conectando cadastro, análise, contrato e cobrança.",
    },
    {
      icon: "file-search",
      title: "Auditoria",
      description: "Trilha de eventos imutável para cada decisão tomada sobre uma proposta.",
    },
  ],
  stack: [
    { layer: "Front-end web", value: "React / Next.js" },
    { layer: "Back-end", value: "Node.js / NestJS" },
    { layer: "Banco de dados", value: "PostgreSQL" },
    { layer: "Cache e filas", value: "Redis" },
    { layer: "Integrações", value: "REST · eventos · webhooks" },
    { layer: "Identidade", value: "OAuth / JWT + MFA" },
  ],
} as const;

export const SECURITY = {
  eyebrow: "Segurança",
  titleTop: "SEU VALOR",
  titleBottom: "PROTEGIDO.",
  body: "Controles de segurança previstos na arquitetura do projeto, aplicados do transporte ao armazenamento.",
  controls: [
    { name: "HTTPS", description: "Transporte cifrado ponta a ponta." },
    { name: "MFA", description: "Segundo fator no acesso e em operações sensíveis." },
    { name: "Criptografia", description: "Dados sensíveis cifrados em repouso." },
    { name: "RBAC", description: "Permissões por papel, com menor privilégio." },
    { name: "Rate limiting", description: "Contenção de abuso e força bruta." },
    { name: "Backups", description: "Rotina de cópias com restauração testada." },
    { name: "Logs", description: "Registro estruturado de acessos e eventos." },
    { name: "Auditoria", description: "Rastreabilidade de decisões e alterações." },
    { name: "Armazenamento privado", description: "Documentos fora de acesso público." },
  ],
} as const;

export const CYCLE = {
  eyebrow: "Ciclo Valor",
  titleTop: "UM CICLO",
  titleBottom: "QUE SE REPETE.",
  body: "O relacionamento previsto não termina na liberação do crédito: ele recomeça, e cada volta tende a ser melhor que a anterior.",
  steps: [
    { label: "Cadastro", description: "Identificação e verificação do cliente." },
    { label: "Crédito", description: "Análise, aprovação e liberação." },
    { label: "Pagamento", description: "Parcelas acompanhadas no aplicativo." },
    { label: "Quitação", description: "Contrato encerrado integralmente." },
    { label: "Cashback", description: "Benefício conforme as regras do produto." },
    { label: "Novo limite", description: "Score recalculado, limite revisto." },
    { label: "Nova operação", description: "Condições melhores no próximo ciclo." },
  ],
} as const;

export const CASHBACK = {
  eyebrow: "Cashback",
  titleTop: "VOCÊ EVOLUI.",
  titleBottom: "SEU VALOR TAMBÉM.",
  body: "O cashback previsto no produto é condicionado à quitação integral do contrato e às demais regras aplicáveis. Não é bônus automático nem garantia de crédito futuro.",
  cards: [
    {
      title: "Cashback",
      description: "Creditado após a quitação integral do contrato, conforme as regras do produto.",
    },
    {
      title: "Próxima operação",
      description: "Saldo utilizável como abatimento em uma nova contratação elegível.",
    },
    {
      title: "Benefícios",
      description: "Condições associadas ao nível de relacionamento alcançado no Score Valor.",
    },
  ],
  conditions: [
    "Depende da quitação integral do contrato.",
    "Sujeito às regras e prazos do produto contratado.",
    "Não constitui promessa de aprovação de novo crédito.",
  ],
} as const;

export const NUMBERS = {
  eyebrow: "Números da Valor",
  titleTop: "O QUE ESTÁ",
  titleBottom: "DESENHADO.",
  note: "Parâmetros de produto definidos no projeto — não são métricas comerciais.",
  items: [
    { value: 1, display: "01", label: "Produto inicial", meta: "Microcrédito" },
    { value: 5, display: "05", label: "Níveis de evolução", meta: "Bronze a Black" },
    { value: 1000, display: "01.000", label: "Pontos de score", meta: "Escala do Score Valor" },
    { value: null, display: "∞", label: "Possibilidades", meta: "Arquitetura modular" },
  ],
} as const;

export const ABOUT = {
  eyebrow: "Sobre",
  titleTop: "CONSTRUINDO",
  titleBottom: "O PRÓXIMO VALOR.",
  body: "A Valor está sendo construída como uma plataforma financeira digital de ponta a ponta: produto, tecnologia e experiência desenhados juntos, desde o primeiro cadastro até o ciclo completo de relacionamento.",
  blocks: [
    {
      title: "Propósito",
      description:
        "Ampliar o acesso ao crédito com clareza de condições e previsibilidade para quem contrata.",
    },
    {
      title: "Tecnologia",
      description:
        "Arquitetura modular, orientada a eventos e preparada para integrações futuras.",
    },
    {
      title: "Experiência",
      description:
        "Interfaces diretas, sem jargão, que explicam cada decisão tomada sobre a proposta.",
    },
    {
      title: "Visão",
      description:
        "Evoluir do microcrédito para uma plataforma financeira digital completa.",
    },
  ],
} as const;

export const FINAL_CTA = {
  titleTop: "VAMOS",
  titleBottom: "CRIAR VALOR.",
  body: "Este é o projeto piloto da plataforma. A partir daqui, o próximo passo é construir a operação completa.",
  cta: "Começar agora",
  secondary: "Falar com a Valor",
} as const;

export const FOOTER = {
  links: [
    { label: "Soluções", href: "#solucoes" },
    { label: "Microcrédito", href: "#como-funciona" },
    { label: "Segurança", href: "#seguranca" },
    { label: "Privacidade", href: "#privacidade" },
    { label: "Termos", href: "#termos" },
    { label: "Contato", href: "#contato" },
  ],
  copyright: "© Banco Valor Digital",
} as const;

export const DEMO_NOTICE =
  "Projeto piloto. Os valores exibidos nas interfaces são demonstrativos e não representam contas, contratos ou operações reais.";
