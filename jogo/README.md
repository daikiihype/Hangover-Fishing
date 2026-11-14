# Hangover Fishing — versão jogável

**Status:** versão de **teste**, entregue para a avaliação do criador. Não é uma versão final nem pronta para publicação.

| Operação | Data | O que trouxe |
|---|---|---|
| Madrugada | 12/11/2026 | versão jogável |
| "A alma do jogo" | 12/11/2026 | diálogos, Maria e Sirius |
| **Nova Identidade** | 12/11/2026 | lago em pixel art com três planos, HUD novo, quatro lugares, pontos de interesse, vida no lago e diálogos no estilo Hangover Accident |

A Nova Identidade aguarda avaliação. Relatório: `docs/RELATORIO_OPERACAO_NOVA_IDENTIDADE.md`.
A versão anterior está guardada em `versoes-anteriores/jogo_alma-do-jogo_2026-11-12.zip`.

**O que é:** o jogo completo em volta da pesca do P1:
- menu vertical com o logo e o mar;
- partidas de 1 ou 2 jogadores na horizontal, com os personagens animados aprovados;
- regiões de pesca e iscas;
- catálogo e guia;
- diálogos com personalidade (Alemão, ALE, Maria e o bebê Sirius), que reagem ao que acontece na pescaria;
- opções.

O P0, o P1 e o P1 com personagens continuam intactos e acessíveis em `prototipos/`.

## Como abrir

### Pela internet (GitHub Pages), depois de publicado
- **https://daikiihype.github.io/Hangover-Fishing/** abre o jogo direto. A raiz redireciona para `jogo/`.
- Funciona no computador e no celular, sem servidor, Python ou Node.
- Como publicar e atualizar: ver **Publicar no GitHub Pages**, mais abaixo.

### No computador (Windows)
1. Dê dois cliques em **`iniciar-jogo.bat`**, na pasta do projeto. Ele inicia um servidor local, mostra os endereços e abre o jogo no navegador.
2. Ou, manualmente, num terminal **na pasta do projeto** (`Hangover Fishing`):
   ```
   py -m http.server 8765 --bind 0.0.0.0
   ```
   e abra **http://localhost:8765/jogo/**
   - Se o comando `py` não existir, use `python` no lugar.
   - Não funciona abrindo o arquivo direto (`file://`): o navegador bloqueia a leitura das imagens.

### No celular
1. O celular precisa estar **na mesma rede Wi-Fi** do computador, e o servidor precisa estar rodando com `--bind 0.0.0.0` (o `iniciar-jogo.bat` já faz isso).
2. No celular, abra **http://IP-DO-COMPUTADOR:8765/jogo/**
   - O `iniciar-jogo.bat` mostra o endereço com o IP certo.
   - O IP muda de computador para computador (e às vezes de rede para rede). Para vê-lo à mão: `ipconfig` → "Endereço IPv4".
3. Se o Windows perguntar sobre o firewall, permita o acesso em **redes privadas**.

## Como jogar
1. **Menu (celular em pé):** 1 JOGADOR, 2 JOGADORES, CATÁLOGO ou OPÇÕES.
2. **Preparação:** escolha a isca de cada jogador (e, no modo de 1 jogador, quem pesca). As regiões de pesca podem ser ligadas e desligadas ali mesmo.
3. **COMEÇAR:** gire o celular para a horizontal.
   - No Android, o jogo tenta entrar em tela cheia e travar a tela deitada.
   - Se o navegador não deixar (iPhone, por exemplo), aparece um aviso para girar, sempre com um botão para voltar ao menu.
4. **Pesca** (igual ao P1, em cada metade da tela):
   - **Segure** para carregar a força e **solte** para arremessar.
   - Espere a boia **afundar** e então faça um **toque novo** para fisgar.
   - Na briga, **segure** para recolher e **solte** para aliviar. No vermelho por muito tempo a linha arrebenta; no azul por muito tempo o peixe escapa.
   - Durante a espera, **segure** para recolher a linha vazia.
