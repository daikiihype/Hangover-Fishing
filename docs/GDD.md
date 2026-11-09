# HANGOVER FISHING
## Game Design Document — GDD v0.6

**Projeto:** Hangover Fishing
**Gênero:** Arcade de pescaria, comédia e cooperativo local
**Plataforma inicial:** Mobile
**Orientação:** Horizontal (landscape)
**Jogadores:** 2 jogadores simultâneos no mesmo dispositivo
**Câmera:** Lateral 2D
**Estética:** Pixel art retrô, inspirada em jogos arcade dos anos 90/2000
**Tecnologia sugerida:** Phaser 3 + JavaScript + HTML5/CSS
**Data da versão:** 07/11/2026
**Status do documento:** Em consolidação — nenhuma implementação iniciada. Próximo passo: Protótipo 0 (teste de multitouch), planejado em `docs/PLANO_PROTOTIPO_MULTITOUCH.md`.

---

# 0. COMO LER ESTE DOCUMENTO

## 0.1. Legenda de status

Cada decisão relevante está marcada com um dos status abaixo:

| Status | Significado |
|---|---|
| **[APROVADO]** | Decisão confirmada pelo criador. Não alterar sem nova aprovação. |
| **[PROPOSTA]** | Ideia documentada, ainda a validar com o criador e/ou em protótipo. |
| **[PROVISÓRIO]** | Conteúdo temporário que será substituído (ex.: greybox, espécies de estudo). |
| **[PROTÓTIPO]** | Entra no escopo do primeiro protótipo. |
| **[FUTURO]** | Fora do primeiro protótipo; mantido documentado para versões posteriores. |
| **[PENDENTE]** | Dúvida aberta que precisa de decisão do criador. Ver seção 19. |
| **[AUTONOMIA]** | Decisão de gameplay tomada pelo diretor criativo de gameplay (ChatGPT) dentro da autonomia criativa (seção 0.3). Vale até ser ajustada ou vetada pelo criador; não exige aprovação individual. |

## 0.2. Histórico de versões

| Versão | Alterações principais |
|---|---|
| v0.3 | Conceito base: personagens Alemão e Pai, cenário do rio, mecânica de pesca em cinco etapas, tensão, cooperação, eventos, diálogos, escopo do protótipo. |
| v0.4 | Controles contextuais com zona única por jogador; tensão com dois riscos (arrebentar / escapar); iscas movidas para o futuro; cooperação avançada adiada; abordagem greybox; observação de propriedade intelectual; inclusão oficial de **Maria** e **Sirius**; proposta do evento "Sirius chorando"; separação entre protótipo e futuro; registro de pendências. |
| v0.4 (complemento) | Relações familiares oficiais (Pai é sogro do Alemão, pai da Maria e avô do Sirius); correção do texto da v0.3 que tratava o Pai como pai do Alemão; Maria definida como comentarista e observadora; vocalizações de bebê do Sirius; dinâmica entre os quatro personagens; regras de frequência de falas (proposta); pendências atualizadas. |
| v0.5 | Nome oficial **ALE** (substitui "Pai"); Alemão identificado como **Lucas**, marido de Maria e pai de Sirius; relações e formas de tratamento completas; personalidades aprovadas de ALE e Maria; relação ALE–Lucas sem dinâmica obrigatória de provocação; Maria e Sirius como personagens obrigatórios; Maria não pesca; sons de Sirius exclusivamente 8-bit, sem apelidos; referência à auditoria de assets (`docs/ASSET_AUDIT.md`); observação de PI sobre referência a Harry Potter em retratos de Sirius; análise do escopo do protótipo; pendências e inconsistências atualizadas. |
| v0.6 | Registro da diretriz de **autonomia criativa** para a direção de gameplay (seção 0.3); novas mecânicas aprovadas: **toque prematuro ignorado** e **recolher a linha sem peixe** (seções 5.3 e 6.6); revisão de gameplay com sugestões separadas (seção 20); planejamento do **Protótipo 0 — teste de multitouch** (seção 16.4 e `docs/PLANO_PROTOTIPO_MULTITOUCH.md`); referência aos novos assets (logo e três folhas de peixes e objetos, ver `docs/ASSET_AUDIT.md`); novas observações de PI e de distribuição; pendências reclassificadas por momento de decisão. |
| v0.6 (complemento) | Divisão de responsabilidades: ChatGPT como diretor criativo de gameplay, Claude na análise técnica, arquitetura, auditoria e implementação; plano do Protótipo 0 **aprovado** (implementação aguarda missão); mecânica "soltar e tocar de novo dentro da janela de mordida" registrada para teste futuro; pendências A1 e A2 resolvidas. |

## 0.3. Diretriz de autonomia criativa **[APROVADO]**

O criador concedeu autonomia criativa à direção de gameplay para conceber mecânicas e sistemas de Hangover Fishing, incluindo:
- Mecânicas de pesca.
- Sistemas de progressão.
- Eventos aleatórios.
- Interações entre personagens.
- Cooperação entre jogadores.
- Espécies e comportamentos de peixes (como conteúdo do jogo).
- Desafios, recompensas e modos de jogo.
- Balanceamento e ajustes de experiência.

Regras da autonomia:
- **Não é necessário pedir aprovação individual** para cada pequena ideia de gameplay.
- O objetivo é uma experiência divertida, original, coerente e com personalidade.
- O lançamento inicial não precisa ser a versão definitiva; o jogo pode evoluir com patches de correção, balanceamento e conteúdo.
- Toda decisão continua **documentada** com o status apropriado (decisões tomadas sob autonomia usam **[AUTONOMIA]**).

Limites — a autonomia **não** autoriza:
- Inventar informações pessoais dos personagens ou histórias reais.
- Alterar decisões familiares confirmadas (seção 2.4).
- Modificar, substituir ou apagar assets originais sem autorização.
- Reverter decisões marcadas como **[APROVADO]**.

Espécies: a autonomia permite criar o elenco de peixes **do jogo**. Isso continua separado da pergunta "quais peixes a família realmente pesca", que não deve ser inventada (seção 8).

### Divisão de responsabilidades **[APROVADO]**

| Papel | Responsável | Escopo |
|---|---|---|
| Direção do projeto | **Criador** | Visão, decisões finais, informações pessoais e familiares, assets originais |
| Diretor criativo de gameplay | **ChatGPT** | Mecânicas, sistemas, eventos, progressão e balanceamento, com a autonomia desta seção |
| Análise técnica e implementação | **Claude** | Análise técnica, arquitetura, auditoria e implementação, conforme as missões recebidas |

Regras de status decorrentes:
- A autonomia criativa pertence **ao ChatGPT**. Somente decisões dele usam **[AUTONOMIA]**.
- O Claude pode apresentar sugestões de gameplay, mas elas permanecem **[PROPOSTA]** até serem incorporadas pela direção criativa ou aprovadas pelo criador.
- As sugestões da seção 20 seguem essa regra.

---

# 1. VISÃO GERAL

Hangover Fishing é um jogo arcade de pescaria cooperativo para dois jogadores, inspirado em situações reais e nos primeiros meses de experiência de dois pescadores.

Os protagonistas são **Alemão** (Lucas) e **ALE**, seu sogro, que compartilham a mesma margem de um rio, cada um com sua própria vara. **[APROVADO]**

> Correção da v0.3: o texto original dizia "o Alemão e seu pai". A relação correta é sogro e genro (ver seção 2.4). Até a v0.4 o personagem se chamava provisoriamente "Pai"; o nome oficial é **ALE**.

O universo do jogo também inclui, como personagens **obrigatórios**, **Maria** — filha de ALE e esposa de Lucas — e **Sirius**, filho de Maria e Lucas e neto materno de ALE, um bebê de aproximadamente dois meses (ver seção 3). **[APROVADO]**

O jogador deverá arremessar a linha, esperar a fisgada, controlar a tensão, brigar com o peixe e realizar a captura.

A experiência mistura uma mecânica de pesca baseada em habilidade com humor, diálogos contextuais, eventos inesperados e competição amigável.

