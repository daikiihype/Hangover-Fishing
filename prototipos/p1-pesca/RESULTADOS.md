# Protótipo P1 — Relatório de testes

**Status geral (após o Patch 01 e o ajuste "ARREMESSO CANCELADO", 08/11/2026):** testes automatizados executados e aprovados ✔ (**53/53** lógica · **42/42** navegador · P0 **18/18**, após a revisão do aviso) · **testes em celulares reais: NÃO EXECUTADOS**

O P1 só pode ser considerado funcional segundo os critérios da missão (seção C) depois da **Parte B** preenchida em celulares reais, com duas pessoas. **Testes automatizados aprovados não tornam o P1 funcional.**

Resultados do Patch 01: seção A.5. Ajuste "ARREMESSO CANCELADO": seção A.6. **Testes físicos: executar com `PROTOCOLO_VALIDACAO_FISICA.md`** e resumir aqui na Parte B.

---

## Parte A — Testes automatizados (ambiente simulado)

**Executados por:** Claude, em 08/11/2026
**Ambiente:** Windows 11 · Node.js 24.16.0 · Microsoft Edge 156 headless, controlado por playwright-core 1.49.1 (instalado **fora** do projeto) · Phaser 3.90.0
**Importante:** toques **simulados**. Isso confirma as regras e a integração com o Phaser, mas **não substitui** o teste com pessoas em celulares.

### A.1. Lógica — `node tests/logica.test.js` — **35 de 35 passaram** (versão inicial; com o Patch 01, 48 de 48: ver A.5)

Os toques passam pelo `TouchRouter` real (mesmo módulo do P0). Relógio simulado em quadros de 16 ms.

| Item pedido na missão | Testes | Resultado |
|---|---|---|
| Arremessos independentes | 1a (P1 carrega e arremessa, P2 continua pronto) · 1b (simultâneos, forças e distâncias diferentes) · 1c (medidor vai e volta; toque curto não arremessa) | ✔ ✔ ✔ |
| Espera e mordida | 2a (mordida no tempo sorteado; janela registrada no evento) · 2b (150 sementes: sempre dentro de mín./máx., com variação) · 2c (beliscadas antes da mordida; tocar nelas é ignorado) | ✔ ✔ ✔ |
| Toque antecipado | 3a (5 toques ignorados e não guardados: sem novo toque, o peixe escapa) · 3b (dedo apoiado antes da mordida não fisga; só um novo toque fisga) · 3c (dedo apoiado durante toda a janela: escapa) | ✔ ✔ ✔ |
| Fisgada válida | 4a (novo toque em 300 ms inicia a briga; tempo de reação registrado) · 4b (toque exatamente no último ms da janela fisga) | ✔ ✔ |
| Fisgada atrasada | 5a (toque após 1050 ms: escapa, contado como atrasado) · 5b (janela de 400 ms: 300 fisga, 500 não) · 5c (toque atrasado que chega antes do próximo quadro) | ✔ ✔ ✔ |
| Linha rompida | 6 (segurar sem parar: alerta → crítica → rompe) · 6b (entrar e sair da zona crítica 4 vezes **não** rompe: vale a permanência) | ✔ ✔ |
| Peixe escapando | 7 (sem recolher, a linha fica frouxa e o peixe escapa) | ✔ |
| Captura bem-sucedida | 8a (captura registra o jogador e o nome) · 8b (os 3 perfis, 10 sementes cada, por P2) | ✔ ✔ |
| Recolhimento vazio | 9a (segurar recolhe tudo, sem penalidade; o mesmo dedo não arremessa sozinho; novo arremesso imediato) · 9b (soltar no meio: boia mais perto, espera recomeça; nenhuma mordida durante o recolhimento) | ✔ ✔ |
| Dois jogadores ao mesmo tempo | 10 (5 sementes: os dois arremessam, fisgam, brigam e capturam ao mesmo tempo; 0 erros de toque) | ✔ |
| Estados independentes | 11a (**comparação exata**: a pescaria de P1 é idêntica, evento por evento, com e sem P2 tocando, segurando e usando dedo extra ao lado) · 11b (toques de P2 na mordida de P1 não fisgam por P1) · 11c (dedo de P1 arrastado até a metade de P2 continua recolhendo para P1) · 11d (P1 segurando e P2 soltando: tensões em sentidos opostos) | ✔ ✔ ✔ ✔ |
| Reinício após captura ou fuga | 12a (após captura) · 12b (após fuga e após linha rompida; peixe e tensão zerados) · 12c (toque logo no início do resultado é ignorado; depois, começa a carregar) | ✔ ✔ ✔ |
| Robustez (herdada do P0) | R1 (cancelamento do sistema na carga cancela o arremesso) · R2 (interrupção da página na briga = soltar, para os dois, sem erro) · R3 (página parada 20 s: o tempo parado não conta) · R3b (dois dedos do mesmo jogador: só "solta" quando o último sai) · R4 (configuração válida e validação de erros) · R5 (módulos de entrada idênticos aos do P0) | ✔ ✔ ✔ ✔ ✔ ✔ |

