# HANGOVER FISHING
## Plano Técnico — Protótipo 0: Teste de Multitouch

**Versão do plano:** 1.0
**Data:** 07/11/2026
**Referência:** GDD v0.6, seção 16.4
**Status:** **[PROTÓTIPO]** — plano aprovado em 07/11/2026 · **implementado** em 07/11/2026 (`prototipos/p0-multitouch/`) · testes automatizados executados · **testes em celulares reais: NÃO EXECUTADOS** (ver seção 9).
**Atualização (08/11/2026):** o criador informou que o P0 foi testado na prática e funciona corretamente; os números não foram registrados no `RESULTADOS.md` do P0. Próximo protótipo, **P1 — primeiro ciclo de pesca**, implementado: ver seção 10.
**Revisão criativa (08/11/2026):** as decisões D1–D10 do P1 foram aprovadas pela direção criativa (GDD, seção 16.6). **Patch 01 (08/11/2026):** D2, D3, D4, D7, D8 e D9 foram implementados e validados automaticamente; nada foi validado em aparelho físico. Ver seção 11.0.

---

## 1. Objetivo

Validar, **antes de qualquer mecânica de pesca**, que dois jogadores conseguem usar o mesmo celular ao mesmo tempo, cada um com sua zona de controle, sem que um interfira no outro.

O teste responde a uma única pergunta:

> **Duas pessoas conseguem tocar, segurar e soltar ao mesmo tempo, em metades diferentes da tela, com cada comando reconhecido corretamente, em celulares reais?**

O que este teste **não** é:
- Não tem pesca, peixes, tensão nem pontuação.
- Não usa retratos, sprites, cenário nem áudio final.
- Não é a base definitiva do jogo. É um protótipo descartável; o que se aproveita é o **conhecimento** e, possivelmente, o módulo de entrada (ver seção 2.4).

---

## 2. Viabilidade com Phaser 3 e JavaScript

### 2.1. Conclusão

**Viável.** O Phaser 3 tem suporte nativo a vários toques simultâneos. Cada dedo vira um *pointer* (ponteiro), com identificador próprio, posição e estado (pressionado ou solto). O trabalho do protótipo não é "fazer o multitouch funcionar", e sim **organizar a posse de cada dedo** e **neutralizar os gestos do navegador** que atrapalham.

### 2.2. Conceitos que o teste vai exercitar

**Ponteiros (pointers).** Por padrão, o Phaser reserva poucos ponteiros de toque. É preciso configurar explicitamente a quantidade, por exemplo 4: dois jogadores, com margem para um dedo extra ou a palma da mão.

**Posse do toque (pointer ownership)** — a regra central do teste:
- Um dedo pertence à zona **onde começou a tocar**.
- Ele continua pertencendo a essa zona até ser solto, **mesmo se arrastar para a outra metade**.
- Assim, um jogador que escorrega o dedo para o meio da tela não "rouba" o controle do outro.

**Estado da zona:**
- Uma zona está "pressionada" enquanto tiver **pelo menos um** dedo que pertença a ela.
- Se o jogador usar dois dedos na mesma zona, ela continua pressionada até o último ser solto.

**Toque × segurar:** o mesmo gesto tem dois significados no jogo (tocar para fisgar; segurar para arremessar ou recolher). A distinção é feita por **tempo**:
- Pressionado e solto antes de um limiar → **toque**.
- Pressionado por mais que o limiar → **segurar**.
- O limiar exato será **medido no teste** (ponto de partida a avaliar: entre 150 e 250 ms).

**Cancelamento:** o sistema pode interromper um toque sem que o dedo seja solto (notificação, chamada, gesto do sistema, troca de aplicativo). Nesses casos o navegador envia um evento de **cancelamento**. O protótipo precisa tratá-lo como "soltar", senão a zona fica **presa** como pressionada.

### 2.3. Orientação horizontal

- **Não é possível forçar a orientação** em uma página comum, principalmente no Safari do iPhone.
- A solução padrão é **detectar a orientação** e, em retrato, mostrar uma tela "Gire o celular", pausando o jogo.
- No Android, a orientação pode ser travada quando o jogo está em **tela cheia** ou instalado como aplicativo web (PWA). Isso fica para depois do protótipo.

### 2.4. O que pode ser aproveitado depois

