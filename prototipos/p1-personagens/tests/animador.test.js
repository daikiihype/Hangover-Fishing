/*
 * Testes da camada visual (CharacterAnimator) com a máquina de estados REAL do P1.
 * Sem navegador e sem Phaser:  node prototipos/p1-personagens/tests/animador.test.js
 *
 * Cada teste joga uma pescaria com o FishingPlayer do P1 (sem alterações), liga o
 * animador às transições de estado e confere, a cada 10 ms, o quadro mostrado contra
 * os JSONs aprovados das animações.
 */
'use strict';
const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const P1 = path.join(ROOT, 'prototipos', 'p1-pesca', 'src');
const ART = path.join(ROOT, 'arte', 'personagens-animacoes');

require(path.join(P1, 'logic', 'Random.js'));
const Random = require(path.join(P1, 'logic', 'Random.js'));
const FishingPlayer = require(path.join(P1, 'logic', 'FishingPlayer.js'));
const { createConfig } = require(path.join(P1, 'logic', 'config.js'));
const CharacterAnimator = require(path.join(__dirname, '..', 'src', 'visual', 'CharacterAnimator.js'));

const DATA = {
  idle: require(path.join(ART, 'idle', 'idle.json')),
  charge: require(path.join(ART, 'charge', 'charge.json')),
  cast: require(path.join(ART, 'cast', 'cast.json')),
  reel: require(path.join(ART, 'reel-fight', 'reel_fight.json')),
  catch: require(path.join(ART, 'catch', 'catch.json')),
  frustration: require(path.join(ART, 'frustration', 'frustration.json'))
};

const STEP = 10;
let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ✓ ' + name); } catch (e) { failed++; console.log('  ✗ ' + name + '\n      ' + e.message); }
}

/** Uma pescaria de um jogador com animador. withAnimator=false: só a lógica (para comparar). */
function rig(opts) {
  opts = opts || {};
  const cfg = createConfig(Object.assign({ nibbleMin: 0, nibbleMax: 0 }, opts.config || {}));
  const log = [];
  const rng = new Random(opts.blinkSeed || 7);
  const r = { t: 1000, frames: [] };
  const anim = opts.withAnimator === false ? null
    : new CharacterAnimator({ character: opts.character || 'alemao', data: DATA, random: () => rng.next() });
  const player = new FishingPlayer({
    id: 'P1', label: 'ALEMÃO', config: cfg, seed: opts.seed || 11, time: r.t,
    emit: (e) => {
      log.push(JSON.stringify(e));
      if (anim && e.tipo === 'estado') anim.onState(e.de, e.para, { castPower: player.castPower, pressed: player.pressed });
    }
  });
  Object.assign(r, {
    cfg, log, anim, player,
    step(ms, cb) {
      for (let k = 0; k < ms; k += STEP) {
        r.t += STEP;
        player.update(r.t);
        if (anim) {
          const snap = player.snapshot(r.t);
          anim.update(STEP, snap);
          const f = anim.frame();
          r.frames.push({ t: r.t, state: player.state, anim: f.anim, index: f.index, mode: f.mode, pressed: snap.pressed, zone: snap.zone });
        }
        if (cb && cb(r) === false) break;
      }
    },
    press() { player.press(r.t); },
    release(o) { player.release(r.t, o); },
    until(cond, max, cb) { let n = 0; while (!cond(r) && n < (max || 60000)) { r.step(STEP, cb); n += STEP; } assert.ok(cond(r), 'condição não atingida em ' + max + ' ms (estado ' + player.state + ')'); },
    last() { return r.frames[r.frames.length - 1]; },
    since(t0) { return r.frames.filter((f) => f.t > t0); }
  });
  return r;
}

/** Quadros a partir do primeiro em que o P1 já está no estado (depois de tMin). */
function fromState(r, state, tMin) {
  const i = r.frames.findIndex((f) => f.t > (tMin || 0) && f.state === state);
  assert.ok(i >= 0, 'estado ' + state + ' não encontrado');
  return r.frames.slice(i);
}

