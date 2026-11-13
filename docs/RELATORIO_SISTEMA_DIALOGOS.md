# Relatório — Sistema de diálogos, personalidades e Sirius

**Operação:** "A alma do jogo" · **Data:** 12/11/2026
**Status:** implementado e testado. **Aguardando a avaliação do criador:** nada aqui foi aprovado automaticamente. Os itens marcados **[DECISÃO]** foram decididos por mim durante a missão e podem ser mudados.

---

## 1. Resumo

- **Camada de narrativa nova** (`jogo/src/narrativa/`):
  - observa os eventos reais da pescaria e decide quem fala, o quê e quando;
  - substitui o sistema de diálogos da Operação Madrugada.
- **387 cenas e 722 falas**, num formato de dados separado da lógica:
  - 264 do ALE, 242 do Alemão e 168 da Maria;
  - 48 entradas de balbucio do Sirius, sorteadas na hora entre 56 balbucios prontos e um gerador de sílabas de bebê.
- **Todas as categorias pedidas** (A a I) estão implementadas e aparecem de verdade em partidas simuladas.
- **Maria** comenta, mas não pesca.
- **Sirius** é um bebê de cerca de 2 meses:
  - só balbucia, e os adultos interpretam;
  - de vez em quando chora, e a Maria para de comentar a pescaria para cuidar dele;
  - também dorme, e dormindo não balbucia nem chora.
- **Prioridades e tempos mínimos:**
  - uma fala por vez;
  - nenhuma repetição seguida;
  - nenhuma fila de comentários atrasados;
  - acontecimentos importantes interrompem conversas.
- **Interface:**
  - caixa de diálogo central com retratos de expressão tirados das folhas do criador;
  - **cantinho da família** na margem: Maria e Sirius sobre uma manta, com um ícone do estado do bebê.
- **Vozes 8-bit** sintetizadas na hora (sem gravações e sem arquivos de áudio), com volume e liga/desliga próprios.
- **A pescaria não muda.** Um teste roda a mesma partida com e sem o narrador e compara registros e estatísticas: são idênticos.
- **Testes:**
  - todos os testes desta missão passam, assim como a regressão do jogo e do P1 (seção 12);
  - nos protótipos aparecem só falhas antigas, sem relação com esta missão: as 3 do P0 e uma oscilação no item "Piscar" do P1 com personagens (seção 12.4);
  - os 234 arquivos protegidos estão intactos, com hash idêntico.
- **Commit:** nenhum foi feito.

---

## 2. Como abrir e testar

A abertura não mudou:
1. Dois cliques em **`iniciar-jogo.bat`**. Ou, num terminal na pasta do projeto:
   ```
   py -m http.server 8765 --bind 0.0.0.0
   ```
2. Abra **http://localhost:8765/jogo/**.
   - No celular, na mesma rede Wi-Fi: **http://IP-DO-COMPUTADOR:8765/jogo/**.
   - O áudio só começa depois do primeiro toque (regra dos navegadores).

**O que observar:**
- **2 JOGADORES:**
  - arremessos curtos ou longos;
  - a primeira vez em cada região e com cada isca;
  - mordidas, brigas, capturas, fugas e linhas rompidas.
  - A **disputa** aparece quando um passa o outro, empata ou dispara no placar.
- **1 JOGADOR:** quem não pesca assiste e comenta. Se o ALE pesca, o Alemão assiste, e vice-versa.
- **Conversas soltas:**
  - a família puxa assunto depois de 40 a 70 s sem falas;
  - também de tempos em tempos, a cada 110 a 160 s;
  - muitas conversas incluem o Sirius.
- **Choro:**
  - nunca nos primeiros 75 s de partida;
  - depois, chance baixa e pelo menos 4 min entre um choro e outro;
  - por isso pode levar alguns minutos para aparecer.
- **Sono:** o Sirius cochila depois de 100 a 200 s acordado. O cantinho mostra "z Z".
- **OPÇÕES → Vozes:** volume e liga/desliga. Na pausa há o atalho "Vozes".

**Para ver o choro ou o sono na hora** (só para avaliação): durante a partida, abra o console do navegador (F12) e digite:
```
HF.app.partida.narrador.forcarSirius('choro')      // também: 'dormindo' ou 'acordado'
```

---

## 3. Como funciona

```
FishingSession (P1, intocada) ─ eventos ─► CenaPartida ─► Narrador.evento(e, players)
CenaPartida.update() ─────────────────────────────────► Narrador.atualizar(dt, players)   (dt = 0 na pausa)
Narrador.linha()     ─► desenharDialogo()   caixa central: retrato, nome, texto letra a letra
Narrador.familia()   ─► desenharFamilia()   Maria e Sirius na margem + ícone do estado do bebê
Narrador.tirarSons() ─► AudioJogo.narrativa()  balbucio, choro e bipes das falas
```

- **Só leitura:**
  - o Narrador recebe os mesmos eventos que a sessão do P1 já emitia e lê o estado dos pescadores;
  - não chama nada que altere a pescaria;
  - usa um sorteio próprio, separado do sorteio da pesca.
- **Conteúdo separado da lógica:**
  - o texto fica em `src/narrativa/falas/*.js` e o formato em `Falas.js`;
  - para acrescentar, trocar ou cortar uma fala, basta editar o arquivo de dados, sem mexer na lógica.
