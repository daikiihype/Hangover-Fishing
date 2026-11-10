# Animação REEL/FIGHT — Alemão e ALE

**Status:** **REEL/FIGHT PRODUZIDO — AGUARDANDO REVISÃO DO CRIADOR.** Não aprovado. Nada foi integrado ao P1.
**Data:** 09/11/2026 · **Plano:** `docs/PLANO_ANIMACOES_PERSONAGENS.md` (seção 5.4) · **Entra a partir de:** IDLE (fisgada) · **Tensão:** zonas do P1 (`config.js`)
**Base imutável:** sprites v4, IDLE, CHARGE e CAST (não alterados; conferidos por hash)

## Arquivos

| Arquivo | Conteúdo | Dimensões |
|---|---|---|
| `alemao_reel_fight_spritesheet.png`, `ale_reel_fight_spritesheet.png` | 16 quadros de 96 × 96 em **grade 4 × 4**: cada **linha** é um nível (1 no alto, 4 embaixo); cada **coluna** é uma posição da manivela | 384 × 384, alfa real |
| `quadros/<personagem>_reel_fight_01.png` … `_16.png` | Cada quadro isolado (01–04 = nível 1 … 13–16 = nível 4) | 96 × 96, alfa real |
| `reel_fight.json` | Níveis, zonas de tensão, ordem e tempo da manivela, fisgada, âncora e coordenadas de cada quadro (inclusive a ponta da vara, para a linha do jogo) | — |
| `previews/*_reel_fight_niveis_x4.gif` | **Comparação dos níveis:** nível 1 → 2 → 3 → 4, duas voltas de manivela em cada | 384 × 384 (ambos: 768 × 384), 2,88 s, loop |
| `previews/*_reel_fight_briga_x4.gif` | **Como no jogo:** IDLE → fisgada (100 ms) → a tensão sobe e desce entre os níveis → soltando (manivela parada) → linha frouxa → IDLE | 384 × 384 (ambos: 768 × 384), 5,16 s, loop |
| `previews/*_reel_fight_quadros_x4.png` | Os 16 quadros ampliados ×4, na mesma grade do spritesheet | 1536 × 1536 |
| `previews/ambos_reel_fight_niveis_x4.png` | Os 4 níveis lado a lado (manivela na posição 1), Alemão em cima e ALE embaixo | 1536 × 768 |
| `ferramentas/gerar_reel_fight.js` | Gerador reproduzível: `node arte/personagens-animacoes/reel-fight/ferramentas/gerar_reel_fight.js` | — |

Nas prévias, os **4 blocos no canto** mostram o nível do quadro (cinza · verde · amarelo · vermelho). Eles e o fundo azul existem só para a revisão: os spritesheets e os quadros não têm fundo nem indicador.

## Os 4 níveis (iguais para os dois; muda só a "pele")

| Nível | Quadros (índices) | Zona de tensão do P1 | Vara | Corpo |
|---|---|---|---|---|
| **1 · Linha frouxa** | 1–4 (0–3) | Linha vazia (`REELING_EMPTY`) ou **frouxa** (< 0,20) | **Reta**, no ângulo da v4 (~61°), 1 px mais baixa: vara "solta" nas mãos | Postura da v4, relaxada |
| **2 · Tensão segura** | 5–8 (4–7) | **Segura** (0,20 a 0,65) | **Curva leve:** a ponta desce 3 px | Postura da v4; a vara volta à altura do IDLE (controle) |
| **3 · Alerta** | 9–12 (8–11) | **Alerta** (0,65 a 0,85) | **Curva média:** a ponta desce 7 px; cabo mais levantado (~56°) | Tronco e cabeça 1 px para trás; mãos 1 px para trás e para cima (esforço) |
| **4 · Crítica** | 13–16 (12–15) | **Crítica** (0,85 ou mais) | **Curva forte:** a ponta desce 12 px e se dobra para a água; cabo bem levantado (~52°) | Tronco e cabeça 2 px para trás; mãos puxando para trás e para cima |

- **Curvatura:** do molinete até a ponta, a vara é um **arco com os mesmos 28 px da v4**. A curva começa suave perto do molinete e fica mais forte perto da ponta. O cabo, da ponta de trás até o molinete, continua **reto**, como um equipamento rígido.
- **Medida da curva** (maior distância entre a vara e a reta molinete → ponta): **0 · 1,3 · 2,9 · 4,8 px**. A queda da ponta em relação à vara reta é **0 · 3 · 7 · 12 px**.
- **Leitura:** quanto maior a tensão, mais a vara verga e mais baixa fica a ponta, mesmo com as mãos levantando a vara. O corpo inclina para trás junto. Os pés não se movem.

## Manivela (4 posições)

| Posição (coluna) | Manopla em relação ao cubo do carretel | Mão da frente |
|---|---|---|
| **1 · Cima** | 4 px acima: logo abaixo da vara | Encosta na vara, sobre o molinete |
| **2 · Frente** | 4 px à frente | À frente do carretel |
| **3 · Baixo** | 4 px abaixo | Embaixo do carretel |
| **4 · Trás** | 4 px atrás | Atrás do carretel, sobre o moletom |

