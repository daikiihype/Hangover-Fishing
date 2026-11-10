/*
 * Teste ponta a ponta OPCIONAL do Protótipo 0.
 *
 * Abre o protótipo em um Chromium emulando celular na horizontal e simula
 * MULTITOUCH REAL (vários dedos ao mesmo tempo) pelo protocolo de depuração
 * do navegador (CDP, Input.dispatchTouchEvent).
 *
 * Requer a biblioteca Playwright, que NÃO faz parte do projeto e não foi
 * instalada nele. Foi usado pelo Claude para a verificação automatizada.
 * Não substitui o teste em celulares reais.
 *
 * Uso (com o protótipo servido em um endereço local):
 *   node tests/e2e-navegador.js <pasta-de-saida> [endereço]
 *   ex.: node tests/e2e-navegador.js ./saida http://127.0.0.1:8765/index.html
 */
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = process.argv[2] || '.';
const URL = process.argv[3] || 'http://127.0.0.1:8765/index.html';
const W = 844, H = 390;
const L = { x: 200, y: 200, id: 1 }, R = { x: 640, y: 200, id: 2 };

const results = [];
function check(name, cond, detail) {
  results.push({ name, ok: !!cond, detail: detail || '' });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: W, height: H }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  await page.goto(URL);
  await page.waitForFunction(() => window.HF && HF.app && HF.app.scene && HF.app.scene.panel);
  await sleep(300);
  const cdp = await context.newCDPSession(page);

  const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', {
    type, touchPoints: points.map((p) => ({ x: p.x, y: p.y, id: p.id, radiusX: 8, radiusY: 8, force: 1 }))
  });
  const state = () => page.evaluate(() => {
    const r = HF.app.router, t = performance.now();
    return {
      P1: { estado: r.zones.P1.getState(t), dedos: r.zones.P1.activeCount, c: Object.assign({}, r.zones.P1.counters) },
      P2: { estado: r.zones.P2.getState(t), dedos: r.zones.P2.activeCount, c: Object.assign({}, r.zones.P2.counters) },
      erros: r.errors.map((e) => e.codigo),
      log: r.log.slice(-40).map((e) => ({ tipo: e.tipo, zona: e.zona, classificacao: e.classificacao, zonaFim: e.zonaFim, cruzou: e.cruzou, motivo: e.motivo, codigo: e.codigo }))
    };
  });
  const reset = () => page.evaluate(() => { HF.app.router.resetCounters(); });

  // Estado inicial
  let s = await state();
  check('Inicial: as duas zonas livres, sem erros', s.P1.estado === 'livre' && s.P2.estado === 'livre' && s.erros.length === 0);

  // 1. P1 sozinho
  await reset();
  for (let i = 0; i < 10; i++) { await touch('touchStart', [L]); await sleep(50); await touch('touchEnd', []); await sleep(40); }
  s = await state();
  check('1. P1 sozinho: 10 toques contados em P1, nenhum em P2', s.P1.c.toques === 10 && s.P2.c.inicios === 0, JSON.stringify([s.P1.c, s.P2.c]));

  // 2. P2 sozinho
  await reset();
  for (let i = 0; i < 10; i++) { await touch('touchStart', [R]); await sleep(50); await touch('touchEnd', []); await sleep(40); }
  s = await state();
  check('2. P2 sozinho: 10 toques contados em P2, nenhum em P1', s.P2.c.toques === 10 && s.P1.c.inicios === 0, JSON.stringify([s.P1.c, s.P2.c]));

  // 3. Simultâneos (os dois dedos no MESMO evento)
  await reset();
  for (let i = 0; i < 20; i++) { await touch('touchStart', [L, R]); await sleep(60); await touch('touchEnd', []); await sleep(40); }
  s = await state();
  check('3. Toques simultâneos: 20/20 em cada zona', s.P1.c.toques === 20 && s.P2.c.toques === 20, JSON.stringify([s.P1.c.toques, s.P2.c.toques]));

  // 4. P1 segura, P2 toca 20 vezes
  await reset();
  await touch('touchStart', [L]);
  let interrompido = false;
  for (let i = 0; i < 20; i++) {
    await touch('touchStart', [L, R]); await sleep(40);
    await touch('touchEnd', [R]); await sleep(40);            // solta só o dedo de P2
    const st = await state();
    if (st.P1.dedos !== 1) interrompido = true;
  }
  s = await state();
  check('4. P1 segura enquanto P2 toca 20×: P1 nunca perdeu o dedo e está SEGURANDO', !interrompido && s.P1.estado === 'segurando' && s.P2.c.toques === 20, JSON.stringify({ interrompido, P1: s.P1.estado, toquesP2: s.P2.c.toques }));
  await touch('touchEnd', []); await sleep(50);
  s = await state();
  check('4. …e ao soltar, P1 registra 1 "segurar" e 0 toques', s.P1.c.segurares === 1 && s.P1.c.toques === 0, JSON.stringify(s.P1.c));

  // 4b. invertido
  await reset();
  await touch('touchStart', [R]);
  interrompido = false;
  for (let i = 0; i < 20; i++) {
    await touch('touchStart', [R, L]); await sleep(40);
    await touch('touchEnd', [L]); await sleep(40);
    if ((await state()).P2.dedos !== 1) interrompido = true;
  }
  s = await state();
  check('4b. Invertido: P2 segura enquanto P1 toca 20×', !interrompido && s.P2.estado === 'segurando' && s.P1.c.toques === 20);
  await touch('touchEnd', []); await sleep(50);

  // 5. Os dois segurando
  await reset();
  await touch('touchStart', [L, R]); await sleep(1500);
  s = await state();
  check('5. Os dois segurando por 1,5 s: ambos SEGURANDO', s.P1.estado === 'segurando' && s.P2.estado === 'segurando');
  await page.screenshot({ path: OUT + '/p0-dois-segurando.png' });
  await touch('touchEnd', []); await sleep(50);
  s = await state();
  check('5. …ao soltar: 1 segurar em cada zona, ambas livres', s.P1.c.segurares === 1 && s.P2.c.segurares === 1 && s.P1.estado === 'livre' && s.P2.estado === 'livre');

  // 6. Arrastar
  await reset();
  await touch('touchStart', [L]); await sleep(50);
  for (let x = L.x; x <= R.x; x += 40) { await touch('touchMove', [{ x, y: L.y, id: 1 }]); await sleep(16); }
  await sleep(100);
  s = await state();
  check('6. Arrastar P1 → lado direito: posse continua de P1; P2 continua LIVRE', s.P1.dedos === 1 && s.P2.dedos === 0 && s.P2.estado === 'livre');
  await page.screenshot({ path: OUT + '/p0-arrasto.png' });
  await touch('touchEnd', []); await sleep(50);
  s = await state();
  const fim6 = s.log.filter((e) => e.tipo === 'fim').pop();
  check('6. …o fim é contado para P1, com "terminou na zona P2" registrado', fim6 && fim6.zona === 'P1' && fim6.zonaFim === 'P2' && fim6.cruzou === true && s.P2.c.inicios === 0, JSON.stringify(fim6));

  // 7. Soltar um dedo enquanto o outro segura
  await reset();
  await touch('touchStart', [L, R]); await sleep(400);
  await touch('touchEnd', [R]); await sleep(60);            // solta P2
  s = await state();
  check('7. Soltar P2 com P1 segurando: P2 LIVRE, P1 SEGURANDO', s.P2.estado === 'livre' && s.P1.estado === 'segurando');
  await touch('touchEnd', []); await sleep(50);
  // 7b. dois dedos na mesma zona
  await reset();
  const L2 = { x: 300, y: 260, id: 3 };
  await touch('touchStart', [L, L2]); await sleep(60);
  await touch('touchEnd', [L]); await sleep(60);
  s = await state();
  check('7b. Dois dedos em P1, solta um: P1 continua pressionada', s.P1.dedos === 1 && s.P1.estado !== 'livre');
  await touch('touchEnd', []); await sleep(60);
  s = await state();
  check('7b. …solta o último: P1 LIVRE', s.P1.estado === 'livre' && s.P1.c.maxDedos === 2);

  // 8. Interrupção (perda de foco) com os dois pressionados
  await reset();
  await touch('touchStart', [L, R]); await sleep(300);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await sleep(50);
  s = await state();
  check('8. Perda de foco: as duas zonas são liberadas na hora', s.P1.estado === 'livre' && s.P2.estado === 'livre' && s.P1.c.cancelamentos === 1 && s.P2.c.cancelamentos === 1);
  await touch('touchEnd', []); await sleep(50);
  s = await state();
  check('8. …o fim tardio dos dedos não gera erro nem estado fantasma', s.erros.length === 0 && s.P1.estado === 'livre');
  // página oculta
  await reset();
  await touch('touchStart', [L]); await sleep(100);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await sleep(50);
  s = await state();
  check('8b. Página oculta e de volta: zona liberada; novo toque funciona', s.P1.estado === 'livre' && s.log.some((e) => e.motivo === 'página oculta'));
  await touch('touchEnd', []); await sleep(30);
  await touch('touchStart', [L]); await sleep(50); await touch('touchEnd', []); await sleep(50);
  s = await state();
  check('8b. …toque após a volta contado normalmente', s.P1.c.toques === 1 && s.erros.length === 0);

  // 9. Cancelamento do sistema (touchcancel)
  await reset();
  await touch('touchStart', [L, R]); await sleep(300);
  await touch('touchCancel', []); await sleep(80);
  s = await state();
  check('9. touchcancel: os dois toques viram "cancelado"; zonas livres; sem órfãos', s.P1.c.cancelamentos === 1 && s.P2.c.cancelamentos === 1 && s.P1.estado === 'livre' && s.P2.estado === 'livre' && s.erros.length === 0, JSON.stringify([s.P1.c, s.P2.c, s.erros]));

  // 9b. Rede de segurança (toque órfão forçado)
  await reset();
  await touch('touchStart', [L]); await sleep(60);
  await page.evaluate(() => { const p = HF.app.game.input.pointers.find((pp) => pp.isDown); p.isDown = false; });
  await sleep(80);
  s = await state();
  check('9b. Toque órfão (dedo some sem evento): liberado e registrado como erro "orfao"', s.P1.estado === 'livre' && s.erros.includes('orfao'));
  await touch('touchEnd', []); await sleep(50);

  // 10. Rápido × sustentado
  await reset();
  const seq = [[60, 'toque'], [450, 'segurar'], [100, 'toque'], [350, 'segurar'], [40, 'toque']];
  for (const [ms] of seq) { await touch('touchStart', [L]); await sleep(ms); await touch('touchEnd', []); await sleep(80); }
  s = await state();
  const classes = s.log.filter((e) => e.tipo === 'fim').map((e) => e.classificacao);
  check('10. Sequência toque/segurar/toque/segurar/toque classificada corretamente', JSON.stringify(classes) === JSON.stringify(seq.map((x) => x[1])), JSON.stringify(classes));

  // Gestos do navegador: pinça e rolagem
  const before = await page.evaluate(() => ({ scale: visualViewport.scale, sx: scrollX, sy: scrollY }));
  try { await cdp.send('Input.synthesizePinchGesture', { x: 420, y: 200, scaleFactor: 2, gestureSourceType: 'touch' }); } catch (e) { /* ignora */ }
  try { await cdp.send('Input.synthesizeScrollGesture', { x: 420, y: 200, yDistance: -300, gestureSourceType: 'touch' }); } catch (e) { /* ignora */ }
  await sleep(300);
  const after = await page.evaluate(() => ({ scale: visualViewport.scale, sx: scrollX, sy: scrollY }));
  check('Gestos: pinça e rolagem não alteram zoom nem posição da página (Chromium)', after.scale === 1 && after.sx === 0 && after.sy === 0, JSON.stringify({ before, after }));

  // Orientação retrato
  await page.setViewportSize({ width: H, height: W }); await sleep(400);
  await reset();
  await touch('touchStart', [{ x: 100, y: 300, id: 5 }]); await sleep(60); await touch('touchEnd', []); await sleep(60);
  s = await state();
  const orient = await page.evaluate(() => HF.app.game.scene.getScene('OrientationScene').sys.settings.visible);
  check('Retrato: aviso "Gire o celular" visível e toques ignorados', orient === true && s.P1.c.inicios === 0 && s.P2.c.inicios === 0, JSON.stringify({ orient, P1: s.P1.c, P2: s.P2.c }));
  await page.screenshot({ path: OUT + '/p0-retrato.png' });
  await page.setViewportSize({ width: W, height: H }); await sleep(400);
  const orient2 = await page.evaluate(() => HF.app.game.scene.getScene('OrientationScene').sys.settings.visible);
  check('De volta à horizontal: aviso escondido', orient2 === false);

  // Menu
  await page.tap('#menu-button'); await sleep(200);
  const menuOpen = await page.evaluate(() => HF.app.menuOpen && !document.getElementById('menu').hidden);
  await page.screenshot({ path: OUT + '/p0-menu.png' });
  await page.tap('[data-test="T04"]'); await sleep(200);
  const testSel = await page.evaluate(() => ({ open: HF.app.menuOpen, teste: HF.app.router.testId }));
  check('Menu abre, seleciona o teste 4 e fecha', menuOpen && !testSel.open && testSel.teste === 'T04', JSON.stringify(testSel));
  const errosMenu = await page.evaluate(() => HF.app.router.errors.map((e) => e.codigo));
  check('Usar o menu (toques fora do canvas) não gera erros falsos', errosMenu.length === 0, JSON.stringify(errosMenu));
  await touch('touchStart', [L, R]); await sleep(500);
  await page.screenshot({ path: OUT + '/p0-teste4-tela.png' });
  await touch('touchEnd', []); await sleep(100);
  const report = await page.evaluate(() => HF.app.buildReport());
  fs.writeFileSync(OUT + '/relatorio-exemplo.txt', report);
  check('Relatório gerado com registro marcado pelo teste', report.includes('[T04]'));

  // Desempenho (Chromium headless: só indicativo)
  const fps = await page.evaluate(() => Math.round(HF.app.game.loop.actualFps));
  results.push({ name: 'FPS no Chromium sem placa de vídeo (apenas informativo, não vale para celular): ' + fps, ok: true, info: true });

  const KNOWN = /Ignored attempt to cancel a touchcancel event with cancelable=false/;
  const known = consoleErrors.filter((m) => KNOWN.test(m));
  const unknown = consoleErrors.filter((m) => !KNOWN.test(m));
  check('Nenhum erro de JavaScript do protótipo no console', unknown.length === 0, unknown.join(' | '));
  results.push({ name: 'Mensagem conhecida do Phaser ao receber touchcancel (inofensiva): ' + known.length + ' ocorrência(s)', ok: true, info: true });

  await browser.close();
  let ok = 0;
  for (const r of results) { console.log((r.ok ? '  ✓ ' : '  ✗ ') + r.name + (r.ok || !r.detail ? '' : '\n      ' + r.detail)); if (r.ok) ok++; }
  console.log('\n' + ok + ' de ' + results.length + ' verificações passaram.');
})().catch((e) => { console.error(e); process.exit(1); });
