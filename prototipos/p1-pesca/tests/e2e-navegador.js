/*
 * Teste ponta a ponta OPCIONAL do Protótipo P1 (pesca).
 *
 * Abre o protótipo em um navegador Chromium (Chrome/Edge) emulando um celular
 * na horizontal e simula MULTITOUCH (vários dedos ao mesmo tempo) pelo
 * protocolo de depuração do navegador (CDP, Input.dispatchTouchEvent).
 * Joga as pescarias de verdade: arremesso, espera, fisgada, briga, captura.
 *
 * Requer a biblioteca Playwright (ou playwright-core), que NÃO faz parte do
 * projeto. Não substitui o teste em celulares reais.
 *
 * Uso (com a pasta "Hangover Fishing" servida em um endereço local):
 *   node tests/e2e-navegador.js <pasta-de-saida> [endereço] [canal]
 *   ex.: node tests/e2e-navegador.js ./saida http://127.0.0.1:8765/prototipos/p1-pesca/index.html msedge
 *   (canal: msedge, chrome ou vazio para o Chromium do Playwright)
 */
'use strict';
let pw;
try { pw = require('playwright'); } catch (e) { pw = require('playwright-core'); }
const fs = require('fs');
const path = require('path');
const OUT = process.argv[2] || '.';
const URL = process.argv[3] || 'http://127.0.0.1:8765/prototipos/p1-pesca/index.html';
const CHANNEL = process.argv[4] || undefined;
const W = 844, H = 390;
const POS = { P1: { x: 200, y: 300 }, P2: { x: 640, y: 300 } };
const FINGER = { P1: 1, P2: 2 };

