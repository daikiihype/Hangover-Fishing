# Relatório — Operação Nova Identidade

**Data:** 12/11/2026 · **Versão:** `jogo/`
**Status:** implementado e testado, **aguardando a avaliação do criador**. Nada aqui foi aprovado automaticamente.
**Marcações:**

| Marca | Significado |
|---|---|
| **[DECISÃO DE EXECUÇÃO]** | Escolha minha, reversível |
| **[PROPOSTA — AGUARDANDO CRIADOR]** | Mudança de conceito, ou algo que só o criador decide |

O plano e a auditoria inicial estão em `docs/PLANO_RECONSTRUCAO_IDENTIDADE.md`.

---

## 1. Resumo

O Hangover Fishing deixou de parecer protótipo: agora é **um lago de fim de tarde em pixel art**.

**Cenário em três planos:**
- **fundo:** céu, sol, nuvens, morros, a outra margem com árvores, uma casinha com chaminé e uma ponte na entrada do rio;
- **água:** profundidade sem faixas retas, reflexos, fundo de areia, plantas, pedras e troncos;
- **primeiro plano:** margem gramada de borda irregular, terra batida sob os pescadores, sombras e equipamentos.

**Quatro lugares com identidade:**
- **Margem Rasa**, **Baía dos Lírios**, **Curva das Pedras** e **Poço Profundo**;
- as tabelas da pesca continuam as mesmas, validadas antes.

**Pontos de interesse** (primeira versão funcional):
- bolhas, cardume, folhas tremendo, redemoinho, sombra grande e tronco;
- aparecem espelhados nas duas metades;
- dão uma vantagem moderada só ao arremesso que pousa em cima;
- testados e balanceados.

**HUD novo:**
- placas compactas nos cantos;
- pausa pequena no canto;
- medidor de tensão compacto ao lado do pescador, só na briga;
- dicas de tutorial que somem;
- cartão de captura com fita e selos.

**Diálogos no estilo Hangover Accident:**
- caixa central embaixo, um retrato por vez, entrada e saída;
- falas gritadas tremem;
- o cantinho com os retratos fixos da família saiu.

**Narrativa mais viva:**
- a mordida corta a conversa, e a conversa pode **voltar** depois;
- a fisgada tem reação rápida;
- mais conversa enquanto a boia espera;
- **97 cenas novas**: o mundo, os pontos e os lugares, mais 31 conversas da família;
- o ALE ficou mais sábio e brincalhão;
- o Lucas agora chama a Maria de "Maria".

**Vida no lago:**
- peixes saltando, cardumes, objetos boiando, pássaros e insetos;
- chuva leve rara;
- **entardecer** em partidas longas, com pôr do sol e vagalumes;
- sons de ambiente sintetizados.

**Garantias:**
- a pesca do P1, o multitouch e os protótipos ficaram intactos (hash idêntico);
- com as regiões desligadas, o jogo continua **idêntico ao P1**;
- nenhum commit foi feito.

---

## 2. Como abrir e testar

**No computador (Windows):**
1. Dois cliques em **`iniciar-jogo.bat`**, na pasta do projeto.
2. Ou num terminal, na pasta `Hangover Fishing`: `py -m http.server 8765 --bind 0.0.0.0`
3. Abra **http://localhost:8765/jogo/**.

**No celular:**
1. Mesma rede Wi-Fi do computador, com o servidor rodando.
2. Abra **http://IP-DO-COMPUTADOR:8765/jogo/**. O `iniciar-jogo.bat` mostra o endereço; o IP também aparece com `ipconfig`.
3. Se o Windows perguntar, permita o acesso em redes privadas.

**O que observar na primeira partida:**
- **Dicas:** aparecem nas primeiras jogadas e somem depois de 3 acertos de cada etapa. Para ver de novo: OPÇÕES → REVER DICAS.
- **Lugares:** carregue o arremesso devagar e veja o alvo passar pelos quatro lugares.
- **Pontos de interesse:** o primeiro aparece entre 25 e 40 s, com anel claro e brilho piscando. Arremesse em cima para ver "NO PONTO!".
- **Conversas:** deixe a boia esperando. Uma mordida corta a conversa, e às vezes ela volta depois.

