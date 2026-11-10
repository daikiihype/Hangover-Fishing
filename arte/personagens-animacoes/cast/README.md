# Animação CAST — Alemão e ALE

**Status:** **CAST PRODUZIDO — AGUARDANDO REVISÃO DO CRIADOR.** Não aprovado. Nada foi integrado ao P1.
**Data:** 09/11/2026 · **Plano:** `docs/PLANO_ANIMACOES_PERSONAGENS.md` (seção 5.3) · **Continuação de:** `arte/personagens-animacoes/charge/` · **Termina em:** `arte/personagens-animacoes/idle/`
**Base imutável:** sprites v4, IDLE e CHARGE (não alterados; conferidos por hash)

## Arquivos

| Arquivo | Conteúdo | Dimensões |
|---|---|---|
| `alemao_cast_spritesheet.png`, `ale_cast_spritesheet.png` | 5 quadros de 96 × 96 lado a lado (índices 0–4) | 480 × 96, alfa real |
| `quadros/<personagem>_cast_1.png` … `_5.png` | Cada quadro isolado | 96 × 96, alfa real |
| `cast.json` | Ordem, tempos, entrada, saída, **momento da soltura**, âncora e coordenadas de cada quadro | — |
| `previews/alemao_cast_x4.gif`, `previews/ale_cast_x4.gif` | Prévia ×4 completa (ver abaixo) | 384 × 384, 4,95 s, loop |
| `previews/ambos_cast_x4.gif` | Os dois lado a lado | 768 × 384 |
| `previews/*_cast_quadros_x4.png` | Os 5 quadros ampliados ×4, sobre fundo | 1920 × 384 |
| `ferramentas/gerar_cast.js` | Gerador reproduzível: `node arte/personagens-animacoes/cast/ferramentas/gerar_cast.js` | — |

**Sequência das prévias** (tempos do P1):
1. IDLE → CHARGE até a **força alta** → **CAST com os tempos da faixa alta** → IDLE.
2. Depois, CHARGE só até a **força baixa** → **CAST com os tempos da faixa baixa** → IDLE.

Assim, a prévia mostra a entrada vinda do CHARGE, a saída para o IDLE e os dois extremos de força. O fundo azul existe só para a revisão.

## O movimento (igual para os dois; muda só a "pele" de cada um)

| Índice | Quadro | Vara (a partir da vertical) | Braços e mãos | Tronco e cabeça |
|---|---|---|---|---|
| 0 | **1 · Impulso** | ~14° para trás, vindo da carga | O corpo "trava"; as mãos começam a subir e a avançar | 1 px para trás |
| 1 | **2 · Chicotada** | ~16° **para a frente**: a vara passa ao lado da aba do boné | Mãos na frente do peito, a do molinete já do lado da frente | Volta ao centro |
| 2 | **3 · Soltura** | ~50° para a frente (40° acima da horizontal) | Braço da frente esticado à frente | 1 px à frente |
| 3 | **4 · Acompanhamento** | ~76°: vara quase horizontal, apontando para a água | Braços estendidos, mão de baixo junto ao quadril | 1 px à frente |
| 4 | **5 · Assentamento** | ~67°: volta para perto do ângulo do IDLE (~59°) | Mãos voltando para o quadril | Centro |

Reprodução pontual; no fim, o jogo mostra o IDLE. As durações dependem da força (próxima seção).

- **Força e intenção:** em todas as faixas, o quadro mais curto é a chicotada, quando a vara anda mais (a ponta se desloca ~20 px). A soltura e o acompanhamento ficam mais tempo na tela, para o arremesso "assentar".
- **Mãos sempre na vara:** a mão de trás segura o cabo e a da frente o molinete, como no IDLE e no CHARGE. Na passagem pela vertical (quadros 1 → 2), a mão do molinete passa para o lado da frente, como acontece ao girar uma vara.
- **Molinete:** ao lado da mão enquanto a vara está em pé (quadros 1–2, como no CHARGE); pendurado sob a mão quando a vara aponta para a frente (quadros 3–5, como no IDLE).
- **Rosto:** a mão de cima fica sempre abaixo do queixo e a vara nunca passa na frente do rosto (verificado).