O módulo de entrada (zonas, posse de toque, toque × segurar, cancelamento) é exatamente o que o jogo final vai usar. Se for escrito de forma isolada, ele pode ser **reaproveitado** no protótipo de pesca. Todo o resto (visual, painel de diagnóstico) é descartável.

---

## 3. Estrutura técnica sugerida

### 3.1. Princípios
- **Sem ferramentas de build** (sem npm, sem bundler). HTML + CSS + JavaScript puro, editável no VS Code.
- **Phaser 3 incluído como um único arquivo**, de preferência uma **cópia local** com a versão fixada (sem depender de internet durante o teste). Alternativa: CDN com versão exata.
- **Código modular:** cada responsabilidade em um arquivo.
- **Visual em greybox:** retângulos, círculos e texto.

### 3.2. Arquivos que seriam necessários

```
Hangover Fishing/
├── docs/                              (já existe)
│   └── PLANO_PROTOTIPO_MULTITOUCH.md  (este documento)
└── prototipos/
    └── p0-multitouch/
        ├── index.html                 Página que carrega tudo; configura a viewport para celular
        ├── style.css                  Bloqueio de zoom, rolagem, seleção de texto e menu de toque longo
        ├── lib/
        │   └── phaser.min.js          Phaser 3 (versão estável fixada, cópia local)
        ├── src/
        │   ├── main.js                Configuração do Phaser (tamanho, escala, nº de ponteiros) e cenas
        │   ├── input/
        │   │   └── PlayerZone.js      Zona de um jogador: posse de toques, toque × segurar, cancelamento
        │   └── scenes/
        │       ├── OrientationScene.js  Aviso "Gire o celular" em modo retrato
        │       └── MultitouchTestScene.js  As duas zonas, feedback visual e painel de diagnóstico
        └── RESULTADOS.md              Registro dos testes por aparelho (preenchido durante os testes)
```

| Arquivo | Responsabilidade | Aproveitável no jogo? |
|---|---|---|
| `index.html` | Estrutura da página, meta viewport, carregamento dos scripts | Parcialmente |
| `style.css` | Desativar gestos do navegador sobre o jogo | Sim |
| `lib/phaser.min.js` | Biblioteca | Sim |
| `src/main.js` | Configuração do jogo | Parcialmente |
| `src/input/PlayerZone.js` | **Núcleo do teste** | **Sim** |
| `src/scenes/OrientationScene.js` | Aviso de orientação | Sim |
| `src/scenes/MultitouchTestScene.js` | Tela de teste e diagnóstico | Não (descartável) |
| `RESULTADOS.md` | Evidência dos testes | Documentação |

A pasta `prototipos/` separa claramente o experimento do futuro código do jogo. **[PROPOSTA]**

### 3.3. O que a tela de teste mostra

**Para cada metade (Alemão à esquerda, ALE à direita):**
- A zona inteira acende quando está pressionada (cor da vara: vermelho / amarelo).
- O estado atual: `livre`, `pressionado`, `segurando`.
- Contadores: toques, segurares, cancelamentos.
- Duração do segurar atual.
- Quantidade de dedos ativos na zona.

**Painel de diagnóstico (texto pequeno no centro ou no topo):**
- Quadros por segundo (FPS).
- Orientação e tamanho da tela.
- Lista dos últimos eventos (`P1 toque`, `P2 segurar 1,4 s`, `P1 cancelado`).
- Botão para zerar os contadores.

**Mini-teste de reação (opcional, temporário):**
- Um círculo em cada metade acende em momentos aleatórios. O jogador toca assim que acender, e o protótipo registra o tempo de reação.
- Serve para medir se o toque "sente" imediato e para simular o futuro sinal de mordida da boia.

---

## 4. Principais riscos técnicos