O objetivo não é criar um simulador rigoroso, mas uma experiência divertida que preserve elementos reconhecíveis da pescaria.

**Princípio central:** duas pessoas, um celular, duas varas e um rio cheio de possibilidades.

---

# 2. PERSONAGENS JOGÁVEIS

## 2.1. Alemão (Lucas) — Player 1

| Item | Definição | Status |
|---|---|---|
| Nome utilizado no jogo | **Alemão** | **[APROVADO]** |
| Nome real | **Lucas** | **[APROVADO]** |
| Relações | Marido de Maria · genro de ALE · pai biológico de Sirius | **[APROVADO]** |
| Como é chamado | ALE o chama de **"Alemão"** · Maria o chama de **"Lucas"** | **[APROVADO]** |

Inspirado na primeira fotografia fornecida.

Características visuais (v0.3):
- Cabelo cacheado.
- Barba e bigode.
- Boné.
- Jaqueta escura.
- Calça comprida.
- Vara de pesca vermelha.
- Carretilha ou molinete vermelho.

Equipamento característico: conjunto de pesca vermelho. **[APROVADO]**

> Observação da auditoria de assets: a folha de expressões existente (`alemao rosto.jpg`) mostra boné azul com logo de peixe, moletom azul com capuz e camiseta azul-clara. "Jaqueta escura" (v0.3) e "moletom azul" (folha) precisam ser conciliados. **[PENDENTE]** — ver `docs/ASSET_AUDIT.md`.

Personalidade inicial proposta (v0.3) **[PROPOSTA]** — ainda não confirmada pelo criador:
- Gosta bastante de pescar.
- Demonstra entusiasmo quando percebe uma fisgada.
- Pode ficar frustrado quando perde um peixe.
- Tem orgulho das próprias capturas.
- Pode exagerar a importância de um peixe aparentemente pequeno.

O personagem deve ser reconhecível visualmente mesmo em sprites pequenos.

## 2.2. ALE — Player 2

| Item | Definição | Status |
|---|---|---|
| Nome oficial do personagem | **ALE** (substitui o nome provisório "Pai" usado até a v0.4) | **[APROVADO]** |
| Relações | Pai de Maria · sogro de Lucas/Alemão · avô materno de Sirius | **[APROVADO]** |
| Como chama os outros | Lucas → **"Alemão"** · Maria → **"Maria"** · Sirius → **"Sirius"** | **[APROVADO]** |

Inspirado na segunda fotografia fornecida.

Características visuais (v0.3):
- Cabelo grisalho.
- Moletom cinza com estampa do Vegeta. *(Ver observação de propriedade intelectual, seção 15.)*
- Calça camuflada.
- Vara de pesca preta e amarela.

Equipamento característico: conjunto de pesca preto e amarelo. **[APROVADO]**

> Observação da auditoria de assets: na folha existente (`Pai rosto.jpg`), a estampa do moletom aparece como um retângulo indistinto, sem personagem reconhecível. Ver `docs/ASSET_AUDIT.md`.

### Personalidade **[APROVADO]**
- Brincalhão, tranquilo, sábio e muito engraçado.
- Sabe o momento certo de fazer uma piada.
- Humor espontâneo, natural e contextual.
- **Não deve ser reduzido a um personagem que faz piadas o tempo inteiro.**

### Propostas da v0.3 mantidas **[PROPOSTA]** (subordinadas à personalidade aprovada)
- Pode demonstrar confiança mesmo em situações inesperadas.
- Pode fazer comentários e reações engraçadas — sempre no momento certo, nunca de forma constante.
- O moletom do Vegeta pode render referências pontuais a Dragon Ball. *(Sujeito à seção 15.)*

Não transformar o personagem em uma caricatura exagerada o tempo todo. O humor deve surgir naturalmente das situações.

**Importante:** novas características poderão ser adicionadas conforme o criador fornecer mais histórias e detalhes reais.

## 2.3. Referências visuais

- As fotografias citadas na v0.3 **não estão** na pasta do projeto.
- Existem três folhas de expressões em pixel art na raiz do projeto: `alemao rosto.jpg`, `Pai rosto.jpg` e `Maria e Sirius.jpg`. A análise técnica completa está em `docs/ASSET_AUDIT.md`.
- Existe um logotipo (`logo.jpg`) com o Alemão segurando uma vara e uma caneca. Ver `docs/ASSET_AUDIT.md`.
- Se essas folhas são a **referência visual oficial** dos personagens ainda não foi decidido. **[PENDENTE]**
- Sugestão de organização: `docs/referencias/` (somente leitura; arquivos originais nunca devem ser alterados). **[PROPOSTA]**

## 2.4. Relações familiares oficiais **[APROVADO]**

Estas relações são definitivas e devem ser respeitadas em **todos** os diálogos, descrições e eventos narrativos.

| Personagem | Relação com os demais |
|---|---|
| **ALE** | Pai de Maria · sogro de Lucas/Alemão · avô materno de Sirius |
| **Lucas / Alemão** | Marido de Maria · genro de ALE · pai biológico de Sirius |
| **Maria** | Filha de ALE · esposa de Lucas · mãe de Sirius |
| **Sirius** | Filho de Maria e Lucas · neto materno de ALE |

### Formas de tratamento **[APROVADO]**

| Quem fala | Como chama |
|---|---|
| ALE | Lucas → "Alemão" · Maria → "Maria" |
| Maria | Lucas → "Lucas" |
| Todos | Sirius → **"Sirius"**, exclusivamente. **Não criar apelidos.** |

Formas de tratamento ainda não definidas **[PENDENTE]**:
- Como Lucas e Maria chamam ALE.
- Como Lucas chama Maria.

Até a definição, as falas devem evitar vocativos nesses casos, em vez de inventá-los.

---

# 3. MARIA E SIRIUS — PERSONAGENS OBRIGATÓRIOS

**Maria e Sirius são personagens necessários e obrigatórios no projeto.** **[APROVADO]**

## 3.1. Quem são **[APROVADO]**

- **Maria:** irmã do criador do jogo. Filha de ALE, esposa de Lucas e mãe de Sirius.
- **Sirius:** filho de Maria e Lucas, neto materno de ALE. Um bebê de aproximadamente dois meses na concepção atual do GDD.

Histórias reais envolvendo os dois ainda não foram fornecidas e **não devem ser inventadas**.

## 3.2. Papel no jogo

| Item | Status |
|---|---|
| Maria atua como comentarista/observadora dos acontecimentos da pescaria. | **[APROVADO]** |
| Maria **não executa ações de pesca**. | **[APROVADO]** |
| Sirius se manifesta com vocalizações de bebê estilizadas em 8-bit, reagindo ao jogo. | **[APROVADO]** |
| Maria e Sirius são personagens não jogáveis (NPCs), controlados pelo jogo. | **[PROPOSTA]** — coerente com as funções aprovadas |

Personagem jogável no futuro (ex.: modo para três jogadores) fica como ideia **[FUTURO]**, sem compromisso.

## 3.3. Características visuais

- Existe uma folha de expressões (`Maria e Sirius.jpg`) com 4 retratos de Maria e 4 de Sirius. Detalhes técnicos e visuais em `docs/ASSET_AUDIT.md`.
- Se essa folha é a referência visual oficial ainda não foi decidido. **[PENDENTE]**
- A folha mostra **três visuais diferentes para Sirius** (enrolado em manta azul; macacão bege estampado; óculos redondos com body branco). Qual será o visual padrão é uma decisão pendente. **[PENDENTE]**
- No greybox, Maria e Sirius são representados por formas geométricas distintas das dos jogadores. **[PROPOSTA]**
- Nenhuma característica visual definitiva deve ser criada sem referência aprovada.

## 3.4. Posicionamento em cena **[PROPOSTA]**

