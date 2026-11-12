# P1 com personagens — integração das seis animações

**Status:** **INTEGRAÇÃO ENTREGUE — AGUARDANDO AVALIAÇÃO DO CRIADOR.** Não aprovada.
**Data:** 12/11/2026 · **Base:** Protótipo P1 (`prototipos/p1-pesca/`, **sem nenhuma alteração**) + as seis animações aprovadas (`arte/personagens-animacoes/`)

## Como abrir

1. Sirva a pasta **Hangover Fishing** inteira em um endereço local. Por exemplo, na pasta do projeto:
   `py -m http.server 8765 --bind 127.0.0.1`
2. Abra no navegador ou no celular: `http://127.0.0.1:8765/prototipos/p1-personagens/index.html`
   - No celular, troque `127.0.0.1` pelo IP do computador na rede e use `--bind 0.0.0.0`.
   - **Não funciona abrindo o arquivo direto (`file://`):** os spritesheets precisam ser carregados por um servidor.
3. **Parâmetros opcionais:**
   - `?escala=1`, `?escala=2` ou `?escala=3`: escala dos personagens (ver "Escala" abaixo);
   - `?seed=1234` e `?diag=1`: os mesmos do P1.

O jogo é o P1: a metade esquerda é o **Alemão**, e a metade direita é o **ALE**. Segure para carregar e solte para arremessar. Quando a boia afundar, faça um toque novo para fisgar. Na briga, segure para recolher e solte para aliviar.

## Arquitetura

O "jogo" hoje é o próprio P1; não existe outra cena jogável. Para integrar sem reescrever nem alterar o P1, esta página **reaproveita os arquivos do P1 por referência** e acrescenta só uma camada visual:

```
index.html ─┬─ ../p1-pesca/  (Phaser, entrada, lógica, som, menu, diagnóstico, cena e main.js — sem alterações)
            ├─ src/visual/CharacterAnimator.js     NOVO: qual animação e qual quadro cada personagem mostra
            └─ src/scenes/CharacterFishingScene.js NOVO: subclasse da cena do P1; troca o boneco cinza pelo sprite
```

- **`CharacterAnimator`** (um por jogador; JavaScript puro, sem Phaser):
  - recebe as transições de estado do P1 (evento `estado` da sessão) e, a cada quadro, o `snapshot()` do jogador;
  - decide a animação, o quadro, os tempos, os loops e as poses mantidas;
  - **só lê**: nunca chama `press`, `release` ou `update`, nem muda prazos, configuração ou estados;
  - todos os tempos, índices e pontos (ponta da vara, mão) vêm dos **JSONs aprovados**.
- **`CharacterFishingScene`** (subclasse de `FishingScene` do P1):
  - carrega os 12 spritesheets e os 6 JSONs;
  - cria um sprite por jogador (`setOrigin(0.5, 1)`, escala inteira, filtro nítido, ALE com `flipX`);
  - no `drawPlayer` troca só o pescador cinza e a vara desenhada pelo sprite;
  - a linha de pesca sai da **ponta da vara do quadro atual**.

  Placar, água, boia, briga, medidor, cartões, sons, pausa e toques continuam sendo o código do P1.
- O `main.js` do P1 cria o jogo com `HF.FishingScene`. Nesta página, esse nome aponta para a subclasse (`HF.P1FishingScene` guarda a original).
- **Independência:** cada jogador tem o próprio animador, o próprio sprite e o próprio sorteio do piscar. As transições de um nunca chegam ao outro.
- **Relógio visual:**
  - é tempo de jogo: para em qualquer pausa (menu, retrato, interrupção) e é limitado a 250 ms por quadro, como a simulação do P1;
  - uma transição no meio de um quadro de tela conta só o tempo depois dela.
- **Rede de segurança:** se uma transição se perder (por exemplo, "Reiniciar sessão" no meio da briga), o animador se ressincroniza com o estado real no quadro seguinte. Nenhuma animação fica presa.

## Estado do P1 → animação

