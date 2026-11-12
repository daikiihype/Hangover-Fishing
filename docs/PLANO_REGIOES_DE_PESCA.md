# Hangover Fishing
## Plano do sistema de regiões de pesca (Missão 001)

**Status:** **ESTUDO E PROPOSTA — aguardando a direção criativa.** Nada foi implementado. P0, P1, animações, controles e máquina de estados **não foram alterados**.
**Data:** 12/11/2026
**Base:** P1 (`prototipos/p1-pesca/`) e GDD (D1, S3, S7, S9)
**Simulação:** `docs/estudos/simulacao-regioes.js` (só lê a lógica do P1)

**Marcadores usados neste documento:**

| Marcador | Significado |
|---|---|
| **[EXISTENTE]** | Já é assim no código ou no GDD hoje |
| **[PROPOSTA]** | Sugestão deste estudo, não aprovada |
| **[APROVADO — DIREÇÃO CRIATIVA]** | Decisão já aprovada anteriormente; nenhuma decisão nova foi aprovada nesta missão |

> **Princípio central:** cada região deve oferecer uma escolha interessante, mas nenhuma deve ser a melhor em todas as situações.

---

## 0. Resumo

1. **A distância já pode definir a região sem mudar nenhum controle.** A força do medidor vira distância em linha reta (6 a 30 m). Três faixas de força dão três faixas de distância. **[PROPOSTA]**
2. **Achado principal do diagnóstico:** hoje, arremessar longe é **sempre pior**. Com a mesma espera, os mesmos peixes e os mesmos pesos em qualquer distância, a briga só fica mais longa. Na simulação de 10 minutos:

   | Arremesso | Peixes | Peso total | Peixe ≥ 3 kg |
   |---|---|---|---|
   | Curto | 30 | 57 kg | 5,7 |
   | Longo | 20 | 36 kg | 3,4 |

   A distância hoje é só custo, sem recompensa. A decisão **D1** já aprovou que ela deve ter significado. **[EXISTENTE]**
3. **Modelo recomendado [PROPOSTA]:**
   - **Margem:** mais peixes, menores.
   - **Águas abertas:** **exatamente as regras de hoje**, o jogo validado nas sessões de 30 minutos.
   - **Águas profundas:** espera maior, peixes mais pesados **e mais fortes**.
4. **A simulação mostra que nenhuma região vence tudo:**
   - a margem vence em **quantidade**;
   - o fundo vence em **peixe grande** e em kg para quem joga bem;
   - as águas abertas vencem em kg para quem joga de forma descuidada e ficam no meio em todo o resto.
5. **Alavanca mais importante:** o peixe do fundo precisa ser **mais forte**. Sem isso, o fundo vence em kg para todos os estilos de jogador, inclusive os descuidados.
6. **Implementação proposta em 5 etapas pequenas.** A primeira não muda nada no jogo; só registra a região em que cada arremesso cai. As regiões entram com **liga/desliga no menu**, para comparar com o jogo atual (seção 10).

---

## 1. Diagnóstico do funcionamento atual **[EXISTENTE]**

### 1.1. Carga, arremesso e distância
Fonte: `FishingPlayer.js` (`chargePower`, `_cast`) e `config.js`.

- **Medidor cíclico:**
  - a força vai de 0 a 1 em 800 ms e volta a 0 aos 1.600 ms (`castCycleMs` = 1600), repetindo enquanto o jogador segura;
  - é a força **no instante exato da soltura**;
  - soltar antes de 200 ms (`castMinChargeMs`) cancela o arremesso.
- **Distância** = `castMinDistance + (castMaxDistance − castMinDistance) × força` = **6 + 24 × força** metros (6 a 30 m), em linha reta e sem sorteio.
- **Voo da boia:** 450 + 450 × força ms (0,45 a 0,9 s). Depois, `WAITING`.
- **Posição da boia:** um único número, `distance`, que a tela converte em altura na água da metade do jogador (`distToY`). Não há posição lateral nem mapa.
- **A distância muda depois do arremesso:**
  - recolher a linha vazia (`REELING_EMPTY`) a reduz a 14 m/s;
  - soltar no meio retoma a espera **do ponto em que parou** (decisão D4, aprovada);
  - na briga, a distância é o "caminho" do peixe até a margem, e o peixe pode levar linha até 36 m.