- A manopla gira em volta do cubo do carretel, em **sentido horário** na tela (1 → 2 → 3 → 4 → 1). O braço da manivela (cor da manivela da v4) liga o cubo à mão em todas as posições. No carretel claro do Alemão, ele forma "U", "C", "n" e "Ɔ"; no ALE, o traço amarelo aparece sobre o carretel.
- **A mão da frente segura a manopla** e acompanha o giro. O cotovelo abre e fecha junto. **A mão de trás fica fixa no cabo** durante a volta inteira.
- O **molinete** é o carretel da v4, sem alteração, pendurado sob a vara pela haste, como no IDLE. Só a manivela fixa da v4 foi trocada pela manivela que gira.

## Reprodução e tempos

| Item | Valor |
|---|---|
| Quadros | **16 por personagem** = 4 níveis × 4 posições |
| Índice | `(nível − 1) × 4 + (posição − 1)` (0–15); quadro = índice + 1 |
| Cada posição da manivela | **90 ms** (uma volta = **360 ms**) |
| Segurando (recolhendo) | Loop das 4 posições do nível atual |
| Soltando (aliviando) | A manivela **para** na posição atual; o nível continua acompanhando a tensão (sem quadros extras) |
| Troca de nível | **Só quando a zona de tensão do P1 muda**, imediata, **preservando a posição da manivela** (ex.: quadro 7 = nível 2, posição 3 → quadro 11 = nível 3, posição 3). O nível nunca é animado sozinho |
| Fisgada | **Quadro 9** (nível 3, posição 1) por **100 ms** (próxima seção) |

## Fisgada (para a lógica do jogo; sem animação separada)

1. Na transição **`BITE` → `FIGHTING`** do P1, o jogo mostra o **quadro 9 (índice 8)**: nível 3, curva média, manivela em cima, por **~100 ms**.
2. Depois, passa para o **nível indicado pela tensão**, na posição 1 da manivela, ou na posição 2 se o jogador já estiver segurando.
3. A passagem do IDLE para o quadro 9 move as mãos **1 px** (a mão da frente fica sobre o molinete, quase no mesmo lugar do IDLE). Só a vara verga e o corpo inclina 1 px: é o "tranco" da fisgada.

## Coordenadas (quadro 96 × 96; iguais para os dois personagens)

| Nível | Ponta da vara | Mão de trás (cabo) | Assento do molinete | Cubo do carretel | Mão da frente nas posições 1 · 2 · 3 · 4 | Ângulo do cabo | Tronco |
|---|---|---|---|---|---|---|---|
| 1 | (78, 50) | (45, 69) | (54, 64) | (54, 69) | (54, 65) · (58, 69) · (54, 73) · (50, 69) | 61° à frente | 0 |
| 2 | (80, 52) | (45, 68) | (54, 63) | (54, 68) | (54, 64) · (58, 68) · (54, 72) · (50, 68) | 61° | 0 |
| 3 | (79, 53) | (44, 68) | (53, 62) | (53, 67) | (53, 63) · (57, 67) · (53, 71) · (49, 67) | 56° | −1 px |
| 4 | (77, 56) | (43, 68) | (52, 61) | (52, 66) | (52, 62) · (56, 66) · (52, 70) · (48, 66) | 52° | −2 px |

- **Linha de pesca do jogo:** deve sair da **ponta da vara** do quadro atual (`reel_fight.json` → `pontos.<personagem>[i].pontaDaVara`). A ponta é a mesma nas 4 posições da manivela de um nível; ela só muda quando o nível muda.
- **Âncora (igual ao IDLE, CHARGE e CAST):** v4 deslocada (+30, +32); pés em x 39–56, y 91–95, com centro em x = 47,5; sola em **y = 94**; `setOrigin(0.5, 1)`.
- **Phaser 3:** `this.load.spritesheet(chave, arquivo, { frameWidth: 96, frameHeight: 96 })`; a grade 4 × 4 é lida linha a linha, então os índices 0–15 seguem a fórmula acima. Recomendação: 4 animações em loop (uma por nível, `generateFrameNumbers` de `n*4` a `n*4+3`, 90 ms por quadro). Ao trocar de nível, use `play({ key, startFrame: índice % 4 })` para manter a manivela. **Testado no Phaser 3.90.0 do P1**, só leitura (detalhes abaixo).

## Verificações (o gerador falha se alguma não passar)