**Para ver as variações sem esperar:**
- `http://localhost:8765/jogo/?entardecer=1` começa no pôr do sol.
- No console do navegador (F12), durante a partida:

  ```
  HF.app.partida.forcarEvento('chuva')        // também: salto, cardume, objeto, passaro, entardecer
  HF.app.partida.forcarPonto('sombra', 25)    // bolhas, cardume, lirios, correnteza, sombra, tronco
  HF.app.partida.narrador.forcarSirius('dormindo')   // ou 'choro', 'acordado'
  ```

**Versão anterior guardada:** `versoes-anteriores/jogo_alma-do-jogo_2026-11-12.zip`. Para rodar, extraia numa pasta irmã de `jogo/`.

---

## 3. Cenário (Missão B)

**Como foi feito:**
- toda a arte é **gerada por código** em `jogo/src/visual/Cenario.js`, sem nenhum arquivo de imagem novo;
- é desenhada uma vez por layout numa tela pequena e ampliada com filtro *nearest*;
- 1 pixel da arte = P pixels do aparelho, o **mesmo pixel dos personagens** no modo de 2 jogadores;
- a semente é fixa: o lago é o mesmo em toda partida, como um lugar.

| Plano | O que tem |
|---|---|
| Fundo distante | Céu de fim de tarde em degradê pontilhado; sol baixo com halo; nuvens que passam; duas camadas de morros; a outra margem com árvores (copas com luz do sol, pinheiros); casinha de telhado vermelho com chaminé e píer; **ponte de madeira** na entrada do rio |
| Água | Profundidade com **limites ondulados e pontilhados** (nada de faixas retas); reflexo da outra margem; brilho do sol; fundo de areia e pedrinhas na parte rasa; plantas aquáticas; pedras submersas; troncos e sombras no poço; vitórias-régias com flores; pedras com musgo e espuma; juncos e taboas nas pontas; galho seco; folhas boiando |
| Primeiro plano | Margem de **borda irregular** (barro molhado, areia, capim saindo para a água); capim com textura miúda e flores; **terra batida** sob cada pescador; **sombras nos pés**; caixa de pesca, balde, garrafa térmica; manta de piquenique com o cestinho do Sirius |

**Animações** (`VidaDoLago.js`), todas leves e num punhado de objetos:
- brilhos deslizando na água e **correnteza** saindo do rio na Curva das Pedras;
- espuma das pedras, cintilado do sol e ondulações;
- juncos e capim balançando, insetos e fumaça da chaminé;
- peixes ao fundo, **menores e mais escuros quanto mais longe e mais fundo**.

**[DECISÃO DE EXECUÇÃO] Lagoa alimentada por um rio:** o GDD fala em "margem de rio" e a missão em "lago". Por isso a correnteza da Curva das Pedras vem da entrada do rio, sob a ponte.

---

## 4. Lugares e pontos de interesse (Missão D)

### 4.1 Os quatro lugares
| Lugar | Distância | Região mecânica (tabelas de antes) | Identidade |
|---|---|---|---|
| **Margem Rasa** | até 14 m | margem | água clara, fundo de areia, cardumes |
| **Baía dos Lírios** | 14–18 m | águas abertas (= P1) | vitórias-régias, sombra, água verde |
| **Curva das Pedras** | 18–22 m | águas abertas (= P1) | pedras com musgo, correnteza do rio |
| **Poço Profundo** | 22 m em diante | águas profundas | água escura, troncos, sombras grandes |

**[DECISÃO DE EXECUÇÃO] As 3 regiões mecânicas ficaram como estavam:**
- "águas abertas" é a referência exata do P1 e o balanceamento foi validado;
- Lírios e Pedras se diferenciam pelos **pontos de interesse típicos de cada uma**;
- os dois jogadores têm acesso aos quatro lugares, porque são faixas de distância;
- nas telas, "Margem" virou "Margem Rasa" e "Águas profundas" virou "Poço Profundo";
- o guia do catálogo explica os lugares e os pontos.

**Na tela:**
- os rótulos fixos no meio do lago saíram;
- o lugar aparece no **alvo enquanto carrega**, com uma cor por lugar, e **na boia quando ela pousa**;
- a barra de força mostra os quatro lugares em proporção.

### 4.2 Pontos de interesse (`jogo/src/logica/PontosDeInteresse.js`)

**Regras:**
- **Um por vez, espelhado:** o mesmo tipo, na mesma distância e no mesmo instante nas duas metades (igualdade S7).
- **Ritmo:**
  - o primeiro aparece entre 25 e 40 s;
  - cada um dura de 18 a 28 s;
  - a pausa até o próximo é de 30 a 60 s.