/** Joga até a boia cair na água (carga curta, força baixa). */
function castAndLand(r, holdMs) {
  r.press(); r.step(holdMs || 300); r.release();
  r.until((x) => x.player.state === 'WAITING', 3000);
}

/** Política de briga que captura: segura enquanto a tensão estiver baixa. */
function fightToCatch(r) {
  r.until((x) => x.player.state !== 'FIGHTING', 60000, (x) => {
    const p = x.player;
    if (p.state !== 'FIGHTING') return;
    if (p.tension < 0.55 && !p.pressed) p.press(x.t);
    else if (p.tension > 0.6 && p.pressed) p.release(x.t, {});
  });
}

/** Sequência de índices (sem repetições seguidas) de um trecho de quadros. */
function runs(frames) {
  const out = [];
  for (const f of frames) {
    const k = f.anim + ':' + f.index;
    if (!out.length || out[out.length - 1].k !== k) out.push({ k, anim: f.anim, index: f.index, t0: f.t, ms: STEP });
    else out[out.length - 1].ms += STEP;
  }
  return out;
}

console.log('CharacterAnimator × FishingPlayer (P1 real)');

// ---------------------------------------------------------------- IDLE
test('IDLE: ciclo 0 → 1 → 2 → 3 com 700/500/700/500 ms (idle.json)', () => {
  const r = rig({ blinkSeed: 3 });
  r.step(4800);
  const rs = runs(r.frames).filter((x) => x.index !== 4);
  const seq = rs.slice(0, 8).map((x) => x.index);
  assert.deepStrictEqual(seq, [0, 1, 2, 3, 0, 1, 2, 3]);
  // durações (sem o primeiro trecho e somando o piscar ao quadro onde aconteceu)
  const idx = r.frames.map((f) => (f.index === 4 ? 'b' : f.index));
  const dur = {}; let cur = null, n = 0;
  for (const v of idx) { const k = v === 'b' ? cur : v; if (k !== cur) { if (cur != null) (dur[cur] = dur[cur] || []).push(n); cur = k; n = 0; } n += STEP; }
  for (const [k, ms] of [[1, 500], [3, 500]]) assert.ok(dur[k].every((v) => v === ms), 'quadro ' + k + ': ' + dur[k]);
  for (const k of [0, 2]) assert.ok(dur[k].slice(1).every((v) => v === 700), 'quadro ' + k + ': ' + dur[k]);
});

test('IDLE: piscar de 100 ms, só nos quadros 1 e 3, aos 300 ms do quadro, a cada 3–6 s', () => {
  const r = rig({ blinkSeed: 5 });
  r.step(60000);
  const blinks = [];
  let prev = null, frameStart = 0;
  for (const f of r.frames) {
    if (prev && prev.index !== f.index && f.index !== 4 && prev.index !== 4) frameStart = f.t;
    if (prev && prev.index !== 4 && f.index !== 4 && prev.index !== f.index) frameStart = f.t;
    if (f.index === 4 && (!prev || prev.index !== 4)) blinks.push({ t: f.t, base: prev.index, offset: f.t - frameStart, ms: 0 });
    if (f.index === 4) blinks[blinks.length - 1].ms += STEP;
    prev = f;
  }
  assert.ok(blinks.length >= 9 && blinks.length <= 20, blinks.length + ' piscares em 60 s');
  for (const b of blinks) {
    assert.strictEqual(b.ms, 100, 'duração ' + b.ms);
    assert.ok(b.base === 0 || b.base === 2, 'piscou no quadro ' + (b.base + 1));
    assert.ok(Math.abs(b.offset - 300) <= STEP, 'começou aos ' + b.offset + ' ms do quadro');
  }
  for (let i = 1; i < blinks.length; i++) {
    const gap = blinks[i].t - blinks[i - 1].t;
    assert.ok(gap >= 3000 && gap <= 6000 + 2400, 'intervalo ' + gap + ' ms');
  }
});