5. **Lugares do lago:** a força do arremesso decide onde a boia cai.

   | Arremesso | Lugar | O que esperar |
   |---|---|---|
   | Curto (segurando até a força voltar) | **Margem Rasa** (até 14 m) | Água clara, mais mordidas, peixes menores |
   | Médio | **Baía dos Lírios** (14–18 m) | Águas abertas: o jogo do P1 (referência) |
   | Médio | **Curva das Pedras** (18–22 m) | Águas abertas: o jogo do P1 (referência) |
   | Longo | **Poço Profundo** (22 m em diante) | Espera maior, peixes pesados e mais fortes |

   - A cor do alvo e da barra de força mostra o lugar enquanto você carrega.
   - O nome do lugar aparece na boia quando ela cai.
   - O lugar é o do **pouso**: recolher a linha não o muda.
   - Lírios e Pedras se diferenciam pelos **pontos de interesse** típicos de cada um.
6. **Pontos de interesse:**
   - **Onde aparecem:** bolhas, cardume, folhas tremendo nos lírios, redemoinho nas pedras, sombra grande e tronco submerso. Surgem de tempos em tempos **nas duas metades, na mesma distância**, por uns 20 s.
   - **O que dão:** se a boia **pousa** em cima, aquele arremesso ganha uma vantagem moderada (mordida mais cedo, certas espécies mais prováveis ou peixe um pouco mais pesado). A tela avisa "NO PONTO!".
   - **O que não fazem:** nada garante a captura.
7. **Iscas:** Minhoca (versátil), Massa (muitas mordidas, peixes pequenos e carpas), Isca artificial (só predadores; é a única que traz Tucunaré e Dourado), Coração de galinha (bagres e carpas, mordidas mais lentas). Elas podem ser trocadas na **pausa** e valem a partir do próximo arremesso.
8. **HUD:**
   - **Placas nos cantos de cima:** nome, peixes, maior e total, isca com ícone. Alemão à esquerda, ALE à direita.
   - **Medidor de tensão:** compacto, ao lado de cada pescador, só durante a briga.
   - **Dicas curtas:** somem depois de 3 acertos de cada etapa. Podem ser revistas em **OPÇÕES**.
9. **Pausa (botão II, no canto superior direito):**
   - continuar, recomeçar ou sair para o menu (com o resumo da pescaria);
   - trocar isca;
   - ligar ou desligar regiões, música, efeitos e vozes;
   - na pausa a conversa e o lago congelam.
10. **Catálogo:**
   - fichas de cada peixe, com raridade, regiões, iscas recomendadas, melhor chance, dificuldade, dica e situação (descoberto ou não, quantidade e maior exemplar);
   - guia dos lugares do lago, dos pontos de interesse, das regiões e das iscas;
   - objetos estranhos já pescados.

   O registro fica salvo no navegador.

## Diálogos, Maria e Sirius
- **Quem fala:** os dois pescadores (Alemão e ALE), a **Maria**, que comenta mas não pesca, e o **Sirius**, que só balbucia em 8-bit (os adultos "traduzem" o que ele quis dizer).
  - Maria chama o Alemão de "Lucas" e o ALE de "pai".
  - O ALE chama o Lucas de "Alemão" e a Maria de "Maria".
  - O Lucas chama a Maria de "Maria". Como ele chama o ALE ainda não foi definido, então ele não usa vocativo.
  - Ninguém usa apelido para o Sirius.
- **Do que falam:**
  - a pescaria: arremessos, lugares e iscas, espera, mordida, briga, capturas, fugas e linhas rompidas;
  - a disputa entre os dois, no modo de 2 jogadores;
  - o que acontece no lago: peixe saltando, cardume, objeto boiando, pássaros, chuva, entardecer e pontos de interesse;
  - conversas da família enquanto a boia espera.
- **Como aparece** (estilo Hangover Accident): uma caixa escura com borda branca dupla, no centro de baixo, sobre a margem e entre os pescadores.
  - **Um retrato por vez**, com moldura na cor de quem fala, o nome e o texto aparecendo letra a letra.
  - A caixa entra subindo e sai suave; uma fala gritada a faz tremer.
  - O Sirius tem estilo próprio: balbucio azul-claro com letras grandes; choro rosado que treme, com lágrimas.
- **A família não fica exposta no cenário:** Maria e Sirius participam pelos diálogos. Na margem há só a manta com o cestinho do Sirius, sem rosto, que mostra o estado dele: notinha quando balbucia, "!" inquieto, "!!" chorando e "z" dormindo.
- **Ritmo:**
  - a mordida corta a conversa do momento, e a conversa pode voltar depois ("Como eu ia dizendo...");
  - a fisgada tem reação curta e imediata;
  - enquanto alguém espera a mordida, a conversa vem mais cedo;
  - o silêncio continua fazendo parte.
