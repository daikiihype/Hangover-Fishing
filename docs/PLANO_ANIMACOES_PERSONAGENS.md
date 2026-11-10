# HANGOVER FISHING
## Plano das animações dos personagens — ALE e Alemão

**Versão:** 1.1 · **Data:** 09/11/2026
**Status:** estrutura geral **aprovada pela direção criativa** (09/11/2026), com ajustes técnicos incorporados nesta versão (seção 0). **Produção artística ainda não autorizada.** Nenhuma animação foi desenhada, nenhum spritesheet foi gerado e nada foi integrado ao jogo.

**Histórico:** v1.0 — plano inicial ([PROPOSTA]) · v1.1 — decisões aprovadas, âncora calculada a partir dos pixels reais, piscar como evento curto, REEL/FIGHT organizado em níveis 1–4.

---

## 0. Decisões da direção criativa (revisão de 09/11/2026)

| Item | Decisão | Status |
|---|---|---|
| Quadro | **96 × 96** para todas as animações | **[APROVADO — DIREÇÃO CRIATIVA]** |
| Âncora | **Fixa nos pés** | **[APROVADO — DIREÇÃO CRIATIVA]** · coordenadas finais calculadas na seção 3.2 |
| IDLE | 4 quadros, ciclo de 2,4 s, **com piscar rápido e ocasional** | **[APROVADO — DIREÇÃO CRIATIVA]** · piscar redefinido na seção 5.1 |
| CHARGE | 5 quadros | **[APROVADO — DIREÇÃO CRIATIVA]** |
| CAST | 4 quadros | **[APROVADO — DIREÇÃO CRIATIVA]** |
| REEL/FIGHT | 16 quadros, em **4 níveis × 4 posições da manivela**; a tensão do P1 escolhe o nível; a animação percorre só as 4 posições daquele nível; **sem progressão automática entre níveis** | **[APROVADO — DIREÇÃO CRIATIVA]** · seção 5.4 |
| CATCH | 4 quadros, pontual, **mantém a pose final** | **[APROVADO — DIREÇÃO CRIATIVA]** |
| FRUSTRATION | 4 quadros | **[APROVADO — DIREÇÃO CRIATIVA]** |
| Fisgada | Reutilizar o REEL/FIGHT com **curvatura média** por ~100 ms | **[APROVADO — DIREÇÃO CRIATIVA]** · ver a nota de numeração na seção 5.4.3 |
| Rostos | **Preservar os rostos aprovados.** Nenhuma expressão facial redesenhada nesta primeira versão (a única mudança de rosto é o piscar) | **[APROVADO — DIREÇÃO CRIATIVA]** |

**Ajustes obrigatórios incorporados:**
1. Âncora recalculada a partir dos **limites reais dos pixels visíveis**, incluindo a vara (seção 3.2).
2. Piscar como **evento breve** (100 ms) que não substitui o ciclo do IDLE nem fica parado (seção 5.1).
3. REEL/FIGHT reorganizado em **níveis 1 a 4**, cada um com 4 posições da manivela (seção 5.4).
**Referência visual aprovada:** `arte/personagens-base/alemao_idle_v4.png` e `arte/personagens-base/ale_idle_v4.png` (64 × 64), aprovados pela direção criativa. Esses PNGs **não serão alterados**.
**Referências de jogo:** GDD (seções 5.3, 6, 7, 14, 16.5–16.8) e `prototipos/p1-pesca/src/logic/config.js` (tempos atuais do P1).

---

## 1. Resumo das recomendações

1. **Quadro único de 96 × 96 para todas as animações** (inclusive IDLE). O 64 × 64 não comporta a vara levantada em CHARGE nem a vara ou o peixe erguidos em CATCH (cálculo na seção 3).
2. **Âncora fixa nos pés, no centro do quadro:** o sprite v4 entra no quadro deslocado de **(+30, +32)**, valor **confirmado pela medição dos pixels reais** na seção 3.2. Os pés (x 9–26 na v4) ficam em x 39–56, com centro em **47,5**, que é exatamente o eixo de espelhamento de um quadro de 96 px. A sola fica em y = 94 e o contorno, em y = 95. No Phaser: `setOrigin(0.5, 1)`. O espelhamento (`flipX`) para o jogador da direita mantém os pés exatamente no mesmo lugar.
3. **Pernas e botas nunca se movem** em nenhuma animação. Só o tronco, a cabeça, os braços, as mãos, a vara e o molinete se deslocam ou trocam de peça, no máximo 2 px de inclinação.
4. **Cabeça e roupas só por translação.** A cabeça e o tronco da v4 são reaproveitados pixel a pixel, apenas deslocados. Nenhum quadro redesenha rosto, cabelo, boné ou roupa. Expressões faciais ficam como **decisão em aberto** (seção 9).
5. **Animações dirigidas pelo estado do jogo, não só pelo tempo:**
   - **CHARGE** mostra a força atual do medidor.
   - **REEL/FIGHT** escolhe a curvatura da vara pela zona de tensão.
   - **CAST** é sincronizado com a saída da boia.