- **As faixas de força já existem no projeto:**
  - CHARGE e CAST usam **0–33 / 34–66 / 67–100 %** para escolher os quadros e os tempos (`charge.json`, `cast.json`);
  - essas faixas correspondem a **< 14 m / 14–22 m / ≥ 22 m**.

### 1.2. Frequência e espécie das mordidas
Fonte: `_scheduleBite` e `_hook`.

| O quê | Como é hoje | Depende da distância? |
|---|---|---|
| **Frequência** | **Sempre há mordida**. A espera é sorteada de modo uniforme entre **2,5 e 8 s** (`waitMinMs`/`waitMaxMs`, média 5,25 s), com 0 a 2 beliscadas só visuais | Não |
| **Janela de fisgada** | 1 s (`reactionWindowMs`) | Não |
| **Espécie (perfil)** | Sorteada **no momento da fisgada** (`_hook`): rápido 45 % · pesado 25 % · arisco 30 % (`fishProfiles[].chance`) | Não |
| **Peso** | Uniforme dentro da faixa do perfil (rápido 0,3–1,2 kg · pesado 2–6 · arisco 0,8–3) | Não |
| **Força do peixe** | `strength` de 0,85 a 1,15, conforme o peso dentro do perfil; puxão, corrida, descanso e cansaço vêm do perfil | Não |
| **Duração da briga** | O peixe precisa vir da distância da boia até 0 m, a 3 m/s, menos o quanto o puxão freia | **Sim: é o único efeito da distância** |

### 1.3. Medição: onde vai o tempo de uma sessão
Fonte: simulação de 10 min com a lógica real do P1 (seção 6). Os jogadores virtuais leem a tensão exata.

| Arremesso (regras de hoje) | Peixes / 10 min | kg / 10 min | Maior (média) | Esperando | Brigando | Briga média |
|---|---|---|---|---|---|---|
| Curto (10 m) | 30,1 | 56,8 | 5,47 kg | 27 % | 56 % | 11 s |
| Médio (18 m) | 23,9 | 45,1 | 5,28 kg | 21 % | 69 % | 17 s |
| Longo (26 m) | 19,5 | 35,6 | 5,34 kg | 17 % | 75 % | 23 s |

*(jogador "médio"; outros estilos na seção 6)*

**Conclusões:**
- Hoje o arremesso curto é melhor em tudo. O maior peixe é igual em qualquer distância, porque o sorteio não depende dela.
- **A briga ocupa a maior parte do tempo (55–75 %).** Mudar a espera mexe pouco no ritmo. Quem decide o ritmo de uma região é a distância (briga mais longa) e a força do peixe.

### 1.4. A distância pode definir a região sem alterar os controles?
**Sim.**
- A distância da boia já existe, é determinística e depende só do momento da soltura. Não é preciso nenhum gesto novo.
- **Ponto de atenção:** o medidor é um triângulo. Cada região tem uma **janela de tempo** diferente para soltar:

| Limites | Margem | Águas abertas | Águas profundas |
|---|---|---|---|
| **< 14 m / 14–22 m / ≥ 22 m** (= faixas de força 0–33 / 34–66 / 67–100) | 200–267 ms (quase impossível) **ou 1.333–1.867 ms** (534 ms, segurando o "vale") | 267–533 ms ou 1.067–1.333 ms (2 × 267 ms) | **533–1.067 ms** (534 ms, no "pico") |

- **Consequências:**
  - O **fundo é o alvo mais natural**: o pico do medidor, onde o instinto de "arremessar forte" já leva.
  - A **margem exige paciência**: esperar a força voltar a cair, ~1 s a mais de carga por arremesso. É um custo pequeno, que combina com "mais peixes, menores".
  - As **águas abertas** ficam nas subidas e descidas: duas janelas curtas, as mais difíceis de acertar de propósito.
- **[PROPOSTA]** Manter esses limites, alinhados às faixas de força que as animações CHARGE e CAST já usam. Assim, a pose de força alta coincide com águas profundas. A dificuldade de mirar nas águas abertas deve ser observada no teste físico (seção 9, risco R4).

---

## 2. Relação entre distância e região **[PROPOSTA]**

