# HANGOVER FISHING
## Plano Técnico — Protótipo 0: Teste de Multitouch

**Versão do plano:** 1.0
**Data:** 07/11/2026
**Referência:** GDD v0.6, seção 16.4
**Status:** **[PROTÓTIPO]** — plano **aprovado pelo criador** em 07/11/2026, incluindo a pasta `prototipos/p0-multitouch/`. Implementação aguarda missão específica.

---

## 1. Objetivo

Validar, **antes de qualquer mecânica de pesca**, que dois jogadores conseguem usar o mesmo celular ao mesmo tempo, cada um com sua zona de controle, sem que um interfira no outro.

O teste responde a uma única pergunta:

> **Duas pessoas conseguem tocar, segurar e soltar ao mesmo tempo, em metades diferentes da tela, com cada comando reconhecido corretamente, em celulares reais?**

O que este teste **não** é:
- Não tem pesca, peixes, tensão nem pontuação.
- Não usa retratos, sprites, cenário nem áudio final.
- Não é a base definitiva do jogo. É um protótipo descartável; o que se aproveita é o **conhecimento** e, possivelmente, o módulo de entrada (ver seção 2.4).

---

## 2. Viabilidade com Phaser 3 e JavaScript

### 2.1. Conclusão

**Viável.** O Phaser 3 tem suporte nativo a vários toques simultâneos. Cada dedo vira um *pointer* (ponteiro), com identificador próprio, posição e estado (pressionado ou solto). O trabalho do protótipo não é "fazer o multitouch funcionar", e sim **organizar a posse de cada dedo** e **neutralizar os gestos do navegador** que atrapalham.

### 2.2. Conceitos que o teste vai exercitar

**Ponteiros (pointers).** Por padrão, o Phaser reserva poucos ponteiros de toque. É preciso configurar explicitamente a quantidade, por exemplo 4: dois jogadores, com margem para um dedo extra ou a palma da mão.

**Posse do toque (pointer ownership)** — a regra central do teste:
- Um dedo pertence à zona **onde começou a tocar**.
- Ele continua pertencendo a essa zona até ser solto, **mesmo se arrastar para a outra metade**.
- Assim, um jogador que escorrega o dedo para o meio da tela não "rouba" o controle do outro.

**Estado da zona:**
- Uma zona está "pressionada" enquanto tiver **pelo menos um** dedo que pertença a ela.
- Se o jogador usar dois dedos na mesma zona, ela continua pressionada até o último ser solto.

**Toque × segurar:** o mesmo gesto tem dois significados no jogo (tocar para fisgar; segurar para arremessar ou recolher). A distinção é feita por **tempo**:
- Pressionado e solto antes de um limiar → **toque**.
- Pressionado por mais que o limiar → **segurar**.
- O limiar exato será **medido no teste** (ponto de partida a avaliar: entre 150 e 250 ms).

**Cancelamento:** o sistema pode interromper um toque sem que o dedo seja solto (notificação, chamada, gesto do sistema, troca de aplicativo). Nesses casos o navegador envia um evento de **cancelamento**. O protótipo precisa tratá-lo como "soltar", senão a zona fica **presa** como pressionada.

### 2.3. Orientação horizontal

- **Não é possível forçar a orientação** em uma página comum, principalmente no Safari do iPhone.
- A solução padrão é **detectar a orientação** e, em retrato, mostrar uma tela "Gire o celular", pausando o jogo.
- No Android, a orientação pode ser travada quando o jogo está em **tela cheia** ou instalado como aplicativo web (PWA). Isso fica para depois do protótipo.

### 2.4. O que pode ser aproveitado depois

O módulo de entrada (zonas, posse de toque, toque × segurar, cancelamento) é exatamente o que o jogo final vai usar. Se for escrito de forma isolada, ele pode ser **reaproveitado** no protótipo de pesca. Todo o resto (visual, painel de diagnóstico) é descartável.