**Verificação de sensibilidade (os testes pegam defeitos?).** Quatro defeitos foram inseridos de propósito, um de cada vez, numa cópia descartável do código:

| Defeito inserido | Testes que falharam |
|---|---|
| Fisgada aceita depois da janela | 5c |
| Toque antecipado guardado e usado na mordida | 2c, 3a, 3b, 3c, 9b |
| Um único gerador aleatório para os dois jogadores | 10, 11a |
| Segundo dedo do mesmo jogador ignorado | R3b (teste criado depois que a primeira rodada mostrou que esse defeito passava despercebido) |

**P0 preservado:** `node tests/logica.test.js` no P0 continua **18 de 18**. Nenhum arquivo do P0 foi modificado.

### A.2. Navegador com multitouch simulado — `tests/e2e-navegador.js` — **22 de 22 passaram** (versão inicial; com o Patch 01, 36 de 36: ver A.5)

Tela emulada 844 × 390 (celular na horizontal, densidade 2). Dois dedos simultâneos via `Input.dispatchTouchEvent`. O script **joga** as pescarias, lendo a tensão e segurando/soltando como um jogador.

| Verificação | Resultado |
|---|---|
| Inicial: os dois prontos, sem erros | ✔ |
| 1. Os dois carregando ao mesmo tempo; P1 solta e arremessa enquanto P2 continua carregando | ✔ ✔ |
| 1. Cada arremesso no seu momento, com distância conforme a própria força | ✔ |
| 3. Três toques antecipados ignorados | ✔ |
| 2 / 4. Mordida de P1 chega; novo toque fisga | ✔ ✔ |
| 5. P2 não toca na janela: escapa; o toque depois é contado como atrasado (P1 brigando ao mesmo tempo) | ✔ |
| 8. P1 captura | ✔ |
| 10. Os dois fisgam; 11. dedo de P1 arrastado até a metade de P2 continua de P1 | ✔ ✔ |
| 10. Os dois capturam na mesma briga simultânea | ✔ |
| 12. Os dois voltam a "pronto" | ✔ |
| 6 / 7. Ao mesmo tempo: P1 segura sem parar e rompe a linha; P2 nunca segura e o peixe escapa | ✔ ✔ |
| 9. Segurar na espera recolhe a linha vazia; depois, novo arremesso imediato | ✔ ✔ |
| Painel de diagnóstico mostra o estado de cada jogador | ✔ |
| Retrato: aviso "Gire o celular"; de volta à horizontal, aviso some | ✔ ✔ |
| 0 erros de toque (TouchRouter) · 0 erros de JavaScript | ✔ ✔ |

Observações:
- FPS no Edge headless deste computador: **58–59** (informativo; não representa o celular).
- As brigas do teste no navegador duraram ~30–36 s, mais que na simulação (11–19 s). O script reage com atraso de ida e volta ao navegador e começou as brigas a ~30 m. **Sinal de que as brigas podem estar longas** para pessoas: observar no teste real.
- Também conferido por captura de tela: legibilidade em 667 × 375, 844 × 390 e 915 × 412; os estados pronto, carregando, esperando, mordida, briga, captura, linha rompida, fuga, recolhimento, menu, diagnóstico e retrato.

### A.3. Simulação de balanceamento — `tests/simulacao-balanceamento.js`