| Região | Distância da boia | Força do medidor | Animação CHARGE | Onde fica na tela (`distToY`) |
|---|---|---|---|---|
| **Margem** | 6 a < 14 m | 0–33 % | quadro 3 | Faixa de baixo da água, perto da margem |
| **Águas abertas** | 14 a < 22 m | 34–66 % | quadro 4 | Faixa do meio |
| **Águas profundas** | ≥ 22 m (até 30 m no arremesso) | 67–100 % | quadro 5 | Faixa de cima, a mais distante |

**Regras propostas:**
1. **A região é a da posição atual da boia.** É onde o jogador vê a boia.
   - Ao arremessar, vale a distância de pouso.
   - Ao recolher a linha vazia, a boia pode **passar para uma região mais próxima**; nunca para uma mais distante.
2. **Ao mudar de região durante o recolhimento, a espera que resta é reescalada, sem novo sorteio:**
   - fórmula: `restante × (média da nova região / média da antiga)`;
   - preserva a D4 (nada recomeça do zero) e impede trapaças, como "arremessar no pico e recolher até a margem para ter a espera curta com o peixe do fundo";
   - **ponto de decisão D-R2** (seção 11).
3. **O perfil e o peso do peixe são sorteados na fisgada, como hoje**, com a tabela da região em que a boia está naquele momento.
4. **A briga não muda de regra:** o peixe que leva linha para longe continua sendo o mesmo peixe.

---

## 3. Modelo das três regiões **[PROPOSTA]**

| | **Margem** | **Águas abertas** | **Águas profundas** |
|---|---|---|---|
| Fantasia | "Beliscada atrás de beliscada" | "O rio de sempre" | "Esperar o grandão" |
| Espera até a mordida | **Curta** | Igual à de hoje | **Longa** |
| Peixes | Pequenos, muitos rápidos | Mistura de hoje | Pesados, mais fortes |
| Briga | Curta (~10 s), fácil | Média (~18 s) | Longa (~35 s), exigente |
| Vence em… | **Quantidade** de peixes; pouco tempo parado; ritmo para iniciantes | **Segurança**: o melhor peso total para quem joga de forma descuidada; equilíbrio | **Peixe grande** e peso total para quem joga bem |
| Perde em… | Peso total, peixe grande | Não é a melhor em quantidade nem em troféu para quem joga bem | Quantidade; mais linhas rompidas para quem joga mal; muita espera |
| Custo de mirar | Segurar ~1,5 s (o "vale" do medidor) | Duas janelas curtas | O pico (natural) |

**Águas abertas = regras de hoje.** É a única decisão de "preservação" deste plano. Quem nunca mirar em lugar nenhum e arremessar a meia força joga exatamente o jogo que já foi validado. **[PROPOSTA]**

---

## 4. Tabela inicial de probabilidades **[PROPOSTA]**

Todos os valores são **iniciais**, para o primeiro teste. Cada linha corresponde a um campo que já existe na configuração do P1.

| Parâmetro | Margem | Águas abertas (= hoje) | Águas profundas |
|---|---|---|---|
| **Espera** (`waitMinMs`–`waitMaxMs`) | 2,0–5,0 s (média 3,5) | 2,5–8,0 s (média 5,25) | 6,0–12,0 s (média 9,0) |
| **1ª mordida após soltar** (voo + espera média) | ~4,0 s | ~6,0 s | ~9,8 s |
| **Perfil rápido** | **60 %** | 45 % | 10 % |
| **Perfil pesado** | 10 % | 25 % | **60 %** |
| **Perfil arisco** | 30 % | 30 % | 30 % |
| **Faixa de peso dentro do perfil** | 0–60 % da faixa | 0–100 % | 40–120 % (o fundo **passa** do máximo de hoje) |
| Rápido (kg) | 0,30–0,84 | 0,30–1,20 | 0,66–1,38 |
| Pesado (kg) | 2,0–4,4 | 2,0–6,0 | 3,6–6,8 |
| Arisco (kg) | 0,80–2,12 | 0,80–3,00 | 1,68–3,44 |
| **Força do peixe** (× `restPull`/`runPull`) | × 1,00 | × 1,00 | **× 1,25** |
| **Cansaço** (× `tireRate`) | × 1,00 | × 1,00 | × 0,85 (cansa mais devagar) |