- Maria e Sirius ficam na margem, **em segundo plano**, atrás ou ao lado dos pescadores.
- Não podem cobrir boias, linhas, indicadores de tensão nem as zonas de toque.
- Os balões de fala de Maria e Sirius não podem cobrir os elementos de jogo de nenhum dos dois jogadores.
- Sirius precisa ter um estado visual legível mesmo em tela pequena (ex.: dormindo / tranquilo / inquieto / chorando), por ícone, animação ou balão.
- Onde Sirius fica fisicamente (colo, carrinho, cadeirinha, manta) ainda não foi definido. **[PENDENTE]**

## 3.5. Maria — comentarista e observadora

### O que está aprovado **[APROVADO]**

Personalidade: **tranquila, brincalhona e observadora.**

Função: observar a pescaria e fazer comentários, observações, provocações e reações contextuais.

Maria pode comentar:
- Capturas e peixes perdidos.
- Disputas entre Alemão e ALE.
- Momentos de sorte ou azar.
- Erros durante a pescaria.
- Capturas extraordinárias.
- Situações inesperadas.
- Comportamentos dos outros personagens.

Regras:
- Comentários **naturais, contextuais e ocasionais**.
- **Maria não deve falar constantemente.**
- O humor deve ser **leve e carinhoso**.
- Maria chama Lucas de **"Lucas"**.

### Como garantir isso **[PROPOSTA]**

- **Tempo mínimo entre falas** de Maria (cooldown), com valor a calibrar no protótipo.
- **Nem todo evento gera comentário:** cada gatilho tem uma chance de provocar fala, maior para eventos raros (captura extraordinária) e menor para eventos comuns (arremesso).
- **Prioridade:** quando vários eventos acontecem juntos, Maria comenta apenas o mais relevante.
- **Sem repetição imediata:** a mesma fala não se repete até que outras do mesmo grupo tenham sido usadas.
- **Grupos de falas por situação** (captura, perda, disputa, erro, sorte/azar, extraordinário, inesperado, comportamento), cada um com várias variações.
- **Imparcialidade carinhosa:** Maria pode brincar tanto com Lucas quanto com ALE, sem favorecer sempre o mesmo jogador.

## 3.6. Sirius — vocalizações de bebê

### O que está aprovado **[APROVADO]**

- Todos se referem a ele exclusivamente como **"Sirius"**. Não criar apelidos.
- Sirius **não fala** frases adultas nem diálogos articulados.
- Suas manifestações são vocalizações curtas, sonoras e divertidas.

Referências de estilo (não são falas obrigatórias):
- "AGU!"
- "BA BA!"
- "GUH?"
- "DAAA!"
- "BU BU!"
- "AAAA!"

As vocalizações podem reagir a:
- Capturas.
- Peixes grandes.
- Acontecimentos inesperados.
- Brincadeiras.
- Momentos de silêncio.

Os adultos podem **interpretar humoristicamente** os sons de Sirius, mas ele nunca fala como um adulto.

### Identidade sonora **[APROVADO]**

- **Todos os sons de Sirius são estilizados em 8-bit.**
- **Não utilizar gravações reais de bebê.**
- Vocalizações curtas, sonoras e divertidas, compatíveis com a estética retrô do jogo.

### Diretrizes de uso **[PROPOSTA]**

- **Pontuação comunica a emoção:** "GUH?" (curiosidade), "DAAA!" (empolgação), "AAAA!" (protesto/início de choro).
- **O humor vem do contraste:** um balbucio inocente no momento certo é engraçado sem precisar de palavras.
- **Frequência menor que a da Maria**, para que cada vocalização chame atenção.
- Quando estiver **dormindo**, Sirius não vocaliza (ou faz apenas sons de sono em 8-bit). Isso reforça os momentos de silêncio.

## 3.7. Dinâmica familiar

As **relações e descrições marcadas [APROVADO]** vêm do criador. Os **ângulos de humor [PROPOSTA]** são possibilidades fictícias e genéricas, não fatos sobre as pessoas reais.

Regra geral **[APROVADO]**: o humor surge das relações e situações, sem transformar os personagens em caricaturas constantes.

### ALE e Lucas/Alemão — sogro e genro

**[APROVADO]**
- Relação descontraída, respeitosa e amigável.
- O humor entre os dois é espontâneo.
- Eles entram nas brincadeiras juntos.
- **Não existe uma dinâmica obrigatória de sogro provocando genro.**
- Ambos podem iniciar ou complementar uma brincadeira naturalmente.

**[PROPOSTA]**
- Competição amigável pelo maior peixe, em que qualquer um dos dois pode puxar a brincadeira.
- Um começa uma piada e o outro completa.
- Os dois se unindo na brincadeira diante de um evento inesperado.

### ALE e Maria — pai e filha

**[APROVADO]**
- ALE é brincalhão, tranquilo e protetor com Maria.
- A relação transmite carinho e familiaridade.

**[PROPOSTA]**
- Brincadeiras leves entre pai e filha durante a pescaria.
- ALE chamando Maria para ver uma captura.

### Maria e Lucas — esposa e marido

**[APROVADO]**: Maria chama Lucas de "Lucas".

**[PROPOSTA]**
- Maria comentando, com humor leve e carinhoso, as capturas e os erros de Lucas.

### Maria e Sirius — mãe e filho

**[PROPOSTA]**
- Maria interrompendo os comentários para cuidar de Sirius (ver evento do choro, seção 3.8).
- Maria pedindo silêncio quando Sirius dorme, e os pescadores falhando nisso.
- Maria interpretando os balbucios de Sirius.

### ALE e Sirius — avô e neto

**[PROPOSTA]**
- ALE mostrando um peixe para o neto ou dedicando uma captura a ele.
- ALE interpretando humoristicamente um balbucio de Sirius.

### Lucas e Sirius — pai e filho

**[PROPOSTA]**
- Lucas mostrando uma captura para o filho.
- Um balbucio de Sirius "respondendo" a uma comemoração do pai.

### Combinações entre os quatro **[PROPOSTA]**
- Uma comemoração dos dois pescadores que acorda Sirius.
- Um balbucio de Sirius usado por ALE e Lucas como "voto" na disputa pelo maior peixe.

## 3.8. Evento: "Sirius está chorando" **[PROPOSTA A VALIDAR]**

> Esta mecânica **não é definitiva**. Está documentada como proposta e deve ser validada em protótipo e aprovada pelo criador antes de ser considerada parte do design. **Qualquer efeito na jogabilidade precisa ser testado antes de ser aprovado.**

### Ideia do criador

- Sirius pode começar a chorar em determinados momentos.
- Maria interrompe seus comentários para acalmá-lo.
- Maria continua sendo uma personagem observadora; isso **não** significa que ela execute ações de pesca.

### Fluxo proposto de estados

1. **Tranquilo / dormindo** — estado padrão.
2. **Inquieto** — aviso curto (visual e sonoro 8-bit), por exemplo um "GUH?" ou "AAAA!" inicial.
3. **Chorando** — o evento acontece; Maria interrompe os comentários.
4. **Maria acalma Sirius** — animação/diálogo curto.
5. **Volta ao tranquilo** — fim do evento, possivelmente com um balbucio satisfeito.

### Gatilhos possíveis

- Aleatório, com baixa frequência.
- Contextual: comemoração alta após captura, peixe grande saltando, linhas cruzando, brincadeira barulhenta entre ALE e Lucas.
- Combinação dos dois (recomendado para testar).

### Efeitos sobre os jogadores — opções a testar

| Opção | Efeito | Observação |
|---|---|---|
| **A — Só narrativo** | Animação, som e diálogos. Maria para de comentar. Nenhum efeito mecânico. | Menor risco. Bom ponto de partida. |
| **B — Peixes espantados** | Durante o choro, a chance de novas mordidas diminui para os dois jogadores. | Afeta a dinâmica sem punir quem já está brigando com um peixe. |
| **C — Reações da família** | ALE e Lucas reagem ao choro; o ritmo da sessão muda. | Complementa A ou B. |
| **D — Subversão cômica** | Raramente, o barulho "atrai" um peixe grande em vez de espantar. | Usar com muita moderação. |