- **Acerto:** a boia precisa **pousar** a até 2 m do ponto. O jogador mira com a força, como sempre, e o efeito vale **só para aquele arremesso**.
- **Sorteio próprio, com semente separada:** a sequência de sorteios da pesca não muda (testado).
- **Regiões desligadas:** sem pontos, o jogo continua igual ao P1.

| Ponto | Onde | Efeito no arremesso que pousa em cima |
|---|---|---|
| Bolhas | Margem Rasa, Baía dos Lírios | espera até a mordida × 0,65 |
| Cardume | Margem Rasa | espera × 0,75; lambari × 1,8, tilápia × 1,4 |
| Peixes sob os lírios | Baía dos Lírios | espera × 0,8; tilápia × 1,5, traíra × 1,6 |
| Redemoinho | Curva das Pedras | espera × 0,9; traíra × 1,4, tucunaré × 2, dourado × 1,6. Os dois últimos só com isca artificial, como antes. |
| Sombra grande | Curva das Pedras, Poço Profundo | espera × 0,95; carpa, bagre e dourado × 1,3; peso +20% da faixa |
| Tronco submerso | Poço Profundo | espera × 0,95; bagre × 1,6, carpa × 1,3; peso +15% da faixa |

**Balanceamento medido** (`jogo/tests/pontos.test.js`, simulações com a lógica real):
- **Por arremesso no ponto**, comparado com a mesma zona sem ponto:
  - espera de 0,57 a 0,79 do normal (bolhas, cardume, lírios);
  - peixe de 13 a 34 pontos percentuais mais pesado dentro da faixa da espécie (sombra, tronco).
- **Por sessão:**
  - quem persegue **todos** os pontos pega 5,8% mais peixes e 6,4% menos peso, porque troca peso por rapidez;
  - pescando numa zona com os pontos dela, o ganho fica entre −0,7% e +2,9%.
- **Conclusão:** vale a pena no momento, mas **não domina** nem quebra o equilíbrio.

**Na tela:**
- cada tipo tem um sinal próprio: bolhas subindo, peixinhos circulando, folhas tremendo, redemoinho de espuma, sombra grande e tronco com bolhas;
- além disso, há um anel claro pulsando e um brilho piscando;
- o ponto entra e sai suave;
- quem acerta vê "NO PONTO! ✦" e anéis dourados.

**[PROPOSTA — AGUARDANDO CRIADOR]** Regiões especiais:
- **"Debaixo da ponte":** a ponte já está no cenário como pista; a área jogável fica para depois.
- **"Lago ao entardecer":** foi feito como **evento de luz**, só visual (seção 7), sem tabelas novas.

---

## 5. HUD (Missão C)

| Elemento | Antes | Agora |
|---|---|---|
| Placar | barra preta no topo | **placas compactas nos cantos**: nome na cor (vermelho / amarelo), peixes, ★ maior, total e isca com ícone |
| Pausa | botão grande no centro do topo | **40 px no canto superior direito**, translúcido |
| Tensão | barras altas nas bordas, sempre visíveis | **medidor compacto ao lado do pescador**, do lado de fora, só na briga: 4 zonas, ponteiro, riscos de arrebentar e escapar, e aviso curto "SOLTE!", "SEGURE!" ou "CUIDADO" |
| Instruções | textos grandes permanentes no alto da água | **dicas curtas** embaixo da placa, que somem depois de 3 acertos de cada etapa (GDD S8). Os avisos críticos ficam sempre: "TOQUE!", "SOLTE!", "SEGURE!" |
| Distância | rótulo branco | pequeno e discreto sob a boia |
| Captura | caixa simples | **placa com fita colorida** (PEGOU!, PEIXÃO!, OBJETO ESTRANHO!, ESCAPOU!, LINHA ROMPEU!), peixe grande, peso, lugar e isca, selos "★ NOVA ESPÉCIE ★" e "★ RECORDE ★" |

**Mais coisas que mudaram:**
- a boia virou um pequeno **sprite em pixel art**;
- a borda de perigo ficou mais sutil;
- a divisória entre as metades ficou discreta e só existe sobre a água.

**Opções novas:**
- "Dicas na tela": ligadas ou desligadas;
- "REVER DICAS".

---

## 6. Diálogos e Sirius (Missões E e F)