- **Meta de ritmo do GDD (S3):** primeira mordida entre ~4 e ~12 s. O fundo fica no limite superior (6–12 s).
- **O arisco fica em 30 % nas três regiões,** de propósito: é o peixe "imprevisível" que aparece em qualquer lugar e mantém a surpresa.
- **Beliscadas (0–2) e janela de fisgada (1 s):** iguais em todas as regiões nesta primeira versão.

---

## 5. Impactos na experiência dos jogadores

### 5.1. Um jogador
- **A força do arremesso passa a ser uma decisão, não um reflexo.** Hoje o "certo" seria sempre o arremesso curto (seção 1.3). Com as regiões, cada faixa do medidor leva a um tipo de pescaria.
- **O ritmo muda conforme a região:**
  - margem ≈ **3,5 peixes por minuto**, com brigas curtas;
  - fundo ≈ **1,3 peixe por minuto**, com brigas de ~35 s e mais tensão;
  - as águas abertas mantêm o ritmo validado.
- **Leitura:** o jogador precisa **ver** em que região a boia caiu (etapa 2 do plano). Sem isso, a mecânica é invisível e parece sorte.

### 5.2. Os dois jogadores ao mesmo tempo
Base:
- cada metade tem a própria água, o próprio gerador aleatório e as mesmas regras (S7);
- nada do que um faz pausa o outro (S9).

| Situação | Efeito das regiões |
|---|---|
| **Igualdade** | As três regiões existem nas duas metades, com as mesmas tabelas. Nenhum lado tem vantagem. **[PROPOSTA]** |
| **Jogadores de níveis diferentes** (ex.: um mais atento) | O mais fraco tem o melhor peso total nas **águas abertas** (seção 6): pode competir escolhendo a região, sem o jogo "facilitar" para ele |
| **Placar atual** (capturas e maior peixe) | "Capturas" premia a margem e "maior peixe" premia o fundo. As duas estratégias aparecem lado a lado, o que é bom para a conversa entre os dois ("você só pega lambari!") |
| **Ritmos diferentes na mesma tela** | Um pode estar no fundo, esperando 10 s, enquanto o outro pega três peixes na margem. Isso é contraste e ajuda a contar a história, mas deve ser observado: quem espera não pode ficar entediado (risco R6) |
| **Disputa por oportunidades** | **Não existe hoje:** as águas são separadas e não há recurso compartilhado. Ela só aparece com mecânicas futuras, como pontos quentes ou cardumes (seção 8), e deve preservar a igualdade |

### 5.3. O que não muda
- Controles, cartões, animações, a fisgada, a tensão e os dois riscos (romper e escapar).
- Os personagens: as poses do CHARGE já correspondem às regiões, sem arte nova.

---

## 6. Cenários de balanceamento

**Método:** `node docs/estudos/simulacao-regioes.js recomendado`
- 30 sessões de 10 min por célula, com a **lógica real do P1** (só leitura);
- cada região é só uma configuração;
- arremesso no centro de cada região (10 m, 20 m e 27 m), já contando o tempo extra de carga da margem;
- o jogador pula o cartão depois de 0,9 a 2,2 s, conforme o estilo.

**Estilos simulados** (quando a tensão faz o jogador soltar e segurar; reação à mordida):
- **atento:** solta acima de 0,72, segura abaixo de 0,45; reage em ~300 ms;
- **médio:** solta acima de 0,82, segura abaixo de 0,35; reage em ~450 ms;
- **desleixado:** solta acima de 0,90, segura abaixo de 0,30;
- **reação lenta:** reage em ~850 ms;
- **muito desleixado:** solta acima de 0,97, segura abaixo de 0,25.

### 6.1. Modelo recomendado

