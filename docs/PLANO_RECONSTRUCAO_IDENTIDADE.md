# Plano — Operação Nova Identidade

**Data:** 12/11/2026 · **Base:** versão jogável em `jogo/` (Operação Madrugada + Operação "A alma do jogo")
**Status:** plano de execução com autonomia. Nada aqui é aprovação do criador.
**Resultado:** executado. Os valores finais, calibrados por simulação, e os resultados estão em `docs/RELATORIO_OPERACAO_NOVA_IDENTIDADE.md`. Por exemplo, os efeitos dos pontos de interesse ficaram um pouco mais fortes que os iniciais.

**Marcações usadas:**

| Marca | Significado |
|---|---|
| **[DECISÃO DE EXECUÇÃO — AUTONOMIA DE IMPLEMENTAÇÃO]** | Escolha minha, reversível |
| **[PROPOSTA — AGUARDANDO CRIADOR]** | Mudança de conceito, ou algo que só o criador decide |

---

## 1. Auditoria — estado atual

### 1.1 Documentos lidos
- `docs/GDD.md`, nas seções de cenário (4), interface (5), eventos aleatórios (10), diálogos (11), direção visual (14) e sugestões S3–S9 (20).
- `jogo/README.md`.
- `docs/RELATORIO_OPERACAO_MADRUGADA.md`.
- `docs/RELATORIO_SISTEMA_DIALOGOS.md`.
- `docs/PLANO_REGIOES_DE_PESCA.md`, incluindo as mecânicas futuras da seção 8.
- **Projeto Hangover Accident**, encontrado em `Documents/emulador mobile/Hangover-Accident` e só lido, nunca alterado: `DialogueSystem.js`, `dialogues.js`, `config.js` e o README.

### 1.2 Código examinado

| Arquivo | O que faz hoje |
|---|---|
| `jogo/src/cenas/CenaPartida.js` (940 linhas) | Toda a tela da partida: lago, margem, personagens, linha, boia, peixe, medidor de tensão, cartões, diálogo, cantinho da família e pausa. Tudo é desenhado com `Graphics` **a cada quadro**. |
| `jogo/src/logica/PescadorRegional.js` | `FishingPlayer` do P1 com as tabelas de região e isca: `_cast`, `_scheduleBite` e `_hook`. |
| `jogo/src/logica/SessaoJogo.js` | `FishingSession` do P1 com pescadores regionais e as mesmas sementes. |
| `jogo/src/logica/DadosPesca.js` | Espécies, objetos, iscas e as 3 regiões mecânicas: margem < 14 m, águas abertas 14–22 m, águas profundas ≥ 22 m. O arremesso vai de 6 a 30 m. |
| `jogo/src/narrativa/*` | Narrador (prioridades, cooldowns, interrupção, sem fila), Sirius (estados) e 387 cenas / 722 falas em arquivos de dados. |
| `jogo/src/audio/AudioJogo.js` | Sons do P1, música sintetizada e vozes 8-bit. |
| `jogo/src/ui/Interface.js`, `index.html`, `estilo.css` | Telas DOM: menu, preparação, catálogo, opções, pausa, resumo e o botão de pausa (`#botao-pausa`, DOM, no centro do topo). |
| `jogo/src/cenas/CenaCarga.js`, `jogo/src/visual/Recortes.js` | Carregam e recortam na memória as folhas do criador. |
| `jogo/src/main.js` | Phaser em resolução real do aparelho (`zoom 1/dpr`), `antialias: true`. |

### 1.3 Testes antes de qualquer alteração (linha de base)
Rodados sobre o código atual, sem mudanças desde então:

| Teste | Resultado |
|---|---|
| Narrativa | 22/22 |
| Jogo — lógica | 18/18 |
| Jogo — navegador | 53/53 |
| Diálogos — navegador | 25/25 |
| P0 e P1 — lógica e simulação | idênticos à linha de base anterior |
| Animador | 27/27 |
| P1 navegador (duas páginas) | 42/42 cada |
| Personagens navegador | 30/31 — oscilação antiga no item "Piscar" |
| P0 navegador | 27/30 — 3 falhas antigas |

