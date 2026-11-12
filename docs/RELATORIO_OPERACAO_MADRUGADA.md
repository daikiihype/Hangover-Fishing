# Relatório — Operação Madrugada

**Data:** 12/11/2026 · **Status:** **VERSÃO JOGÁVEL ENTREGUE PARA AVALIAÇÃO DO CRIADOR.** Não é versão final nem comercial. **Nenhum teste físico foi feito** (só navegador com celular emulado). Nada foi enviado ao git.

**Para jogar agora:** dê dois cliques em `iniciar-jogo.bat` (na pasta do projeto) ou rode `py -m http.server 8765 --bind 0.0.0.0` na pasta do projeto e abra **http://localhost:8765/jogo/** (detalhes nas seções 10–12).

---

## 1. O que foi implementado

| Sistema | Situação |
|---|---|
| Estrutura nova `jogo/`, separada; P0, P1 e P1 com personagens intactos | ✔ |
| Menu **vertical** (9:16) sobre um mar em pixel art animado (céu de madrugada, ondas, raios, algas, bolhas, peixes nadando), com o **logo do criador** e os **dois personagens num barco** (IDLE aprovado, com o piscar) | ✔ |
| Navegação: 1 JOGADOR, 2 JOGADORES, CATÁLOGO, OPÇÕES, pausa, resumo e volta ao menu | ✔ |
| Transição para a horizontal: tenta tela cheia + trava (Android); senão, tela "gire o celular", sempre com saída para o menu | ✔ |
| Partida de **2 jogadores** (Alemão à esquerda, ALE à direita), multitouch do P0/P1 | ✔ |
| Partida de **1 jogador** (escolha Alemão ou ALE): personagem maior (×3), água inteira, toque em qualquer lugar | ✔ |
| Personagens **maiores** (×2 em 2 jogadores; ×3 em 1 jogador) com cenário reorganizado | ✔ |
| As seis animações aprovadas (mesma camada do P1 com personagens) | ✔ |
| **Diálogos centrais** (nome, retrato, caixa em pixel art, aparecer e sumir suaves, ocasionais) | ✔ |
| **Regiões de pesca** (margem, águas abertas, fundo) com indicação visual e liga/desliga | ✔ |
| **Iscas** (4) por jogador, escolhidas antes da partida e trocáveis na pausa | ✔ |
| **Espécies** (7) e **objetos estranhos** (3) com a arte das folhas do criador | ✔ [PROPOSTA de conteúdo] |
| **Catálogo e guia** (fichas, descobertas, maior exemplar, guia de regiões e iscas) com registro local | ✔ |
| **Opções** (volume geral, efeitos, música; música e efeitos liga/desliga; regiões; vibração; apagar catálogo), salvas no aparelho | ✔ |
| **Música** ambiente (sintetizada, provisória) | ✔ |
| Sinais ambientais por região (cardume e bolhas na margem; ondulações nas abertas; sombras grandes e redemoinhos no fundo) | ✔ |
| Script para iniciar o servidor (`iniciar-jogo.bat`) | ✔ |

## 2. O que já funciona (verificado)
Tudo da tabela acima foi verificado em testes **automáticos**: Node, e navegador (Edge com celular emulado, multitouch real pelo protocolo de depuração). Os números estão na seção 8. O ciclo completo também foi jogado de ponta a ponta no navegador (abrir → menu → 2 jogadores → girar → pescar → capturar, perder, romper, recolher → pausa → sair → resumo → catálogo → 1 jogador → menu).

