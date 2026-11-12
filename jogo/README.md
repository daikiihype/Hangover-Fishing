# Hangover Fishing — versão jogável (Operação Madrugada)

**Status:** versão de **teste**, entregue para a avaliação do criador (12/11/2026). Não é uma versão final nem pronta para publicação.
**O que é:** o jogo completo em volta da pesca do P1:
- menu vertical com o logo e o mar;
- partidas de 1 ou 2 jogadores na horizontal, com os personagens animados aprovados;
- regiões de pesca e iscas;
- catálogo e guia;
- diálogos e opções.

O P0, o P1 e o P1 com personagens continuam intactos e acessíveis em `prototipos/`.

## Como abrir

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
5. **Regiões:** a força do arremesso decide onde a boia cai.

   | Arremesso | Região | O que esperar |
   |---|---|---|
   | Curto (segurando até a força voltar) | **Margem** | Mais mordidas, peixes menores, brigas curtas |
   | Médio | **Águas abertas** | Exatamente o jogo do P1 (referência) |
   | Longo | **Águas profundas** | Espera maior, peixes pesados e mais fortes, brigas longas |

   - A cor do alvo e da barra de força mostra a região enquanto você carrega.
   - O nome da região aparece na boia quando ela cai.
   - A região é a do **pouso**: recolher a linha não muda a região.
6. **Iscas:** Minhoca (versátil), Massa (muitas mordidas, peixes pequenos e carpas), Isca artificial (só predadores; é a única que traz Tucunaré e Dourado), Coração de galinha (bagres e carpas, mordidas mais lentas). Elas podem ser trocadas na **pausa** e valem a partir do próximo arremesso.
7. **Pausa (botão II no alto):** continuar, recomeçar, sair para o menu (com o resumo da pescaria), trocar isca, ligar ou desligar regiões, música e efeitos.
8. **Catálogo:**
   - fichas de cada peixe, com raridade, regiões, iscas recomendadas, melhor chance, dificuldade, dica e situação (descoberto ou não, quantidade e maior exemplar);
   - guia das regiões e das iscas;
   - objetos estranhos já pescados.

   O registro fica salvo no navegador.

## Estrutura
```
jogo/
  index.html                 página (telas em DOM + canvas do Phaser)
  estilo.css                 identidade visual (cores do logo, botões de madeira)
  src/logica/                SEM Phaser (testável no Node)
    DadosPesca.js            espécies, objetos, iscas e regiões (tabelas)
    PescadorRegional.js      FishingPlayer do P1 + tabelas de região e isca (mesma máquina de estados)
    SessaoJogo.js            FishingSession do P1 com pescadores regionais (1 ou 2 jogadores)
    Armazenamento.js         opções e catálogo no navegador (localStorage, sem servidor)
    Dialogos.js              quando e o que os personagens falam
  src/audio/AudioJogo.js     sons do P1 + volumes + trilha sintetizada (WebAudio, sem arquivos)
  src/visual/Recortes.js     recorta a arte do criador (JPEG) na memória, sem alterar os arquivos
  src/cenas/                 CenaCarga (assets), CenaMar (fundo do menu), CenaPartida (pesca)
  src/ui/Interface.js        telas: menu, preparação, catálogo, opções, girar, pausa, resumo
  src/main.js                inicialização, navegação, orientação e interrupções
  tests/logica.test.js       testes da lógica (inclui regressão contra o P1)
  tests/e2e-jogo.js          teste no navegador (joga de verdade, com dois dedos)
  tests/simulacao-regioes-iscas.js   simulação de balanceamento
  capturas/                  telas da última rodada do teste de navegador (para avaliação)
```

**Reaproveitado por referência, sem cópia nem alteração:**
- `prototipos/p1-pesca/` (Phaser 3.90, entrada multitouch, lógica, sons);
- `prototipos/p1-personagens/src/visual/CharacterAnimator.js`;
- `arte/personagens-animacoes/**` (spritesheets e JSONs aprovados);
- `logo.jpg`, `arte 2.jpg`, `arte 3.jpg`.

## Testes
```
node jogo/tests/logica.test.js
node jogo/tests/simulacao-regioes-iscas.js
node jogo/tests/e2e-jogo.js <pasta-de-saida> http://127.0.0.1:8765/jogo/index.html msedge
```
- O teste de navegador precisa do Playwright (`playwright-core`), que **não** faz parte do projeto, e de um servidor local rodando.
- Resultados e decisões estão em `docs/RELATORIO_OPERACAO_MADRUGADA.md`.

## Parâmetros opcionais no endereço
- `?seed=1234`: sorteios repetíveis (testes).
- `?dpr=2`: força a densidade do canvas. O padrão é a densidade do aparelho, até 3.