- **Formato de uma cena:**

  | Campo | Significado |
  |---|---|
  | `g` | gatilho |
  | `q` | condições |
  | `f` | falas: quem, texto e emoção |
  | `p` | prioridade |
  | `w` | peso no sorteio |
  | `m` | modo: só 1 ou só 2 jogadores |
  | `e` | estado exigido; por exemplo, a cena só continua enquanto a briga durar |
  | `c` | cena de choro |

- **Marcadores no texto:**

  | Marcador | Vira |
  |---|---|
  | `{peixe}` | nome do peixe |
  | `{kg}` | peso |
  | `{m}` | metros do arremesso |
  | `{isca}` | isca |
  | `{regiao}` | região |
  | `{placar}` | placar |
  | `{um}`, `{o}` | artigo pelo gênero do peixe |
  | `{vocS}`, `{vocO}` | como a Maria chama quem pescou ("Lucas" ou "pai") |
  | `{balbucio:humor}` | balbucio sorteado na hora |

- **O que o Narrador sabe:**
  - quem pesca e o estado de cada um;
  - região e isca;
  - peso e tamanho relativo do peixe;
  - espécie nova e recorde, que vêm do catálogo;
  - sequências, falhas repetidas, placar e quem lidera;
  - tempo de espera e tempo sem capturas;
  - estado do Sirius.

---

## 4. Categorias implementadas

| Grupo da missão | Gatilhos (acontecimentos reais) | Cenas | Falas |
|---|---|---:|---:|
| **A — Espontâneas** | 40–70 s sem falas; "conversa devida" a cada 110–160 s | 51 | 138 |
| **B — Espera** | espera longa (9 s); beliscada; ansioso (3 toques antes da hora); seca geral (100 s sem capturas); "demorando" (2P: 90 s sem pegar enquanto o outro pegou 2 ou mais) | 39 | 69 |
| **C — Arremesso** | curto (< 9 m), longo (≥ 26,5 m), perfeito, superou o do outro, 3 vezes no mesmo lugar; arremesso fraco (toque curto) | 25 | 38 |
| **D — Mordida** | mordida; fisgada (reação rápida, normal ou lenta) | 18 | 20 |
| **E — Briga** | arrancada; tensão no vermelho; linha frouxa (1,2 s); briga longa (25 s); peixe grande na linha (≥ 3,5 kg) | 35 | 42 |
| **F — Capturas** | pequeno, médio, grande, excepcional; espécie nova; rara; recorde; recorde pessoal; sequência; objetos estranhos | 111 | 215 |
| **G — Fracassos** | fuga; linha rompida (com versões para peixe grande e para erros repetidos); fisgada perdida; recolher vazio | 58 | 108 |
| **H — Disputa (2P)** | virou o placar; gangorra; empate; disparou; peixe muito maior; o outro acabou de falhar; capturas quase juntas | 18 | 37 |
| **I — Regiões e iscas** | primeira vez em cada região; primeira isca diferente da minhoca | 18 | 23 |
| **Sirius** | inquieto, chorando, acalmando, acalmou (dormiu ou não), dormiu, acordou | 32 | 69 |
| **Total** | | **387** | **722** |

Observações:
- As 18 cenas de disputa (H) estão dentro das capturas (F). Elas não entram duas vezes no total.
- Há ainda 7 cenas de "demorando", que estão em B.
- **Tamanho do peixe:**
  - excepcional: 6 kg ou mais, ou acima do peso máximo normal da espécie com pelo menos 1,5 kg;
  - grande: 3 kg ou mais, ou no quarto superior da faixa da espécie com pelo menos 1 kg;
  - pequeno: menos de 0,5 kg, ou nos 30% inferiores da faixa;
  - médio: o resto.
- **Modo:**
  - 316 cenas valem nos dois modos;
  - 50 são só do modo de 2 jogadores: disputa e provocações diretas;
  - 21 são só do modo de 1 jogador: quem assiste comenta.
- **Tamanho das cenas:**
  - 139 têm uma fala;
  - 200 têm duas pessoas, 38 têm três e 10 têm as quatro.
- **Tamanho das falas:** média de 28 caracteres, máximo de 60 (curtas, para não atrapalhar a ação, como pede o GDD).
- **Reações ao Sirius dormindo:**
  - 5 cenas reagem a ele dormindo (por exemplo, a Maria pedindo silêncio numa comemoração);
  - 29 exigem que ele esteja acordado.

---

## 5. Falas por personagem e categoria

Contagem feita pelo teste `narrativa.test.js` sobre os próprios arquivos de dados:

| Personagem | Captura | Fracasso | Arremesso, região e isca | Espera | Mordida e briga | Conversas | Sirius (choro e sono) | **Total** |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Alemão (Lucas) | 78 | 41 | 21 | 22 | 20 | 47 | 13 | **242** |
| ALE | 85 | 44 | 25 | 28 | 20 | 51 | 11 | **264** |
| Maria | 42 | 17 | 15 | 18 | 20 | 30 | 26 | **168** |
| Sirius (balbucios) | 10 | 6 | 0 | 1 | 2 | 10 | 19 | **48** |