### 1.4 Proteções tomadas antes de começar
- **Cópia da versão atual:** `versoes-anteriores/jogo_alma-do-jogo_2026-11-12.zip`. As mudanças da operação anterior ainda não têm commit, e a missão proíbe apagar versões.
- **Hash de 234 arquivos protegidos**, para conferir no fim:
  - P0, P1 e P1 com personagens;
  - `arte/` (spritesheets v4 e animações);
  - folhas da raiz: retratos, peixes, logo e artes;
  - GDD, planos e relatórios anteriores;
  - `iniciar-jogo.bat`.

---

## 2. Problemas identificados

1. **Água em faixas rígidas:** três retângulos de cor sólida, com linhas tracejadas e rótulos fixos ("MARGEM", "ÁGUAS ABERTAS", "ÁGUAS PROFUNDAS") sempre visíveis no meio do lago.
2. **Margem plana:** um retângulo marrom com borda reta e pontinhos. Os personagens parecem colados sobre o fundo, sem sombra nem chão.
3. **Sem fundo distante:** não há céu, horizonte, árvores nem lugar. A água começa colada numa barra preta de HUD.
4. **HUD pesado:**
   - barra preta no topo;
   - botão de pausa grande no centro;
   - medidores de tensão altos nas bordas, sempre visíveis;
   - instruções permanentes em letras grandes ocupando o alto da água ("SEGURE para carregar…").
5. **Regiões sem personalidade:** só a cor muda. As 3 regiões mecânicas não têm cara de lugar.
6. **Arremesso sem motivo além da distância:** não há o que observar na água ("tem alguma coisa ali").
7. **Diálogos:**
   - a caixa é pequena, sobre a água;
   - o "cantinho da família" mostra os retratos de Maria e Sirius o tempo todo, e o criador pediu para não exibi-los permanentemente;
   - a entrada é só um fade, sem animação de saída;
   - uma mordida não interrompe a conversa em andamento.
8. **Desempenho:** a margem (cerca de 100 retângulos) e as faixas são redesenhadas a cada quadro sem necessidade.

---

## 3. Arquitetura visual existente (o que se reaproveita)

| Recurso | Uso na nova versão |
|---|---|
| Personagens animados aprovados (`CharacterAnimator` + spritesheets v4) | Sem alteração; ganham sombra e chão |
| Peixes e iscas recortados na memória (`Recortes.js`) | Silhuetas no lago, cartões e HUD |
| Retratos de expressão (Alemão, ALE, Maria, Sirius) | Caixa de diálogo nova, um por vez |
| Narrador, Sirius e falas | Ganham regras novas de interrupção, retomada e gatilhos do mundo |
| Lógica regional (`PescadorRegional`) | Recebe os pontos de interesse sem tocar no P1 |
| Sons do P1, música e vozes | Somam-se a sons de ambiente sintetizados (água, pássaros, salto) |

---

## 4. Plano de execução

### Missão B — Cenário em três planos

Arte gerada por código em **resolução de pixel art**:
- 1 pixel da arte = P pixels do aparelho, com P = altura ÷ 200;
- P é igual à escala dos personagens no modo de 2 jogadores, para todos terem o mesmo "pixel";
- o cenário é desenhado numa tela pequena (por volta de 320×180 a 420×200) e ampliado com filtro *nearest*, sem borrar;
- **as camadas estáticas são desenhadas uma vez por layout, não a cada quadro.**

**Plano 1 — fundo distante:**
- céu em degradê de fim de tarde, com sol baixo e nuvens que passam devagar;
- duas camadas de morros;
- linha de árvores da outra margem, com luz de contorno;
- uma casinha com píer;
- uma pequena **ponte de madeira** na entrada do rio, que planta a ideia da região especial "Debaixo da ponte".

