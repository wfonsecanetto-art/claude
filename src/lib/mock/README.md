# Camada mock — dados de demonstração

Tudo neste diretório é **demonstração**. Não há integração bancária, motor de
crédito, bureau, adquirente ou API externa por trás destes valores.

A regra do projeto piloto:

- nenhuma interface pode sugerir que uma operação real aconteceu;
- todo dado exibido nas telas vem daqui e carrega `source: "demo"`;
- a fronteira com o mundo real é a interface `ValorPlatformClient`
  (`client.ts`) — quando existirem back-end e integrações, basta trocar a
  implementação mock por uma implementação HTTP, sem tocar nos componentes.

Componentes de UI **não** devem importar números soltos: importam de
`@/lib/mock`, e sempre exibem o selo de demonstração ao lado do dado.