Opções que exigem uma ação extra dos jogadores ficam **[FUTURO]**, junto com a cooperação avançada (conflitam com o controle de zona única).

**Recomendação para validação:** testar primeiro **A + B**, com regra de que o choro **não altera a tensão nem uma briga já em andamento** — só afeta novas mordidas.

### Regras de equilíbrio propostas

- Frequência baixa: o evento deve ser memorável, não rotineiro.
- Tempo mínimo entre ocorrências (cooldown).
- Não ocorrer nos primeiros minutos da sessão.
- Duração curta.
- Valores exatos serão definidos no protótipo. **[PENDENTE — calibrar]**

### Feedback

- Visual: mudança clara do estado de Sirius e reação de Maria.
- Sonoro: choro **em 8-bit** (seção 3.6), curto e não irritante em loop.
- Diálogos: reações de ALE e Lucas (fictícias e genéricas, respeitando a seção 11 e as relações da seção 2.4).
- A folha de expressões atual **não tem** um retrato de Sirius chorando (ver `docs/ASSET_AUDIT.md`).

## 3.9. Cuidados de representação **[PROPOSTA]**

- Maria e Sirius são pessoas reais da família do criador. O humor vem da **situação**, nunca de ridicularizar Maria ou sua maternidade.
- Sirius **nunca** é colocado em perigo nos eventos (nada de proximidade perigosa com a água, quedas, anzóis etc.).
- O uso dos nomes e imagens de pessoas reais em uma versão distribuída publicamente deve ser decidido pelos envolvidos. **[PENDENTE]**

---

# 4. CENÁRIO E AMBIENTAÇÃO

## Local principal: Rio

O primeiro cenário será uma margem de rio, inspirada nas fotografias e nas experiências reais de pescaria.

Composição:
- Dois personagens jogáveis na margem.
- Maria e Sirius em segundo plano na margem (ver seção 3.4). **[PROPOSTA]**
- Água ocupando boa parte da tela.
- Vegetação e árvores ao fundo.
- Pedras, galhos e pequenas irregularidades na margem.
- Peixes visíveis ocasionalmente debaixo d'água.
- Boias, linhas e iscas.
- Pequenos detalhes ambientais animados.

Elementos animados:
- Água em movimento.
- Ondulações.
- Folhas balançando.
- Insetos.
- Sombras.
- Peixes passando.
- Reações dos personagens.

O cenário deve transmitir tranquilidade, contrastando com os acontecimentos cômicos.

A primeira versão deve utilizar apenas um cenário bem desenvolvido. Outros locais ficam para atualizações futuras.

No primeiro protótipo, o cenário será representado em **greybox** (seção 14.1).

---

# 5. FORMATO E CONTROLES

## 5.1. Orientação

O jogo será desenvolvido inicialmente em formato horizontal.

Os dois jogadores utilizam o mesmo celular e compartilham a tela.

## 5.2. Divisão da tela **[APROVADO]**

- Metade esquerda: Alemão.
- Metade direita: ALE.

Cada jogador possui **uma única zona de interação** na sua metade da tela.

O sistema deverá suportar multitouch real, permitindo que os dois jogadores pressionem e mantenham suas zonas simultaneamente.

Cada jogador possui:
- Vara independente.
- Linha independente.
- Boia independente.
- Peixe fisgado independente.
- Indicador próprio de tensão.
- Estado individual da pescaria.

Os controles não devem interferir um no outro.

## 5.3. Controle contextual **[APROVADO]**

O mesmo gesto produz ações diferentes conforme o estado da pescaria:

| Estado da pescaria | Gesto | Resultado |
|---|---|---|
| Pronto para arremessar | **Segurar** | Carrega a força do arremesso. |
| Carregando arremesso | **Soltar** | Executa o arremesso. Força e timing determinam a distância. |
| Esperando (boia na água) | **Tocar** no momento adequado (após o sinal de mordida) | Fisga o peixe. |
| Esperando, antes da mordida | **Tocar** | **Ignorado.** Sem fisgada, sem penalidade; a pescaria continua. **[APROVADO]** |
| Esperando (sem peixe fisgado) | **Segurar** | **Recolhe a linha vazia**, sem penalidade. **[APROVADO]** |
| Recolhimento concluído | Soltar e **segurar** de novo | Novo arremesso imediato. **[APROVADO]** |
| Briga com o peixe | **Segurar** | Recolhe a linha (tensão sobe). |
| Briga com o peixe | **Soltar** | Alivia a tensão (tensão desce). |
| Peixe chega à margem | — | **Captura automática.** |

Após captura, perda do peixe ou linha arrebentada, o jogador volta ao estado "pronto para arremessar".

### Distinção entre tocar e segurar **[PROPOSTA]**

Durante a espera, o mesmo gesto pode significar "fisgar" (tocar) ou "recolher" (segurar). A distinção será feita por **tempo de pressão**: abaixo de um limiar é toque; acima, é segurar. O limiar será medido no Protótipo 0 (seção 16.4).

### Situações a resolver no protótipo **[PENDENTE — durante o protótipo]**

- **Tamanho e formato exato da zona de toque:** metade inteira da tela ou área menor na parte inferior? (O Protótipo 0 testa isso.)
- **Feedback visual da zona:** como o jogador percebe que está pressionando e em qual estado está.
- **Toques repetidos sem penalidade:** como o toque prematuro é ignorado sem custo, um jogador pode tocar sem parar e sempre acertar a mordida. Ver a análise e as opções na seção 20 (S1).
- **Mordida durante o recolhimento:** um peixe pode morder enquanto a linha vazia está sendo recolhida? *(Proposta inicial: não, no primeiro protótipo.)*

### Resolvidas na v0.6
- ~~Toque fora de hora durante a espera~~ → ignorado, sem penalidade (seção 6.3).
- ~~Recolher a linha sem peixe~~ → segurar recolhe a linha vazia, sem penalidade (seção 6.6).

## 5.4. Princípios de interface

A interface deverá ser simples e legível, evitando elementos pequenos demais.

Ações especiais de cooperação, quando existirem, devem ser compatíveis com o controle de zona única. **[FUTURO]**

---

# 6. MECÂNICA DE PESCA

A pescaria é dividida em cinco etapas.

## 6.1. Preparação

**No primeiro protótipo [PROTÓTIPO]:** não há preparação. A vara já começa pronta para arremessar.

**Futuro [FUTURO]:** o jogador escolhe uma isca e prepara o equipamento. A seleção de iscas poderá começar simples, com poucas opções.

## 6.2. Arremesso **[APROVADO]**

O jogador mantém a zona pressionada para carregar a força do lançamento.

Ao soltar, a linha é arremessada.

A força e o timing determinam a distância.

## 6.3. Espera e fisgada

A boia apresenta diferentes sinais:

- Pequenas ondulações: peixe investigando.
- Movimento leve: possível mordida.
- Afundamento rápido: oportunidade de fisgada.
- Movimento lateral: peixe puxando a linha.

O jogador precisa identificar o momento adequado e **tocar** para fisgar. **[APROVADO]**

### Toque prematuro **[APROVADO]**
- Se o jogador tocar antes de o peixe morder, o comando é **ignorado**.
- Não há fisgada.
- Não há penalidade.
- A pescaria continua normalmente.
- O jogador deve aguardar o sinal de mordida.

## 6.4. Briga com o peixe

O peixe possui:
- Energia.
- Resistência.
- Força de fuga.
- Comportamento próprio.
- Padrões de movimentação.

O jogador precisa equilibrar recolhimento (**segurar**) e alívio da tensão (**soltar**). **[APROVADO]**

Se forçar demais, a linha pode arrebentar.

Se deixar a linha frouxa por muito tempo, o peixe pode escapar.

O objetivo é cansar o peixe e trazê-lo para a margem.

## 6.5. Captura **[APROVADO: captura automática]**

