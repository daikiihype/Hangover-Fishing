# Hangover Fishing — Protótipo P1: primeiro ciclo de pesca

Primeiro protótipo **jogável**: dois jogadores pescam ao mesmo tempo, no mesmo celular, cada um na sua metade da tela, de forma independente.

Ciclo completo: **arremesso → espera → mordida e fisgada → briga (tensão) → captura**, com fuga, linha rompida e recolhimento da linha vazia.

- **Greybox:** só formas geométricas e texto. Nenhuma imagem do projeto foi usada nem alterada; nenhuma imagem nova foi gerada.
- **Sons temporários** sintetizados na hora (WebAudio). Não há arquivos de áudio.
- **Fora do escopo** (não implementado): progressão, loja, inventário, iscas, multiplayer online, menus definitivos, animações finais, diálogos, eventos especiais, Maria e Sirius em cena.

Referências: GDD v0.6 (seções 5, 6, 7, 16.5, 16.6) · `docs/PLANO_PROTOTIPO_MULTITOUCH.md` (seções 10 e 11) · `BALANCEAMENTO.md` · `RESULTADOS.md`.

> **Revisão criativa + Patch 01 + ajuste "ARREMESSO CANCELADO" (08/11/2026):** as decisões D1–D10 foram aprovadas pela direção criativa. O **Patch 01** implementou os ajustes de D2, D3, D4, D7, D8 e D9. Continuam pendentes D1 (recompensa por distância), D5 (só se o teste físico pedir) e a etapa futura do D10. Este README descreve o **comportamento atual** do código; a situação de cada decisão está na seção 7.

---

## 1. Como jogar

| Momento | Gesto | O que acontece |
|---|---|---|
| Pronto | **Segurar** | A barra de força enche e esvazia (vai e volta). Um círculo na água mostra onde a boia vai cair. |
| Carregando | **Soltar** | Arremessa. Força **e** momento da soltura decidem a distância. Soltar em menos de 0,2 s cancela (evita arremesso acidental) e mostra por ~1 s **"SEGURE PARA ARREMESSAR!"** na metade de quem tocou, sem pausa nem penalidade. |
| Boia na água | Tocar | **Ignorado**, sem penalidade. Nada fica guardado para depois. As **beliscadas** (pequenas afundadas da boia) são só visuais, sem som. |
| Boia na água | **Segurar** | Recolhe a linha vazia. Soltar no meio para o recolhimento e a espera **continua de onde estava** (o tempo de recolhimento não conta; não há novo sorteio). Não há mordida durante o recolhimento. Recolhida toda: novo arremesso imediato. |
| Mordida (boia afunda, **"!"**, borda piscando, bipe duplo; vibração só se ligada no menu) | **Novo toque** em até **1 s** | Fisga. Um dedo que já estava na tela antes da mordida **não** fisga: é preciso soltar e tocar de novo. |
| Mordida | Nada (ou toque tarde demais) | O peixe escapa. |
| Briga | **Segurar** | Recolhe a linha; a tensão sobe. |
| Briga | **Soltar** | Alivia; a tensão desce, e o peixe pode levar um pouco de linha. |
| Briga | Vermelho (crítica) por ~1 s acumulado | **Linha rompe.** |
| Briga | Azul (frouxa) por ~2 s acumulados | **Peixe escapa.** |
| Peixe chega à margem | — | **Captura automática**: cartão com o tipo de peixe, peso e quem pegou. |
| Resultado na tela (captura, fuga, linha rompida ou mordida perdida) | Esperar ~2 s, ou tocar após 0,6 s | Volta a "pronto". Tocar já começa a carregar o próximo arremesso. **Igual para os quatro cartões.** Um dedo que já estava na tela não avança o cartão nem arremessa. |
| Interrupção (perda de foco, troca de app, tela bloqueada, página oculta) | — | A pescaria dos dois **congela** (estado, tensão, peixe e prazos) e os toques são encerrados. Aparece **"PAUSADO — Toque na tela para continuar"**. O toque que retoma não conta como ação de ninguém. Quem estava **carregando** um arremesso perde só esse arremesso, sem penalidade, e ao retomar vê **"ARREMESSO CANCELADO"** por ~1,3 s na sua metade. |
| Menu aberto ou celular em retrato | — | Também congela; ao fechar o menu ou voltar para a horizontal, continua sozinho. Quem estava **carregando** um arremesso também vê **"ARREMESSO CANCELADO"** na volta (com o menu aberto, só depois de fechá-lo). |

