# HANGOVER FISHING
## Auditoria de Assets — v2

**Data:** 07/11/2026
**Referência:** GDD v0.6 (`docs/GDD.md`)
**Histórico:** v1 — folhas de expressões dos personagens · v2 — inclusão de `logo.jpg`, `peixes.jpg`, `peixes 2.jpg` e `peixes 3.jpg`
**Escopo:** todos os arquivos de imagem existentes na pasta do projeto.
**Método:** inspeção visual de cada arquivo, leitura de metadados (formato, dimensões, modo de cor, EXIF), detecção automática de fundo e de áreas ocupadas, e ampliação de recortes para verificar a grade de pixels.
**Regra:** nenhum arquivo foi editado, movido, renomeado ou substituído. As análises foram feitas em cópias temporárias.

---

## 1. Resumo executivo

- Foram encontrados **7 arquivos de imagem**, todos na raiz do projeto: 3 folhas de expressões (v1), 1 logotipo e 3 folhas de peixes e objetos (v2). Não há outras pastas de assets.
- **Nenhum dos 7 arquivos tem transparência real.** Todos são JPEG com o fundo xadrez desenhado dentro da imagem.
- As folhas de peixes trazem **as quatro espécies provisórias do GDD** (tilápia, aparente traíra, bagre e carpa), em vários tamanhos, além de uma **boia**: o conjunto mais diretamente útil para a Fase A.
- **Não existem spritesheets de animação.** Os três arquivos são **folhas de expressões (retratos de busto)**: 5 do Alemão, 5 do ALE, 4 da Maria e 4 do Sirius.
- **Nenhum arquivo está pronto para uso direto no Phaser 3.** Todos são JPEG sem transparência real, com o **fundo xadrez desenhado dentro da imagem**, quadros de tamanhos diferentes e, em dois arquivos, quadros encostados ou sobrepostos.
- Como **referência visual** e base para futuros retratos de diálogo, os arquivos são úteis e consistentes entre si (mesmo estilo de pixel art, mesma escala de busto).
- **Ausentes:** corpo inteiro, varas, todas as animações de pesca, cenário, peixes, boias, interface e áudio.

---

## 2. Inventário

| # | Caminho | Formato | Dimensões | Tamanho | Modo de cor | Transparência | Conteúdo |
|---|---|---|---|---|---|---|---|
| 1 | `alemao rosto.jpg` | JPEG | 768 × 1365 px | 538 KB | RGB | **Não** (xadrez desenhado) | 5 expressões do Alemão |
| 2 | `Pai rosto.jpg` | JPEG | 768 × 1365 px | 544 KB | RGB | **Não** (xadrez desenhado) | 5 expressões do ALE |
| 3 | `Maria e Sirius.jpg` | JPEG | 768 × 1365 px | 734 KB | RGB | **Não** (xadrez desenhado) | 4 expressões de Maria + 4 retratos de Sirius |
| 4 | `logo.jpg` | JPEG | 896 × 1195 px | 798 KB | RGB | **Não** (xadrez desenhado) | Logotipo do jogo |
| 5 | `peixes.jpg` | JPEG | 896 × 1195 px | 777 KB | RGB | **Não** (xadrez desenhado) | 4 espécies em tamanhos/poses, variantes de cor, cardume, boia (~34 elementos) |
| 6 | `peixes 2.jpg` | JPEG | 896 × 1195 px | 852 KB | RGB | **Não** (xadrez desenhado) | Peixes, invertebrados, plantas, objetos e itens de pesca (~29 elementos) |
| 7 | `peixes 3.jpg` | JPEG | 896 × 1195 px | 842 KB | RGB | **Não** (xadrez desenhado) | Peixes, invertebrados, plantas, objetos e itens de pesca (~28 elementos) |