Quando o peixe chega à margem, a captura acontece automaticamente:
- Executar animação de captura.
- Mostrar espécie.
- Mostrar peso.
- Atualizar pontuação.
- Atualizar estatísticas.
- Registrar a captura no catálogo, quando esse sistema for implementado. **[FUTURO]**
- Executar reação contextual do personagem.

## 6.6. Recolher a linha sem peixe **[APROVADO]**

- O jogador pode recolher a linha **a qualquer momento**.
- Se nenhum peixe estiver fisgado, a linha é recolhida normalmente.
- **Não há penalidade.**
- O jogador pode fazer um **novo arremesso imediatamente** após o recolhimento.
- A ação pode ter animação e feedback sonoro próprios.
- O recolhimento **não** gera espera artificial nem perda de resistência.

Gesto: segurar a zona enquanto a linha está na água sem peixe fisgado (seção 5.3).

---

# 7. SISTEMA DE TENSÃO

A tensão da linha será o principal elemento de habilidade.

## 7.1. Zonas do indicador **[APROVADO: dois riscos]**

| Zona | Situação | Risco |
|---|---|---|
| **Frouxa** | Tensão baixa demais. | Se permanecer muito tempo aqui, o **peixe escapa**. |
| **Segura** | Tensão controlada. | Nenhum. É onde o jogador quer ficar. |
| **Alerta** | Tensão subindo. | Risco crescente. |
| **Crítica** | Tensão excessiva. | Se permanecer muito tempo aqui, a **linha arrebenta**. |

Os dois riscos dependem de **tempo de permanência**, não de um único instante na zona. Isso deixa o sistema justo e compreensível: o jogador tem uma pequena janela para corrigir.

## 7.2. Regras

- A tensão aumenta quando o peixe puxa ou quando o jogador recolhe (segura).
- A tensão diminui quando o jogador alivia (solta).
- O jogador deve aprender a alternar entre recolher e aliviar.
- Peixes diferentes terão comportamentos diferentes.
- Peixes maiores deverão exigir maior habilidade e tempo.

A mecânica precisa ser responsiva e compreensível, sem depender de movimentos excessivamente complexos no celular.

## 7.3. Valores a calibrar no protótipo **[PENDENTE]**

- Velocidade de subida e descida da tensão.
- Tempo tolerado na zona crítica antes de arrebentar.
- Tempo tolerado na zona frouxa antes do peixe escapar.
- Se o risco acumulado "descansa" ao voltar para a zona segura, e em que velocidade.
- Como o jogador percebe que está perto de perder (piscar, vibração, som da linha).

---

# 8. ESPÉCIES DE PEIXES **[PROVISÓRIO]**

O jogo terá diferentes espécies, com características e comportamentos próprios.

A lista definitiva será definida conforme a realidade dos rios e das pescarias do criador. **[PENDENTE]**

Possíveis espécies provisórias para estudo:
- Tilápia.
- Traíra.
- Bagre.
- Carpa.

Essas espécies são sugestões iniciais, **não uma confirmação** de que aparecem nos locais frequentados pelos personagens.

Cada peixe poderá ter:
- Peso mínimo e máximo.
- Raridade.
- Resistência.
- Velocidade.
- Padrão de fuga.
- Preferência por iscas. **[FUTURO — depende do sistema de iscas]**

O primeiro protótipo deverá conter pelo menos três espécies com comportamentos distintos. **[PROTÓTIPO]**

No protótipo, os comportamentos (ex.: "rápido e curto", "lento e pesado", "imprevisível") são perfis de jogabilidade provisórios e não afirmações sobre a biologia de espécies reais.

### Assets de peixes existentes (v0.6)

O criador adicionou ao projeto três folhas de peixes e objetos (`peixes.jpg`, `peixes 2.jpg`, `peixes 3.jpg`). A folha `peixes.jpg` contém peixes que **visualmente correspondem às quatro espécies provisórias** (tilápia, um peixe que aparenta ser traíra, bagre e carpa), com tamanhos e poses variados, além de variantes de cor e uma boia. As outras duas folhas trazem peixes de outras espécies, invertebrados, plantas, objetos e itens de pesca. Detalhes em `docs/ASSET_AUDIT.md`.

Esses arquivos **não confirmam** quais peixes a família realmente pesca. Pela diretriz de autonomia (seção 0.3), o elenco de peixes **do jogo** pode ser definido pela direção de gameplay, e as folhas são o ponto de partida natural.

---

# 9. COOPERATIVO LOCAL

Os dois jogadores pescam simultaneamente.

Cada jogador pode realizar suas próprias capturas, mas algumas situações poderão exigir cooperação.

## 9.1. Cooperação no primeiro protótipo **[PROTÓTIPO]**

- Pesca simultânea e independente.
- Competição amigável natural (quem pega mais, quem pega o maior).
- Estatísticas individuais e coletivas.

## 9.2. Cooperação avançada **[FUTURO — mecânica a definir após validação do protótipo]**

Ideias mantidas:
- Um peixe muito grande exige ajuda.
- As linhas dos dois jogadores se cruzam.
- Uma captura simultânea gera bônus.
- Um jogador pode ajudar o outro durante uma situação crítica.
- Os dois podem competir pelo maior peixe.
- Um jogador pode provocar o outro após uma captura perdida.

Restrição de design: qualquer mecânica cooperativa futura deve funcionar com o **controle de zona única** (seção 5.3).

A cooperação deve ser divertida, mas não obrigatória em todas as capturas.

## 9.3. Estatísticas

### Individuais
- Peixes capturados.
- Maior peixe.
- Peso total.
- Peixes perdidos.
- Iscas utilizadas. **[FUTURO — depende do sistema de iscas]**

### Coletivas
- Total de peixes.
- Peso acumulado.
- Maior captura da sessão.
- Tempo de pescaria.
- Recordes da dupla. **[FUTURO — exige salvamento entre sessões]**

---

# 10. EVENTOS ALEATÓRIOS

O cenário poderá apresentar acontecimentos inesperados.

Exemplos:
- Um peixe rouba a isca.
- Um peixe muito grande aparece na água.
- Um jogador perde a captura no último instante.
- As linhas se cruzam. **[FUTURO — junto com a cooperação avançada]**
- Um peixe salta inesperadamente.
- Uma boia desaparece debaixo d'água.
- Um objeto estranho passa flutuando.
- Uma captura inesperada provoca uma reação exagerada.
- **Sirius começa a chorar** (seção 3.8). **[PROPOSTA A VALIDAR]**

Eventos aleatórios podem gerar comentários da Maria e vocalizações do Sirius (seções 3.5 e 3.6).

Os eventos devem respeitar a atmosfera de pescaria. Não transformar tudo em fantasia ou caos constante.

Quais eventos entram no primeiro protótipo ainda não foi decidido. **[PENDENTE — durante o protótipo]**

As folhas de objetos existentes (bota, garrafa, pneu, lata etc.) permitem **capturas inusitadas**. Ver a sugestão S6 na seção 20. **[PROPOSTA]**

---

# 11. DIÁLOGOS

Os personagens terão conversas contextuais.

Os diálogos poderão ser acionados por:
- Espera prolongada.
- Primeira fisgada.
- Captura.
- Perda de peixe.
- Captura de peixe grande.
- Falha no arremesso.
- Linhas cruzadas.
- Eventos raros.
- Momentos de silêncio.
- Interações entre os jogadores.
- Comentários da Maria (seção 3.5). **[APROVADO]**
- Vocalizações do Sirius (seção 3.6). **[APROVADO]**
- Estados de Sirius e o evento do choro (seção 3.8). **[PROPOSTA]**

O humor deverá ser brasileiro, espontâneo e baseado na dinâmica entre os personagens.

## 11.1. Quem fala **[APROVADO]**

| Personagem | Tipo de fala |
|---|---|
| Alemão (Lucas) | Falas normais. Forma de tratamento para ALE e Maria ainda pendente (seção 2.4). |
| ALE | Falas normais, humor no momento certo. Chama Lucas de "Alemão", Maria de "Maria" e Sirius de "Sirius". |
| Maria | Comentários ocasionais, com humor leve e carinhoso. Chama Lucas de "Lucas". |
| Sirius | Apenas vocalizações de bebê estilizadas em 8-bit. Nunca frases articuladas. |