Tabela e análise em `BALANCEAMENTO.md`, seção 2. Resumo: jogador atento captura 100% nos 3 perfis; quem deixa a tensão encostar no vermelho perde linha (até 50 de 80 com o peixe pesado); segurar sempre rompe e nunca segurar deixa escapar, em 100% dos casos.

### A.4. Problemas encontrados e corrigidos durante a verificação

1. **Teste no navegador soltava o dedo errado.** No Chromium/Edge, o `touchEnd` do protocolo de depuração recebe os dedos que **saem**, não os que ficam. O auxiliar do teste foi corrigido. (O teste do P0 não é afetado: ele sempre soltava os dedos de forma compatível.)
2. **Rotação na emulação de celular.** O Phaser registrava o novo tamanho da tela, mas não reaplicava a escala. O P0 se comporta igual nesse ambiente. O P1 ganhou uma proteção em `main.js` (força `scale.refresh()` após girar). **Verificar no celular real** (caso B11).
3. **Erro 404 no console** (`favicon.ico`). Corrigido com um ícone vazio no `index.html`.
4. **Ajustes de legibilidade:** rótulo "TENSÃO" cortado na borda; título "LINHA ARREBENTOU!" largo demais para o cartão (agora "LINHA ROMPEU!"); sombra do peixe pouco visível; boia de arremesso longo encostando no texto de instrução.
5. **Balanceamento:** a primeira versão não oferecia risco real na briga (ver `BALANCEAMENTO.md`, seção 2).
6. **Três testes de lógica estavam errados, não o jogo:** um salto de 505 ms acionava a regra de "página parada"; um teste checava o estado final de quem já tinha voltado a "pronto"; outro deixava P1 sem recolher enquanto P2 fisgava.

### A.5. Patch 01 — correções de gameplay e interrupções (08/11/2026)

**Executados por:** Claude, em 08/11/2026, no mesmo ambiente da Parte A.
**Escopo:** D8 (interrupções), D4 (recolhimento), D3 (beliscadas), D7 (cartões), D2 (aviso), D9 (vibração). D1, D5, D6 e D10 não foram alterados.

**Lógica — `node tests/logica.test.js` — 48 de 48 passaram** (os 35 anteriores, sem alteração, + 13 novos):

| Item obrigatório da missão | Teste | Resultado |
|---|---|---|
| 1. Interrupção durante a espera | P01-1 (20 s de pausa: nenhuma mordida; tempo restante igual; mordida chega no tempo que faltava) | ✔ |
| 2. Interrupção durante a briga | P01-2 (15 s de pausa com o jogador segurando: dedo encerrado; tensão, risco, distância e peixe idênticos; sem fuga nem rompimento) | ✔ |
| 3. Jogadores em estados diferentes | P01-3 (P1 brigando e P2 na janela de mordida: a janela não acaba durante a pausa; P2 ainda fisga; reação medida sem a pausa) | ✔ |
| 4. Retorno sem toque fantasma | P01-4 (carga e recolhimento interrompidos; toque de retomada consumido; fins atrasados absorvidos sem erro; nenhum arremesso ou recolhimento fantasma) | ✔ |
| 5. Preservação dos temporizadores | P01-1, P01-3 e P01-5 (cartão de resultado congelado pelo menu; menu não exige toque; interrupção com o menu aberto exige toque) | ✔ |
| 6. Recolhimento parcial e retomada | P01-6 (espera retomada com o tempo que faltava, sem novo sorteio, sem mordida no recolhimento) · P01-6b (toque prematuro de 260 ms só atrasa a mordida pelo tempo em que recolheu) | ✔ ✔ |
| 7. Beliscadas sem áudio | P01-7 (beliscada não toca som nem vibra; numa pescaria real com 2 beliscadas, silêncio total) | ✔ |
| 8. Mordida continua com seus sinais | P01-8 (bipe duplo; evento de mordida com janela registrada) + navegador (borda, "!" e cartões conferidos por captura de tela) | ✔ |
| 9. Avanço uniforme dos cartões | P01-9 (captura, fuga, linha rompida e mordida perdida: toque antes de 0,6 s não avança e gera exatamente um registro; depois de 0,6 s avança) | ✔ |
| 10. Toque antigo não inicia arremesso | P01-10 (dedo da briga mantido durante e depois do cartão: nada acontece; só um toque novo carrega) | ✔ |
| 11. Feedback do arremesso cancelado | P01-11 (código `toque-curto`; sem espera nem penalidade; interrupção não usa o aviso) + navegador | ✔ |
| 12. Vibração desligada e ativável | P01-12 (desligada; mordida não vibra; ao ligar, vibra; botão e `main.js` começam desligados) + navegador | ✔ |

