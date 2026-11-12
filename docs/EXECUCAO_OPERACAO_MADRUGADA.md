# Operação Madrugada — documento de execução

**Data:** 12/11/2026 · **Missão:** construir uma versão jogável, integrada e testável (menu vertical, 1 e 2 jogadores, personagens, regiões, iscas, catálogo, diálogos e opções).
**Natureza:** plano interno de trabalho, escrito antes da implementação. O resultado final está em `docs/RELATORIO_OPERACAO_MADRUGADA.md`.

## 1. Estado real do projeto (auditoria)

| Item | Onde | Situação |
|---|---|---|
| Lógica de pesca (máquina de estados, tensão, resultados) | `prototipos/p1-pesca/src/logic/` | Validada pelo criador em sessões de ~30 min. **Fonte original** |
| Entrada multitouch (posse do toque por metade) | `prototipos/p1-pesca/src/input/` | **Cópia fiel** de `prototipos/p0-multitouch/src/input/` (o teste R5 do P1 confere) |
| Sons sintetizados (WebAudio) | `prototipos/p1-pesca/src/audio/Sfx.js` | Temporários, sem arquivos de áudio. Sem controle de volume nem música |
| Cena greybox do P1 | `prototipos/p1-pesca/src/scenes/FishingScene.js` | Layout para personagens pequenos (×1) |
| Personagens integrados | `prototipos/p1-personagens/` | Aprovado pelo criador ("gostou bastante"). `CharacterAnimator` só lê a lógica |
| Seis animações aprovadas | `arte/personagens-animacoes/*/` | Spritesheets 96 × 96 e JSONs com tempos e pontos |
| Logo, peixes, iscas, objetos, cenário | `logo.jpg`, `arte 1/2/3.jpg`, `peixes*.jpg` (raiz) | JPEG com o **xadrez desenhado dentro da imagem** (sem alfa). A `arte 3.jpg` tem peixes **com nome** (Tilápia, Carpa, Traíra, Bagre, Lambari, Tucunaré, Dourado…); a `arte 2.jpg` tem iscas e objetos |
| Plano de regiões | `docs/PLANO_REGIOES_DE_PESCA.md` | Estudo com simulação; agora autorizado em versão experimental |
| Música, catálogo, iscas, menu, opções, diálogos | — | **Não existem** |

## 2. Arquitetura escolhida

Uma versão nova em **`jogo/`**, que **reaproveita por referência** (sem copiar nem alterar):
- a lógica, a entrada e o som do P1 (`../prototipos/p1-pesca/src/...`);
- o animador dos personagens (`../prototipos/p1-personagens/src/visual/CharacterAnimator.js`);
- os spritesheets e JSONs aprovados (`../arte/personagens-animacoes/...`);
- as folhas JPEG do criador, **recortadas em tempo de execução** (o xadrez é removido na memória; os arquivos não são tocados).

Camadas novas:
- **Lógica (sem Phaser, testável no Node):**
  - `PescadorRegional`, uma subclasse do `FishingPlayer` que troca só **as tabelas** dos sorteios (espera, espécie e peso) conforme a região de pouso, a isca e as espécies. A máquina de estados é a mesma; com as regiões desligadas e a isca neutra, o sorteio é **idêntico** ao do P1;
  - `SessaoJogo`, uma subclasse da `FishingSession` (1 ou 2 jogadores);
  - catálogo, diálogos e opções.
- **Visual (Phaser 3.90):**
  - cena de carga, que faz os recortes;
  - cena do mar, fundo animado do menu;
  - cena da partida, com novo layout, personagens maiores, regiões, diálogos e cartões.
- **Interface (DOM sobre o canvas):** telas verticais (menu, preparação, catálogo, opções), "gire o aparelho", pausa e resumo. Botões e controles reais (acessíveis e testáveis).
- **Canvas em resolução do aparelho** (densidade de tela), para a pixel art ficar nítida (o P1 é ampliado pelo navegador).

## 3. Arquivos protegidos (não alterar)
- `prototipos/p0-multitouch/**`, `prototipos/p1-pesca/**`, `prototipos/p1-personagens/**`.
- `arte/**`: spritesheets, quadros, JSONs, geradores e READMEs.
- Imagens da raiz (`*.jpg`) e documentos existentes. O GDD e os planos não serão reescritos; decisões novas vão nos documentos novos.
- Controle: hash SHA-256 de todos esses arquivos antes e depois.

## 4. Riscos identificados
| Risco | Mitigação |
|---|---|
| Quebrar o ritmo validado | As águas abertas e a isca minhoca reproduzem **exatamente** o P1 (teste de igualdade de registros); regiões com liga/desliga |
| Recorte de JPEG com sobras de xadrez | Preenchimento a partir das bordas só sobre tons claros e pouco saturados; contorno escuro dos desenhos protege o interior; inspeção visual |
| Orientação (menu vertical × partida horizontal) | Tentativa de travar a orientação em tela cheia (Android); se não der, tela "gire o aparelho" que nunca prende o jogo |
| Diálogos e cartões cobrindo o jogo | Áreas reservadas no layout (cartões no alto da água da metade do jogador; diálogos no centro, longe das boias e dos personagens); verificação por teste |
| Personagens maiores × água | Layout refeito para a escala maior (margem mais alta, água redistribuída) |
| Excesso de sistemas | Ordem de prioridade da missão; cada etapa termina jogável |

## 5. Sequência de implementação
1. Estrutura `jogo/`, inicialização, cena de carga (recortes) e navegação entre telas.
2. Menu vertical com o mar animado, o logo e os personagens.
3. Preparação da partida (1 ou 2 jogadores, iscas) e transição para a horizontal.
4. Cena da partida: lógica do P1 + personagens maiores + layout novo + cartões + pausa e volta ao menu.
5. Diálogos centrais.
6. Regiões (lógica + indicadores visuais) e isca por jogador.
7. Catálogo com registro local de capturas.
8. Opções (volumes, música, efeitos, regiões) com áudio real.
9. Testes (Node e navegador), balanceamento por simulação, correções.
10. README, script para iniciar o servidor e relatório final.