### 6.1 Apresentação — Hangover Accident (`jogo/src/visual/CaixaDialogo.js`)
- **Referência:** examinei o projeto Hangover Accident (`Documents/emulador mobile/Hangover-Accident`), só lendo.
- **Padrão reaproveitado:**
  - caixa escura translúcida com **borda branca dupla**;
  - **retrato quadrado com moldura na cor de quem fala**;
  - nome colorido e texto letra a letra com bipes;
  - **fala gritada (maiúsculas) faz a caixa tremer**;
  - entrada e saída suaves.
- **Posição:** centro de baixo, **sobre a margem**, entre os pescadores. Não cobre água, boias, cartões nem placas, e isso é verificado em 5 tamanhos de tela.
- **Um retrato por vez**, verificado. Uma ponta no alto indica o lado de quem fala.
- **Estilos do Sirius:** balbucio azul-claro com letras grandes; choro rosado, tremendo, com lágrimas.
- **[DECISÃO DE EXECUÇÃO] Sem retratos permanentes da família:**
  - o cantinho com os retratos de Maria e Sirius **saiu**;
  - na margem fica só a **manta com o cestinho do Sirius, sem rosto**;
  - do cestinho saem sinais em pixel: "z" dormindo, notinha balbuciando, "!" inquieto e "!!" chorando;
  - assim o estado continua legível sem exibir os personagens fora dos diálogos.
- **Não adotado:** o "toque na caixa pula a fala" do Hangover Accident. Aqui os toques são da pesca de cada metade.

### 6.2 Comportamento
- **Mordida:** corta a conversa do momento.
- **Fisgada:** ganha reação **curta e imediata**, 0,7 s depois da fala anterior.
- **Conversas soltas cedem a acontecimentos:** capturas, mordidas, pontos, clima e eventos perto da boia podem cortá-las.
- **Retomada:**
  - uma conversa cortada pode voltar se a calma vier em até 60 s, com 60% de chance;
  - começa com "Como eu ia dizendo…" e segue com o que faltava;
  - depois de 1 minuto, o assunto fica para trás.
- **Conversas na espera:**
  - vêm mais cedo enquanto alguém espera a mordida (intervalos variáveis);
  - durante a briga, só conversas curtas;
  - o silêncio continua existindo.
- **Mantidos da operação anterior:**
  - uma fala por vez, sem fila de comentários atrasados;
  - no máximo uma cena pendente, que expira em 2,5 s;
  - tempos mínimos por personagem, categoria e frase.

**Ritmo medido** (30 min simulados com a pesca real, robôs pescando sem parar):

| Medida | 2 jogadores | 1 jogador |
|---|---|---|
| Falas por minuto | 5,7–6,2 (média 5,9) | 4,8–5,3 |
| Cenas por minuto | 3,5 | — |
| Tempo com a caixa na tela | 24–26% | 21–22% |
| Conversas em 30 min | 10–12 | 14–16 (mais espera) |
| Divisão das falas | ALE 33% · Alemão 33% · Maria 26% · Sirius 8% | — |

### 6.3 Conteúdo
**Total:** 484 cenas e 918 falas, contra 387 e 722 antes.

| Personagem | Falas |
|---|---:|
| Alemão | 293 |
| ALE | 326 |
| Maria | 234 |
| Sirius (balbucios) | 64 |

**Novo — `falas/mundo.js`** (66 cenas, 107 falas):

| Gatilho | Cenas |
|---|---:|
| Peixe saltando (perto ou longe da boia) | 11 |
| Cardume | 5 |
| Objeto boiando | 6 |
| Pássaros | 4 |
| Começo da chuva | 5 |
| Fim da chuva | 3 |
| Entardecer | 5 |
| Ponto que surge | 8 |
| Boia no ponto | 9 |
| Primeira vez em cada lugar | 10 |

**Novo — `falas/familia.js`** (31 cenas, 89 falas):
- conversas de espera entre os três adultos;
- histórias de família;
- o Sirius com os adultos interpretando os balbucios;
- cenas do modo de 1 jogador.

**[DECISÃO DE EXECUÇÃO] Tom do ALE:** quatro falas que soavam ríspidas foram trocadas por versões sábias e brincalhonas, por exemplo "Ouve. Por isso a gente pesca em silêncio.".

**Cânone atualizado pela missão:**
- o **Lucas chama a Maria de "Maria"** (7 falas novas);
- como o Lucas chama o ALE continua indefinido, então ele não usa vocativo;
- o teste de cânone foi atualizado.

**Sirius:**
- balbucios mais compatíveis com 2 meses: mais arrulhos (AGU, AAA, OOO, GUH, BU BU) e menos sílabas de criança mais velha;
- reações novas a peixe saltando, cardume, pássaros, chuva, pôr do sol e sombra grande.

