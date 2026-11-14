/*
 * Auditoria de PUBLICAÇÃO (GitHub Pages) no navegador — teste OPCIONAL.
 *
 * Abre o site pelo endereço RAIZ no subcaminho (como https://daikiihype.github.io/Hangover-Fishing/),
 * e joga como um jogador: menu vertical, catálogo (ficha e guia), opções (salvas), preparação,
 * aviso de girar o celular, partida de 2 e de 1 jogador, áudio, diálogos e Sirius, pausa, resumo,
 * salvamento depois de recarregar a página, e telas de computador e tablet.
 * Confere: nenhum recurso com erro (404...), nenhum pedido fora do site, nenhum erro de JavaScript.
 *
 * Requer Playwright (ou playwright-core), que NÃO faz parte do projeto.
 * Uso:  node jogo/tests/servidor-pages.js 8790      (simulador do GitHub Pages, em outro terminal)
 *       node jogo/tests/e2e-publicacao.js <pasta-de-saida> [base] [canal]
 *       base padrão: http://127.0.0.1:8790/Hangover-Fishing/   (também serve o site publicado de verdade)
 */
'use strict';
let pw;
try { pw = require('playwright'); } catch (e) { pw = require('playwright-core'); }
const fs = require('fs');
const path = require('path');
const OUT = process.argv[2] || '.';
const BASE = (process.argv[3] || 'http://127.0.0.1:8790/Hangover-Fishing/').replace(/\/?$/, '/');
const CHANNEL = process.argv[4] || undefined;
const ORIGEM = new URL(BASE).origin, SITE = new URL(BASE).pathname;           // ex.: /Hangover-Fishing/

