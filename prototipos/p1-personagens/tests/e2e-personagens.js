/*
 * Teste ponta a ponta OPCIONAL dos personagens integrados (P1 com personagens).
 *
 * Abre a página em um Chromium (Chrome/Edge) emulando um celular na horizontal, com
 * multitouch simulado (CDP), joga pescarias de verdade com os dois jogadores e confere,
 * QUADRO A QUADRO (gravador no evento postupdate do Phaser), qual animação e qual quadro
 * cada personagem mostrou em cada estado do P1. Também compara os pixels desenhados na
 * tela com os spritesheets aprovados.
 *
 * Requer Playwright (ou playwright-core), que NÃO faz parte do projeto.
 * Uso (com a pasta "Hangover Fishing" servida em um endereço local):
 *   node tests/e2e-personagens.js <pasta-de-saida> [endereço] [canal]
 *   ex.: node tests/e2e-personagens.js ./saida http://127.0.0.1:8765/prototipos/p1-personagens/index.html msedge
 */
'use strict';
let pw;
try { pw = require('playwright'); } catch (e) { pw = require('playwright-core'); }
const fs = require('fs');
const path = require('path');
const OUT = process.argv[2] || '.';
const URL = process.argv[3] || 'http://127.0.0.1:8765/prototipos/p1-personagens/index.html';
const CHANNEL = process.argv[4] || undefined;
const W = 844, H = 390;
const POS = { P1: { x: 200, y: 300 }, P2: { x: 640, y: 300 } };
const FINGER = { P1: 1, P2: 2 };
const LEVEL = { frouxa: 1, segura: 2, alerta: 3, critica: 4 };

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
  page.on('requestfailed', (r) => consoleErrors.push('falhou: ' + r.url()));
  page.on('response', (r) => { if (r.status() >= 400) consoleErrors.push(r.status() + ' ' + r.url()); });
  await page.goto(URL + (URL.includes('?') ? '&' : '?') + 'seed=42');
  await page.waitForFunction(() => window.HF && HF.app && HF.app.scene && HF.app.scene.L && HF.app.characters);
  await sleep(300);
  const cdp = await context.newCDPSession(page);

  // ---------- gravador quadro a quadro (dentro da página) ----------
  await page.evaluate(() => {
    window.__rec = [];
    window.__recOn = false;
    const sc = HF.app.scene;
    sc.events.on('postupdate', () => {
      if (!window.__recOn) return;
      const t = performance.now(), row = { t };
      for (const id of ['P1', 'P2']) {
        const p = HF.app.session.players[id], c = HF.app.characters[id], snap = p.snapshot(t);
        row[id] = { state: p.state, zone: snap.zone, pressed: p.pressed, ms: snap.msInState,
          anim: c.shown.key.replace(c.key + '_', ''), index: c.shown.index, mode: c.anim.mode.name,
          y: c.sprite.y, x: c.sprite.x, frame: c.sprite.frame.name, tex: c.sprite.texture.key };
      }
      row.blocked = sc.isBlocked();
      window.__rec.push(row);
    });
  });
  const recStart = () => page.evaluate(() => { window.__rec = []; window.__recOn = true; });
  const recStop = () => page.evaluate(() => { window.__recOn = false; return window.__rec; });

  // ---------- dedos (mesmo método do e2e do P1) ----------
  const fingers = new Map();
  const pt = (id, p) => ({ x: p.x, y: p.y, id, radiusX: 8, radiusY: 8, force: 1 });
  const send = (type, list) => cdp.send('Input.dispatchTouchEvent', {
    type, touchPoints: list || Array.from(fingers.entries()).map(([id, p]) => pt(id, p))
  });
  const down = async (j) => { fingers.set(FINGER[j], Object.assign({}, POS[j])); await send('touchStart'); };
  const up = async (j) => {
    const p = fingers.get(FINGER[j]);
    if (!p) return;
    fingers.delete(FINGER[j]);
    await send('touchEnd', [pt(FINGER[j], p)]);
  };
  const isDown = (j) => fingers.has(FINGER[j]);
  const tapAt = async (x, y) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 5 }] });
    await sleep(40);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [{ x, y, id: 5 }] });
  };
  const state = () => page.evaluate(() => {
    const s = HF.app.session, t = performance.now();
    const snap = (id) => { const p = s.players[id].snapshot(t); return { state: p.state, tension: p.tension, zone: p.zone, pressed: p.pressed, ms: p.msInState }; };
    return { P1: snap('P1'), P2: snap('P2') };
  });
  const setCfg = (obj) => page.evaluate((o) => { for (const k of Object.keys(o)) HF.app.session.setConfigValue(k, o[k]); }, obj);
  const shot = (name) => page.screenshot({ path: path.join(OUT, name + '.png') });
  async function waitFor(pred, maxMs, label, pilot) {
    const end = Date.now() + (maxMs || 15000);
    let s;
    while (Date.now() < end) {
      s = await state();
      if (pred(s)) return s;
      if (pilot) await pilot(s);
      await sleep(20);
    }
    throw new Error('tempo esgotado esperando: ' + (label || '?') + ' · ' + JSON.stringify({ P1: s.P1.state, P2: s.P2.state }));
  }
  /** Política de briga: segura até `hi` de tensão, solta até `lo`. */
  const pilotFor = (js, lo, hi) => async (s) => {
    for (const j of js) {
      if (s[j].state !== 'FIGHTING') continue;
      if (isDown(j) && s[j].tension > hi) await up(j);
      else if (!isDown(j) && s[j].tension < lo) await down(j);
    }
  };
  async function castAndHook(js, holdMs) {
    for (const j of js) await down(j);
    await sleep(holdMs || 600);
    for (const j of js) await up(j);
    for (const j of js) await waitFor((s) => s[j].state === 'BITE', 15000, 'mordida ' + j);
    for (const j of js) await down(j);   // fisga e continua segurando
  }
  const runsOf = (rows, id) => {
    const out = [];
    for (const r of rows) {
      const k = r[id].anim + ':' + r[id].index;
      if (!out.length || out[out.length - 1].k !== k) out.push({ k, t0: r.t, t1: r.t, state: r[id].state });
      else out[out.length - 1].t1 = r.t;
    }
    return out;
  };

  await setCfg({ waitMinMs: 1200, waitMaxMs: 1800, nibbleMin: 0, nibbleMax: 0 });

  // ================= 1. Carregamento e montagem =================
  const load = await page.evaluate(() => {
    const sc = HF.app.scene, out = { tex: {}, sprites: {} };
    for (const id of ['P1', 'P2']) {
      const c = HF.app.characters[id];
      for (const a of ['idle', 'charge', 'cast', 'reel', 'catch', 'frustration']) {
        const t = sc.textures.get(c.key + '_' + a);
        out.tex[c.key + '_' + a] = { frames: t.frameTotal - 1, w: t.source[0].width, h: t.source[0].height, filter: t.source[0].scaleMode };
      }
      const sp = c.sprite;
      out.sprites[id] = { ox: sp.originX, oy: sp.originY, x: sp.x, y: sp.y, scale: sp.scaleX, sy: sp.scaleY, flip: sp.flipX, key: c.key };
    }
    out.nearest = Phaser.ScaleModes.NEAREST;
    out.groundGreybox = HF.app.scene.L.H - (HF.app.scene.texts.P1.name.height + 12);
    return out;
  });
  const want = { idle: [5, 480, 96], charge: [5, 480, 96], cast: [5, 480, 96], reel: [16, 384, 384], catch: [4, 384, 96], frustration: [4, 384, 96] };
  const texOk = Object.entries(load.tex).every(([k, v]) => { const w = want[k.split('_').slice(1).join('_')]; return v.frames === w[0] && v.w === w[1] && v.h === w[2] && v.filter === load.nearest; });
  check('Os 12 spritesheets aprovados carregaram com o número certo de quadros (5/5/5/16/4/4) e filtro nítido', texOk, JSON.stringify(load.tex));
  const sp = load.sprites;
  check('Identidade: P1 = Alemão (não espelhado), P2 = ALE (espelhado, olhando para a água)', sp.P1.key === 'alemao' && sp.P2.key === 'ale' && !sp.P1.flip && sp.P2.flip);
  check('Âncora: origin (0,5; 1), escala inteira, posição em pixel inteiro, os dois no mesmo chão',
    [sp.P1, sp.P2].every((s) => s.ox === 0.5 && s.oy === 1 && Number.isInteger(s.scale) && s.scale === s.sy && Number.isInteger(s.x) && Number.isInteger(s.y)) && sp.P1.y === sp.P2.y && Math.abs(sp.P1.y - load.groundGreybox) <= 1,
    JSON.stringify(sp));

  // ================= 2. Pixels na tela = spritesheet aprovado =================
  /** Congela o jogo (pausa de teste), fotografa e compara cada pixel opaco dos dois personagens. */
  async function pixelCompare(label) {
    await page.evaluate(() => HF.app.session.pause('teste-pixels', performance.now()));
    await sleep(120);
    const info = await page.evaluate(() => Object.fromEntries(['P1', 'P2'].map((id) => {
      const c = HF.app.characters[id];
      const f = c.anim.frame();
      // o peixe (desenhado pelo jogo) cobre a mão: essa área fica fora da comparação
      const fish = f.fish && HF.app.session.players[id].state === 'CAUGHT' ? f.frontHand : null;
      return [id, { tex: c.shown.key, index: c.shown.index, x: c.x, y: c.y, scale: c.scale, flip: c.flip, fish }];
    })));
    // Foto do PRÓPRIO canvas do Phaser (o que o jogo desenha, antes de o navegador ampliar
    // o canvas para a densidade da tela).
    const res = await page.evaluate(async ({ info, dsf }) => {
      const shotImg = await new Promise((ok) => HF.app.game.renderer.snapshot((img) => ok(img)));
      const cv = document.createElement('canvas'); cv.width = shotImg.width; cv.height = shotImg.height;
      const cx = cv.getContext('2d'); cx.drawImage(shotImg, 0, 0);
      const out = {};
      for (const id of Object.keys(info)) {
        const c = info[id];
        const art = HF.app.scene.textures.get(c.tex).getSourceImage();   // a imagem do spritesheet carregado
        const ac = document.createElement('canvas'); ac.width = art.width; ac.height = art.height;
        const ax = ac.getContext('2d'); ax.drawImage(art, 0, 0);
        const cols = art.width / 96;
        const fx0 = (c.index % cols) * 96, fy0 = Math.floor(c.index / cols) * 96;
        const a = ax.getImageData(fx0, fy0, 96, 96).data;
        const sc = c.scale * dsf, left = (c.x - 48 * c.scale) * dsf, top = (c.y - 96 * c.scale) * dsf;
        const shotData = cx.getImageData(0, 0, cv.width, cv.height).data;
        let opaque = 0, same = 0, worst = 0, semi = 0, soleRow = 0;
        for (let y = 0; y < 96; y++) for (let x = 0; x < 96; x++) {
          const k = (y * 96 + x) * 4;
          if (a[k + 3] > 0 && a[k + 3] < 255) semi++;
          if (a[k + 3] !== 255) continue;
          if (c.fish && x >= c.fish[0] - 6 && x <= c.fish[0] + 8 && y >= c.fish[1] - 1 && y <= c.fish[1] + 26) continue;
          opaque++;
          if (y === 94) soleRow++;
          const sx = c.flip ? 95 - x : x;
          // centro do bloco de pixels da tela que corresponde a este pixel da arte
          const px = Math.floor(left + sx * sc + sc / 2), py = Math.floor(top + y * sc + sc / 2);
          const j = (py * cv.width + px) * 4;
          const d = Math.max(Math.abs(shotData[j] - a[k]), Math.abs(shotData[j + 1] - a[k + 1]), Math.abs(shotData[j + 2] - a[k + 2]));
          worst = Math.max(worst, d);
          if (d <= 3) same++;
        }
        out[id] = { tex: c.tex, index: c.index, opaque, same, worst, semi, soleRow };
      }
      return out;
    }, { info, dsf: 1 });
    await page.evaluate(() => HF.app.session.resume('teste-pixels', performance.now()));
    const ok = ['P1', 'P2'].every((id) => res[id].opaque > 300 && res[id].same === res[id].opaque && res[id].semi === 0 && res[id].soleRow > 0);
    check('Pixels na tela idênticos ao spritesheet aprovado (' + label + '): sem corte, deformação, borrão ou transparência errada',
      ok, JSON.stringify(res));
    return res;
  }
  await shot('01_idle_os_dois');
  await pixelCompare('IDLE');

  // ================= 3. IDLE: ciclo e piscar independentes =================
  await recStart();
  await sleep(13000);
  let rows = await recStop();
  const blinkTimes = { P1: [], P2: [] };
  for (const id of ['P1', 'P2']) for (const r of runsOf(rows, id)) if (r.k === 'idle:4') blinkTimes[id].push(Math.round(r.t0));
  const idleSeq = runsOf(rows, 'P1').filter((r) => r.k !== 'idle:4').map((r) => r.k.split(':')[1]).join('');
  check('IDLE em loop 1 → 2 → 3 → 4 (piscar só como evento)', /^(0123)+/.test(idleSeq.slice(idleSeq.indexOf('0'))) && rows.every((r) => r.P1.anim === 'idle' && r.P2.anim === 'idle'), idleSeq.slice(0, 24));
  const together = blinkTimes.P1.filter((t) => blinkTimes.P2.some((u) => Math.abs(u - t) < 50)).length;
  check('Piscar: os dois piscam em 13 s, cada um no seu sorteio', blinkTimes.P1.length >= 2 && blinkTimes.P2.length >= 2 && together < blinkTimes.P1.length,
    JSON.stringify(blinkTimes));
  const blinkDur = runsOf(rows, 'P1').filter((r) => r.k === 'idle:4').map((r) => Math.round(r.t1 - r.t0));
  check('Piscar dura ~100 ms (um a dois quadros de tela)', blinkDur.every((d) => d <= 110), JSON.stringify(blinkDur));

  // ================= 4. Simultâneo: P1 briga enquanto P2 carrega, arremessa e espera =================
  await recStart();
  await castAndHook(['P1']);                        // P1 fisga e segura
  await sleep(200);
  await down('P2');                                 // P2 começa a carregar com P1 brigando
  await sleep(250);
  await shot('02_P1_briga_P2_carrega');
  const pilot1 = pilotFor(['P1'], 0.5, 0.7);
  await waitFor((s) => s.P2.ms > 500, 3000, 'carga P2', pilot1);
  await up('P2');                                   // P2 arremessa
  await sleep(120);
  await shot('03_P1_briga_P2_arremessa');
  await waitFor((s) => s.P1.state !== 'FIGHTING', 60000, 'fim da briga P1', pilot1);
  if (isDown('P1')) await up('P1');
  rows = await recStop();
  const mixed = rows.filter((r) => r.P1.state === 'FIGHTING');
  const p2States = new Set(mixed.map((r) => r.P2.state));
  check('P1 em FIGHTING enquanto P2 passa por IDLE, CHARGING e CASTING', ['IDLE', 'CHARGING', 'CASTING'].every((s) => p2States.has(s)), [...p2States].join(','));
  const mapOk = rows.every((r) => ['P1', 'P2'].every((id) => {
    const v = r[id];
    switch (v.state) {
      case 'IDLE': case 'WAITING': case 'BITE': return true;     // IDLE (ou saídas visuais, conferidas à parte)
      case 'CHARGING': return v.anim === 'charge';
      case 'CASTING': return v.anim === 'cast' || v.anim === 'idle';
      case 'FIGHTING': return v.anim === 'reel';
      case 'CAUGHT': return v.anim === 'catch';
      case 'ESCAPED': case 'LINE_BROKEN': return v.anim === 'frustration';
      case 'REELING_EMPTY': return v.anim === 'reel' && v.index < 4;
      default: return false;
    }
  }));
  check('Cada estado mostrou a animação certa nos dois jogadores, sem um interferir no outro', mapOk);
  const hookRow = rows.findIndex((r) => r.P1.state === 'FIGHTING');
  check('Fisgada: no PRIMEIRO quadro de tela em FIGHTING já aparece o quadro 9 (nível 3) — sem atraso',
    hookRow >= 0 && rows[hookRow].P1.anim === 'reel' && rows[hookRow].P1.index === 8, hookRow >= 0 ? JSON.stringify(rows[hookRow].P1) : 'sem briga');
  const p1Runs = runsOf(rows, 'P1');
  const hi = p1Runs.findIndex((r) => r.k === 'reel:8' && r.state === 'FIGHTING');
  const hookMs = hi >= 0 && p1Runs[hi + 1] ? Math.round(p1Runs[hi + 1].t0 - p1Runs[hi].t0) : null;
  // ~100 ms de jogo, arredondados aos quadros de tela (60 Hz: de 84 a 117 ms)
  check('Fisgada: quadro 9 por ~100 ms (do início dele ao início do quadro seguinte)', hookMs != null && hookMs >= 80 && hookMs <= 125, String(hookMs));
  const fightRows = mixed.filter((r) => r.P1.mode === 'fight');
  const lvlOk = fightRows.every((r) => Math.floor(r.P1.index / 4) + 1 === LEVEL[r.P1.zone]);
  const lvls = new Set(fightRows.map((r) => Math.floor(r.P1.index / 4) + 1));
  check('REEL/FIGHT: o nível acompanha a zona de tensão em todos os quadros', lvlOk && lvls.size >= 2, 'níveis vistos: ' + [...lvls].join(','));
  let jumpBad = 0;
  for (let i = 1; i < fightRows.length; i++) {
    const a = fightRows[i - 1].P1.index, b = fightRows[i].P1.index;
    if (Math.floor(a / 4) !== Math.floor(b / 4) && !((b % 4) === (a % 4) || (b % 4) === ((a % 4) + 1) % 4)) jumpBad++;
  }
  check('REEL/FIGHT: troca de nível preserva a posição da manivela', jumpBad === 0, String(jumpBad));
  const stillRuns = [];
  { let cur = null; for (const r of fightRows) { if (!r.P1.pressed) { if (!cur) { cur = new Set(); stillRuns.push(cur); } cur.add(r.P1.index % 4); } else cur = null; } }
  check('REEL/FIGHT: soltando, a manivela fica parada', stillRuns.length > 0 && stillRuns.every((s) => s.size === 1), stillRuns.map((s) => [...s].join('')).join(' '));
  check('Pés fixos: o sprite nunca saiu do lugar durante a briga e o arremesso', rows.every((r) => r.P1.y === sp.P1.y && r.P2.y === sp.P2.y && r.P1.x === sp.P1.x && r.P2.x === sp.P2.x));

  // ================= 5. CATCH com pose mantida durante o cartão =================
  await page.evaluate(() => HF.app.session.reset(7));
  await waitFor((s) => s.P1.state === 'IDLE' && s.P2.state === 'IDLE', 3000, 'reset');
  await recStart();
  let caught = false;
  for (let attempt = 0; attempt < 4 && !caught; attempt++) {
    await castAndHook(['P1', 'P2']);
    await waitFor((s) => s.P1.state !== 'FIGHTING' && s.P2.state !== 'FIGHTING', 90000, 'briga dos dois', pilotFor(['P1', 'P2'], 0.4, 0.6));
    for (const j of ['P1', 'P2']) if (isDown(j)) await up(j);
    const s = await state();
    caught = s.P1.state === 'CAUGHT' || s.P2.state === 'CAUGHT';
    if (caught) {
      await sleep(900);
      await shot('04_catch_pose_final_durante_o_cartao');
      await pixelCompare('CATCH');
      await sleep(400);
      await shot('05_catch_cartao_quase_no_fim');
    }
    await waitFor((x) => x.P1.state === 'IDLE' && x.P2.state === 'IDLE', 5000, 'fim dos cartões');
    await sleep(400);
  }
  rows = await recStop();
  for (const id of ['P1', 'P2']) {
    const cr = rows.filter((r) => r[id].state === 'CAUGHT');
    if (!cr.length) continue;
    const t0 = cr[0].t;
    const seq = runsOf(rows.filter((r) => r.t >= t0 - 1 && r.t <= cr[cr.length - 1].t + 400), id).map((r) => r.k);
    const held = cr.filter((r) => r.t - t0 > 560);
    check('CATCH (' + id + '): 1 → 2 → 3 → 4 e a pose final fica parada até o fim do cartão (' + Math.round(cr[cr.length - 1].t - t0) + ' ms)',
      seq.slice(0, 4).join() === 'catch:0,catch:1,catch:2,catch:3' && held.length > 30 && held.every((r) => r[id].anim === 'catch' && r[id].index === 3), seq.slice(0, 8).join(' '));
    check('CATCH (' + id + '): saída 4 → 2 → 1 → IDLE quando o cartão termina', seq.slice(3, 7).join() === 'catch:3,catch:1,catch:0,idle:0', seq.slice(3, 8).join(' '));
  }
  check('Captura aconteceu no teste', caught);

  // ================= 6. FRUSTRATION: linha rompida (P1) e fuga (P2) =================
  await page.evaluate(() => HF.app.session.reset(9));
  await waitFor((s) => s.P1.state === 'IDLE' && s.P2.state === 'IDLE', 3000, 'reset');
  await recStart();
  await castAndHook(['P1', 'P2']);
  await sleep(60);
  await up('P2');                                    // P2 nunca mais segura: linha frouxa → fuga
  await waitFor((s) => s.P1.state === 'LINE_BROKEN' && s.P2.state === 'ESCAPED', 30000, 'rompimento e fuga');
  await up('P1');
  await sleep(700);
  await shot('06_frustration_linha_rompida_e_fuga');
  await waitFor((s) => s.P1.state === 'IDLE' && s.P2.state === 'IDLE', 5000, 'fim dos cartões');
  await sleep(400);
  rows = await recStop();
  for (const [id, st] of [['P1', 'LINE_BROKEN'], ['P2', 'ESCAPED']]) {
    const fr = rows.filter((r) => r[id].state === st);
    const t0 = fr[0].t;
    const seq = runsOf(rows.filter((r) => r.t >= t0 - 1), id).map((r) => r.k);
    const held = fr.filter((r) => r.t - t0 > 400);
    check('FRUSTRATION (' + st + '): 1 → 2 → 3 mantido durante o cartão → 2 → 4 → IDLE',
      seq.slice(0, 6).join() === 'frustration:0,frustration:1,frustration:2,frustration:1,frustration:3,idle:0' && held.every((r) => r[id].index === 2), seq.slice(0, 7).join(' '));
  }

  // ================= 7. Cartão pulado → CHARGE na hora =================
  await castAndHook(['P1']);
  await waitFor((s) => s.P1.state === 'LINE_BROKEN', 30000, 'rompimento');
  await up('P1');
  await sleep(750);
  await recStart();
  await down('P1');
  await sleep(150);
  rows = await recStop();
  const firstCharge = rows.findIndex((r) => r.P1.state === 'CHARGING');
  check('Cartão pulado (toque após 0,6 s): CHARGE no mesmo quadro de tela, sem tocar a saída',
    firstCharge >= 0 && rows[firstCharge].P1.anim === 'charge' && rows.slice(firstCharge).every((r) => r.P1.anim === 'charge'), firstCharge >= 0 ? JSON.stringify(rows[firstCharge].P1) : '');
  await up('P1');
  await waitFor((s) => s.P1.state !== 'CHARGING' && s.P1.state !== 'CASTING', 3000, 'arremesso');

  // ================= 8. Recolhimento vazio: completar a volta =================
  await page.evaluate(() => HF.app.session.reset(11));
  await setCfg({ waitMinMs: 6000, waitMaxMs: 7000 });
  await waitFor((s) => s.P1.state === 'IDLE', 3000, 'reset');
  await down('P1'); await sleep(900); await up('P1');
  await waitFor((s) => s.P1.state === 'WAITING', 3000, 'boia na água');
  await recStart();
  for (const holdMs of [330, 420, 510]) {            // solta em posições diferentes da manivela
    await down('P1');
    await waitFor((s) => s.P1.state === 'REELING_EMPTY', 2000, 'recolhendo');
    await sleep(holdMs);
    await up('P1');
    await sleep(500);
  }
  await shot('07_recolhimento_vazio');
  rows = await recStop();
  const starts = [], exits = [];
  for (let i = 1; i < rows.length; i++) {
    const a = rows[i - 1].P1, b = rows[i].P1;
    if (a.state !== 'REELING_EMPTY' && b.state === 'REELING_EMPTY') starts.push(b);
    if (a.state === 'REELING_EMPTY' && b.state === 'WAITING') {
      const after = rows.slice(i, i + 40).map((r) => r.P1);
      const firstIdle = after.findIndex((v) => v.anim === 'idle');
      const reelPart = after.slice(0, firstIdle).map((v) => v.index);
      exits.push({ from: a.index, seq: reelPart, idleAfter: firstIdle, ms: firstIdle >= 0 ? Math.round(rows[i + firstIdle].t - rows[i].t) : null, logic: after.slice(0, Math.max(1, firstIdle)).every((v) => v.state === 'WAITING') });
    }
  }
  check('Recolhimento vazio começa sempre na posição 1 (índice 0)', starts.length === 3 && starts.every((v) => v.anim === 'reel' && v.index === 0), JSON.stringify(starts.map((v) => v.index)));
  const exitOk = exits.length === 3 && exits.every((e) => e.idleAfter >= 0 && e.ms <= 300 && e.logic && (e.seq.length === 0 ? e.from === 0 : e.seq[e.seq.length - 1] === 0));
  check('Completar a volta: ao soltar, a lógica já está em WAITING e o visual termina na posição 1 antes do IDLE (≤ 270 ms + 1 quadro)', exitOk, JSON.stringify(exits));

  // ================= 9. Interrupções: perda de foco, página oculta, menu =================
  await page.evaluate(() => HF.app.session.reset(13));
  await setCfg({ waitMinMs: 1200, waitMaxMs: 1800 });
  await waitFor((s) => s.P1.state === 'IDLE', 3000, 'reset');
  await castAndHook(['P1']);
  await sleep(300);
  await recStart();
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await sleep(1500);
  rows = await recStop();
  const pausedRows = rows.filter((r) => r.blocked);
  const frozen = pausedRows.length > 10 && pausedRows.every((r) => r.P1.anim === pausedRows[0].P1.anim && r.P1.index === pausedRows[0].P1.index && r.P2.index === pausedRows[0].P2.index);
  check('Perda de foco: personagens congelados durante a pausa (sem girar manivela nem piscar)', frozen, pausedRows.length + ' quadros');
  fingers.clear();
  await tapAt(422, 200);
  await sleep(200);
  await recStart();
  await sleep(600);
  rows = await recStop();
  check('Depois de retomar: a animação volta a andar e acompanha o estado (sem ficar presa)',
    rows.length > 10 && !rows.some((r) => r.blocked) && rows.every((r) => r.P1.state !== 'FIGHTING' || r.P1.anim === 'reel'), rows.length ? JSON.stringify(rows[rows.length - 1].P1) : '');
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  await sleep(400);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
  await tapAt(422, 200);
  await page.evaluate(() => HF.app.menu.open()); await sleep(300); await page.evaluate(() => HF.app.menu.close());
  await waitFor((s) => s.P1.state !== 'FIGHTING', 60000, 'fim da briga', pilotFor(['P1'], 0.45, 0.65));
  if (isDown('P1')) await up('P1');
  await waitFor((s) => s.P1.state === 'IDLE', 5000, 'volta ao IDLE');
  await sleep(500);
  const finalView = await page.evaluate(() => ({ P1: HF.app.characters.P1.shown.key, P2: HF.app.characters.P2.shown.key, m1: HF.app.characters.P1.anim.mode.name, m2: HF.app.characters.P2.anim.mode.name }));
  check('Depois de oculta/visível e do menu: os dois terminam no IDLE (nenhuma animação presa)', finalView.m1 === 'idle' && finalView.m2 === 'idle', JSON.stringify(finalView));

  // ================= 10. Menu "Reiniciar sessão" no meio de uma briga =================
  await castAndHook(['P1']);
  await sleep(300);
  await page.evaluate(() => HF.app.session.reset(17));
  fingers.clear();
  await sleep(200);
  const afterReset = await page.evaluate(() => HF.app.characters.P1.anim.mode.name);
  check('Sessão reiniciada no meio da briga: o personagem volta ao IDLE (ressincronização)', afterReset === 'idle', afterReset);

  // ================= 11. Erros =================
  check('Nenhum erro de JavaScript nem arquivo faltando', consoleErrors.length === 0, JSON.stringify(consoleErrors));
  const fps = await page.evaluate(() => Math.round(HF.app.game.loop.actualFps));
  console.log('  (FPS informativo neste navegador: ' + fps + ')');

  const passed = results.filter((r) => r.ok).length;
  console.log('\n' + passed + ' de ' + results.length + ' verificações passaram.');
  fs.writeFileSync(path.join(OUT, 'resultado-e2e-personagens.json'), JSON.stringify({ results, consoleErrors, fps }, null, 2));
  await browser.close();
  process.exit(passed === results.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