**Choro** (regras preservadas):
- nunca nos primeiros 75 s;
- pelo menos 4 min entre episódios;
- Maria cuidando dele; a pesca não para.
- **Medido no Sirius sozinho em 200 horas:** um a cada 10 min em média, intervalo **mediano de 8,0 min**, mínimo de 4,2 min.
- **Com os barulhos do jogo:** cerca de um a cada 7 a 8 min nas simulações de 30 min.

---

## 7. Vida no lago (Missão G)

**Eventos raros e leves**, com intervalos sorteados e relógio do jogo (param na pausa):

| Evento | Frequência | Detalhe |
|---|---|---|
| Peixe saltando | a cada 35–80 s; mais frequente no entardecer | perto de uma boia em 60% das vezes |
| Cardume passando | a cada 60–120 s | — |
| Objeto boiando (garrafa, galho, folha) | a cada 110–200 s | — |
| Pássaros cruzando o céu | a cada 40–90 s | com piado |
| Ondulações | o tempo todo, aleatórias | — |
| **Chuva leve** | rara: depois de 5 min, no máximo uma a cada 12 min, 35–60 s de duração | gotas inclinadas, ondinhas, céu um pouco mais escuro e som de chuva sintetizado |
| **Entardecer** | dos 4 aos 9 min de partida | a tarde vira pôr do sol: céu laranja e lilás, luz quente sobre o lago e vagalumes |

- **Comentários:** quase todos os eventos podem render falas da família e reações do Sirius, por exemplo "ELE PULOU DO LADO DA MINHA BOIA!" e "É chuva, Sirius. Vem, vou te cobrir.".
- **Sons de ambiente sintetizados**, no volume de efeitos e sem arquivos: respingo do peixe, chuva e passarinho.

---

## 8. Desempenho e compatibilidade

**Medido no `e2e-identidade.js`:** Edge do computador com celular emulado (844×390, densidade 3, toque), 90 s com os dois pescadores jogando e eventos forçados.

| Medida | Resultado |
|---|---|
| FPS | **61 estável** em todas as 18 amostras |
| Heap de JavaScript | oscilou entre 24 e 43 MB nas três rodadas, **sem crescer** (coleta de lixo normal) |
| Objetos da cena | 66–73, estáveis |
| Texturas | 82, constantes |
| Carregamento até o menu | 0,8 a 1,0 s (829 ms e 986 ms em duas rodadas, servidor local) |

**Por que fica leve:**
- as camadas estáticas são geradas uma vez por layout;
- as animações cabem em 6 `Graphics` e poucas imagens;
- os eventos destroem seus objetos ao terminar;
- não há recriação de texturas a cada quadro.

**Telas verificadas:**
- 640×360, 844×390 e 1024×768 com 2 jogadores;
- 844×390 e 640×360 com 1 jogador;
- 915×412 (Pixel 7);
- o menu vertical com 390×844.

**Teste em celular físico: não foi feito** (limitação 1).

---

## 9. Testes e resultados

### 9.1 Antes das alterações (linha de base, mesma versão do código)

| Teste | Resultado |
|---|---|
| Narrativa | 22/22 |
| Jogo — lógica | 18/18 |
| Jogo — navegador | 53/53 |
| Diálogos — navegador | 25/25 |
| P0 e P1 — lógica e simulação | idênticos |
| Animador | 27/27 |
| P1 — navegador (duas páginas) | 42/42 cada |
| Personagens — navegador | 30/31 (oscilação antiga do item "Piscar") |
| P0 — navegador | 27/30 (3 falhas antigas) |

### 9.2 Depois (bateria final completa)

| Teste | Resultado |
|---|---|
| Jogo — lógica (`logica.test.js`), incluindo a igualdade com o P1 | **18/18** |
| Pontos de interesse (`pontos.test.js`, novo) | **10/10** |
| Narrativa (`narrativa.test.js`) | **29/29**, 7 testes novos |
| Simulação de regiões e iscas | roda sem erro |
| P0 — lógica | 18/18, saída **idêntica** à linha de base |
| P1 — lógica | 53/53, saída **idêntica** à linha de base |
| P1 — simulação de balanceamento | saída **idêntica** à linha de base |
| Animador (P1 com personagens) | 27/27 |
| Jogo — navegador (`e2e-jogo.js`) | **53/53** |
| Diálogos — navegador (`e2e-dialogos.js`) | **26/26** |
| Identidade nova — navegador (`e2e-identidade.js`, novo) | **22/22** |
| P1 — navegador (página do P1 e página com personagens) | 42/42 e 42/42 |
| P1 com personagens — navegador | 31/31 (desta vez sem a oscilação antiga do "Piscar") |
| P0 — navegador | 27/30. As **mesmas 3 falhas de antes**: a página do P0 não tem ícone (erro 404) e falta a ela a correção de rotação. O P0 não foi alterado. |