| # | Risco | Impacto | Mitigação prevista |
|---|---|---|---|
| R1 | **Gestos do navegador** (zoom com dois dedos, toque duplo para zoom, rolagem, "puxar para atualizar", seleção de texto, menu de toque longo) interferem no jogo | Alto | CSS `touch-action: none`, bloqueio de seleção e de menu de contexto, viewport sem zoom; testar especificamente no Safari do iPhone, que ignora parte dessas regras |
| R2 | **Gestos do sistema nas bordas** (voltar deslizando da lateral, barra de início do iPhone, notificações do topo) | Médio | Medir se os toques perto das bordas são capturados; se necessário, definir uma margem interna nas zonas |
| R3 | **Zona presa como pressionada** após interrupção | Alto | Tratar o cancelamento como soltura; zerar o estado quando a página perde o foco ou fica oculta |
| R4 | **Limite de toques simultâneos** do aparelho (alguns Android baratos detectam só 2) ou "rejeição de palma" descartando toques | Médio | Testar em um aparelho simples; registrar o máximo de toques detectados |
| R5 | **Confusão entre toque e segurar** | Médio | Medir a taxa de erro com o limiar escolhido; ajustar |
| R6 | **Dedo atravessando o meio da tela** | Médio | Regra de posse do toque (seção 2.2) |
| R7 | **Orientação não pode ser travada** em navegador comum | Baixo | Tela "Gire o celular"; travar só em tela cheia/PWA no futuro |
| R8 | **Recortes de tela (notch) e áreas seguras** em modo horizontal | Baixo | Respeitar as áreas seguras do CSS; evitar informação importante nas bordas |
| R9 | **Tela cheia indisponível no iPhone** (o Safari do iPhone não permite tela cheia em páginas comuns) | Baixo | Aceitar barras do navegador no protótipo; avaliar "Adicionar à tela de início" depois |
| R10 | **Acesso do celular ao protótipo**: o arquivo aberto direto do computador não funciona no celular | Médio | Servir a pasta pela rede local (ex.: extensão Live Server do VS Code ou servidor simples), com computador e celular no mesmo Wi-Fi; alternativa: publicar em um endereço HTTPS temporário |
| R11 | **Vibração indisponível no iPhone** (relevante para feedback futuro) | Baixo | Não depender de vibração; apenas registrar se funciona em cada aparelho |
| R12 | **Desempenho** em aparelhos fracos | Baixo | Cena mínima; monitorar FPS |

---

## 5. Plano de testes

### 5.1. Aparelhos

| Prioridade | Aparelho | Navegador |
|---|---|---|
| Obrigatório | Pelo menos 1 celular Android | Chrome |
| Obrigatório | O celular que a família realmente vai usar para jogar | Navegador padrão |
| Recomendado | 1 iPhone, se disponível | Safari |
| Desejável | 1 Android simples/antigo | Chrome |

Registrar para cada aparelho: modelo, sistema, navegador, tamanho da tela.

### 5.2. Casos de teste

| ID | Caso | Como executar | O que observar |
|---|---|---|---|
| T1 | Orientação | Abrir em retrato e girar para horizontal e de volta | Aviso em retrato; zonas em horizontal; nada quebra ao girar |
| T2 | Toque simples por lado | 50 toques na esquerda e 50 na direita, um jogador por vez | Cada toque contado na zona certa |
| T3 | Segurar por lado | Segurar 3 s em cada lado, 10 vezes | Classificado como "segurar"; duração correta |
| T4 | Segurar simultâneo | Os dois seguram juntos por 10 s, 10 vezes | Ambas as zonas ativas o tempo todo |
| T5 | Segurar + toques do outro | P1 segura enquanto P2 toca 20 vezes rapidamente (e vice-versa) | O segurar não é interrompido; os 20 toques são contados |
| T6 | Toques simultâneos | Contagem "3, 2, 1, já" e os dois tocam juntos, 20 vezes | Os dois toques registrados |
| T7 | Arrastar pelo meio | Pressionar na esquerda, arrastar até a direita, soltar | O toque continua sendo da esquerda; a direita não reage |
| T8 | Soltar fora da tela | Pressionar e deslizar o dedo para fora da borda | A zona é liberada |
| T9 | Interrupções | Durante um segurar: receber notificação, trocar de app, bloquear a tela | Nenhuma zona fica presa ao voltar |
| T10 | Toque × segurar | 40 gestos alternados e anotados (toque, segurar, toque…) | Taxa de classificação correta |
| T11 | Gestos do navegador | 2 minutos tocando e segurando rápido com os dois jogadores, incluindo pinça e toque duplo | Sem zoom, rolagem, seleção, menu ou recarregamento |
| T12 | Dedos extras | Um jogador usa 2 dedos; depois 3 a 5 dedos na tela | O estado das zonas continua coerente; registrar o máximo detectado |
| T13 | Bordas | Toques junto às bordas laterais, superior e inferior | Toques capturados; nenhum gesto do sistema disparado sem querer |
| T14 | Resistência | Uso contínuo por 10 minutos | FPS estável; sem travamento nem aquecimento anormal |
| T15 | Sessão real | Duas pessoas usam o mini-teste de reação por 5 minutos | Opinião dos dois: o controle parece imediato e justo? Mãos se atrapalham? |