const results = [];
function check(name, cond, detail) {
  results.push({ name, ok: !!cond, detail: detail || '' });
  console.log((cond ? '  ✓ ' : '  ✗ ') + name + (cond || !detail ? '' : '  → ' + String(detail).slice(0, 500)));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ROBO = () => {
  if (window.__robo) return;
  window.__b = {};
  window.__robo = setInterval(() => {
    const P = HF.app.partida;
    if (!P || P.bloqueado()) return;
    const now = performance.now();
    for (const id of P.ids) {
      const p = P.session.players[id], b = window.__b[id] = window.__b[id] || { prox: 0, acao: 'idle' };
      if (p.state === 'FIGHTING') { if (p.pressed && p.tension > 0.8) p.release(now, {}); else if (!p.pressed && p.tension < 0.38) p.press(now); continue; }
      if (now < b.prox) continue;
      switch (p.state) {
        case 'IDLE': p.press(now); b.acao = 'carregando'; b.prox = now + 260 + Math.random() * 450; break;
        case 'CHARGING': p.release(now, {}); b.acao = 'idle'; b.prox = now + 200; break;
        case 'BITE': if (b.acao !== 'reagindo') { b.acao = 'reagindo'; b.prox = now + 250; } else { p.press(now); b.acao = 'briga'; } break;
        case 'CAUGHT': case 'ESCAPED': case 'LINE_BROKEN': if (p.pressed) p.release(now, {}); b.acao = 'idle'; b.prox = now + 1300; break;
        default: break;
      }
    }
  }, 30);
};
const PARAR_ROBO = () => { clearInterval(window.__robo); window.__robo = null; };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await pw.chromium.launch({ channel: CHANNEL });
  const respostas = [], falhas = [], errosJs = [], errosPrototipos = [];
  // prototipo = true: páginas dos protótipos (protegidos, não alterados); os erros delas são só informados
  const vigiar = (page, prototipo) => {
    const destino = prototipo ? errosPrototipos : errosJs;
    page.on('response', (r) => respostas.push({ url: r.url(), status: r.status(), prototipo: !!prototipo }));
    page.on('requestfailed', (r) => falhas.push(r.url() + ' — ' + (r.failure() && r.failure().errorText)));
    page.on('pageerror', (e) => destino.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') destino.push('console: ' + m.text()); });
  };
  const menuPronto = (page) => page.waitForFunction(() => window.HF && HF.app && HF.app.ui && HF.app.ui.atual === 'menu', null, { timeout: 30000 });
  const tela = (page) => page.evaluate(() => HF.app.ui.atual);
  const espera = async (page, pred, ms, rot) => { const fim = Date.now() + (ms || 8000); while (Date.now() < fim) { if (await page.evaluate(pred)) return true; await sleep(50); } throw new Error('tempo esgotado: ' + rot); };

  try {
    // ================= celular em pé: entrada pela raiz do site =================
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 });
    const page = await ctx.newPage(); vigiar(page);
    const shot = (n) => page.screenshot({ path: path.join(OUT, n + '.png') });
    let bytes = 0;
    page.on('requestfinished', async (rq) => { try { const s = await rq.sizes(); bytes += s.responseBodySize; } catch (e) { /* sem tamanho */ } });
    const t0 = Date.now();
    await page.goto(BASE);
    await menuPronto(page);
    const tCarga = Date.now() - t0;
    await sleep(800);
    const bytesCarga = bytes;
    const url = new URL(page.url());
    check('Endereço raiz do site (' + SITE + ') abre o jogo (redireciona para ' + SITE + 'jogo/)', url.pathname === SITE + 'jogo/', page.url());
    check('Primeira carga: menu pronto e tamanho registrado', tCarga < 30000, tCarga + ' ms · ' + (bytesCarga / 1048576).toFixed(1) + ' MB transferidos');
    console.log('    primeira carga: ' + tCarga + ' ms · ' + (bytesCarga / 1048576).toFixed(1) + ' MB');
    const menu = await page.evaluate(() => [...document.querySelectorAll('#tela-menu [data-acao]')].map((b) => b.textContent.trim()));
    check('Menu vertical com 1 JOGADOR, 2 JOGADORES, CATÁLOGO e OPÇÕES', ['1 JOGADOR', '2 JOGADORES', 'CATÁLOGO', 'OPÇÕES'].every((t) => menu.some((m) => m.includes(t))), JSON.stringify(menu));
    await shot('pub_01_menu_vertical');

    // ---- catálogo: lista, ficha e guia (dados dos peixes, lugares e pontos)
    await page.tap('#tela-menu [data-acao="catalogo"]');
    await espera(page, () => HF.app.ui.atual === 'catalogo', 5000, 'catálogo');
    const cat = await page.evaluate(async () => {
      const out = { itens: document.querySelectorAll('#catalogo-conteudo .painel, #catalogo-conteudo button, #catalogo-conteudo li').length };
      HF.app.ui.abrirFicha('tilapia');
      out.ficha = !document.getElementById('ficha').hidden && /Tilápia|\?\?\?/.test(document.getElementById('ficha').textContent);
      HF.app.ui.fecharFicha();
      const aba = [...document.querySelectorAll('#tela-catalogo .aba')].find((b) => /guia/i.test(b.dataset.aba || b.textContent));
      if (aba) aba.click();
      await new Promise((r) => setTimeout(r, 200));
      out.guia = document.getElementById('catalogo-conteudo').textContent;
      return out;
    });
    check('Catálogo: lista, ficha do peixe e guia (lugares do lago, pontos de interesse, iscas)', cat.itens > 0 && cat.ficha && /Os lugares do lago/.test(cat.guia) && /Pontos de interesse/.test(cat.guia) && /Minhoca/.test(cat.guia), JSON.stringify({ itens: cat.itens, ficha: cat.ficha, guia: cat.guia.slice(0, 120) }));
    await shot('pub_02_catalogo_guia');
    await page.tap('#tela-catalogo [data-acao="voltar"]');

    // ---- opções: alternar e salvar
    await page.tap('#tela-menu [data-acao="opcoes"]');
    await espera(page, () => HF.app.ui.atual === 'opcoes', 5000, 'opções');
    await page.tap('[data-alt="musica"]');
    await sleep(200);
    const op = await page.evaluate(() => ({ musica: HF.app.opcoes.get('musica'), salvo: JSON.parse(localStorage.getItem('hf.opcoes.v1') || '{}').musica }));
    check('Opções: alternar a música muda e fica salvo no aparelho', op.musica === false && op.salvo === false, JSON.stringify(op));
    await page.tap('[data-alt="musica"]');
    await shot('pub_03_opcoes');
    await page.tap('#tela-opcoes [data-acao="voltar"]');

    // ---- 2 jogadores pela interface: preparação → "gire o celular" → partida na horizontal
    await page.tap('#tela-menu [data-acao="2p"]');
    await espera(page, () => HF.app.ui.atual === 'preparo', 5000, 'preparo');
    await page.tap('#tela-preparo [data-isca="massa"][data-pers="ale"]');     // a escolha de isca fica salva
    await sleep(200);
    await shot('pub_04_preparo');
    await page.tap('#tela-preparo [data-acao="comecar"]');
    await sleep(500);
    const antesDeGirar = await tela(page);
    check('Celular em pé ao começar: aparece "gire o celular" (o jogo espera a horizontal)', antesDeGirar === 'girar', antesDeGirar);
    await shot('pub_05_gire_o_celular');
    await page.setViewportSize({ width: 844, height: 390 });
    await espera(page, () => !!HF.app.partida && !!HF.app.partida.camadas, 10000, 'partida depois de girar');
    await sleep(700);
    check('Ao girar para a horizontal, a partida de 2 jogadores começa', await page.evaluate(() => HF.app.partida.ids.length === 2 && !HF.app.partida.retrato), '');
    // áudio: o primeiro toque libera o som (regra dos navegadores)
    await page.touchscreen.tap(200, 250);
    await page.touchscreen.tap(640, 250);
    await sleep(400);
    const aud = await page.evaluate(() => ({ estado: HF.app.audio.ctx && HF.app.audio.ctx.state, musica: HF.app.audio.musicaTocando, vozes: HF.app.audio.volumeVozes > 0, efeitos: HF.app.audio.enabled }));
    check('Áudio: o toque libera o som (efeitos, música e vozes ligados)', aud.estado === 'running' && aud.musica && aud.vozes && aud.efeitos, JSON.stringify(aud));

    // ---- jogar de verdade (robô nas duas metades), diálogos e Sirius
    await page.evaluate(ROBO);
    await page.evaluate(() => { const n = HF.app.partida.narrador; n.forcarCena(n.cenas.find((x) => x.g === 'silencio' && x.f.length >= 3 && !x.q && !x.m).id); });
    await sleep(2500);
    await shot('pub_06_partida_dialogo');
    await page.evaluate(() => { window.__sons = []; const a = HF.app.audio, o = a.narrativa.bind(a); a.narrativa = (s) => { window.__sons.push(s.tipo); return o(s); }; HF.app.partida.narrador.forcarSirius('choro'); });
    await espera(page, () => HF.app.partida.narrador.sirius.estado === 'chorando', 8000, 'choro');
    await sleep(1500);
    const sir = await page.evaluate(() => { const n = HF.app.partida.narrador; return { familia: n.familia(), sons: window.__sons.slice(), linhas: n.registro.slice(-6).map((r) => r.pessoa + ': ' + r.texto) }; });
    check('Sirius: o choro acontece (estado, Maria ocupada e som 8-bit pedido)', sir.familia.sirius === 'chorando' && sir.familia.mariaOcupada && sir.sons.includes('choro'), JSON.stringify(sir));
    await espera(page, () => !HF.app.partida.narrador.sirius.chorando, 25000, 'fim do choro');
    await page.evaluate(() => HF.app.partida.narrador.forcarSirius('dormindo'));
    await sleep(20000);                                   // o robô pesca
    const jogo = await page.evaluate(() => { const P = HF.app.partida; return { capturas: P.session.players.P1.stats.capturas + P.session.players.P2.stats.capturas, falas: P.narrador.registro.length, sirius: P.narrador.sirius.estado }; });
    check('Partida de 2 jogadores jogável: peixes pescados e a família conversando', jogo.capturas >= 1 && jogo.falas >= 3, JSON.stringify(jogo));
    await page.evaluate(PARAR_ROBO);
    await shot('pub_07_partida_jogada');
    // pausa → sair → resumo → menu
    await page.tap('#botao-pausa');
    await espera(page, () => HF.app.ui.atual === 'pausa', 4000, 'pausa');
    await page.tap('#tela-pausa [data-acao="sair"]');
    await espera(page, () => HF.app.ui.atual === 'resumo', 4000, 'resumo');
    await shot('pub_08_resumo');
    const descobertos = await page.evaluate(() => HF.app.catalogo.descobertos());
    await page.tap('#tela-resumo [data-acao="menu"]');
    check('Pausa, saída e resumo da pescaria funcionam; o catálogo registrou as descobertas', descobertos >= 1, String(descobertos));

    // ---- salvamento local: recarregar a página e conferir catálogo e opções
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE);
    await menuPronto(page);
    const salvo = await page.evaluate(() => { const pr = JSON.parse(localStorage.getItem('hf.preparo.v1') || '{}'); return { descobertos: HF.app.catalogo.descobertos(), musica: HF.app.opcoes.get('musica'), tutorial: !!localStorage.getItem('hf.tutorial.v1'), iscaAle: pr.iscas && pr.iscas.ale }; });
    check('Salvamento local: depois de recarregar, o catálogo, as opções, o tutorial e a isca escolhida continuam', salvo.descobertos === descobertos && salvo.musica === true && salvo.tutorial && salvo.iscaAle === 'massa', JSON.stringify(salvo));

    // ---- 1 jogador pela interface
    await page.tap('#tela-menu [data-acao="1p"]');
    await espera(page, () => HF.app.ui.atual === 'preparo', 5000, 'preparo 1P');
    await page.tap('#tela-preparo [data-acao="comecar"]');
    await sleep(400);
    await page.setViewportSize({ width: 844, height: 390 });
    await espera(page, () => !!HF.app.partida && !!HF.app.partida.camadas, 10000, 'partida 1P');
    await page.evaluate(ROBO);
    await sleep(12000);
    const solo = await page.evaluate(() => { const P = HF.app.partida; return { ids: P.ids, estado: P.session.players.P1.state, observador: P.narrador.observador, falas: P.narrador.registro.length }; });
    await page.evaluate(PARAR_ROBO);
    await shot('pub_09_um_jogador');
    check('Partida de 1 jogador jogável (quem não pesca assiste e comenta)', solo.ids.length === 1 && !!solo.observador, JSON.stringify(solo));
    await page.evaluate(() => HF.app.sairDaPartida());
    await ctx.close();

    // ================= computador (mouse, sem toque) e tablet =================
    for (const [nome, opts] of [['computador 1280×720', { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 }],
      ['tablet 1024×768', { viewport: { width: 1024, height: 768 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }],
      ['celular pequeno 640×360', { viewport: { width: 640, height: 360 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }]]) {
      const c = await browser.newContext(opts);
      const p = await c.newPage(); vigiar(p);
      await p.goto(BASE);
      await menuPronto(p);
      await p.evaluate(() => HF.app.iniciarPartida({ modo: 2, personagens: { P1: 'alemao', P2: 'ale' }, iscas: { P1: 'minhoca', P2: 'massa' }, regioes: true }));
      await p.waitForFunction(() => !!HF.app.partida && !!HF.app.partida.camadas, null, { timeout: 10000 });
      await p.evaluate(ROBO);
      await sleep(4000);
      const ok = await p.evaluate(() => { const P = HF.app.partida; return P.L.W > 0 && Object.keys(P.camadas).length === 5 && P.ids.length === 2; });
      await p.screenshot({ path: path.join(OUT, 'pub_10_' + nome.split(' ')[0] + '.png') });
      check('Tela de ' + nome + ': menu e partida funcionam', ok, '');
      await p.evaluate(PARAR_ROBO);
      await c.close();
    }

    // ================= protótipos continuam acessíveis no site =================
    const c2 = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
    const p2 = await c2.newPage(); vigiar(p2, true);
    for (const pr of ['prototipos/p0-multitouch/', 'prototipos/p1-pesca/', 'prototipos/p1-personagens/']) {
      const r = await p2.goto(BASE + pr);
      await sleep(1500);
      check('Protótipo acessível no site: ' + pr, r && r.status() === 200, r && String(r.status()));
    }
    await c2.close();
  } catch (e) {
    check('Execução do roteiro sem travar', false, e.message);
  }

  // ================= auditoria da rede e do console =================
  // O P0 (protótipo protegido, não alterado) pede um favicon que não existe: falha antiga, conhecida.
  const ehP0favicon = (u) => /favicon\.ico$/.test(u);
  const erros = respostas.filter((r) => r.status >= 400 && !ehP0favicon(r.url));
  check('Nenhum recurso com erro (404 ou outro) no jogo', erros.length === 0, JSON.stringify(erros.slice(0, 8)));
  const fora = respostas.filter((r) => !/^(data|blob):/.test(r.url) && !(r.url.startsWith(ORIGEM + SITE)) && !ehP0favicon(r.url));
  check('Todos os pedidos ficam dentro do site (' + SITE + '): nada de localhost, caminho absoluto ou servidor externo', fora.length === 0, JSON.stringify(fora.slice(0, 8).map((r) => r.url)));
  check('Nenhum pedido falhou na rede', falhas.filter((f) => !ehP0favicon(f)).length === 0, JSON.stringify(falhas.slice(0, 5)));
  check('Nenhum erro de JavaScript no console (páginas do jogo)', errosJs.length === 0, JSON.stringify(errosJs.slice(0, 5)));
  const totalPedidos = respostas.length;
  console.log('    pedidos de rede: ' + totalPedidos + ' · erros: ' + erros.length + ' · fora do site: ' + fora.length);
  if (errosPrototipos.length) console.log('    (informativo) mensagens das páginas dos protótipos: ' + JSON.stringify(errosPrototipos.slice(0, 3)) + ' — o P0 não tem ícone (falha antiga, protótipo protegido).');

  const passed = results.filter((r) => r.ok).length;
  console.log('\n' + passed + ' de ' + results.length + ' verificações passaram.');
  fs.writeFileSync(path.join(OUT, 'resultado-e2e-publicacao.json'), JSON.stringify({ base: BASE, results, erros, fora, falhas, errosJs }, null, 2));
  await browser.close();
  process.exit(passed === results.length ? 0 : 1);
})();