---

## 3. Estrutura técnica sugerida

### 3.1. Princípios
- **Sem ferramentas de build** (sem npm, sem bundler). HTML + CSS + JavaScript puro, editável no VS Code.
- **Phaser 3 incluído como um único arquivo**, de preferência uma **cópia local** com a versão fixada (sem depender de internet durante o teste). Alternativa: CDN com versão exata.
- **Código modular:** cada responsabilidade em um arquivo.
- **Visual em greybox:** retângulos, círculos e texto.

### 3.2. Arquivos que seriam necessários

```
Hangover Fishing/
├── docs/                              (já existe)
│   └── PLANO_PROTOTIPO_MULTITOUCH.md  (este documento)
└── prototipos/
    └── p0-multitouch/
        ├── index.html                 Página que carrega tudo; configura a viewport para celular
        ├── style.css                  Bloqueio de zoom, rolagem, seleção de texto e menu de toque longo
        ├── lib/
        │   └── phaser.min.js          Phaser 3 (versão estável fixada, cópia local)
        ├── src/
        │   ├── main.js                Configuração do Phaser (tamanho, escala, nº de ponteiros) e cenas
        │   ├── input/
        │   │   └── PlayerZone.js      Zona de um jogador: posse de toques, toque × segurar, cancelamento
        │   └── scenes/
        │       ├── OrientationScene.js  Aviso "Gire o celular" em modo retrato
        │       └── MultitouchTestScene.js  As duas zonas, feedback visual e painel de diagnóstico
        └── RESULTADOS.md              Registro dos testes por aparelho (preenchido durante os testes)
```

| Arquivo | Responsabilidade | Aproveitável no jogo? |
|---|---|---|
| `index.html` | Estrutura da página, meta viewport, carregamento dos scripts | Parcialmente |
| `style.css` | Desativar gestos do navegador sobre o jogo | Sim |
| `lib/phaser.min.js` | Biblioteca | Sim |
| `src/main.js` | Configuração do jogo | Parcialmente |
| `src/input/PlayerZone.js` | **Núcleo do teste** | **Sim** |
| `src/scenes/OrientationScene.js` | Aviso de orientação | Sim |
| `src/scenes/MultitouchTestScene.js` | Tela de teste e diagnóstico | Não (descartável) |
| `RESULTADOS.md` | Evidência dos testes | Documentação |

A pasta `prototipos/` separa claramente o experimento do futuro código do jogo. **[PROPOSTA]**

### 3.3. O que a tela de teste mostra

**Para cada metade (Alemão à esquerda, ALE à direita):**
- A zona inteira acende quando está pressionada (cor da vara: vermelho / amarelo).
- O estado atual: `livre`, `pressionado`, `segurando`.
- Contadores: toques, segurares, cancelamentos.
- Duração do segurar atual.
- Quantidade de dedos ativos na zona.

**Painel de diagnóstico (texto pequeno no centro ou no topo):**
- Quadros por segundo (FPS).
- Orientação e tamanho da tela.
- Lista dos últimos eventos (`P1 toque`, `P2 segurar 1,4 s`, `P1 cancelado`).
- Botão para zerar os contadores.

**Mini-teste de reação (opcional, temporário):**
- Um círculo em cada metade acende em momentos aleatórios. O jogador toca assim que acender, e o protótipo registra o tempo de reação.
- Serve para medir se o toque "sente" imediato e para simular o futuro sinal de mordida da boia.

---

## 4. Principais riscos técnicos