test('IDLE: cada personagem pisca no seu próprio sorteio (não piscam juntos)', () => {
  const a = rig({ blinkSeed: 1 }), b = rig({ blinkSeed: 2, character: 'ale' });
  a.step(30000); b.step(30000);
  const ta = a.frames.filter((f) => f.index === 4).map((f) => f.t);
  const tb = new Set(b.frames.filter((f) => f.index === 4).map((f) => f.t));
  assert.ok(ta.length > 0 && tb.size > 0);
  assert.ok(ta.filter((t) => tb.has(t)).length < ta.length, 'piscaram exatamente juntos');
});

// ---------------------------------------------------------------- CHARGE / CAST
test('CHARGE: preparação 0 (100 ms) → 1 (100 ms) → quadro pela força (0–33 → 2, 34–66 → 3, 67–100 → 4)', () => {
  const r = rig();
  const t0 = r.t; r.press(); r.step(1600);
  const fs = r.since(t0);
  // (cada amostra mostra o quadro depois de somar os 10 ms do passo)
  assert.ok(fs.filter((f) => f.t - t0 < 100).every((f) => f.anim === 'charge' && f.index === 0), 'quadro 1 nos primeiros 100 ms');
  assert.ok(fs.filter((f) => f.t - t0 >= 100 && f.t - t0 < 200).every((f) => f.index === 1), 'quadro 2 de 100 a 200 ms');
  for (const f of fs.filter((x) => x.t - t0 >= 200)) {
    const pct = Math.round(r.player.chargePower(f.t) * 100);
    const want = pct <= 33 ? 2 : pct <= 66 ? 3 : 4;
    assert.strictEqual(f.index, want, 'força ' + pct + '% em ' + (f.t - t0) + ' ms');
  }
});

test('CHARGE: toque curto → 1 → 0 (60 ms cada) → IDLE; a lógica cancela na hora', () => {
  const r = rig();
  r.press(); r.step(150); r.release();
  assert.strictEqual(r.player.state, 'IDLE');
  const t0 = r.t; r.step(300);
  const rs = runs(r.since(t0));
  assert.deepStrictEqual(rs.slice(0, 3).map((x) => x.k), ['charge:1', 'charge:0', 'idle:0']);
  assert.ok(Math.abs(rs[0].ms - 60) <= STEP, 'quadro 2: ' + rs[0].ms); assert.strictEqual(rs[1].ms, 60);
});

test('CAST: 5 quadros com os tempos da faixa de força da soltura; termina no IDLE', () => {
  for (const [hold, band] of [[210, 'baixa'], [400, 'media'], [700, 'alta']]) {
    const r = rig();
    r.press(); r.step(hold);
    const pct = Math.round(r.player.chargePower(r.t) * 100);
    const want = pct <= 33 ? 'baixa' : pct <= 66 ? 'media' : 'alta';
    assert.strictEqual(want, band, 'faixa esperada para ' + hold + ' ms');
    r.release();
    const t0 = r.t; r.step(700);
    const rs = runs(r.since(t0));
    const ms = DATA.cast.reproducao.faixas[band].msPorQuadro;
    assert.deepStrictEqual(rs.slice(0, 6).map((x) => x.k), ['cast:0', 'cast:1', 'cast:2', 'cast:3', 'cast:4', 'idle:0'], band);
    // o primeiro quadro começa no passo seguinte ao comando (até 10 ms de arredondamento)
    rs.slice(1, 5).forEach((x, i) => assert.ok(Math.abs(x.ms - ms[i + 1]) <= STEP, band + ' quadro ' + (i + 2) + ': ' + x.ms + ' ≠ ' + ms[i + 1]));
  }
});

