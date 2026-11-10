# Personagens-base — ALE e Alemão (IDLE)

**Status:** v1, v2 e v3 revisadas pela direção criativa. **v4 pronta para revisão. Nada aprovado.** Nenhum arquivo foi integrado ao P0 ou ao P1.
**Datas:** v1, v2, v3 e v4 em 09/11/2026

---

## v4 — Base consistente para as animações (sobre a v3)

### Arquivos novos (v1, v2 e v3 intactas, conferidas por hash)
| Arquivo | Conteúdo | Dimensões | Transparência |
|---|---|---|---|
| `alemao_idle_v4.png` | Alemão IDLE v4 | 64 × 64 px; personagem com 61 px de altura (y 3–63) | Alfa real (0 ou 255), cantos transparentes |
| `ale_idle_v4.png` | ALE IDLE v4 | 64 × 64 px; personagem com 60 px de altura (y 4–63) | Alfa real (0 ou 255), cantos transparentes |
| `previews/alemao_idle_v4_x6.png`, `previews/ale_idle_v4_x6.png` | Ampliações ×6 | 384 × 384 px | Alfa real |
| `previews/prancha_comparativa_v3_v4.png` | **Prancha V3 × V4** (só para revisão; sem textos) | 1144 × 690 px | Fundo opaco |
| `ferramentas/gerar_personagens_base_v4.js` | Gerador independente da v4; lê os PNG da v3 do disco para montar a prancha | — | — |

**Como ler a prancha:** colunas da esquerda para a direita: **Alemão v3 · Alemão v4 · ALE v3 · ALE v4**. Fundo cinza-arroxeado = v3; fundo cinza-amarelado = v4.
- Linha 1: corpo inteiro (×4).
- Linha 2: rostos (×10).
- Linha 3: mãos, vara e molinete (×8).

### O que mudou
| Ponto | v3 | v4 |
|---|---|---|
| **Vara contínua** | Dois traços (cabo→molinete e molinete→ponta); o trecho fino em diagonal virava uma "escadinha" com furos que parecia tracejada | **Uma única linha** do cabo à ponta, passando pelo molinete, com passos ligados lado a lado (sem furos diagonais). Grossa (2 px) até 6 px depois do molinete; fina só no fim. Cabo escuro sob a mão de baixo. ALE: faixas amarelas a cada 5 px no trecho depois do molinete |
| **Molinete integrado** | À direita da mão de cima, parecendo um botão ao lado da vara | **Pendurado logo abaixo da mão de cima** (a mão segura o pé do molinete, como na pesca real). Desenhado antes da vara, para a vara passar por cima do pé. Carretel redondo, cubo central e manivela com manopla, como na v3 |
| **Mãos** | Mão de cima sobre a vara, sem relação com o molinete | Mão de baixo fechada no cabo; mão de cima fechada no assento do molinete, com o molinete logo abaixo |
| **Braço da frente** | Bloco reto e rígido | Cotovelo levemente para fora; o antebraço volta para a mão (postura mais solta) |
| **Rosto do ALE** | Cabelo lateral descendo até a orelha ("capacete") | Cabelo lateral curto, terminando acima da orelha; nuca e orelha em pele. Rosto do **mesmo tamanho**; bigode separado da barba; queixo arredondado (como na v3) |
| **Alemão** | — | Cabeça, roupas e cores **idênticas à v3**. Só braço, mãos, vara e molinete mudaram, pelas mesmas regras técnicas aplicadas ao ALE |

### Verificações
| Verificação | Resultado |
|---|---|
| Dimensões | 64 × 64 nos dois |
| Transparência | Alfa real: 0 pixels semitransparentes; cantos transparentes |
| Mesma escala | Mesmo esqueleto e mesma pose; alturas de 61 px (Alemão, por causa do boné) e 60 px (ALE) |
| Mesma linha de base | Sola nos dois em y = 62, x 10–25; contorno em y = 63 |
| Vara dentro do quadro | Margens mínimas: esquerda 11 · direita 15 · topo 17 · base 23 px (o gerador falha abaixo de 3 px) |
| Versões anteriores | Os 20 arquivos de v1–v3 (PNGs, ampliações, pranchas e geradores) idênticos por hash. Só este README foi editado (seção v4 acrescentada no topo) |
| P0 e P1 | 38 arquivos idênticos (hash) |

---

## v3 — Refinamento final pontual (sobre a v2)