| # | Risco | Impacto | Mitigação prevista |
|---|---|---|---|
| R1 | **Gestos do navegador** (zoom com dois dedos, toque duplo para zoom, rolagem, "puxar para atualizar", seleção de texto, menu de toque longo) interferem no jogo | Alto | CSS `touch-action: none`, bloqueio de seleção e de menu de contexto, viewport sem zoom; testar especificamente no Safari do iPhone, que ignora parte dessas regras |
| R2 | **Gestos do sistema nas bordas** (voltar deslizando da lateral, barra de início do iPhone, notificações do topo) | Médio | Medir se os toques perto das bordas são capturados; se necessário, definir uma margem interna nas zonas |
| R3 | **Zona presa como pressionada** após interrupção | Alto | Tratar o cancelamento como soltura; zerar o estado quando a página perde o foco ou fica oculta |
| R4 | **Limite de toques simultâneos** do aparelho (alguns Android baratos detectam só 2) ou "rejeição de palma" descartando toques | Médio | Testar em um aparelho simples; registrar o máximo de toques detectados |
| R5 | **Confusão entre toque e segurar** | Médio | Medir a taxa de erro com o limiar escolhido; ajustar |
| R6 | **Dedo atravessando o meio da tela** | Médio | Regra de posse do toque (seção 2.2) |
| R7 | **Orientação não pode ser travada** em navegador comum | Baixo | Tela "Gire o celular"; travar só em tela cheia/PWA no futuro |
| R8 | **Recortes de tela (notch) e áreas seguras** em modo horizontal | Baixo | Respeitar as áreas seguras do CSS; evitar informação importante nas bordas |
| R9 | **Tela cheia indisponível no iPhone** (o Safari do iPhone não permite tela cheia em páginas comuns) | Baixo | Aceitar barras do navegador no protótipo; avaliar "Adicionar à tela de início" depois |
| R10 | **Acesso do celular ao protótipo**: o arquivo aberto direto do computador não funciona no celular | Médio | Servir a pasta pela rede local (ex.: extensão Live Server do VS Code ou servidor simples), com computador e celular no mesmo Wi-Fi; alternativa: publicar em um endereço HTTPS temporário |
| R11 | **Vibração indisponível no iPhone** (relevante para feedback futuro) | Baixo | Não depender de vibração; apenas registrar se funciona em cada aparelho |
| R12 | **Desempenho** em aparelhos fracos | Baixo | Cena mínima; monitorar FPS |

---

## 5. Plano de testes

### 5.1. Aparelhos

| Prioridade | Aparelho | Navegador |
|---|---|---|
| Obrigatório | Pelo menos 1 celular Android | Chrome |
| Obrigatório | O celular que a família realmente vai usar para jogar | Navegador padrão |
| Recomendado | 1 iPhone, se disponível | Safari |
| Desejável | 1 Android simples/antigo | Chrome |

Registrar para cada aparelho: modelo, sistema, navegador, tamanho da tela.

### 5.2. Casos de teste

| ID | Caso | Como executar | O que observar |
|---|---|---|---|
| T1 | Orientação | Abrir em retrato e girar para horizontal e de volta | Aviso em retrato; zonas em horizontal; nada quebra ao girar |
| T2 | Toque simples por lado | 50 toques na esquerda e 50 na direita, um jogador por vez | Cada toque contado na zona certa |
| T3 | Segurar por lado | Segurar 3 s em cada lado, 10 vezes | Classificado como "segurar"; duração correta |
| T4 | Segurar simultâneo | Os dois seguram juntos por 10 s, 10 vezes | Ambas as zonas ativas o tempo todo |
| T5 | Segurar + toques do outro | P1 segura enquanto P2 toca 20 vezes rapidamente (e vice-versa) | O segurar não é interrompido; os 20 toques são contados |
| T6 | Toques simultâneos | Contagem "3, 2, 1, já" e os dois tocam juntos, 20 vezes | Os dois toques registrados |
| T7 | Arrastar pelo meio | Pressionar na esquerda, arrastar até a direita, soltar | O toque continua sendo da esquerda; a direita não reage |
| T8 | Soltar fora da tela | Pressionar e deslizar o dedo para fora da borda | A zona é liberada |
| T9 | Interrupções | Durante um segurar: receber notificação, trocar de app, bloquear a tela | Nenhuma zona fica presa ao voltar |
| T10 | Toque × segurar | 40 gestos alternados e anotados (toque, segurar, toque…) | Taxa de classificação correta |
| T11 | Gestos do navegador | 2 minutos tocando e segurando rápido com os dois jogadores, incluindo pinça e toque duplo | Sem zoom, rolagem, seleção, menu ou recarregamento |
| T12 | Dedos extras | Um jogador usa 2 dedos; depois 3 a 5 dedos na tela | O estado das zonas continua coerente; registrar o máximo detectado |
| T13 | Bordas | Toques junto às bordas laterais, superior e inferior | Toques capturados; nenhum gesto do sistema disparado sem querer |
| T14 | Resistência | Uso contínuo por 10 minutos | FPS estável; sem travamento nem aquecimento anormal |
| T15 | Sessão real | Duas pessoas usam o mini-teste de reação por 5 minutos | Opinião dos dois: o controle parece imediato e justo? Mãos se atrapalham? |