**Ajuste depois da bateria:** a chuva tinha gotas alinhadas em colunas e passou a usar posições sorteadas uma vez. Depois disso foram repetidos:
- o teste da identidade nova: 22/22, com capturas e vídeo regenerados;
- lógica 18/18, pontos 10/10, narrativa 29/29, jogo no navegador 53/53 e diálogos no navegador 26/26;
- a conferência dos 234 protegidos, todos idênticos.

Todos esses resultados são do código definitivo.

### 9.3 Testes novos ou atualizados
**`jogo/tests/pontos.test.js` — 10 testes:**
- espelhamento;
- regiões desligadas sem pontos;
- **sorteio próprio**: mesmos eventos de pesca com e sem pontos;
- efeito exato (espera × 0,65);
- correnteza e sombra;
- ritmo;
- equilíbrio geral, por zona e por arremesso.

**`jogo/tests/narrativa.test.js` — 29 testes, 7 novos:**
- a mordida corta a conversa e guarda o resto;
- a retomada continua a conversa;
- depois de 60 s, o assunto fica para trás;
- a fisgada tem reação rápida;
- peixe saltando, com o Sirius dormindo sem balbuciar;
- comentário de boia no ponto;
- chuva e entardecer;
- o teste de cânone foi atualizado para "Lucas → Maria".

**`jogo/tests/e2e-identidade.js` — 22 verificações no navegador:**
- carregamento;
- três planos em pixel art nítida;
- vida no lago;
- placas e pausa nos cantos;
- cores e isca no HUD;
- dicas que aparecem e somem;
- os quatro lugares no alvo;
- pontos espelhados e "NO PONTO!";
- medidor só na briga;
- cartão com fita;
- retrato e nome de ALE, Maria e Sirius;
- eventos do mundo;
- FPS, memória e objetos estáveis em 90 s;
- modo de 1 jogador;
- tela 915×412;
- nenhum erro.

**`jogo/tests/e2e-dialogos.js` — 26 verificações:**
- família sem retratos fixos e o cestinho na margem;
- entrada e saída da caixa, com um retrato por vez;
- choro e sono pelo cestinho;
- geometria da caixa sobre a margem, mais placas, pausa e dicas sem sobreposição, em 5 telas.

**`jogo/tests/e2e-jogo.js` — 53 verificações:** atualizadas para os nomes de lugar e para as regiões desligadas (sem nome de lugar nem pontos).

**Integridade:** os **234 arquivos protegidos** têm hash idêntico ao do início da missão. Foram conferidos na bateria final e de novo depois do último ajuste. A lista:
- P0, P1 e P1 com personagens;
- `arte/`;
- as 12 folhas da raiz (retratos, peixes, logo e artes);
- GDD, planos e relatórios anteriores;
- `iniciar-jogo.bat`.

---

## 10. Arquivos criados e modificados

**Criados:**

| Arquivo | Para quê |
|---|---|
| `jogo/src/visual/Cenario.js` | o lago em pixel art gerado por código |
| `jogo/src/visual/VidaDoLago.js` | animações, eventos do mundo, desenho dos pontos de interesse e sinais do cestinho |
| `jogo/src/visual/CaixaDialogo.js` | a caixa de diálogo no estilo Hangover Accident |
| `jogo/src/logica/PontosDeInteresse.js` | os pontos de interesse (lógica, sem Phaser) |
| `jogo/src/narrativa/falas/mundo.js` | falas do mundo, dos pontos e dos lugares (66 cenas) |
| `jogo/src/narrativa/falas/familia.js` | conversas de espera e da família (31 cenas) |
| `jogo/tests/pontos.test.js` | 10 testes no Node |
| `jogo/tests/e2e-identidade.js` | 22 verificações no navegador, capturas e vídeo |
| `jogo/capturas/nova-identidade/*` | capturas e vídeo de demonstração |
| `docs/PLANO_RECONSTRUCAO_IDENTIDADE.md` | auditoria e plano |
| `docs/RELATORIO_OPERACAO_NOVA_IDENTIDADE.md` | este relatório |
| `versoes-anteriores/jogo_alma-do-jogo_2026-11-12.zip` | cópia da versão anterior |