6. **A mesma linguagem para os dois personagens:** mesmos quadros, tempos, ângulos e pontos de articulação. Muda só a pele de cada um (cabeça, roupas, cores e equipamento).
7. **Total: 38 quadros por personagem** (37 + 1 quadro de piscar).

### Tabela-resumo

| # | Animação | Quadros | Duração | Reprodução | Dimensões |
|---|---|---|---|---|---|
| 1 | IDLE | 4 + 1 quadro de piscar (evento) | Ciclo de 2,4 s; piscar de 100 ms a cada 3–6 s | **Loop** + evento ocasional | 96 × 96 |
| 2 | CHARGE | 5 (2 de preparação + 3 de força) | Preparação 0,2 s; depois segue o medidor de força | **Pontual + quadro mantido pela força** | 96 × 96 |
| 3 | CAST | 4 | ~0,46 s | **Pontual** (termina em IDLE) | 96 × 96 |
| 4 | REEL/FIGHT | 16 (níveis 1–4 × 4 posições da manivela) | Manivela a 90 ms/quadro enquanto segura | **Loop só da manivela, dentro do nível escolhido pela tensão** | 96 × 96 |
| 5 | CATCH | 4 | ~0,7 s + quadro final mantido até o fim do cartão (≤ 2,2 s) | **Pontual** (com 2 quadros alternados opcionais) | 96 × 96 |
| 6 | FRUSTRATION | 4 | ~1,15 s | **Pontual** (termina em IDLE) | 96 × 96 |
| | **Total** | **38** por personagem (37 + piscar) | | | |

Spritesheet sugerido por personagem: 8 colunas × 5 linhas de 96 × 96 = **768 × 480 px** (40 posições, 38 usadas), PNG com alfa real.

---

## 2. Base técnica comum (vale para as seis animações)

### 2.1. Partes do personagem (herdadas da v4)
O gerador da v4 já separa o personagem em partes:

| Tipo | Partes | Nas animações |
|---|---|---|
| **Fixas** | Pernas, botas | **Nunca mudam nem se movem** |
| **Deslocáveis** | Cabeça, tronco (moletom) | Só translação de 0 a 2 px; nunca redesenhadas |
| **Trocáveis** | Braço de trás, braço da frente, mãos | Uma peça desenhada por pose (por exemplo: "mãos no quadril", "mãos no ombro", "braço à frente", "braço erguido", "mão na cabeça") |
| **Calculadas** | Vara, molinete | Posicionadas pelos pontos de articulação de cada quadro (cabo, assento do molinete, ponta, curvatura) |

### 2.2. Pontos de articulação (coordenadas da v4 → no quadro de 96 × 96)

| Ponto | v4 (64 × 64) | Quadro 96 × 96 (+30, +32) |
|---|---|---|
| Ombro de trás | (10, 22) | (40, 54) |
| Ombro da frente | (23, 22) | (53, 54) |
| Mão de baixo (cabo) | (14, 35) | (44, 67) |
| Mão de cima (assento do molinete) | (23, 30) | (53, 62) |
| Fim do cabo | (11, 39) | (41, 71) |
| Assento do molinete | (24, 31) | (54, 63) |
| Ponta da vara | (48, 17) | (78, 49) |
| Sola (linha de base) | y = 62, x 10–25 | y = 94, x 40–55 |

Comprimentos da vara (constantes em todos os quadros): **cabo → assento 15 px**, **assento → ponta 28 px**, total **43 px**. A vara gira em torno das mãos, mas nunca muda de comprimento. Em REEL/FIGHT, a curvatura dobra a vara sem encurtá-la.

### 2.3. Como manter os pés e a linha de base
- Pernas e botas são carimbadas **na mesma posição** em todos os quadros.
- O gerador das animações deve **conferir automaticamente** que a linha da sola (y = 94) e os pixels das pernas e das botas são **idênticos** em todos os quadros. Se não forem, ele falha.
- Inclinações (para trás na briga, para a frente no arremesso, ombros caídos na frustração) movem só o tronco e a cabeça, no máximo **2 px**. O tronco cobre 1 px da cintura da calça para nunca abrir buraco entre moletom e calça.