| Estilo | Região | Peixes / 10 min | kg / 10 min | Maior (média) | Peixes ≥ 3 kg | Linhas rompidas | Briga média |
|---|---|---|---|---|---|---|---|
| atento | margem | **36,4** | 39,4 | 3,98 | 2,3 | 0 | 10 s |
| atento | abertas | 23,5 | 45,5 | 5,47 | 4,5 | 0 | 18 s |
| atento | profundas | 12,9 | **51,2** | **6,35** | **8,7** | 0 | 37 s |
| médio | margem | **34,7** | 37,6 | 3,76 | 2,1 | 0 | 10 s |
| médio | abertas | 22,8 | 45,2 | 5,41 | 5,0 | 0 | 19 s |
| médio | profundas | 12,7 | **50,9** | **6,46** | **8,7** | 0 | 37 s |
| reação lenta | margem | **28,3** | 30,9 | 3,58 | 1,4 | 0,1 (+10,8 mordidas perdidas) | 10 s |
| reação lenta | abertas | 19,5 | 35,5 | 5,15 | 3,6 | 0,1 (+7,8) | 18 s |
| reação lenta | profundas | 11,0 | **44,6** | **6,31** | **7,6** | 0,7 (+4,4) | 35 s |
| muito desleixado | margem | **29,7** | 28,3 | 3,49 | 1,7 | 6,3 | 9 s |
| muito desleixado | abertas | 20,5 | **33,9** | 5,07 | 3,6 | 4,9 | 15 s |
| muito desleixado | profundas | 8,4 | 28,1 | **5,40** | **5,4** | **12,4** | 17 s |

**Quem vence o quê (o princípio central):**

| Objetivo | Melhor região | Observação |
|---|---|---|
| Mais peixes | **Margem**, para todos os estilos | ~1,5× as águas abertas e ~2,7× o fundo |
| Peixe grande / troféu (≥ 3 kg, maior peixe) | **Fundo**, para todos os estilos | Inclusive para quem joga mal, mas à custa de muitas linhas rompidas |
| Peso total, jogador bom | **Fundo**, por ~+12 % | Custa metade dos peixes e brigas 2× mais longas |
| Peso total, jogador descuidado | **Águas abertas** | No fundo, rompe 12 linhas em 10 min |
| Ritmo e pouco tempo parado | **Margem** | Briga de ~10 s, mordida em ~4 s |
| "Jogo de sempre", sem pensar | **Águas abertas** | Idêntico ao P1 validado |

Nenhuma região vence em todas as linhas. A margem nunca vence em peso. O fundo nunca vence em quantidade nem é a melhor escolha para quem joga mal. As águas abertas não são a melhor em quantidade nem em troféu para quem joga bem, mas são a escolha mais segura.

### 6.2. Sensibilidade: o que acontece se uma alavanca sair

| Variação | Resultado (jogador médio, a menos que indicado) | Leitura |
|---|---|---|
| **Fundo sem peixe mais forte** (× 1,00) | Fundo com 62 kg contra 45 nas abertas, com briga de 27 s; o **muito desleixado** também vence no fundo (55 contra 34) | **O fundo vira a melhor região para todos.** A força extra é a alavanca principal |
| **Fundo com a espera de hoje** (2,5–8 s) | Fundo com 55 kg (+7 % sobre o recomendado); tempo esperando cai para 12 % | A espera mexe pouco; o tempo é dominado pela briga |
| **Fundo cansando no ritmo normal** (× 1,00) | Briga de 34 s (antes 37 s); fundo com 53 kg; o muito desleixado sobe para 40 kg no fundo e passa as abertas | Encurta pouco a briga e tira a vantagem das abertas para quem joga mal |
| **Regras de hoje em todas as distâncias** | Margem vence em tudo (seção 1.3) | É o estado atual |

### 6.3. Limites desta simulação
- **Jogadores virtuais não são pessoas.**
  - Eles leem a tensão exata: as perdas reais serão **maiores**, principalmente no fundo.
  - Não ficam entediados nem se distraem com o outro jogador.
- **Arremesso sempre no centro da região:** não mede a dificuldade de mirar (seção 1.4).
- **Não mede diversão.** Os números servem para **evitar uma região dominante óbvia** antes do teste físico, não para substituí-lo.

---

## 7. Riscos de alterar a experiência atual