- **Choro:** de vez em quando o Sirius chora por alguns segundos; a Maria para de comentar a pescaria para cuidar dele. A pescaria não muda em nada.
- **Sono:** dormindo, o Sirius não balbucia nem chora. Às vezes a comemoração de uma captura grande, ou uma linha arrebentando, o acorda.
- **Vozes:** balbucios, choro e os bipes das falas são sons 8-bit sintetizados na hora, sem gravações.
  - Em **OPÇÕES** há o volume e o liga/desliga das **Vozes**.
  - Na pausa há o atalho "Vozes".
- **Regra de ouro:** os diálogos só **observam** a pescaria. Não mudam espera, tensão, força, fisgada, capturas, pesos, resultados nem os controles; um teste compara a mesma partida com e sem diálogos.
- Detalhes, números e limitações: `docs/RELATORIO_SISTEMA_DIALOGOS.md`.

## Estrutura
```
jogo/
  index.html                 página (telas em DOM + canvas do Phaser)
  estilo.css                 identidade visual (cores do logo, botões de madeira)
  src/logica/                SEM Phaser (testável no Node)
    DadosPesca.js            espécies, objetos, iscas e regiões (tabelas)
    PescadorRegional.js      FishingPlayer do P1 + tabelas de região e isca (mesma máquina de estados)
    PontosDeInteresse.js     pontos de interesse (espelhados, sorteio próprio, efeito só no arremesso que pousa neles)
    SessaoJogo.js            FishingSession do P1 com pescadores regionais e os pontos de interesse (1 ou 2 jogadores)
    Armazenamento.js         opções e catálogo no navegador (localStorage, sem servidor)
    Dialogos.js              diálogos antigos da Operação Madrugada (SUBSTITUÍDO; fora do jogo, guardado como histórico)
  src/narrativa/             camada de diálogos, SEM Phaser (testável no Node); só lê os eventos da pesca
    Narrador.js              decide quem fala, quando e o quê (prioridades, cooldowns, interrupções, sem fila)
    Sirius.js                estados do bebê: acordado, inquieto, chorando, acalmando, dormindo
    Falas.js                 registro das cenas (formato dos dados)
    falas/*.js               o TEXTO das falas, separado da lógica:
                             captura, fracasso, pesca, conversas, sirius, reacoes, mundo, familia
  src/audio/AudioJogo.js     sons do P1 + volumes + trilha sintetizada + vozes 8-bit (WebAudio, sem arquivos)
  src/visual/Recortes.js     recorta a arte do criador (JPEG) na memória, sem alterar os arquivos (inclui os retratos de expressão)
  src/visual/Cenario.js      o lago em pixel art gerado por código (céu, morros, outra margem, água, superfície, margem)
  src/visual/VidaDoLago.js   animações e eventos do mundo (água, juncos, insetos, nuvens, peixes, chuva, entardecer, pontos)
  src/visual/CaixaDialogo.js a caixa de diálogo (um retrato por vez, entrada e saída)
  src/cenas/                 CenaCarga (assets), CenaMar (fundo do menu), CenaPartida (pesca, HUD e cenário)
  src/ui/Interface.js        telas: menu, preparação, catálogo, opções, girar, pausa, resumo
  src/main.js                inicialização, navegação, orientação e interrupções
  tests/logica.test.js       testes da lógica (inclui regressão contra o P1)
  tests/narrativa.test.js    testes dos diálogos (cânone, variedade, ritmo, Sirius, e que a pesca não muda)
  tests/e2e-jogo.js          teste no navegador (joga de verdade, com dois dedos)
  tests/e2e-dialogos.js      teste no navegador dos diálogos (caixa, retratos, choro, sono, pausa, opções, telas)
  tests/pontos.test.js       testes dos pontos de interesse (espelhamento, sorteio próprio, efeito e equilíbrio)
  tests/e2e-identidade.js    teste no navegador da identidade nova (cenário, HUD, lugares, pontos, desempenho, capturas)
  tests/simulacao-regioes-iscas.js   simulação de balanceamento
  capturas/                  telas da rodada de testes de navegador da Madrugada (para avaliação)
  capturas/dialogos/         telas dos diálogos, Maria e Sirius (Operação "A alma do jogo")
  capturas/nova-identidade/  telas da identidade nova (Operação Nova Identidade)
```

