# Protótipo P1 — Protocolo de validação física (B1–B14)

**Versão do protocolo:** 1.0 · 08/11/2026
**Versão do jogo a testar:** P1 com Patch 01 e ajuste de UX "ARREMESSO CANCELADO", incluindo a revisão que estende o aviso ao menu e ao retrato (08/11/2026)
**Ordem recomendada:** preparação (seção 0) → **B5** → **B11** → demais casos (B1–B4, B6–B10, B12–B14)
**Situação:** **NÃO EXECUTADO.** Nenhum campo de resultado abaixo foi preenchido. O P1 não pode ser declarado funcional até este protocolo ser executado com pessoas.

Este é o **formulário de execução**. Os resultados resumidos (passou / falhou) vão depois para `RESULTADOS.md`, Parte B.

---

## 0. Regras gerais

### 0.1. Um aparelho de cada vez
- O jogo é **local**: em cada rodada, **duas pessoas dividem um único celular**, cada uma na sua metade da tela (Alemão à esquerda, ALE à direita).
- "Testar em dois aparelhos" significa repetir **todo** o protocolo em um celular e **depois** em outro. **Nunca** se joga em dois aparelhos ao mesmo tempo.
- Faça uma cópia desta folha por aparelho (ou preencha a coluna do aparelho correspondente).

### 0.2. Pessoas
- **Jogador 1 (J1):** metade esquerda (Alemão).
- **Jogador 2 (J2):** metade direita (ALE).
- **Anotador (opcional, recomendado):** segura o cronômetro, lê o DIAG e preenche esta folha. Se não houver, um dos jogadores anota entre os casos.

### 0.3. Preparação do aparelho (antes do B1)
1. Computador e celular na **mesma rede Wi-Fi**. Na pasta `Hangover Fishing`, ligar o servidor (`py -m http.server 8080 --bind 0.0.0.0` ou Live Server).
2. No celular, abrir `http://<IPv4 do computador>:8080/prototipos/p1-pesca/index.html?diag=1`.
3. Girar para a **horizontal**. No Android: ☰ MENU → **Tela cheia**.
4. Tocar uma vez na tela para **liberar o som**. Volume em nível audível.
5. Conferir no ☰ MENU: **Som ligado**, **Vibração desligada** (é o padrão). Só ligar a vibração quando um caso pedir.
6. Se possível, **ligar a gravação de tela** do celular. Ajuda muito a explicar falhas.
7. Antes de **cada** caso: ☰ MENU → **Reiniciar sessão**.
8. Ao terminar o aparelho: ☰ MENU → **Ver relatório** → copiar o texto → colar em `RESULTADOS.md`, seção B.4.

### 0.4. Como ler o DIAG (botão DIAG no topo)
| No painel | Significado |
|---|---|
| `IDLE (pronto)`, `CHARGING`, `WAITING`, `REELING_EMPTY`, `BITE`, `FIGHTING`, `CAUGHT`, `ESCAPED`, `LINE_BROKEN` | Estado de cada jogador |
| `dedo: PRESSIONADO / solto` | Se o jogo acha que aquele jogador está tocando |
| `mordida em: X s` | Tempo até a mordida. Durante o recolhimento aparece **(congelada enquanto recolhe)** |
| `JANELA: resta X de 1000 ms` | Tempo para fisgar depois da mordida |
| `tensão`, `frouxa`, `crítica` | Tensão e risco acumulado na briga |
| `prematuros`, `atrasados`, `recolh.vazios`, `capturas`, `fugas`, `rompidas` | Contadores |
| Rodapé: `erros de toque N` | Deve ficar **0** |
| Rodapé: `pausas N` | Quantas pausas o jogo registrou (interrupções, menu, retrato) |