Características comuns (válidas para os 7 arquivos):
- Arquivos 1–3: 768 × 1365 px (9:16). Arquivos 4–7: 896 × 1195 px (3:4).
- Sem metadados EXIF nem informação de DPI.
- Estilo pixel art, mas **sem grade regular de pixels**: os "pixels" aparentes têm cerca de 2 a 3 px de lado e variam de tamanho. Há artefatos de compressão JPEG nas bordas.
- O xadrez de fundo é **parte da imagem** (tons de cinza claro e branco, com blocos irregulares e borrados), não um canal alfa.

---

## 3. Análise por arquivo

### 3.1. `alemao rosto.jpg` — Alemão (Lucas)

**Organização:** uma única linha horizontal com 5 bustos, na faixa vertical **y ≈ 588–790**. Cerca de 85% da imagem é fundo vazio, acima e abaixo da linha.

| Quadro | Área aproximada (x) | Largura | Altura | Expressão (leitura visual) |
|---|---|---|---|---|
| 1 | 4–173 | ~170 px | ~202 px | Sério / desconfiado |
| 2 | 174–312 | ~139 px | ~202 px | Rindo (olhos fechados) |
| 3 | 313–449 | ~137 px | ~201 px | Preocupado / triste |
| 4 | 450–588 | ~139 px | ~204 px | Bravo / gritando |
| 5 | 589–765 | ~177 px | ~202 px | Surpreso / assustado |

**Elementos visuais observados:** cabelo cacheado castanho, barba e bigode, boné azul com logo de peixe, moletom azul com capuz e camiseta azul-clara.

**Problemas:**
- Os bustos **encostam e se sobrepõem** nos ombros. Não há espaço livre entre os quadros, e os cortes acima são estimados.
- Largura irregular dos quadros (~137 a ~177 px).
- O ombro do último quadro chega à borda direita da imagem.
- Os bustos terminam em um **corte reto horizontal** na base (y ≈ 789). Isso é aceitável para retrato, mas não serve como corpo.
- **Divergência com o GDD:** o GDD v0.3 descreve "jaqueta escura"; a folha mostra moletom azul. Não aparecem a vara nem o molinete vermelhos (o enquadramento é só de busto).

### 3.2. `Pai rosto.jpg` — ALE

**Organização:** uma linha horizontal com 5 bustos, na faixa **y ≈ 590–790**. Cerca de 89% da imagem é fundo.

| Quadro | Área aproximada (x) | Largura | Altura | Expressão (leitura visual) |
|---|---|---|---|---|
| 1 | 9–171 | ~163 px | ~195 px | Neutro / leve sorriso |
| 2 | 172–311 | ~140 px | ~196 px | Surpreso |
| 3 | 312–450 | ~139 px | ~194 px | Irritado / carrancudo |
| 4 | 451–596 | ~146 px | ~196 px | Gargalhada |
| 5 | 597–767 | ~171 px | ~200 px | Frustrado (mão na testa) |

**Elementos visuais observados:** cabelo e barba grisalhos, moletom cinza com capuz e uma estampa retangular no peito.

**Problemas:**
- Os quadros encostam e se sobrepõem nos ombros.
- O ombro do 5º quadro é **cortado pela borda direita** da imagem.
- Largura irregular dos quadros.
- **A estampa do moletom é indistinta:** um retângulo com uma figura borrada, sem personagem reconhecível. Isso se relaciona com a seção 15 do GDD (Vegeta).
- **Nomenclatura:** o arquivo usa o nome antigo "Pai". O nome oficial do personagem passou a ser ALE.

### 3.3. `Maria e Sirius.jpg` — Maria e Sirius

**Organização:** grade de **4 linhas × 2 colunas**. Na coluna esquerda fica Maria; na direita, Sirius. Esta é a folha mais bem separada: há espaço livre entre todos os quadros.

| Linha | Maria (x 50–283) | Sirius (x ~456–706) |
|---|---|---|
| 1 (y ~52–357) | Sorrindo · 233 × 305 px | Enrolado em manta azul, expressão curiosa · 250 × 290 px |
| 2 (y ~388–692) | Surpresa · 233 × 304 px | Rindo, macacão bege estampado · 228 × 271 px |
| 3 (y ~724–1029) | Preocupada / triste · 233 × 305 px | Óculos redondos, body branco, expressão curiosa · 233 × 264 px |
| 4 (y ~1061–1359) | Brava / séria · 233 × 298 px | Óculos redondos, body branco, sorrindo · 233 × 257 px |