test('CAST: a boia cai antes do fim do CAST (voo de 450 ms) e o CAST não é cortado', () => {
  const r = rig();
  r.press(); r.step(1600); r.release();    // ciclo completo: força 0 → voo de 450 ms, CAST de 460 ms
  const t0 = r.t; r.step(600);
  const fs = r.since(t0);
  const landed = fs.find((f) => f.state === 'WAITING');
  assert.ok(landed && landed.anim === 'cast', 'quando a boia caiu, o CAST ainda tocava');
  assert.deepStrictEqual(runs(fs).map((x) => x.k).slice(0, 6), ['cast:0', 'cast:1', 'cast:2', 'cast:3', 'cast:4', 'idle:0']);
});

// ---------------------------------------------------------------- REELING_EMPTY (completar a volta)
test('Recolhimento vazio: começa SEMPRE na posição 1 e gira 90 ms por posição (nível 1)', () => {
  const r = rig();
  castAndLand(r);
  r.step(1000);
  r.press(); r.until((x) => x.player.state === 'REELING_EMPTY', 1000);
  const t0 = r.t; r.step(800);
  const rs = runs(fromState(r, 'REELING_EMPTY', t0 - 2 * STEP));
  assert.strictEqual(rs[0].k, 'reel:0');
  assert.deepStrictEqual(rs.slice(0, 6).map((x) => x.index), [0, 1, 2, 3, 0, 1]);
  rs.slice(1, 5).forEach((x) => assert.strictEqual(x.ms, 90));
});

test('Completar a volta — soltura antecipada: a lógica volta a WAITING na hora; o visual completa até a posição 1 (≤ 270 ms) e então IDLE', () => {
  for (const extra of [0, 90, 180, 270]) {
    const r = rig();
    castAndLand(r); r.step(500);
    r.press(); r.until((x) => x.player.state === 'REELING_EMPTY', 1000);
    r.step(100 + extra);
    const pos = r.last().index;
    r.release();
    assert.strictEqual(r.player.state, 'WAITING', 'lógica: espera retomada imediatamente');
    const t0 = r.t; r.step(400);
    const fs = r.since(t0);
    const rs = runs(fs);
    const home = fs.findIndex((f) => f.anim === 'reel' && f.index === 0);
    const idle = fs.findIndex((f) => f.anim === 'idle');
    if (pos === 0) assert.strictEqual(fs[0].anim, 'idle', 'já na posição 1: IDLE imediato');
    else {
      assert.ok(home >= 0 && idle === home + 1, 'mostra a posição 1 e o IDLE vem no quadro seguinte');
      assert.ok((home + 1) * STEP <= 270, 'chegou à posição 1 em ' + ((home + 1) * STEP) + ' ms');
      const order = rs.filter((x) => x.anim === 'reel').map((x) => x.index);
      for (let i = 1; i < order.length; i++) assert.strictEqual(order[i], (order[i - 1] + 1) % 4, 'sem saltos: ' + order);
    }
    assert.ok(fs.every((f) => f.state === 'WAITING'), 'a finalização não mexe na lógica');
  }
});

test('Completar a volta — conclusão (linha recolhida → IDLE): completa até a posição 1, depois IDLE', () => {
  const r = rig({ config: { emptyReelSpeed: 14 } });
  castAndLand(r, 210);
  r.step(300);
  r.press();
  r.until((x) => x.player.state === 'IDLE', 5000);
  const t0 = r.t - STEP;
  const pos = r.frames[r.frames.length - 1].index;
  r.step(400);
  const fs = r.frames.filter((f) => f.t >= t0);
  if (pos !== 0) {
    const home = fs.findIndex((f) => f.anim === 'reel' && f.index === 0);
    assert.ok(home >= 0 && fs[home + 1].anim === 'idle', 'posição 1 e depois IDLE');
  } else assert.strictEqual(fs[1].anim, 'idle');
  r.release();
  assert.strictEqual(r.player.state, 'IDLE');
});