### 0.5. Valores atuais do jogo (para saber o que esperar)
| Item | Valor |
|---|---|
| Limiar toque × segurar | 0,2 s |
| Tempo até a mordida | sorteado entre 2,5 e 8 s |
| Janela para fisgar | 1 s, com um **novo** toque |
| Linha rompe | ~1 s acumulado no vermelho |
| Peixe escapa | ~2 s acumulados no azul |
| Cartões de resultado | captura ~2,2 s; os demais ~1,6 s; um toque após 0,6 s avança |
| Avisos breves | "SEGURE PARA ARREMESSAR!" ~1,1 s; "ARREMESSO CANCELADO" ~1,3 s |

### 0.6. Ficha do aparelho
| Campo | Aparelho 1 | Aparelho 2 |
|---|---|---|
| Modelo | | |
| Sistema e versão | | |
| Navegador e versão | | |
| Tela (do rodapé do DIAG) | | |
| Tela cheia disponível? | | |
| Som funciona? | | |
| Vibração funciona quando ligada? | | |
| Data e quem testou | | |

### 0.7. Verificação inicial (rotação e multitouch)
| Verificação | Esperado | Aparelho 1 | Aparelho 2 |
|---|---|---|---|
| Girar para retrato | Aparece "Gire o celular" | | |
| Voltar para horizontal | A tela ocupa tudo, sem cortes nem esticamento | | |
| J1 e J2 seguram ao mesmo tempo | As duas barras de força enchem juntas | | |

---

## B1 — Ciclo completo do Alemão (J1)
| | |
|---|---|
| **Cenário** | Um jogador sozinho completa o ciclo inteiro |
| **Preparação** | Reiniciar sessão. J2 **não** toca na tela |
| **Ações** | J1 faz 3 pescarias: (1) segurar até a barra chegar perto do máximo e soltar; (2) esperar sem tocar; (3) quando a boia afundar ("!", borda piscando, bipe duplo), dar um **novo toque** rápido; (4) na briga, segurar para recolher e soltar quando a tensão subir para o laranja; (5) repetir até o peixe chegar à margem |
| **Esperado** | Arremesso visível; mordida em 2,5–8 s; fisgada; medidor de tensão ativo à esquerda; cartão "PEGOU!" com tipo de peixe, peso e "Capturado por ALEMÃO"; placar 🐟 sobe; a metade direita nunca reage |
| **Falha** | Qualquer etapa que não acontece; a metade direita reage; o jogo trava fora de "pronto"; "erros de toque" > 0 |

| | Aparelho 1 | Aparelho 2 |
|---|---|---|
| Resultado (passou / falhou) | | |
| Capturas / fugas / rompidas | | |
| Observações | | |

## B2 — Ciclo completo do ALE (J2)
| | |
|---|---|
| **Cenário** | O mesmo do B1, do outro lado |
| **Preparação** | Reiniciar sessão. J1 **não** toca na tela |
| **Ações** | As mesmas do B1, feitas por J2 na metade direita |
| **Esperado** | O mesmo do B1, com "Capturado por ALE" e o placar da direita; a metade esquerda nunca reage |
| **Falha** | A mesma do B1 |

| | Aparelho 1 | Aparelho 2 |
|---|---|---|
| Resultado | | |
| Capturas / fugas / rompidas | | |
| Observações | | |

## B3 — Pescaria simultânea
| | |
|---|---|
| **Cenário** | Os dois pescam ao mesmo tempo, livremente |
| **Preparação** | Reiniciar sessão. Cronômetro de 5 minutos |
| **Ações** | J1 e J2 pescam sem combinar nada durante 5 minutos |
| **Esperado** | **Critério principal: independência.** Nenhum comando de um muda o estado, a tensão ou o resultado do outro; "erros de toque" = 0. **Capturar não é obrigatório** |
| **Falha** | Um jogador perde o peixe, arremessa, recolhe ou fisga por causa do toque do outro; "erros de toque" > 0 |