**Elementos visuais observados:**
- Maria: cabelo escuro cacheado e longo, blusa branca com estampa floral azul, aparelho dental visível no retrato sorrindo.
- Sirius: três visuais diferentes (manta azul; macacão bege; óculos redondos com body branco).

**Problemas:**
- **Escala diferente** das outras folhas: os quadros de Maria (~233 × 305 px) são bem maiores que os bustos do Alemão e do ALE (~140–175 × ~200 px).
- **Os retratos de Sirius não têm tamanho uniforme** (altura de ~257 a ~290 px).
- **Visual de Sirius inconsistente** entre os quadros: três roupas diferentes.
- **Propriedade intelectual:** os quadros 3 e 4 de Sirius usam elementos associados a Harry Potter (óculos redondos, cicatriz em forma de raio na testa, body com "MAGIC BY BIRTH" e desenho de óculos). Registrado na seção 15 do GDD.
- **Remoção de fundo mais difícil:** a blusa de Maria e o body de Sirius são brancos ou quase brancos, as mesmas cores do xadrez desenhado. Uma remoção automática por cor tende a apagar partes das roupas.
- **Expressões ausentes para o design atual:** não há Sirius chorando, Sirius dormindo nem Maria acalmando Sirius (necessários para o evento proposto na seção 3.8 do GDD).

### 3.4. `logo.jpg` — Logotipo

**Conteúdo:** emblema circular azul-marinho com borda de corda dourada. No topo, faixa vermelha com "HANGOVER FISHING". No centro, o Alemão sorrindo, com vara de pesca (com boia vermelha e branca) e uma caneca de bebida com "H". Abaixo, um peixe que aparenta ser tilápia, preso a um anzol, e o texto "COOP ARCADE". Detalhes: anzol à esquerda, lata à direita, **esfera laranja com estrela** no topo e um **rosto de bebê chorando** na base.

**Observações:**
- Fundo xadrez desenhado; precisa de recorte para ser usado sobre qualquer fundo (tela inicial, ícone).
- **Esfera laranja com estrela:** elemento associado a Dragon Ball (registrado na seção 15 do GDD).
- **Caneca e lata:** referência a bebida, que pode afetar a classificação etária em lojas (seção 15 do GDD).
- **Só o Alemão aparece**, embora o jogo seja cooperativo com ALE como segundo protagonista. É uma escolha de composição do criador, registrada apenas como observação.
- Diferenças com o GDD: a vara do Alemão no logo é marrom/neutra, não vermelha (o GDD define vara e molinete **vermelhos** como obrigatórios).
- Grade de pixels irregular e textos com contorno de compressão. Para ícone de aplicativo (tamanhos pequenos), o logo detalhado provavelmente precisará de uma versão simplificada.

**Avaliação:** pronto como **referência de identidade**; precisa de tratamento para uso no jogo.

### 3.5. `peixes.jpg` — Espécies provisórias

**Organização:** linhas horizontais de peixes, sem grade uniforme.

| Linha | Conteúdo (leitura visual) | Uso possível |
|---|---|---|
| 1 | Tilápia em 5 tamanhos decrescentes | Variação de tamanho/peso |
| 2 | Peixe alongado com nadadeira caudal arredondada e manchas (aparenta ser **traíra**), 3 tamanhos + 2 poses com linhas de velocidade | Tamanhos + pose de fuga |
| 3 | **Bagre** com barbilhões, 3 tamanhos + 2 poses fuçando a lama | Tamanhos + comportamento no fundo |
| 4 | **Carpa**, 3 tamanhos + pose de boca aberta com bolhas; **silhuetas de cardume** à direita | Tamanhos + "comendo"; sombras de peixes passando |
| 5–6 | Variantes de tilápia: **verde**, **escura** e **dourada**, cada uma em tamanho grande e pequeno (as duas linhas são quase idênticas) | Variantes raras; possível duplicata |
| 7 | **Boia** vermelha e branca | Boia do jogo |