### Arquivos novos (v1 e v2 não foram alteradas)
| Arquivo | Conteúdo | Dimensões | Transparência |
|---|---|---|---|
| `alemao_idle_v3.png` | Alemão IDLE v3 | 64 × 64 px; personagem com 61 px de altura | Alfa real (0 ou 255), cantos transparentes |
| `ale_idle_v3.png` | ALE IDLE v3 | 64 × 64 px; personagem com 60 px de altura | Alfa real (0 ou 255), cantos transparentes |
| `previews/alemao_idle_v3_x6.png`, `previews/ale_idle_v3_x6.png` | Ampliações ×6 | 384 × 384 px | Alfa real |
| `previews/prancha_comparativa_v2_v3.png` | **Prancha V2 × V3** (só para revisão; sem textos) | 1144 × 682 px | Fundo opaco |
| `ferramentas/gerar_personagens_base_v3.js` | Gerador da v3; lê os PNG da v2 do disco para montar a prancha | — | — |

**Como ler a prancha:** colunas da esquerda para a direita: **Alemão v2 · Alemão v3 · ALE v2 · ALE v3**. Fundo cinza-esverdeado = v2; fundo cinza-arroxeado = v3.
- Linha 1: corpo inteiro (×4).
- Linha 2: rostos (×10).
- Linha 3: mãos, vara e molinete (×8).

### As três mudanças (e nada além delas)
| Pedido | Alteração |
|---|---|
| **1. Barba do ALE** menos quadrada e larga | A barba afina a cada linha (12 → 10 → 8 → 4 px) até um **queixo arredondado**. Costeleta de 1 px; as bochechas mostram a pele morena; o **bigode** cinza-escuro continua separado da barba curta clara. Cabelo, olhos, sobrancelhas, pele e tamanho da cabeça iguais à v2 |
| **2. Molinete** reconhecível, sem aparência de bloco | **Carretel circular** (7 × 7 com contorno e cantos cortados), face clara com a linha, **cubo central** e **manivela** saindo para a direita até uma **manopla em "T"**. Pendurado por uma haste logo à direita da mão de cima. Alemão: aro vermelho, face creme, cubo vermelho-escuro, manopla clara. ALE: aro preto, face cinza-clara, cubo, manivela e manopla amarelos |
| **3. Vara** sem corte nas bordas | Posição igual à v2 (ponta em 48, 17). O gerador agora **verifica e falha** se qualquer pixel da vara estiver a menos de 3 px de uma borda. Margens medidas nos dois sprites: **esquerda 11 px · direita 15 px · topo 17 px · base 23 px**. Nenhum corte |

Iguais à v2: cabeça do Alemão (boné, cabelo, barba), cabelo do ALE, roupas, calças (jeans e camuflado), botas, proporções, pose, mãos e pontos de articulação (`RIG`, exceto a posição do molinete).

---

## v2 — Refinamento pontual (revisão criativa de 09/11/2026)

### Arquivos novos (a v1 não foi sobrescrita)
| Arquivo | Conteúdo | Dimensões | Transparência |
|---|---|---|---|
| `alemao_idle_v2.png` | Alemão IDLE, revisão | 64 × 64 px; personagem com 61 px de altura | Alfa real (0 ou 255), cantos transparentes |
| `ale_idle_v2.png` | ALE IDLE, revisão | 64 × 64 px; personagem com 60 px de altura | Alfa real (0 ou 255), cantos transparentes |
| `previews/alemao_idle_v2_x6.png`, `previews/ale_idle_v2_x6.png` | Ampliações ×6 | 384 × 384 px | Alfa real |
| `previews/prancha_comparativa_v1_v2.png` | **Prancha comparativa** (só para revisão; fundo opaco; sem textos) | 1144 × 690 px | — |
| `ferramentas/gerar_personagens_base_v2.js` | Gerador da v2. Lê os PNG da v1 do disco para montar a prancha | — | — |

**Como ler a prancha (sem textos, de propósito):** colunas da esquerda para a direita: **Alemão v1 · Alemão v2 · ALE v1 · ALE v2**. Fundo azul-acinzentado = v1; fundo verde-acinzentado = v2.
- Linha 1: corpo inteiro (×4).
- Linha 2: rostos (×10).
- Linha 3: mãos, vara perto das mãos e molinete (×8).

