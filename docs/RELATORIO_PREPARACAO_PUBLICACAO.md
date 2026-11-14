# Relatório — Preparação para publicação no GitHub Pages

**Data:** 13/11/2026
**Repositório:** `daikiihype/Hangover-Fishing`, branch `main`
**Status:** pronto para publicar pelo GitHub Desktop. **Nada foi commitado, enviado nem publicado**, e a branch e o remoto não foram alterados.

**URL esperada depois de publicar:** **https://daikiihype.github.io/Hangover-Fishing/**. Ela abre o jogo, que fica em `.../Hangover-Fishing/jogo/`.

---

## 1. Auditoria inicial (antes de qualquer alteração)

| Item | Situação encontrada |
|---|---|
| Versão atual do jogo | `jogo/` (página `jogo/index.html`) |
| Git | branch `main`, sincronizada com `origin/main`; nada pendente; último commit `1a22668 nv identidade` (inclui a Operação Nova Identidade) |
| `.gitignore` | **não existe**, então nenhum arquivo necessário é ignorado. `.gitattributes` só normaliza fim de linha de texto (`* text=auto`); imagens e vídeos são detectados como binários. |
| Dependências de servidor | nenhuma em produção: o jogo é 100% estático (HTML, JS, CSS, imagens). Phaser 3.90 local (`prototipos/p1-pesca/lib/phaser.min.js`). Sem `fetch` para APIs, sem Node nem Python no navegador. Os `require(...)` do código só rodam nos testes do Node. |
| Caminhos | **todos relativos**: `../prototipos/...`, `../arte/personagens-animacoes/...`, `../logo.jpg`, `../arte%202.jpg`, `../Pai%20rosto.jpg`... Nenhum caminho absoluto, `localhost`, `127.0.0.1` ou `file://` no código de produção (procurado em todos os `.js`, `.html`, `.css` e `.json` publicados). |
| Arquivos de fora de `jogo/` | o jogo **usa** os protótipos (Phaser, lógica do P1, animador), `arte/` e as folhas `.jpg` da raiz. Por isso o site precisa ser **o repositório inteiro**, publicado a partir da raiz. |
| Jekyll (padrão do Pages) | nenhum arquivo com nome começando por `_` ou `.` seria ignorado. Mesmo assim, faltava `.nojekyll`, que é o recomendado para sites estáticos. |
| **Página na raiz** | **não existia**: `https://daikiihype.github.io/Hangover-Fishing/` daria **404**. |
| Tamanho | 46 MB publicados (325 arquivos); maior arquivo 8,6 MB (vídeo de demonstração). Bem dentro dos limites do GitHub: 100 MB por arquivo e 1 GB por site. |
| Ícone | o jogo usa `data:,`, sem pedido de `favicon.ico`. A página do **P0** (protótipo protegido) não tem ícone, o que gera 1 pedido 404 (falha antiga, já registrada). |
| Recursos do navegador | Web Audio (liberado no primeiro toque), `localStorage`, tela cheia e trava de orientação (Android). Todos funcionam em HTTPS, que é o caso do Pages. |

---

## 2. O que foi alterado

1. **`index.html` na raiz (novo):** a entrada do site.
   - Leva ao jogo (`jogo/`) por caminho relativo, mantendo parâmetros como `?entardecer=1`.
   - Usa `location.replace` e `meta refresh`, com um link "Toque aqui se o jogo não abrir" de reserva.
   - Funciona no subcaminho `/Hangover-Fishing/` e no servidor local (`http://localhost:8765/` agora também abre o jogo).
2. **`.nojekyll` na raiz (novo, vazio):** o Pages publica os arquivos como estão, sem passar pelo Jekyll.
3. **`jogo/tests/servidor-pages.js` (novo, ferramenta de teste):** simulador local do GitHub Pages.
   - Serve **só os arquivos que vão para o repositório**.
   - **Diferencia maiúsculas de minúsculas**: o GitHub roda em Linux, e o Windows não diferencia.
   - Usa o subcaminho `/Hangover-Fishing/`, redireciona pastas sem barra, não usa Jekyll e registra cada pedido.