**Observações:**
- A identificação das espécies é visual e **não confirmada**. A "traíra" em especial pode ser lida como outro peixe.
- As "poses" (fuga, fuçando a lama, comendo) não são animações quadro a quadro; são poses isoladas.
- As linhas 5 e 6 parecem duplicadas.
- O tamanho dos peixes varia livremente dentro de cada linha, sem escala definida.
- **A boia é vermelha e branca**, igual para os dois jogadores. O GDD pede identidade por cor das varas; a cor das boias por jogador ainda não foi definida.

### 3.6. `peixes 2.jpg` — Peixes, objetos e itens

Leitura visual, linha a linha:
1. Acará-bandeira, apaiari (oscar), cascudo, piranha.
2. Vitórias-régias, 3 tufos de plantas aquáticas, galho.
3. Siri/caranguejo azul, lagostim, caramujo, larvas de inseto.
4. Peixe camuflado junto a um tronco, piranha atacando, moeda ("Gold Coin 1"), bota ("Trash Boot"), garrafa ("Empty Bottle").
5. Truta arco-íris em 3 tamanhos, molinete.
6. Puçá, boia salva-vidas, iscas artificiais ("Lost Lures"), anzóis.
7. Baú, pneu, âncora.

### 3.7. `peixes 3.jpg` — Peixes, objetos e itens

Leitura visual, linha a linha:
1. Néon, betta, cascudo-zebra, peixe rosado (espécie não identificada).
2. Planta vermelha (aparência de coral), plantas aquáticas, galho.
3. Camarão, besouros aquáticos, larva, mexilhão/concha, caramujo.
4. Escama ("Fish Scale x1"), isca rara ("Rare Lure"), pilha de tesouro ("Treasure Pile").
5. Truta (aparência de truta-de-riacho) em 3 tamanhos, carretilha ("Baitcaster Fishing Reel").
6. Balde de isca ("Bait Bucket"), latas de isca ("Bait Tins"), anzóis.
7. Âncora ("Sunken Anchor"), galão vazio ("Empty Fuel Can"), bota velha ("Old Boot").

**Observações comuns às folhas 2 e 3:**
- **Textos em inglês desenhados na imagem** (rótulos). Precisam ser removidos se os itens forem usados.
- Mistura de ambientes: peixes de rio, **peixes de aquário** (néon, betta), **itens marinhos ou de fantasia** (siri azul, coral, âncora, baú, tesouro). Parte disso não combina com a ambientação de rio e com a orientação "não transformar tudo em fantasia" (GDD, seção 10). Decidir ao montar o elenco.
- Itens com potencial imediato e coerente: **bota, garrafa, pneu, lata/galão** (capturas inusitadas), **plantas, vitória-régia e galhos** (cenário), **molinete e carretilha** (equipamento futuro), **iscas e balde** (sistema de iscas futuro), **puçá** (animação de captura).
- Duplicatas de tema entre as folhas (dois molinetes, duas âncoras, duas botas, dois caramujos, galhos e anzóis): úteis como variantes ou redundantes.
- Os trechos de fundo xadrez em volta das plantas e do pneu incluem "chão" (terra/areia) desenhado, que precisaria ser recortado ou mantido conforme o uso.

---

## 4. Adequação ao Phaser 3

### 4.1. O que o Phaser espera de um spritesheet