| # | Risco | Gravidade | Mitigação proposta |
|---|---|---|---|
| R1 | **Quebrar o que já diverte**: o P1 foi validado em sessões de ~30 min | Alta | Águas abertas = regras de hoje; **liga/desliga no menu** para comparar na mesma sessão; nada muda nos controles |
| R2 | **Região invisível**: o jogador não percebe a regra e acha que é sorte | Alta | Etapa 2: faixas discretas na água desenhadas pelo código (sem arte nova), o alvo da carga com a cor da região e o nome da região no pouso |
| R3 | **Brigas longas demais no fundo** (~35 s, no celular, segurando e soltando) | Média | Validar no teste físico. Se cansar: reduzir a força extra do fundo (× 1,15) **e** compensar com espera maior ou peso um pouco menor (a simulação mostra o efeito) |
| R4 | **Mirar nas águas abertas é difícil** (duas janelas de 267 ms) | Média | Observar a distribuição real das solturas (etapa 1). Se necessário, alargar a faixa do meio (ex.: 13–23 m) |
| R5 | **Uma estratégia dominante para o placar atual** (ex.: só margem para "capturas") | Média | O placar já mostra "maior peixe". Objetivos de partida (mais kg, maior peixe) são um tema futuro, fora desta missão |
| R6 | **Tédio de quem espera no fundo** enquanto o outro pesca sem parar | Baixa/média | Espera máxima de 12 s (meta S3); beliscadas continuam; observar no teste |
| R7 | **Truque de recolher a linha** (arremessar no pico e recolher até a margem) | Baixa | Regra de reescala da espera (seção 2, regra 2) |
| R8 | **Peso acima de 6 kg** no fundo: o desenho do peixe no cartão e na mão só cresce até 6 kg | Baixa | Aceitar na primeira versão; ajustar a escala visual depois (sem arte nova) |
| R9 | **Simulação otimista** (robôs não perdem peixes por linha frouxa) | Média | Medir as perdas reais por região no relatório do protótipo |

### 7.1. Riscos técnicos
| # | Risco | Mitigação |
|---|---|---|
| T1 | **Mexer na lógica do P1**, a referência validada: a região precisa ser lida em dois pontos (`_scheduleBite` e `_hook`) e na reescala do recolhimento | Duas opções (decisão D-R4, seção 11): **(a)** configuração opcional `regioes` no P1, que com `null` deixa o comportamento **byte a byte igual** e mantém os 53 testes e a simulação idênticos; **(b)** um protótipo novo (como `p1-personagens`), sem tocar no P1 |
| T2 | **Sequência do sorteio** (testes com semente fixa) | Fazer **exatamente as mesmas chamadas** ao gerador aleatório, só com tabelas diferentes. Com as regiões desligadas, a sequência fica idêntica |
| T3 | **Máquina de estados** | **Não muda**: os mesmos estados e transições. As regiões só mudam parâmetros sorteados |
| T4 | **Controles multitouch / TouchRouter** | **Não mudam** |
| T5 | **Animações** | **Não mudam.** As faixas do CHARGE e do CAST já coincidem com as regiões |
| T6 | **Fronteira exata** (13,99 m × 14,00 m) | Usar a mesma regra de arredondamento das faixas de força das animações (percentual inteiro), testada nos limites |
| T7 | **Recolher atravessando duas regiões** | Reescalar a cada travessia; teste próprio |

---

## 8. Mecânicas futuras (estudo preliminar, nenhuma para agora) **[PROPOSTA]**

| Mecânica | Ideia | Pré-requisito | Como preservar a igualdade entre os dois | Risco principal |
|---|---|---|---|---|
| **Pontos quentes temporários** | Por 15–30 s, uma faixa de distância de uma região tem espera menor ou peixe melhor | Regiões visíveis (etapa 2) | Aparecem **nas duas metades ao mesmo tempo**, na mesma distância | Virar "corrida de reflexo" e tirar a calma da pescaria |
| **Cardumes móveis** | Uma mancha que atravessa as regiões; a boia dentro dela tem mais mordidas | Pontos quentes | Mesmo trajeto espelhado nas duas metades | Exigir olhar para a água o tempo todo, junto com a tensão |
| **Sombras, bolhas e ondulações** | Pistas visuais de que ali há peixe bom | Regiões e pontos quentes | Mesmas pistas nos dois lados | Precisam de desenho; **não criar arte nova sem missão** |
| **Obstáculos submersos** | Galho ou pedra numa faixa: mais chance de romper a linha e peixe maior | Regiões; teste de tensão | Iguais nos dois lados | Punição que parece injusta |
| **Clima e horário** | Mudam as tabelas (ex.: fim de tarde: fundo melhor) | Regiões balanceadas | Globais | Multiplica o balanceamento (3 regiões × N climas) |
| **Disputa entre jogadores** | Um ponto quente que **o primeiro a fisgar consome** nas duas metades | Pontos quentes | A oportunidade é a mesma; vence quem age primeiro | Frustração e a regra S9 ("nada pausa o outro") |