## Diferentes forças (tempos por faixa — APROVADO pela direção criativa, 09/11/2026)

**O que muda e o que não muda:**
- **Os cinco quadros e seus desenhos são idênticos nas três faixas de força.** Os spritesheets e os quadros isolados são os mesmos para baixa, média e alta.
- **Dentro do CAST, a única diferença é a duração dos quadros** (tabela abaixo). A faixa é a do medidor de força do CHARGE no momento da soltura.
- **A diferença de ângulo da vara acontece na transição do CHARGE para o CAST**, não dentro do CAST. O CHARGE para em ~30° (baixa), ~45° (média) ou ~58° (alta) para trás, e o CAST sempre começa no quadro 1 (~14°). Por isso, a vara gira mais nessa passagem quanto maior a força: a ponta anda 8,5 · 16,6 · 25,6 px, e as mãos, 1,4 · 2,8 · 5,1 px.
- **A duração total é sempre 460 ms.**
- A distância do arremesso continua sendo do jogo.

| Quadro | Força baixa (0–33) | Força média (34–66) | Força alta (67–100) |
|---|---|---|---|
| 1 · Impulso | 70 ms | 60 ms | 50 ms |
| 2 · Chicotada | 60 ms | 50 ms | 40 ms |
| 3 · **Soltura** | 80 ms | 70 ms | 60 ms |
| 4 · Acompanhamento | 100 ms | 120 ms | 150 ms |
| 5 · Assentamento | 150 ms | 160 ms | 160 ms |
| **Total** | **460 ms** | **460 ms** | **460 ms** |
| **Soltura da boia** (início do quadro 3) | **130 ms** | **110 ms** | **90 ms** |

Leitura: na força alta, o chicote é mais rápido e o acompanhamento mais longo, com o corpo "seguindo" o arremesso. Na força baixa, o movimento é mais contido.

## Momento da soltura (para a lógica do jogo)

| Item | Valor |
|---|---|
| Quadro da soltura | **3 (índice 2)**, nas três faixas |
| Instante após o comando de arremesso | **130 ms (força baixa) · 110 ms (média) · 90 ms (alta)** (início do quadro 3) |
| Ponta da vara nesse quadro | **(81, 38)** no quadro 96 × 96 (igual nos dois e nas três faixas, porque o desenho é o mesmo) |
| Recomendação | O jogo cria ou libera a boia **a partir da ponta da vara do quadro 3**, no instante da faixa correspondente. Antes disso, a boia não aparece |

Os tempos por faixa e os instantes de soltura estão em `cast.json` (`reproducao.faixas`, `reproducao.quadros[].msPorFaixa` e `soltura.msAposSoltarOControle`). A animação não depende de nenhuma mudança no P1. Hoje, o P1 inicia o voo da boia no instante da soltura; sincronizar com esses instantes fica para a missão de integração.

## Coordenadas (quadro 96 × 96; iguais para os dois)

| Quadro | Ângulo | Mão de trás (cabo) | Mão da frente (molinete) | Ponta da vara | Fim do cabo | Centro do molinete | Tronco |
|---|---|---|---|---|---|---|---|
| 1 | 14° | (51, 62) | (49, 54) | (42, 27) | (52, 68) | (53, 56) | −1 px |
| 2 | −16° | (52, 61) | (54, 54) | (62, 27) | (50, 67) | (58, 56) | 0 |
| 3 | −50° | (53, 61) | (59, 56) | **(81, 38)** | (48, 65) | (59, 60) | +1 px |
| 4 | −76° | (54, 61) | (62, 59) | (89, 52) | (48, 62) | (62, 63) | +1 px |
| 5 | −67° | (50, 64) | (57, 61) | (83, 50) | (44, 66) | (57, 65) | 0 |