| Verificação | Resultado |
|---|---|
| Dimensões | ✔ 96 × 96 por quadro; spritesheet 384 × 384 (4 × 4); 16 quadros isolados 96 × 96 |
| Transparência | ✔ alfa real; **0 pixels semitransparentes** e cantos transparentes (spritesheets e quadros isolados decodificados no Edge); quadros isolados idênticos ao spritesheet |
| Pés e âncora | ✔ pés (y 91–95) **idênticos ao IDLE aprovado** nos 16 quadros; sola em y = 94 (18 px) e contorno em y = 95 em todos os quadros |
| Paleta | ✔ só cores da v4 de cada personagem (o indicador de nível existe só nas prévias) |
| Identidade | ✔ cabeça idêntica à peça v4 (só translação de 0 a −2 px); **0 pixels do rosto cobertos**; tronco intacto fora das áreas cobertas por braços, mãos, molinete e vara |
| Vara conectada | ✔ a linha da vara passa dentro da mão de trás; molinete pendurado na vara pela haste; nenhuma falha na linha; trecho da ponta visível; **comprimento do molinete à ponta = 28 px (±0,5) em todos os níveis** |
| Manivela conectada | ✔ cubo do carretel visível; braço da manivela contínuo do cubo até a mão em todos os quadros; manopla dentro da mão da frente |
| Sem partes soltas | ✔ corpo, braços, mãos, molinete e cabo formam uma peça só; o trecho da vara além do molinete encosta no resto |
| Margens | ✔ ≥ 3 px das bordas (menor: 15 px à direita, no nível 2) |
| Curvatura progressiva | ✔ nível 1 reto; a queda da ponta e a curva crescem a cada nível (0 → 3 → 7 → 12 px; 0 → 1,3 → 2,9 → 4,8 px); a ponta fica mais baixa a cada nível |
| Níveis distintos | ✔ cada par de níveis difere em ≥ 40 px na mesma posição da manivela. Medido (mínimo): **Alemão 156 px, ALE 161 px** (níveis 1 × 2). Ex. posição 1, Alemão: 1×2 165 · 2×3 420 · 3×4 409 · 1×4 605 |
| Continuidade da manivela | ✔ sentido horário, 90° por quadro, volta fechada (4 → 1); a mão da frente anda 5,7 px por quadro (limite 6) e a mão de trás fica parada |
| Troca de nível | ✔ na mesma posição da manivela, as mãos movem ≤ 3 px (medido: 1,0 · 1,4 · 1,4 px; ponta 2,8 · 1,4 · 3,6 px) |
| Fisgada | ✔ IDLE → quadro 9: mãos movem 1 px (limite 4) |
| GIFs | ✔ GIF89a, loop infinito, todos os quadros completos (decodificador independente) |
| Phaser 3 | ✔ Phaser **3.90.0** (do P1, só leitura): 16 quadros por textura; quadro 9 (índice 8) exibido com `setOrigin(0.5, 1)`; animações por nível = [0–3], [4–7], [8–11], [12–15]; troca do quadro 7 para o 11 no meio da volta, com a posição da manivela preservada |

## Problemas encontrados e soluções
1. **Ponta da vara no mesmo lugar em todos os níveis** (primeira versão). Ao levantar a vara 4 px no nível 4, como pede o plano ("vara mais levantada pelas mãos"), a subida anulava a queda da ponta: a ponta andava só 1–2 px entre os níveis. **Solução:** as mãos levantam a vara menos (assento 0 / 1 / 2 px mais alto nos níveis 2–4). Assim, a ponta desce a cada nível e a vara ainda sobe no cabo (61° → 52°). A verificação passou a exigir a ponta mais baixa a cada nível.
2. **Níveis 1 e 2 parecidos demais** (33 px de diferença; só a curva leve mudava). **Solução:** no nível 1, a vara fica 1 px mais baixa nas duas mãos, segurada "solta" (relaxada). No nível 2, ela volta à altura do IDLE (controle). A diferença passou para 156–168 px.
3. **Mão da frente: plano × missão.** O plano previa a mão "acompanhando a manopla com deslocamento de 1 px". A missão pede a manivela ligada à mão. Com 1 px, a manopla ficaria escondida dentro da mão e o giro não apareceria. **Solução (autonomia sobre mãos e manivela):** a mão segura a manopla, que gira com raio de 4 px em volta do cubo. Com isso, a manivela fica visível e ligada à mão nas 4 posições.

## Limitações conhecidas
- **Mão da frente fora da vara:** para girar a manivela, a mão da frente sai do assento e vai para a manopla. A vara fica apoiada pela mão de trás no cabo e pelo molinete. É como se pesca com molinete, mas a vara tem só uma mão sobre ela.
- **Saída para o IDLE:** do nível 1 para o IDLE, as mãos podem mover até **10 px** (pior caso: manivela embaixo). Isso só acontece no fim da briga, quando a CATCH ou a FRUSTRATION (ainda não produzidas) devem fazer a ponte.
- **Nível 4:** a ponta se dobra até apontar para a água. É a curva máxima e plausível para um peixe grande, mas é a forma mais "exagerada" das quatro. **A avaliar na revisão.**
- **ALE:** o carretel escuro do ALE (`#2c2c33`) fica sobre o moletom cinza escuro. O giro é lido pelo braço amarelo da manivela e pela mão, mais do que pelo carretel.
- **Mão da frente na posição 2 (frente):** ela encosta no contorno do carretel. Em ×1, a manopla fica escondida sob a mão, como em todas as posições, de propósito.
- **Sem linha de pesca:** a linha, o peixe e os avisos de perigo continuam com o jogo, como no P1.
- **Escala no jogo (×1 ou ×2):** continua em aberto (D10).