- **Mínimo de 15 falas por categoria principal:** cumprido pelo Alemão, pelo ALE e pela Maria em todas as categorias. O menor número é 15, da Maria em arremesso, região e isca.
- **Os 48 balbucios do Sirius são "vagas":** cada `{balbucio:humor}` é sorteado na hora entre 56 balbucios prontos e o gerador de sílabas (seção 7.3). Por isso o mesmo momento soa diferente a cada vez.
- **Por grupo da missão:**

  | Grupo | Alemão | ALE | Maria | Sirius |
  |---|---:|---:|---:|---:|
  | A Espontâneas | 47 | 51 | 30 | 10 |
  | B Espera | 22 | 28 | 18 | 1 |
  | C Arremesso | 14 | 16 | 8 | 0 |
  | D Mordida | 6 | 7 | 6 | 1 |
  | E Briga | 14 | 13 | 14 | 1 |
  | F Capturas | 78 | 85 | 42 | 10 |
  | G Fracassos | 41 | 44 | 17 | 6 |
  | H Disputa (dentro de F) | 12 | 16 | 8 | 1 |
  | I Regiões e iscas | 7 | 9 | 7 | 0 |
  | Sirius (estados) | 13 | 11 | 26 | 19 |

---

## 6. Prioridades e tempos mínimos (cooldowns)

### 6.1 Prioridades (1 = mais importante)

| Prioridade | O que é | Cenas |
|---|---|---:|
| 1 | Choro do Sirius (inquieto, chorando, acalmando) | 16 |
| 2 | Captura excepcional, espécie nova, rara ou recorde; Sirius acalmou | 34 |
| 3 | Captura grande; fuga, linha rompida, fisgada perdida | 65 |
| 4 | Disputa (2P), recorde pessoal, sequência, objetos estranhos | 37 |
| 5 | Comentários do momento: arremesso, região, isca, espera, mordida, briga, capturas comuns, recolher vazio, sono do Sirius | 184 |
| 6 | Conversas espontâneas | 51 |

### 6.2 Como uma fala nasce

**1. Acontece algo real:** um evento da sessão ou um tempo que passou.

**2. Chance de comentar.** Nem todo acontecimento rende fala.

| Acontecimento | Chance |
|---|---|
| Captura pequena | 25% |
| Captura média | 30% |
| Captura grande | 90% |
| Captura excepcional | 100% |
| Espécie nova, recorde, rara, virada, peixe muito maior, gangorra ou sequência de 3 | 100% |
| Empate, disparada, outro acabou de falhar, capturas quase juntas | pelo menos 80% |
| Fuga | 70% |
| Linha rompida | 80% |
| Fuga ou linha rompida com peixe grande, ou em erros repetidos | 100% |
| Fisgada perdida | 55% |
| Recolher vazio | 35% |
| Arremesso | 45% |
| Arremesso fraco | 60% |
| Região nova | 60% |
| Isca nova | 50% |
| Beliscada | 20% |
| Ansioso | 85% |
| Espera longa | 50% |
| "Demorando" | 75% |
| Seca | 100% |
| Mordida, fisgada, arrancada | 20% cada |
| Briga tensa | 50% |
| Linha frouxa | 40% |
| Briga longa | 50% |
| Peixe grande na linha | 70% |
| Objeto estranho | 95% |
| Estados do Sirius | 100% |
| Sirius dormiu | 50% |
| Sirius acordou | 60% |

**3. Candidatas:**
- entram as cenas do gatilho cujas condições batem com o momento: modo, quem pesca, tamanho, estado do Sirius, Maria ocupada e assim por diante;
- delas ficam só as de prioridade mais alta;
- o sorteio entre elas respeita os pesos.

**4. Sem repetição:**
- a mesma cena não volta antes de **5 min**;
- nenhuma das **últimas 40 frases** se repete;
- se todas as opções já foram usadas, vale a mais antiga, nunca a mesma da vez anterior.

**5. Liberação**, isto é, se a cena pode começar agora:
- **intervalo desde o fim da última cena**, conforme a prioridade:

  | Prioridade | 1 | 2 | 3 | 4 | 5 | 6 |
  |---|---|---|---|---|---|---|
  | Intervalo | 0 s | 0,4 s | 2 s | 4 s | 9 s | 8 s |

- **por categoria** (vale para as prioridades 3 a 6):

  | Categoria | Intervalo mínimo |
  |---|---|
  | Arremesso | 20 s |
  | Região | 40 s |
  | Isca | 60 s |
  | Espera | 25 s |
  | Mordida | 12 s |
  | Briga | 14 s |
  | Fracasso | 3 s |
  | Conversa | 30 s |
  | Sono do Sirius | 60 s |
  | Captura e choro | sem limite |

- **por personagem que abre a cena** (prioridades 3 a 6):

  | Personagem | Intervalo mínimo |
  |---|---|
  | Alemão | 5 s |
  | ALE | 7 s |
  | Maria | 12 s |
  | Sirius | 25 s |

- **ritmo máximo:** no máximo **7 falas por minuto** (prioridades 3 a 6).

**6. Interrupção:**
- se alguém já está falando, uma cena de prioridade 1 a 3 mais importante que a atual **corta a fala e começa na hora**;
- para isso, quem abre a cena nova precisa estar livre;
- o choro (prioridade 1) nunca é cortado.

**7. Sem fila:**
- o que não pode começar na hora some;
- só cenas de prioridade 1 a 3 podem esperar, e no máximo **uma** fica pendente;
- a pendente expira em **2,5 s**, então nada é comentado atrasado.

**8. Coerência durante a cena:**
- uma cena de briga termina se a briga acabar;
- se o Sirius começa a chorar, a cena em andamento termina quando chega a vez da Maria, porque ela foi cuidar dele.

### 6.3 Conversas espontâneas
- **Silêncio:** depois de 40 a 70 s sem nenhuma fala, alguém puxa assunto.
- **"Conversa devida":**
  - a primeira conversa vem entre 50 e 80 s de partida;
  - depois, uma a cada 110 a 160 s, mesmo com a pescaria agitada;
  - se não der certo na hora, tenta de novo em 15 a 30 s.