## 3. O que ainda está incompleto ou é provisório
- **Testes físicos em celular: não feitos.** Nada aqui substitui o teste com pessoas e aparelhos reais (tensão, ritmo, legibilidade e conforto).
- **Balanceamento:** só por simulação, com jogadores virtuais que leem a tensão exata (seção 7).
- **Conteúdo [PROPOSTA]:** as 7 espécies, os 3 objetos e as 4 iscas, com pesos, chances, comportamentos e textos. Os nomes vêm das folhas do criador (`arte 3.jpg`, `arte 2.jpg`) e do GDD (espécies provisórias). **Não são afirmações sobre os peixes reais.**
- **Arte dos peixes, iscas e objetos:** recortes automáticos dos JPEG (com xadrez desenhado), feitos na memória. Podem sobrar pontinhos claros na borda. Massa e coração foram desenhados em código (16 × 16), porque não existem nas folhas.
- **Áudio:** sons e trilha sintetizados (provisórios), sem arquivos de áudio.
- **Sem objetivo de partida** (tempo ou placar final): a pescaria é livre, como no P1. O resumo aparece ao sair.
- **Maria e Sirius** não entraram: dependem de arte e de decisão (GDD).
- **Painel de diagnóstico do P1:** não incluído na versão nova (continua no P1).

## 4. Arquitetura

```
                   ┌───────────── jogo/index.html ─────────────┐
 DOM (telas)       │ Interface.js: menu, preparação, catálogo,  │
 por cima          │ opções, girar, pausa, resumo               │
                   └──────────────┬─────────────────────────────┘
                                  │ main.js (fluxo, orientação, interrupções)
 Phaser 3.90 (canvas em resolução do aparelho)
   CenaCarga → recortes da arte do criador + spritesheets/JSONs aprovados
   CenaMar   → fundo do menu (mar animado, barco, personagens)
   CenaPartida → lago, regiões, margem, personagens, linha, boia, cartões, diálogos
                                  │ lê o estado (nunca altera)
 Lógica (sem Phaser)              ▼
   SessaoJogo  ⊂ FishingSession (P1)  ── TouchRouter (P0/P1)
   PescadorRegional ⊂ FishingPlayer (P1): troca SÓ as tabelas dos sorteios
   DadosPesca (regiões, iscas, espécies) · Dialogos · Catálogo/Opções (localStorage)
   CharacterAnimator (P1 com personagens, aprovado)
```

- **Princípio:** a pesca é a do P1. O `PescadorRegional` herda a máquina de estados inteira e só substitui as tabelas de três sorteios: espera, espécie e peso, e força do peixe no fundo.
- **Prova da igualdade:** com as regiões **desligadas** e a isca **minhoca**, o registro de eventos é **idêntico** ao do P1 com a mesma semente. Os testes foram conferidos e falham quando a tabela é corrompida de propósito.
- **Reaproveitamento por referência:** a página nova carrega os arquivos do P1, do animador aprovado e os assets aprovados direto das pastas originais. Nada foi copiado nem alterado.

## 5. Estrutura dos arquivos (todos novos)

| Arquivo | Papel |
|---|---|
| `iniciar-jogo.bat` | Inicia o servidor local e mostra os endereços (computador e celular) |
| `jogo/index.html`, `jogo/estilo.css` | Página e identidade visual (cores do logo, botões de madeira) |
| `jogo/src/main.js` | Inicialização, navegação, orientação, interrupções |
| `jogo/src/ui/Interface.js` | Telas verticais e de pausa/resumo |
| `jogo/src/cenas/CenaCarga.js`, `CenaMar.js`, `CenaPartida.js` | Carga, menu animado, partida |
| `jogo/src/visual/Recortes.js` | Recorte da arte do criador na memória |
| `jogo/src/audio/AudioJogo.js` | Sons do P1 + volumes + música |
| `jogo/src/logica/DadosPesca.js`, `PescadorRegional.js`, `SessaoJogo.js`, `Armazenamento.js`, `Dialogos.js` | Lógica do jogo novo |
| `jogo/tests/logica.test.js`, `e2e-jogo.js`, `simulacao-regioes-iscas.js` | Testes e simulação |
| `jogo/README.md` | Guia da versão |
| `docs/EXECUCAO_OPERACAO_MADRUGADA.md` | Plano de execução (escrito antes de implementar) |
| `docs/RELATORIO_OPERACAO_MADRUGADA.md` | Este relatório |
| `jogo/capturas/*.png` (18) | Capturas de tela da rodada final do teste de navegador, para avaliação |