test('Completar a volta — voltou a segurar durante a finalização: continua da posição atual, sem salto', () => {
  const r = rig();
  castAndLand(r); r.step(500);
  r.press(); r.until((x) => x.player.state === 'REELING_EMPTY', 1000);
  r.step(120);                               // posição 2
  r.release();
  r.step(20);
  const before = r.last();
  assert.strictEqual(before.mode, 'finishing');
  r.press(); r.until((x) => x.player.state === 'REELING_EMPTY', 1000);
  const fs = r.frames.slice(r.frames.indexOf(before));
  const order = runs(fs).map((x) => x.index);
  assert.ok(fs.every((f) => f.anim === 'reel'), 'não passou pelo IDLE');
  for (let i = 1; i < order.length; i++) assert.strictEqual(order[i], (order[i - 1] + 1) % 4, 'sequência ' + order);
});

test('Completar a volta — prioridade da lógica: uma carga nova durante a finalização troca na hora', () => {
  const r = rig({ config: { emptyReelSpeed: 14 } });
  castAndLand(r, 210); r.step(200);
  r.press();
  let found = false;
  r.until((x) => x.player.state === 'IDLE', 5000);
  const f = r.last();
  r.release();
  if (f.mode === 'finishing') {
    r.press();                               // toque novo logo depois: CHARGING
    r.step(STEP);
    assert.strictEqual(r.player.state, 'CHARGING');
    assert.strictEqual(r.last().anim, 'charge');
    found = true;
  }
  assert.ok(found || f.mode === 'idle', 'cenário coberto');
});

test('Completar a volta — fisgada durante a finalização troca na hora; FIGHTING não usa a regra', () => {
  const r = rig({ config: { waitMinMs: 900, waitMaxMs: 900 } });
  castAndLand(r);
  r.step(200);
  r.press(); r.until((x) => x.player.state === 'REELING_EMPTY', 1000);
  r.step(100);
  r.release();                                // resta ~400 ms de espera
  r.until((x) => x.player.state === 'BITE', 2000);
  r.press();                                  // fisga
  assert.strictEqual(r.player.state, 'FIGHTING');
  r.step(STEP);
  assert.deepStrictEqual([r.last().anim, r.last().index], ['reel', 8], 'quadro da fisgada');
});

// ---------------------------------------------------------------- Fisgada e briga
test('Fisgada: quadro 9 (índice 8, nível 3 posição 1) por 100 ms, sem atrasar a lógica', () => {
  const r = rig({ config: { waitMinMs: 600, waitMaxMs: 600 } });
  castAndLand(r);
  r.until((x) => x.player.state === 'BITE', 3000);
  r.press();
  assert.strictEqual(r.player.state, 'FIGHTING', 'a lógica já está brigando no mesmo instante do toque');
  const t0 = r.t; r.step(300);
  const rs = runs(r.since(t0));
  assert.strictEqual(rs[0].k, 'reel:8');
  assert.ok(Math.abs(rs[0].ms - 100) <= STEP, 'duração ' + rs[0].ms);
  // segurando depois da fisgada: segue da posição 2 no nível da tensão
  const next = rs[1];
  assert.strictEqual(next.index % 4, 1, 'posição 2 (segurando): ' + next.k);
});

test('Briga: o nível acompanha a zona de tensão na hora e preserva a posição da manivela', () => {
  const r = rig({ config: { waitMinMs: 600, waitMaxMs: 600 } });
  castAndLand(r);
  r.until((x) => x.player.state === 'BITE', 3000);
  r.press();
  r.until((x) => x.player.state !== 'FIGHTING', 20000);   // segura até romper
  const fight = r.frames.filter((f) => f.state === 'FIGHTING' && f.mode === 'fight');
  const lv = { frouxa: 1, segura: 2, alerta: 3, critica: 4 };
  assert.ok(fight.length > 50);
  for (const f of fight) assert.strictEqual(Math.floor(f.index / 4) + 1, lv[f.zone], 'zona ' + f.zone + ' → índice ' + f.index);
  const levels = new Set(fight.map((f) => Math.floor(f.index / 4)));
  assert.ok(levels.size >= 2, 'passou por mais de um nível');
  for (let i = 1; i < fight.length; i++) {
    const a = fight[i - 1], b = fight[i];
    if (Math.floor(a.index / 4) !== Math.floor(b.index / 4)) {
      const pa = a.index % 4, pb = b.index % 4;
      assert.ok(pb === pa || pb === (pa + 1) % 4, 'troca de nível com salto de manivela ' + pa + ' → ' + pb);
    }
  }
  assert.strictEqual(r.player.state, 'LINE_BROKEN');
});