| | Aparelho 1 | Aparelho 2 |
|---|---|---|
| Resultado (independência) | | |
| J1: capturas / fugas / rompidas (observado) | | |
| J2: capturas / fugas / rompidas (observado) | | |
| Houve ao menos uma pescaria concluída pelos dois ao mesmo tempo? | | |
| Observações | | |

## B4 — Independência sob pressão
| | |
|---|---|
| **Cenário** | Um briga enquanto o outro faz de tudo |
| **Preparação** | Reiniciar sessão. J1 arremessa e fisga um peixe |
| **Ações** | Enquanto J1 briga mantendo a tensão no verde, J2: (1) arremessa; (2) toca 20 vezes rápido; (3) segura para recolher a linha; (4) arrasta um dedo da direita até a metade esquerda e solta. Depois, inverter os papéis |
| **Esperado** | A briga de quem briga não muda em nenhum dos 4 momentos; o dedo arrastado continua sendo de quem começou o toque |
| **Falha** | Tensão, estado ou peixe de quem briga mudam por causa do outro |

| | Aparelho 1 | Aparelho 2 |
|---|---|---|
| Resultado (J1 brigando) | | |
| Resultado (J2 brigando) | | |
| Em qual momento falhou (1–4)? | | |
| Observações | | |

## ⭐ B5 — PRIORITÁRIO — Recolhimento durante a espera, toque antecipado e beliscadas
**Objetivo:** confirmar que (a) o tempo restante da espera é preservado, (b) não há mordida durante o recolhimento, (c) não há espera artificial adicional, (d) toques antecipados não fisgam e não ficam guardados, e (e) os jogadores entendem a beliscada (silenciosa) como sinal falso.

| | |
|---|---|
| **Preparação** | Reiniciar sessão. **DIAG ligado.** Para facilitar a medição, no ☰ MENU, ajustar **Espera mínima = 8000** e **Espera máxima = 8000** (ao final do B5, **Restaurar padrão**). O anotador acompanha `mordida em` no painel do jogador testado |

**Parte A — tempo preservado (fazer 3 vezes; depois repetir com J2)**
1. J1 arremessa. Esperar a boia cair.
2. Esperar ~2 s. Anotar `mordida em` (valor **A**).
3. J1 **segura** a zona. Aparece "Recolhendo a linha…"; o painel mostra `mordida em: X s (congelada enquanto recolhe)`. Anotar **X**.
4. Segurar por ~2 s. Conferir que **X não muda**.
5. **Soltar** antes de a linha voltar toda. Anotar `mordida em` (valor **B**).
6. Esperar sem tocar e cronometrar até a mordida.

| Esperado | Falha |
|---|---|
| **X ≈ A − 0,2 s** (o recolhimento começa depois de 0,2 s segurando); **X não muda** enquanto recolhe; **B ≈ X**; a mordida chega em ~B segundos depois de soltar | `mordida em` volta a um valor alto (novo sorteio); a mordida demora claramente mais que B (espera artificial); acontece mordida **durante** o recolhimento |

No registro do DIAG, as linhas `RECOLHER ... espera restante X s` e `ESPERA retomada: mordida em X s` devem mostrar o **mesmo** valor.

**Parte B — toque antecipado e dedo apoiado**
1. Durante a espera, J1 toca rápido 5 vezes, inclusive logo depois de uma beliscada (pequena afundada da boia, **sem som**).
2. Numa nova espera, J1 apoia o dedo pouco antes da mordida e o **mantém** até a mordida.
3. Com a mordida na tela, J1 solta e toca de novo dentro de 1 s.

| Esperado | Falha |
|---|---|
| (1) Nada acontece; `prematuros` sobe 5. (2) O dedo apoiado **não** fisga (a mordida passa ou o recolhimento começa, sem fisgar). (3) O novo toque fisga | Algum toque antecipado fisga; uma mordida é fisgada sem novo toque |

**Parte C — observação livre (2 minutos de jogo normal, os dois)**
- Contar quantas vezes um toque "nervoso" virou recolhimento **sem a pessoa querer**.
- Perguntar a cada jogador: "O que significavam as afundadinhas da boia antes da mordida?"