4. **`jogo/tests/e2e-publicacao.js` (novo, teste):** auditoria de publicação no navegador, entrando **pela raiz do site** como um jogador (seção 3).
5. **`jogo/tests/e2e-identidade.js` (ajuste de teste):** a verificação "retrato e nome certos" passou a ler a caixa logo depois de a fala forçada ser desenhada.
   - No simulador, uma mordida chegou durante a espera de 1,3 s e, pela regra nova da narrativa, cortou a fala. O jogo estava certo; o teste é que era frágil.
6. **`jogo/README.md`:** como abrir pela internet e a seção "Publicar no GitHub Pages".

**Não mudou:**
- nada no código do jogo;
- nada nos protótipos, nas artes, nas animações, na narrativa ou no balanceamento;
- nada nos documentos anteriores;
- os 234 arquivos protegidos têm o mesmo hash, conferido.

---

## 3. Testes executados e resultados

**Ambiente:**
- **Simulador do GitHub Pages:** `servidor-pages.js`, no endereço `http://127.0.0.1:8790/Hangover-Fishing/`, com subcaminho, diferença de maiúsculas, só arquivos do repositório, sem Jekyll e com redirecionamento de pastas.
- **Navegador:** Edge (Chromium) com celular emulado (toque, densidade 3) e também telas de computador e tablet.

### 3.1 Linha de base (antes das alterações, no simulador)
| Teste | Resultado |
|---|---|
| Jogo — lógica / pontos de interesse / narrativa | 18/18 · 10/10 · 29/29 |
| P0 lógica / P1 lógica / animador | 18/18 · 53/53 · 27/27 |
| Jogo no navegador (subcaminho) | 53/53 |
| Diálogos no navegador (subcaminho) | 26/26 |
| Identidade nova no navegador (subcaminho) | 21/22. A fala forçada da Maria foi cortada por uma mordida (fragilidade do teste, ver item 5 da seção 2). |
| P1 no navegador (P1 / página com personagens) | 41/42 e 42/42. O item "Painel de diagnóstico" falhou uma vez; repetido duas vezes, deu **42/42** nas duas (oscilação de tempo do teste protegido). |
| P1 com personagens no navegador | 31/31 |
| P0 no navegador | 27/30, as **mesmas 3 falhas antigas** (aviso de rotação do P0 e o ícone que falta) |
| Raiz `/Hangover-Fishing/` | **404** (problema encontrado) |
| Pedidos com erro no simulador | 1: `favicon.ico` do P0 (antigo) |

### 3.2 Depois das alterações (bateria final, no simulador)
| Teste | Resultado |
|---|---|
| Jogo — lógica / pontos de interesse / narrativa | **18/18 · 10/10 · 29/29** |
| P0 lógica / P1 lógica / animador | 18/18 · 53/53 · 27/27 |
| Jogo no navegador (subcaminho) | **53/53** |
| Diálogos no navegador (subcaminho) | **26/26** |
| Identidade nova no navegador (subcaminho) | **22/22** |
| P1 no navegador (P1 / página com personagens) | **42/42 · 42/42** |
| P1 com personagens no navegador | **31/31** |
| P0 no navegador | 27/30, as mesmas 3 falhas antigas do protótipo protegido |
| **Auditoria de publicação, entrando pela raiz do site** (nova) | **23/23** |
| Raiz `/Hangover-Fishing/` | **abre o jogo** |
| Pedidos com erro no simulador | 2, ambos o `favicon.ico` da página do P0 (antigo; uma visita da bateria do P0 e outra da auditoria) |

**Integridade:**
- os 234 arquivos protegidos têm hash idêntico (P0, P1, P1 com personagens, `arte/`, folhas da raiz, GDD e documentos anteriores, `iniciar-jogo.bat`);
- branch `main`, remoto e histórico inalterados: último commit `1a22668`, nenhum commit novo.