**Verificação de sensibilidade:** cada comportamento antigo foi reintroduzido, um de cada vez, numa cópia descartável do código:

| Comportamento antigo reintroduzido | Testes que falharam |
|---|---|
| Novo sorteio da espera após recolhimento (D4) | P01-6, P01-6b |
| Pausa que não congela a pescaria (D8) | P01-1, P01-2, P01-3, P01-4, P01-5 |
| Bipe nas beliscadas (D3) | P01-7 |
| Cartão de mordida perdida que não avança (D7) | P01-9 |
| Vibração ligada por padrão (D9) | P01-12 |

**Navegador — `tests/e2e-navegador.js` — 36 de 36 passaram** (os 22 anteriores + 14 novos):

| Verificação nova | Resultado |
|---|---|
| Nenhuma pausa durante todo o jogo normal da primeira parte do roteiro (pausas falsas = 0) | ✔ |
| D9: vibração começa desligada (som e botão do menu); o botão do menu liga | ✔ ✔ |
| D2: toque curto mostra "SEGURE PARA ARREMESSAR!" só na metade de quem tocou; o próximo toque já carrega; o aviso some sozinho | ✔ ✔ ✔ |
| D8 (perda de foco simulada com os dois brigando e P1 segurando): pausa com "Toque na tela para continuar"; 3 s congelados sem fuga nem rompimento; recuperar o foco não retoma sozinho; o toque retoma sem virar ação e ninguém fica pressionado | ✔ ✔ ✔ ✔ |
| D8 (página oculta simulada): pausa; ao voltar, continua pausada e sem fuga; depois das duas interrupções, a briga termina normalmente; contador de pausas = 2 | ✔ ✔ ✔ ✔ |

**Simulação de balanceamento:** resultado idêntico à tabela do `BALANCEAMENTO.md` (a briga e a tensão não mudaram).
**P0:** `node tests/logica.test.js` no P0: **18 de 18**. Nenhum arquivo do P0 foi modificado (impressão digital conferida antes e depois).

**Problemas encontrados durante a verificação do patch:**
1. **Teste instável no navegador, não defeito do jogo.** O caso "9. Segurar na espera recolhe a linha vazia" falhou 1 vez em 4 execuções: o teste esperava só 300 ms, com 100 ms de folga sobre o limiar de 200 ms e a latência do navegador automatizado. Corrigido: o teste agora espera o estado mudar (até 1,5 s). Depois disso: 36/36.
2. **Dois testes novos tiveram que ser ajustados**, por granularidade do passo de simulação (10 ms) em relação ao limiar (P01-6).

**O que a automação NÃO valida (exige aparelho físico — caso B11):**
- Se o painel de notificações, a central de controle, chamadas e alarmes do aparelho disparam algum evento detectável (`blur` ou `visibilitychange`). Isso varia por sistema e navegador e **não pode ser simulado** de forma fiel.
- Se ocorrem pausas falsas em uso real.
- A troca de aplicativo e o bloqueio de tela reais (no teste, a página oculta foi **simulada**).
- A percepção dos jogadores: aviso "SEGURE PARA ARREMESSAR!", beliscada sem som e tela de pausa.

### A.6. Ajuste de UX "ARREMESSO CANCELADO" (08/11/2026)

**Executados por:** Claude, em 08/11/2026, no mesmo ambiente.
**Ajuste (aprovado pela direção criativa):** interrupção do sistema durante a carga de um arremesso → arremesso cancelado, sem penalidade e sem novo arremesso automático; ao retomar, "ARREMESSO CANCELADO" por ~1,3 s **só** na metade de quem carregava. Em outros estados, nenhum aviso. Menu e retrato não mostravam o aviso nesta versão. **Superado pela revisão da seção A.7: agora mostram.** O diagnóstico também passou a mostrar `mordida em` congelada durante o recolhimento (para o B5).