- **Âncora (igual ao IDLE e ao CHARGE):** v4 deslocada (+30, +32); pés em x 39–56, y 91–95, com centro em x = 47,5; sola em **y = 94**; `setOrigin(0.5, 1)`.
- **Phaser 3:** `frameWidth: 96, frameHeight: 96`, índices 0–4. Animação pontual (`repeat: 0`) com a duração de cada quadro (`duration` por quadro) tirada da faixa de força em `cast.json`; ao terminar, voltar para o IDLE. São as mesmas texturas nas três faixas: só os tempos mudam.

## Verificações automáticas (o gerador falha se alguma não passar)

| Verificação | Resultado |
|---|---|
| Dimensões | ✔ 96 × 96 por quadro; spritesheet 480 × 96 |
| Transparência | ✔ alfa real; 0 pixels semitransparentes (spritesheets decodificados no Edge; quadros isolados lidos de novo) |
| Pés e âncora | ✔ pés (y 91–95) **idênticos ao IDLE aprovado** nos 5 quadros; sola em y = 94; contorno na última linha |
| Paleta | ✔ só cores da v4 de cada personagem |
| Identidade | ✔ cabeça idêntica à peça v4 (só translação de −1 a +1 px); 0 pixels do rosto cobertos; tronco intacto fora das áreas cobertas por braços, mãos, molinete e vara |
| Vara conectada e sem cortes | ✔ a linha da vara passa dentro das duas mãos; nenhum ponto da linha vazio; ponta visível; margem ≥ 3 px das bordas (menor margem: 6 px, quadro 4) |
| Sem partes desconectadas | ✔ corpo, braços e mãos formam uma peça só; o trecho da vara atrás do corpo encosta no corpo |
| Continuidade | ✔ as mãos nunca saltam mais de 6,5 px. Medido: CHARGE 3/4/5 → CAST 1: 1,4 · 2,8 · 5,1 · CAST 1→2: 5,0 · 2→3: 5,4 · 3→4: 4,2 · 4→5: 5,4 · CAST 5 → IDLE: 6,4 px |
| GIFs | ✔ GIF89a, loop infinito, todos os quadros completos (decodificador independente) |
| Tempos por faixa | ✔ o gerador falha se alguma faixa não somar 460 ms, se a soltura não cair em 130 / 110 / 90 ms ou se os tempos padrão das poses não forem os da faixa média |

## Problemas encontrados e correções
1. **Limite do plano: "mãos acima da cabeça" na chicotada.** No 3/4 de frente, as mãos acima da cabeça cobririam o rosto. **Solução:** a chicotada usa mãos na frente do peito e a vara passando ao lado da aba do boné, a mesma solução do quadro 1 do CHARGE.
2. **Saltos de mão de 7,0 px e 6,7 px** (quadros 1→2 e 2→3) na primeira versão. A trava de continuidade do gerador barrou. **Solução:** posições redistribuídas; o maior salto caiu para 5,4 px. Por isso, a soltura ficou em ~50° (40° acima da horizontal), em vez dos 60° pensados no plano.
3. **Plano com 4 quadros × missão com 5 fases.** Usei a autonomia da missão: 5 quadros (impulso, chicotada, soltura, acompanhamento, assentamento), com 460 ms no total, o mesmo previsto no plano.
4. Um erro de nome de variável no gerador (detectado na execução), corrigido antes de gerar.

## Limitações conhecidas
- **Quadro 1 (impulso):** a vara quase vertical fica atrás da cabeça, e só a ponta aparece acima dela, como no quadro 2 do CHARGE. Dura 60 ms, mas pode ler como uma "antena".
- **Ponta da vara entre quadros:** na chicotada e na soltura, a ponta anda 20–22 px por quadro. É o "chicote" proposital, mas, em pixel art sem quadros intermediários, pode parecer um corte se o jogo rodar com poucos quadros por segundo.
- **Sem linha de pesca nem curvatura da vara:** a linha e a boia são do jogo. A curvatura da vara fica para o REEL/FIGHT.
- **Sincronização com o voo da boia** (130 / 110 / 90 ms conforme a força) ainda não implementada no P1 (fora do escopo).
- **Escala no jogo (×1 ou ×2):** continua em aberto (D10).