## 6. Decisões técnicas e criativas
Todas são reversíveis e estão aqui para a avaliação. As decisões D1–D7 foram dadas pela missão.

**Estrutura e técnica**
1. **Versão nova em `jogo/`**, que usa o P1 por referência: o P1 fica preservado e o criador pode voltar a ele.
2. **Canvas na resolução do aparelho** (até 3×): a pixel art fica nítida. No P1, o navegador ampliava o canvas e deixava as bordas suaves.
3. **Telas do menu em DOM** (botões reais, rolagem, controles deslizantes): acessíveis e testáveis. O mar e a partida ficam no canvas.
4. **Arte do criador recortada na memória:**
   - logo;
   - peixes da `arte 3.jpg`;
   - bota, pneu, lata, minhoca e isca artificial da `arte 2.jpg`.

   Nenhum arquivo foi alterado. Os retratos dos diálogos saem da cabeça do sprite IDLE aprovado.

**Menu e personagens**

5. **Composição do menu:**
   - o logo fica no alto, sobre o céu de madrugada;
   - a "arte principal" são os **dois personagens aprovados pescando de um barco** na linha d'água, animados;
   - as opções ficam embaixo, sobre o fundo do mar, como tábuas de madeira.
6. **Escala dos personagens:** ×2 em 2 jogadores e ×3 em 1 jogador. Em telas maiores, a escala cresce sempre em número inteiro.
   - O cenário foi refeito para isso: a margem ficou mais alta, os **cartões ficam no alto da água de cada jogador** (nunca sobre as cabeças) e o **diálogo fica no centro**, entre as colunas das boias.
   - Os testes conferem essas áreas em 3 tamanhos de tela.

**Regiões (missão D1–D7)**

7. **D1** limites: < 14 m, 14–22 m, ≥ 22 m. Na tela, cada região ocupa uma faixa de altura própria, com cor, tracejado e rótulo. A barra de força e o alvo usam a cor da região.
8. **D2** a região é a do **pouso**: recolher a linha não a muda (testado).
9. **D3** as águas abertas reproduzem o P1 exatamente.
10. **D4** estrutura separada, sem tocar no P1.
11. **D5** o fundo tem peixes mais pesados e mais fortes, com mais espera e brigas longas. Ele não é o melhor em tudo (seção 7).
12. **D7** liga/desliga nas opções, na preparação e na pausa. Desligado, o lago inteiro funciona como as águas abertas, ou seja, o jogo tradicional.

**Iscas, espécies e catálogo**

13. **4 iscas, cada uma com um papel:**
    - **minhoca:** versátil (é a do P1);
    - **massa:** mais mordidas, peixes pequenos e carpas;
    - **artificial:** só predadores; é a única que traz Tucunaré e Dourado;
    - **coração:** bagres e carpas, com mordidas mais lentas.
14. **7 espécies:**
    - Lambari, Tilápia, Traíra, Carpa, Bagre, Tucunaré e Dourado;
    - Tilápia, Carpa e Traíra usam exatamente os perfis "rápido", "pesado" e "arisco" do P1;
    - as outras têm comportamentos novos [PROPOSTA].
15. **Objetos estranhos** (bota, lata, pneu; GDD S6): raros, nunca punitivos, **não contam como peixe** no placar. São registrados no catálogo.
16. **Catálogo:** um peixe não descoberto mostra a silhueta, a raridade, onde e com que isca aparece, a melhor chance e a dica. O nome, o peso e o comportamento só aparecem depois da primeira captura. Assim o guia ajuda sem estragar a descoberta.

**Diálogos e áudio**

17. **Diálogos:**
    - **Quando:** no máximo uma fala a cada 15 s, com espera própria por situação e sorteio.
    - **Situações:** peixe grande, peixe perdido, linha rompida, seca de 75 s (com dica de estratégia), objeto estranho, virada no placar, capturas em sequência e espécie nova.
    - **Conteúdo:** só comentários sobre a pescaria; nenhuma informação pessoal inventada.