Ninguém usa apelidos para Sirius. **[APROVADO]**

As relações familiares da seção 2.4 devem ser respeitadas em **todas** as falas. **[APROVADO]**

## 11.2. Controle de frequência **[PROPOSTA]**

Para que os quatro personagens não falem ao mesmo tempo nem o tempo todo:
- No máximo uma fala na tela por vez (ou uma por metade da tela, a testar).
- Tempo mínimo geral entre falas, além do tempo mínimo individual de cada personagem.
- Uma resposta encadeada curta é permitida (ex.: ALE faz uma piada, Lucas completa, Maria comenta; Sirius solta "GUH?"), mas não diálogos longos que distraiam durante a briga com o peixe.
- Durante uma briga, as falas devem ser curtas e não cobrir o indicador de tensão.

## 11.3. Regras de conteúdo

Como os personagens começaram a pescar há aproximadamente dois meses, o jogo poderá explorar a fase de aprendizado, as descobertas e as pequenas frustrações da pescaria.

Coincidência registrada: Sirius tem aproximadamente a mesma "idade" da experiência de pesca da dupla. Pode render conteúdo, se o criador quiser. **[PROPOSTA]**

**Regra:** não inventar histórias pessoais e apresentá-las como fatos reais. Situações genéricas e fictícias podem ser utilizadas claramente como conteúdo humorístico do jogo. Isso vale para todos os personagens, incluindo Maria e Sirius.

---

# 12. PROGRESSÃO

A primeira versão terá um único cenário.

Em versões futuras poderão ser adicionados: **[FUTURO]**
- Novos pontos de pesca.
- Novas espécies.
- Equipamentos.
- Iscas.
- Recordes.
- Catálogo de peixes.
- Desafios.
- Pescaria noturna.
- Torneios.

---

# 13. MODOS DE JOGO

## Pescaria livre **[PROTÓTIPO]**

Modo principal. Os dois jogadores pescam livremente, acumulando capturas e recordes.

## Torneio **[FUTURO]**

Modo com limite de tempo e comparação de resultados.

## Expedição **[FUTURO]**

Modo com novos locais e desbloqueios.

---

# 14. DIREÇÃO VISUAL E SONORA

## 14.1. Abordagem greybox **[APROVADO]**

O primeiro protótipo utilizará **formas geométricas provisórias** no lugar de sprites e cenário definitivos. O objetivo é validar a mecânica antes de investir em arte.

Regras do greybox:
- Cada elemento deve ser distinguível por forma e cor (Alemão, ALE, Maria, Sirius, boias, peixes, zonas de tensão).
- Manter as cores de identidade das varas desde o greybox: **vermelho** para o Alemão, **preto e amarelo** para o ALE.
- Nada do greybox é considerado arte final.

## 14.2. Visual final **[FUTURO]**
- Pixel art 2D.
- Câmera lateral.
- Personagens com sprites próprios.
- Animações de pesca.
- Água animada.
- Cenário natural.
- Interface arcade.
- Paleta agradável e legível em celulares.

## 14.3. Equipamentos visuais obrigatórios **[APROVADO]**
- Vara vermelha e carretilha/molinete vermelho do Alemão.
- Vara preta e amarela do ALE.

## 14.4. Áudio
- Música original chiptune.
- Água e ambiente natural.
- Arremesso.
- Molinete.
- Linha tensionando.
- Fisgada.
- Peixe saltando.
- Captura.
- Reações dos personagens.
- Vocalizações de Sirius **exclusivamente em 8-bit**, sem gravações reais de bebê. **[APROVADO]**
- Choro de Sirius (8-bit) e Maria acalmando. **[PROPOSTA]**

---

# 15. PROPRIEDADE INTELECTUAL **[APROVADO]**

O jogo contém referências a obras protegidas, em especial:
- A estampa do **Vegeta** no moletom do ALE.
- Possíveis referências a **Dragon Ball** nos diálogos.

Essas referências são aceitáveis em uso pessoal e privado. **Caso o jogo seja distribuído publicamente** (lojas de aplicativos, sites, divulgação), elas precisarão ser adaptadas, por exemplo:
- Substituir a estampa por um desenho original que preserve o "espírito" do moletom (um personagem de anime genérico de criação própria).
- Reescrever falas para que não dependam de nomes, falas, golpes ou visuais protegidos.

A personalidade do ALE e a piada de fundo (o moletom de anime) podem ser preservadas na versão adaptada.

Identificado na auditoria de assets (v0.5): dois retratos de Sirius em `Maria e Sirius.jpg` usam elementos associados a **Harry Potter** (óculos redondos, cicatriz em forma de raio na testa e body com a frase "MAGIC BY BIRTH" e desenho de óculos). A mesma regra se aplica: aceitável em uso privado; precisa ser adaptado em distribuição pública. O nome real "Sirius" não é afetado por esta observação. Se esse visual será mantido é decisão do criador. **[PENDENTE]**

A mesma regra vale para qualquer referência futura a cultura pop.

Identificado na auditoria de assets (v0.6): o logotipo (`logo.jpg`) tem no topo uma **esfera laranja com estrela**, elemento associado a **Dragon Ball**. Mesma regra: aceitável em uso privado; precisa de adaptação em distribuição pública. **[PENDENTE — antes do lançamento]**

### Outras considerações de distribuição **[PROPOSTA]**
- O logotipo mostra uma **caneca de bebida** e uma lata, e o nome do jogo faz referência a ressaca. Em lojas de aplicativos, referências a álcool podem **elevar a classificação etária**. Não é um problema de PI, mas precisa ser decidido antes do lançamento. **[PENDENTE — antes do lançamento]**
- As folhas de objetos têm **textos em inglês desenhados dentro da imagem** (ex.: "Gold Coin 1", "Lost Lures", "Old Boot"). Se forem usadas no jogo, os rótulos precisam ser removidos ou refeitos.

Relacionado: o uso de nomes e imagens de pessoas reais (incluindo Maria e Sirius) em uma versão pública deve ter o consentimento dos envolvidos. **[PENDENTE]**

---

# 16. ESCOPO DO PRIMEIRO PROTÓTIPO

Objetivo do protótipo: responder à pergunta **"pescar com uma única zona de toque, a dois, no mesmo celular, é divertido?"**

O protótipo deverá ser jogável em um único celular, com duas pessoas controlando os personagens simultaneamente.

## 16.1. Ordem de desenvolvimento

A lista de prioridades da v0.3 está preservada. Na v0.4 ela foi organizada em duas fases **[PROPOSTA]**:

### Fase A — Núcleo da pescaria
1. Criar o cenário lateral (greybox).
2. Implementar os dois personagens (greybox).
3. Implementar multitouch.
4. Criar as zonas de controle independentes (zona única por jogador).
5. Implementar arremesso.
6. Implementar boia e fisgada.
7. Criar indicador de tensão (com os dois riscos).
8. Implementar briga com o peixe.
9. Implementar captura automática.
10. Adicionar três espécies iniciais (perfis provisórios).
11. Criar pontuação individual e coletiva.

**Critério para avançar:** testar em celular real, com duas pessoas, e confirmar que o núcleo é divertido e que os controles não interferem um no outro.

### Fase B — Camada de personagens
12. Adicionar primeiras conversas contextuais, respeitando as relações familiares (seção 2.4).
13. Adicionar Maria e Sirius em greybox na margem. **[PROPOSTA]**
14. Implementar os comentários da Maria com controle de frequência (seções 3.5 e 11.2).
15. Implementar as vocalizações do Sirius (seção 3.6).
16. Testar o evento "Sirius chorando" nas opções A + B (seção 3.8). **[PROPOSTA A VALIDAR]**

## 16.2. Resumo: protótipo × futuro