### 2.4. Como evitar mudanças involuntárias em rosto, roupa e proporções
- A cabeça e o tronco são **a mesma matriz da v4**, só transladada. O gerador deve comparar cada quadro com a v4 deslocada e falhar se algum pixel de cabeça ou tronco mudar.
- **Paleta fechada:** só as cores da v4 de cada personagem são permitidas. Exceção: o peixe em CATCH, que é desenhado pelo jogo como objeto separado.
- Peças novas de braço usam as mesmas cores do moletom (`j`, `J`, `i`) e da pele (`s`, `S`), com o mesmo contorno (`#1b1622`) e a mesma luz (vinda da esquerda).
- Proporção fixa: a altura do personagem continua 61 px (Alemão, com boné) e 60 px (ALE) no quadro de descanso.
- A vara mantém a margem mínima de **3 px** da borda do quadro (a regra que já existe no gerador da v4).

### 2.5. Integração futura no Phaser (sem fazer agora)
- Um spritesheet por personagem, quadros de 96 × 96, `this.anims.create` com os nomes `idle`, `charge`, `cast`, `reel`, `catch`, `frustration`.
- **`setOrigin(0.5, 1)`**: a posição do sprite é o ponto entre os pés, no chão.
- **Escala inteira** (×1 ou ×2, conforme o layout lateral que ainda vai ser definido; decisão D10 do GDD) e `pixelArt: true` / `roundPixels`, para não borrar.
- O jogador da metade direita usa `flipX`. Com os pés centralizados no quadro, o espelhamento não desloca a figura.
- **Um arquivo de dados por personagem** (JSON) com, para cada quadro, a posição da **ponta da vara** (onde o jogo prende a linha de pesca) e da **mão da frente** (onde o jogo prende o peixe em CATCH). A linha e o peixe continuam sendo desenhados pelo jogo, como no P1.

---

## 3. 64 × 64 é suficiente? Análise do tamanho do quadro

| Pose | Onde fica a vara (coordenadas do 64 × 64) | Cabe em 64 × 64? |
|---|---|---|
| IDLE (v4) | Ponta em (48, 17) | Sim (margens: 11 · 15 · 17 · 23 px) |
| CAST, vara à frente ~20° acima da horizontal | Assento ≈ (28, 26) → ponta ≈ (54, 16) | Por pouco (9 px da borda direita) |
| **CHARGE, vara vertical sobre a cabeça** | Assento ≈ (20, 16) → ponta ≈ (20, **−12**) | **Não:** sai 12 px pelo topo |
| **CHARGE no máximo, vara 45° para trás** | Assento ≈ (20, 16) → ponta ≈ (0, **−4**) | **Não:** sai pelo topo e encosta na esquerda |
| **CATCH, vara erguida na mão de trás** | Ponta acima da cabeça | **Não** |
| FRUSTRATION, vara caída à frente | Ponta ≈ (50, 56) | Sim |

**Conclusão:** como a vara tem 28 px do molinete à ponta, **qualquer pose com a vara levantada passa do topo de um quadro de 64 px de altura**. Por isso, o **96 × 64** sugerido como alternativa **resolveria a largura, mas não a altura**.

| Opção | Prós | Contras |
|---|---|---|
| 64 × 64 para tudo | Igual à v4 | Corta a vara em CHARGE e CATCH. **Descartada** |
| 64 × 64 para algumas animações e 96 × 64 para CHARGE/CAST | Quadros menores | Dois tamanhos e duas âncoras no Phaser; **ainda corta a vara no topo**. **Descartada** |
| 96 × 80 para tudo | Cabe a vara vertical (sobram ~4 px acima) | Margem apertada em CHARGE com inclinação; pouca folga para CATCH |
| **96 × 96 para tudo (recomendado)** | Um tamanho e uma âncora; ~32 px livres acima da cabeça e ~38 px de cada lado; espelhamento sem deslocamento; vara sempre ≥ 3 px da borda | Mais área transparente (custo de memória desprezível: spritesheet de 768 × 480 ≈ 1,5 MB por personagem descomprimido) |

**Decisão aprovada:** **96 × 96 para as seis animações**, com âncora nos pés. O IDLE em 96 × 96 é a v4 sem nenhuma alteração, só deslocada. Os PNGs aprovados de 64 × 64 continuam como referência e não são modificados.

### 3.2. Centralização e âncora — cálculo a partir dos pixels reais (v1.1)

**Medição** dos pixels visíveis (alfa = 255) de `alemao_idle_v4.png` e `ale_idle_v4.png`, em leitura apenas:

| Recorte (coordenadas da v4, 64 × 64) | Alemão | ALE | Centro horizontal |
|---|---|---|---|
| **Silhueta completa, com vara e molinete** | x 8–48 · y 3–63 (41 × 61 px) | x 8–48 · y 4–63 (41 × 60 px) | x = 28 |
| **Corpo sem equipamento** (com contorno) | x 8–28 · y 3–63 (21 px de largura) | x 8–28 · y 4–63 (21 px) | x = 18 |
| **Pés** (botas e contorno, y 59–63) | x 9–26 | x 9–26 | **x = 17,5** |
| Sola (linha de base) | y = 62, x 10–25 | y = 62, x 10–25 | x = 17,5 |
| Vara e molinete | x 11–48 · ponta em (48, 17) | x 11–48 · ponta em (48, 17) | — |

**Conclusões:**
- O arquivo 64 × 64 **não** está centralizado: o centro do arquivo é x = 31,5. A silhueta completa tem o centro em x = 28, o corpo em x = 18 e os pés em x = 17,5.
- A **silhueta completa não serve de referência para a âncora**, porque a vara muda de lado conforme a animação (para trás no CHARGE, para a frente no CAST, para cima no CATCH). Centralizar pela silhueta faria o personagem "andar" dentro do quadro a cada animação.
- A referência estável é o **centro dos pés** (x = 17,5), igual nos dois personagens e em todos os quadros, porque pernas e botas nunca se movem.

**Opções avaliadas:**

| Opção | Deslocamento | Pés no quadro | Efeito do `flipX` | Avaliação |
|---|---|---|---|---|
| Centralizar o arquivo 64 × 64 | (+16, +32) | centro em x = 33,5 | Os pés pulam 28 px ao espelhar | Descartada |
| Centralizar a silhueta completa do IDLE | (+20, +32) | centro em x = 37,5 | Os pés pulam 20 px ao espelhar; muda o centro em cada animação | Descartada |
| **Centralizar os pés (recomendado)** | **(+30, +32)** | **centro em x = 47,5**, que é exatamente o eixo do quadro (95 ÷ 2) | **Os pés ficam no mesmo lugar** (x 39–56 → 39–56 espelhado) | **Adotada** |

**Coordenadas finais de posicionamento** (iguais para os dois personagens):

| Item | Valor |
|---|---|
| Deslocamento da v4 dentro do quadro 96 × 96 | **(+30, +32)** |
| Pés (botas e contorno) | x 39–56, y 91–95; centro x = 47,5 |
| Sola (linha de base) | **y = 94**, x 40–55; contorno do chão em y = 95 (última linha) |
| Corpo no IDLE | x 38–58 |
| Silhueta completa no IDLE | Alemão: x 38–78, y 35–95 · ALE: x 38–78, y 36–95 |
| Margens da silhueta no IDLE | esquerda 38 · direita 17 · topo 35 (Alemão) / 36 (ALE) · base 0 (os pés tocam a última linha de propósito: é o ponto de apoio) |
| Âncora no Phaser | `setOrigin(0.5, 1)`: o ponto (48, 96) do quadro (meio da borda inferior) é o chão entre os pés |

**Margem segura em todos os quadros.** Previsão a partir das poses do plano (comprimento da vara: 15 px do cabo ao molinete, 28 px do molinete à ponta). O gerador das animações deve **medir de novo e falhar** se qualquer pixel ficar a menos de 3 px de uma borda (exceto os pés, que tocam a base de propósito):

| Pose mais extrema de cada animação | Ponta da vara (prevista) | Menor margem prevista |
|---|---|---|
| IDLE (v4) | (78, 49) | 17 px (direita) |
| CHARGE, força alta (vara 60° para trás) | ≈ (27, 35) | 27 px (esquerda) |
| CHARGE, preparação (vara quase vertical) | ≈ (45, 29) | 29 px (topo) |
| CAST 1 (vara passando pela vertical) | ≈ (59, 12) | **12 px (topo)** |
| CAST 3 (vara quase horizontal à frente) | ≈ (86, 56) | **9 px (direita)** |
| REEL/FIGHT nível 4 (curva forte) | abaixo de (72, 39) | > 20 px |
| CATCH (vara na mão de trás, para cima) | ≈ (27, 32) | 27 px (esquerda) |
| FRUSTRATION (vara caída à frente) | ≈ (82, 58) | 13 px (direita) |

Com `flipX`, as margens da esquerda e da direita só trocam de lado, e o mínimo continua ≥ 9 px. Nenhuma pose prevista chega perto do limite de 3 px.

---

## 4. Ligação com os estados do jogo (P1)