| | Aparelho 1 | Aparelho 2 |
|---|---|---|
| Parte A — valores A / X / B / tempo real até a mordida (3 tentativas) | | |
| Parte A — resultado | | |
| Houve mordida durante o recolhimento? | | |
| Parte B — resultado | | |
| `prematuros` no fim | | |
| Recolhimentos acidentais (Parte C) | | |
| Resposta sobre as beliscadas (J1 / J2) | | |
| Observações | | |

## B6 — Fisgada no tempo e atrasada
| | |
|---|---|
| **Cenário** | Reação à mordida |
| **Preparação** | Reiniciar sessão (restaurar o padrão se veio do B5). Vibração **desligada** |
| **Ações** | Cada jogador fisga 10 mordidas o mais rápido possível; depois deixa passar 3 mordidas sem tocar e, em outra, toca de propósito bem depois. Repetir 3 mordidas com **Vibração ligada** no menu e perguntar se a vibração do outro jogador confundiu |
| **Esperado** | Toque rápido fisga; `última reação` aparece em ms. Sem toque ou com toque tarde: cartão "ESCAPOU! Não deu tempo de fisgar (janela de 1,0 s)" |
| **Falha** | "Toquei a tempo e não fisgou" (anotar a reação mostrada); a mensagem não é entendida |

| | Aparelho 1 | Aparelho 2 |
|---|---|---|
| Fisgadas no tempo (de 10), J1 / J2 | | |
| Mediana das reações (do relatório) | | |
| Casos de "toquei e não fisgou" | | |
| A vibração confundiu? (quando ligada) | | |
| Observações | | |

## B7 — Linha rompida
| | |
|---|---|
| **Preparação** | Reiniciar sessão. Fisgar um peixe |
| **Ações** | Segurar a zona sem soltar até o fim |
| **Esperado** | Tensão passa pelo laranja e chega ao vermelho; borda pisca em vermelho; bipe agudo e rápido; vara treme; em ~1 s no vermelho: "LINHA ROMPEU!" |
| **Falha** | A linha não rompe; o aviso não é percebido **antes** de romper |

| | Aparelho 1 | Aparelho 2 |
|---|---|---|
| Resultado | | |
| O aviso foi percebido antes? | | |
| Observações | | |

## B8 — Fuga por linha frouxa
| | |
|---|---|
| **Preparação** | Reiniciar sessão. Fisgar um peixe |
| **Ações** | Não tocar mais depois da fisgada |
| **Esperado** | Tensão desce ao azul; borda pulsa em azul; som grave repetido; em ~2 s: "ESCAPOU! A linha ficou frouxa demais" |
| **Falha** | O peixe não escapa; o jogador confunde com "linha rompeu" |

| | Aparelho 1 | Aparelho 2 |
|---|---|---|
| Resultado | | |
| Observações | | |

## B9 — Recolhimento vazio completo
| | |
|---|---|
| **Preparação** | Reiniciar sessão. Arremessar longe |
| **Ações** | (1) Segurar até "Recolhendo a linha…"; (2) soltar no meio; (3) segurar até a linha voltar toda; (4) sem tirar o dedo, esperar 1 s; (5) soltar e segurar de novo |
| **Esperado** | (1) Os metros diminuem; (2) volta a "Espere a boia AFUNDAR…" com a boia mais perto e a espera continua; (3) "pronto"; (4) **nada** acontece; (5) a barra de força começa na hora. `recolh.vazios` sobe; nenhuma perda |
| **Falha** | Mordida durante o recolhimento; o dedo antigo arremessa sozinho; alguma penalidade |

| | Aparelho 1 | Aparelho 2 |
|---|---|---|
| Resultado | | |
| Observações | | |