### 5.3. Registro

Cada caso é anotado em `RESULTADOS.md`: aparelho, resultado (passou / falhou / parcial), números medidos e observações. Falhas recebem uma descrição do que aconteceu e, se possível, uma gravação de tela.

---

## 6. Critérios objetivos de sucesso

O teste é considerado **bem-sucedido** quando, **em pelo menos 2 aparelhos reais** (incluindo o celular que será usado para jogar):

| # | Critério | Meta |
|---|---|---|
| C1 | Toques simples atribuídos à zona correta (T2) | **100%** (100 de 100) |
| C2 | Segurar não interrompido por toques do outro jogador (T5) | **0 falhas** em 20 repetições por lado |
| C3 | Toques simultâneos registrados nas duas zonas (T6) | **≥ 95%** (19 de 20) |
| C4 | Arrasto pelo meio não troca a posse (T7) | **0 falhas** em 10 tentativas |
| C5 | Zonas presas após interrupção (T9) | **0** em 5 tentativas de cada tipo |
| C6 | Classificação correta de toque × segurar (T10) | **≥ 95%** com o limiar escolhido |
| C7 | Gestos indesejados do navegador (T11) | **0** ocorrências em 2 minutos |
| C8 | Desempenho (T14) | **≥ 55 FPS** médio, sem travamentos perceptíveis |
| C9 | Avaliação dos dois jogadores (T15) | Os dois respondem "sim" a: "o controle respondeu na hora?" e "você foi atrapalhado pelo outro?" → "não" |

**Resultados possíveis:**
- **Aprovado:** todos os critérios atendidos → avançar para o protótipo de pesca (Fase A).
- **Aprovado com ressalvas:** C1 a C5 atendidos, mas falhas em C6 a C9 → ajustar (limiar, margens, tamanho das zonas) e repetir só os casos afetados.
- **Reprovado:** falha em C1 a C5 → rever a abordagem de controle antes de seguir. Exemplos: zonas menores na parte inferior, em vez de metades inteiras; restrição de aparelhos.

---

## 7. Decisões que o teste vai alimentar

- Tamanho e posição das zonas de toque (pendência do GDD).
- Limiar entre toque e segurar.
- Necessidade de margens internas nas bordas.
- Aparelhos e navegadores mínimos suportados.
- Forma de distribuir o protótipo para teste (rede local × endereço HTTPS).

Preparação para teste futuro (fora do escopo do Protótipo 0): o painel de diagnóstico registra o início e o fim de cada toque. Esses dados ajudarão a avaliar depois a mecânica "soltar e tocar de novo dentro da janela de mordida" (GDD, seção 20, S1).

---

## 8. Estimativa de esforço

Pequena. O protótipo cabe em poucos arquivos curtos. O maior custo de tempo está nos **testes em aparelhos reais**, não na programação.