**Lógica — 52 de 52 passaram** (48 anteriores + 4 novos):

| Teste | O que verifica | Resultado |
|---|---|---|
| P02-1 | Interrupção durante a carga: volta a "pronto", nada lançado, nenhum aviso durante a pausa, um único aviso (só para quem carregava) ao retomar, nenhum arremesso automático, um toque novo carrega na hora | ✔ |
| P02-2 | Interrupção em pronto, esperando, recolhendo, mordida, briga e cartão de resultado: nenhum aviso | ✔ |
| P02-3 | Menu durante a carga: sem aviso. Interrupção + menu aberto: o aviso só sai quando o jogo volta de fato | ✔ |
| P02-4 | Diagnóstico do B5: `mordida em` congelada durante o recolhimento e igual ao valor retomado | ✔ |

**Regressão (os testes continuam pegando comportamentos antigos?).** Cada comportamento antigo ou errado foi reintroduzido, um de cada vez, numa cópia descartável:

| Comportamento reintroduzido | Testes que falharam |
|---|---|
| D4 antigo (novo sorteio da espera) | P01-6, P01-6b, P02-4 |
| D8 antigo (pausa que não congela) | P01-1 a P01-5 |
| D3 antigo (bipe na beliscada) | P01-7 |
| D7 antigo (mordida perdida não avança) | P01-9 |
| D9 antigo (vibração ligada) | P01-12 |
| Fisgada aceita fora da janela (original) | 5c |
| Gerador aleatório compartilhado (original) | 10, 11a |
| Segundo dedo do mesmo jogador ignorado (original) | R3b |
| Ajuste ausente (sem aviso) | P02-1, P02-3 |
| Aviso em qualquer estado | P02-1, P02-2, P02-3 |

**Navegador — 39 de 39 passaram** (36 anteriores + 3 novos), em duas execuções seguidas:

| Verificação nova | Resultado |
|---|---|
| Durante a pausa (perda de foco simulada com J1 carregando e J2 em outro estado), o aviso ainda não aparece | ✔ |
| Ao retomar: "ARREMESSO CANCELADO" só na metade de J1; nada foi lançado | ✔ |
| O aviso some sozinho e nenhum arremesso começa automaticamente | ✔ |

**P0:** 18 de 18; impressão digital dos 15 arquivos idêntica antes e depois.
**Simulação de balanceamento:** não afetada (nenhum parâmetro nem regra de briga mudou).

### A.7. Revisão do aviso: menu e retrato (08/11/2026)

**Alteração aprovada pela direção criativa:** o aviso "ARREMESSO CANCELADO" também aparece quando a carga é cancelada por **abertura do menu** ou **rotação para retrato**. Mantidos: só o jogador afetado, ~1,3 s, sem penalidade, sem arremesso automático; com o menu aberto, o aviso espera o retorno efetivo ao jogo. Nenhuma outra mecânica foi alterada.

**Lógica — 53 de 53 passaram.** P02-3 foi reescrito (antes verificava "menu sem aviso") e agora cobre menu e retrato: cancelamento, aviso só para o afetado, nada enquanto pausado, nenhum arremesso automático, sem penalidade, sem aviso quando não havia carga, e menu + retrato juntos. O caso "interrupção do sistema com o menu aberto" passou a ser o P02-3b.

**Navegador — 42 de 42 passaram** (39 + 3 novos), em duas execuções seguidas:

| Verificação nova | Resultado |
|---|---|
| Menu aberto enquanto P2 carrega: o aviso não aparece com o menu aberto | ✔ |
| Ao fechar o menu: "ARREMESSO CANCELADO" só na metade de P2; nada lançado | ✔ |
| Giro para retrato enquanto P1 carrega: ao voltar para a horizontal, aviso só na metade de P1; nada lançado | ✔ |

**Regressão:** 11 comportamentos reintroduzidos, um de cada vez, numa cópia descartável; **todos detectados**. Os 10 da seção A.6 continuam detectados, e a versão anterior ("menu e retrato sem aviso") é detectada pelo P02-3.
**P0:** 18 de 18; impressão digital dos 15 arquivos idêntica.

---

## Parte B — Testes em celulares reais (a preencher)