**Medidor de tensão** (borda externa de cada metade): azul = frouxa · verde = segura · laranja = alerta · vermelho = crítica.
Ao lado, uma barrinha mostra o **risco acumulado**: vermelho descendo do topo (linha rompendo) e azul subindo da base (peixe escapando). O risco "descansa" devagar quando a tensão volta para a zona segura.

Os dois riscos também têm **sons diferentes**: bipe agudo e rápido = linha no limite; "bloop" grave = linha frouxa.
Com fone ou alto-falante estéreo, os sons do Alemão saem à esquerda e os do ALE à direita.

---

## 2. Arquivos

```
prototipos/p1-pesca/
├── index.html                  Página: carrega o Phaser, os módulos e o menu
├── style.css                   Proteções contra gestos do navegador (do P0) + menu e painel
├── lib/
│   ├── phaser.min.js           Phaser 3.90.0 (mesma cópia do P0)
│   └── PHASER-LICENSE.md
├── src/
│   ├── main.js                 Inicialização, proteção de gestos, interrupções, menu, relatório
│   ├── input/                  ── REAPROVEITADO DO P0, SEM ALTERAÇÃO ──
│   │   ├── PlayerZone.js       Estado de uma zona (dedos, toque × segurar)
│   │   └── TouchRouter.js      Posse dos toques, cancelamentos, rede de segurança
│   ├── logic/                  ── LÓGICA DA PESCA (sem Phaser) ──
│   │   ├── config.js           TODOS os parâmetros de balanceamento
│   │   ├── Random.js           Gerador aleatório com semente (um por jogador)
│   │   ├── FishingPlayer.js    Máquina de estados de UM jogador
│   │   └── FishingSession.js   Liga TouchRouter → dois FishingPlayer; registro da sessão
│   ├── audio/
│   │   └── Sfx.js              Sons temporários (WebAudio) e vibração
│   ├── scenes/
│   │   ├── FishingScene.js     Desenho em greybox (só lê o estado; não tem regra de pesca)
│   │   └── OrientationScene.js Aviso "Gire o celular" (cópia sem alteração do P0)
│   └── ui/
│       ├── DiagnosticsPanel.js Painel de diagnóstico (HTML, não captura toques)
│       └── Menu.js             Menu: liga/desliga, parâmetros ajustáveis, relatório
├── tests/
│   ├── logica.test.js          53 testes automáticos (só precisa do Node.js)
│   ├── simulacao-balanceamento.js  Simulação de brigas por perfil de peixe e estilo de jogo
│   └── e2e-navegador.js        Teste opcional no navegador com multitouch simulado (requer Playwright)
├── README.md                   Este arquivo
├── RESULTADOS.md               Relatório de testes (automáticos + resumo dos testes em celulares)
├── PROTOCOLO_VALIDACAO_FISICA.md  Formulário de execução dos testes físicos B1–B14
└── BALANCEAMENTO.md            Registro dos parâmetros e da simulação
```

O P0 (`prototipos/p0-multitouch/`) **não foi alterado**. O teste R5 confirma que os módulos copiados são idênticos aos do P0.

---

## 3. Arquitetura

```
 dedos na tela
      │
 Phaser 3 (um "ponteiro" por dedo)
      │  pointerdown · pointermove · pointerup · pointerdownoutside
      ▼
 FishingScene ── repassa os toques; a cada quadro chama session.update() e DESENHA
      │
      ▼
 TouchRouter (P0) ── decide o dono de cada toque (P1/P2), trata cancelamentos
      │  eventos "inicio" / "fim" / "cancelado"
      ▼
 FishingSession ── encaminha cada evento SÓ para o jogador dono da zona
      ├──► FishingPlayer P1 (Alemão)   estado, tensão, peixe, gerador aleatório próprio
      └──► FishingPlayer P2 (ALE)      estado, tensão, peixe, gerador aleatório próprio
      │
      └── registro da sessão ──► Sfx (sons) · DiagnosticsPanel · relatório
```

### Máquina de estados (cada jogador tem a sua)

`IDLE → CHARGING → CASTING → WAITING → BITE → FIGHTING → CAUGHT`, mais `REELING_EMPTY`, `ESCAPED` e `LINE_BROKEN`.