### O que mudou
| Pedido | Alteração na v2 |
|---|---|
| ALE: bigode e barba curta mais reconhecíveis, sem aumentar o rosto | Mesmo contorno e mesmo tamanho de cabeça. **Bigode em ferradura** cinza-escuro, descendo pelos cantos da boca; **barba curta mais clara** que o cabelo, com sombra no queixo; boca entre os dois. Pele morena e cabelo grisalho iguais à v1 |
| Alemão: preservar a identidade | **Cabeça idêntica à v1** (boné, cabelo castanho, barba). Roupas e cores iguais |
| Postura de pescador relaxado esperando a fisgada | Mãos baixas, na altura do quadril: a de trás segura o cabo, a da frente segura o assento do molinete; cotovelos soltos junto ao corpo |
| Molinete mais legível | Maior (8 × 6 px, contando a manivela), com contorno próprio, **carretel claro** (linha) e **manivela com manopla**. Alemão: vermelho com carretel creme. ALE: preto com carretel cinza-claro e manivela amarela |
| Vara sem dominar a figura | Mais curta e menos inclinada: a ponta foi de (58, 1), no canto da tela, para (48, 17), na altura da cabeça. Grossa (2 px) do cabo ao molinete; fina (1 px) até a ponta |
| Preservar estilo, proporções, escala 64 × 64, silhuetas, roupas, camuflado e cores das varas | Mantidos. Tronco, pernas, botas e paletas de roupa são os mesmos da v1 |

### Preparação para as animações (avaliação; nenhuma animação foi produzida)
A v2 organiza o personagem em **partes fixas** (cabeça, tronco, pernas, botas) e **partes móveis** (braços, mãos, vara, molinete). As partes móveis são posicionadas por pontos de articulação (`RIG` no gerador: ombros, mãos, cabo, assento do molinete e ponta da vara). Uma animação troca só as partes móveis.

| Animação | O que muda | Precisa redesenhar o corpo? |
|---|---|---|
| 1. IDLE | Esta pose; respiração pode ser 1 px de deslocamento do tronco e da cabeça | Não |
| 2. CHARGE | Braços sobem; mãos perto do ombro; vara aponta para trás e para cima | Não: novas peças de braço e novos pontos de vara |
| 3. CAST | Braços à frente; vara à frente; linha saindo da ponta | Não: novas peças de braço |
| 4. REEL/FIGHT | Mãos na cintura; a mão da frente gira a manivela (o molinete já está na mão da frente); vara mais vertical e **curvada** (desenhar a vara como curva, não reta); corpo inclinado para trás 1–2 px | Tronco e cabeça: só deslocamento. Pernas: talvez 1 variação de base mais aberta |
| 5. CATCH | O braço da frente sobe segurando o peixe; a vara fica na mão de trás | Não: nova peça de braço levantado |
| 6. FRUSTRATION | A mão da frente vai à cabeça; a cabeça abaixa 1 px | Rosto: 1 variação de expressão (olhos e boca) por personagem |

**Pontos de atenção para a próxima fase:**
- **Tamanho do quadro:** em CHARGE e CAST, a vara de ~37 px a partir do molinete pode sair do quadro de 64 × 64. Recomendo quadros de animação mais largos (por exemplo, 96 × 64) com os pés no mesmo ponto em todos os quadros, ou desenhar a vara cortada nesses quadros.
- **Expressões:** a folha de rostos tem 5 expressões por personagem. Nesta escala, cada expressão vira 2–4 pixels de olhos e boca; dá para fazer variações de cabeça sem redesenhar o crânio.
- **Lado da tela:** os dois continuam voltados para a direita; espelhar no jogo (`flipX`) serve para o jogador da metade direita.

### Limitações da v2
- Continua sendo pixel art desenhada em código, nível de primeira versão refinada.
- O rosto tem ~12 × 12 px: o bigode e a barba do ALE ficaram mais legíveis, mas o reconhecimento continua dependendo do conjunto (cabelo grisalho, pele morena, moletom chumbo, camuflado, vara preta e amarela).
- A prancha é só para revisão; nenhum PNG v2 foi colocado no jogo.

---

## v1 — Primeira versão (registro original)

## Arquivos

| Arquivo | Conteúdo | Dimensões | Transparência |
|---|---|---|---|
| `alemao_idle.png` | Alemão, IDLE (roupa da folha de rosto e do logotipo) | 64 × 64 px | Alfa real (0 ou 255) |
| `ale_idle.png` | ALE, IDLE | 64 × 64 px | Alfa real (0 ou 255) |
| `alemao_idle_variante_jaqueta_escura.png` | **Opcional:** mesmo Alemão, com jaqueta escura (GDD v0.3 e `sprite.jpg`) | 64 × 64 px | Alfa real (0 ou 255) |
| `previews/*_x6.png` | Ampliações ×6 de cada sprite (vizinho mais próximo, sem suavização) | 384 × 384 px | Alfa real |
| `previews/prancha_revisao_x4.png` | Os três lado a lado, ×4, sobre fundo de rio e margem. **Só para revisão; não é sprite** | 896 × 320 px | Fundo opaco |
| `ferramentas/gerar_personagens_base.js` | Gerador: todos os pixels estão desenhados à mão em mapas de caracteres. Recria os PNG com `node arte/personagens-base/ferramentas/gerar_personagens_base.js` | — | — |