**Plano 2 — água**, sem faixas retas:
- degradê de profundidade com pontilhado (*dithering*) entre os tons;
- reflexo da margem distante;
- brilho do sol na água;
- fundo de areia e pedrinhas visível na parte rasa;
- vegetação submersa, pedras e troncos;
- silhuetas de peixes em escalas diferentes: os de longe, menores e mais escuros.

**Plano 3 — primeiro plano:**
- margem com borda irregular, terra texturizada, grama, pedras, raízes e plantas;
- tufos na frente dos pés;
- **sombra sob cada personagem**;
- equipamentos: caixa de pesca, balde, garrafa térmica;
- manta de piquenique com o cestinho do Sirius (ver Missão F).

**Animações econômicas**, num único `Graphics` e poucos objetos reaproveitados:
- brilhos na água e ondulações;
- correnteza na Curva das Pedras;
- juncos balançando, bolhas e insetos;
- nuvens e um pássaro de vez em quando.

### Missão D — Regiões com identidade

**[DECISÃO DE EXECUÇÃO — AUTONOMIA DE IMPLEMENTAÇÃO]** As 3 regiões mecânicas continuam iguais, com as mesmas tabelas e o mesmo balanceamento validado. Elas ganham **4 identidades visuais na distância**, nas duas metades da tela:

| Região visual | Distância | Região mecânica | Identidade |
|---|---|---|---|
| **Margem Rasa** | 6–14 m | margem | Água clara, fundo de areia e pedrinhas, plantas aquáticas, cardumes pequenos |
| **Baía dos Lírios** | 14–18 m | águas abertas | Vitórias-régias com flores, sombras, água verde mais calma |
| **Curva das Pedras** | 18–22 m | águas abertas | Pedras com musgo e espuma, correnteza vinda da entrada do rio |
| **Poço Profundo** | 22–30 m | águas profundas | Água escura, troncos submersos, sombras grandes |

- **Por que assim:**
  - "águas abertas" é a referência exata do P1 e está protegida;
  - dividi-la com tabelas novas mexeria num balanceamento validado;
  - a diferença de jogo entre Lírios e Pedras vem dos **pontos de interesse típicos de cada uma** (Missão D2).
- **Justiça entre os jogadores:** como as regiões são faixas de distância, os dois jogadores têm acesso a todas.
- **Nomes:** "Águas profundas" passa a se chamar "Poço profundo" na tela e no catálogo, e "Margem" passa a "Margem rasa". **A mecânica não muda.**
- **Rótulos:** os rótulos fixos no meio do lago saem. A região aparece no alvo enquanto o jogador carrega e na boia quando ela pousa.

**[PROPOSTA — AGUARDANDO CRIADOR]** Regiões especiais:
- **"Debaixo da ponte":** a ponte entra no cenário como pista visual; a área jogável fica proposta.
- **"Lago ao entardecer":** vira um **evento de luz**. Em partidas longas, a tarde vira pôr do sol, com céu alaranjado, reflexos quentes e vagalumes. Só muda o visual, sem efeito nas tabelas.

### Missão D2 — Pontos de interesse (primeira versão funcional)

**Módulo:** `jogo/src/logica/PontosDeInteresse.js`, sem Phaser e testável no Node, seguindo o plano de regiões (seção 8, "pontos quentes").

**Funcionamento:**
- **Um ponto por vez, espelhado:** o mesmo tipo, na mesma distância e no mesmo instante nas duas metades. Igualdade S7.
- **Duração:** 18–28 s.
- **Ritmo:** o primeiro surge entre 25 e 40 s; depois, um novo 30–60 s após o anterior.
- **Pontaria:** o jogador mira pela força, como sempre. O acerto conta quando a boia **pousa** a até 2 m da distância do ponto.
- **Sorteio próprio:** o gerenciador tem uma semente separada, então não muda a sequência de sorteios da pesca. Com as regiões desligadas, não há pontos, e o jogo continua idêntico ao P1.