### 5.3. Registro

Cada caso é anotado em `RESULTADOS.md`: aparelho, resultado (passou / falhou / parcial), números medidos e observações. Falhas recebem uma descrição do que aconteceu e, se possível, uma gravação de tela.

---

## 6. Critérios objetivos de sucesso

O teste é considerado **bem-sucedido** quando, **em pelo menos 2 aparelhos reais** (incluindo o celular que será usado para jogar):

| # | Critério | Meta |
|---|---|---|
| C1 | Toques simples atribuídos à zona correta (T2) | **100%** (100 de 100) |
| C2 | Segurar não interrompido por toques do outro jogador (T5) | **0 falhas** em 20 repetições por lado |
| C3 | Toques simultâneos registrados nas duas zonas (T6) | **≥ 95%** (19 de 20) |
| C4 | Arrasto pelo meio não troca a posse (T7) | **0 falhas** em 10 tentativas |
| C5 | Zonas presas após interrupção (T9) | **0** em 5 tentativas de cada tipo |
| C6 | Classificação correta de toque × segurar (T10) | **≥ 95%** com o limiar escolhido |
| C7 | Gestos indesejados do navegador (T11) | **0** ocorrências em 2 minutos |
| C8 | Desempenho (T14) | **≥ 55 FPS** médio, sem travamentos perceptíveis |
| C9 | Avaliação dos dois jogadores (T15) | Os dois respondem "sim" a: "o controle respondeu na hora?" e "você foi atrapalhado pelo outro?" → "não" |

**Resultados possíveis:**
- **Aprovado:** todos os critérios atendidos → avançar para o protótipo de pesca (Fase A).
- **Aprovado com ressalvas:** C1 a C5 atendidos, mas falhas em C6 a C9 → ajustar (limiar, margens, tamanho das zonas) e repetir só os casos afetados.
- **Reprovado:** falha em C1 a C5 → rever a abordagem de controle antes de seguir. Exemplos: zonas menores na parte inferior, em vez de metades inteiras; restrição de aparelhos.

---

## 7. Decisões que o teste vai alimentar

- Tamanho e posição das zonas de toque (pendência do GDD).
- Limiar entre toque e segurar.
- Necessidade de margens internas nas bordas.
- Aparelhos e navegadores mínimos suportados.
- Forma de distribuir o protótipo para teste (rede local × endereço HTTPS).

Preparação para teste futuro (fora do escopo do Protótipo 0): o painel de diagnóstico registra o início e o fim de cada toque. Esses dados ajudarão a avaliar depois a mecânica "soltar e tocar de novo dentro da janela de mordida" (GDD, seção 20, S1).

---

## 8. Estimativa de esforço

Pequena. O protótipo cabe em poucos arquivos curtos. O maior custo de tempo está nos **testes em aparelhos reais**, não na programação.

---

## 9. Situação da implementação (07/11/2026)

### 9.1. Estado

| Etapa | Situação |
|---|---|
| Implementação | **Concluída** em `prototipos/p0-multitouch/` |
| Testes automatizados da lógica | **18 de 18** passaram |
| Testes automatizados no navegador (multitouch simulado, Chromium) | **30 de 30** passaram |
| Testes em celulares reais (seção 5) | **Não executados** |
| Critérios de sucesso (seção 6) | **Não avaliados**: dependem dos testes reais |

Detalhes: `prototipos/p0-multitouch/RESULTADOS.md`. Instruções: `prototipos/p0-multitouch/README.md`.

### 9.2. Diferenças em relação ao plano (sem mudança de escopo)