Nenhum texto, nome, legenda ou marca d'água dentro dos sprites. Nenhum quadriculado desenhado. Nenhuma suavização.

## Escala

| | Alemão | ALE |
|---|---|---|
| Altura do personagem (do topo à sola, com contorno) | 61 px (topo do boné em y = 3) | 60 px (topo do cabelo em y = 4) |
| Largura do corpo | ~20 px | ~20 px |
| Linha dos pés | sola em y = 62, contorno em y = 63 | igual |
| Vara | sai das mãos (~x 19–27) até a ponta em (58, 1) | igual |
| Cores | ~30 | ~30 |

- Os dois usam **o mesmo esqueleto** (tronco, braços, pernas, botas, pose e vara), então altura, proporção, contorno e iluminação são iguais. A diferença está na cabeça, nas roupas e nas cores.
- Proporção de cerca de 4,5 cabeças: compacta, mas não infantil.
- Contorno escuro único (`#1b1622`) por fora; luz vindo da esquerda (realce à esquerda, sombra à direita).
- Os dois estão **voltados para a direita**. No jogo, o jogador da metade direita pode ser espelhado (`flipX` no Phaser), sem desenho extra.
- **Escala no jogo: a decidir na integração.** Em ×1, o personagem ocupa ~16% da altura de uma tela de 390 px; em ×2, ~31%. Use só múltiplos inteiros, para não borrar o pixel art. Essa decisão depende da etapa de layout lateral (decisão D10 do GDD).

## Referências analisadas

| Arquivo | Uso |
|---|---|
| `alemao rosto.jpg` | **Referência obrigatória** do rosto do Alemão |
| `Pai rosto.jpg` | **Referência obrigatória** do rosto do ALE (o nome antigo do arquivo não muda o nome do personagem) |
| `logo.jpg` | Confirma a roupa do Alemão: boné com peixe, moletom azul, camiseta azul-clara |
| `sprite.jpg` | Folha de 6 poses do Alemão (corpo inteiro): jaqueta escura, jeans, botas, vara vermelha. **Arquivo novo, ainda não está em `docs/ASSET_AUDIT.md`** |
| `sprite 2.jpg` | Folha de 6 poses do ALE: moletom chumbo com estampa, calça camuflada, botas, vara preta e amarela. **Arquivo novo, não auditado** |
| `arte 1.jpg` | Elementos de cenário (plantas, pedras, troncos, água, placas): estilo de contorno e paleta. **Arquivo novo, não auditado** |
| `arte 2.jpg` | Equipamentos, iscas, objetos e ícones. Confirma as duas varas: "Fishing Rod 1" vermelha e "Fishing Rod 2" preta e amarela. **Arquivo novo, não auditado** (tem textos em inglês desenhados na imagem) |
| `arte 3.jpg` | Peixes com nomes (tilápia, carpa, traíra, bagre, lambari, tucunaré, dourado, black bass etc.) e crustáceos. Usado só para coerência de estilo. **Arquivo novo, não auditado** (tem textos desenhados na imagem) |
| `peixes*.jpg` | Coerência de estilo (contorno escuro, sombras simples) |

Nada foi recortado ou copiado das referências: tudo foi redesenhado nesta escala. As imagens originais não foram alteradas.

## Características identificadas e como foram traduzidas

### Alemão (Lucas)
| Na referência | No sprite |
|---|---|
| Boné com frente cinza-azulada, emblema azul-marinho com peixe claro e aba azul | Boné com frente clara, emblema escuro com 3 pixels claros (o peixe) e aba azul apontando para a frente |
| Cabelo castanho-escuro ondulado, volumoso, saindo por baixo do boné até a altura do pescoço | Cabelo castanho caindo atrás da orelha até os ombros |
| Sobrancelhas grossas e escuras | Sobrancelhas de 3 px, escuras |
| Barba cheia castanha, com bigode | Barba cheia, mais escura que o cabelo, cobrindo a mandíbula até o peito |
| Pele clara | Tom pêssego claro |
| Moletom azul aberto, camiseta azul-clara | Moletom azul aberto, faixa azul-clara no centro |
| (`sprite.jpg`) Jeans e botas marrons | Calça jeans e botas marrons |
| Vara e molinete vermelhos (GDD 14.3) | Vara e molinete vermelhos, cabo escuro |