## B10 — Reinício, cartões e avisos
| | |
|---|---|
| **Preparação** | Reiniciar sessão |
| **Ações** | Conseguir os quatro cartões: captura, fuga por linha frouxa, linha rompida e mordida perdida. Em cada um: (a) uma vez, esperar sem tocar; (b) outra vez, tocar logo (antes de ~0,5 s) e depois tocar e segurar após ~1 s. Por fim, no estado "pronto", dar um toque rápido |
| **Esperado** | (a) O cartão some sozinho e volta a "pronto". (b) O toque imediato não avança; o toque após ~0,6 s avança e já carrega a força. **Igual nos quatro cartões.** Toque rápido no "pronto": "SEGURE PARA ARREMESSAR!" por ~1 s, sem travar |
| **Falha** | Algum cartão se comporta diferente; um toque acidental arremessa; o jogo fica preso fora de "pronto" |

| | Aparelho 1 | Aparelho 2 |
|---|---|---|
| Captura / fuga / rompida / mordida perdida | | |
| Aviso "SEGURE PARA ARREMESSAR!" | | |
| Observações | | |

## ⭐ B11 — PRIORITÁRIO — Interrupções do sistema e rotação
**Objetivo:** descobrir quais interrupções este aparelho e navegador **sinalizam** para o jogo, e confirmar que as sinalizadas não causam perda injusta nem toque fantasma.

**Preparação:** reiniciar sessão; DIAG ligado; um segundo celular por perto para ligar ou mandar mensagem, se possível. Antes de cada linha da matriz, anotar o contador **`pausas`** do rodapé do DIAG.

**Como aplicar cada interrupção**
1. Deixar **J1 brigando e segurando** a zona e **J2 esperando** (boia na água).
2. Aplicar a interrupção da linha, esperar ~5 s e voltar ao jogo.
3. Observar: apareceu **"PAUSADO — Toque na tela para continuar"**? O contador `pausas` subiu?
4. Tocar uma vez para continuar e conferir: J1 continua brigando, **sem** o dedo apoiado (`dedo: solto`); a tensão está onde estava; J2 continua esperando; o toque de retomada não fez nada além de retomar.
5. Repetir a linha **com J1 carregando um arremesso** (segurando no estado "pronto") no momento da interrupção. Ao retomar, deve aparecer **"ARREMESSO CANCELADO"** só na metade de J1, e nenhum arremesso deve começar sozinho.

**Esperado para uma interrupção detectada:** pausa com a tela "PAUSADO"; nada muda enquanto pausado (sem fuga, sem rompimento, a janela de mordida não acaba); ninguém fica "pressionado" ao voltar; o aviso "ARREMESSO CANCELADO" aparece só para quem carregava.
**Falha:** perda de peixe numa interrupção **detectada**; dedo "preso" como pressionado; o toque de retomada arremessa, recolhe ou fisga; o aviso aparece para quem não carregava; `pausas` sobe sem nenhuma interrupção (pausa falsa).

**Matriz de interrupções (preencher por aparelho)**

| # | Interrupção | Disponível? | "PAUSADO" apareceu? | `pausas` antes → depois | Briga preservada? | Toque fantasma? | "ARREMESSO CANCELADO" (caso carregando) | Observações |
|---|---|---|---|---|---|---|---|---|
| I1 | Trocar de aplicativo (botão/gesto de início e voltar) | | | | | | | |
| I2 | Abrir a lista de apps recentes e voltar | | | | | | | |
| I3 | Bloquear a tela (botão liga/desliga) e desbloquear | | | | | | | |
| I4 | Receber uma **chamada** (recusar ou atender e desligar) | | | | | | | |
| I5 | Alarme ou temporizador tocando | | | | | | | |
| I6 | **Puxar a barra/painel de notificações** e fechar | | | | | | | |
| I7 | Chegar uma **notificação flutuante** (mensagem) sem abrir | | | | | | | |
| I8 | Abrir a notificação e voltar ao navegador | | | | | | | |
| I9 | (iPhone) Central de controle | | | | | | | |
| I10 | Girar para retrato e voltar | | | | | | | Esperado: pausa e **continua sozinho** ao voltar para a horizontal, sem "Toque para continuar". No caso carregando: **"ARREMESSO CANCELADO"** só para quem carregava, ao voltar para a horizontal |
| I11 | Abrir e fechar o ☰ MENU (o outro jogador abre o menu enquanto J1 carrega) | | | | | | | Esperado: pausa e continua sozinho ao fechar. No caso carregando: **"ARREMESSO CANCELADO"** só para quem carregava, e **só depois de fechar o menu** (nunca com o menu aberto) |

