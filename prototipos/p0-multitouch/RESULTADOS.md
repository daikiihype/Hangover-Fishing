# Protótipo 0 — Resultados dos testes

**Status geral:** testes automatizados executados ✔ · **testes em celulares reais: NÃO EXECUTADOS**

Critérios de aprovação: `docs/PLANO_PROTOTIPO_MULTITOUCH.md`, seção 6.
O Protótipo 0 só pode ser considerado aprovado depois da Parte B preenchida em pelo menos 2 celulares reais.

---

## Parte A — Testes automatizados (ambiente simulado)

**Executados por:** Claude, em 07/11/2026
**Ambiente:** contêiner Linux · Node.js 22.23.4 · Chromium headless (Playwright 1.63.0) · Phaser 3.90.0
**Importante:** toques **simulados** em um navegador de computador. Isso confirma a lógica e a integração com o Phaser, mas **não substitui** os testes em celular.

### A.1. Lógica (`node tests/logica.test.js`) — 18 de 18 passaram

| Cenário da missão | Testes |
|---|---|
| 1. Jogador 1 sozinho | ✔ |
| 2. Jogador 2 sozinho | ✔ |
| 3. Toques simultâneos (20×) | ✔ |
| 4. Um segura, o outro toca 20× | ✔ |
| 5. Os dois segurando (10 s simulados) | ✔ |
| 6. Arrastar para a outra zona (posse mantida; cruzou/voltou) | ✔ ✔ |
| 7. Soltar um dedo com outro pressionado (zonas diferentes e mesma zona) | ✔ ✔ |
| 8. Interrupção e retorno (sem estado fantasma, sem erro falso) | ✔ |
| 9. Cancelamento, toque órfão, início duplicado, fim desconhecido, toque fora da área | ✔ ✔ ✔ ✔ ✔ |
| 10. Toque × segurar no limiar (50 / 199 / 200 / 1500 ms) e limiar ajustável | ✔ ✔ |
| Sequência início → fim | ✔ |

Verificação de sensibilidade: com a regra de posse propositalmente quebrada, 2 testes falharam, o que confirma que eles detectam esse tipo de defeito.

### A.2. Navegador com multitouch simulado (`tests/e2e-navegador.js`) — 30 de 30 passaram

Tela emulada: 844 × 390 (celular na horizontal), toques simultâneos via CDP.

| Verificação | Resultado |
|---|---|
| Inicial: zonas livres, sem erros | ✔ |
| 1. P1 sozinho: 10 toques só em P1 | ✔ |
| 2. P2 sozinho: 10 toques só em P2 | ✔ |
| 3. Toques simultâneos: 20/20 em cada zona | ✔ |
| 4. P1 segura enquanto P2 toca 20× (e invertido) | ✔ ✔ ✔ |
| 5. Os dois segurando; ao soltar, 1 "segurar" em cada | ✔ ✔ |
| 6. Arrastar P1 até a direita: posse de P1; P2 livre; fim contado para P1 | ✔ ✔ |
| 7. Soltar um dedo; dois dedos na mesma zona | ✔ ✔ ✔ |
| 8. Perda de foco; página oculta e de volta | ✔ ✔ ✔ ✔ |
| 9. `touchcancel` vira "cancelado"; toque órfão liberado | ✔ ✔ |
| 10. Sequência toque/segurar/toque/segurar/toque | ✔ |
| Pinça e rolagem não mudam zoom nem posição (Chromium) | ✔ |
| Retrato: aviso visível e toques ignorados; volta à horizontal | ✔ ✔ |
| Menu: abre, seleciona teste, fecha, sem erros falsos | ✔ ✔ |
| Relatório gerado | ✔ |
| Nenhum erro de JavaScript do protótipo | ✔ |

Observações:
- FPS medido no Chromium **sem placa de vídeo**: ~37. Valor apenas informativo; não representa o celular.
- O console mostrou 1 aviso conhecido do Phaser ao receber `touchcancel` (inofensivo; ver README, seção 7).
- Também foi verificada a abertura direta do arquivo (`file://`) com mouse: funciona, sem erros.
- Legibilidade conferida por captura de tela em 844 × 390, 667 × 375 e 915 × 412.

### A.3. Defeitos encontrados e corrigidos durante a verificação
1. **Erro falso ao usar o menu:** toques que começavam no botão "☰ TESTES" (fora do canvas) chegavam ao fim como "fim-desconhecido". Correção: o evento `pointerdownoutside` do Phaser passou a marcar esses toques como "fora da área de jogo".
2. **Erro falso após interrupção:** o fim atrasado de um dedo, depois de um cancelamento geral, gerava "fim-desconhecido". Correção: esses fins passaram a ser absorvidos.
3. **Legibilidade:** o botão do menu cobria o painel do P2, a instrução do teste sobrepunha os painéis e o texto branco tinha pouco contraste sobre o amarelo. Correção: os painéis desviam do botão, ganharam fundo escuro e o nome do teste foi para a faixa inferior.

---

## Parte B — Testes em celulares reais (a preencher)

### B.1. Aparelhos

| # | Modelo | Sistema | Navegador | Tela | Máx. toques nativos observado |
|---|---|---|---|---|---|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |

### B.2. Casos de teste (por aparelho)

Use **Zerar contadores** antes de cada caso. Resultado: ✔ passou · ✗ falhou · ~ parcial · — não executado.

| Caso (menu) | Meta | Aparelho 1 | Aparelho 2 | Aparelho 3 | Observações |
|---|---|---|---|---|---|
| 1. Jogador 1 sozinho (50 toques) | 100% na zona certa | — | — | — | |
| 2. Jogador 2 sozinho (50 toques) | 100% na zona certa | — | — | — | |
| 3. Toques simultâneos (20×) | ≥ 19 de 20 nas duas zonas | — | — | — | |
| 4. Um segura, outro toca 20× (e invertido) | 0 interrupções | — | — | — | |
| 5. Os dois segurando 10 s (10×) | 0 interrupções | — | — | — | |
| 6. Arrastar para a outra zona (10×) | 0 trocas de dono | — | — | — | |
| 7. Soltar um dedo com outro pressionado | Estado correto sempre | — | — | — | |
| 8. Interromper a página e voltar (notificação, troca de app, bloqueio; 5× cada) | 0 zonas presas | — | — | — | |
| 9. Cancelar toques (gesto do sistema, girar para retrato; 5× cada) | 0 zonas presas | — | — | — | |
| 10. Toques rápidos × sustentados (40 gestos anotados) | ≥ 95% corretos | — | — | — | Limiar usado: ___ ms |
| Gestos do navegador (2 min de uso intenso, pinça, toque duplo) | 0 zoom/rolagem/seleção/menu | — | — | — | |
| Dedos extras (2 dedos por jogador; 3 a 5 dedos) | Estado coerente | — | — | — | |
| Bordas da tela | Sem gestos do sistema acidentais | — | — | — | |
| Uso contínuo 10 min | FPS ≥ 55, sem travar | — | — | — | |
| Sessão real com duas pessoas (5 min) | "Respondeu na hora?" sim · "Foi atrapalhado?" não | — | — | — | |

### B.3. Relatórios colados
Cole aqui o texto de **☰ TESTES → Ver relatório** de cada aparelho.

### B.4. Conclusão
- [ ] Aprovado
- [ ] Aprovado com ressalvas
- [ ] Reprovado

Decisões resultantes (tamanho das zonas, limiar, aparelhos mínimos):