- **Mordida:** a conversa é adiada em 4 a 8 s.
- **Briga:** só conversas curtas, de até 2 falas.

### 6.4 Tempo de cada fala
| Tipo | Tempo |
|---|---|
| Revelação do texto | 30 ms por letra |
| Fala na tela | 1,9 a 4,6 s (1 s + 62 ms por letra) |
| Balbucio | 1,5 s |
| Choro | 1,9 s |
| Pausa entre as falas de uma cena | 0,22 s |

Na **pausa** do jogo, o tempo da narrativa para: o texto congela e volta de onde estava.

### 6.5 Ritmo medido

**Como foi medido:** partidas simuladas de 30 minutos com a lógica real da pesca e o Narrador real.
- Os pescadores são robôs que pescam sem parar.
- Foram 6 sorteios diferentes com 2 jogadores e 3 com 1 jogador.

**2 jogadores:**

| Medida | Faixa (média) |
|---|---|
| Cenas por minuto | 3,1–3,3 (3,2) |
| Falas por minuto | 5,7–5,9 (5,8) |
| Tempo com a caixa de diálogo na tela | 24–25% |
| Conversas espontâneas em 30 min | 10–13 (cerca de uma a cada 2,6 min) |
| Balbucios do Sirius em 30 min (fora o choro) | 7–12 |
| Choros em 30 min | 2–5 (média 3,8) |
| Primeiro choro | entre 82 s e 520 s de partida |
| Intervalo entre choros | 262 s a 604 s (nunca menos de 4 min) |
| Tempo com o Sirius dormindo | 31–39% |
| Divisão das falas | ALE 35% · Alemão 31% · Maria 27% · Sirius 8% |
| Falas da Maria fora das cenas de choro enquanto ele chorava | 0 (em todas as partidas) |

**1 jogador** (Alemão pescando, ALE assistindo):
- 2,5–2,6 cenas e 4,6–4,9 falas por minuto;
- caixa na tela em 21–22% do tempo;
- 12–13 conversas em 30 min.

**Ressalvas:**
- Os robôs quase não erram (0 ou 1 fracasso em 30 min), então esta medição quase não mostra comentários de fracasso. Esses são testados à parte em `narrativa.test.js`.
- A simulação não usa o catálogo (espécie nova e recorde). Numa partida real, os primeiros minutos tendem a ter mais comentários.

---

## 7. Sirius

### 7.1 Regras do cânone
- **Quem é:**
  - filho de Maria e Lucas e neto materno de ALE;
  - um bebê de cerca de 2 meses.
- **Como se manifesta:**
  - **não fala**, só faz vocalizações de bebê em 8-bit;
  - os adultos interpretam o que ele "disse", com humor.
- **Como é chamado:** todos o chamam de **Sirius**, sem apelidos.
- **Na pescaria:** não altera nada. É o caso "só narrativo" do GDD (seção 3.8, opção A).

### 7.2 Estados

| Estado | Duração | O que acontece |
|---|---|---|
| Acordado | 100–200 s | Pode balbuciar, no máximo uma vez a cada 25 s fora do choro. Pode ficar inquieto. |
| Inquieto | 2,5 s | Resmungo de protesto ("NHÉÉ!", "MNHÁ!"); um adulto percebe ("Ih... conheço esse som."); ícone "!" |
| Chorando | 6–8,5 s | Choro 8-bit, caixa rosada que treme, lágrimas e ícone "!!"; a Maria cuida dele |
| Acalmando | 2,5–4 s | A Maria termina de acalmar ("Shhh... pronto. Passou."); ícone "…" |
| Dormindo | 70–140 s | Sem balbucio e sem choro; ícone "z Z" animado; retrato mais apagado |

**Depois do choro:** em 55% das vezes ele adormece; nas outras, volta acordado.

### 7.3 Vocalizações
- **56 balbucios prontos em 7 humores:**

  | Humor | Quantidade | Exemplos |
  |---|---:|---|
  | Feliz | 16 | AGU!, DAAA!, BA BA!, GUGU!, HIII! |
  | Curioso | 12 | GUH?, AH?, GU-GU?, NGÁ? |
  | Protesto | 8 | NHÉÉ!, MNHÁ!, HNNN! |
  | Surpresa | 6 | OOO!, OH!, BOH! |
  | Sono | 4 | MMM..., HUUM... |
  | Bobo | 5 | PFFFT!, BRRR!, BLBLBL! |
  | Choro | 5 | BUÁÁÁ!, UÁÁ! UÁÁ! |

- **Variações montadas:** em 30% das vezes, os humores feliz e curioso usam 1 a 3 das 14 sílabas de bebê (A, BA, BU, DA, GU, GA, MA, NHÉ, É, U, O, BÁ, GÁ, DÊ).
- **Verificação:** os testes conferem que nenhuma fala do Sirius contém palavra de adulto. Valem todas as listas e 200 sorteios por humor.
- **Interpretações dos adultos** (exemplos reais dos dados):
  - **Sirius:** "GUH?" · **ALE:** "Ele perguntou se a gente vai pegar alguma coisa hoje." · **Alemão:** "Fala pra ele que sim." · **Maria:** "Ninguém aqui mente pro Sirius."
  - **Sirius:** "AGU!" · **Alemão:** "Ele tá narrando a pescaria!" · **ALE:** "E tá narrando melhor que você pesca."
  - **Alemão:** "Sirius! Olha isso!" · **Sirius:** "OOO!" · **ALE:** "Ele ficou sem palavras." · **Maria:** "Ele sempre fica sem palavras, pai."