**Modificados:**

| Arquivo | Mudança |
|---|---|
| `jogo/src/cenas/CenaPartida.js` | reescrita da apresentação: cenário em camadas, vida no lago, HUD, medidor, dicas, cartões e caixa nova. A ponte de toques, os eventos, o catálogo e a API do aplicativo ficaram como estavam. |
| `jogo/src/logica/PescadorRegional.js` | zona de pouso e efeito do ponto de interesse; tabela e faixa de peso viraram métodos testáveis |
| `jogo/src/logica/SessaoJogo.js` | gerenciador de pontos (semente própria, relógio que para na pausa) |
| `jogo/src/logica/DadosPesca.js` | nomes de lugar e as 4 zonas visuais (tabelas e limites iguais) |
| `jogo/src/logica/Armazenamento.js` | opção "dicas" |
| `jogo/src/narrativa/Narrador.js` | mordida corta, retomada, reação rápida, espera, eventos do mundo, pontos, lugares e balbucios |
| `jogo/src/narrativa/Falas.js` | prioridades dos gatilhos novos e cânone atualizado no cabeçalho |
| `jogo/src/narrativa/falas/captura.js`, `conversas.js` | tom do ALE (4 falas) |
| `jogo/src/audio/AudioJogo.js` | sons de ambiente (respingo, chuva, passarinho) |
| `jogo/src/ui/Interface.js` | opções "Dicas" e "Rever dicas"; guia com lugares e pontos |
| `jogo/index.html` | scripts novos; rodapé do menu |
| `jogo/estilo.css` | botão de pausa no canto |
| `jogo/tests/e2e-jogo.js`, `e2e-dialogos.js`, `narrativa.test.js` | atualizados para o desenho novo |
| `jogo/README.md` | atualizado |

**Não alterados** (hash conferido):
- P0, P1 e P1 com personagens;
- `arte/` (spritesheets v4 e animações aprovadas);
- folhas originais de retratos e peixes, logo e artes;
- GDD, planos e relatórios anteriores;
- `iniciar-jogo.bat`.

**A abertura do jogo não mudou.**

---

## 11. Decisões tomadas (autonomia de execução)

1. **[DECISÃO DE EXECUÇÃO]** Arte inteira gerada por código, em pixel art com o pixel dos personagens e paleta própria de fim de tarde. Nenhum asset novo de imagem.
2. **[DECISÃO DE EXECUÇÃO]** 4 lugares visuais sobre as 3 regiões mecânicas (seção 4.1). Tabelas e balanceamento validados ficaram intactos.
3. **[DECISÃO DE EXECUÇÃO]** Pontos de interesse espelhados com efeito moderado, só no arremesso que pousa neles. Valores registrados na seção 4.2.
4. **[DECISÃO DE EXECUÇÃO]** Lagoa alimentada por um rio, conciliando "rio" do GDD e "lago" da missão. A ponte fica como pista da região especial.
5. **[DECISÃO DE EXECUÇÃO]** Família sem retratos fixos; o cestinho sem rosto mostra o estado do Sirius.
6. **[DECISÃO DE EXECUÇÃO]** Caixa de diálogo embaixo, no centro, sobre a margem: é a "região central" que não cobre a pescaria.
7. **[DECISÃO DE EXECUÇÃO]** Pausa no canto superior direito. No modo de 2 jogadores, ela fica sobre a metade do ALE, pequena e longe de onde os dedos costumam ficar.
8. **[DECISÃO DE EXECUÇÃO]** Medidor de tensão do lado de fora de cada pescador, nas costas dele, aparecendo só na briga.
9. **[DECISÃO DE EXECUÇÃO]** Retomada de conversa (60% de chance, até 60 s), mordida que corta conversa e fisgada com reação rápida.
10. **[DECISÃO DE EXECUÇÃO]** Entardecer como evento de luz, dos 4 aos 9 minutos, e chuva rara.
11. **[DECISÃO DE EXECUÇÃO]** Quatro falas do ALE suavizadas e balbucios mais de bebê de 2 meses.
12. **[DECISÃO DE EXECUÇÃO]** O menu vertical foi mantido, porque já tinha a paleta de pôr do sol coerente com a identidade nova. Só o rodapé mudou.

