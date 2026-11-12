# Animação FRUSTRATION — Alemão e ALE

**Status:** **FRUSTRATION PRODUZIDA — AGUARDANDO REVISÃO DO CRIADOR.** Não aprovada. Nada foi integrado ao P1.
**Data:** 11/11/2026 · **Plano:** `docs/PLANO_ANIMACOES_PERSONAGENS.md` (seção 5.6) · **Entra a partir de:** REEL/FIGHT (fuga ou linha rompida) ou IDLE (mordida perdida) · **Termina em:** IDLE
**Base imutável:** sprites v4, IDLE, CHARGE, CAST e REEL/FIGHT (não alterados; conferidos por hash)

## Arquivos

| Arquivo | Conteúdo | Dimensões |
|---|---|---|
| `alemao_frustration_spritesheet.png`, `ale_frustration_spritesheet.png` | 4 quadros de 96 × 96 lado a lado (índices 0–3) | 384 × 96, alfa real |
| `quadros/<personagem>_frustration_1.png` … `_4.png` | Cada quadro isolado | 96 × 96, alfa real |
| `frustration.json` | Ordem de reprodução, tempos, pose mantida, saída, âncora, coordenadas de cada quadro (inclusive a ponta da vara, para a linha partida) e medidas de continuidade | — |
| `previews/alemao_frustration_x4.gif`, `previews/ale_frustration_x4.gif` | Prévia ×4 com os tempos do P1 (sequência abaixo) | 384 × 384, 7,34 s, loop |
| `previews/ambos_frustration_x4.gif` | Os dois lado a lado | 768 × 384 |
| `previews/*_frustration_quadros_x4.png` | Os 4 quadros ampliados ×4, sobre fundo | 1536 × 384 |
| `ferramentas/gerar_frustration.js` | Gerador reproduzível: `node arte/personagens-animacoes/frustration/ferramentas/gerar_frustration.js` | — |

**Sequência das prévias:**
1. Briga no nível 4 do REEL/FIGHT → a linha rompe → FRUSTRATION, com o quadro 3 mantido até o fim do cartão de 1,6 s → saída → IDLE.
2. Recolhendo no nível 1 → o peixe escapa (linha frouxa) → a mesma FRUSTRATION → IDLE.

O fundo azul existe só para a revisão.

## Personalidade (mesmos quadros e tempos; reações diferentes)

| | **Alemão — espontâneo e expansivo** | **ALE — contido e resignado** |
|---|---|---|
| Ideia | "Não acredito!" | "De novo... fazer o quê." |
| Corpo | Recua 1 px (tronco e cabeça para trás) | Ombros e cabeça caem 1 px |
| Braço livre | O **da frente**: sobe em punho fechado ao lado do rosto e agarra a **aba do boné**, com o cotovelo alto e aberto | O **de trás**: solta o cabo e vai **coçar a nuca**, com o cotovelo junto à cabeça |
| Vara | Dá um **tranco para cima** quando a linha solta. Depois fica **largada**, pendurada na mão de trás, com a ponta perto do chão (~30° abaixo da horizontal) | A ponta **cai** e a vara fica **baixa e nivelada**, segura só pelo molinete, com a mão da frente |

| Quadro | Alemão | ALE |
|---|---|---|
| 1 | **Tranco:** a vara salta para ~51° com as duas mãos; o corpo recua | **Ombros caem:** a mão de trás solta o cabo e vai ao peito; a ponta da vara desce (~11° acima da horizontal) |
| 2 | **Mão subindo:** punho erguido ao lado do rosto; a vara cai para a horizontal na mão de trás | **Mão subindo:** o braço de trás sobe pela lateral; a vara fica nivelada |
| 3 | **Mão no boné** (pose mantida): cotovelo alto, vara largada | **Mão na nuca** (pose mantida): cabeça baixa, vara baixa |
| 4 | **Volta:** a mão desce ao peito e a vara sobe (~12°) | **Volta:** a mão desce ao quadril e a vara sobe (~12°) |

A cabeça e o rosto não mudam (só deslocamento de 1 px). A expressão vem da postura, dos braços e da vara, como pede a missão.

## Reprodução e tempos

| Fase | Quadros | Duração |
|---|---|---|
| **Entrada** | 1 → 2 → **3** | 150 ms → 200 ms → **3 mantido** (no mínimo 600 ms) |
| **Pose mantida** | 3 | Fica na tela **até o fim do cartão de resultado** (no cartão de 1,6 s do P1: 1.250 ms) |
| **Saída** (quando o P1 volta ao IDLE) | **2 → 4** → IDLE | 100 ms → 100 ms |
| **Total mínimo** | | **1.150 ms**, o mesmo do plano |

- **Mesma animação para "escapou" e "linha rompeu".** No rompimento, o jogo desenha a linha partida a partir da **ponta da vara** do quadro atual (`frustration.json` → `pontos`).
- **Saída em dois passos:** o quadro 2 (mão a meio caminho) é reaproveitado na descida, para a mão não pular ~20 px da cabeça até o quadril. Continuam 4 desenhos, como no plano.
- **A saída é só visual** (200 ms). Ela não atrasa a lógica: se o jogador pular o cartão (toque após 0,6 s), o P1 começa a carga, e a animação troca para o CHARGE na hora, sem tocar a saída (plano, seção 4).
- **Phaser 3:** `frameWidth: 96, frameHeight: 96`, índices 0–3. Use duas animações pontuais: entrada `[0, 1, 2]` (a última fica parada ao terminar) e saída `[1, 3]`, com `duration` por quadro tirado de `frustration.json`. Testado no Phaser 3.90.0 do P1, só leitura.