**Formulário de execução:** `PROTOCOLO_VALIDACAO_FISICA.md`, com preparação, ações exatas, resultado esperado, critério de falha e campos de resultado e observações para cada caso, além da matriz de interrupções do B11 e da tabela separada de eventos **não detectados**. Esta Parte B guarda só o **resumo** (passou / falhou por aparelho).

**Como fazer:** README, seção 4. Antes de cada caso: ☰ MENU → *Reiniciar sessão*. Ao final de cada aparelho: ☰ MENU → *Ver relatório* → copiar e colar no fim deste arquivo.
Sempre com **duas pessoas**, uma em cada metade. Quem conduz o teste pode deixar o **DIAG** ligado.

**Um aparelho de cada vez.** O jogo é local: em cada rodada de testes, **duas pessoas compartilham um único celular**, cada uma na sua metade da tela. "Testar em dois aparelhos" significa repetir o roteiro completo **em um celular e depois em outro**, separadamente. **Nunca** se joga em dois aparelhos ao mesmo tempo. Em cada aparelho, conferir também a **rotação** (retrato ↔ horizontal) e o **multitouch** (os dois segurando juntos).

**Versão testada.** Anotar no relatório **qual versão** foi testada e se a vibração estava ligada ou desligada.
- **Versão atual (com o Patch 01, 08/11/2026):** beliscadas sem som; espera preservada após recolhimento interrompido; os quatro cartões avançam com toque após 0,6 s; aviso "SEGURE PARA ARREMESSAR!"; vibração **desligada** por padrão; interrupções detectadas pausam e pedem "Toque na tela para continuar".
- Versão anterior (sem o patch): bipe nas beliscadas, nova espera sorteada, cartão de mordida perdida que não avançava, nenhum aviso ao cancelar, vibração ligada, e a perda de foco não pausava.

**Nenhum resultado abaixo foi preenchido:** os testes físicos do P1 ainda não foram executados.

### B.1. Aparelhos

| # | Modelo | Sistema | Navegador | Tela | Som ok? | Vibração ok? |
|---|---|---|---|---|---|---|
| 1 | | | | | | |
| 2 | | | | | | |

### B.2. Casos