Explicação rápida dos conceitos, para referência futura:
- **Transparência real:** o fundo precisa ser transparente (canal alfa), o que normalmente exige **PNG**. JPEG não suporta transparência.
- **Spritesheet com grade uniforme:** o Phaser corta a imagem em quadros de **mesmo tamanho** (ex.: todos com 64 × 64 px), lidos da esquerda para a direita e de cima para baixo. Quadros de tamanhos diferentes ou sobrepostos quebram esse corte.
- **Atlas de texturas (alternativa):** quando os quadros têm tamanhos diferentes, usa-se uma imagem com um arquivo JSON que informa a posição e o tamanho de cada quadro. Isso dá mais flexibilidade, mas exige uma ferramenta para gerar o JSON.
- **Pixel art nítido:** a arte precisa ter uma grade de pixels consistente e ser ampliada em **múltiplos inteiros** (2×, 3×, 4×). Grades irregulares ficam borradas ou com pixels de tamanhos diferentes ao escalar.
- **Nomes de arquivo:** convém usar minúsculas, sem espaços e sem acentos (ex.: `ale-expressoes.png`), para evitar problemas de caminho no navegador e no servidor.

### 4.2. Avaliação

Folhas de expressões (v1):

| Critério | `alemao rosto.jpg` | `Pai rosto.jpg` | `Maria e Sirius.jpg` |
|---|---|---|---|
| Transparência real | ✗ | ✗ | ✗ |
| Formato adequado (PNG) | ✗ | ✗ | ✗ |
| Grade uniforme de quadros | ✗ (sobreposição) | ✗ (sobreposição, corte na borda) | Parcial (separados, tamanhos variam) |
| Grade de pixels consistente | ✗ | ✗ | ✗ |
| Escala consistente entre personagens | ~ (parecida com ALE) | ~ (parecida com Alemão) | ✗ (maior) |
| Nome de arquivo adequado | ✗ (espaço) | ✗ (espaço, nome antigo) | ✗ (espaços) |
| Aproveitamento de área | ~15% | ~11% | ~33% |

Logotipo e folhas de peixes/objetos (v2):

| Critério | `logo.jpg` | `peixes.jpg` | `peixes 2.jpg` | `peixes 3.jpg` |
|---|---|---|---|---|
| Transparência real | ✗ | ✗ | ✗ | ✗ |
| Formato adequado (PNG) | ✗ | ✗ | ✗ | ✗ |
| Grade uniforme de quadros | n/a | ✗ (organização livre) | ✗ | ✗ |
| Grade de pixels consistente | ✗ | ✗ | ✗ | ✗ |
| Escala consistente entre itens | n/a | ✗ (tamanhos livres) | ✗ | ✗ |
| Sem texto embutido | ✗ (texto do logo é intencional) | ✓ | ✗ (rótulos) | ✗ (rótulos) |
| Nome de arquivo adequado | ✓ | ✓ | ✗ (espaço) | ✗ (espaço) |

Observação técnica: como os itens das folhas de peixes têm tamanhos livres, o formato mais adequado no futuro é um **atlas de texturas** (imagem + JSON com a posição de cada item), não um spritesheet de grade uniforme.

**Conclusão:** nenhum dos 7 arquivos pode ser carregado no Phaser sem tratamento. As folhas de expressões servem como **referência visual** e **matéria-prima para retratos**; o logo, como **referência de identidade**; as folhas de peixes, como **base para o elenco de peixes, objetos e cenário**.

---

## 5. Classificação dos recursos

### 5.1. Prontos para uso direto
- **Nenhum.**

### 5.2. Utilizáveis após tratamento

| Recurso | Uso possível | Tratamento necessário (não executado) |
|---|---|---|
| 5 expressões do Alemão | Retratos de diálogo/reação | Remover o xadrez, separar quadros sobrepostos, padronizar o tamanho, exportar PNG |
| 5 expressões do ALE | Retratos de diálogo/reação | Idem + recompor o ombro cortado do 5º quadro |
| 4 expressões de Maria | Retratos de comentários | Remover o xadrez com cuidado (blusa branca), ajustar a escala às demais folhas |
| 4 retratos de Sirius | Retratos de reação | Definir o visual padrão, remover o xadrez (roupas brancas), padronizar o tamanho; avaliar a referência a Harry Potter |
| Tilápia, traíra (aparente), bagre, carpa em vários tamanhos | Peixes da Fase A (substituindo o greybox depois) | Recorte, PNG com alfa, escala padronizada, atlas |
| Variantes de tilápia (verde, escura, dourada) | Variantes raras | Idem; confirmar se as linhas 5 e 6 são duplicadas |
| Boia | Boia do jogo | Recorte; decidir se há boia por jogador (cor) |
| Bota, garrafa, pneu, lata/galão | Capturas inusitadas (sugestão S6 do GDD) | Recorte; remover rótulos |
| Plantas, vitória-régia, galhos, tronco | Elementos de cenário | Recorte; decidir sobre o "chão" desenhado |
| Molinete, carretilha, iscas, balde, puçá, anzóis | Equipamentos, iscas (futuro), animação de captura | Recorte; remover rótulos |
| Logotipo | Tela inicial | Recorte; avaliar esfera de Dragon Ball e bebida; versão simplificada para ícone |