| De | Evento | Para |
|---|---|---|
| `IDLE` (pronto) | novo toque | `CHARGING` |
| `CHARGING` (carregando) | soltar após ≥ 0,2 s | `CASTING` |
| `CHARGING` | soltar antes de 0,2 s, ou cancelamento do sistema | `IDLE` (sem arremesso) |
| `CASTING` (boia no ar) | boia cai | `WAITING` |
| `WAITING` (esperando) | toque curto | continua `WAITING` (toque ignorado e não guardado) |
| `WAITING` | segurar ≥ 0,2 s | `REELING_EMPTY` |
| `WAITING` | tempo sorteado acaba | `BITE` |
| `REELING_EMPTY` (recolhendo) | soltar no meio | `WAITING` (a espera continua com o tempo que faltava; sem mordida durante o recolhimento) |
| `REELING_EMPTY` | linha toda recolhida | `IDLE` (sem penalidade) |
| `BITE` (mordida) | **novo** toque dentro da janela | `FIGHTING` |
| `BITE` | janela acaba, ou toque depois dela | `ESCAPED` (motivo `sem-reacao`) |
| `FIGHTING` (briga) | peixe chega à margem | `CAUGHT` |
| `FIGHTING` | tempo acumulado na zona crítica | `LINE_BROKEN` |
| `FIGHTING` | tempo acumulado na zona frouxa | `ESCAPED` (motivo `linha-frouxa`) |
| `CAUGHT` / `ESCAPED` / `LINE_BROKEN` | fim do tempo do resultado | `IDLE` |
| `CAUGHT` / `ESCAPED` / `LINE_BROKEN` | novo toque após 0,6 s | `CHARGING` (igual para todos os cartões, inclusive mordida perdida) |
| `CAUGHT` / `ESCAPED` / `LINE_BROKEN` | toque antes de 0,6 s | continua no cartão; registra **um** evento: `toque-atrasado` (mordida perdida) ou `toque-ignorado` (demais) |
| qualquer estado | interrupção / menu / retrato | **congelado** (pausa da sessão; nenhum estado muda) |

### Por que é assim

- **Lógica separada da apresentação.** `FishingPlayer` e `FishingSession` não usam o Phaser. A cena só lê `snapshot()` e desenha. Por isso os testes de lógica rodam no Node, em segundos.
- **Só um NOVO toque age.** A máquina recebe "um dedo começou" (`press`) e "um dedo saiu" (`release`). Dedos que já estavam na tela quando o estado mudou não disparam ações novas: não fisgam (regra da missão) e não arremessam sozinhos depois de uma captura.
- **Independência real entre jogadores.** Cada jogador recebe apenas os eventos da própria zona (posse do toque do P0) e tem o **próprio gerador aleatório**. Assim, o que um jogador faz não muda nem os sorteios do outro (tempo de mordida, peixe, peso). O teste 11a compara, evento por evento, a pescaria de P1 sozinho e a mesma pescaria com P2 fazendo de tudo ao lado: o resultado é idêntico.
- **Passo fixo de simulação (10 ms).** O resultado não depende da taxa de quadros do celular.
- **Pausa da sessão (D8, Patch 01).** `FishingSession.pause()` (menu, retrato) e `FishingSession.interrupt()` (perda de foco, página oculta, `pagehide`, `freeze`) primeiro encerram os toques ativos e depois **congelam os dois jogadores** (`FishingPlayer.pause()`). Na retomada, todos os prazos são empurrados pelo tempo parado (`resume()`). Interrupções do sistema só terminam com um toque na tela (`continueAfterInterruption()`); esse toque é consumido pela cena e não chega a nenhum jogador.
- **Travadas não detectadas.** Se a página parar mais de 0,25 s sem nenhum evento (navegador engasgou), o tempo excedente também é descontado dos prazos (evento `pausa`, mostrado como "TRAVADA" no diagnóstico).

---

## 4. Como executar

### No computador (só para conferir)
Dê dois cliques em `index.html`. Funciona com o mouse, mas **o mouse é um dedo só**: não testa dois jogadores.

### No celular (teste de verdade)
Igual ao P0 (veja `prototipos/p0-multitouch/README.md`, seção 4). Resumo:

1. **Na pasta `Hangover Fishing`**, ligue um servidor:
   - VS Code + **Live Server**: botão direito em `prototipos/p1-pesca/index.html` → *Open with Live Server*; ou
   - Terminal: `py -m http.server 8080 --bind 0.0.0.0`
2. Descubra o IPv4 do computador com `ipconfig` (ex.: `192.168.0.15`).
3. No celular, na **mesma rede Wi-Fi**, abra:
   `http://<IPv4>:<porta>/prototipos/p1-pesca/index.html`
4. Gire para a **horizontal**. No Android, **☰ MENU → Tela cheia**.
5. **Toque uma vez** em qualquer lugar para liberar o som (exigência dos navegadores).

Endereço com opções: `index.html?diag=1` abre com o painel de diagnóstico; `index.html?seed=1234` repete a mesma sequência de sorteios.

### Menu (☰ MENU) e diagnóstico (DIAG)
- O menu **pausa** a pescaria dos dois.
- **DIAG** mostra, para cada jogador: estado da máquina e há quanto tempo, dedo pressionado, distância, força, tempo até a mordida, janela restante, tensão e zona, risco acumulado (frouxa/crítica), peixe (perfil, peso, energia, fase, puxão), último tempo de reação e todos os contadores. Embaixo: FPS, semente e os últimos eventos. O painel não captura toques: pode ficar ligado durante o jogo.
- **Parâmetros de balanceamento** (janela de fisgada, espera, limites de tensão, velocidades, limiar toque × segurar) podem ser ajustados com − / + sem editar código. "Restaurar padrão" volta aos valores de `config.js`.
- **Ver relatório**: texto para copiar no `RESULTADOS.md`, com os parâmetros usados, contadores, tempos de reação, capturas e o registro completo.

---

## 5. Testes automatizados

Na pasta `prototipos/p1-pesca/`:

```
node tests/logica.test.js                 # 53 testes da lógica (só precisa do Node.js)
node tests/simulacao-balanceamento.js     # tabela de taxas de captura por perfil/estilo
```

`tests/e2e-navegador.js` joga de verdade num navegador Chromium/Edge com dois dedos simulados. Requer Playwright, que **não** faz parte do projeto. Exemplo, com a pasta servida na porta 8765:

```
node tests/e2e-navegador.js ./saida http://127.0.0.1:8765/prototipos/p1-pesca/index.html msedge
```

Resultados em `RESULTADOS.md`.

---

## 6. Limitações conhecidas

- **Não testado em celulares reais.** Toda a verificação foi automatizada (Node e Edge com toques simulados). O roteiro de teste em aparelho está em `RESULTADOS.md`, Parte B.
- **Balanceamento inicial.** Os valores de `config.js` vêm de simulação com jogadores virtuais, que leem a tensão com precisão perfeita. Pessoas vão errar mais; os valores precisam ser calibrados no celular (`BALANCEAMENTO.md`).
- **Toques repetidos (GDD S1):** a regra "novo toque depois da mordida" impede fisgar com o dedo apoiado, mas **toques muito rápidos e repetidos ainda podem cair dentro da janela**. Isso é esperado (GDD seção 20, observação técnica da opção d) e precisa ser observado no teste real (contador "prematuros" no painel).
- **Sons e vibração temporários.** A vibração começa **desligada** (D9) e pode ser ligada no ☰ MENU. No iPhone, o navegador não permite vibração. O som só começa depois do primeiro toque.
- **Limites reais da detecção de interrupções (D8).** O jogo só percebe uma interrupção quando o navegador avisa:
  - `visibilitychange` (página oculta): troca de aplicativo, tela bloqueada, outra aba. É o sinal mais confiável nos celulares.
  - `blur` (perda de foco): depende do navegador e do sistema. Em muitos aparelhos, **puxar a barra de notificações, abrir a central de controle (iPhone) ou uma notificação flutuante NÃO dispara nenhum evento**. Nesses casos, o jogo não sabe que houve interrupção e continua correndo.
  - `pagehide` / `freeze`: quando o navegador esconde ou congela a página (o `freeze` só existe em navegadores baseados no Chromium).
  - Chamada telefônica, alarme e assistente de voz normalmente ocultam a página ou tiram o foco, mas isso **não é garantido** em todos os aparelhos.
  - O que não é detectado continua coberto, em parte, pela regra das travadas: se o navegador parar de desenhar por mais de 0,25 s, o tempo parado não conta. Se ele continuar desenhando, a pescaria segue normalmente.
  - Pausas falsas: o jogo não pausa por toques nos botões DIAG ou MENU (que não tiram o foco da janela), nem durante o jogo normal (verificado no navegador automatizado). Em aparelho real, o contador "pausas" do DIAG deve ser conferido no caso B11 do `RESULTADOS.md`.
  - Ao interromper, um arremesso que estava sendo carregado é **cancelado** (o dedo foi encerrado), sem penalidade, e nenhum arremesso começa sozinho. Ao retomar, aparece "ARREMESSO CANCELADO" (~1,3 s) na metade de quem carregava, tanto nas interrupções do sistema quanto ao abrir o menu ou girar para retrato (revisão da direção criativa de 08/11/2026).