### 7.4 Choro
- **Sequência:** inquieto → chorando → acalmando → adormece (55%) ou volta acordado (45%).
- **Frequência:**
  - **nunca nos primeiros 75 s**;
  - chance de 32% por minuto acordado;
  - **no mínimo 4 min** entre o fim de um choro e o começo do próximo;
  - o episódio inteiro dura de 11 a 15 s;
  - **na prática:** cerca de um choro a cada 8 min de partida (2 a 5 em 30 min, seção 6.5).
- **Barulho:**
  - comemorações de peixe excepcional ou raro, de peixe grande e a linha arrebentando podem deixá-lo inquieto (12% × intensidade);
  - as regras de frequência acima continuam valendo.
- **Maria durante o choro:**
  - nenhuma cena comum com ela começa;
  - se uma conversa chega numa fala dela, a cena termina;
  - ela só fala nas cenas de choro, cuidando dele;
  - os pescadores continuam pescando e comentando normalmente.
- **Som:**
  - lamentos 8-bit sintetizados, com 3 notas e vibrato;
  - no máximo 3 por episódio, um a cada 2,6 s;
  - nenhuma gravação.
- **Imagem:**
  - caixa rosada que treme;
  - lágrimas na caixa e no cantinho;
  - Sirius tremendo e "!!" no cantinho;
  - retrato da Maria preocupada.
- **Cenas:** 24 cenas de choro, entre o próprio choro e o "acalmou".
  - **Sirius:** "BUÁÁÁ!" · **Maria:** "Opa, opa... vem cá, Sirius." · **Alemão:** "Quer ajuda?" · **Maria:** "Pode deixar. Pesca aí."

### 7.5 Sono
- **Ciclo:** cochila depois de 100 a 200 s acordado e dorme de 70 a 140 s.
- **Dormindo:**
  - nenhum balbucio e nenhum choro, ambos verificados por teste;
  - ícone "z", "z Z", "z Z z" animado;
  - retrato apagado.
- **Barulho pode acordá-lo**, com chance de 25% × intensidade:

  | Barulho | Intensidade |
  |---|---|
  | Peixe excepcional ou raro | 1 |
  | Peixe grande | 0,5 |
  | Linha rompida | 0,4 |

- **Comemoração com ele dormindo:**
  - **Alemão:** "OLHA ISSO!" · **Maria:** "Lucas! Baixinho! O Sirius tá dormindo." · **Alemão:** "(olha isso...)"

---

## 8. Interface

### Caixa de diálogo
- **Posição:**
  - no centro, sobre a água, entre as colunas das boias e acima da margem;
  - no modo de 1 jogador, fica um pouco à esquerda do centro, ao lado do cartão.
- **Conteúdo:**
  - retrato com expressão;
  - nome na cor do personagem;
  - texto que aparece letra a letra;
  - ponteiro para quem fala: os pescadores para o seu lado; Maria, Sirius e quem só assiste (no modo de 1 jogador) para a margem;
  - um pulinho quando troca quem fala.
- **Estilos:**
  - **fala:** fundo azul-escuro e borda creme;
  - **balbucio:** azul-claro, letras grandes, "(balbuciando)";
  - **choro:** rosado, tremendo, "(chorando)", com lágrimas.

### Retratos de expressão
Recortados na memória das folhas do criador; os arquivos não são alterados.

| Folha | Expressões usadas |
|---|---|
| `alemao rosto.jpg` | sério, rindo, preocupado, bravo, surpreso |
| `Pai rosto.jpg` (ALE) | neutro, surpreso, irritado, gargalhada, frustrado |
| `Maria e Sirius.jpg` (Maria) | feliz, surpresa, preocupada, séria |
| `Maria e Sirius.jpg` (Sirius) | enrolado na manta azul; sorrindo, com o mesmo macacão bege |

Cada fala indica uma emoção, convertida para o retrato mais próximo pela tabela em `Recortes.js`.

### Cantinho da família
- **Posição:** manta xadrez na margem, com os retratos e os nomes da Maria e do Sirius.
- **Maria:** fica preocupada durante o choro.
- **Sirius:**
  - sorri quando balbucia;
  - treme no choro;
  - fica apagado quando dorme.
- **Ícones:** ♪ balbuciando · ! inquieto · !! chorando · … acalmando · z Z dormindo.

### Telas verificadas
| Modo | Resoluções |
|---|---|
| 2 jogadores | 640×360, 844×390, 1024×768 |
| 1 jogador | 844×390, 640×360 |

Em todas, a caixa e o cantinho não cobrem cartões, boias, personagens nem medidores, e não se cobrem entre si. Isso atende ao GDD: "os balões de fala de Maria e Sirius não podem cobrir os elementos de jogo".

---

## 9. Áudio
- **Sem arquivos e sem gravações:** tudo é sintetizado na hora (WebAudio), como a trilha e os efeitos da Madrugada.
- **Balbucio:**
  - uma nota curta por sílaba, em onda quadrada com filtro;
  - sobe no "?" e tem acento no "!";
  - vibrato nas vogais longas;
  - "PFFFT" e "BRRR" viram ruído.
- **Choro:** três lamentos com vibrato.
- **Falas dos adultos:** bipes enquanto o texto aparece, com timbre próprio:

  | Personagem | Onda | Frequência |
  |---|---|---|
  | Alemão | quadrada | 205 Hz |
  | ALE | triangular, mais grave | 150 Hz |
  | Maria | triangular | 330 Hz |