### 3.3 Auditoria de publicação (`e2e-publicacao.js`): o que ela confere
| Verificação | Como |
|---|---|
| Endereço raiz abre o jogo | entra por `/Hangover-Fishing/` e confere que chegou em `/Hangover-Fishing/jogo/` |
| Primeira carga | menu pronto em 2,1 a 2,6 s no simulador local; cerca de **5,8 MB** transferidos (Phaser, spritesheets e folhas `.jpg` do criador). Na internet, depende da conexão. |
| Menu vertical | os quatro botões, celular em pé (390×844) |
| Catálogo | lista, ficha do peixe e guia (lugares do lago, pontos de interesse, iscas): os dados dos peixes carregam |
| Opções | alternar a música muda e fica salvo no aparelho |
| Orientação | celular em pé ao começar mostra "gire o celular"; ao girar para a horizontal, a partida começa |
| Áudio | o toque libera o som; efeitos, música e vozes ligados |
| 2 jogadores | partida jogada de verdade (robô nas duas metades): peixes pescados, família conversando |
| Diálogos e Sirius | conversa forçada; choro (estado, Maria ocupada, som 8-bit); sono |
| Pausa e resumo | pausa → sair → resumo → menu, com o catálogo registrando as descobertas |
| Salvamento local | depois de **recarregar a página**: catálogo, opções, tutorial e isca escolhida continuam |
| 1 jogador | partida jogável; quem não pesca assiste e comenta |
| Outras telas | computador 1280×720 (mouse), tablet 1024×768 e celular pequeno 640×360 |
| Protótipos | P0, P1 e P1 com personagens acessíveis no site |
| Rede | **nenhum recurso com erro**; **todos os pedidos dentro do site** (nada de localhost, caminho absoluto ou servidor externo); nenhuma falha de rede |
| Console | **nenhum erro de JavaScript** nas páginas do jogo. O 404 do ícone do P0 é informado à parte. |

---

## 4. Problemas encontrados

| Problema | O que foi feito |
|---|---|
| A raiz do site daria 404 (o jogo está em `jogo/`) | **Corrigido**: `index.html` na raiz leva ao jogo |
| Sem `.nojekyll` (o Pages processaria o site com Jekyll) | **Corrigido**: `.nojekyll` vazio na raiz |
| Diferença de maiúsculas e minúsculas (Windows × Linux) | Verificado com o simulador: **nenhum caminho com diferença** (todos os pedidos do jogo deram 200) |
| Página do P0 sem ícone (404 de `favicon.ico`) | **Não corrigido**: o P0 é protegido. Falha antiga, não afeta o jogo. |
| Teste da identidade frágil no tempo (a mordida corta a fala, o que é certo) | Teste ajustado (seção 2, item 5) |
| Painel de diagnóstico do P1 falhou uma vez | Repetido 2 vezes: 42/42. Oscilação do teste protegido; nada alterado. |

---

## 5. Como publicar pelo GitHub Desktop (passo a passo)

1. Abra o **GitHub Desktop** com o repositório **Hangover-Fishing**. A branch atual deve ser **`main`**.
2. Na aba **Changes** devem aparecer **7 alterações**, todas marcadas:

   | Arquivo | Situação |
   |---|---|
   | `.nojekyll` | novo |
   | `index.html` | novo |
   | `jogo/tests/e2e-publicacao.js` | novo |
   | `jogo/tests/servidor-pages.js` | novo |
   | `jogo/README.md` | modificado |
   | `jogo/tests/e2e-identidade.js` | modificado |
   | `docs/RELATORIO_PREPARACAO_PUBLICACAO.md` | novo (este relatório) |
3. No campo **Summary** (canto inferior esquerdo), escreva por exemplo: `Preparação para o GitHub Pages`.
4. Clique em **Commit to main**.
5. Clique em **Push origin**, no alto. O commit sobe para o GitHub.

## 6. Configuração do GitHub Pages (só na primeira vez)

1. No navegador, abra **https://github.com/daikiihype/Hangover-Fishing**.
2. Vá em **Settings → Pages**, no menu à esquerda, seção "Code and automation".
3. Em **Build and deployment**:
   - **Source:** `Deploy from a branch`;
   - **Branch:** `main`;
   - **Folder:** `/ (root)`.
4. Clique em **Save**.
5. Espere de 1 a 3 minutos. O andamento aparece na aba **Actions** ("pages build and deployment"). Quando terminar, o endereço aparece no alto da página **Settings → Pages**.