| Estado do P1 | Animação | Observação |
|---|---|---|
| `IDLE` (pronto) | IDLE | Sem linha |
| `CHARGING` | CHARGE | Preparação + quadro escolhido pela força do medidor |
| `CASTING` | CAST | A boia sai da ponta da vara no quadro 2 |
| `WAITING` | IDLE | Com a linha (desenhada pelo jogo) presa à ponta da vara de cada quadro |
| `REELING_EMPTY` | REEL/FIGHT, **nível 1** (vara reta) | Manivela girando |
| `BITE` | IDLE | A mordida é sinalizada na boia e na borda |
| `BITE` → `FIGHTING` (fisgada) | REEL/FIGHT, **nível 3** (curvatura média), ~100 ms | Depois segue o nível da tensão (seção 5.4.3) |
| `FIGHTING` | REEL/FIGHT | Nível escolhido pela zona de tensão; a manivela gira só enquanto o jogador segura |
| `CAUGHT` | CATCH | Cartão de 2,2 s; pode ser pulado após 0,6 s |
| `ESCAPED` / `LINE_BROKEN` | FRUSTRATION | Cartão de 1,6 s; pode ser pulado após 0,6 s |

Quando o cartão é pulado por um toque (após 0,6 s), a animação de resultado é interrompida e entra CHARGE, porque o toque já começa a carregar.

---

## 5. As seis animações

> Coordenadas no quadro de 96 × 96. "Deslocar" = mover a parte inteira, sem redesenhar. Durações iniciais **[PROPOSTA]**, a calibrar no teste em celular.

### 5.1. IDLE — aguardando
**Reprodução:** loop de 4 quadros + piscar como **evento** ocasional · **Quadros:** 4 + 1 (piscar) · **Ciclo:** 2,4 s

| Quadro | Descrição | Duração |
|---|---|---|
| 1 | **A v4 exatamente como foi aprovada** (deslocada +30, +32) | 700 ms |
| 2 | "Expirar": cabeça, tronco, braços, mãos, molinete e vara descem **1 px**; a ponta da vara desce 1 px | 500 ms |
| 3 | Igual ao quadro 1 | 700 ms |
| 4 | Balanço leve da ponta: a vara gira em torno das mãos, e a ponta sobe 1 px; o corpo fica como no quadro 1 | 500 ms |
| P (piscar) | **Igual ao quadro 1**, com os olhos fechados (só os pixels dos olhos mudam, ver abaixo) | **100 ms**, só como evento |

**Piscar — evento breve e ocasional (ajuste obrigatório da revisão):**
- O piscar **não faz parte do ciclo** e nunca fica parado. É um evento de **100 ms** que **substitui** uma parte do quadro 1 ou do quadro 3, os dois quadros longos (700 ms), que têm exatamente a mesma pose do quadro P.
- **Quando:** o jogo sorteia o próximo piscar para **3 a 6 s** depois do anterior. Quando chega a hora, espera o próximo quadro 1 ou 3 e pisca **no meio dele**: 300 ms de olhos abertos, 100 ms do quadro P e o restante do quadro com os olhos abertos. Assim, o ciclo de 2,4 s **não muda**.
- **Retorno natural:** depois dos 100 ms, volta ao mesmo quadro (1 ou 3) e o ciclo segue normalmente. Nunca há dois piscares seguidos nem piscar nos quadros 2 e 4 (que têm a cabeça deslocada), o que dispensa quadros extras.
- **Os dois jogadores piscam de forma independente:** cada um tem o seu sorteio, para não piscarem juntos.
- **Pixels do piscar:** só o olho muda. O brilho branco (`w`) e a pupila (`e`) de cada olho viram o tom de sombra da pele (`S`), formando a pálpebra fechada. Nada mais do rosto, do cabelo, do boné ou da barba muda, nem os pixels vizinhos aos olhos. É a **única** alteração de rosto permitida nesta versão (decisão aprovada). *(Ajuste da produção, 09/11/2026: a v1.1 citava um "contorno escuro por cima", mas isso exigiria alterar pixels fora dos olhos, o que a missão proíbe. Foi implementado só o tom `S` nos pixels dos olhos.)*
- **Produção (09/11/2026):** animação IDLE produzida em `arte/personagens-animacoes/idle/` para **revisão** (não aprovada). Detalhes, coordenadas e verificações no README dessa pasta. O quadro 4 foi produzido como **flexão só da metade da ponta** da vara (15 px), em vez de girar a vara inteira, para evitar que o traço "tremesse" ao longo de todo o comprimento.

- **Movimenta:** respiração (tronco e cabeça, 1 px) e ponta da vara (1 px).
- **Braços, mãos e equipamento:** como na v4. Mão de baixo no cabo, mão de cima no assento, molinete pendurado abaixo dela.
- **Inclinação:** nenhuma.
- **Pés:** fixos.
- **Rosto:** o aprovado; só o piscar fecha os olhos por 100 ms.