- **Canal "Vozes" separado:**
  - volume (padrão 70%) e liga/desliga em OPÇÕES;
  - atalho na pausa;
  - respeita o volume geral;
  - fica salvo no navegador.
- **Silêncio:** com vozes desligadas ou volume zero, nenhum som de voz é tocado (verificado no navegador).

---

## 10. Cânone e decisões

- **[CÂNONE]** Regras de tratamento e de papel, todas verificadas por testes automáticos em todas as falas:
  - Maria chama o Alemão de "Lucas" e o ALE de "pai";
  - ALE chama o Lucas de "Alemão";
  - todos chamam o bebê de "Sirius";
  - Maria não pesca;
  - Sirius só balbucia.
- **[DECISÃO] Como o Lucas chama o ALE e a Maria:**
  - o GDD ainda não define, então o Lucas **não chama** o ALE nem a Maria por nenhum nome;
  - o teste proíbe "ALE", "Maria", "sogro", "amor" e "vovô" na boca dele;
  - quando o criador definir, basta acrescentar falas.
- **[DECISÃO] Retratos do Sirius:**
  - usei só os dois retratos com o macacão bege (na manta e sorrindo);
  - os dois retratos de óculos com "Magic by birth" ficaram de fora, por causa da referência a Harry Potter (obra de terceiros, já apontada no GDD e na auditoria de assets);
  - a escolha do visual padrão do Sirius continua **[PENDENTE]** com o criador.
- **[DECISÃO] Retratos de choro e de sono:** não existem nas folhas. Usei efeitos de código (lágrimas, tremor, "z Z", retrato apagado) em vez de inventar arte nova.
- **[DECISÃO] Gênero de espécies e objetos:** acrescentado em `DadosPesca.js` só para os artigos ("um/uma", "o/a"). Não muda nada na pesca.
- **[DECISÃO] `Dialogos.js` da Madrugada:**
  - ficou no projeto, fora do jogo, com o aviso "SUBSTITUÍDO" no cabeçalho;
  - nada foi apagado;
  - os testes antigos dele continuam passando.
- **[DECISÃO] Ritmo e volume de conversa:**
  - escolhi uma família falante, mas sem atropelar a ação (números na seção 6.5);
  - para mudar, bastam as tabelas no início de `Narrador.js`: chances, intervalos e tempos por personagem.

---

## 11. Arquivos criados e modificados

**Criados:**

| Arquivo | Conteúdo |
|---|---|
| `jogo/src/narrativa/Narrador.js` | quem fala, quando e o quê; prioridades, tempos mínimos, interrupção, sem fila |
| `jogo/src/narrativa/Sirius.js` | estados do bebê, choro e sono |
| `jogo/src/narrativa/Falas.js` | formato e registro das cenas |
| `jogo/src/narrativa/falas/captura.js` | capturas, disputa e objetos (111 cenas) |
| `jogo/src/narrativa/falas/fracasso.js` | fugas, linhas rompidas, fisgadas perdidas, recolher vazio (58) |
| `jogo/src/narrativa/falas/pesca.js` | arremesso, região, isca, espera, mordida, briga (110) |
| `jogo/src/narrativa/falas/conversas.js` | conversas espontâneas (51) |
| `jogo/src/narrativa/falas/sirius.js` | inquieto, choro, acalmando, sono (32) |
| `jogo/src/narrativa/falas/reacoes.js` | reações extras de espera, mordida e briga (25) |
| `jogo/tests/narrativa.test.js` | 22 testes no Node |
| `jogo/tests/e2e-dialogos.js` | 25 verificações no navegador |
| `docs/RELATORIO_SISTEMA_DIALOGOS.md` | este relatório |
| `jogo/capturas/dialogos/*.png` | telas da última rodada dos testes de navegador, para avaliação |

**Modificados:**

| Arquivo | Mudança |
|---|---|
| `jogo/index.html` | carrega a camada de narrativa no lugar do `Dialogos.js` |
| `jogo/src/cenas/CenaPartida.js` | liga o Narrador aos eventos; caixa de diálogo nova; cantinho da família; sons de voz; recomeçar zera a narrativa |
| `jogo/src/cenas/CenaCarga.js` | carrega as três folhas de retratos |
| `jogo/src/visual/Recortes.js` | recortes dos retratos de expressão e tabela de emoções |
| `jogo/src/audio/AudioJogo.js` | canal de vozes, balbucio, choro e bipes |
| `jogo/src/ui/Interface.js` | volume e liga/desliga das vozes, nas opções e na pausa |
| `jogo/estilo.css` | quatro atalhos na pausa em telas largas |
| `jogo/src/logica/Armazenamento.js` | opções novas: volume e liga/desliga das vozes |
| `jogo/src/logica/DadosPesca.js` | gênero das espécies e objetos (só para o texto) |
| `jogo/src/logica/Dialogos.js` | só o cabeçalho "SUBSTITUÍDO"; não é mais carregado |
| `jogo/tests/e2e-jogo.js` | a verificação de diálogo usa o Narrador novo |
| `jogo/README.md` | seção sobre diálogos, Maria e Sirius; estrutura; testes |

**Não alterados**, conferidos por hash antes e depois, 234 arquivos idênticos:
- P0, P1 e P1 com personagens;
- spritesheets e animações aprovadas;
- máquina de estados da pesca e sistema multitouch;
- as folhas de retratos, o logo e as artes;
- o GDD.