test('Briga: soltar PARA a manivela (sem completar a volta); segurar volta a girar', () => {
  const r = rig({ config: { waitMinMs: 600, waitMaxMs: 600 } });
  castAndLand(r);
  r.until((x) => x.player.state === 'BITE', 3000);
  r.press(); r.step(250);
  r.release();
  const t0 = r.t; r.step(400);
  const pos = new Set(r.since(t0).filter((f) => f.state === 'FIGHTING').map((f) => f.index % 4));
  assert.strictEqual(pos.size, 1, 'manivela parada (posições ' + [...pos] + ')');
  r.press();
  const t1 = r.t; r.step(400);
  const pos2 = new Set(r.since(t1).filter((f) => f.state === 'FIGHTING').map((f) => f.index % 4));
  assert.ok(pos2.size >= 3, 'manivela girando de novo');
});

// ---------------------------------------------------------------- CATCH
test('CATCH: 1 → 2 → 3 (150/150/200 ms) e o quadro 4 fica PARADO durante todo o cartão de 2,2 s', () => {
  const r = rig({ config: { waitMinMs: 600, waitMaxMs: 600, castMinDistance: 6 } });
  castAndLand(r);
  r.until((x) => x.player.state === 'BITE', 3000);
  r.press();
  fightToCatch(r);
  assert.strictEqual(r.player.state, 'CAUGHT');
  if (r.player.pressed) r.release({});
  const t0 = r.t - 2 * STEP;
  r.until((x) => x.player.state === 'IDLE', 3000);
  r.step(400);
  const fs = fromState(r, 'CAUGHT', t0);
  const rs = runs(fs);
  assert.deepStrictEqual(rs.slice(0, 7).map((x) => x.k), ['catch:0', 'catch:1', 'catch:2', 'catch:3', 'catch:1', 'catch:0', 'idle:0']);
  [150, 150, 200].forEach((ms, i) => assert.ok(Math.abs(rs[i].ms - ms) <= STEP, 'quadro ' + (i + 1) + ': ' + rs[i].ms));
  const card = fs.filter((f) => f.state === 'CAUGHT');
  const hold = card.filter((f) => f.t - t0 > 500 + STEP);
  assert.ok(hold.length > 150 && hold.every((f) => f.anim === 'catch' && f.index === 3), 'pose final mantida até o fim do cartão');
  assert.ok(Math.abs(rs[4].ms - 100) <= STEP, 'saída quadro 2: ' + rs[4].ms); assert.strictEqual(rs[5].ms, 100);
  assert.strictEqual(rs[6].anim, 'idle', 'saída 4 → 2 → 1 → IDLE');
});

test('CATCH: cartão pulado (toque após 0,6 s) → CHARGE na hora, sem tocar a saída', () => {
  const r = rig({ config: { waitMinMs: 600, waitMaxMs: 600 } });
  castAndLand(r);
  r.until((x) => x.player.state === 'BITE', 3000);
  r.press();
  fightToCatch(r);
  if (r.player.pressed) r.release({});
  r.step(800);
  r.press();
  assert.strictEqual(r.player.state, 'CHARGING');
  r.step(STEP);
  assert.deepStrictEqual([r.last().anim, r.last().index], ['charge', 0]);
});