### 5.2. CHARGE — preparando e carregando o arremesso
**Reprodução:** pontual (preparação) + quadro mantido conforme a força · **Quadros:** 5

| Quadro | Descrição | Duração |
|---|---|---|
| 1 | Preparação: as duas mãos sobem até o peito; a vara fica quase vertical (ponta ≈ 15° para trás); tronco reto | 100 ms |
| 2 | Preparação: mãos na altura do ombro da frente; vara 30° para trás da vertical; ombros giram 1 px para trás | 100 ms |
| 3 | **Força baixa (0–33%)**: vara 40° para trás; tronco inclinado 1 px para trás | Enquanto a força estiver nessa faixa |
| 4 | **Força média (34–66%)**: vara 50° para trás; tronco 1 px para trás; mão de baixo mais à frente (alavanca) | Idem |
| 5 | **Força alta (67–100%)**: vara 60° para trás (ponta perto do limite de 3 px do quadro); tronco 2 px para trás | Idem |

- **Sincronização com o jogo:** o medidor do P1 vai e volta em 1,6 s (0 → 100% → 0). Depois da preparação, o jogo escolhe **o quadro 3, 4 ou 5 conforme a força atual**. A pose acompanha o medidor: quem solta no pico vê a vara no ponto mais para trás.
- **Toque curto (menos de 0,2 s):** o arremesso é cancelado. Volta pelos quadros 2 → 1 → IDLE em 60 ms cada, e o aviso "SEGURE PARA ARREMESSAR!" continua sendo exibido pelo jogo.
- **Movimenta:** os dois braços (peças "mãos no peito" e "mãos no ombro"), a vara e o tronco (0–2 px para trás). O molinete acompanha o assento, sempre pendurado abaixo da mão de cima.
- **Pés:** fixos. A inclinação para trás é só do tronco e da cabeça.
- **Espaço:** este é o motivo principal do quadro de 96 × 96 (seção 3).

### 5.3. CAST — lançamento
**Reprodução:** pontual, termina em IDLE · **Quadros:** 4 · **Total:** ~460 ms

| Quadro | Descrição | Duração |
|---|---|---|
| 1 | Chicotada: a vara passa pela vertical em direção à frente; mãos acima da cabeça, à frente | 60 ms |
| 2 | **Soltura**: vara 30° acima da horizontal, à frente; braços estendidos; tronco 1 px à frente. **A boia sai da ponta da vara neste quadro** | 80 ms |
| 3 | Acompanhamento: vara quase horizontal, apontando para a frente; tronco 1 px à frente | 120 ms |
| 4 | Assentamento: tronco volta; mãos descem para o quadril; vara volta ao ângulo da v4 | 200 ms |

- **Sincronização:** o voo da boia no P1 dura de 0,45 a 0,9 s (conforme a força). A animação termina em ~0,46 s e fica em IDLE enquanto a boia ainda voa. A linha sai da ponta da vara de cada quadro (ponto do JSON).
- **Movimenta:** braços (peças "braço acima, à frente" e "braço estendido"), vara e tronco (1 px à frente).
- **Pés:** fixos.

### 5.4. REEL/FIGHT — recolhendo e brigando
**Reprodução:** a tensão do P1 escolhe o **nível**; dentro do nível, a animação percorre **somente as 4 posições da manivela**, em loop, enquanto o jogador segura · **Quadros:** 16 (4 níveis × 4 posições)

#### 5.4.1. Os quatro grupos (níveis 1 a 4)

| Nível | Quadros | Zona de tensão do P1 que seleciona o nível | Vara | Corpo |
|---|---|---|---|---|
| **1** | 1–4 | Linha vazia (`REELING_EMPTY`) ou zona **frouxa** (abaixo de 0,20) | Reta, no ângulo da v4 | Como na v4 |
| **2** | 5–8 | Zona **segura** (0,20–0,65) | Curva leve: a ponta desce ~3 px | Como na v4 |
| **3** | 9–12 | Zona de **alerta** (0,65–0,85) | Curva média: a ponta desce ~7 px | Tronco e cabeça 1 px para trás |
| **4** | 13–16 | Zona **crítica** (0,85 ou mais) | Curva forte: a ponta desce ~12 px; vara mais levantada pelas mãos | Tronco e cabeça 2 px para trás |

Dentro de cada grupo, os 4 quadros são as **4 posições da manivela** na mesma ordem: **1 em cima · 2 à frente · 3 embaixo · 4 atrás**. Cada uma dura **90 ms**, ou seja, uma volta a cada 360 ms. A mão da frente acompanha a manopla com deslocamento de 1 px; a mão de baixo fica fixa no cabo.

Índice do quadro: **(nível − 1) × 4 + posição da manivela** (posição 1 a 4).