18. **Música:** trilha calma sintetizada na hora (sem arquivos). Os controles mexem no áudio de verdade (testado).

**Partida**

19. **Isca e regiões na pausa:** a troca vale a partir do próximo arremesso (a isca já está na água).
20. **1 jogador:**
    - o espaço do segundo jogador vira água maior e personagem maior;
    - não há adversário automático;
    - o personagem fala sozinho, com menos frequência.

## 7. Decisões de balanceamento
**Ponto de partida:** a tabela do `docs/PLANO_REGIOES_DE_PESCA.md`, com as espécies no lugar dos perfis e as iscas por cima.

A simulação (`node jogo/tests/simulacao-regioes-iscas.js`) mostrou dois problemas na primeira versão:
- **O fundo com coração de galinha vencia em kg para todos os estilos.** O bagre era pesado demais e a isca forte demais.
- **As brigas no fundo duravam 37–41 s.**

Ajustes aplicados:

| Item | Antes (plano/1ª versão) | Agora | Por quê |
|---|---|---|---|
| Força do peixe no fundo | × 1,25 (plano) | × 1,15 | Brigas menos longas |
| Cansaço no fundo | × 0,85 (plano) | × 1,0 | Brigas menos longas |
| Espera no fundo | 6–12 s (plano) | 6,5–12 s | Compensa as brigas mais curtas |
| Faixa de peso no fundo | 40–120 % (plano) | 40–110 % | O fundo não domina em kg |
| Bagre | 2,5–7,5 kg | 2–6,5 kg, mais forte que a carpa, corridas mais curtas | Era a causa da dominância |
| Coração de galinha | espera × 1,0; bagre × 2,4 | espera × 1,15; bagre × 2,0; menos bagre fora do fundo | Peso total em troca de menos mordidas |
| Isca artificial | espera × 1,2 | espera × 1,1 | Espera máxima no fundo ≈ 13 s |

**Resultado** (jogador virtual "médio", 20 sessões de 10 min por célula; sem perdas porque ele lê a tensão exata):

| Escolha | Peixes | kg | Maior peixe (média) | Briga média |
|---|---|---|---|---|
| Margem + massa | **37,1** | 29,8 | 3,80 kg | 9 s |
| Margem + minhoca | 35,1 | 34,6 | 3,88 kg | 10 s |
| Águas abertas + minhoca (= P1) | 22,9 | 45,4 | 5,29 kg | 19 s |
| Águas abertas + coração | 20,9 | 55,3 | 5,72 kg | 20 s |
| Fundo + coração | 12,7 | **59,2** | 6,62 kg | 35 s |
| Fundo + artificial | 14,3 | 46,4 | **7,01 kg** (Dourado) | 29 s |

**Quem vence o quê** (princípio central da missão):
- **Mais peixes:** sempre a margem.
- **Maior peixe:** sempre o fundo; para quem joga bem, com isca artificial.
- **Mais kg:** o fundo, por pouco: +7 % sobre as águas abertas com coração no jogador médio e +3 % no descuidado. O preço é um terço dos peixes e brigas de 30–35 s.
- **Menos perdas** (jogador descuidado): margem ou águas abertas com massa. No fundo com isca artificial, ele rompe **9 linhas** em 10 min.
- **Isca artificial:** a única que traz Tucunaré e Dourado; arriscada para quem joga mal.
- **Minhoca:** a escolha segura, sem ponto fraco.

Nenhuma região nem isca vence em tudo.