**Ordem sugerida:** pontos quentes → pistas → cardumes → disputa. Clima e obstáculos ficam por último. Nenhuma delas deve entrar antes de as três regiões estáticas serem testadas com pessoas.

---

## 9. Plano de implementação por etapas **[PROPOSTA]**

Cada etapa é pequena, testável e reversível, e **só começa com aprovação**.

| Etapa | O que faz | Muda o jogo? | Como testar | Critério para seguir |
|---|---|---|---|---|
| **1. Medir** | Registrar no relatório e no diagnóstico a distância de pouso e a **região** de cada arremesso, além de onde cada captura ou perda aconteceu | **Não**: só registro | Testes do P1 iguais; a região registrada confere com a distância nos limites (13,9 / 14,0 / 21,9 / 22,0 m) | Saber como as pessoas **já** arremessam hoje (risco R4) |
| **2. Mostrar** | Faixas discretas na água desenhadas pelo código, alvo da carga com a cor da região e nome da região no pouso (ex.: "ÁGUAS PROFUNDAS") | Só o visual; a lógica não muda | e2e: a faixa e o rótulo batem com a distância; nenhum arquivo de arte novo | O criador entende a região sem explicação |
| **3. Ligar as regiões** | Tabela da seção 4, com **liga/desliga no menu** (desligado = o P1 de hoje) e regra de reescala no recolhimento | Sim, só quando ligado | Desligado: os 53 testes e a simulação **idênticos**. Ligado: testes novos de sorteio por região, limites, reescala, igualdade das metades e sequência do sorteio | Sessões do criador com o sistema ligado e desligado |
| **4. Calibrar** | Ajustar a tabela com o relatório real: capturas, perdas e duração das brigas por região | Só números | A simulação reproduz a nova tabela; o princípio central continua valendo | Nenhuma região dominante nos dados reais |
| **5. Estudar o futuro** | Escolher a primeira mecânica da seção 8 (sugestão: pontos quentes) em uma nova missão de planejamento | — | — | — |

**Fora deste plano:** novos controles, arte nova, mudança na máquina de estados, mudança nas animações e objetivos de partida.

---

## 10. Como medir no teste físico (etapa 3)
- Sessões de ~30 min, como as anteriores: metade com as regiões **ligadas**, metade **desligadas**.
- **Registrar por região:**
  - arremessos;
  - capturas, rompimentos e fugas;
  - duração das brigas;
  - maior peixe.
- **Perguntas para o criador e para o outro jogador:**
  - Você escolheu onde arremessar? Por quê?
  - Alguma região pareceu "a certa" sempre?
  - A briga no fundo cansou?
  - Esperar no fundo foi chato com o outro pescando?
- **Sinal de alerta:** mais de 70 % dos arremessos de um jogador em uma só região, depois dos primeiros 10 minutos. Isso indica uma região dominante.

---

## 11. Decisões para a direção criativa

| # | Decisão | Recomendação deste estudo |
|---|---|---|
| D-R1 | Limites das regiões | **< 14 m / 14–22 m / ≥ 22 m**, alinhados às faixas de força existentes |
| D-R2 | Região pela posição **atual** da boia ou só pelo **pouso** | **Posição atual**, com reescala da espera ao recolher (seção 2) |
| D-R3 | Águas abertas iguais ao jogo de hoje | **Sim**, para preservar a experiência validada |
| D-R4 | Onde implementar: configuração opcional no P1 ou protótipo novo | Configuração opcional **desligada por padrão**, com prova de igualdade (testes e simulação idênticos); ou protótipo novo, se o P1 deve ficar congelado |
| D-R5 | Peixe do fundo mais forte (× 1,25) e acima do peso máximo de hoje (até 120 % da faixa) | **Sim**: sem isso, o fundo domina (seção 6.2) |
| D-R6 | Tabela inicial (seção 4) | Usar como ponto de partida e calibrar na etapa 4 |
| D-R7 | Ordem das etapas (seção 9) | Começar pela etapa 1 (só medir) |

Nada neste documento está aprovado. Cada item permanece **[PROPOSTA]** até a decisão do criador.