const results = [];
function check(name, cond, detail) {
  results.push({ name, ok: !!cond, detail: detail || '' });
  console.log((cond ? '  ✓ ' : '  ✗ ') + name + (cond || !detail ? '' : '  → ' + detail));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await pw.chromium.launch({ channel: CHANNEL });
  const context = await browser.newContext({ viewport: { width: W, height: H }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  await page.goto(URL + (URL.includes('?') ? '&' : '?') + 'seed=42');
  await page.waitForFunction(() => window.HF && HF.app && HF.app.scene && HF.app.scene.L);
  await sleep(300);
  const cdp = await context.newCDPSession(page);

  // ---------- dedos ----------
  // Observado no Chromium/Edge: touchStart/touchMove recebem todos os dedos ativos;
  // touchEnd recebe SOMENTE os dedos que estão saindo.
  const fingers = new Map();   // id -> {x, y}
  const pt = (id, p) => ({ x: p.x, y: p.y, id, radiusX: 8, radiusY: 8, force: 1 });
  const send = (type, list) => cdp.send('Input.dispatchTouchEvent', {
    type, touchPoints: list || Array.from(fingers.entries()).map(([id, p]) => pt(id, p))
  });
  const down = async (j, pos) => { fingers.set(FINGER[j], Object.assign({}, pos || POS[j])); await send('touchStart'); };
  const up = async (j) => {
    const p = fingers.get(FINGER[j]);
    if (!p) return;
    fingers.delete(FINGER[j]);
    await send('touchEnd', [pt(FINGER[j], p)]);
  };
  const move = async (j, pos) => { fingers.set(FINGER[j], pos); await send('touchMove'); };
  const isDown = (j) => fingers.has(FINGER[j]);

  // ---------- estado ----------
  const state = () => page.evaluate(() => {
    const s = HF.app.session, t = performance.now();
    const snap = (id) => {
      const p = s.players[id].snapshot(t);
      return { state: p.state, tension: p.tension, zone: p.zone, pressed: p.pressed, distance: p.distance, stats: p.stats, lastResult: p.lastResult };
    };
    return { P1: snap('P1'), P2: snap('P2'), caps: s.captures().map((c) => c.jogador), touchErrors: s.router.errors.length };
  });
  const setCfg = (obj) => page.evaluate((o) => { for (const k of Object.keys(o)) HF.app.session.setConfigValue(k, o[k]); }, obj);
  // Pausas registradas durante o jogo normal (sem interrupção provocada): devem ser 0.
  let pausasNoJogoNormal = 0;
  const resetSession = async () => {
    pausasNoJogoNormal += await page.evaluate(() => HF.app.session.pauseCount);
    await page.evaluate(() => HF.app.session.reset(42));
  };
  const session = () => page.evaluate(() => ({
    paused: HF.app.session.isPaused(), awaitingTap: HF.app.session.awaitingTap, pauseCount: HF.app.session.pauseCount,
    overlay: HF.app.scene.pauseText.visible
  }));
  /** Toque rápido com um dedo extra (id 5), por exemplo para "tocar para continuar". */
  const tapAt = async (x, y) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 5 }] });
    await sleep(40);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [{ x, y, id: 5 }] });
  };
  const shot = (name) => page.screenshot({ path: path.join(OUT, name + '.png') });
  /** Um passo do "jogador atento": segura até 0,7 de tensão, solta até 0,45. */
  async function controlStep(s, js) {
    let lutando = false;
    for (const j of js) {
      if (s[j].state !== 'FIGHTING') { if (isDown(j)) await up(j); continue; }
      lutando = true;
      if (isDown(j) && s[j].tension > 0.7) await up(j);
      else if (!isDown(j) && s[j].tension < 0.45) await down(j);
    }
    return lutando;
  }
  async function waitFor(pred, maxMs, label, pilot) {
    const end = Date.now() + (maxMs || 15000);
    let s;
    while (Date.now() < end) {
      s = await state();
      if (pred(s)) return s;
      if (pilot) await controlStep(s, pilot);
      await sleep(25);
    }
    throw new Error('tempo esgotado esperando: ' + (label || '?') + ' · ' + JSON.stringify({ P1: s.P1.state, P2: s.P2.state }));
  }
  /** Controla a briga dos jogadores indicados até terminar. */
  async function fight(js, maxMs) {
    const end = Date.now() + (maxMs || 90000);
    while (Date.now() < end) {
      const s = await state();
      if (!(await controlStep(s, js))) return s;
      await sleep(25);
    }
    throw new Error('briga não terminou');
  }
  async function castAndHook(js, holdMs) {
    for (const j of js) await down(j);
    await sleep(holdMs || 700);
    for (const j of js) await up(j);
    const pend = new Set(js);
    const end = Date.now() + 15000;
    while (pend.size && Date.now() < end) {
      const s = await state();
      for (const j of Array.from(pend)) {
        if (s[j].state === 'BITE') { await down(j); await sleep(40); await up(j); pend.delete(j); }
      }
      await sleep(30);
    }
    return state();
  }

  // shorter, deterministic waits for the run
  await setCfg({ waitMinMs: 1500, waitMaxMs: 2500 });
  await page.evaluate(() => { HF.app.session.config.nibbleMin = 0; HF.app.session.config.nibbleMax = 0; });

  let s = await state();
  check('Inicial: os dois PRONTOS, sem erros', s.P1.state === 'IDLE' && s.P2.state === 'IDLE' && consoleErrors.length === 0, JSON.stringify(consoleErrors));
  await shot('01-pronto');

  // 1. Arremessos independentes e simultâneos
  await down('P1'); await down('P2');
  await sleep(350);
  s = await state();
  check('1. Os dois carregando ao mesmo tempo', s.P1.state === 'CHARGING' && s.P2.state === 'CHARGING');
  await up('P1');
  s = await state();
  check('1. P1 solta e arremessa; P2 continua carregando', s.P1.state === 'CASTING' && s.P2.state === 'CHARGING', s.P1.state + '/' + s.P2.state);
  await shot('02-p1-arremessa-p2-carrega');
  await sleep(250);
  await up('P2');
  s = await waitFor((x) => x.P1.state === 'WAITING' && x.P2.state === 'WAITING', 3000, 'boias na água');
  const casts = await page.evaluate(() => HF.app.session.log.filter((e) => e.tipo === 'arremesso').map((e) => ({ j: e.jogador, t: e.t, forca: e.forca, d: e.distancia })));
  const c1 = casts.find((c) => c.j === 'P1'), c2 = casts.find((c) => c.j === 'P2');
  const cfg0 = await page.evaluate(() => ({ min: HF.app.session.config.castMinDistance, max: HF.app.session.config.castMaxDistance }));
  const coerente = (c) => Math.abs(c.d - (cfg0.min + (cfg0.max - cfg0.min) * c.forca)) < 0.2;
  check('1. Arremessos independentes: cada um no seu momento, distância conforme a própria força',
    c1 && c2 && c2.t - c1.t >= 200 && coerente(c1) && coerente(c2) &&
    Math.abs(s.P1.distance - c1.d) < 0.1 && Math.abs(s.P2.distance - c2.d) < 0.1, JSON.stringify(casts));
  await shot('03-esperando');

  // 2/3. Toque antecipado ignorado
  for (let i = 0; i < 3; i++) { await down('P1'); await sleep(50); await up('P1'); await sleep(80); }
  s = await state();
  check('3. Toques antecipados ignorados (P1 continua esperando)', s.P1.state === 'WAITING' && s.P1.stats.toquesPrematuros === 3, JSON.stringify(s.P1.stats.toquesPrematuros));

  // 2. Mordida chega; 4. P1 fisga; P2 deixa passar (5. atrasada)
  s = await waitFor((x) => x.P1.state === 'BITE', 6000, 'mordida P1');
  check('2. Mordida de P1 chegou depois da espera', s.P1.state === 'BITE');
  await shot('04-mordida');
  await down('P1'); await sleep(40); await up('P1');
  s = await state();
  check('4. Fisgada válida: P1 brigando', s.P1.state === 'FIGHTING' && s.P1.stats.fisgadas === 1);
  await shot('05-briga');
  // P1 continua brigando enquanto a mordida de P2 chega e passa sem toque
  s = await waitFor((x) => x.P2.state === 'BITE', 6000, 'mordida P2', ['P1']);
  s = await waitFor((x) => x.P2.state !== 'BITE', 3000, 'fim da janela de P2', ['P1']);
  await down('P2'); await sleep(40); await up('P2');
  s = await state();
  if (s.P1.state === 'FIGHTING') await controlStep(s, ['P1']);
  check('5. Sem toque na janela: peixe de P2 escapou; toque depois foi registrado como atrasado',
    s.P2.state === 'ESCAPED' && s.P2.stats.mordidasPerdidas === 1 && s.P2.stats.toquesAtrasados === 1, JSON.stringify({ st: s.P2.state, mp: s.P2.stats.mordidasPerdidas, ta: s.P2.stats.toquesAtrasados }));
  if (s.P1.state === 'FIGHTING') await fight(['P1']);
  s = await state();
  check('8. P1 capturou (briga controlada pela tensão)', s.P1.stats.capturas === 1, JSON.stringify(s.P1.lastResult));
  await shot('06-captura');

  // 10. Dois jogadores completam a pescaria juntos
  await resetSession();
  await sleep(100);
  await castAndHook(['P1', 'P2']);
  s = await state();
  check('10. Os dois fisgaram', s.P1.state === 'FIGHTING' && s.P2.state === 'FIGHTING', s.P1.state + '/' + s.P2.state);
  // 11. Dedo de P1 arrastado até a metade de P2 durante a briga
  await down('P1');
  for (let x = POS.P1.x; x <= 700; x += 60) { await move('P1', { x, y: POS.P1.y }); await sleep(16); }
  s = await state();
  check('11. Dedo de P1 na metade de P2 continua sendo de P1', s.P1.pressed === true && s.P2.pressed === false);
  await up('P1');
  s = await fight(['P1', 'P2']);
  s = await state();
  check('10. Os dois capturaram simultaneamente', s.P1.stats.capturas === 1 && s.P2.stats.capturas === 1 && s.caps.slice().sort().join() === 'P1,P2', JSON.stringify([s.P1.lastResult, s.P2.lastResult]));

  // 12. Reinício após captura
  s = await waitFor((x) => x.P1.state === 'IDLE' && x.P2.state === 'IDLE', 4000, 'voltar a pronto');
  check('12. Depois da captura, os dois voltam a PRONTO', true);

  // 6. Linha rompida (P1 segura sem parar) e 7. fuga (P2 nunca segura), ao mesmo tempo
  await castAndHook(['P1', 'P2']);
  await down('P1');
  s = await waitFor((x) => x.P1.state !== 'FIGHTING' && x.P2.state !== 'FIGHTING', 12000, 'rompida/fuga');
  await shot('07-rompida-fuga');
  await up('P1');
  check('6. Segurar sem parar arrebenta a linha de P1', s.P1.state === 'LINE_BROKEN', s.P1.state);
  check('7. Nunca segurar deixa o peixe de P2 escapar (linha frouxa)', s.P2.state === 'ESCAPED' && s.P2.lastResult.motivo === 'linha-frouxa', s.P2.state);

  // 9. Recolhimento vazio
  s = await waitFor((x) => x.P1.state === 'IDLE', 4000, 'pronto');
  await setCfg({ waitMinMs: 9000, waitMaxMs: 9000 });
  await down('P1'); await sleep(700); await up('P1');
  await waitFor((x) => x.P1.state === 'WAITING', 3000, 'esperando');
  await down('P1');
  // espera o estado (o limiar é 200 ms; a latência do navegador automatizado varia)
  s = await waitFor((x) => x.P1.state !== 'WAITING', 1500, 'recolhimento').catch(() => state());
  check('9. Segurar na espera recolhe a linha vazia', s.P1.state === 'REELING_EMPTY', s.P1.state);
  await shot('08-recolhendo');
  s = await waitFor((x) => x.P1.state === 'IDLE', 5000, 'recolhido');
  await up('P1');
  await down('P1');
  s = await state();
  check('9. Linha recolhida sem penalidade; novo arremesso imediato', s.P1.state === 'CHARGING' && s.P1.stats.recolhimentosVazios === 1);
  await up('P1');

  // ================= PATCH 01 =================
  await resetSession();
  check('P01. Nenhuma pausa durante o jogo normal (sem pausas falsas)', pausasNoJogoNormal === 0, String(pausasNoJogoNormal));
  await setCfg({ waitMinMs: 1500, waitMaxMs: 2500 });

  // D9 — vibração desligada por padrão, ativável no menu
  let vib = await page.evaluate(() => ({ sfx: HF.app.sfx.vibration, btn: document.querySelector('[data-name="vibracao"]').getAttribute('aria-pressed') }));
  check('P01 D9. Vibração começa desligada (som e botão do menu)', vib.sfx === false && vib.btn === 'false', JSON.stringify(vib));
  await page.click('#menu-button');
  await page.click('[data-name="vibracao"]');
  vib = await page.evaluate(() => ({ sfx: HF.app.sfx.vibration, btn: document.querySelector('[data-name="vibracao"]').getAttribute('aria-pressed') }));
  check('P01 D9. Botão do menu liga a vibração', vib.sfx === true && vib.btn === 'true', JSON.stringify(vib));
  await page.click('[data-name="vibracao"]');
  await page.click('[data-action="close"]');
  await sleep(100);
  await resetSession();

  // D2 — aviso do arremesso cancelado
  await down('P1'); await sleep(40); await up('P1');
  await sleep(80);
  let toast = await page.evaluate(() => ({ P1: HF.app.scene.texts.P1.toast.visible, txt: HF.app.scene.texts.P1.toast.text, P2: HF.app.scene.texts.P2.toast.visible }));
  check('P01 D2. Toque curto mostra "SEGURE PARA ARREMESSAR!" só na metade de quem tocou', toast.P1 && toast.txt === 'SEGURE PARA ARREMESSAR!' && !toast.P2, JSON.stringify(toast));
  await shot('12-aviso-segure');
  await down('P1');
  s = await state();
  check('P01 D2. Sem espera nem penalidade: o próximo toque já carrega', s.P1.state === 'CHARGING');
  await up('P1');
  await sleep(1300);
  toast = await page.evaluate(() => HF.app.scene.texts.P1.toast.visible);
  check('P01 D2. O aviso some sozinho', toast === false);

  // D8 — perda de foco durante a briga dos dois
  await resetSession();
  await castAndHook(['P1', 'P2']);
  await down('P1');                                    // P1 segurando quando a interrupção chega
  await sleep(200);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await sleep(50);
  const congelado = await page.evaluate(() => ['P1', 'P2'].map((id) => { const p = HF.app.session.players[id]; return [p.state, p.tension, p.slackMs, p.criticalMs, p.distance]; }));
  let ses = await session();
  check('P01 D8. Perda de foco pausa e pede toque para continuar', ses.paused && ses.awaitingTap && ses.overlay, JSON.stringify(ses));
  await shot('13-pausado');
  await sleep(3000);                                   // mais que o tempo de fuga por linha frouxa (2 s)
  const depois = await page.evaluate(() => ['P1', 'P2'].map((id) => { const p = HF.app.session.players[id]; return [p.state, p.tension, p.slackMs, p.criticalMs, p.distance]; }));
  check('P01 D8. Durante a pausa: estados, tensões, riscos e distâncias congelados (sem fuga nem rompimento)',
    JSON.stringify(depois) === JSON.stringify(congelado) && depois.every((d) => d[0] === 'FIGHTING'), JSON.stringify(depois));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  ses = await session();
  check('P01 D8. Recuperar o foco não retoma sozinho', ses.paused && ses.awaitingTap);
  await up('P1');                                      // o dedo antigo sai da tela durante a pausa
  await tapAt(W / 2, H / 2);                           // toque para continuar
  await sleep(100);
  ses = await session();
  s = await state();
  check('P01 D8. Toque retoma; o toque de retomada não vira ação; ninguém fica pressionado',
    !ses.paused && !ses.overlay && s.P1.state === 'FIGHTING' && s.P2.state === 'FIGHTING' && !s.P1.pressed && !s.P2.pressed && s.touchErrors === 0,
    JSON.stringify({ ses, P1: [s.P1.state, s.P1.pressed], P2: [s.P2.state, s.P2.pressed], err: s.touchErrors }));

  // D8 — página oculta (troca de app / tela bloqueada), simulada
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  ses = await session();
  check('P01 D8. Página oculta pausa a pescaria', ses.paused && ses.awaitingTap);
  await sleep(2500);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  s = await state();
  ses = await session();
  check('P01 D8. Ao voltar, ainda pausado e sem fuga', ses.awaitingTap && s.P1.state === 'FIGHTING' && s.P2.state === 'FIGHTING');
  await tapAt(W / 2, H / 2);
  await sleep(50);
  s = await fight(['P1', 'P2']);
  s = await state();
  check('P01 D8. Depois das duas interrupções, a briga termina normalmente para os dois',
    s.P1.stats.capturas + s.P1.stats.fugas + s.P1.stats.linhasRompidas === 1 && s.P2.stats.capturas + s.P2.stats.fugas + s.P2.stats.linhasRompidas === 1,
    JSON.stringify([s.P1.lastResult, s.P2.lastResult]));
  ses = await session();
  check('P01 D8. Contador de pausas = 2 (só as interrupções provocadas)', ses.pauseCount === 2, String(ses.pauseCount));

  // AJUSTE DE UX — "ARREMESSO CANCELADO" ao retomar, só para quem carregava
  await resetSession();
  await sleep(100);
  await down('P2'); await sleep(700); await up('P2');  // P2 em outro estado (boia no ar / esperando)
  await down('P1'); await sleep(400);                  // P1 carregando o arremesso
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await sleep(100);
  const toastInfo = () => page.evaluate(() => ({
    P1: HF.app.scene.texts.P1.toast.visible, txt: HF.app.scene.texts.P1.toast.text, P2: HF.app.scene.texts.P2.toast.visible
  }));
  let av = await toastInfo();
  check('P02. Durante a pausa, o aviso ainda não aparece', !av.P1 && !av.P2, JSON.stringify(av));
  await up('P1');
  await tapAt(W / 2, H / 2);
  await sleep(150);
  av = await toastInfo();
  s = await state();
  check('P02. Ao retomar: "ARREMESSO CANCELADO" só na metade de quem carregava; nada foi lançado',
    av.P1 && av.txt === 'ARREMESSO CANCELADO' && !av.P2 && s.P1.state === 'IDLE' && s.P1.stats.arremessos === 0, JSON.stringify({ av, st: s.P1.state }));
  await shot('14-arremesso-cancelado');
  await sleep(1500);
  av = await toastInfo();
  s = await state();
  check('P02. O aviso some sozinho e nenhum arremesso começa automaticamente', !av.P1 && s.P1.state === 'IDLE', JSON.stringify({ av, st: s.P1.state }));

  // Revisão da direção criativa: menu e retrato também avisam
  await resetSession();
  await sleep(100);
  await down('P2'); await sleep(400);                  // agora é P2 quem carrega
  await page.evaluate(() => HF.app.menu.open());
  await sleep(150);
  await up('P2');
  let avM = await page.evaluate(() => ({ P1: HF.app.scene.texts.P1.toast.visible, P2: HF.app.scene.texts.P2.toast.visible }));
  check('P02 menu. Com o menu aberto, o aviso ainda não aparece', !avM.P1 && !avM.P2, JSON.stringify(avM));
  await page.evaluate(() => HF.app.menu.close());
  await sleep(150);
  avM = await page.evaluate(() => ({ P1: HF.app.scene.texts.P1.toast.visible, P2: HF.app.scene.texts.P2.toast.visible, txt: HF.app.scene.texts.P2.toast.text }));
  s = await state();
  check('P02 menu. Ao fechar o menu: "ARREMESSO CANCELADO" só na metade de P2; nada lançado',
    avM.P2 && avM.txt === 'ARREMESSO CANCELADO' && !avM.P1 && s.P2.state === 'IDLE' && s.P2.stats.arremessos === 0, JSON.stringify({ avM, st: s.P2.state }));
  await sleep(1500);
  await resetSession();
  await sleep(100);
  await down('P1'); await sleep(400);                  // P1 carrega e o celular gira
  await page.setViewportSize({ width: H, height: W });
  await sleep(600);
  await up('P1');
  await page.setViewportSize({ width: W, height: H });
  await sleep(700);
  avM = await page.evaluate(() => ({ P1: HF.app.scene.texts.P1.toast.visible, P2: HF.app.scene.texts.P2.toast.visible, txt: HF.app.scene.texts.P1.toast.text }));
  s = await state();
  check('P02 retrato. Ao voltar para a horizontal: "ARREMESSO CANCELADO" só na metade de P1; nada lançado',
    avM.P1 && avM.txt === 'ARREMESSO CANCELADO' && !avM.P2 && s.P1.state === 'IDLE' && s.P1.stats.arremessos === 0, JSON.stringify({ avM, st: s.P1.state }));
  await sleep(1500);

  // Menu pausa a pescaria; diagnóstico
  await page.evaluate(() => HF.app.menu.open());
  await sleep(300);
  await page.screenshot({ path: path.join(OUT, '09-menu.png') });
  await page.evaluate(() => HF.app.menu.close());
  await page.click('#diag-button');
  await sleep(300);
  const diagText = await page.evaluate(() => document.getElementById('diag-p1').textContent);
  check('Painel de diagnóstico mostra o estado de cada jogador', diagText.includes('P1 ALEMÃO') && diagText.includes('arremessos'));
  await shot('10-diagnostico');

  // Retrato
  await page.setViewportSize({ width: H, height: W });
  await sleep(400);
  const portraitShown = await page.evaluate(() => HF.app.game.scene.getScene('OrientationScene').sys.settings.visible);
  await shot('11-retrato');
  check('Retrato: aviso "Gire o celular" visível', portraitShown);
  await page.setViewportSize({ width: W, height: H });
  await sleep(400);
  const portraitHidden = await page.evaluate(() => !HF.app.game.scene.getScene('OrientationScene').sys.settings.visible);
  check('De volta à horizontal: aviso escondido', portraitHidden);

  s = await state();
  check('Nenhum erro de toque (TouchRouter)', s.touchErrors === 0, String(s.touchErrors));
  const realErrors = consoleErrors.filter((e) => !/touchcancel|preventDefault/i.test(e));
  check('Nenhum erro de JavaScript', realErrors.length === 0, JSON.stringify(realErrors));
  const fps = await page.evaluate(() => Math.round(HF.app.game.loop.actualFps));
  console.log('  (FPS informativo neste navegador: ' + fps + ')');
  const report = await page.evaluate(() => HF.app.buildReport());
  fs.writeFileSync(path.join(OUT, 'relatorio.txt'), report);

  await browser.close();
  const ok = results.filter((r) => r.ok).length;
  console.log('\n' + ok + ' de ' + results.length + ' verificações passaram.');
  fs.writeFileSync(path.join(OUT, 'resultado.json'), JSON.stringify({ results, fps, consoleErrors }, null, 2));
  process.exitCode = ok === results.length ? 0 : 1;
})().catch((err) => { console.error(err); process.exitCode = 2; });