**Ritmo e dinâmica** (o que a missão pediu para procurar):
- **Tempo parado:** a espera ocupa 17–25 % da sessão em todas as regiões; só o fundo com isca artificial, num jogador descuidado, chega a 34 %. A espera mais longa possível é de ~13 s (fundo com isca artificial). Se os dois ficarem 75 s sem pescar nada, um personagem comenta e dá uma dica ("Muda a isca. Ou o lugar.").
- **Brigas:** ~10 s na margem, ~19 s nas águas abertas (como no P1) e ~30–35 s no fundo. Quem não quer brigas longas tem a margem e as águas abertas.
- **Um jogador dominando o outro:** a diferença de habilidade aparece nas perdas (linha rompida e fuga). Agora o jogador menos atento tem escolhas que reduzem as perdas (margem, massa, minhoca) sem que o jogo "facilite" para ele. O mais atento ganha mais no fundo e com isca artificial.
- **Utilidade das iscas:** cada uma é a melhor escolha em ao menos uma situação (testado: cada isca é a mais provável para alguma espécie).
- **Nenhum problema foi resolvido só aumentando recompensa:** cada vantagem tem um custo (menos mordidas, peixes menores, brigas longas ou mais perdas).

**Riscos que só o teste físico resolve:**
- brigas de ~30–35 s no fundo podem cansar;
- a espera no fundo pode entediar quem espera enquanto o outro pesca na margem;
- com pessoas, as perdas no fundo devem ser maiores que na simulação.

## 8. Resultados dos testes

**Linha de base (antes de qualquer arquivo novo):** P0 lógica 18/18 · P1 lógica 53/53 · simulação do P1 · animador 27/27 · e2e do P1 42/42 (nas duas páginas) · personagens e2e 31/31 · P0 e2e 27/30.

**Depois (bateria final):**

| Teste | Resultado |
|---|---|
| Lógica do jogo novo (`jogo/tests/logica.test.js`) | **18/18** (inclui 3 regressões de igualdade com o P1, conferidas: falham se a tabela for corrompida) |
| P0 lógica | **18/18**, saída **idêntica** à linha de base |
| P1 lógica | **53/53**, saída **idêntica** à linha de base |
| P1 simulação de balanceamento | saída **idêntica** à linha de base |
| Animador dos personagens | **27/27** |
| **Navegador: jogo novo** (`jogo/tests/e2e-jogo.js`) | **53/53** |
| Navegador: e2e do P1 (página do P1) | **42/42** (igual à linha de base) |
| Navegador: e2e do P1 (página com personagens) | **42/42** (igual à linha de base) |
| Navegador: personagens | **31/31** (igual à linha de base) |
| Navegador: P0 | **27/30**: as mesmas 3 falhas da linha de base, anteriores a esta missão (ver abaixo) |
| Arquivos protegidos (SHA-256: P0, P1, P1 com personagens, `arte/**`, `docs/**` existentes, JPEG da raiz) | **231/231 idênticos** |

**O que o teste de navegador do jogo novo cobre:**
- **Navegação:** menu, catálogo (ficha, guia, objetos), opções (o volume muda o ganho real, a música para e volta a tocar), recarregar a página (opções preservadas), 1 e 2 jogadores, voltar ao menu.
- **Pesca:** carregar, arremessar, esperar, fisgar, brigar, capturar (CATCH com peixe na mão e cartão), perder o peixe (FRUSTRATION), romper a linha, recolher sem peixe, recomeçar.
- **Regiões:** arremesso curto, médio e longo, com a região batendo com a distância; a região escrita na boia; D2 (recolher não muda a região); peixes coerentes com a região e a isca; comparação com as regiões desligadas.
- **Multitouch:** os dois carregando ao mesmo tempo; um arremessa e o outro continua; um briga e o outro carrega; um recolhe enquanto o outro espera; perda de foco; página oculta; retomada pelo toque.
- **Interface:** menu em 360×640, 412×915, 768×1024 e 1280×720; partida em 640×360, 915×412 e 1024×768 (personagens inteiros, cartões acima das cabeças); diálogo sem cobrir boias nem personagens; botões com 44 px ou mais.
- **Erros:** nenhum erro de JavaScript nem arquivo faltando.

