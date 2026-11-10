# Hangover Fishing — Protótipo 0: teste de multitouch

Demonstração técnica que verifica se **dois jogadores conseguem usar o mesmo celular ao mesmo tempo**, cada um na sua metade da tela, sem um interferir no outro.

- **Não é o jogo.** Não tem pesca, peixes, varas, arremesso, fisgada, tensão, personagens nem menus definitivos.
- Usa só elementos temporários: retângulos coloridos, círculos e texto.
- Não usa nenhuma imagem do projeto (os JPEGs originais não foram tocados).

Referências: `docs/PLANO_PROTOTIPO_MULTITOUCH.md` (plano aprovado) e `docs/GDD.md` (seção 16.4).

---

## 1. Arquivos

```
prototipos/p0-multitouch/
├── index.html                      Página: carrega o Phaser, os scripts e o menu de testes
├── style.css                       Bloqueia zoom, rolagem, seleção e menu de toque longo
├── lib/
│   ├── phaser.min.js               Phaser 3.90.0 (cópia local, versão fixada)
│   └── PHASER-LICENSE.md           Licença MIT do Phaser
├── src/
│   ├── main.js                     Inicialização, proteção contra gestos, interrupções, menu
│   ├── input/
│   │   ├── PlayerZone.js           Estado de UMA zona (dedos, toque × segurar, contadores)
│   │   └── TouchRouter.js          Posse dos toques, cancelamentos, rede de segurança, registro
│   ├── scenes/
│   │   ├── MultitouchTestScene.js  Liga o Phaser à lógica e desenha a tela de teste
│   │   └── OrientationScene.js     Aviso "Gire o celular" em modo retrato
│   └── ui/
│       ├── DiagnosticsPanel.js     Painel de diagnóstico (textos na tela)
│       └── TestMenu.js             Menu "☰ TESTES" com o roteiro dos 10 testes
├── tests/
│   ├── logica.test.js              Testes automáticos da lógica (só precisa do Node.js)
│   └── e2e-navegador.js            Teste opcional no navegador com multitouch simulado (requer Playwright)
├── README.md                       Este arquivo
└── RESULTADOS.md                   Onde registrar os testes em celulares reais
```

---

## 2. Arquitetura

```
 dedos na tela
      │
      ▼
 Navegador (eventos touchstart / touchmove / touchend / touchcancel)
      │
      ▼
 Phaser 3 (transforma cada dedo em um "ponteiro" com id próprio)
      │   pointerdown · pointermove · pointerup · pointerdownoutside
      ▼
 MultitouchTestScene  ── só repassa os eventos e desenha a tela
      │
      ▼
 TouchRouter  ── decide o dono de cada toque, trata cancelamentos, registra tudo
      │
      ├──► PlayerZone P1 (Alemão)   estado, dedos, toque × segurar, contadores
      └──► PlayerZone P2 (ALE)
```

### Por que a lógica fica separada do Phaser

`TouchRouter.js` e `PlayerZone.js` não usam nada do Phaser. Isso traz duas vantagens:

1. **Dá para testar sem navegador.** `tests/logica.test.js` roda no Node em menos de um segundo.
2. **Dá para reaproveitar.** O jogo de verdade vai precisar exatamente destas regras. A cena de teste e o painel são descartáveis.

### Os conceitos principais

**Ponteiro.** O Phaser representa cada dedo como um "ponteiro" numerado. Por padrão ele acompanha só **1 toque**; aqui configuramos **4** (`activePointers: 4` em `main.js`): dois jogadores e margem para um dedo extra.

**Posse do toque.** A regra mais importante do protótipo:
- O toque pertence à zona onde **começou** (metade esquerda = P1, direita = P2).
- Se o dedo for arrastado para a outra metade, ele **continua** sendo de quem começou. Na tela aparece um **anel tracejado** e o registro mostra "CRUZOU · posse mantida".
- Nenhum evento muda o dono de um toque.

**Toque × segurar.** Decidido pelo tempo:
- Menos que o limiar (200 ms por padrão) é **toque**.
- Igual ou mais é **segurar**.
- O limiar pode ser ajustado no menu (100 a 500 ms) para encontrar o valor ideal no celular.