| ID | Caso | Como executar | Esperado | Aparelho 1 | Aparelho 2 |
|---|---|---|---|---|---|
| B1 | Ciclo completo P1 | Alemão faz 3 pescarias sozinho | Arremessa, espera, fisga, briga e captura | | |
| B2 | Ciclo completo P2 | ALE faz 3 pescarias sozinho | Idem | | |
| B3 | **Pescaria simultânea** | Os dois pescam juntos por 5 minutos | **Critério principal: independência das pescarias.** Nenhum comando de um afeta o estado, a tensão ou o resultado do outro; "erros de toque" = 0 no DIAG. **Não é obrigatório** que os dois capturem um peixe em 5 minutos. **Registrar como resultados observados:** capturas, fugas e linhas rompidas de cada jogador, e se houve ao menos uma pescaria concluída pelos dois ao mesmo tempo | | |
| B4 | Independência sob pressão | Um briga enquanto o outro arremessa, toca repetidamente e recolhe | A briga não é afetada (tensão, estado) | | |
| B5 | ⭐ **PRIORITÁRIO — Toque antecipado, recolhimento acidental e beliscadas** | (1) Tocar várias vezes antes da mordida, inclusive logo após as beliscadas; (2) manter o dedo apoiado até a mordida; (3) perguntar a cada jogador o que achou que as "afundadinhas" (beliscadas) significavam | Nada acontece com os toques; o dedo apoiado não fisga. **Observar e contar:** quantas vezes um toque "nervoso" virou recolhimento ("Recolhendo a linha…") sem a pessoa querer (com o Patch 01 a espera não é mais sorteada de novo, mas a boia ainda se aproxima um pouco; decisão D4); se os jogadores entenderam que a beliscada, agora **silenciosa**, não é a mordida (decisão D3). Anotar o contador "prematuros" | | |
| B6 | Fisgada no tempo e atrasada | 10 mordidas fisgando rápido; 3 deixando passar | Rápido fisga; tarde escapa com mensagem clara | | |
| B7 | Linha rompida | Segurar sem soltar durante a briga | Vara e borda avisam (vermelho, bipe); a linha rompe | | |
| B8 | Fuga | Não segurar durante a briga | Aviso azul e som grave; o peixe escapa | | |
| B9 | Recolhimento vazio | Segurar com a boia na água; soltar no meio; segurar até o fim | Recolhe sem penalidade; ao soltar no meio, a espera continua (a mordida não "recomeça do zero"); novo arremesso imediato | | |
| B10 | Reinício | Após captura, fuga, linha rompida **e mordida perdida**; também um toque rápido no estado "pronto" | Volta a "pronto"; nos **quatro** cartões, tocar após ~0,6 s já começa a carregar; um toque rápido no "pronto" mostra "SEGURE PARA ARREMESSAR!" por ~1 s, sem travar o jogo | | |
| B11 | Interrupções e rotação | Durante a briga (um jogador segurando): (1) puxar a barra de notificações; (2) trocar de app e voltar; (3) bloquear e desbloquear a tela; (4) girar para retrato e voltar; (5) receber uma chamada ou alarme, se possível. Em cada um, anotar o contador **"pausas"** do DIAG antes e depois | (2), (3) e geralmente (5): aparece **"PAUSADO — Toque na tela para continuar"**; nada muda enquanto pausado; o toque de retomada não arremessa nem recolhe; ninguém fica "pressionado". (4): pausa e continua sozinho ao voltar para a horizontal. (1): **pode não ser detectado** em alguns aparelhos (limitação do navegador). Se alguém estava **carregando** um arremesso numa interrupção detectada: ao retomar, "ARREMESSO CANCELADO" só na metade dele. Registrar **qual interrupção foi detectada ou não** (matriz I1–I11 do protocolo), se algum peixe foi perdido durante uma interrupção não detectada e se houve pausas sem interrupção (pausas falsas) | | |
| B12 | Desempenho | 10 minutos de jogo | FPS ≥ 55 no DIAG, sem travadas | | |
| B13 | **Compreensão** | Após 5 minutos, perguntar a cada jogador: "por que você perdeu aquele peixe?" | Os dois distinguem "linha rompeu" (tensão alta) de "escapou" (frouxa ou fisgada tarde) | | |
| B14 | Diversão e ritmo | (1) **Observar, sem perguntar:** ao fim de uma pescaria ou da sessão, os jogadores **iniciam outra pescaria espontaneamente**? Pedem para jogar de novo? (2) Depois perguntar: gostaram? A espera é longa? A briga é longa? Os sinais de mordida são claros? O medidor de força faz sentido? A vibração ou o som do outro atrapalhou? | Registrar o comportamento observado (quantas vezes recomeçaram por conta própria) e as respostas, com as palavras dos jogadores | | |

### B.3. Critérios de sucesso da missão (seção 9)

| # | Critério | Evidência automatizada | Evidência física (a preencher) |
|---|---|---|---|
| 1 | Dois jogadores completam uma pescaria simultaneamente | Lógica 10; navegador "os dois capturam" | B3 (resultados observados) + B1/B2. Se nenhuma pescaria simultânea for concluída no B3, registrar isso; o critério continua em aberto |
| 2 | Nenhum comando de um jogador interfere no outro | Lógica 11a–11d; navegador 11 | B3, B4 |
| 3 | O ciclo completo funciona | Lógica 1–12; navegador | B1, B2, B10 |
| 4 | Vitória e derrota compreensíveis | — (exige pessoas) | B13 |
| 5 | As regras de tensão funcionam | Lógica 6, 6b, 7, 8b, 11d; simulação | B7, B8 |
| 6 | Testes automatizados passam | **53/53 lógica · 42/42 navegador** ✔ (após o Patch 01, o ajuste de UX e a revisão do aviso) | — |
| 7 | Executável localmente e testável em celular real | Servido localmente e jogado no Edge com toques simulados | B.1 + B1–B14 |

**Situação:** o critério 6 está atendido. Os critérios 1, 2, 3 e 5 têm evidência automatizada, mas **dependem da Parte B** para serem dados como atendidos. O critério 4 só pode ser avaliado com pessoas. O critério 7 está parcialmente demonstrado (execução local); o teste em celular **não foi feito**.

### B.4. Relatórios colados do celular

(colar aqui o texto de ☰ MENU → Ver relatório, um bloco por aparelho)