---

## 12. Limitações reais

1. **Celular físico não testado.** Tudo foi verificado no Edge do computador com emulação de celular (toque, densidade 3, telas reais de iPhone e Pixel). Ainda falta medir num aparelho de verdade:
   - FPS e aquecimento;
   - legibilidade ao sol;
   - toque na pausa do canto.
2. **Os 61 FPS são do computador.** Num Android modesto pode ser menos, embora o desenho seja econômico. Não há modo "gráficos leves" ainda.
3. **Arte gerada por código:**
   - tem identidade e coesão, mas não substitui a mão de um artista;
   - detalhes como árvores e pedras são simples;
   - um artista pode trocar qualquer camada mantendo a mesma estrutura.
4. **Lírios e Pedras têm a mesma tabela de pesca**, a das águas abertas. A diferença de jogo vem só dos pontos de interesse típicos de cada uma.
5. **Pontos de interesse:**
   - o efeito por sessão é pequeno de propósito (seção 4.2);
   - com 2 m de tolerância, acertar exige timing de cerca de 0,13 s no medidor de força;
   - em telas pequenas, os sinais de bolhas e cardume são miúdos;
   - falta teste com pessoas para calibrar.
6. **Vídeo de demonstração:** gravado pelo próprio navegador (`MediaRecorder` no canvas), sem o botão de pausa, que é da página e não do canvas.
7. **Toque na caixa para pular a fala** (Hangover Accident) não foi adotado: os toques são da pesca.
8. **Simulação × partida real:** nas simulações, os robôs quase não erram e pescam sem parar. Numa partida real há mais espera, portanto mais conversas, e mais fracassos comentados.
9. **Choro:** com os barulhos do jogo, a média fica entre 7 e 8 min; o Sirius sozinho tem mediana de 8 min. As regras não mudaram.

---

## 13. Pendências que precisam do criador

1. **[PROPOSTA — AGUARDANDO CRIADOR] Câmera lateral:**
   - o GDD (D10, aprovado) diz que a direção visual oficial é a câmera lateral;
   - esta missão repaginou a vista atual, de frente para o lago, como pedido ("não reconstruir do zero");
   - é preciso decidir se a vista de frente vira a oficial ou se ainda haverá a adaptação lateral.
2. **[PROPOSTA — AGUARDANDO CRIADOR] Regiões especiais:** "Debaixo da ponte" como área jogável e "Lago ao entardecer" com efeito nas tabelas (hoje é só visual).
3. **Tratamento do Lucas para o ALE:** ainda indefinido no GDD.
4. **Visual padrão do Sirius:** continua pendente no GDD. Os retratos de óculos com "Magic by birth" continuam fora, por causa da referência a Harry Potter.
5. **Avaliar no celular:** legibilidade do HUD, tamanho do botão de pausa no canto e frequência dos eventos e conversas.
6. **Pontos de interesse:** dizer se o efeito deve ser maior ou menor depois de jogar. Os valores estão numa tabela única em `PontosDeInteresse.js`.

---

## 14. Capturas (`jogo/capturas/nova-identidade/`)

| Captura | Arquivo |
|---|---|
| Menu vertical | `01_menu_vertical.png` |
| Partida com dois jogadores | `02_partida_dois_jogadores.png` |
| Partida com um jogador | `03_partida_um_jogador.png` |
| Cenário completo | `04_cenario_completo.png` |
| HUD | `05_hud.png` |
| Tela de Pixel 7 | `06_partida_915x412.png` |
| Regiões | `07_regioes_alvo_carregando.png`, `08_ponto_de_interesse.png` |
| Briga com o medidor | `09_briga_medidor.png` |
| Captura de peixe | `10_captura_de_peixe.png` (ou `10_resultado_da_briga.png`, se o peixe escapou na rodada) |
| Diálogo do ALE | `11_dialogo_ale.png` |
| Diálogo da Maria | `12_dialogo_maria.png` |
| Sirius acordado | `13_sirius_acordado.png` |
| Sirius dormindo | `14_sirius_dormindo.png` |
| Eventos do lago | `15_eventos_do_lago.png` |
| Chuva leve | `16_chuva_leve.png` |
| Entardecer | `17_entardecer.png` |
| Sessão demonstrativa | `demo_sessao.webm` (cerca de 30 s: pesca dos dois robôs, ponto de interesse, peixe saltando, conversa, cardume, pássaros, entardecer e chuva) |