Observação: como a grade de pixels é irregular, a recomendação mais sustentável a longo prazo é **redesenhar** sobre essas referências em uma grade fixa, em vez de apenas limpar os arquivos. **[PROPOSTA]**

### 5.3. Ausentes

**Personagens jogáveis (Alemão e ALE):** *(sem alteração na v2)*
- Sprite de corpo inteiro (vista lateral).
- Vara e molinete vermelhos (Alemão) / vara preta e amarela (ALE) como parte do sprite ou como objeto separado.
- Animações: idle, carregar arremesso, arremesso, espera, fisgada, recolher linha, aliviar, captura (segurando o peixe), perda/frustração, comemoração.

Caminhada não é necessária no design atual: os personagens ficam parados na margem.

**Maria e Sirius:**
- Sprite de cena (Maria na margem, Sirius no colo/carrinho/manta — posição pendente).
- Sirius dormindo, inquieto e chorando.
- Maria acalmando Sirius.

**Demais:**
- Cenário do rio (fundo, água, margem, vegetação).
- ~~Peixes (pelo menos 3 perfis), boias~~ → **existem na v2** (`peixes.jpg`), ainda sem tratamento.
- Linhas de pesca (normalmente desenhadas pelo próprio jogo, não como imagem).
- Animações dos peixes (nadar, debater-se na briga, saltar).
- Água e fundo do rio.
- Interface: indicador de tensão, zonas de toque, pontuação, balões de fala.
- Áudio (música chiptune, efeitos, vocalizações 8-bit de Sirius).

Nada disso é necessário para o **greybox** do primeiro protótipo.

---

## 6. Recomendações (nada foi executado)

1. **Preservar os originais:** mover cópias (não os originais) para `docs/referencias/` e criar versões tratadas em uma pasta separada, por exemplo `assets/portraits/`. **[PROPOSTA — exige autorização]**
2. **Definir um padrão técnico antes de produzir arte:** tamanho base dos sprites, tamanho dos retratos, escala inteira de exibição, PNG com alfa e convenção de nomes. **[PROPOSTA]**
3. **Resolver as decisões visuais pendentes** (jaqueta × moletom do Alemão, visual padrão de Sirius, referência a Harry Potter, estampa do ALE) antes de qualquer tratamento.
4. **Não bloquear o protótipo** por causa dos assets: o greybox não depende de nenhum destes arquivos.

---

## 7. Arquivos que não puderam ser inspecionados

Nenhum. Os sete arquivos foram abertos e analisados integralmente.

## 8. Limitações desta auditoria

- As áreas e dimensões dos quadros foram obtidas por detecção automática do fundo e são **aproximadas** (± alguns pixels), principalmente nos quadros sobrepostos.
- As descrições de expressão são leituras visuais, não nomes definidos pelo criador.
- As identificações de espécies e objetos (v2) são leituras visuais e **não confirmam** espécies reais. As contagens de elementos são aproximadas.
- O criador descreveu as novas folhas como "galeria de fundo do mar"; o GDD define o cenário como **rio**. A auditoria descreve o conteúdo como ele aparece, sem decidir o uso.
- Não foi possível determinar a origem nem a ferramenta de criação dos arquivos (sem metadados).