**Tipos e efeito, só para aquele arremesso** (valores iniciais, calibrados por simulação e registrados no relatório):

| Ponto | Onde | Efeito | Não garante… |
|---|---|---|---|
| Bolhas | Margem Rasa e Baía dos Lírios | mordida mais cedo (espera × 0,7) | o peixe, a fisgada nem a briga |
| Cardume | Margem Rasa | espera × 0,8; mais lambaris e tilápias | |
| Peixes sob os lírios | Baía dos Lírios | espera × 0,85; mais tilápias e traíras | |
| Correnteza | Curva das Pedras | predadores mais prováveis: traíra, tucunaré e dourado; vale mais com isca artificial | |
| Sombra grande | Curva das Pedras e Poço Profundo | peixe um pouco mais pesado (+15% na faixa de peso) | |
| Tronco submerso | Poço Profundo | bagre e carpa mais prováveis, +10% na faixa de peso | |

**Na tela:**
- sinais animados e próprios de cada tipo, no eixo da boia do jogador e na distância certa;
- ao acertar, um "no ponto!" discreto.

**Na narrativa:** o ponto que surge e o acerto podem gerar comentários.

### Missão C — HUD
- **Placas compactas nos cantos superiores:** P1 à esquerda e P2 à direita.
  - Mostram nome na cor do personagem (vermelho para o Alemão, amarelo para o ALE), peixes, maior captura, peso total, e o ícone e o nome da isca.
- **Botão de pausa:** pequeno, no **canto superior direito**, com área de toque suficiente.
- **Tensão:** medidor compacto **ao lado do personagem**, que aparece só durante a briga.
  - Mantém as quatro zonas, o ponteiro e os riscos de arrebentar e de escapar.
  - Mantém o brilho de perigo na borda da metade, mais sutil.
- **Instruções:**
  - viram **dicas contextuais curtas**, que somem depois de 3 acertos de cada etapa (GDD S8), contados por aparelho;
  - os avisos críticos ficam sempre: "TOQUE!", "SOLTE!", "SEGURE!".
  - Há opção de rever as dicas.
- **Distância da boia:** rótulo pequeno e discreto.
- **Cartão de captura:**
  - placa com fita do título, peixe grande, peso, região e isca, e selos de "nova espécie" e "recorde";
  - fica no alto da metade do jogador, longe dos personagens e da caixa de diálogo.

### Missão E — Diálogos no estilo Hangover Accident
- **Caixa:**
  - na região central de baixo, sobre a margem, entre os pescadores, sem cobrir água, boias nem cartões;
  - fundo escuro translúcido, borda branca dupla e **retrato quadrado com moldura na cor de quem fala**;
  - nome colorido e texto letra a letra com bipes.
- **Movimento:**
  - **entrada:** sobe com fade;
  - **saída:** fade;
  - **grito** (fala em maiúsculas): a caixa treme.
- **Um retrato por vez.**
- **O cantinho da família sai.** A família participa pelos diálogos.
- **Comportamento novo:**
  - a mordida interrompe conversas;
  - a fisgada gera reação curta e imediata;
  - captura e mordida podem cortar uma conversa espontânea;
  - uma conversa interrompida pode ser **retomada** depois da briga ("Como eu ia dizendo…"), só se for recente;
  - conversas mais prováveis durante a espera, com intervalos variáveis e momentos de silêncio;
  - gatilhos novos: eventos do mundo e pontos de interesse.
- **Cânone atualizado pela missão:**
  - **Lucas chama Maria de "Maria"**, agora permitido e com falas novas;
  - como Lucas chama o ALE continua indefinido, então sem vocativo.
- **Tom:** revisão do ALE para tirar provocações agressivas. Ele fica calmo, sábio e brincalhão.

