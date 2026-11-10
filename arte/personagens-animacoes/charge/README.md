# Animação CHARGE — Alemão e ALE

**Status:** **CHARGE PRODUZIDA — AGUARDANDO REVISÃO VISUAL DO CRIADOR.** Não aprovada. Nada foi integrado ao P1.
**Data:** 09/11/2026 · **Plano:** `docs/PLANO_ANIMACOES_PERSONAGENS.md` (seção 5.2) · **Referência imediata:** `arte/personagens-animacoes/idle/` (IDLE aprovado)
**Base imutável:** `arte/personagens-base/alemao_idle_v4.png` e `ale_idle_v4.png` (não alterados; conferidos por hash)

## Arquivos

| Arquivo | Conteúdo | Dimensões |
|---|---|---|
| `alemao_charge_spritesheet.png`, `ale_charge_spritesheet.png` | 5 quadros de 96 × 96 lado a lado (índices 0–4) | 480 × 96, alfa real |
| `quadros/<personagem>_charge_1.png` … `_5.png` | Cada quadro isolado | 96 × 96, alfa real |
| `charge.json` | Ordem, tempos, faixas de força, cancelamento, âncora e coordenadas de cada quadro | — |
| `previews/alemao_charge_x4.gif`, `previews/ale_charge_x4.gif` | Prévia ×4: IDLE → preparação → 2 ciclos do medidor de força → cancelamento → IDLE | 384 × 384, 4,72 s, loop |
| `previews/ambos_charge_x4.gif` | Os dois lado a lado, mesma sequência | 768 × 384 |
| `previews/*_charge_quadros_x4.png` | Os 5 quadros ampliados ×4, sobre fundo | 1920 × 384 |
| `ferramentas/gerar_charge.js` | Gerador reproduzível: `node arte/personagens-animacoes/charge/ferramentas/gerar_charge.js` | — |

O fundo azul das prévias existe só para a revisão. Os spritesheets e os quadros não têm fundo.

## Os 5 quadros (iguais para os dois personagens; muda só a "pele" de cada um)

| Índice | Quadro | Vara (a partir da vertical) | Mãos | Tronco e cabeça | Reprodução |
|---|---|---|---|---|---|
| 0 | **1 · Preparação** | ~21° **para a frente**: a vara sobe na frente da aba do boné, visível inteira | Saem do quadril e sobem até o peito; a de cima vai ao ombro da frente | Sem inclinação | 100 ms, pontual |
| 1 | **2 · Recuo** | ~7° **para trás**: quase vertical, a ponta já passa atrás da cabeça | Ambas no peito, a de cima logo abaixo do queixo | 1 px para trás | 100 ms, pontual |
| 2 | **3 · Força baixa (0–33%)** | ~30° para trás | Mão de cima perto do ombro de trás | 1 px para trás | Enquanto a força estiver na faixa |
| 3 | **4 · Força média (34–66%)** | ~45° para trás | Mão de baixo 1 px mais à frente (alavanca) | 1 px para trás | Idem |
| 4 | **5 · Força alta (67–100%)** | ~58° para trás: a ponta sai bem atrás do ombro | Mão de cima no peito, do lado de trás | 2 px para trás | Idem |

**Ligação com o medidor do P1** (vai e volta de 0 a 100 em 1,6 s): ao começar a segurar, tocam os quadros 1 e 2 (100 ms cada). Depois, **o jogo escolhe o quadro 3, 4 ou 5 pela força atual**: a vara vai para trás e volta junto com o medidor. Por isso a animação é **reversível**: 3 ↔ 4 ↔ 5 em qualquer ordem, sempre com passos pequenos.

**Cancelamento** (toque curto ou interrupção): 2 → 1 → IDLE, 60 ms cada.
**Soltura com carga válida:** o jogo troca para **CAST**. A CHARGE **não** contém a soltura, o lançamento nem a boia.

## Como a pose foi construída (sem redesenhar o personagem)
- **Peças da v4 reaproveitadas sem alteração** (o gerador v4 aprovado é lido em memória, só para leitura): cabeça, tronco, pernas, botas, mãos, carretel do molinete, paletas e contorno.
- **Braços:** calculados a partir de ombro, cotovelo e mão, com 3 px de largura e o sombreado do moletom da v4 (`i` luz, `j` base, `J` sombra e separação). É a única peça nova, como previsto no plano (seção 6: "mãos no peito", "mãos no ombro").
- **Vara:** a mesma vara da v4 (cabo escuro, grossa perto das mãos, fina na ponta, faixas amarelas no ALE), girada para passar **exatamente pelas duas mãos**.
  - **Do cabo até a mão de cima:** na frente do peito.
  - **Da mão de cima até a ponta:** passa **atrás da cabeça e do tronco** e só aparece onde não há corpo. Assim, a vara nunca cobre o rosto.
- **Molinete:** o carretel redondo da v4, encostado na mão de cima, do lado da frente, com a manivela visível.
- **Mãos:** cada uma segura a mesma parte da vara que no IDLE. A de trás fica no cabo; a da frente, no assento do molinete.