// ---------------------------------------------------------------- FRUSTRATION
function frustrationCheck(r, label) {
  const t0 = r.t - 30 * STEP;
  r.until((x) => x.player.state === 'IDLE', 3000);
  r.step(400);
  const fs = fromState(r, r.resultState, t0);
  const rs = runs(fs);
  assert.deepStrictEqual(rs.slice(0, 6).map((x) => x.k), ['frustration:0', 'frustration:1', 'frustration:2', 'frustration:1', 'frustration:3', 'idle:0'], label);
  [150, 200].forEach((ms, i) => assert.ok(Math.abs(rs[i].ms - ms) <= STEP, label + ' quadro ' + (i + 1) + ': ' + rs[i].ms));
  assert.ok(rs[2].ms >= 600, label + ': pose mantida ' + rs[2].ms + ' ms');
  const card = fs.filter((f) => f.state === r.resultState);
  assert.ok(card.slice(40).every((f) => f.index === 2), label + ': quadro 3 mantido até o fim do cartão');
}

test('FRUSTRATION — linha rompida: 1 → 2 → 3 mantido durante o cartão de 1,6 s → saída 2 → 4 → IDLE', () => {
  const r = rig({ config: { waitMinMs: 600, waitMaxMs: 600 } });
  castAndLand(r);
  r.until((x) => x.player.state === 'BITE', 3000);
  r.press();
  r.until((x) => x.player.state !== 'FIGHTING', 20000);
  assert.strictEqual(r.player.state, 'LINE_BROKEN');
  r.release({});
  r.resultState = 'LINE_BROKEN';
  frustrationCheck(r, 'linha rompida');
});

test('FRUSTRATION — fuga (linha frouxa): a mesma animação', () => {
  const r = rig({ config: { waitMinMs: 600, waitMaxMs: 600 } });
  castAndLand(r);
  r.until((x) => x.player.state === 'BITE', 3000);
  r.press(); r.step(50); r.release();
  r.until((x) => x.player.state !== 'FIGHTING', 20000);
  assert.strictEqual(r.player.state, 'ESCAPED');
  r.resultState = 'ESCAPED';
  frustrationCheck(r, 'fuga');
});

test('FRUSTRATION — mordida perdida (sem toque na janela): a mesma animação, a partir do IDLE', () => {
  const r = rig({ config: { waitMinMs: 600, waitMaxMs: 600 } });
  castAndLand(r);
  r.until((x) => x.player.state === 'BITE', 3000);
  assert.strictEqual(r.last().anim, 'idle', 'BITE mostra o IDLE');
  r.until((x) => x.player.state === 'ESCAPED', 3000);
  r.resultState = 'ESCAPED';
  frustrationCheck(r, 'mordida perdida');
});

test('FRUSTRATION: cartão pulado → CHARGE na hora (sem o quadro 4)', () => {
  const r = rig({ config: { waitMinMs: 600, waitMaxMs: 600 } });
  castAndLand(r);
  r.until((x) => x.player.state === 'ESCAPED', 5000);
  r.step(700);
  r.press(); r.step(STEP);
  assert.strictEqual(r.player.state, 'CHARGING');
  assert.deepStrictEqual([r.last().anim, r.last().index], ['charge', 0]);
});

// ---------------------------------------------------------------- Lógica intacta
test('A camada visual não altera a lógica: o mesmo roteiro gera registros idênticos com e sem animador', () => {
  function play(withAnimator) {
    const r = rig({ withAnimator, seed: 99, config: { waitMinMs: 700, waitMaxMs: 2500 } });
    // roteiro: carga curta, carga válida, recolhe e solta, fisga, briga com política, captura, pula cartão...
    r.press(); r.step(120); r.release();
    for (let round = 0; round < 6; round++) {
      r.press(); r.step(350 + round * 150); r.release();
      r.until((x) => x.player.state === 'WAITING', 3000);
      r.press(); r.step(260); r.release();               // recolhe um pouco e solta (D4)
      r.until((x) => x.player.state === 'BITE', 10000);
      if (round === 2) { r.until((x) => x.player.state === 'ESCAPED', 3000); r.until((x) => x.player.state === 'IDLE', 3000); continue; }
      r.step(150 + 40 * round); r.press();
      if (round === 4) r.until((x) => x.player.state !== 'FIGHTING', 30000);
      else fightToCatch(r);
      if (r.player.pressed) r.release({});
      if (round % 2) { r.step(700); r.press(); r.step(10); r.release(); r.until((x) => x.player.state === 'IDLE', 3000); }
      else r.until((x) => x.player.state === 'IDLE', 3000);
    }
    return { log: r.log, stats: r.player.stats };
  }
  const a = play(false), b = play(true);
  assert.ok(a.log.length > 100, 'roteiro com eventos suficientes (' + a.log.length + ')');
  assert.deepStrictEqual(b.log, a.log);
  assert.deepStrictEqual(b.stats, a.stats);
});