| Funcionalidade | Primeiro protótipo | Futuro |
|---|:---:|:---:|
| Cenário único (rio) em greybox | ✔ | |
| Alemão e ALE (greybox) | ✔ | |
| Multitouch com zona única por jogador | ✔ | |
| Arremesso, fisgada, briga, captura automática | ✔ | |
| Tensão com dois riscos | ✔ | |
| 3 espécies provisórias | ✔ | |
| Pontuação e estatísticas da sessão | ✔ | |
| Diálogos contextuais iniciais | ✔ (Fase B) | |
| Maria e Sirius em cena (obrigatórios no jogo; entrada na Fase B é proposta) | ✔ (Fase B) | |
| Comentários da Maria | ✔ (Fase B) | |
| Vocalizações do Sirius | ✔ (Fase B) | |
| Evento "Sirius chorando" | ✔ (Fase B, a validar) | |
| Sprites e pixel art definitivos | | ✔ |
| Retratos de expressão nos diálogos (a partir das folhas existentes, após tratamento) | | ✔ (proposta P3, seção 16.3) |
| Música e áudio finais | | ✔ |
| Seleção de iscas | | ✔ |
| Cooperação avançada (peixe gigante, linhas cruzadas, bônus) | | ✔ |
| Catálogo de peixes | | ✔ |
| Recordes salvos entre sessões | | ✔ |
| Novos cenários, pescaria noturna | | ✔ |
| Equipamentos, desafios | | ✔ |
| Modos Torneio e Expedição | | ✔ |
| Espécies definitivas | | ✔ (aguarda criador) |

## 16.3. Análise do escopo (revisão v0.5)

Esta análise **não altera** a ordem aprovada. Inconsistências e propostas estão separadas e aguardam decisão.

### O que é essencial para validar a pescaria
Itens 5 a 10 da Fase A: arremesso, boia e fisgada, tensão com dois riscos, briga, captura automática e espécies com comportamentos distintos.

### O que é essencial para validar os dois jogadores
Itens 3, 4 e 11 da Fase A: multitouch real, zonas independentes e pontuação individual/coletiva. Só podem ser validados em **celular real, com duas pessoas**.

### O que depende dos spritesheets existentes
**Nada no protótipo.** Os arquivos existentes são folhas de expressões (retratos), não animações de corpo, e precisam de tratamento técnico antes de qualquer uso (ver `docs/ASSET_AUDIT.md`). Todas as fases podem ser feitas em greybox.

### O que pode ser testado com formas geométricas e assets temporários
Todas as Fases A e B: cenário, personagens, varas (com as cores aprovadas), boias, peixes, indicadores, Maria e Sirius, balões de fala e estados de Sirius. Sons temporários podem ser usados para validar o tempo de reação, desde que os sons de Sirius sejam 8-bit.

### O que deve permanecer fora do protótipo
Arte definitiva, animações de sprite, retratos tratados, iscas, cooperação avançada, catálogo, recordes persistentes, novos cenários e modos Torneio/Expedição.

### Inconsistências encontradas
1. **Status de Maria e Sirius na tabela 16.2:** a v0.4 marcava "Maria e Sirius em cena" como proposta, mas os dois são personagens obrigatórios. **Corrigido no texto:** a presença no jogo é obrigatória; o que continua como proposta é entrarem na Fase B, e não na Fase A.
2. **Retratos sem lugar no design:** as folhas de expressões existentes sugerem retratos nos diálogos, mas o GDD não define nenhuma interface de retrato. Ver proposta P3.
3. **Falta de asset para o evento do choro:** o evento proposto não tem retrato de Sirius chorando nem de Maria acalmando Sirius. Não afeta o greybox.
4. **Eventos aleatórios sem escopo:** a Fase B não define quais eventos aleatórios entram no protótipo (pendência já registrada).

### Propostas (não aprovadas)
- **P1 — Validar o multitouch primeiro:** antes dos itens 5 a 11, fazer um teste mínimo das duas zonas em celulares reais. O multitouch é o maior risco técnico do conceito; se falhar, o resto da Fase A precisa mudar.
- **P2 — Explicitar a validação da Fase B:** usar como critério de sucesso que as falas de Maria e Sirius "não atrapalham a leitura da pescaria" e "não parecem constantes".
- **P3 — Retratos de expressão:** usar as folhas existentes, depois de tratadas, como retratos nos balões de fala em uma fase posterior ao protótipo. Isso exige definir a interface de diálogo.

---

## 16.4. Protótipo 0 — Teste técnico de multitouch **[PROTÓTIPO]**

A proposta P1 (seção 16.3) foi adotada como recomendação: **antes da Fase A**, validar apenas os controles.

O Protótipo 0 valida:
- Orientação horizontal.
- Duas zonas de controle independentes.
- Dois jogadores tocando simultaneamente.
- Reconhecimento correto de cada jogador.
- Ausência de conflito entre os comandos.
- Funcionamento em celulares reais.

Ele usa somente elementos temporários (formas e texto). Não usa retratos, sprites nem mecânicas de pesca.

O planejamento completo (estrutura técnica, arquivos, riscos, plano de testes e critérios objetivos de sucesso) está em **`docs/PLANO_PROTOTIPO_MULTITOUCH.md`**.

**Plano aprovado pelo criador [APROVADO]**, incluindo a pasta `prototipos/p0-multitouch/` separada do código principal. A implementação **só começa com uma missão específica**.

Ordem atualizada **[PROPOSTA]**: Protótipo 0 (multitouch) → Fase A (núcleo da pescaria) → Fase B (camada de personagens).

---

# 17. PRINCÍPIOS DE DESENVOLVIMENTO

- Priorizar diversão e responsividade.
- Não desenvolver todos os sistemas de uma vez.
- Validar a mecânica de pesca antes de criar progressão complexa.
- Preservar a identidade visual dos protagonistas.
- Não inventar fatos pessoais sobre nenhum personagem.
- Manter o código organizado e modular.
- Testar multitouch em aparelhos reais.
- Evitar dependências desnecessárias.
- Manter o projeto independente do Hangover Accident, aproveitando apenas aprendizados técnicos.
- Diferenciar claramente greybox, protótipo e versão final.
- Toda nova mecânica nasce como **[PROPOSTA]** e só vira **[APROVADO]** após decisão do criador.
- Não alterar referências visuais originais.

---

# 18. VISÃO FINAL

Hangover Fishing é a transformação de uma atividade recente e real em uma experiência arcade cooperativa.

O Alemão tem sua vara vermelha. O ALE, seu sogro, tem sua vara preta e amarela. Os dois dividem a mesma margem, entram juntos nas brincadeiras, disputam capturas, se ajudam e protagonizam situações engraçadas. Na mesma margem estão Maria, que observa tudo com um humor leve e carinhoso, e o pequeno Sirius, que com um simples "AGU!" em 8-bit pode transformar qualquer momento de silêncio em um acontecimento.

O objetivo é fazer com que cada sessão de jogo produza momentos memoráveis.

**Dois pescadores. Um celular. Duas varas. Um rio. E um peixe que não quer ser capturado.**

---

# 19. DÚVIDAS E DECISÕES PENDENTES

Revisão v0.6: as pendências foram reclassificadas pelo **momento em que precisam ser decididas**. A numeração da v0.5 aparece entre parênteses.