As capturas antigas em `jogo/capturas/` também não foram tocadas. Elas continuam servindo de evidência ao relatório da Madrugada.

---

## 12. Testes e resultados

### 12.1 `node jogo/tests/narrativa.test.js` — 22 de 22

1. Dados: toda cena tem gatilho conhecido, falantes válidos, emoções e marcadores conhecidos.
2. Falas curtas: até 60 caracteres.
3. Cânone: Maria chama Lucas de "Lucas", nunca de "Alemão"; ALE o chama de "Alemão", nunca de "Lucas".
4. Cânone: Lucas não usa nome nem vocativo para o ALE e para a Maria.
5. Cânone: todos chamam o bebê só de "Sirius", sem apelido.
6. Sirius: só balbucios 8-bit, nenhuma palavra de adulto, incluindo as variações sorteadas.
7. Maria não pesca: nenhuma fala dela com ação de pesca em primeira pessoa.
8. Modo 1 jogador: conversas sobre a pescaria de alguém exigem que essa pessoa esteja pescando.
9. Variedade: pelo menos 15 falas de Lucas, ALE e Maria em cada categoria principal.
10. Variedade: cenas específicas dos modos 1 e 2; conversas com 3 e 4 personagens.
11. Simulação de 30 min com 2 jogadores: a família fala de verdade, sem exagero.
12. Invariantes com 2 jogadores:
    - uma fala por vez, sem repetição seguida;
    - nenhuma fala começa mais de 2,6 s depois do acontecimento;
    - o ritmo é respeitado;
    - o Sirius só balbucia acordado;
    - a Maria só fala, durante o choro, nas cenas de choro.
13. As categorias aparecem de verdade na simulação: capturas, fracassos, briga, espera, conversas e Sirius.
14. Sirius chorou na meia hora, nunca antes de 75 s e com pelo menos 4 min entre os choros.
15. **A narrativa não altera a pescaria:** a mesma partida, com e sem o Narrador, tem registros e estatísticas idênticos.
16. Modo 1 jogador com o ALE pescando: nenhuma cena exclusiva do modo 2; invariantes respeitados.
17. Modo 1 jogador com o Alemão pescando: o mesmo, com o ALE assistindo.
18. Prioridade: um fracasso interrompe na hora uma conversa em andamento.
19. Fila: um comentário comum durante uma cena importante é descartado, não vira comentário atrasado.
20. Fila: no máximo uma cena pendente, que expira em 2,5 s.
21. Pausa: com o tempo parado, a fala congela.
22. Sirius:
    - dormindo, não chora nem balbucia;
    - o barulho às vezes o acorda;
    - o choro dura pouco.

### 12.2 `node jogo/tests/e2e-dialogos.js …` — 25 de 25 (Edge, toque emulado)

**Retratos, família e estilos:**
- os retratos de expressão das folhas do criador carregam;
- Maria e Sirius aparecem na margem sem cobrir os pescadores;
- numa conversa com várias pessoas, as falas se sucedem uma por vez, cada uma com o seu nome;
- o balbucio tem estilo próprio, "(balbuciando)", e só sílabas de bebê.

**Choro:**
- o estado e o ícone mudam e a Maria fica ocupada;
- o som 8-bit sintetizado é pedido ao áudio;
- a Maria não comenta a pescaria e depois volta a ficar livre;
- a pescaria continua normalmente.

**Sono:** ícone "z", retrato apagado, sem balbucio e sem choro.

**Pausa, opções e recomeço:**
- na pausa a conversa congela, e ela volta ao retomar o jogo;
- vozes desligadas ou com volume zero ficam em silêncio; ligadas, tocam;
- recomeçar zera a narrativa.

**Telas:** em 5 combinações de tela e modo, a caixa não cobre cartões, boias, personagens, medidores nem a família, e o cantinho cabe na margem. São 10 verificações.

**Gerais:**
- no modo de 1 jogador, o narrador sabe quem assiste;
- nenhum erro de JavaScript e nenhum arquivo faltando.

### 12.3 Regressão (bateria final completa)

| Teste | Resultado |
|---|---|
| Jogo — lógica (`jogo/tests/logica.test.js`) | 18 de 18 |
| Jogo — navegador (`jogo/tests/e2e-jogo.js`) | 53 de 53 |
| P0 — lógica | 18 de 18, saída **idêntica** à linha de base |
| P1 — lógica | 53 de 53, saída **idêntica** à linha de base |
| P1 — simulação de balanceamento | saída **idêntica** à linha de base |
| P1 com personagens — animador | 27 de 27 |
| P1 — navegador (página do P1) | 42 de 42 |
| P1 — navegador (página com personagens) | 42 de 42 |
| P1 com personagens — navegador | 30 de 31 na bateria final. Nas 3 reexecuções: 31 de 31 uma vez e 30 de 31 duas vezes. A falha é sempre e só no item "Piscar": oscilação antiga do teste do protótipo protegido, sem relação com esta missão (seção 12.4). |
| P0 — navegador | 27 de 30. As 3 falhas são as mesmas da linha de base, anteriores às duas missões: a página do P0 não tem ícone (erro 404) e falta a ela a correção de rotação que o P1 ganhou. O P0 não foi alterado. |

**Integridade:** os 234 arquivos protegidos têm hash idêntico ao do início da missão.

**Revalidação final**, sobre o código definitivo, depois das últimas edições:

| Teste | Resultado |
|---|---|
| Narrativa | 22 de 22 |
| Lógica do jogo | 18 de 18 |
| Jogo no navegador | 53 de 53 |
| Diálogos no navegador | 25 de 25 |
| Arquivos protegidos | 234 idênticos |

