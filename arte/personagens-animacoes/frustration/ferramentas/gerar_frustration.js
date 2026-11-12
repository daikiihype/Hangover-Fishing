/*
 * Hangover Fishing — Animação FRUSTRATION (Alemão e ALE)
 *
 * Uso (na pasta do projeto):   node arte/personagens-animacoes/frustration/ferramentas/gerar_frustration.js
 * Plano: docs/PLANO_ANIMACOES_PERSONAGENS.md (seção 5.6). Entra a partir de REEL/FIGHT (fuga ou linha rompida)
 * ou do IDLE (mordida perdida); o quadro 3 fica na tela durante o cartão de resultado; o quadro 4 volta ao IDLE.
 *
 * Mesma construção do CHARGE, CAST e REEL/FIGHT:
 *   - peças da v4 aprovada reaproveitadas sem alteração (gerador v4 lido em memória, só leitura):
 *     cabeça, tronco, pernas, botas, mãos, carretel do molinete, paletas, contorno;
 *   - cabeça e tronco só se deslocam (inclinação para trás ou "ombros caídos" de 1 px);
 *   - braços calculados (ombro → cotovelo → mão) com o sombreado do moletom da v4;
 *   - a vara da v4 (reta: a linha está frouxa ou partida), segurada por uma ou pelas duas mãos.
 *
 * Personalidade (pedido da missão): o MESMO formato de quadros e tempos, com reações diferentes.
 *   Alemão — espontâneo e expansivo: a vara dá um tranco para cima, a mão da frente vai ao boné com o
 *            cotovelo alto e aberto, o corpo recua; a vara fica largada, pendurada na mão de trás.
 *   ALE    — contido e resignado: os ombros caem, a mão de trás solta o cabo e vai coçar a nuca;
 *            a vara fica baixa, quase na horizontal, segura só pelo molinete ("de novo...").
 * Nada é sobrescrito fora de arte/personagens-animacoes/frustration/.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const Module = require('module');

const ROOT = path.join(__dirname, '..', '..', '..', '..');
const OUT = path.join(__dirname, '..');
const V4_GEN = path.join(ROOT, 'arte', 'personagens-base', 'ferramentas', 'gerar_personagens_base_v4.js');
const IDLE_DIR = path.join(ROOT, 'arte', 'personagens-animacoes', 'idle');
const REEL_DIR = path.join(ROOT, 'arte', 'personagens-animacoes', 'reel-fight');

function loadV4() {
  const src = fs.readFileSync(V4_GEN, 'utf8');
  const EXPORT = 'module.exports = { build, RIG, ALEMAO, ALE, readPNG, W, H };';
  if (!src.includes(EXPORT)) throw new Error('gerador v4 diferente do esperado');
  const m = new Module(V4_GEN, module);
  m.filename = V4_GEN; m.paths = Module._nodeModulePaths(path.dirname(V4_GEN));
  m._compile(src.replace(EXPORT, 'module.exports = { build, RIG, ALEMAO, ALE, readPNG, writePNG, Canvas, line4, OUTLINE, COMMON, LEGS, BOOTS, HAND_LOW_ROWS, HAND_TOP_ROWS, REEL, camo };'), V4_GEN);
  return m.exports;
}
const V4 = loadV4();
const { Canvas, line4, OUTLINE, COMMON, LEGS, BOOTS, HAND_LOW_ROWS, HAND_TOP_ROWS, REEL, RIG, camo, readPNG, writePNG } = V4;

// ------------------------------------------------------------------ especificação
const FRAME = 96, OX = 30, OY = 32;            // âncora: v4 deslocada (+30, +32), igual ao IDLE
const SOLE_Y = 94, FEET = { x0: 39, x1: 56, y0: 91, y1: 95 };
const ROD_SEAT_TO_TIP = 28, BUTT_BEHIND_LOW = 6, SEAT_AHEAD_OF_LOW = 9;   // vara da v4: cabo 15 px + 28 px
const MIN_MARGIN = 3;
const CARD_MS = 1600;                          // cartão "escapou / linha arrebentou" do P1 (config.resultLostMs)
// Reprodução (4 desenhos, como no plano 5.6; total ~1,15 s):
//   entrada  1 (150 ms) → 2 (200 ms) → 3 (mantido: no mínimo 600 ms, até o fim do cartão de resultado)
//   saída    2 (100 ms) → 4 (100 ms) → IDLE      — o quadro 2 é reaproveitado para a mão descer em dois passos
const ENTRY = [{ i: 0, ms: 150 }, { i: 1, ms: 200 }, { i: 2, ms: 600 }];
const EXIT = [{ i: 1, ms: 100 }, { i: 3, ms: 100 }];
const HOLD_INDEX = 2;

// Pose (coordenadas da v4; mãos = centro):
//   dx / dy  — deslocamento de cabeça + tronco (dx − = para trás; dy + = ombros caídos)
//   rod.hold — 'both' (cabo + molinete, como no IDLE) · 'back' (só a mão de trás, no cabo) · 'front' (só a mão da frente, no molinete)
//   rod.low / rod.top — mãos na vara; rod.ang — graus abaixo da horizontal (− = acima) quando só uma mão segura
//   free     — a mão livre: { arm: 'front'|'back', at: [x,y] } ou { arm, onHead: [dx,dy] } (relativo à origem da cabeça)
//   seg      — comprimento de cada segmento do braço livre · dir — para onde o cotovelo aponta
const POSES = {
  alemao: [
    { nome: 'tranco',       dx: -1, dy: 0, rod: { hold: 'both', low: [15, 34], top: [24, 23] }, segF: 6 },
    { nome: 'mão subindo',  dx: -1, dy: 0, rod: { hold: 'back', low: [15, 35], ang: 6 },  free: { arm: 'front', at: [26, 16], seg: 7, dir: [1, 0] } },
    { nome: 'mão no boné',  dx: -1, dy: 0, rod: { hold: 'back', low: [15, 36], ang: 30 }, free: { arm: 'front', onHead: [13, 5], seg: 8.5, dir: [1, -0.15] } },
    { nome: 'volta',        dx: 0,  dy: 0, rod: { hold: 'back', low: [15, 36], ang: -12 }, free: { arm: 'front', at: [25, 25], seg: 6.5, dir: [0.6, 1] } }
  ],
  ale: [
    { nome: 'ombros caem',  dx: 0, dy: 1, rod: { hold: 'front', top: [24, 34], ang: -11 }, free: { arm: 'back', at: [13, 28], seg: 8, dir: [-0.4, 1] } },
    { nome: 'mão subindo',  dx: 0, dy: 1, rod: { hold: 'front', top: [24, 36], ang: 0 },   free: { arm: 'back', at: [12, 21], seg: 8, dir: [-1, 0.3] } },
    { nome: 'mão na nuca',  dx: 0, dy: 1, rod: { hold: 'front', top: [24, 37], ang: 6 },   free: { arm: 'back', onHead: [1, 7], seg: 8, dir: [-1, -0.1] } },
    { nome: 'volta',        dx: 0, dy: 0, rod: { hold: 'front', top: [24, 33], ang: -12 }, free: { arm: 'back', at: [14, 30], seg: 8, dir: [-0.4, 1] } }
  ]
};
// Pixels da cabeça que a mão pode tocar (boné do Alemão; cabelo do ALE). O resto da cabeça (rosto) nunca é coberto.
const HEAD_TOUCHABLE = { alemao: new Set(['a', 'A', 'n', 'f', 'v', 'V']), ale: new Set(['h', 'H']) };
const HAND_STEP_MAX = 9.5;                     // gesto rápido (150–200 ms por quadro)
const EXIT_TO_IDLE_MAX = 6.5;                  // volta ao IDLE: mesmo limite do CAST

// ------------------------------------------------------------------ utilitários de desenho
function stampAt(c, x, y, rows, pal) { c.stamp(x + OX, y + OY, rows, pal); }
function paintArm(c, pts, P, mask) {
  for (let s = 0; s < pts.length - 1; s++) {
    const [ax, ay] = pts[s], [bx, by] = pts[s + 1];
    const vx = bx - ax, vy = by - ay, len = Math.hypot(vx, vy) || 1;
    const nx = -vy / len, ny = vx / len;
    const x0 = Math.floor(Math.min(ax, bx) - 2), x1 = Math.ceil(Math.max(ax, bx) + 2);
    const y0 = Math.floor(Math.min(ay, by) - 2), y1 = Math.ceil(Math.max(ay, by) + 2);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (len * len)));
      const px = ax + t * vx, py = ay + t * vy, d = Math.hypot(x - px, y - py);
      if (d > 1.5) continue;
      const side = (x - px) * nx + (y - py) * ny;
      const lightSide = (nx * -1 + ny * -1) > 0 ? side > 0 : side < 0;
      const ch = d <= 0.75 ? 'j' : lightSide ? 'i' : 'J';
      c.set(x + OX, y + OY, P[ch]);
      if (mask) mask.add((y + OY) * FRAME + x + OX);
    }
  }
}
function elbow(sh, hand, segLen, dir) {
  const mx = (sh[0] + hand[0]) / 2, my = (sh[1] + hand[1]) / 2;
  const dx = hand[0] - sh[0], dy = hand[1] - sh[1], D = Math.hypot(dx, dy);
  const h = Math.sqrt(Math.max(0, segLen * segLen - (D / 2) * (D / 2)));
  let px = -dy / D, py = dx / D;
  if ((px * dir[0] + py * dir[1]) < 0) { px = -px; py = -py; }
  return [mx + px * h, my + py * h];
}

// ------------------------------------------------------------------ montagem de um quadro
function frameFor(key, def, pose) {
  const P = Object.assign({}, COMMON, def.pal);
  const c = new Canvas(FRAME, FRAME);
  const { dx, dy } = pose;
  // 1) pernas (com camuflado) e botas, exatamente como na v4
  const legs = new Canvas(64, 64);
  legs.stamp(11, 38, LEGS, P); if (def.camo) camo(legs, P);
  legs.stamp(10, 59, BOOTS, Object.assign({}, P, { S: P.sole }));
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const col = legs.get(x, y); if (col) c.set(x + OX, y + OY, col); }
  // 2) tronco e cabeça (só translação)
  const headO = [9 + dx, 4 + dy];
  stampAt(c, 9 + dx, 21 + dy, def.torso, P);
  stampAt(c, headO[0], headO[1], def.head, P);
  // 3) vara: pontos de apoio
  const R = pose.rod;
  let u, butt, seat, holdLow = null, holdTop = null;
  const dirOf = (ang) => [Math.cos(ang * Math.PI / 180), Math.sin(ang * Math.PI / 180)];
  if (R.hold === 'both') {
    holdLow = R.low; holdTop = R.top;
    const d = [R.top[0] - R.low[0], R.top[1] - R.low[1]], l = Math.hypot(d[0], d[1]); u = [d[0] / l, d[1] / l];
    seat = R.top; butt = [R.low[0] - u[0] * BUTT_BEHIND_LOW, R.low[1] - u[1] * BUTT_BEHIND_LOW];
  } else if (R.hold === 'back') {
    holdLow = R.low; u = dirOf(R.ang);
    butt = [R.low[0] - u[0] * BUTT_BEHIND_LOW, R.low[1] - u[1] * BUTT_BEHIND_LOW];
    seat = [R.low[0] + u[0] * SEAT_AHEAD_OF_LOW, R.low[1] + u[1] * SEAT_AHEAD_OF_LOW];
  } else {
    holdTop = R.top; u = dirOf(R.ang); seat = R.top;
    butt = [R.top[0] - u[0] * (BUTT_BEHIND_LOW + SEAT_AHEAD_OF_LOW), R.top[1] - u[1] * (BUTT_BEHIND_LOW + SEAT_AHEAD_OF_LOW)];
  }
  const tipF = [seat[0] + u[0] * ROD_SEAT_TO_TIP, seat[1] + u[1] * ROD_SEAT_TO_TIP];
  // 4) braços e mãos
  const arms = new Set();
  const shB = [RIG.shoulderBack[0] + dx, RIG.shoulderBack[1] + 1 + dy];
  const shF = [RIG.shoulderFront[0] + dx, RIG.shoulderFront[1] + 1 + dy];
  let freeAt = null;
  if (pose.free) freeAt = pose.free.onHead ? [headO[0] + pose.free.onHead[0], headO[1] + pose.free.onHead[1]] : pose.free.at;
  const backHand = holdLow || (pose.free && pose.free.arm === 'back' ? freeAt : null);
  const frontHand = holdTop || (pose.free && pose.free.arm === 'front' ? freeAt : null);
  const backFree = !holdLow, frontFree = !holdTop;
  const eB = backFree ? elbow(shB, backHand, pose.free.seg, pose.free.dir) : elbow(shB, backHand, 8, [-0.4, 1]);
  const eF = frontFree ? elbow(shF, frontHand, pose.free.seg, pose.free.dir) : elbow(shF, frontHand, pose.segF || 6, [0.6, 1]);
  paintArm(c, [shB, eB, backHand], P, arms);
  paintArm(c, [shF, eF, frontHand], P, arms);
  const ho = (h) => [Math.round(h[0]) - 1, Math.round(h[1]) - 1];
  const hl = ho(backHand), ht = ho(frontHand);
  stampAt(c, hl[0], hl[1], HAND_LOW_ROWS, P);
  stampAt(c, ht[0], ht[1], HAND_TOP_ROWS, P);
  c.outline(OUTLINE);
  // 5) vara reta (a linha está frouxa ou partida), passando exatamente pelas mãos que a seguram
  const r = (p) => [Math.round(p[0]), Math.round(p[1])];
  const buttR = r(butt), tip = r(tipF), seatR = r(seat);
  const rod = def.rod, pts = [];
  line4(buttR[0], buttR[1], tip[0], tip[1], (x, y) => pts.push([x, y]));
  const proj = (p) => (p[0] - buttR[0]) * u[0] + (p[1] - buttR[1]) * u[1];
  const sSeat = proj(seatR), sGrip = BUTT_BEHIND_LOW + 2;
  const steep = Math.abs(u[1]) > Math.abs(u[0]);
  const rodPx = new Map();
  let n = 0;
  for (const p of pts) {
    const s = proj(p);
    const front = s <= sSeat + 0.5;
    const grip = s <= sGrip;
    const thick = s <= sSeat + 6;
    const band = rod.band && s > sSeat + 2 && (n++ % 5 === 4);
    const col = grip ? rod.grip : band ? rod.band : rod.main;
    const put = (x, y, cc) => { const k = (y + OY) * FRAME + x + OX; if (!rodPx.has(k) || front) rodPx.set(k, { col: cc, front }); };
    put(p[0], p[1], col);
    if (thick) { const q = steep ? [p[0] + 1, p[1]] : [p[0], p[1] + 1]; put(q[0], q[1], grip ? rod.gripDark : rod.dark); }
  }
  const tipK = (tip[1] + OY) * FRAME + tip[0] + OX; rodPx.set(tipK, { col: rod.tip, front: rodPx.get(tipK) ? rodPx.get(tipK).front : false });
  for (const [k, v] of rodPx) {
    const x = k % FRAME, y = Math.floor(k / FRAME);
    if (v.front) c.set(x, y, v.col); else if (!c.get(x, y)) c.set(x, y, v.col);
  }
  // 6) molinete da v4 pendurado sob o assento (como no IDLE e no CAST "baixo")
  const reelOrigin = [seatR[0] - 3, seatR[1] + 1];
  stampAt(c, reelOrigin[0], reelOrigin[1], REEL.slice(1), Object.assign({}, P, { r: rod.reel, u: rod.spool, z: rod.hub, m: rod.crank, k: rod.knob }));
  // 7) mãos por cima de tudo
  stampAt(c, hl[0], hl[1], HAND_LOW_ROWS, P);
  stampAt(c, ht[0], ht[1], HAND_TOP_ROWS, P);
  return {
    c, arms, rodPx, pts, tip, butt: buttR, seat: seatR, hl, ht, reelOrigin, dx, dy, headO,
    back: r(backHand), front: r(frontHand), holdLow, holdTop, free: pose.free || null, freeAt: freeAt && r(freeAt),
    out: {
      nome: pose.nome, pontaDaVara: [tip[0] + OX, tip[1] + OY], cabo: [buttR[0] + OX, buttR[1] + OY],
      maoDeTras: [Math.round(backHand[0]) + OX, Math.round(backHand[1]) + OY], maoDaFrente: [Math.round(frontHand[0]) + OX, Math.round(frontHand[1]) + OY],
      varaSeguraPor: R.hold === 'both' ? 'as duas mãos' : R.hold === 'back' ? 'mão de trás (cabo)' : 'mão da frente (molinete)',
      maoNaCabeca: !!(pose.free && pose.free.onHead),
      anguloVaraGraus: Math.round(Math.atan2(-u[1], u[0]) * 180 / Math.PI), inclinacaoPx: dx, ombrosCaidosPx: dy
    }
  };
}

// ------------------------------------------------------------------ verificações
const problems = [];
const check = (ok, msg) => { if (!ok) problems.push(msg); };
const hexOf = (buf, i) => '#' + [0, 1, 2].map((k) => buf[i + k].toString(16).padStart(2, '0')).join('');
function readSheetFrame(file, index, cols) {
  const img = readPNG(file), f = new Array(FRAME * FRAME).fill(null);
  const fx = (index % cols) * FRAME, fy = Math.floor(index / cols) * FRAME;
  for (let y = 0; y < FRAME; y++) for (let x = 0; x < FRAME; x++) { const i = ((fy + y) * img.w + fx + x) * 4; if (img.buf[i + 3]) f[y * FRAME + x] = hexOf(img.buf, i); }
  return f;
}
const readIdle1 = (key) => readSheetFrame(path.join(IDLE_DIR, key + '_idle_spritesheet.png'), 0, 5);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

function verify(key, def, frames) {
  const idle = readIdle1(key);
  const v4 = readPNG(path.join(ROOT, 'arte/personagens-base/' + key + '_idle_v4.png'));
  const pal = new Set(); for (let i = 0; i < v4.buf.length; i += 4) if (v4.buf[i + 3]) pal.add(hexOf(v4.buf, i));
  const P = Object.assign({}, COMMON, def.pal);
  frames.forEach((F, k) => {
    const tag = key + ' quadro ' + (k + 1) + ' (' + F.out.nome + '): ';
    const px = F.c.px;
    for (const col of px) if (col && !pal.has(col)) { check(false, tag + 'cor fora da paleta v4 ' + col); break; }
    for (let y = FEET.y0; y <= FEET.y1; y++) for (let x = 0; x < FRAME; x++) if (px[y * FRAME + x] !== idle[y * FRAME + x]) { check(false, tag + 'pés diferentes do IDLE em (' + x + ',' + y + ')'); y = 999; break; }
    px.forEach((col, i) => { if (!col) return; const x = i % FRAME, y = Math.floor(i / FRAME); if (y >= FEET.y0) return; if (x < MIN_MARGIN || y < MIN_MARGIN || x > FRAME - 1 - MIN_MARGIN || y > FRAME - 1 - MIN_MARGIN) check(false, tag + 'pixel perto da borda em (' + x + ',' + y + ')'); });
    // cabeça: só translação; o rosto nunca é coberto; a mão só toca boné (Alemão) ou cabelo (ALE)
    const handBox = (x, y) => [F.hl, F.ht].some((h) => x >= h[0] + OX && x < h[0] + OX + 3 && y >= h[1] + OY && y < h[1] + OY + 2);
    const occl = (i) => F.arms.has(i) || handBox(i % FRAME, Math.floor(i / FRAME)) || (F.rodPx.has(i) && F.rodPx.get(i).front);
    let headBad = 0, faceCovered = 0, touched = 0;
    def.head.forEach((row, ry) => [...row].forEach((ch, rx) => {
      if (ch === '.') return;
      const i = (F.headO[1] + ry + OY) * FRAME + F.headO[0] + rx + OX;
      if (occl(i)) { if (HEAD_TOUCHABLE[key].has(ch)) touched++; else faceCovered++; }
      else if (px[i] !== P[ch]) headBad++;
    }));
    check(headBad === 0, tag + headBad + ' pixels da cabeça alterados');
    check(faceCovered === 0, tag + faceCovered + ' pixels do rosto cobertos');
    if (F.free && F.free.onHead) check(touched >= 4, tag + 'mão não encosta no ' + (key === 'alemao' ? 'boné' : 'cabelo') + ' (' + touched + ' px)');
    // tronco fora das áreas cobertas
    let torsoBad = 0;
    const reelBox = (x, y) => x >= F.reelOrigin[0] + OX && x < F.reelOrigin[0] + OX + 10 && y >= F.reelOrigin[1] + OY && y < F.reelOrigin[1] + OY + 7;
    def.torso.forEach((row, ry) => [...row].forEach((ch, rx) => { if (ch === '.') return; const x = 9 + F.dx + rx + OX, y = 21 + F.dy + ry + OY, i = y * FRAME + x; if (px[i] !== P[ch] && !occl(i) && !reelBox(x, y) && !F.rodPx.has(i)) torsoBad++; }));
    check(torsoBad === 0, tag + torsoBad + ' pixels do tronco alterados fora das áreas cobertas');
    // vara sem falhas, ponta visível, segurada pelas mãos indicadas
    let gaps = 0; for (const p of F.pts) if (!px[(p[1] + OY) * FRAME + p[0] + OX]) gaps++;
    check(gaps === 0, tag + 'vara com ' + gaps + ' falhas');
    const tipVis = [...F.rodPx.entries()].filter(([i, v]) => px[i] === v.col && !v.front).length;
    check(tipVis >= 4, tag + 'ponta da vara pouco visível (' + tipVis + ' px)');
    const onRod = (h) => F.pts.some((p) => p[0] >= h[0] && p[0] < h[0] + 3 && p[1] >= h[1] && p[1] < h[1] + 2);
    if (F.holdLow) check(onRod(F.hl), tag + 'mão de trás não está na vara');
    if (F.holdTop) check(onRod(F.ht), tag + 'mão da frente não está na vara');
    check(!!(F.holdLow || F.holdTop), tag + 'vara sem mão');
    // peça única; o trecho da vara longe do corpo encosta no resto
    const body = new Set(); px.forEach((col, i) => { if (col && !(F.rodPx.has(i) && !F.rodPx.get(i).front && px[i] === F.rodPx.get(i).col)) body.add(i); });
    const start = [...body][0], seen = new Set([start]), q = [start];
    while (q.length) { const i = q.pop(); for (const j of [i - 1, i + 1, i - FRAME, i + FRAME]) if (body.has(j) && !seen.has(j)) { seen.add(j); q.push(j); } }
    check(seen.size === body.size, tag + 'partes desconectadas (' + (body.size - seen.size) + ' px)');
    const behind = [...F.rodPx.entries()].filter(([i, v]) => !v.front && px[i] === v.col).map(([i]) => i);
    const all = new Set([...body, ...behind]), s2 = new Set([start]), q2 = [start];
    while (q2.length) { const i = q2.pop(); for (const j of [i - 1, i + 1, i - FRAME, i + FRAME, i - FRAME - 1, i - FRAME + 1, i + FRAME - 1, i + FRAME + 1]) if (all.has(j) && !s2.has(j)) { s2.add(j); q2.push(j); } }
    check(s2.size === all.size, tag + 'trecho da vara solto');
  });
  // continuidade (mãos), entradas e saída
  const idleP = { nome: 'IDLE', back: [RIG.handLow[0] + 1, RIG.handLow[1] + 1], front: [RIG.handTop[0] + 1, RIG.handTop[1] + 1] };
  const fr = (i) => ({ nome: 'quadro ' + (i + 1), back: frames[i].back, front: frames[i].front });
  const play = [idleP, ...ENTRY.map((e) => fr(e.i)), ...EXIT.map((e) => fr(e.i)), idleP];   // IDLE → 1 → 2 → 3 → 2 → 4 → IDLE
  const steps = [];
  const step = (a, b) => Math.max(dist(a.back, b.back), dist(a.front, b.front));
  for (let i = 0; i < play.length - 1; i++) {
    const d = step(play[i], play[i + 1]), last = i === play.length - 2;
    steps.push({ de: play[i].nome, para: play[i + 1].nome, maosPx: +d.toFixed(1) });
    check(d <= (last ? EXIT_TO_IDLE_MAX : HAND_STEP_MAX), key + ': mãos saltam ' + d.toFixed(1) + ' px de ' + play[i].nome + ' para ' + play[i + 1].nome);
  }
  const seq = [fr(0)];
  // entradas a partir do REEL/FIGHT (fuga = nível 1; linha rompida = nível 4), pior posição da manivela — só medidas
  const reel = JSON.parse(fs.readFileSync(path.join(REEL_DIR, 'reel_fight.json'), 'utf8')).pontos[key];
  const v = (p) => [p[0] - OX, p[1] - OY];
  const entradas = {};
  for (const [nome, lv] of [['fuga (nível 1)', 1], ['linha rompida (nível 4)', 4]]) {
    const ds = [0, 1, 2, 3].map((p) => { const r = reel[(lv - 1) * 4 + p]; return step({ back: v(r.maoDeTras), front: v(r.maoDaFrente) }, seq[0]); });
    entradas[nome] = ds.map((d) => +d.toFixed(1));
  }
  return { steps, entradas };
}

// ------------------------------------------------------------------ GIF (mesmo codificador das outras animações)
function gif(w, h, frames, palette) {
  let bits = 1; while ((1 << bits) < palette.length) bits++;
  const size = 1 << bits, parts = [], u16 = (v) => Buffer.from([v & 255, (v >> 8) & 255]);
  parts.push(Buffer.from('GIF89a'), u16(w), u16(h), Buffer.from([0x80 | 0x70 | (bits - 1), 0, 0]));
  const pal = Buffer.alloc(size * 3); palette.forEach((c, i) => { pal[i * 3] = c[0]; pal[i * 3 + 1] = c[1]; pal[i * 3 + 2] = c[2]; }); parts.push(pal);
  parts.push(Buffer.from([0x21, 0xff, 0x0b]), Buffer.from('NETSCAPE2.0'), Buffer.from([3, 1, 0, 0, 0]));
  const minCode = Math.max(2, bits);
  for (const f of frames) {
    parts.push(Buffer.from([0x21, 0xf9, 4, 0]), u16(Math.round(f.ms / 10)), Buffer.from([0, 0]));
    parts.push(Buffer.from([0x2c]), u16(0), u16(0), u16(w), u16(h), Buffer.from([0]), Buffer.from([minCode]), lzw(f.idx, minCode), Buffer.from([0]));
  }
  parts.push(Buffer.from([0x3b]));
  return Buffer.concat(parts);
}
function lzw(idx, minCode) {
  const clear = 1 << minCode, eoi = clear + 1, out = [];
  let size = minCode + 1, next = eoi + 1, dict = new Map(), acc = 0, nbits = 0;
  const emit = (code) => { acc |= code << nbits; nbits += size; while (nbits >= 8) { out.push(acc & 255); acc >>>= 8; nbits -= 8; } };
  emit(clear);
  let prefix = idx[0];
  for (let i = 1; i < idx.length; i++) {
    const k = idx[i], key = prefix * 256 + k, hit = dict.get(key);
    if (hit !== undefined) { prefix = hit; continue; }
    emit(prefix);
    if (next === 4096) { emit(clear); dict = new Map(); size = minCode + 1; next = eoi + 1; } else { if (next >= (1 << size)) size++; dict.set(key, next++); }
    prefix = k;
  }
  emit(prefix); emit(eoi); if (nbits > 0) out.push(acc & 255);
  const blocks = []; for (let i = 0; i < out.length; i += 255) { const b = out.slice(i, i + 255); blocks.push(Buffer.from([b.length]), Buffer.from(b)); }
  return Buffer.concat(blocks);
}

// ------------------------------------------------------------------ geração e verificação
const CHARS = { alemao: V4.ALEMAO, ale: V4.ALE };
const built = {}, report = {};
for (const [key, def] of Object.entries(CHARS)) { built[key] = POSES[key].map((p) => frameFor(key, def, p)); report[key] = verify(key, def, built[key]); }
if (problems.length) { console.error('FALHOU:\n  ' + problems.join('\n  ')); process.exit(1); }

// ------------------------------------------------------------------ saída
const BG = [0x4f, 0x7a, 0x94];
function rgba(mats, s, bg) {
  const w = FRAME * mats.length * s, h = FRAME * s, buf = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const k = Math.floor(x / (FRAME * s)), col = mats[k][Math.floor(y / s) * FRAME + Math.floor((x % (FRAME * s)) / s)], o = (y * w + x) * 4;
    if (col) { buf[o] = parseInt(col.slice(1, 3), 16); buf[o + 1] = parseInt(col.slice(3, 5), 16); buf[o + 2] = parseInt(col.slice(5, 7), 16); buf[o + 3] = 255; }
    else if (bg) { buf[o] = bg[0]; buf[o + 1] = bg[1]; buf[o + 2] = bg[2]; buf[o + 3] = 255; }
  }
  return { w, h, buf };
}
fs.mkdirSync(path.join(OUT, 'previews'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'quadros'), { recursive: true });
const ext = {};
for (const [key, frames] of Object.entries(built)) {
  const mats = frames.map((f) => f.c.px);
  const sheet = rgba(mats, 1, null); writePNG(path.join(OUT, key + '_frustration_spritesheet.png'), sheet.w, sheet.h, sheet.buf);
  mats.forEach((m, i) => { const one = rgba([m], 1, null); writePNG(path.join(OUT, 'quadros', key + '_frustration_' + (i + 1) + '.png'), one.w, one.h, one.buf); });
  const big = rgba(mats, 4, BG); writePNG(path.join(OUT, 'previews', key + '_frustration_quadros_x4.png'), big.w, big.h, big.buf);
  ext[key] = {
    idle: readIdle1(key),
    reel: (i) => readSheetFrame(path.join(REEL_DIR, key + '_reel_fight_spritesheet.png'), i, 4)
  };
}
// Prévia (tempos do P1): briga no nível 4 → linha rompe → FRUSTRATION (quadro 3 mantido até o fim do cartão de 1,6 s)
// → quadro 4 → IDLE; depois recolhendo no nível 1 → peixe escapa (linha frouxa) → a mesma FRUSTRATION.
function sequence() {
  const held = CARD_MS - ENTRY[0].ms - ENTRY[1].ms;
  const fr = () => [...ENTRY.map((e) => ({ f: e.i, ms: e.i === HOLD_INDEX ? held : e.ms })), ...EXIT.map((e) => ({ f: e.i, ms: e.ms }))];
  const reelLoop = (lv, n) => { const s = []; for (let i = 0; i < n; i++) s.push({ reel: (lv - 1) * 4 + (i % 4), ms: 90 }); return s; };
  return [{ idle: true, ms: 500 }, ...reelLoop(4, 8), ...fr(), { idle: true, ms: 900 }, ...reelLoop(1, 8), ...fr(), { idle: true, ms: 900 }];
}
function previewGif(keys) {
  const S = 4, colorIdx = new Map([[BG.join(','), 0]]), palette = [BG], out = [];
  for (const step of sequence()) {
    const mats = keys.map((k) => step.idle ? ext[k].idle : step.reel != null ? ext[k].reel(step.reel) : built[k][step.f].c.px);
    const img = rgba(mats, S, BG), idx = new Uint8Array(img.w * img.h);
    for (let p = 0; p < img.w * img.h; p++) { const key = img.buf[p * 4] + ',' + img.buf[p * 4 + 1] + ',' + img.buf[p * 4 + 2]; if (!colorIdx.has(key)) { colorIdx.set(key, palette.length); palette.push([img.buf[p * 4], img.buf[p * 4 + 1], img.buf[p * 4 + 2]]); } idx[p] = colorIdx.get(key); }
    const last = out[out.length - 1];
    if (last && Buffer.compare(Buffer.from(last.idx), Buffer.from(idx)) === 0) { last.ms += step.ms; continue; }
    out.push({ idx, ms: step.ms, w: img.w, h: img.h });
  }
  if (palette.length > 256) throw new Error('paleta do GIF > 256');
  return gif(out[0].w, out[0].h, out, palette);
}
fs.writeFileSync(path.join(OUT, 'previews', 'alemao_frustration_x4.gif'), previewGif(['alemao']));
fs.writeFileSync(path.join(OUT, 'previews', 'ale_frustration_x4.gif'), previewGif(['ale']));
fs.writeFileSync(path.join(OUT, 'previews', 'ambos_frustration_x4.gif'), previewGif(['alemao', 'ale']));

const data = {
  animacao: 'frustration',
  quadro: { largura: FRAME, altura: FRAME },
  spritesheet: { arquivo: '<personagem>_frustration_spritesheet.png', colunas: 4, linhas: 1, ordem: { alemao: POSES.alemao.map((p, i) => (i + 1) + ' ' + p.nome), ale: POSES.ale.map((p, i) => (i + 1) + ' ' + p.nome) } },
  ancora: { phaserOrigin: [0.5, 1], deslocamentoV4: [OX, OY], solaY: SOLE_Y, pes: FEET, centroPesX: 47.5 },
  quando: 'estados ESCAPED (fuga ou mordida perdida) e LINE_BROKEN do P1; a mesma animação nos dois casos. No rompimento, o jogo desenha a linha partida a partir da ponta da vara do quadro atual',
  reproducao: {
    tipo: 'pontual com pose mantida: entrada 1 → 2 → 3; o quadro 3 fica na tela até o fim do cartão de resultado; quando o P1 volta ao IDLE, a saída toca 2 → 4 e então o IDLE',
    entrada: ENTRY.map((e) => ({ indice: e.i, quadro: e.i + 1, ms: e.i === HOLD_INDEX ? { minimo: e.ms, mantidoAteOFimDoCartao: true } : e.ms })),
    poseMantida: { indice: HOLD_INDEX, quadro: HOLD_INDEX + 1 },
    saida: { quadros: EXIT.map((e) => ({ indice: e.i, quadro: e.i + 1, ms: e.ms })), depois: 'idle', quando: 'transição ESCAPED/LINE_BROKEN → IDLE do P1 (fim do cartão de ' + CARD_MS + ' ms). A saída é só visual (200 ms): não atrasa a lógica; se a lógica pedir outra animação (carga), a troca é imediata' },
    totalMinimoMs: ENTRY.concat(EXIT).reduce((a, e) => a + e.ms, 0),
    noCartaoDe1600ms: { quadro1: ENTRY[0].ms, quadro2: ENTRY[1].ms, quadro3Mantido: CARD_MS - ENTRY[0].ms - ENTRY[1].ms, depoisDoCartao: { quadro2: EXIT[0].ms, quadro4: EXIT[1].ms, entao: 'IDLE' } },
    cartaoPulado: 'se o jogador pular o cartão (toque após 0,6 s), o P1 começa a carga: a animação é interrompida e entra o CHARGE (plano, seção 4), sem tocar o quadro 4'
  },
  personalidade: {
    alemao: 'espontâneo e expansivo: tranco da vara para cima, corpo recua 1 px, mão da frente vai ao boné com o cotovelo alto e aberto; a vara fica largada, pendurada na mão de trás (~30° abaixo da horizontal)',
    ale: 'contido e resignado: ombros caem 1 px, a mão de trás solta o cabo e vai coçar a nuca, cotovelo junto à cabeça; a vara fica baixa, quase na horizontal, segura só pelo molinete'
  },
  pontos: Object.fromEntries(Object.entries(built).map(([k, fr]) => [k, fr.map((f, i) => Object.assign({ indice: i, quadro: i + 1 }, f.out))])),
  continuidade: Object.fromEntries(Object.entries(report).map(([k, r]) => [k, { passosDasMaosPx: r.steps, entradaVindaDoReelFightPx: r.entradas }]))
};
fs.writeFileSync(path.join(OUT, 'frustration.json'), JSON.stringify(data, null, 2) + '\n');

console.log('OK — todas as verificações passaram');
for (const [k, fr] of Object.entries(built)) {
  console.log('  ' + k + ': ' + fr.map((f, i) => (i + 1) + ' ' + f.out.nome + ' ponta ' + JSON.stringify(f.out.pontaDaVara) + ' ' + f.out.anguloVaraGraus + '°').join(' · '));
  console.log('    mãos: ' + report[k].steps.map((s) => s.de + '→' + s.para + ' ' + s.maosPx).join(' · '));
  console.log('    entradas do REEL/FIGHT (posições 1–4): ' + JSON.stringify(report[k].entradas));
}