**P0 e2e (27/30):** as 3 falhas são **anteriores** a esta missão e iguais à linha de base. A página do P0 não tem ícone (erro 404), e falta no P0 a correção de rotação que o P1 ganhou. O P0 não foi alterado.

**Capturas de tela** da rodada final do teste estão em `jogo/capturas/` (menu, preparação, "gire o celular", regiões, briga, captura, diálogo, linha rompida, pausa, regiões desligadas, resumo, catálogo, ficha, guia, opções, 1 jogador, tela pequena e computador).

## 9. Limitações conhecidas
- **iPhone:** o navegador não permite travar a orientação nem tela cheia em páginas comuns. O jogo mostra "gire o celular" e funciona normalmente depois de girar.
- **Recorte automático dos JPEG:** pode deixar pontinhos claros nas bordas, visíveis só de perto. A solução definitiva é a arte com transparência real.
- **Diálogos:** frases curtas e genéricas sobre a pescaria; podem repetir em sessões longas (há 2–4 por situação, sem repetir a mesma em seguida).
- **Pesos acima de 6 kg:** a sombra do peixe na briga para de crescer nesse ponto (como no P1).
- **Vibração:** desligada por padrão (D9 do P1). É do aparelho inteiro; no iPhone o navegador não permite.
- **Partida sem fim:** não há tempo de partida nem vencedor; o resumo mostra quem pescou mais.
- **Testes de navegador:** usam o Edge com celular emulado e o Playwright, que não faz parte do projeto.

## 10. Como executar no computador
1. Na pasta do projeto, dê dois cliques em **`iniciar-jogo.bat`**.
   - Ou, num terminal **na pasta do projeto**: `py -m http.server 8765 --bind 0.0.0.0` (ou `python` no lugar de `py`).
2. Abra **http://localhost:8765/jogo/**
3. No computador, o menu aparece numa coluna vertical no centro. Ao começar a partida (janela deitada), ela inicia direto. O mouse funciona como um dedo; para dois jogadores de verdade, use um celular ou tablet.

## 11. Como executar no celular
1. Deixe o servidor rodando no computador (passo 10.1, com `--bind 0.0.0.0`).
2. O celular deve estar **na mesma rede Wi-Fi**.
3. No navegador do celular, abra `http://IP-DO-COMPUTADOR:8765/jogo/`. O `iniciar-jogo.bat` mostra esse endereço pronto.
4. Comece **com o celular em pé** (menu vertical). Toque em 1 ou 2 JOGADORES, escolha as iscas, toque em COMEÇAR e gire o celular.

## 12. Endereço e porta na rede local
- **Porta:** **8765**.
- **Endereço:** `http://<IPv4 do computador>:8765/jogo/`.
- **O IP depende do computador e da rede** (por exemplo, `192.168.x.x`). Ele aparece no `iniciar-jogo.bat` ou com `ipconfig` → "Endereço IPv4".
- **Se o celular não abrir:**
  - confira se os dois estão na mesma rede;
  - confira se o servidor foi iniciado com `--bind 0.0.0.0`;
  - permita o Python no firewall do Windows (redes privadas).

## 13. Próximos passos recomendados
1. **Teste físico** com duas pessoas (sessões de ~30 min, como antes):
   - metade com as regiões **ligadas** e metade **desligadas**;
   - observar ritmo, duração das brigas no fundo, tédio na espera, uso das iscas e legibilidade das regiões e dos cartões.
2. **Calibrar** a tabela de regiões e iscas com os dados reais (a simulação reproduz qualquer tabela nova).
3. **Decidir a escala final** dos personagens (D10), agora com o layout novo.
4. **Arte com transparência real** para peixes, iscas e objetos, que substitui os recortes automáticos sem mudar o código (as chaves das texturas continuam as mesmas).
5. **Objetivos de partida** (tempo, maior peixe, mais kg), se o criador quiser competição com fim.
6. **Áudio definitivo** (efeitos e música).
7. **Próxima mecânica do plano de regiões:** pontos quentes temporários, iguais nas duas metades.