#### 5.4.2. Regras de reprodução
- **O nível nunca é animado automaticamente.** Não existe sequência "nível 1 → 2 → 3 → 4": o jogo troca de nível **só quando a zona de tensão do P1 muda**, e a troca é imediata (o quadro seguinte já sai no novo nível).
- **Ao trocar de nível, a posição da manivela é preservada.** Exemplo: estava no nível 2, posição 3 (quadro 7); a tensão entra em alerta → próximo quadro é o nível 3, posição 3 (quadro 11). A manivela não "pula" e a mão continua no mesmo lugar.
- **Segurando (recolhendo):** loop das 4 posições da manivela do nível atual (1 → 2 → 3 → 4 → 1…).
- **Soltando (aliviando):** a manivela **para** na posição em que estava; o nível continua acompanhando a tensão (que cai). Não são necessários quadros extras.
- A dica visual de perigo (borda piscando, sons) continua sendo do jogo, como no P1.

#### 5.4.3. Fisgada (decisão aprovada)
- No momento da fisgada (`BITE` → `FIGHTING`), mostrar por **~100 ms** um quadro de **curvatura média**, na posição 1 da manivela. Depois, a animação entra no nível indicado pela tensão.
- **Nota de numeração:** na versão 1.0 do plano, os níveis iam de 0 a 3, e a "curvatura média" era o **nível 2**. A decisão aprovada ("nível de curvatura 2") se referia a essa curva média. Com a numeração nova (1 a 4) pedida na revisão, a mesma curva média é o **nível 3 → quadro 9**. Este plano mantém a **intenção aprovada (curva média)**. Se a direção criativa quiser a curva leve, basta usar o **nível 2 → quadro 5**; nenhum quadro novo é necessário em nenhum dos casos.
- **Decisão confirmada pela direção criativa (09/11/2026) [APROVADO — DIREÇÃO CRIATIVA]:** a fisgada usa a **curva média** do REEL/FIGHT, ou seja, o **nível 3 (quadros 9–12)**, por **~100 ms**. O restante do planejamento não muda.

#### 5.4.4. Desenho
- **Curvatura convincente:** a vara é desenhada como um **arco** da mão de cima até a ponta, mantendo os 28 px de comprimento. A curva começa suave perto do molinete e fica mais forte perto da ponta. O cabo, entre as mãos, continua reto.
- **Movimenta:** mão da frente (manivela), vara (curvatura), tronco e cabeça (0–2 px para trás nos níveis 3 e 4).
- **Pés:** fixos. A briga se vê nos braços, na vara e na inclinação, sem abrir as pernas, para manter a linha de base.

### 5.5. CATCH — erguendo e comemorando
**Reprodução:** pontual; quadro final mantido até o cartão terminar (2,2 s) ou ser pulado (após 0,6 s) · **Quadros:** 4

| Quadro | Descrição | Duração |
|---|---|---|
| 1 | A vara passa para a mão de trás, apontando para cima e para trás; a mão da frente solta o molinete | 150 ms |
| 2 | Braço da frente sobe até a altura do ombro, mão fechada (é aqui que o jogo prende o peixe) | 150 ms |
| 3 | Braço da frente no alto (mão acima da cabeça), tronco 1 px para cima: comemoração | 200 ms |
| 4 | **Pose final:** braço da frente erguido, como no quadro 3, com o tronco de volta (0 px); o 3 → 4 forma um "pulinho" único | Mantido até o fim do cartão |

- **Decisão aprovada:** reprodução **pontual**, com a **pose final (quadro 4) mantida** enquanto o cartão estiver na tela. **Sem** alternar os quadros 3 e 4 em loop.
- **Peixe:** **não faz parte do sprite.** O jogo desenha o peixe, já existente nas folhas de peixes, preso ao ponto da mão da frente de cada quadro, na escala do peixe capturado. Assim, nenhuma espécie é "assada" no personagem.
- **Movimenta:** braço da frente (peças "ombro" e "erguido"), vara na mão de trás e tronco (1 px).
- **Pés:** fixos. O "pulinho" é só do tronco e da cabeça.

### 5.6. FRUSTRATION — fuga ou linha rompida
**Reprodução:** pontual, termina em IDLE (cartão de 1,6 s; pode ser pulado após 0,6 s) · **Quadros:** 4 · **Total:** ~1,15 s

| Quadro | Descrição | Duração |
|---|---|---|
| 1 | Desânimo: cabeça e ombros descem 1 px; a ponta da vara cai (vara 20° abaixo do ângulo da v4) | 150 ms |
| 2 | A mão da frente solta a vara e sobe até a cabeça (no boné do Alemão; no cabelo do ALE); a vara fica só na mão de baixo, caída à frente | 200 ms |
| 3 | Mão na cabeça, mantida; cabeça 1 px mais baixa | 600 ms |
| 4 | O braço desce e volta ao molinete; a vara volta ao ângulo da v4 → IDLE | 200 ms |

