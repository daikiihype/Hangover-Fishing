# Animação CATCH — Alemão e ALE

**Status:** **CATCH PRODUZIDA — AGUARDANDO REVISÃO DO CRIADOR.** Não aprovada. Nada foi integrado ao P1.
**Data:** 11/11/2026 · **Plano:** `docs/PLANO_ANIMACOES_PERSONAGENS.md` (seção 5.5, aprovada; a animação não existia antes desta entrega) · **Entra a partir de:** REEL/FIGHT (`FIGHTING` → `CAUGHT`) · **Termina em:** IDLE
**Base imutável:** sprites v4, IDLE, CHARGE, CAST, REEL/FIGHT e FRUSTRATION (não alterados; conferidos por hash)

## Arquivos

| Arquivo | Conteúdo | Dimensões |
|---|---|---|
| `alemao_catch_spritesheet.png`, `ale_catch_spritesheet.png` | 4 quadros de 96 × 96 lado a lado (índices 0–3) | 384 × 96, alfa real |
| `quadros/<personagem>_catch_1.png` … `_4.png` | Cada quadro isolado | 96 × 96, alfa real |
| `catch.json` | Reprodução, pose final, saída, ponto de presa do peixe por quadro, âncora, coordenadas e medidas de continuidade | — |
| `previews/alemao_catch_x4.gif`, `previews/ale_catch_x4.gif` | Prévia ×4 com os tempos do P1 (sequência abaixo) | 384 × 384, 8,54 s |
| `previews/ambos_catch_x4.gif` | Os dois lado a lado | 768 × 384 |
| `previews/*_catch_quadros_x4.png` | Os 4 quadros ampliados ×4, sobre fundo | 1536 × 384 |
| `ferramentas/gerar_catch.js` | Gerador reproduzível: `node arte/personagens-animacoes/catch/ferramentas/gerar_catch.js` | — |

**Sequência das prévias:**
1. Briga no nível 2 → peixe recolhido → CATCH, com o quadro 4 parado durante todo o cartão de 2,2 s → saída → IDLE.
2. O mesmo a partir de uma briga no nível 4.

O GIF repete só para a revisão; **a animação em si é pontual, sem loop**. O fundo azul também é só da revisão. **O peixe não aparece**, porque é desenhado pelo jogo (abaixo).

## O movimento (plano 5.5) e a personalidade

| Quadro | Plano | Alemão — espontâneo | ALE — tranquilo e experiente |
|---|---|---|---|
| 1 · Troca de mão (150 ms) | A vara passa para a mão de trás, apontando para cima e para trás; a mão da frente solta o molinete | Vara a ~20° da vertical; mão da frente livre, no peito | Vara a ~25° da vertical; mão da frente livre, no peito |
| 2 · Peixe no ombro (150 ms) | Braço da frente na altura do ombro, mão fechada; **o jogo prende o peixe aqui** | Punho na altura do ombro, já subindo; a vara sobe junto | Punho à frente, na altura do ombro: mostra o peixe |
| 3 · Pulinho (200 ms) | Braço no alto; tronco e cabeça 1 px para cima | **Peixe erguido bem alto** (mão na altura do boné) e **vara levantada**: os dois braços para cima | Peixe levantado um pouco (3 px) à frente; a vara continua apoiada, inclinada para trás |
| 4 · **Pose final** (mantida) | Igual ao 3, com o tronco de volta (0 px): o 3 → 4 é um pulinho único | Igual ao 3, 1 px mais baixo | Igual ao 3, 1 px mais baixo |

- **As diferenças ficam nos limites do plano:** mesmos 4 quadros, mesmos tempos e o mesmo pulinho de 1 px (só tronco e cabeça; pés fixos). O que muda é a altura do braço do peixe, a altura da vara e o braço de trás.
- **O rosto não muda** (só deslocamento de 1 px no pulinho). A satisfação aparece na postura.

## Reprodução e tempos

| Fase | Quadros | Duração |
|---|---|---|
| **Entrada** | 1 → 2 → 3 → **4** | 150 → 150 → 200 ms; o 4 fica **parado** |
| **Pose final** | 4 | Até o fim do cartão de captura. No cartão de 2,2 s do P1, fica **1.700 ms** na tela |
| **Cartão pulado** (toque após 0,6 s) | — | O P1 começa a carga: troca imediata para o CHARGE (plano, seção 4) |
| **Saída** (fim do cartão, `CAUGHT` → `IDLE`) — **PROPOSTA** | 4 → **2 → 1** → IDLE | 100 ms → 100 ms |

- **Sem loop:** a entrada toca uma vez e para no quadro 4. Não há alternância 3 ↔ 4 (decisão aprovada do plano).
- **Phaser 3:** `frameWidth: 96, frameHeight: 96`, índices 0–3.
  - **Entrada:** animação pontual `[0, 1, 2, 3]` com `repeat: 0`; ao terminar, o sprite fica parado no quadro 3 (índice).
  - **Saída:** `[1, 0]`, tocada quando o P1 voltar ao IDLE.
  - Os tempos estão em `catch.json`.

## Peixe (para a integração)
- **O peixe não faz parte do sprite** (plano 5.5). O jogo o desenha a partir do **quadro 2**, preso a `pontos.<personagem>[i].maoDaFrente`, na escala do peixe capturado.
- **Recomendação:** pendurar o peixe **para baixo e para fora** a partir da mão (para a direita, ou para a esquerda com `flipX`).
  - No Alemão, nos quadros 3 e 4, a mão fica ao lado do boné, a **5 px** da borda da cabeça (`espacoAteACabecaPx`). Um peixe centrado na mão e com mais de ~10 px de largura encostaria no rosto.