| Item do plano | Implementado | Motivo |
|---|---|---|
| `src/input/PlayerZone.js` como único módulo de entrada | Dividido em `PlayerZone.js` (estado de uma zona) e `TouchRouter.js` (posse, cancelamentos, registro) | Separar responsabilidades e permitir testes sem navegador |
| Painel dentro de `MultitouchTestScene.js` | Extraído para `src/ui/DiagnosticsPanel.js` e `src/ui/TestMenu.js` | Cena menor e mais legível |
| Botão "zerar contadores" no painel | Menu HTML "☰ TESTES" com roteiro dos 10 testes, limiar ajustável, tela cheia e relatório copiável | Permite executar e documentar os testes no próprio celular |
| — | `tests/logica.test.js` (Node, sem dependências) e `tests/e2e-navegador.js` (opcional, requer Playwright) | Evidência automatizada |
| — | `README.md`, `lib/PHASER-LICENSE.md` | Instruções e licença da biblioteca |
| Mini-teste de reação (opcional) | **Não implementado** | Evitar antecipar a mecânica de fisgada, fora do escopo |
| Versão do Phaser "estável fixada" | **Phaser 3.90.0** (último da linha 3) | O GDD define Phaser 3; já existe Phaser 4, não adotado |
| Limiar toque × segurar "150–250 ms" | 200 ms inicial, ajustável de 100 a 500 ms no menu | Calibrar no celular |

### 9.3. Comportamentos técnicos descobertos
- O Phaser 3.90 entrega o cancelamento do sistema como `pointerup` com `pointer.wasCanceled = true`.
- O Phaser também cria ponteiros para toques que começam **fora do canvas** (evento `pointerdownoutside`). Sem tratamento, isso gerava erros falsos. Esses toques agora são ignorados.
- Ao receber `touchcancel`, o Phaser tenta bloquear um evento não bloqueável, e o navegador registra um aviso no console. É inofensivo.

---

## 10. Sequência de protótipos — P1: primeiro ciclo de pesca

**Data:** 08/11/2026 · **Missão:** "HANGOVER FISHING — MISSÃO P1" · **Pasta:** `prototipos/p1-pesca/` · **GDD:** seção 16.5

### 10.1. Sequência

| Protótipo | Pergunta | Situação |
|---|---|---|
| **P0** — multitouch | Duas pessoas conseguem tocar e segurar ao mesmo tempo, sem interferência? | Implementado; segundo o criador, funciona em celular real |
| **P1** — primeiro ciclo de pesca | Dois jogadores conseguem pescar ao mesmo tempo, de forma independente, com um ciclo compreensível? | **Implementado** · automatizados ✔ · **celular real: não executado** |
| Próximos (a definir) | Restante da Fase A (pontuação completa) e Fase B | Aguardam o resultado do P1 em celular e uma nova missão |

### 10.2. O que foi reaproveitado do P0

| Módulo do P0 | No P1 |
|---|---|
| `src/input/PlayerZone.js`, `src/input/TouchRouter.js` | **Cópias idênticas** (o teste R5 confere byte a byte) |
| `src/scenes/OrientationScene.js` | Cópia idêntica |
| `lib/phaser.min.js` (3.90.0) | Mesma cópia |
| `style.css` e proteções de gestos do `main.js` | Mesmas regras, com estilos novos para o menu e o painel |
| Ponte Phaser → TouchRouter da cena de teste | Mesmo código, em `FishingScene.js` |
| Rede de segurança (`reconcile`) e interrupções (`cancelAll`) | Mantidas; agora também pausam a pescaria |

Nada no P0 foi alterado.

### 10.3. Arquitetura do P1

`TouchRouter` (P0) → `FishingSession` → um `FishingPlayer` por jogador (máquina de estados, tensão, peixe e **gerador aleatório próprio**). A cena só desenha a partir de `snapshot()`. A lógica não depende do Phaser e é testada no Node. Detalhes: `prototipos/p1-pesca/README.md`, seção 3.

### 10.4. Riscos técnicos novos

