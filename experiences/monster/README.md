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
- **Líquido** — plano com refração lida do render target, absorção de Beer-Lambert
  na cor do sabor, reflexo planar real (câmera espelhada + near plane oblíquo),
  menisco no contato com a lata e ondas amortecidas pela distância.
- **Transformação** — o rótulo troca na linha d'água: o material mistura dois mapas
  por uma frente de ruído ancorada no nível do líquido. A lata mergulha, gira duas
  voltas e volta com a identidade nova. A cor nova se espalha pela página a partir
  da posição da lata na tela, com borda corroída por ruído.
- **Composição final** — as cinco latas emergem do mesmo líquido em arco irregular.

## Estrutura de passes

1. reflexo (meia resolução, câmera espelhada)
2. cena (fundo procedural + latas, com depth texture)
3. líquido (refração + reflexo sobre o passe 2)
4. composite (grade, grão, vinheta, aberração cromática no impulso)

## Rodando

Arquivo estático. `python3 -m http.server` na pasta e abrir `index.html`.
O three.js vem de `cdn.jsdelivr.net` (r158, build UMD).