| Estado / transição do P1 | O que o personagem mostra | Fonte |
|---|---|---|
| `IDLE`, `WAITING`, `BITE` | **IDLE** em loop (700/500/700/500 ms) e **piscar** de 100 ms a cada 3–6 s, só nos quadros 1 e 3, aos 300 ms do quadro, com sorteio próprio para cada personagem | `idle.json` |
| `CHARGING` | **CHARGE**: quadros 1 e 2 (100 ms cada) e depois o quadro pela força atual (0–33 % → 3, 34–66 % → 4, 67–100 % → 5) | `charge.json` |
| `CHARGING` → `IDLE` (toque curto ou interrupção) | Cancelamento 2 → 1 (60 ms cada) → IDLE | `charge.json` |
| `CASTING` | **CAST**: 5 quadros com os tempos da faixa de força da soltura → IDLE (enquanto a boia ainda voa). A boia aparece na ponta da vara do quadro de soltura, 90/110/130 ms depois da soltura, e cai na água no **mesmo instante da lógica** | `cast.json` |
| `BITE` → `FIGHTING` (fisgada) | **Quadro 9** (nível 3, posição 1) por **100 ms**; depois, o nível da tensão, na posição 2 se o jogador já estiver segurando | `reel_fight.json` → `fisgada` |
| `FIGHTING` | **REEL/FIGHT**: o nível segue a zona de tensão a cada quadro (frouxa 1 · segura 2 · alerta 3 · crítica 4), com troca imediata que **preserva a posição da manivela**. A manivela gira (90 ms por posição) **só enquanto o jogador segura**; ao soltar, **para** | `reel_fight.json` |
| `REELING_EMPTY` | REEL/FIGHT, nível 1, começando **sempre na posição 1** | `reel_fight.json` → `completarAVolta` |
| `REELING_EMPTY` → `WAITING` ou `IDLE` | **Completar a volta:** a manivela gira até a posição 1 (no máximo 270 ms), e o IDLE vem no quadro seguinte. Se o jogador voltar a segurar, o giro continua da posição atual. Uma fisgada ou carga nova troca na hora. A lógica não espera nada | idem |
| `CAUGHT` | **CATCH**: 1 → 2 → 3 (150/150/200 ms) e o **quadro 4 parado durante todo o cartão de 2,2 s**. O peixe aparece na mão da frente a partir do quadro 2 | `catch.json` |
| `CAUGHT` → `IDLE` (fim do cartão) | Saída 4 → 2 → 1 (100 ms cada) → IDLE | `catch.json` → `saida` |
| `ESCAPED` (fuga ou mordida perdida), `LINE_BROKEN` | **FRUSTRATION**: 1 → 2 (150/200 ms) e o **quadro 3 parado durante o cartão de 1,6 s**. A linha partida sai da ponta da vara do quadro atual | `frustration.json` |
| `ESCAPED` / `LINE_BROKEN` → `IDLE` | Saída 2 → 4 (100 ms cada) → IDLE | `frustration.json` → `saida` |
| Cartão pulado (toque após 0,6 s) | **CHARGE no mesmo quadro**, sem tocar a saída | plano, seção 4 |

## Escala (D10, em aberto)

- **Padrão:** a maior escala inteira em que o personagem (64 px do topo da cabeça até a base do quadro) cabe na altura que o layout do P1 reserva para o pescador (≈ 18,5 % da altura da tela).
  - Celular na horizontal (~390 px de altura): **×1**.
  - Telas mais altas: ×2 ou ×3.
- **Por que não ×2 no celular:** em ×2, o personagem tem 128 px e entra no espaço do cartão de resultado do P1.
  - Na CATCH, o cartão **cobre a cabeça e o braço erguido** e a dica "(toque e segure…)" passa sobre o rosto (`capturas/escala2_04_…`).
  - Usar ×2 pede uma mudança de layout (cartão, chão ou posição dos personagens), que pertence à etapa de layout lateral (D10). Ela não foi feita aqui.
- `?escala=2` permite comparar.

## Testes