## Coordenadas (quadro 96 × 96)

| Quadro | Alemão: mão da frente (peixe) · mão de trás · ponta da vara | ALE: mão da frente (peixe) · mão de trás · ponta da vara |
|---|---|---|
| 1 | (56, 58) · (40, 64) · (30, 38) | (56, 59) · (40, 65) · (28, 40) |
| 2 | (59, 49) · (39, 62) · (32, 35) | (60, 53) · (39, 65) · (27, 40) |
| 3 | (60, 40) · (37, 58) · (32, 30) | (61, 50) · (39, 64) · (27, 39) |
| 4 | **(60, 41)** · (37, 59) · (32, 31) | **(61, 51)** · (39, 65) · (27, 40) |

**Âncora (igual às outras animações):** v4 deslocada (+30, +32); pés em x 39–56, y 91–95; sola em **y = 94**; `setOrigin(0.5, 1)`.

## Verificações (o gerador falha se alguma não passar)

| Verificação | Resultado |
|---|---|
| Dimensões | ✔ 96 × 96 por quadro; spritesheet 384 × 96 |
| Transparência | ✔ alfa real; 0 pixels semitransparentes; cantos transparentes (decodificado no Edge); quadros isolados idênticos ao spritesheet |
| Pés e âncora | ✔ pés (y 91–95) **idênticos ao IDLE aprovado** nos 4 quadros; sola em y = 94 |
| Paleta | ✔ só cores da v4 de cada personagem |
| Identidade | ✔ cabeça idêntica à peça v4 (só translação de 1 px); **nenhum pixel da cabeça coberto** por braço, mão ou vara; tronco intacto fora das áreas cobertas |
| Vara | ✔ sem falhas; passa dentro da mão de trás; trecho de cima visível; ponta acima da altura dos olhos ("para cima e para trás", como no plano) |
| Sem partes soltas | ✔ corpo, braços, mãos, vara e molinete formam uma peça só |
| Margens | ✔ ≥ 3 px das bordas (menor: 27 px à esquerda e 30 px no topo) |
| Pose final | ✔ quadro 4 = quadro 3 com o tronco de volta (mão do peixe exatamente 1 px abaixo) |
| Continuidade (1 → 2 → 3 → 4 → 2 → 1 → IDLE) | ✔ mãos ≤ 9,5 px por quadro e ≤ 6,5 px na volta ao IDLE. Medido: **Alemão** 9,5 · 9,1 · 1,0 · 8,1 · 9,5 · 6,4 px; **ALE** 7,2 · 3,2 · 1,0 · 2,2 · 7,2 · 5,8 px |
| GIFs | ✔ GIF89a, todos os quadros completos (decodificador independente) |
| **Phaser 3.90** | ✔ 4 quadros por textura. A entrada toca 0 → 1 → 2 → 3 e termina em ~558 ms. **O quadro 3 (índice) fica parado durante o cartão**: conferido aos 300, 800, 1.400 e 1.650 ms após o fim da entrada, sem animação tocando. A saída termina no quadro 0 (índice) |
| Reprodutível | ✔ gerar de novo produz os 16 arquivos idênticos byte a byte |

## Conflitos entre o plano e a produção (propostas para aprovação)
1. **Personalidade × plano, seção 7** ("nenhum dos dois ganha movimentos que o outro não tem"). Segui a missão, como já foi aprovado na FRUSTRATION. Os quadros, os tempos e o pulinho são iguais para os dois; mudam a altura do braço e a vara.
2. **"Mão acima da cabeça" (quadros 3–4).** Com os braços da v4, a mão alcança ~17 px a partir do ombro, e o alto da cabeça fica a ~22 px. É o mesmo limite medido na FRUSTRATION. **Proposta:** no Alemão, mão erguida **na altura do boné, ao lado da cabeça**. No ALE, por personalidade, a mão fica na altura do ombro.
3. **Saída para o IDLE (o plano não define).** Sem ela, a mão desceria ~23 px de uma vez no fim do cartão. **Proposta:** 4 → 2 → 1 → IDLE (100 ms cada, só visual), o mesmo padrão aprovado na FRUSTRATION.

## Problemas encontrados e soluções
1. **A vara parecia nascer do ombro.** O trecho acima da mão era desenhado atrás do braço e do tronco (regra herdada do CAST). **Solução:** com a vara de lado, ela passa na frente do braço e do tronco e só vai para trás onde cruzaria a cabeça.
2. **Entrada vinda do REEL/FIGHT:** o limite de 9,5 px foi ultrapassado no pior caso (manivela embaixo). Virou medida informativa, como na FRUSTRATION; ver as limitações.

## Limitações conhecidas
- **Entrada vinda do REEL/FIGHT:** a captura acontece com a manivela em qualquer posição, e as mãos pulam conforme essa posição:
  - **Alemão:** 5,7–15,1 px;
  - **ALE:** 5,0–14,1 px.

  O pior caso é a manivela embaixo; com a manivela em cima, o pulo é de 5–7 px. Esperar a manivela atrasaria a comemoração, então não foi feito.
- **Peixe:** depende da integração. Ver a recomendação de pendurar o peixe para fora, para não encostar no rosto do Alemão nos quadros 3–4.
- **Molinete ao lado da mão** com a vara em pé: mesma solução do CHARGE aprovado.
- **Escala no jogo (×1 ou ×2):** continua em aberto (D10).