**Cancelamento.** Às vezes o sistema interrompe um toque sem o dedo sair da tela (gesto do sistema, notificação, chamada). O navegador avisa com `touchcancel`, e o Phaser marca o ponteiro com `wasCanceled`. O protótipo registra **CANCELADO** e libera a zona.

**Interrupções.** Ao perder o foco, ao ficar oculta (troca de app, tela bloqueada) ou ao girar para retrato, a página encerra **todos** os toques (`cancelAll`). Quando o dedo antigo finalmente sai da tela, esse fim atrasado é absorvido sem gerar erro falso.

**Rede de segurança (`reconcile`).** A cada quadro, o protótipo confere se cada toque registrado ainda tem um dedo pressionado no Phaser. Se não tiver, o toque é liberado à força e registrado como **erro "orfao"**. Assim nenhuma zona fica "presa" mesmo se algum evento se perder.

**Toques fora da área de jogo.** Um toque que começa no botão "☰ TESTES" (fora do canvas) não pertence a ninguém e é ignorado.

---

## 3. Como executar no computador

Serve só para conferir se abre e testar com o mouse. **O mouse é um ponteiro só, então não testa multitouch.**

1. Abra a pasta `prototipos/p0-multitouch/`.
2. Dê dois cliques em `index.html` (ou arraste o arquivo para o navegador).
3. Clique e segure em cada metade: a zona acende e os contadores mudam.

Funciona direto do arquivo, sem servidor, porque o protótipo não carrega imagens nem dados externos.

---

## 4. Como testar no celular

O celular precisa acessar os arquivos que estão no computador. Para isso, o computador vira um **pequeno servidor na rede Wi-Fi da casa**.

### 4.1. Ligar o servidor no computador

Escolha **uma** das opções.

**Opção A — VS Code + extensão Live Server** (você já usa o VS Code)
1. No VS Code, instale a extensão **Live Server** (autor: Ritwick Dey). Ela é do editor, não do projeto.
2. Abra a pasta **Hangover Fishing** no VS Code.
3. Clique com o botão direito em `prototipos/p0-multitouch/index.html` → **Open with Live Server**.
4. O navegador do computador abre um endereço como `http://127.0.0.1:5500/prototipos/p0-multitouch/index.html`. Anote a **porta** (ex.: `5500`).
5. Se o celular não conseguir abrir o endereço no passo 4.3, verifique nas configurações da extensão se o host está liberado para a rede (`liveServer.settings.host` = `0.0.0.0`) e reinicie o Live Server.

**Opção B — Python** (se estiver instalado)
1. Abra o terminal (ou o terminal do VS Code) **na pasta Hangover Fishing**.
2. Rode: `py -m http.server 8080 --bind 0.0.0.0` (ou `python -m http.server 8080 --bind 0.0.0.0`).
3. A porta é `8080`.

Se o Windows perguntar sobre o **Firewall**, permita o acesso em **redes privadas**.

### 4.2. Descobrir o endereço do computador na rede
1. No Windows, abra o terminal e rode `ipconfig`.
2. Procure **Endereço IPv4** da conexão Wi-Fi (algo como `192.168.0.15`).

### 4.3. Abrir no celular
1. Conecte o celular à **mesma rede Wi-Fi** do computador.
2. No navegador do celular, digite:
   `http://<IPv4>:<porta>/prototipos/p0-multitouch/index.html`
   Exemplo: `http://192.168.0.15:5500/prototipos/p0-multitouch/index.html`
3. Gire o celular para a **horizontal**.
4. No Android, toque em **☰ TESTES → Tela cheia** para esconder as barras do navegador. No iPhone essa opção não existe em páginas comuns.

### 4.4. Executar o roteiro
1. Toque em **☰ TESTES** e escolha o teste (1 a 10). A instrução aparece no menu, e o nome do teste fica na faixa inferior da tela.
2. Use **Zerar contadores e registro** antes de cada teste.
3. Façam o teste com **duas pessoas**, cada uma em uma metade.
4. Ao terminar, abra **☰ TESTES → Ver relatório**, selecione o texto e copie. Dá para colar em uma mensagem para você mesmo e depois no `RESULTADOS.md`.
5. Repita em pelo menos **2 celulares**, incluindo o que a família vai usar para jogar.