**Atenção:**
- **Repositório privado:** no plano gratuito, o GitHub Pages só funciona com repositório **público**. Se o repositório for privado, a opção não aparece ou pede um plano pago (GitHub Pro).
- **Tudo fica público:** com o repositório público e o site no ar, **todo** o conteúdo fica visível, não só o jogo. Isso inclui o GDD, os relatórios, as folhas de arte da família e os protótipos. A folha `Maria e Sirius.jpg` inclui os retratos de óculos com "Magic by birth" (referência a Harry Potter, já apontada no GDD). O jogo não mostra esses recortes, mas o arquivo inteiro fica acessível. **Decisão do criador** antes de publicar.

## 7. URL esperada

**https://daikiihype.github.io/Hangover-Fishing/** abre o jogo em `https://daikiihype.github.io/Hangover-Fishing/jogo/`.

**Outros endereços úteis:**

| Endereço | O que abre |
|---|---|
| `.../Hangover-Fishing/?entardecer=1` | o jogo já no pôr do sol |
| `.../Hangover-Fishing/prototipos/p1-personagens/` | o P1 com personagens |
| `.../Hangover-Fishing/prototipos/p1-pesca/` | o P1 |
| `.../Hangover-Fishing/prototipos/p0-multitouch/` | o P0 |

**Para atualizar depois:** basta fazer commit e push. O Pages republica sozinho em 1 a 3 minutos e pode servir a versão anterior por até ~10 minutos por causa do cache. Recarregar a página resolve.

---

## 8. Limitações reais

1. **O site de verdade não foi testado:** publicar era proibido nesta missão. A verificação foi feita num **simulador** do GitHub Pages, que reproduz subcaminho, maiúsculas, arquivos do repositório, ausência de Jekyll e redirecionamentos. Ficam de fora o HTTPS real, o cache do GitHub e o processo de publicação. **Depois de publicar, vale abrir o endereço uma vez** no computador e no celular. O teste também roda contra o site real: `node jogo/tests/e2e-publicacao.js <pasta> https://daikiihype.github.io/Hangover-Fishing/`.
2. **Celular físico não testado:** tudo foi testado com emulação no Edge do computador.
3. **Primeira carga de ~5,8 MB:** a maior parte são as folhas `.jpg` originais do criador, carregadas inteiras e recortadas na memória.
   - Em internet móvel lenta, a primeira abertura pode levar alguns segundos; depois o navegador guarda em cache.
   - **[PROPOSTA — AGUARDANDO CRIADOR]** Gerar cópias otimizadas só com os recortes usados, mantendo as originais intactas.
4. **Salvamentos por endereço:**
   - O progresso (catálogo, opções, tutorial) fica no aparelho, **por endereço**. O que foi salvo jogando em `localhost` ou pelo IP da rede local **não aparece** no site publicado, que começa do zero.
   - No site, o armazenamento é compartilhado com outros sites publicados pela mesma conta (`daikiihype.github.io`). As chaves do jogo começam com `hf.`, então não há conflito esperado.
5. **Sem modo offline nem "instalar como app":** não há PWA nem service worker. **[PROPOSTA — AGUARDANDO CRIADOR]**, se quiser no futuro, como no Hangover Accident.
6. **P0:** continua com as 3 falhas antigas (protótipo protegido, não alterado).

---

## 9. Arquivos

| Arquivo | Situação |
|---|---|
| `index.html` (raiz) | **novo**: entrada do site, leva ao jogo |
| `.nojekyll` (raiz) | **novo**: publica sem Jekyll |
| `jogo/tests/servidor-pages.js` | **novo**: simulador local do GitHub Pages (só para testes) |
| `jogo/tests/e2e-publicacao.js` | **novo**: auditoria de publicação no navegador |
| `docs/RELATORIO_PREPARACAO_PUBLICACAO.md` | **novo**: este relatório |
| `jogo/README.md` | modificado: abrir pela internet e publicar no GitHub Pages |
| `jogo/tests/e2e-identidade.js` | modificado: leitura da caixa de diálogo logo depois da fala forçada |