| # | Risco | Mitigação no P1 |
|---|---|---|
| R13 | Um jogador influenciar os sorteios do outro (gerador aleatório compartilhado) | Um gerador por jogador; o teste 11a compara as pescarias evento por evento |
| R14 | Toque antes da mordida "guardado" e virando fisgada | Só um **novo** toque iniciado depois do sinal fisga (testes 3a–3c) |
| R15 | Resultado diferente conforme o FPS do aparelho | Simulação em passo fixo de 10 ms |
| R16 | Perder o peixe por interrupção do sistema | O tempo parado não conta; menu, retrato e página oculta pausam; travadas acima de 0,25 s são descontadas. **Lacuna (revisão 08/11/2026):** a perda de foco sem ocultar a página só encerrava os toques e não pausava. **Corrigida no Patch 01** (seção 11.0): `blur`, `visibilitychange`, `pagehide` e `freeze` congelam a pescaria até um toque. Interrupções que o navegador não sinaliza continuam indetectáveis |
| R17 | Áudio bloqueado até o primeiro toque; vibração inexistente no iPhone | O som é liberado no primeiro toque; o feedback visual nunca depende de som ou vibração |
| R18 | Rotação: o Phaser não reaplica a escala (visto na emulação de celular do Edge, também no P0) | `scale.refresh()` forçado após girar, só no P1; verificar no caso B11 |

### 10.5. Testes e critérios
- Automatizados: **35/35** (lógica) e **22/22** (navegador, multitouch simulado no Edge) na entrega inicial; **48/48** e **36/36** após o Patch 01. Simulação de balanceamento registrada (inalterada pelo patch).
- Celular real: roteiro B1–B14 e critérios da missão em `prototipos/p1-pesca/RESULTADOS.md` (Parte B). **Não executados.**

---

## 11. Ajustes pendentes do P1 — plano de implementação futura

**Origem:** revisão de direção criativa de 08/11/2026 (GDD, seção 16.6).
**Situação na revisão (histórico):** nenhum destes ajustes estava implementado. As tabelas 11.1 a 11.3 abaixo mantêm a lista original. **A situação atual está em 11.0.**

### 11.0. Situação após o Patch 01 (08/11/2026)

Missão "P1 PATCH 01 — Correções de gameplay e interrupções". A correção da perda de foco (D8) recebeu **prioridade máxima** na missão.

| Decisão | Aprovado | Implementado | Validado automaticamente | Validado em aparelho físico | Pendente |
|---|---|---|---|---|---|
| **D8** pausas e interrupções | ✔ | **✔ Patch 01**, dentro dos limites do navegador | ✔ lógica P01-1 a P01-5; navegador (blur e página oculta **simulados**) | ✘ | B11 em aparelho real; interrupções que o navegador não sinaliza continuam indetectáveis |
| **D4** espera preservada | ✔ | **✔ Patch 01** | ✔ P01-6, P01-6b | ✘ | B5, B9 |
| **D3** beliscadas sem som | ✔ | **✔ Patch 01** | ✔ P01-7, P01-8 | ✘ | B5 |
| **D7** cartões unificados | ✔ | **✔ Patch 01** | ✔ P01-9, P01-10 | ✘ | B10 |
| **D2** aviso do arremesso cancelado | ✔ | **✔ Patch 01** | ✔ P01-11; navegador | ✘ | B10 |
| **D9** vibração desligada por padrão | ✔ | **✔ Patch 01** | ✔ P01-12; navegador | ✘ | B6, B14 |
| **D1** recompensa por distância | ✔ | ✘ (só o medidor cíclico) | — | ✘ | Definição de balanceamento + implementação |
| **D5** legibilidade do risco | ✔ | Mecânica ✔; reforço visual ✘ (condicionado) | ✔ (mecânica) | ✘ | Só se B7/B8/B13 mostrarem confusão |
| **D6** resposta imediata | ✔ | ✔ (sem mudança) | ✔ | ✘ | — |
| **D10** câmera lateral | ✔ | Não se aplica ao P1 | — | — | Etapa futura de layout lateral |

**Testes após o patch:** lógica do P1 **48/48**; navegador **36/36**; P0 **18/18** (sem alteração).

**Como o D8 foi resolvido:** a pausa passou a ser da **sessão** (`FishingSession.pause/resume/interrupt`), não da cena. Uma interrupção encerra os toques e depois congela os dois jogadores (`FishingPlayer.pause/resume`), deslocando todos os prazos pelo tempo parado. Eventos usados: `blur`, `visibilitychange`, `pagehide`, `pageshow` (restauração do cache) e `freeze`. A retomada exige um toque na tela, que é consumido. O menu e a orientação retrato pausam e retomam sozinhos. Limites reais: `prototipos/p1-pesca/README.md`, seção 6.