### Missão F — Sirius
- Mantêm-se as regras de choro e sono e as vozes 8-bit.
- **Balbucios mais compatíveis com 2 meses:** mais arrulhos (AGU, AAA, OOO, GUH, BU BU).
- **Reações novas:** chuva, salto de peixe, pássaros, silêncio, discussões.
- **[DECISÃO DE EXECUÇÃO]** Sem retratos permanentes. Na margem fica só um objeto de cenário: a manta com o cestinho, sem rosto.
  - Dele saem sinais discretos do estado: "z" dormindo, notinha balbuciando, tremor e "!!" no choro.
  - Assim o estado continua legível (GDD 3.4) sem mostrar personagens fora dos diálogos.

### Missão G — Vida do mundo e polimento

**Eventos raros e leves**, com intervalos sorteados:
- peixe saltando, de preferência perto de uma boia;
- cardume passando;
- objeto boiando: garrafa, folha ou galho, sem itens de fantasia;
- pássaro cruzando o céu;
- ondulações;
- chuva leve rara, com sons sintetizados;
- luz do entardecer em partidas longas.

**Comentários:** alguns eventos geram falas da família e balbucios.

**Sons de ambiente sintetizados**, no volume de efeitos: água, salto de peixe e passarinhos.

### Missão H — Validação
- **Todos os testes existentes, antes e depois.**
- **Testes novos:**
  - pontos de interesse: espelhamento, sorteio separado, sem efeito com regiões desligadas, acerto e efeito;
  - balanceamento por simulação;
  - narrativa: interrupção por mordida, retomada e gatilhos novos;
  - tela: HUD sem sobreposição em várias resoluções, caixa sem cobrir boias, cartões e personagens, um retrato por vez;
  - desempenho e memória em sessão longa no navegador, com emulação mobile.
- **Capturas pedidas pela missão** e, se possível, um vídeo de sessão demonstrativa.

---

## 5. Riscos

| Risco | Como evitar |
|---|---|
| Arte gerada por código parecer genérica | Paleta própria de fim de tarde, pontilhado, luz de contorno, detalhes da história (ponte, casinha, manta) e revisão por capturas a cada etapa |
| Desempenho no celular | Camadas estáticas pré-renderizadas; animações em um `Graphics`; contagem baixa de objetos; medição de FPS e memória |
| Pontos de interesse quebrarem o equilíbrio ou a justiça | Espelhados, efeito moderado, sorteio separado e simulação comparando arremessos no ponto e fora dele |
| Mudança de layout quebrar testes de geometria | Atualizar os testes junto e manter as verificações de não sobreposição |
| Narrativa falar demais | Medir falas por minuto e tempo de caixa na tela; o silêncio continua parte do ritmo |
| Conflito com o GDD | Registrar abaixo, sem decidir pelo criador |

---

## 6. Conflitos com o GDD (registrados, não decididos)
- **[PROPOSTA — AGUARDANDO CRIADOR]** **Câmera lateral (D10, aprovada):**
  - o GDD diz que a direção visual oficial é a câmera lateral e que a vista atual, de frente para o lago, é experimental;
  - esta missão pede para transformar a base existente, sem reconstruir do zero, então **a vista atual foi repaginada**, não trocada;
  - a adaptação para a vista lateral continua uma etapa pendente.
- **[DECISÃO DE EXECUÇÃO] Rio ou lago:**
  - o GDD fala em "margem de rio", e a missão em "lago";
  - o cenário é uma **lagoa alimentada por um rio**: a correnteza da Curva das Pedras vem da entrada do rio, sob a ponte.

---

## 7. Critérios de conclusão (da missão)
- O jogo continua funcionando, e os testes não têm regressão nova sem explicação.
- O cenário tem identidade própria. A água e a margem não parecem blocos planos.
- O HUD é organizado e discreto. As regiões são distintas, e os pontos de interesse são identificáveis.
- Diálogos dinâmicos, um retrato por vez, reagindo à pescaria. Sirius integrado e Maria natural.
- Fluido em telas móveis (emulação). **Teste em celular físico não será declarado sem ter sido feito.**