## Coordenadas (quadro 96 × 96)

| Quadro | Alemão: ponta da vara · ângulo · vara segura por | ALE: ponta da vara · ângulo · vara segura por |
|---|---|---|
| 1 | (72, 33) · 51° acima · as duas mãos | (81, 61) · 11° acima · mão da frente (molinete) |
| 2 | (82, 71) · 6° abaixo · mão de trás (cabo) | (82, 68) · horizontal · mão da frente |
| 3 | (77, 87) · 30° abaixo · mão de trás | (82, 72) · 6° abaixo · mão da frente |
| 4 | (81, 60) · 12° acima · mão de trás | (81, 59) · 12° acima · mão da frente |

As posições das mãos de cada quadro estão em `frustration.json`. **Âncora (igual às outras animações):** v4 deslocada (+30, +32); pés em x 39–56, y 91–95; sola em **y = 94**; `setOrigin(0.5, 1)`.

## Verificações (o gerador falha se alguma não passar)

| Verificação | Resultado |
|---|---|
| Dimensões | ✔ 96 × 96 por quadro; spritesheet 384 × 96 |
| Transparência | ✔ alfa real; 0 pixels semitransparentes; cantos transparentes (decodificado no Edge); quadros isolados idênticos ao spritesheet |
| Pés e âncora | ✔ pés (y 91–95) **idênticos ao IDLE aprovado** nos 4 quadros; sola em y = 94 |
| Paleta | ✔ só cores da v4 de cada personagem |
| Identidade | ✔ cabeça idêntica à peça v4 (só translação de 1 px); **0 pixels do rosto cobertos**; a mão só toca o **boné** (Alemão) ou o **cabelo** (ALE); tronco intacto fora das áreas cobertas |
| Mão na cabeça | ✔ no quadro 3, a mão encosta de fato no boné ou no cabelo (≥ 4 px de contato) |
| Vara | ✔ sem falhas na linha; ponta visível; a vara passa dentro de cada mão que a segura; molinete preso à vara |
| Sem partes soltas | ✔ corpo, braços, mãos, vara e molinete formam uma peça só |
| Margens | ✔ ≥ 3 px das bordas (menor: 13 px à direita) |
| Continuidade (IDLE → 1 → 2 → 3 → 2 → 4 → IDLE) | ✔ as mãos andam no máximo 9,5 px por quadro (gesto rápido, 100–200 ms) e no máximo 6,5 px na volta ao IDLE (mesmo limite do CAST). Medido: **Alemão** 8,0 · 7,3 · 8,6 · 8,6 · 9,1 · 6,1 px; **ALE** 8,2 · 7,1 · 9,2 · 9,2 · 9,2 · 6,1 px |
| GIFs | ✔ GIF89a, loop infinito, todos os quadros completos (decodificador independente) |
| Phaser 3 | ✔ 3.90.0: 4 quadros por textura; a entrada termina parada no quadro 3; a saída termina no quadro 4 |
| Reprodutível | ✔ gerar de novo produz os 16 arquivos idênticos byte a byte |

## Problemas encontrados e soluções
1. **A mão não alcançava o alto da cabeça.** Na proporção dos personagens (cabeça grande), o topo do boné fica a ~18 px do ombro. Alcançá-lo pediria braços mais longos que os da v4. **Solução:** o Alemão segura a **aba do boné**, e o ALE coça a **nuca**. As duas são posições ao alcance do braço e leem como "mão na cabeça".
2. **No 3/4 de frente, o braço da frente do ALE cruzaria o rosto** para chegar à nuca. **Solução:** o ALE usa o **braço de trás** (mais perto da nuca) e segura a vara com a mão da frente, no molinete.
3. **Na primeira versão, o braço do ALE encostava em 1 pixel do rosto.** A verificação barrou; a mão foi deslocada 1 px para trás no cabelo.
4. **Na primeira versão, a mão saltava ~20 px na volta** (do quadro 3 para o 4). **Solução:** a saída reaproveita o quadro 2 (passos ≤ 9,2 px), sem desenho novo.

## Limitações conhecidas
- **Entrada vinda do REEL/FIGHT:** a FRUSTRATION começa no momento em que o peixe escapa ou a linha rompe, com a manivela em qualquer posição. As mãos podem pular, por posição da manivela 1–4:
  - **Alemão:** 7–15 px (linha rompida, nível 4) e 10–18 px (fuga, nível 1);
  - **ALE:** 8 px (linha rompida) e 9 px (fuga).

  No Alemão, o pulo coincide com o "tranco" da vara, o que ajuda a ler como reação. Uma regra como a "completar a volta" não serve aqui: atrasaria a reação ao resultado.
- **Quadro 2 do ALE:** o braço de trás abre para o lado a caminho da nuca. Dura 200 ms, mas pode ler como um aceno. **A avaliar na revisão.**
- **Quadro 2 do Alemão:** o punho fica ao lado do rosto, sem cobri-lo (verificado). Lê como punho cerrado de indignação, o que é intencional.
- **Rosto sem expressão nova:** o plano não permite mudar o rosto. A frustração aparece só na postura, nos braços e na vara.
- **Linha partida:** é desenhada pelo jogo, como no P1.
- **Escala no jogo (×1 ou ×2):** continua em aberto (D10).
