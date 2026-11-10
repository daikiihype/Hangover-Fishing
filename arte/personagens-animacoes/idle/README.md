# Animação IDLE — Alemão e ALE

**Status:** primeira versão para **revisão da direção criativa**. **Não aprovada.** Nada foi integrado ao P1.
**Data:** 09/11/2026 · **Plano:** `docs/PLANO_ANIMACOES_PERSONAGENS.md` (v1.1, seções 3.2 e 5.1)
**Referência visual imutável:** `arte/personagens-base/alemao_idle_v4.png` e `ale_idle_v4.png` (não alterados; conferidos por hash)

## Arquivos

| Arquivo | Conteúdo | Dimensões |
|---|---|---|
| `alemao_idle_spritesheet.png` | 5 quadros de 96 × 96 lado a lado: **1 · 2 · 3 · 4 · P (piscar)** | 480 × 96, alfa real |
| `ale_idle_spritesheet.png` | Idem | 480 × 96, alfa real |
| `idle.json` | Dados para integração futura: quadros, tempos, âncora, regra do piscar, ponta da vara por quadro, pixels dos olhos | — |
| `previews/alemao_idle_x4.gif`, `previews/ale_idle_x4.gif` | Prévia animada ×4 de cada um (12 s, loop, com piscares sorteados) | 384 × 384 |
| `previews/ambos_idle_x4.gif` | Os dois lado a lado, ciclos defasados e piscares independentes (12 s, loop) | 768 × 384 |
| `previews/*_idle_quadros_x4.png` | Os 5 quadros ampliados ×4, sobre fundo, para inspeção | 1920 × 384 |
| `previews/*_idle_quadro1_x6.png` | Quadro 1 ampliado ×6 (alfa real) | 576 × 576 |
| `ferramentas/gerar_idle.js` | Gerador reproduzível: `node arte/personagens-animacoes/idle/ferramentas/gerar_idle.js` | — |

Os fundos das prévias (azul) existem só para a revisão. Os spritesheets não têm fundo.

## Organização dos quadros

| Índice no spritesheet | Quadro | O que muda em relação ao quadro 1 | Duração |
|---|---|---|---|
| 0 | **1 · base** | Nada: é a v4 aprovada, idêntica pixel a pixel, deslocada (+30, +32) | 700 ms |
| 1 | **2 · expirar** | Tronco, cabeça, braços, mãos, molinete e vara descem **1 px**; pernas e botas não se movem | 500 ms |
| 2 | **3 · base** | Igual ao quadro 1 | 700 ms |
| 3 | **4 · ponta** | A **metade da ponta** da vara flexiona: a ponta sobe 1 px. Até a coordenada x = 36 da v4, a vara é idêntica; só 15 pixels mudam, todos da vara | 500 ms |
| 4 | **P · piscar** | Quadro 1 com **só os pixels dos olhos** trocados pelo tom de sombra da pele (Alemão: 4 px · ALE: 3 px) | 100 ms, só como evento |

**Ciclo:** 1 → 2 → 3 → 4 → 1… = **2,4 s**, em loop contínuo. Entre quadros vizinhos (inclusive 4 → 1), nenhum ponto se move mais de 1 px.

**Piscar (evento):** cada personagem sorteia o próximo piscar para **3 a 6 s** depois do anterior. Quando chega a hora, espera o próximo quadro 1 ou 3 e, **300 ms depois do início desse quadro**, mostra o quadro P por **100 ms**. Depois volta ao mesmo quadro e o ciclo continua igual (os 2,4 s não mudam). Os dois personagens têm sorteios independentes.

## Coordenadas (quadro 96 × 96)

| Item | Valor |
|---|---|
| Deslocamento da v4 | (+30, +32) |
| Pés (botas e contorno) | x 39–56, y 91–95; centro x = **47,5** (eixo do quadro: o `flipX` não desloca os pés) |
| Sola (linha de base) | **y = 94**, x 40–55, igual nos 5 quadros |
| Âncora no Phaser | `setOrigin(0.5, 1)` |
| Ponta da vara por quadro | 1: (78, 49) · 2: (78, 50) · 3: (78, 49) · 4: (78, 48), igual nos dois |
| Pixels dos olhos (quadro P) | Alemão: (44, 44) (45, 44) (48, 44) (49, 44) · ALE: (47, 44) (48, 44) (52, 44) |

## Verificações automáticas (o gerador falha se alguma não passar)

| Verificação | Resultado |
|---|---|
| Quadro 1 idêntico à v4 aprovada (deslocada) | ✔ 0 pixels de diferença, nos dois |
| Quadro 3 = quadro 1 | ✔ |
| Quadro 2 = parte superior do quadro 1 deslocada 1 px | ✔ |
| Quadro 4 muda só pixels da vara | ✔ 15 px, nos dois |
| Piscar muda só os pixels dos olhos | ✔ Alemão 4 px · ALE 3 px |
| Paleta fechada (só cores da v4 de cada um) | ✔ Alemão 31 cores · ALE 33 cores |
| Pés idênticos nos 5 quadros; sola em y = 94, x 40–55; pés centrados em 47,5; contorno na última linha | ✔ |
| Todos os pixels a pelo menos 3 px das bordas (exceto os pés, que tocam a base) | ✔ |
| Continuidade do loop: ponta da vara nunca salta mais de 1 px entre quadros vizinhos | ✔ |
| Piscar: só nos quadros 1 ou 3, cabe dentro do quadro, intervalos de 3–6 s (+ espera do quadro) | ✔ 60 s simulados: Alemão 11 piscares, ALE 12 |
| Piscares independentes | ✔ Agendas diferentes; 0 piscares sobrepostos na prévia conjunta |

Validação externa dos arquivos gravados:
- Spritesheets decodificados no Edge: 480 × 96, nenhum pixel semitransparente, cantos transparentes; sola e última linha iguais nos 5 quadros.
- GIFs decodificados quadro a quadro por um leitor independente: GIF89a, loop infinito, 12 000 ms, todos os quadros completos.

## Decisões e limitações
- **Nada foi redesenhado:** o gerador lê o código do gerador v4 aprovado **em memória, só para leitura** (o arquivo não é alterado), e reaproveita exatamente as mesmas peças. A prova é a verificação "quadro 1 = v4".
- **Movimento sutil:** respiração de 1 px e flexão de 1 px na ponta da vara. Pela regra da v4, os braços se deslocam junto com o tronco, sem trocar de peça; mãos, molinete e vara continuam conectados.
- **Defasagem na prévia conjunta:** o ciclo do ALE começa 950 ms depois do ciclo do Alemão, como acontece no jogo, onde cada um entra no IDLE em momentos diferentes. Sem a defasagem, os piscares tenderiam a coincidir, porque usam os mesmos pontos do ciclo.
- **Piscar:** os olhos viram o tom de sombra da pele de cada personagem (nada acima ou abaixo deles muda). Em 64 px de altura, o efeito é discreto, como deve ser; a direção criativa pode avaliar se está perceptível o bastante nos GIFs.
- **Escala no jogo (×1 ou ×2):** continua em aberto (layout lateral, D10).