### 11.1. Prioridade alta

| # | Decisão | Ajuste pendente | Comportamento atual | Onde no código (referência) | Como verificar depois |
|---|---|---|---|---|---|
| 1 | **D4** | Ao interromper o recolhimento vazio, **retomar o tempo de espera que faltava**, em vez de sortear outro. Garantir que nenhum toque prematuro gere penalidade escondida | Sorteia uma espera nova ao soltar no meio do recolhimento | `FishingPlayer.release()`, caso `REELING_EMPTY` (chama `_scheduleBite`) | Teste automático novo (espera restante preservada); B5 e B9 |
| 2 | **D3** | **Remover o bipe** das beliscadas (exclusivamente visuais). Conferir que a mordida continua com sinal visual e sonoro distinto | Bipe curto e baixo em cada beliscada | `Sfx.onEvent`, caso `beliscada`; comentário em `config.js` | B5 e B6 |
| 3 | **D7** | **Unificar o avanço dos cartões**: após 0,6 s, um novo toque avança qualquer cartão, inclusive o de mordida perdida (o toque continua registrado para medir reação, se for útil) | O cartão de mordida perdida não avança; o toque é contado como "atrasado" | `FishingPlayer.press()`, casos de resultado; `FishingScene.drawResult` (aviso "segure para arremessar de novo") | Ajustar o teste 12c; B10 |
| 4 | **D2** | **Feedback visual breve** quando o arremesso é cancelado por toque curto (ex.: "SEGURE PARA ARREMESSAR!"), sem interromper o ritmo | Nada aparece na tela; só o registro `arremesso-cancelado` | `FishingScene` (reagir ao evento `arremesso-cancelado`) | Captura de tela; B1, B2, B10 |

### 11.2. Prioridade média

| # | Decisão | Ajuste pendente | Observação |
|---|---|---|---|
| 5 | **D1** | **Recompensa por distância**: curto = mais acessível e rápido, peixes tendem a ser menores; médio = equilíbrio; longo = chance de peixes maiores e mais interessantes, briga potencialmente mais difícil | A relação exata (espécies, peso, espera, resistência) precisa de **definição de balanceamento pela direção criativa** antes de implementar. Hoje a distância só alonga a briga, o que desestimula arremessos longos |
| 6 | **D9** | **Vibração desligada por padrão**, com opção de ligar no menu | Hoje começa ligada (`main.js`: `toggles.vibracao` e `setToggle('vibracao', true)`; `index.html`: `aria-pressed="true"`; `Sfx.vibration = true`) |
| 7 | **D5** | **Avaliar a legibilidade do risco acumulado**; reforçar o indicador **somente se** o teste físico mostrar confusão | Depende de B7, B8 e B13. Sem mudança de código até lá |
| 8 | **D8** | **Documentar pausas e travadas**: feito nesta revisão (GDD 16.5/16.6; R16). **Pendência de código encontrada na revisão:** a **perda de foco** sem ocultar a página não pausa a pescaria | Recomendação técnica: tratar no próximo lote. A decisão D8 exige que a pausa não cause perda injusta, e essa lacuna pode fazer o peixe escapar com o painel de notificações aberto. **A prioridade é decisão da direção criativa**; foi mantida como média, conforme a missão |

### 11.3. Mantidos sem alteração prevista

| Decisão | Situação |
|---|---|
| **D6** | Resposta imediata na briga, sem o limiar de 200 ms. Já implementada conforme aprovado |
| **D10** | Câmera lateral 2D continua a direção visual oficial. O layout "de frente" do P1 é experimental. **Etapa futura:** adaptação e validação do layout lateral para dois jogadores, antes de qualquer arte final (a planejar em missão própria) |

### 11.4. Regras para a futura implementação
- Preservar o P0 e os módulos de entrada copiados dele (teste R5).
- Cada ajuste vem acompanhado de teste automatizado e atualização de `README.md`, `RESULTADOS.md` e GDD 16.6 (coluna "Implementação").
- Os testes físicos (B1–B14) podem ser feitos **antes** destes ajustes. Nesse caso, registrar no `RESULTADOS.md` que foi testada a versão de 08/11/2026, com os comportamentos atuais (bipe nas beliscadas, vibração ligada etc.).