## Resolvidas
- ~~Toque fora de hora durante a espera (v0.5 #13)~~ → ignorado, sem penalidade (seção 6.3).
- ~~Recolher a linha sem peixe (v0.5 #14)~~ → segurar recolhe a linha vazia, sem penalidade (seção 6.6).
- ~~P1 — validar o multitouch primeiro (v0.5 #22, parte)~~ → adotada como Protótipo 0 (seção 16.4).

Resolvidas na v0.5 (mantidas para histórico): relação de Lucas com Maria e Sirius; nome ALE; tom da Maria; áudio 8-bit de Sirius; Maria não pesca.

## A. Necessárias antes do protótipo
1. ~~Aprovar o plano do Protótipo 0~~ → **aprovado** (seção 16.4).
2. ~~A autonomia criativa vale também para o Claude?~~ → **não**: pertence ao ChatGPT; sugestões do Claude ficam como [PROPOSTA] (seção 0.3).

Nenhuma pendência bloqueia o Protótipo 0. A implementação aguarda a próxima missão.

## B. Resolvidas durante o protótipo (por teste)
3. Tamanho e posição das zonas de toque (v0.5 #15).
4. Feedback visual da zona pressionada.
5. Limiar entre tocar e segurar.
6. Toques repetidos sem penalidade — regra preservada; testar futuramente a opção (d) "soltar e tocar de novo dentro da janela" (seção 20, S1).
7. Mordida durante o recolhimento da linha vazia.
8. Valores de tempo e velocidade dos dois riscos de tensão (v0.5 #16).
9. Feedback de perigo: som, cor, tremor, vibração (v0.5 #17).
10. Eventos aleatórios do primeiro protótipo (v0.5 #19).
11. Frequência das falas de Maria e Sirius (v0.5 #20).
12. Efeito do choro de Sirius (opções A + B) e se ele afeta uma briga em andamento (v0.5 #5 e #6).
13. Ordem das Fases A/B e critério P2 (v0.5 #21 e #22, parte).

## C. Necessárias antes do lançamento
14. Como Lucas e Maria chamam ALE; como Lucas chama Maria (v0.5 #1). *(Até lá, as falas evitam vocativos.)*
15. Personalidade do Alemão: confirmar ou ajustar a proposta da v0.3 (v0.5 #3).
16. Onde Sirius fica em cena (v0.5 #4). *(O greybox usa um marcador.)*
17. As folhas de expressões são a referência visual oficial? (v0.5 #8)
18. Visual do Alemão: jaqueta escura ou moletom azul? (v0.5 #9)
19. Visual padrão de Sirius (v0.5 #10).
20. Autorização dos envolvidos para uso de nomes e imagens em versão pública (v0.5 #7).
21. Referências protegidas em versão pública: Vegeta/moletom (v0.5 #23), Harry Potter nos retratos de Sirius (v0.5 #11), esfera de Dragon Ball no logotipo (nova).
22. Referência a bebida alcoólica e classificação etária (nova).

## D. Podem ser resolvidas por patches futuros
23. Espécies que a família realmente pesca (v0.5 #18). *(O elenco do jogo pode ser definido sob autonomia; espécies reais podem entrar depois como conteúdo.)*
24. Retratos de expressão nos diálogos — P3 (v0.5 #22, parte).

## E. Não precisam ser decididas agora
25. Maria e Sirius como NPCs (v0.5 #2). *(Na prática já são: não há controles para eles; modo de 3 jogadores é ideia futura.)*
26. Renomear os arquivos de imagem e organizá-los em pastas (v0.5 #12). *(Só quando a produção de arte começar; exige autorização.)*
27. Uso dos itens de "fundo do mar"/aquário das folhas de objetos em um jogo de rio (nova). *(Decidir ao montar o elenco de peixes e objetos.)*

---

# 20. REVISÃO DE GAMEPLAY — SUGESTÕES v0.6 **[PROPOSTA]**

> Sugestões redigidas pelo Claude. Permanecem **[PROPOSTA]** até serem incorporadas pela direção criativa de gameplay (ChatGPT) ou aprovadas pelo criador (seção 0.3).

Sugestões separadas das mecânicas aprovadas. Nenhuma altera decisões **[APROVADO]**. Prioridades da revisão: clareza dos controles, ritmo, equilíbrio entre jogadores, feedback, aprendizado rápido e diversão mesmo com diferença de experiência.

### S1 — Toques repetidos (risco identificado)
**Problema:** como o toque prematuro é ignorado sem custo (aprovado), tocar sem parar garante acertar qualquer mordida. A fisgada deixaria de exigir atenção à boia.
**Opções:**
- **(a) Aceitar** — o jogo fica mais casual; a habilidade se concentra na tensão.
- **(b) Fisgada com qualidade** — tocar logo no início do sinal dá uma "fisgada perfeita" (o peixe começa um pouco mais cansado). Recompensa atenção, mas não impede o toque repetido.
- **(c) Intervalo mínimo entre toques** — após um toque prematuro, o próximo toque só é aceito depois de uma fração de segundo. Não altera a pescaria, mas pode ser visto como penalidade; **exige decisão do criador**, por tocar em uma regra aprovada.
**Recomendação:** começar com **(a) + (b)** no protótipo e observar se os jogadores realmente tocam sem parar. Só considerar (c) se o problema aparecer.

**Decisão do criador (v0.6, complemento) [APROVADO]:** a regra do toque prematuro **é preservada**. Será testada **posteriormente** a mecânica abaixo (não implementar agora):

- **(d) Soltar e tocar de novo dentro da janela** **[PROTÓTIPO — teste futuro]**: para fisgar, o jogador precisa estar **com o dedo solto** e realizar um **novo toque** que comece **dentro da janela de reação** da mordida. Um dedo que já estava pressionado quando a mordida começou não fisga.
  - Observação técnica: a regra elimina a fisgada de quem mantém o dedo apoiado, mas **toques muito rápidos e repetidos ainda podem cair dentro da janela**. A eficácia contra o toque repetido depende da duração da janela e deverá ser medida no teste.

### S2 — Ajuda individual para iniciantes
Cada jogador escolhe, antes da partida, um nível de ajuda: zona segura de tensão maior e janela de fisgada mais longa. Permite que uma pessoa experiente e uma iniciante joguem juntas de forma equilibrada. O nível aparece discretamente na metade de cada jogador, por transparência.

### S3 — Distância do arremesso com significado
- Arremesso **curto:** mordidas mais rápidas, peixes menores.
- Arremesso **longo:** espera um pouco maior, chance de peixes maiores ou mais raros e recolhimento mais demorado.
Dá propósito à força do arremesso e cria escolha de risco e recompensa sem novos controles. Meta inicial de ritmo: primeira mordida entre ~4 e ~12 segundos (a calibrar).

### S4 — Sinal de mordida inconfundível
A mordida "real" combina, ao mesmo tempo, boia afundando, respingo, som curto e um brilho na borda da metade do jogador. Os sinais anteriores (ondulação, movimento leve) usam só a boia, para ensinar a diferença.

### S5 — Tensão legível sem olhar a barra
- Som da linha com tom que sobe conforme a tensão.
- Vara mais curvada.
- Cor da metade do jogador muda levemente na zona crítica.
- Som próprio para linha **frouxa demais**, para que os dois riscos tenham assinaturas diferentes.

### S6 — Capturas inusitadas
Com baixa frequência, o anzol traz um objeto em vez de peixe (bota, garrafa, pneu, lata — já existentes nas folhas de assets). Valem pouco ou nada, geram reação dos personagens e comentários da Maria. Nunca são punitivas. Itens de fantasia (baú, moedas, tesouro) ficam de fora por enquanto, para respeitar a atmosfera de pescaria (seção 10).

### S7 — Igualdade entre as metades
Cada jogador tem sua própria área de água, com a **mesma regra de geração de peixes**. Nenhum lado tem vantagem por posição. Linhas cruzadas continuam como ideia futura.

### S8 — Aprender jogando
Dicas curtas na metade de cada jogador nas primeiras ações ("Segure para arremessar", "Toque quando afundar!"), que desaparecem depois de 2 ou 3 acertos. Sem tela de tutorial separada.

### S9 — Nada pausa o outro jogador
Capturas, comemorações, diálogos e eventos **nunca congelam** a metade do outro jogador. Animações de captura curtas (até cerca de 2 segundos) para devolver o controle rapidamente.

### S10 — Rodada curta para testes
Um placar com rodada opcional ("maior peixe em 3 minutos" ou "primeiro a 5 peixes") para os testes da Fase A. É uma ferramenta de teste e um ensaio do futuro modo Torneio.

### S11 — Sem compensação automática no protótipo
Não usar mecanismos ocultos que ajudam quem está perdendo. A diferença de habilidade é tratada de forma transparente pela S2.