## Coordenadas (quadro 96 × 96; iguais para os dois)

| Quadro | Ângulo | Mão de trás (cabo) | Mão da frente (molinete) | Ponta da vara | Fim do cabo | Centro do molinete | Inclinação |
|---|---|---|---|---|---|---|---|
| 1 | −21° | (51, 64) | (54, 56) | (64, 30) | (49, 70) | (58, 58) | 0 |
| 2 | 7° | (51, 62) | (50, 54) | (47, 26) | (52, 68) | (54, 56) | 1 px |
| 3 | 30° | (52, 61) | (48, 54) | (34, 30) | (55, 66) | (52, 56) | 1 px |
| 4 | 45° | (53, 60) | (47, 54) | (27, 34) | (57, 64) | (51, 56) | 1 px |
| 5 | 58° | (52, 60) | (44, 55) | (20, 40) | (57, 63) | (48, 57) | 2 px |

- **Âncora (igual ao IDLE):** v4 deslocada (+30, +32); pés em x 39–56, y 91–95, com centro em x = 47,5; sola em **y = 94**; `setOrigin(0.5, 1)`.
- **Phaser:** spritesheet de quadros de 96 × 96 (`frameWidth: 96, frameHeight: 96`), índices 0–4. Os quadros 3–5 devem ser escolhidos pelo código conforme a força (não por `frameRate`).

## Verificações automáticas (o gerador falha se alguma não passar)

| Verificação | Resultado |
|---|---|
| Dimensões | ✔ 96 × 96 por quadro; spritesheet 480 × 96 (5 × 96) |
| Transparência | ✔ alfa real; 0 pixels semitransparentes; cantos transparentes (spritesheets decodificados no Edge e quadros isolados lidos de novo) |
| Pés e âncora | ✔ pés (y 91–95) **idênticos ao IDLE aprovado** nos 5 quadros; sola em y = 94; contorno na última linha |
| Paleta | ✔ só cores da v4 de cada personagem |
| Rosto e cabeça | ✔ todos os pixels da cabeça iguais à peça v4 (só translação de 0–2 px); 0 pixels do rosto cobertos por braço ou vara |
| Tronco | ✔ fora das áreas cobertas por braços, mãos, molinete e vara, idêntico à peça v4 |
| Vara sem cortes e sem falhas | ✔ cada ponto da linha da vara é vara ou está atrás do corpo (nenhum ponto vazio); ponta visível em todos os quadros; margem ≥ 3 px das bordas |
| Mãos na vara | ✔ a linha da vara passa dentro das duas mãos em todos os quadros |
| Sem partes desconectadas | ✔ corpo, braços e mãos formam uma peça só; o trecho da vara atrás do corpo encosta no corpo |
| Continuidade | ✔ as mãos nunca saltam mais de 4,5 px entre quadros vizinhos (medido: 4,5 · 2,0 · 1,4 · 3,2 px) |
| GIFs | ✔ GIF89a, loop infinito, todos os quadros completos (decodificador independente) |

## Problemas encontrados e correções
1. **Quadro 1, primeira versão:** com a vara quase vertical (~6° para a frente), ela passava atrás da aba do boné e aparecia acima da cabeça como um tracinho solto. **Correção:** a vara inclina ~21° para a frente nesse quadro, sobe na frente da aba e aparece inteira.
2. **Saltos grandes da ponta entre os quadros 1→2 e 2→3** na primeira versão (~20 px). **Correção:** ângulos redistribuídos (−21°, 7°, 30°, 45°, 58°); os passos da ponta caíram para 17,5 · 13,6 · 8,1 · 9,2 px. As mãos se movem no máximo 4,5 px.
3. **Mão de cima cobrindo a barba** (risco em ângulos maiores): fixada em y ≥ 22 da v4, sempre abaixo do queixo; a verificação confirma 0 pixels do rosto cobertos.

## Limitações conhecidas
- **Quadro 2:** com a vara quase vertical atrás da cabeça, só a ponta aparece acima dela, com um pequeno degrau no traço (passo do desenho de 1 px). É fisicamente coerente e dura só 100 ms, mas pode ler como uma "antena". **A avaliar na revisão.**
- **Saída do IDLE:** do IDLE para o quadro 1, as mãos sobem ~7 px e a ponta da vara gira ~24 px. É a "preparação" (100 ms); no IDLE a vara aponta para a frente e, no CHARGE, para cima e para trás.
- **Braços sobre o tronco:** como o braço e o moletom têm a mesma cor (como na v4), o braço é lido pelas linhas de sombra (`J`). No ALE (cinza sobre cinza) isso é mais sutil.
- **O peso da vara ao carregar** (vara curvando para trás) não foi desenhado: a vara continua reta, como pede o plano para o CHARGE. A curvatura fica para o REEL/FIGHT.
- **Escala no jogo (×1 ou ×2):** continua em aberto (D10).