**Reaproveitado por referência, sem cópia nem alteração:**
- `prototipos/p1-pesca/` (Phaser 3.90, entrada multitouch, lógica, sons);
- `prototipos/p1-personagens/src/visual/CharacterAnimator.js`;
- `arte/personagens-animacoes/**` (spritesheets e JSONs aprovados);
- `logo.jpg`, `arte 2.jpg`, `arte 3.jpg`;
- folhas de retratos `alemao rosto.jpg`, `Pai rosto.jpg` e `Maria e Sirius.jpg` (recortadas na memória, sem alterar os arquivos).

## Testes
```
node jogo/tests/logica.test.js
node jogo/tests/narrativa.test.js
node jogo/tests/pontos.test.js
node jogo/tests/simulacao-regioes-iscas.js
node jogo/tests/e2e-jogo.js <pasta-de-saida> http://127.0.0.1:8765/jogo/index.html msedge
node jogo/tests/e2e-dialogos.js <pasta-de-saida> http://127.0.0.1:8765/jogo/index.html msedge
node jogo/tests/e2e-identidade.js <pasta-de-saida> http://127.0.0.1:8765/jogo/index.html msedge
```
- Os testes de navegador precisam do Playwright (`playwright-core`), que **não** faz parte do projeto, e de um servidor local rodando.
- Resultados e decisões estão em:
  - `docs/RELATORIO_OPERACAO_MADRUGADA.md` (jogo);
  - `docs/RELATORIO_SISTEMA_DIALOGOS.md` (diálogos, Maria e Sirius);
  - `docs/RELATORIO_OPERACAO_NOVA_IDENTIDADE.md` (cenário, HUD, lugares, pontos de interesse, vida no lago).

## Publicar no GitHub Pages
O site é o **repositório inteiro**, publicado a partir da raiz da branch `main`. O jogo usa arquivos de fora de `jogo/`:
- `../prototipos/p1-pesca`: Phaser e lógica;
- `../arte/`: spritesheets;
- as folhas `.jpg` da raiz.

Por isso nada pode ser movido nem deixado de fora. Todos os caminhos são relativos e funcionam no subcaminho `/Hangover-Fishing/`.

**1. Commit e envio (GitHub Desktop):**
- confira que todas as alterações estão marcadas, inclusive os arquivos novos;
- faça "Commit to **main**" e depois "**Push origin**".

**2. Ativar o Pages** (só na primeira vez), no github.com, no repositório `daikiihype/Hangover-Fishing`:
- **Settings → Pages → Build and deployment → Source: "Deploy from a branch" → Branch: `main`, pasta `/ (root)` → Save**;
- em 1 a 3 minutos o site fica em **https://daikiihype.github.io/Hangover-Fishing/**;
- o andamento aparece em **Actions** ("pages build and deployment").

**3. Atualizar:** é só fazer commit e push de novo. O Pages pode guardar a versão anterior por até ~10 minutos (cache). Se algo parecer velho, recarregue a página.

**Arquivos de publicação na raiz:**

| Arquivo | Para quê |
|---|---|
| `index.html` | leva ao jogo e mantém parâmetros como `?entardecer=1` |
| `.nojekyll` | o Pages publica os arquivos como estão, sem o processador Jekyll |

**Testar antes de publicar**, simulando o Pages no computador (subcaminho, maiúsculas e minúsculas, só arquivos do repositório):
```
node jogo/tests/servidor-pages.js 8790
node jogo/tests/e2e-publicacao.js <pasta-de-saida> http://127.0.0.1:8790/Hangover-Fishing/
```
Com o simulador ligado, os outros testes de navegador também podem usar o endereço `http://127.0.0.1:8790/Hangover-Fishing/jogo/index.html`. Assim eles conferem o jogo no subcaminho.

Detalhes, testes e limitações: `docs/RELATORIO_PREPARACAO_PUBLICACAO.md`.

## Parâmetros opcionais no endereço
- `?seed=1234`: sorteios repetíveis (testes).
- `?dpr=2`: força a densidade do canvas. O padrão é a densidade do aparelho, até 3.
- `?entardecer=1`: começa a partida já no pôr do sol (para ver a variação de luz sem esperar).