| Teste | Como rodar | Resultado |
|---|---|---|
| Animador × máquina de estados real do P1 (Node) | `node prototipos/p1-personagens/tests/animador.test.js` | **27 de 27** |
| Personagens no navegador (Edge, celular emulado 844 × 390, multitouch) | `node prototipos/p1-personagens/tests/e2e-personagens.js <saída> <endereço> msedge` | **31 de 31** (×1) · 30 de 31 em `?escala=2`; a única falha é o cartão cobrindo a CATCH (acima) |
| Regressão: e2e do P1 **na página integrada** | `node prototipos/p1-pesca/tests/e2e-navegador.js <saída> http://…/p1-personagens/index.html msedge` | **42 de 42**, as mesmas verificações e resultados do P1 original |

O que os testes cobrem (detalhes nos arquivos de teste):
- **Lógica intacta:** o mesmo roteiro, com e sem animador, gera registros de eventos e estatísticas **idênticos**.
- **Pixels:** o canvas do Phaser, comparado pixel a pixel com o spritesheet aprovado:
  - IDLE dos dois e CATCH (fora da área do peixe): 100 % idênticos;
  - 0 pixels semitransparentes;
  - sola na linha 94; os dois no mesmo chão; os sprites nunca saem do lugar.
- **Simultaneidade:** o Alemão em `FIGHTING` enquanto o ALE passa por `IDLE`, `CHARGING` e `CASTING`; cada estado com a animação certa nos dois.
- **Fisgada:** o quadro 9 aparece no **primeiro quadro de tela** em `FIGHTING`, por ~100 ms.
- **Briga:** o nível acompanha a zona de tensão em todos os quadros; a posição da manivela é preservada; soltar para a manivela.
- **Resultados:**
  - CATCH com a pose final parada por todo o cartão e saída 4 → 2 → 1;
  - FRUSTRATION com linha rompida, fuga e mordida perdida;
  - cartão pulado vai direto ao CHARGE.
- **Completar a volta:** início na posição 1; soltura em várias posições; conclusão; retomada durante a finalização; carga e fisgada durante a finalização.
- **Interrupções:**
  - perda de foco e página oculta congelam os personagens, e tudo volta a andar depois do toque de retomada;
  - menu aberto e "Reiniciar sessão" no meio da briga não deixam nenhuma animação presa.
- **Carregamento:** os 12 spritesheets, com o número certo de quadros; nenhum erro de JavaScript nem arquivo faltando.

As capturas de tela da partida de teste estão em `capturas/`.

## Limitações e pontos para avaliação

1. **Escala ×1 no celular (D10).** Os personagens têm o mesmo tamanho do pescador cinza do P1. Em ×2, eles colidem com os cartões (ver "Escala").
2. **Nitidez em telas de alta densidade.** O canvas do P1 tem a resolução de CSS (`Phaser.Scale.RESIZE`, sem `pixelArt`), e o navegador o amplia com suavização para a densidade da tela. Isso deixa as bordas dos pixels levemente suaves, como já acontece com todo o resto do P1. Corrigir exige mudar a configuração do jogo no `main.js` do P1, o que não foi feito.
3. **Peixe na mão (CATCH):**
   - é uma **silhueta provisória**, desenhada pelo jogo como pede o plano;
   - tem a cor do perfil (a mesma do cartão do P1) e o tamanho pelo peso (8–18 px do quadro);
   - fica pendurada da mão para baixo e para fora.

   O peixe definitivo, a partir das folhas de peixes, ainda não existe como sprite.
4. **Anel "estou pressionando".** O P1 desenhava um anel branco em volta da mão do pescador cinza. Ele foi mantido em volta da mão da frente do sprite e, em ×1, cobre o molinete enquanto o jogador segura.
5. **Saltos de entrada já documentados nas animações aprovadas:** CATCH e FRUSTRATION começam a partir de qualquer posição da manivela. A integração segue a regra aprovada: nenhuma espera, para não atrasar a reação.
6. **Cancelamento do CHARGE durante a preparação:** se o toque termina ainda no quadro 1 (antes de 100 ms), a volta mostra só o quadro 1 (60 ms) em vez de 2 → 1, para a vara não ir para trás e voltar.
7. **Teste em celular real:** ainda não foi feito. Os testes rodaram no Edge com emulação de celular.