test('Pausa: com dt = 0 nada anda (pose, manivela e piscar congelados); ao retomar continua de onde parou', () => {
  const r = rig({ config: { waitMinMs: 600, waitMaxMs: 600 } });
  castAndLand(r);
  r.until((x) => x.player.state === 'BITE', 3000);
  r.press(); r.step(230);
  const before = r.anim.frame();
  r.player.pause(r.t);
  for (let i = 0; i < 100; i++) { r.t += STEP; r.anim.update(0, r.player.snapshot(r.t)); }
  const during = r.anim.frame();
  assert.deepStrictEqual([during.anim, during.index], [before.anim, before.index]);
  r.player.resume(r.t);
  r.step(200);
  assert.strictEqual(r.player.state, 'FIGHTING');
});

test('Sem animação presa: se uma transição se perder (sessão reiniciada), o animador se ressincroniza', () => {
  const r = rig({ config: { waitMinMs: 600, waitMaxMs: 600 } });
  castAndLand(r);
  r.until((x) => x.player.state === 'BITE', 3000);
  r.press(); r.step(300);
  assert.strictEqual(r.last().anim, 'reel');
  // jogador novo (como o "Reiniciar sessão" do menu), sem transição para o animador
  const fresh = new FishingPlayer({ id: 'P1', label: 'ALEMÃO', config: r.cfg, seed: 3, time: r.t });
  r.anim.update(STEP, fresh.snapshot(r.t + STEP));
  assert.strictEqual(r.anim.frame().anim, 'idle');
});

test('Dois jogadores: cada animador só recebe as transições do seu jogador', () => {
  const a = rig({ config: { waitMinMs: 600, waitMaxMs: 600 } });
  const b = rig({ character: 'ale' });
  castAndLand(a);
  a.until((x) => x.player.state === 'BITE', 3000);
  a.press();
  b.press();                                   // B carregando enquanto A briga
  a.step(300); b.step(300);
  assert.strictEqual(a.last().anim, 'reel');
  assert.strictEqual(b.last().anim, 'charge');
  b.release();
  a.step(100); b.step(100);
  assert.strictEqual(a.last().anim, 'reel');
  assert.strictEqual(b.last().anim, 'cast');
});

test('Os pontos de cada quadro (ponta da vara, mão) existem para todas as animações e índices', () => {
  const an = new CharacterAnimator({ character: 'ale', data: DATA });
  const counts = { idle: 5, charge: 5, cast: 5, reel: 16, catch: 4, frustration: 4 };
  for (const [anim, n] of Object.entries(counts)) {
    for (let i = 0; i < n; i++) {
      const p = an.pointsOf(anim, i);
      assert.ok(Array.isArray(p.rodTip) && p.rodTip.length === 2, anim + ' ' + i);
      assert.ok(p.rodTip[0] >= 0 && p.rodTip[0] < 96 && p.rodTip[1] >= 0 && p.rodTip[1] < 96, anim + ' ' + i + ' fora do quadro');
    }
  }
  assert.ok(an.pointsOf('catch', 1).fish && !an.pointsOf('catch', 0).fish, 'peixe a partir do quadro 2');
});

console.log('\n' + passed + ' de ' + (passed + failed) + ' testes passaram.');
process.exit(failed ? 1 : 0);
