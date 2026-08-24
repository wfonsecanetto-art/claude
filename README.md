# BANCO VALOR DIGITAL — projeto piloto

Website institucional e vitrine da plataforma digital da **Valor**, construído
como projeto piloto: uma página única, em português, que apresenta o produto de
microcrédito, o Score Valor, o ciclo de relacionamento e a arquitetura prevista.

> **Isto é uma demonstração.** Não há back-end, integração bancária, bureau de
> crédito ou processamento de pagamento. Todo número exibido nas interfaces vem
> de `src/lib/mock` e aparece acompanhado do selo *dados de demonstração*.

---

## Stack

| Camada       | Escolha                                        |
| ------------ | ---------------------------------------------- |
| Framework    | Next.js 15 (App Router) + React 19 + TypeScript |
| Estilos      | Tailwind CSS 4 (tokens em `globals.css`)        |
| Animação     | Framer Motion                                   |
| 3D           | React Three Fiber + three.js (carregado sob demanda) |
| Ícones       | lucide-react                                    |

Back-end futuro previsto no projeto: Node.js/NestJS, PostgreSQL, Redis,
REST + eventos/webhooks, OAuth/JWT com MFA.

## Rodando

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de produção
npm run start    # serve o build
npm run lint     # ESLint
npm run typecheck
```

## Estrutura

```
src/
  app/
    layout.tsx          Fontes, metadata, MotionConfig
    page.tsx            Composição da página única
    globals.css         Tokens de design, utilitários e keyframes
  components/
    Header.tsx          Header transparente → vidro ao rolar
    Footer.tsx
    sections/           Uma seção por arquivo, na ordem da página
    three/              Objeto 3D do Hero + alternativa SVG sem WebGL
    ui/                 Primitivas: títulos, cards, botões, selos
  content/site.ts       Todo o texto institucional, em um só lugar
  lib/
    hooks.ts            Parallax de ponteiro, count-up, tilt, scroll
    motion.ts           Presets de movimento (ease-out, 400–1000ms)
    mock/               Camada de demonstração + fronteira de integração
```

### Identidade visual

| Token          | Valor     | Uso                                        |
| -------------- | --------- | ------------------------------------------ |
| Verde-limão    | `#B7FF00` | CTAs, números, ícones, linhas, iluminação   |
| Preto profundo | `#050505` | Fundo                                      |
| Grafite        | `#101313` | Superfícies e cards                        |
| Branco         | `#FFFFFF` | Títulos e texto principal                  |
| Cinza          | `#A5A5A5` | Texto de apoio e microtexto técnico         |

Tipografia: **Manrope** (títulos, ExtraBold, caixa alta, tracking negativo) e
**Inter** (texto e microtexto). O contraste entre título gigante e microtexto de
`0.6875rem` com `letter-spacing` de `0.24em` é o que dá a linguagem editorial.

Grid: 12 colunas no desktop, 4 no mobile — a composição é adaptada por seção,
não apenas reduzida.

## Decisões que valem registro

**O 3D não entra no bundle inicial.** `ValorScene` é carregado por
`next/dynamic` com `ssr: false` e só quando há tela grande, ponteiro fino e
WebGL disponível. Nos demais casos entra `ValorObjectFallback`, uma composição
SVG com a mesma leitura visual e custo próximo de zero. Sob
`prefers-reduced-motion` a cena usa `frameloop="demand"`: desenha uma vez e para.

**Metal sem HDRI.** Um `MeshStandardMaterial` metálico sem mapa de ambiente
renderiza preto. Em vez de baixar um HDRI, o ambiente é pintado em um canvas
(gradiente equirretangular com faixa verde-limão e uma fonte de luz) e passado
pelo `PMREMGenerator` — reflexo real, nenhuma requisição de rede.

**Movimento com função.** Os presets de `lib/motion.ts` ficam entre 400ms e
1000ms, com `ease-out` ou spring suave, e animam apenas `transform`, `opacity`
e `filter` — nada que provoque reflow. `MotionConfig reducedMotion="user"`
suprime transformações para quem pede menos movimento; o CSS zera as animações
contínuas.

**Seções usam `overflow-x: clip`, não `overflow: hidden`.** `hidden` cria um
contexto de rolagem e quebra o `position: sticky` das colunas fixas (o fluxo do
microcrédito depende disso).

**Trilho horizontal com rolagem nativa.** Os cards de tecnologia usam
`overflow-x: auto` com scroll-snap em vez de sequestrar a rolagem vertical:
funciona com teclado, roda do mouse e toque. O `scroll-padding` acompanha o
`padding` para que o primeiro card fique alinhado ao grid editorial.

## Dados de demonstração

`src/lib/mock` é a única fonte de números da interface, e existe justamente para
marcar a fronteira:

```ts
export interface ValorPlatformClient {
  readonly source: DataSource;      // "demo" | "live"
  getScore(): Promise<ValorScore>;
  getCreditPosition(): Promise<CreditPosition>;
  listContracts(): Promise<ContractSummary[]>;
  listOffers(): Promise<CreditOffer[]>;
}
```

Quando existir back-end, basta uma implementação HTTP dessa mesma interface —
os componentes não mudam. Enquanto isso:

- todo registro carrega `source: "demo"`;
- toda tela que mostra número exibe o selo `DemoBadge`;
- o cashback aparece sempre com as condições aplicáveis (quitação integral e
  regras do produto), nunca como benefício garantido;
- os "Números da Valor" são parâmetros de produto (1 produto, 5 níveis, 1.000
  pontos), não métricas comerciais;
- `robots` está em `noindex` enquanto o piloto for demonstrativo.

## Acessibilidade

Um `h1` por página e hierarquia de títulos contínua; todas as seções com
`aria-labelledby`; títulos animados palavra a palavra expõem a frase inteira via
`aria-label` e escondem os fragmentos da tecnologia assistiva; gráficos SVG têm
`role="img"` com descrição; link "pular para o conteúdo" como primeiro tab stop;
foco visível em verde-limão; menu mobile fecha com `Esc` e trava a rolagem de
fundo; o diagrama circular do Ciclo Valor tem uma legenda textual equivalente.

Verificado sem overflow horizontal em 390, 834, 1280 e 1728px.

## Limites conhecidos

- Não há rotas além da página única — "Entrar" e "Solicitar crédito" apontam
  para a âncora de contato.
- Privacidade, Termos e Contato são âncoras de espaço reservado: nenhum texto
  jurídico, endereço ou registro foi inventado.
- Sem testes automatizados; a verificação foi visual e por auditoria de DOM.