- **Base nas referências:** o último quadro de `sprite.jpg` (Alemão) e de `sprite 2.jpg` (ALE) mostra exatamente "mão na cabeça, vara baixa".
- **Mesma animação** para "escapou" e "linha rompeu". No rompimento, o jogo desenha a linha partida a partir da ponta da vara (como já faz no P1).
- **Movimenta:** braço da frente (peça "mão na cabeça"), vara (caída), cabeça e ombros (1 px).
- **Pés:** fixos.

---

## 6. Peças novas que serão necessárias (por personagem)
Todas desenhadas uma vez e reaproveitadas pelos quadros:

| Peça | Usada em |
|---|---|
| Braço da frente: mãos no peito | CHARGE 1 |
| Braços: mãos no ombro | CHARGE 2–5 |
| Braços: acima da cabeça, à frente | CAST 1 |
| Braços: estendidos à frente | CAST 2–3 |
| Mão da frente na manivela (4 posições, 1 px de diferença) | REEL/FIGHT |
| Braço da frente: na altura do ombro, mão fechada | CATCH 2 |
| Braço da frente: erguido | CATCH 3–4 |
| Braço de trás segurando a vara para cima | CATCH 1–4 |
| Braço da frente: mão na cabeça | FRUSTRATION 2–3 |
| Vara em arco (função de desenho com curvatura) | REEL/FIGHT |
| Manivela do molinete em 4 posições | REEL/FIGHT |
| Olhos fechados (só os pixels dos dois olhos) | IDLE, quadro P (piscar) |

A cabeça, o tronco, as pernas, as botas e as paletas **não ganham peças novas**. A única exceção é o quadro de piscar, que troca só os pixels dos olhos.

---

## 7. Linguagem comum e identidade individual

| Igual nos dois | Próprio de cada um |
|---|---|
| Quadros, tempos, ângulos da vara, pontos de articulação, inclinações, peças de braço (formato) | Cabeça (boné e cabelo castanho × cabelo grisalho), barba, pele, cores do moletom e das mangas, calça (jeans × camuflado), vara e molinete (vermelho × preto e amarelo) |

O mesmo gerador produz os dois personagens, trocando só a "pele". Assim, nenhum dos dois ganha movimentos que o outro não tem.

---

## 8. Produção futura e validação (quando for autorizada)
1. Gerador próprio das animações, partindo da v4 **sem modificá-la**, com saída em pasta separada (por exemplo, `arte/personagens-animacoes/`).
2. Verificações automáticas:
   - pés e sola idênticos em todos os quadros (sola em y = 94, x 40–55; pés em x 39–56);
   - cabeça e tronco idênticos à v4 (só translação), com uma única exceção, os pixels dos olhos no quadro de piscar;
   - paleta fechada;
   - todos os pixels visíveis a pelo menos 3 px das bordas, exceto os pés, que tocam a base;
   - alfa real;
   - quadros de 96 × 96;
   - deslocamento da v4 em (+30, +32) no quadro 1 do IDLE, idêntico pixel a pixel aos PNGs aprovados.
3. Prancha de revisão por animação (quadros lado a lado e em sequência) e uma prévia animada para a direção criativa.
4. Só depois da aprovação: integração no jogo, em missão própria.

---

## 9. Pontos em aberto para a direção criativa

### Resolvidos na revisão de 09/11/2026
1. ~~Tamanho do quadro~~ → **96 × 96** para todas as animações.
2. ~~Expressões faciais~~ → **rostos aprovados preservados**; nenhuma expressão redesenhada nesta primeira versão.
3. ~~Piscar no IDLE~~ → **sim**, como evento breve e ocasional (100 ms a cada 3–6 s; seção 5.1).
4. ~~Fisgada~~ → **reutilizar o REEL/FIGHT com curvatura média por ~100 ms**, sem animação nova (seção 5.4.3).
5. ~~Comemoração em loop~~ → **não**; o CATCH é pontual e mantém a pose final.

6. ~~Nível da fisgada~~ → **curva média: nível 3 (quadros 9–12), ~100 ms** (confirmado em 09/11/2026).
7. ~~Autorização para a produção artística~~ → **autorizada só a animação IDLE** (Alemão e ALE), em 09/11/2026. As demais continuam aguardando autorização.

### Ainda em aberto
1. **Escala no jogo (×1 ou ×2):** depende da etapa de layout lateral (decisão D10). Não precisa ser decidida para produzir os quadros.