### 12.4 Oscilações encontradas e o que foi feito

**1. Diálogos no navegador — corrigido no teste.**
- **O que aconteceu:** na bateria final, uma verificação deu 24 de 25. O balbucio estava certo (estilo, texto e nome), mas o teste leu o nome da caixa vazio.
- **Causa:** o teste pedia a fala logo depois de forçar uma cena, antes do quadro seguinte do jogo, que é quando a caixa é redesenhada (cerca de 16 ms depois). Era um defeito do teste, não do jogo: na tela, o nome aparece no quadro seguinte.
- **Correção:** o teste agora lê a fala e a caixa logo depois de um quadro do jogo.
- **Resultado:** **25 de 25 em 3 reexecuções seguidas**.

**2. P1 com personagens no navegador — oscilação antiga do protótipo protegido.**
- **O que aconteceu:** a verificação "Piscar: os dois piscam em 13 s, cada um no seu sorteio" às vezes falha porque os dois personagens piscam exatamente juntos.
- **Causa:**
  - a piscada é sorteada com `Math.random`;
  - ela só pode acontecer no início do 1º ou do 3º quadro do IDLE, ou seja, duas oportunidades a cada 2,4 s;
  - como os dois personagens entram no IDLE ao mesmo tempo, coincidir não é raro.
- **Não é efeito desta missão:**
  - a página de personagens não carrega nenhum arquivo de `jogo/`;
  - os arquivos dela são idênticos ao estado aprovado (hash e git);
  - todos os outros 30 itens passaram em todas as rodadas.
- **Por que não corrigi:** o protótipo é protegido e não pode ser alterado sem autorização.
- **Sugestão, se o criador autorizar:** que o teste observe por mais tempo, por exemplo 30 s em vez de 13 s. Com mais piscadas, a chance de todas coincidirem cai muito. O comportamento do jogo não precisa mudar.
- **Resultado:** em 4 rodadas nesta etapa (bateria final e 3 reexecuções), o teste deu 31 de 31 uma vez e 30 de 31 três vezes.
  - Nas três falhas, os dois personagens piscaram nos mesmos instantes: 6530/11326 ms, 8070/12866 ms e 7789/12584 ms.
  - É o padrão esperado quando a primeira piscada dos dois cai na mesma oportunidade. A segunda vem 4 oportunidades depois, com cerca de 4,8 s de intervalo.
- **Na Operação Madrugada**, o mesmo teste passou 31 de 31. Com essa chance de coincidência, sequências boas e ruins acontecem.

---

## 13. Limitações reais

1. **Vozes provisórias:** são bipes e balbucios sintetizados, sem dublagem nem voz de verdade. Isso é proposital, porque a missão proíbe gravações e arquivos não produzidos. Ficam como base até o criador decidir o áudio definitivo.
2. **Retratos:**
   - não há retratos próprios de choro nem de sono; usei efeitos de código no lugar;
   - o Sirius tem só 2 expressões utilizáveis;
   - algumas emoções caem no retrato mais próximo, por exemplo o ALE "feliz" usa o retrato neutro.
3. **Visual padrão do Sirius:** continua **[PENDENTE]** no GDD. Usei o do macacão bege, com e sem manta.
4. **Idade do Sirius:**
   - bebês de 2 meses quase só arrulham ("agu", "aah");
   - sílabas repetidas como "BA BA" ou "DA DA DA" costumam vir alguns meses depois;
   - deixei algumas dessas sílabas porque rendem as melhores interpretações dos adultos;
   - para um realismo mais estrito, basta enxugar as listas `BALBUCIOS` e `SILABAS` em `Narrador.js`.
5. **Repetição em sessões longas:**
   - são 387 cenas, a mesma cena não volta antes de 5 min e as últimas 40 frases nunca se repetem;
   - mesmo assim, em partidas de mais de 30 a 40 min, a repetição vai começar a ser percebida;
   - aumentar o conteúdo é só acrescentar cenas aos arquivos de dados.
6. **Choro aleatório:**
   - nas simulações, o primeiro choro veio entre 1,5 e 9 min de partida;
   - numa partida curta é possível não ver nenhum;
   - para avaliação, use o comando da seção 2.
7. **Tratamento do Lucas:** como ele chama o ALE e a Maria ainda não está definido. Por isso o Lucas não usa vocativo com eles.
8. **Testes no aparelho:** os testes de navegador rodam no Edge do computador com toque emulado. Falta **testar num celular de verdade**: legibilidade do texto, volume das vozes no alto-falante e desempenho.
9. **Uma partida simulada não é uma partida humana:** a simulação usa robôs que pescam sem parar e não sabem de espécie nova nem de recorde. Numa partida real, o começo tende a ter mais comentários, porque as primeiras espécies são novidade no catálogo.
10. **Só português:** não há tradução.
11. **Ferramentas de teste:** os testes de navegador dependem do `playwright-core`, que não faz parte do projeto, e de um servidor local.

---

## 14. Sugestões para a avaliação (decisão do criador)
- Ler e ajustar o tom das falas, que estão todas em `jogo/src/narrativa/falas/*.js`.
- Definir como o Lucas chama o ALE e a Maria.
- Escolher o visual padrão do Sirius e decidir se haverá retratos de choro e de sono.
- Dizer se a família está falante demais ou de menos. Há números para isso nas seções 6.2 e 6.5.
- Testar num celular real.