- **Botões DIAG e MENU** (centro do topo) não pertencem a nenhum jogador, como no P0.
- **Perfis de peixe** ("rápido", "pesado", "arisco") são perfis de jogabilidade provisórios, **não espécies reais** (GDD seção 8).
- **Layout greybox:** o rio é visto "de frente" (longe = mais acima). Isto é **apenas experimental** (decisão D10): a direção visual oficial é a câmera lateral 2D, e haverá uma etapa própria de adaptação do layout lateral para dois jogadores antes da arte final.
- **Proteção extra de rotação (só no P1):** na emulação de celular do Edge/Chromium, o Phaser às vezes não reaplicava a escala depois de girar a tela (o P0 se comporta igual nesse ambiente). O `main.js` do P1 força um `scale.refresh()` logo após `resize`/`orientationchange`.
- **Mensagem do Phaser no console ao receber `touchcancel`:** a mesma do P0; é inofensiva.

---

## 7. Decisões da direção criativa × situação no código

As dez decisões D1–D10 são **[APROVADO — DIREÇÃO CRIATIVA]** (revisão de 08/11/2026; GDD, seção 16.6). O **Patch 01** (08/11/2026) implementou o primeiro lote.
**Nenhuma decisão foi validada em aparelho físico.** "Validado automaticamente" significa testes de lógica (Node) e/ou navegador com toques simulados.

| Decisão | Implementado? | Validado automaticamente | Validado em aparelho físico | Pendente |
|---|---|---|---|---|
| D1 — medidor cíclico; distância com significado | Medidor: sim. Recompensa por distância: **não** | Medidor: testes 1b, 1c | Não | Recompensa por distância (aguarda definição de balanceamento) |
| D2 — toque curto cancela + aviso | **Sim (Patch 01)** | P01-11; navegador "P01 D2" | Não | — |
| D3 — beliscadas só visuais; mordida distinta | **Sim (Patch 01)** | P01-7, P01-8 | Não | Avaliar compreensão (B5) |
| D4 — espera continua após recolhimento interrompido | **Sim (Patch 01)** | P01-6, P01-6b, 9b | Não | Avaliar recolhimentos acidentais (B5) |
| D5 — risco acumulado | Sim (sem mudança) | 6, 6b, 7; simulação | Não | Reforço visual só se o teste mostrar confusão |
| D6 — resposta imediata na briga | Sim (sem mudança) | 11d, R3b; simulação | Não | — |
| D7 — cartões unificados | **Sim (Patch 01)** | P01-9, P01-10, 12c | Não | Revisar durações na fase de personagens |
| D8 — pausas e interrupções | **Sim (Patch 01)**, dentro dos limites do navegador (seção 6) | P01-1 a P01-5, R2, R3; navegador "P01 D8" (blur e página oculta simulados) | Não | Validar com interrupções reais (B11) |
| D9 — vibração desligada por padrão | **Sim (Patch 01)** | P01-12; navegador "P01 D9" | Não | — |
| Ajuste de UX: "ARREMESSO CANCELADO" quando a carga é cancelada por interrupção do sistema, menu ou retrato | **Sim** | P02-1 a P02-3b; navegador "P02", "P02 menu", "P02 retrato" | Não | B11 (caso carregando; linhas I10 e I11) |
| D10 — câmera lateral oficial | Greybox "de frente" segue experimental | — | — | Etapa futura de layout lateral |

Lista de pendências: `docs/PLANO_PROTOTIPO_MULTITOUCH.md`, seção 11.