### ALE
| Na referência | No sprite |
|---|---|
| Cabelo grisalho curto e texturizado, sem boné | Cabelo cinza com pixels mais claros (textura); sem boné |
| Sobrancelhas retas e escuras | Sobrancelhas retas cinza-escuras |
| Barba curta e aparada, grisalha, com bigode; mandíbula quadrada | Barba curta cinza-clara, bigode um pouco mais escuro, queixo quadrado |
| Orelha visível | Orelha em tom de pele, separando o cabelo da barba |
| Pele morena (a missão pede um pouco mais escura) | Tom moreno, mais escuro que o do Alemão |
| Moletom chumbo com cordões e estampa indistinta no peito | Moletom chumbo fechado, dois cordões claros, uma pequena estampa cinza **indistinta** e bolso frontal |
| (GDD 2.2 e `sprite 2.jpg`) Calça camuflada | Camuflado em blocos de 2 × 2 (verde-oliva, verde-escuro, marrom, bege) |
| Vara preta e amarela (GDD 14.3) | Vara preta com faixas amarelas, ponta amarela, molinete preto com detalhes amarelos |

**Diferenças entre os dois:** cabeça (boné e cabelo castanho × cabelo grisalho), barba (longa e castanha × curta e grisalha), pele (clara × morena), moletom (azul aberto × chumbo fechado), calça (jeans × camuflado) e vara (vermelha × preta e amarela). Nada foi aproximado entre eles.

## Decisões

### Extraídas da documentação ou das referências
- Nomes: **ALE** e **Alemão** (GDD 2.1 e 2.2).
- Vara e molinete vermelhos para o Alemão; vara preta e amarela para o ALE (GDD 14.3, **[APROVADO]**).
- ALE: cabelo grisalho, moletom com estampa, calça camuflada (GDD 2.2).
- Alemão: cabelo cacheado, barba e bigode, boné, calça comprida (GDD 2.1).
- Pixel art com contorno escuro e poucas cores (GDD 14.2 e esta missão).

### Propostas nesta entrega (a revisar)
1. **Roupa do Alemão:** o GDD (v0.3) diz "jaqueta escura"; a folha de rosto e o logotipo mostram moletom azul; `sprite.jpg` usa jaqueta escura. A pendência **#18 do GDD** continua aberta. A versão principal segue a folha de rosto (referência obrigatória desta missão) e o logotipo. A variante com jaqueta escura foi feita só para facilitar a decisão (mesmos pixels, outra paleta).
2. **Estampa do moletom do ALE:** desenhada como uma marca **indistinta**, como na folha de rosto. **Não** desenhei o Vegeta, por causa da observação de propriedade intelectual (GDD 15). Nesta escala, a estampa teria 3 × 3 px de qualquer forma.
3. **Pose IDLE:** em pé, relaxado, segurando a vara com as duas mãos na altura da cintura, ponta para cima e para a frente; molinete entre as mãos; sem linha de pesca visível.
4. **Tamanho 64 × 64** com o personagem em ~61 px: espaço para a vara e para as futuras animações sem trocar o tamanho do quadro.
5. **Botas marrons e jeans** para o Alemão, vindos de `sprite.jpg` (o GDD só diz "calça comprida").

## Limitações
- **Não há gerador de imagens por IA nesta sessão.** Os sprites foram desenhados pixel a pixel em código. O resultado é pixel art real e editável, mas o nível de acabamento é de uma primeira versão; um artista ou uma ferramenta de pixel art pode refinar a partir dela.
- **Semelhança limitada pela escala:** o rosto tem cerca de 12 × 12 px. A identidade é transmitida pelo conjunto (boné, cabelo, barba, pele, roupa, vara), não por traços finos do rosto, como é comum em sprites 16-bit.
- **Três quartos simplificado:** o rosto está voltado para a direita, com o corpo quase de frente, para manter a silhueta legível.
- **Sem animação**, como pedido. As seis animações aguardam a revisão destes dois personagens.
- `sprite.jpg`, `sprite 2.jpg`, `arte 1.jpg`, `arte 2.jpg` e `arte 3.jpg` são JPEG com fundo branco ou quadriculado desenhado, sem transparência; não foram usados como sprites. Nenhum deles foi registrado em `docs/ASSET_AUDIT.md` (fora do escopo desta missão).
