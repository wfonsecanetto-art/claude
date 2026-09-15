# Monster Metamorfose

Experiência web imersiva (arquivo único, `index.html`) construída em WebGL/three.js.

## O que está implementado

- **Abertura arranhada** — canvas 2D com três camadas (logo / chapa / bordas rasgadas).
  Cada garrada corta a chapa com `destination-out` usando polígonos com jitter nas
  bordas, desenha o bisel de luz e sombra que dá espessura ao corte, solta estilhaços
  com física simples e sacode a tela. A quarta garrada estilhaça o que sobrou.
  O ponteiro também arranha. `prefers-reduced-motion` pula a sequência.
- **Lata 3D** — perfil de revolução reamostrado por comprimento de arco (proporção
  real 168 × 66 mm), rótulo e mapa de rugosidade/metalicidade gerados em canvas por
  sabor, ambiente de estúdio pré-filtrado (PMREM) para os reflexos do alumínio.
  A garra é vetorial: três rasgos com bordas serrilhadas, contorno preto e
  gradiente, desenhados com correção de anisotropia (o wrap achata o eixo
  vertical). Lockups por linha: Monster Energy, Juice Monster e Monster Ultra.
  `ASSETS.label[id]` e `ASSETS.logo` aceitam arte oficial e substituem o desenho
  procedural.
- **Líquido reativo** — equação de onda 2D rodando em ping-pong na GPU (256x256,
  half-float): a lata injeta impulsos proporcionais à velocidade relativa ao
  entrar e sair, as ondas se propagam, refletem, interferem e amortecem, e o
  ponteiro do usuário também gera ondulações. A malha é polar (densa junto da
  lata, esparsa no horizonte) e desloca os vértices pela altura simulada.
  Por cima: refração lida do render target, absorção de Beer-Lambert na cor do
  sabor, reflexo planar real (câmera espelhada + near plane oblíquo), menisco no
  contato com a lata e espuma onde a agitação é forte.
- **Câmera** — rig com tracking: posição e mira amortecidas perseguem a lata com
  inércia, respiração sutil de operador e deslocamento lateral do alvo para o
  produto não disputar o eixo do texto.
- **Transformação** — o rótulo troca na linha d'água: o material mistura dois mapas
  por uma frente de ruído ancorada no nível do líquido. A lata mergulha, gira duas
  voltas e volta com a identidade nova. A cor nova se espalha pela página a partir
  da posição da lata na tela, com borda corroída por ruído.
- **Composição final** — as cinco latas emergem do mesmo líquido em arco irregular.

## Estrutura de passes

0. simulação de ondas (256x256, passos proporcionais ao tempo real)
1. reflexo (meia resolução, câmera espelhada)
2. cena (fundo procedural + latas, com depth texture)
3. líquido (refração + reflexo sobre o passe 2)
4. composite (grade, grão, vinheta, aberração cromática no impulso)

## Rodando

Arquivo estático. `python3 -m http.server` na pasta e abrir `index.html`.
O three.js vem de `cdn.jsdelivr.net` (r158, build UMD).