**Eventos que o navegador NÃO detectou** (registrar separadamente; não é necessariamente defeito do jogo, mas limitação do sistema ou navegador)

| Aparelho | Interrupção (I#) | O que aconteceu no jogo durante a interrupção | Algum peixe foi perdido? | Observações |
|---|---|---|---|---|
| | | | | |
| | | | | |

**Pausas falsas** (o jogo pausou sem interrupção)

| Aparelho | Quando aconteceu (o que os jogadores estavam fazendo) | Quantas vezes |
|---|---|---|
| | | |

## B12 — Desempenho
| | |
|---|---|
| **Preparação** | DIAG ligado; bateria acima de 30%; cronômetro de 10 minutos |
| **Ações** | Os dois jogam sem parar por 10 minutos |
| **Esperado** | FPS ≥ 55 na maior parte do tempo; sem engasgos perceptíveis; aquecimento normal |
| **Falha** | FPS abaixo de 55 por períodos longos; engasgos que atrapalham; aquecimento anormal |

| | Aparelho 1 | Aparelho 2 |
|---|---|---|
| FPS típico / mais baixo | | |
| Em que situação caiu | | |
| Linhas "TRAVADA" no relatório | | |
| Observações | | |

## B13 — Compreensão de vitória e derrota
| | |
|---|---|
| **Preparação** | Depois de pelo menos 5 minutos de jogo, com perdas variadas. Perguntar a cada jogador **separadamente**, sem dar a resposta |
| **Ações** | Perguntar: "Por que você perdeu aquele peixe?" (para cada perda lembrada) e "O que a barra colorida mostra?" |
| **Esperado** | Os dois distinguem "linha rompeu" (segurou demais, vermelho) de "escapou" (linha frouxa/azul ou não fisgou a tempo) |
| **Falha** | Confundem os dois tipos de perda; dizem que a linha rompeu "do nada" |

| | Aparelho 1 | Aparelho 2 |
|---|---|---|
| Respostas de J1 (palavras exatas) | | |
| Respostas de J2 (palavras exatas) | | |
| Resultado | | |

## B14 — Diversão e ritmo
| | |
|---|---|
| **Preparação** | No fim da sessão |
| **Ações** | (1) **Observar sem perguntar:** os jogadores iniciam outra pescaria espontaneamente? Pedem para jogar de novo? (2) Depois perguntar: gostaram? A espera é longa? A briga é longa? Os sinais de mordida são claros? O medidor de força faz sentido? Vale a pena arremessar longe? O som (e a vibração, se testada) do outro atrapalhou? |
| **Esperado** | Não há resposta certa; registrar |
| **Falha** | — (este caso registra opinião e comportamento) |

| | Aparelho 1 | Aparelho 2 |
|---|---|---|
| Recomeçaram espontaneamente? Quantas vezes? | | |
| Respostas de J1 | | |
| Respostas de J2 | | |
| Durações das brigas e mediana de reação (do relatório) | | |

---

## Fechamento por aparelho
| | Aparelho 1 | Aparelho 2 |
|---|---|---|
| Relatório do menu colado em `RESULTADOS.md` (B.4)? | | |
| Gravações de tela salvas? Onde? | | |
| Falhas encontradas (IDs) | | |