Os critérios de aprovação estão no plano (`docs/PLANO_PROTOTIPO_MULTITOUCH.md`, seção 6).

---

## 5. Como ler a tela

| Elemento | Significado |
|---|---|
| Metade esquerda vermelha / direita amarela | Zonas do P1 (Alemão) e do P2 (ALE), nas cores das varas |
| Zona escura | Livre |
| Zona acesa | Pressionada (abaixo do limiar) |
| Zona bem acesa + borda branca | Segurando (acima do limiar) |
| Círculo colorido | Um dedo, na cor do **dono** do toque, com "P1 · ptr 1" |
| Anel tracejado | Dedo arrastado para a outra zona, mas que **continua sendo do dono original** |
| Painel de cada zona | Estado, dedos ativos, toques, segurares, cancelamentos, maior duração, e cada toque ativo (ponteiro, id do navegador, sequência de início, duração) |
| Linha cinza inferior | FPS, tamanho da tela, limiar, toques nativos (atual e máximo), total de erros e avisos |
| Linha amarela | Teste atual |
| Linha verde/vermelha | "Nenhum erro detectado" ou o último erro |
| Registro | Últimos eventos, numerados: INÍCIO, SEGURAR, FIM (com classificação, duração e o nº do início), CANCELADO, CRUZOU/VOLTOU, RESET, ERRO, AVISO, INFO |

**Toques nativos** é a quantidade de dedos que o **navegador** está vendo. Se for maior do que os dedos que o protótipo acompanha, aparece o aviso `limite-de-dedos`. Isso ajuda a descobrir o limite de toques de cada celular.

### Tipos de erro e aviso
| Código | O que significa |
|---|---|
| `orfao` (erro) | Um toque ficou registrado sem dedo na tela e foi liberado pela rede de segurança |
| `fim-desconhecido` (erro) | Chegou o fim de um toque que nunca foi registrado |
| `inicio-duplicado` (erro) | Um ponteiro começou de novo sem ter terminado |
| `touchcancel-nativo` (aviso) | O sistema cancelou toques |
| `limite-de-dedos` (aviso) | Há mais dedos na tela do que o protótipo acompanha (4) |

---

## 6. Testes automatizados

### Lógica (sem navegador)
Requer apenas o **Node.js**. Na pasta `prototipos/p0-multitouch/`:
```
node tests/logica.test.js
```
São 18 testes que cobrem os 10 cenários da missão e os casos de erro.

### Navegador com multitouch simulado (opcional)
`tests/e2e-navegador.js` requer a biblioteca **Playwright**, que **não** está instalada no projeto. Foi usado na verificação automatizada (ver `RESULTADOS.md`). **Não substitui o teste em celular real.**

---

## 7. Limitações conhecidas

- **Ainda não foi testado em celulares reais.** As verificações automatizadas usaram toques simulados em um Chromium de computador.
- **Safari do iPhone não foi testado** de forma automatizada.
- **Até 4 dedos simultâneos** são acompanhados. Um 5º dedo é ignorado pelo Phaser, e o protótipo apenas avisa (`limite-de-dedos`).
- **A orientação não pode ser travada** em página comum: em retrato aparece o aviso e os toques são ignorados.
- **Tela cheia não existe no iPhone** em páginas comuns.
- **Gestos do sistema** (voltar pela borda, barra de início do iPhone, central de controle) não podem ser bloqueados por uma página. Eles devem gerar "cancelado" ou "reset", e isso faz parte do teste 9.
- **Área do botão "☰ TESTES"** (centro do topo, cerca de 110 × 40 px) não pertence a nenhuma zona.
- **Mensagem no console ao receber `touchcancel`:** o Phaser 3.90 tenta bloquear um evento que não pode ser bloqueado, e o navegador registra um aviso. É inofensivo, porque o cancelamento já foi processado.
- **Medição de tempo:** as durações usam o relógio do JavaScript no momento em que o evento chega (`performance.now()`). São precisas para comparar toque × segurar, mas não medem a latência do hardware.
- **Mini-teste de reação** (opcional no plano) **não foi implementado**, para não antecipar mecânicas de fisgada (fora do escopo desta missão).
