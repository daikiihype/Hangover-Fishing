/*
 * Hangover Fishing — Animação CHARGE (Alemão e ALE)
 *
 * Uso (na pasta do projeto):   node arte/personagens-animacoes/charge/ferramentas/gerar_charge.js
 * Plano: docs/PLANO_ANIMACOES_PERSONAGENS.md (v1.1), seção 5.2 · referência imediata: IDLE aprovado.
 *
 * Peças reaproveitadas SEM alteração (gerador v4 aprovado, lido em memória só para leitura):
 *   cabeça, tronco, pernas, botas, mãos, carretel do molinete, paletas, contorno.
 * Peças desta animação (calculadas, não desenhadas à mão):
 *   - braços: traço de 3 px do ombro ao cotovelo e à mão, com o sombreado do moletom da v4
 *     (i = luz, j = base, J = sombra/separação);
 *   - vara: a mesma vara da v4 (mesmas cores, cabo escuro, faixas do ALE), girada em torno das mãos.
 *     O trecho entre as mãos fica NA FRENTE do peito; o trecho da ponta passa ATRÁS da cabeça e do
 *     tronco (nunca cobre o rosto).
 * Nada é sobrescrito; saída em arte/personagens-animacoes/charge/.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const Module = require('module');

const ROOT = path.join(__dirname, '..', '..', '..', '..');
const OUT = path.join(__dirname, '..');
const V4_GEN = path.join(ROOT, 'arte', 'personagens-base', 'ferramentas', 'gerar_personagens_base_v4.js');
const IDLE_DIR = path.join(ROOT, 'arte', 'personagens-animacoes', 'idle');

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
const ROD_SEAT_TO_TIP = 28, BUTT_BEHIND_LOW = 6;   // comprimentos da vara da v4
const MIN_MARGIN = 3;

// Poses (coordenadas da v4). A vara passa exatamente pelas duas mãos; o ângulo resulta das mãos
// (registrado no charge.json, medido a partir da vertical; positivo = para trás).
// low = mão de trás (cabo) · top = mão da frente (assento do molinete) · lean = tronco e cabeça para trás (px)
// Regras: a mão de cima fica sempre ABAIXO do queixo (y ≥ 22) para não cobrir a barba; no quadro 1 a vara
// sobe à FRENTE da aba do boné (visível inteira); do 2 ao 5 a ponta passa atrás da cabeça e sai por trás.
const POSES = [
  { id: 1, nome: 'preparacao',  low: [21, 32], top: [24, 24], lean: 0, ms: 100 },   // ≈ 21° para a frente
  { id: 2, nome: 'recuo',       low: [22, 30], top: [21, 22], lean: 1, ms: 100 },   // ≈ 7° para trás
  { id: 3, nome: 'forca-baixa', low: [23, 29], top: [19, 22], lean: 1, faixa: [0, 33] },    // ≈ 30°
  { id: 4, nome: 'forca-media', low: [24, 28], top: [18, 22], lean: 1, faixa: [34, 66] },   // ≈ 45° (mão de baixo mais à frente)
  { id: 5, nome: 'forca-alta',  low: [24, 28], top: [16, 23], lean: 2, faixa: [67, 100] }   // ≈ 58°
];

// ------------------------------------------------------------------ utilitários de desenho
const at = (x, y) => [Math.round(x) + OX, Math.round(y) + OY];          // v4 → quadro 96
function stampAt(c, x, y, rows, pal) { c.stamp(x + OX, y + OY, rows, pal); }

/** Braço: traço de 3 px por dois segmentos, com sombreado do moletom. */
function paintArm(c, pts, P, mask) {
  for (let s = 0; s < pts.length - 1; s++) {
    const [ax, ay] = pts[s], [bx, by] = pts[s + 1];
    const vx = bx - ax, vy = by - ay, len = Math.hypot(vx, vy) || 1;
    const nx = -vy / len, ny = vx / len;                // normal
    const x0 = Math.floor(Math.min(ax, bx) - 2), x1 = Math.ceil(Math.max(ax, bx) + 2);
    const y0 = Math.floor(Math.min(ay, by) - 2), y1 = Math.ceil(Math.max(ay, by) + 2);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (len * len)));
      const px = ax + t * vx, py = ay + t * vy, d = Math.hypot(x - px, y - py);
      if (d > 1.5) continue;
      const side = (x - px) * nx + (y - py) * ny;
      const lightSide = (nx * -1 + ny * -1) > 0 ? side > 0 : side < 0;   // lado voltado para cima/esquerda = luz
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
function frameFor(def, pose) {
  const P = Object.assign({}, COMMON, def.pal);
  const c = new Canvas(FRAME, FRAME);
  const lean = -pose.lean;                              // "para trás" = para a esquerda
  // 1) partes fixas: pernas (com camuflado) e botas, exatamente como na v4
  const legs = new Canvas(64, 64);
  legs.stamp(11, 38, LEGS, P); if (def.camo) camo(legs, P);
  legs.stamp(10, 59, BOOTS, Object.assign({}, P, { S: P.sole }));
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const col = legs.get(x, y); if (col) c.set(x + OX, y + OY, col); }
  // 2) tronco e cabeça (só translação)
  stampAt(c, 9 + lean, 21, def.torso, P);
  stampAt(c, 9 + lean, 4, def.head, P);
  // 3) braços e mãos
  const arms = new Set();
  const shB = [RIG.shoulderBack[0] + lean, RIG.shoulderBack[1] + 1];
  const shF = [RIG.shoulderFront[0] + lean, RIG.shoulderFront[1] + 1];
  const low = [pose.low[0] + lean, pose.low[1]], top = [pose.top[0] + lean, pose.top[1]];
  const eB = elbow(shB, low, 8, [-0.4, 1]);            // cotovelo de trás: para baixo
  const eF = elbow(shF, top, 6, [0.6, 1]);             // cotovelo da frente: para baixo e para fora
  paintArm(c, [shB, eB, low], P, arms);
  paintArm(c, [shF, eF, top], P, arms);
  const handOrigin = (h) => [Math.round(h[0]) - 1, Math.round(h[1]) - 1];
  const hl = handOrigin(low), ht = handOrigin(top);
  stampAt(c, hl[0], hl[1], HAND_LOW_ROWS, P);
  stampAt(c, ht[0], ht[1], HAND_TOP_ROWS, P);
  c.outline(OUTLINE);

  // 4) vara: direção da ponta = para cima e para trás
  const lowR = [Math.round(low[0]), Math.round(low[1])];
  const topR = [Math.round(top[0]), Math.round(top[1])];
  // a vara passa pelas duas mãos: direção ajustada para ligar exatamente os dois pontos
  const dd = [topR[0] - lowR[0], topR[1] - lowR[1]], dl = Math.hypot(dd[0], dd[1]);
  const u = [dd[0] / dl, dd[1] / dl];
  const butt = [Math.round(lowR[0] - u[0] * BUTT_BEHIND_LOW), Math.round(lowR[1] - u[1] * BUTT_BEHIND_LOW)];
  const tip = [Math.round(topR[0] + u[0] * ROD_SEAT_TO_TIP), Math.round(topR[1] + u[1] * ROD_SEAT_TO_TIP)];
  const rod = def.rod, pts = [];
  line4(butt[0], butt[1], tip[0], tip[1], (x, y) => pts.push([x, y]));
  const proj = (p) => (p[0] - butt[0]) * u[0] + (p[1] - butt[1]) * u[1];
  const sLow = proj(lowR), sTop = proj(topR);
  const steep = Math.abs(u[1]) > Math.abs(u[0]);
  const rodPx = new Map();                              // índice → {col, front}
  let n = 0;
  for (const p of pts) {
    const s = proj(p);
    const front = s <= sTop + 0.5;                      // do cabo até a mão de cima: na frente
    const grip = s <= sLow + 2;
    const thick = s <= sTop + 6;
    const band = rod.band && s > sTop + 2 && (n++ % 5 === 4);
    const col = grip ? rod.grip : band ? rod.band : rod.main;
    const put = (x, y, cc) => { const k = (y + OY) * FRAME + x + OX; if (!rodPx.has(k) || front) rodPx.set(k, { col: cc, front }); };
    put(p[0], p[1], col);
    if (thick) { const q = steep ? [p[0] + 1, p[1]] : [p[0], p[1] + 1]; put(q[0], q[1], grip ? rod.gripDark : rod.dark); }
  }
  const tipK = (tip[1] + OY) * FRAME + tip[0] + OX; rodPx.set(tipK, { col: rod.tip, front: rodPx.get(tipK) ? rodPx.get(tipK).front : false });
  for (const [k, v] of rodPx) {
    const x = k % FRAME, y = Math.floor(k / FRAME);
    if (v.front) c.set(x, y, v.col);                    // na frente do peito
    else if (!c.get(x, y)) c.set(x, y, v.col);          // atrás da cabeça e do tronco: só onde está vazio
  }
  // 5) molinete: carretel da v4 junto à mão de cima, do lado da frente, manivela para a frente
  const reelRows = REEL.slice(1);                       // sem a haste: o carretel encosta na mão
  const reelOrigin = [topR[0] + 1, topR[1] - 1];       // canto superior esquerdo do carretel (7 × 7 + manivela)
  stampAt(c, reelOrigin[0], reelOrigin[1], reelRows, Object.assign({}, P, { r: rod.reel, u: rod.spool, z: rod.hub, m: rod.crank, k: rod.knob }));
  // 6) mãos por cima de tudo
  stampAt(c, hl[0], hl[1], HAND_LOW_ROWS, P);
  stampAt(c, ht[0], ht[1], HAND_TOP_ROWS, P);

  return {
    c, arms, rodPx, pts, butt, tip, low: lowR, top: topR, hl, ht, reelOrigin, lean,
    out: { pontaDaVara: [tip[0] + OX, tip[1] + OY], cabo: [butt[0] + OX, butt[1] + OY],
      maoDeTras: [lowR[0] + OX, lowR[1] + OY], maoDaFrente: [topR[0] + OX, topR[1] + OY],
      molinete: [reelOrigin[0] + OX + 3, reelOrigin[1] + OY + 3], inclinacaoPx: pose.lean, anguloVaraGraus: Math.round(Math.atan2(-u[0], -u[1]) * 180 / Math.PI) }
  };
}

// ------------------------------------------------------------------ verificações
const problems = [];
const check = (ok, msg) => { if (!ok) problems.push(msg); };
const hexOf = (buf, i) => '#' + [0, 1, 2].map((k) => buf[i + k].toString(16).padStart(2, '0')).join('');

function readIdleFrame1(key) {
  const img = readPNG(path.join(IDLE_DIR, key + '_idle_spritesheet.png'));
  const f = new Array(FRAME * FRAME).fill(null);
  for (let y = 0; y < FRAME; y++) for (let x = 0; x < FRAME; x++) { const i = (y * img.w + x) * 4; if (img.buf[i + 3]) f[y * FRAME + x] = hexOf(img.buf, i); }
  return f;
}

function verify(key, def, frames) {
  const idle = readIdleFrame1(key);
  const v4 = readPNG(key === 'alemao' ? path.join(ROOT, 'arte/personagens-base/alemao_idle_v4.png') : path.join(ROOT, 'arte/personagens-base/ale_idle_v4.png'));
  const pal = new Set(); for (let i = 0; i < v4.buf.length; i += 4) if (v4.buf[i + 3]) pal.add(hexOf(v4.buf, i));
  const P = Object.assign({}, COMMON, def.pal);
  frames.forEach((F, k) => {
    const tag = key + ' quadro ' + (k + 1) + ': ';
    const px = F.c.px;
    // paleta
    for (const col of px) if (col && !pal.has(col)) { check(false, tag + 'cor fora da paleta v4 ' + col); break; }
    // pés e sola idênticos ao IDLE aprovado
    for (let y = FEET.y0; y <= FEET.y1; y++) for (let x = 0; x < FRAME; x++) if (px[y * FRAME + x] !== idle[y * FRAME + x]) { check(false, tag + 'pés diferentes do IDLE em (' + x + ',' + y + ')'); y = 999; break; }
    // margem (exceto pés)
    px.forEach((col, i) => { if (!col) return; const x = i % FRAME, y = Math.floor(i / FRAME); if (y >= FEET.y0) return; if (x < MIN_MARGIN || y < MIN_MARGIN || x > FRAME - 1 - MIN_MARGIN || y > FRAME - 1 - MIN_MARGIN) check(false, tag + 'pixel perto da borda em (' + x + ',' + y + ')'); });
    // rosto e cabeça intactos (só translação): todo pixel da cabeça = cor da peça v4
    const occl = (i) => F.arms.has(i) || (F.rodPx.has(i) && F.rodPx.get(i).front);
    let headBad = 0;
    def.head.forEach((row, dy) => [...row].forEach((ch, dx) => { if (ch === '.') return; const i = (4 + dy + OY) * FRAME + 9 + F.lean + dx + OX; if (px[i] !== P[ch] && !occl(i)) headBad++; }));
    check(headBad === 0, tag + headBad + ' pixels da cabeça alterados');
    let headCovered = 0;
    def.head.forEach((row, dy) => [...row].forEach((ch, dx) => { if (ch === '.') return; const i = (4 + dy + OY) * FRAME + 9 + F.lean + dx + OX; if (occl(i)) headCovered++; }));
    check(headCovered === 0, tag + 'braço ou vara cobrindo o rosto (' + headCovered + ' px)');
    // tronco: fora do que os braços, as mãos, o molinete e a vara cobrem, igual à peça v4
    let torsoBad = 0;
    const reelBox = (x, y) => x >= F.reelOrigin[0] + OX && x < F.reelOrigin[0] + OX + 10 && y >= F.reelOrigin[1] + OY && y < F.reelOrigin[1] + OY + 7;
    const handBox = (x, y) => [F.hl, F.ht].some((h) => x >= h[0] + OX && x < h[0] + OX + 3 && y >= h[1] + OY && y < h[1] + OY + 2);
    def.torso.forEach((row, dy) => [...row].forEach((ch, dx) => { if (ch === '.') return; const x = 9 + F.lean + dx + OX, y = 21 + dy + OY, i = y * FRAME + x; if (px[i] !== P[ch] && !occl(i) && !reelBox(x, y) && !handBox(x, y) && !F.rodPx.has(i)) torsoBad++; }));
    check(torsoBad === 0, tag + torsoBad + ' pixels do tronco alterados fora das áreas cobertas');
    // vara contínua e sem cortes: cada ponto da linha é vara ou está escondido atrás do corpo (nunca vazio)
    let gaps = 0; for (const p of F.pts) { const i = (p[1] + OY) * FRAME + p[0] + OX; if (!px[i]) gaps++; }
    check(gaps === 0, tag + 'vara com ' + gaps + ' falhas (pixels vazios na linha)');
    // vara visível dos dois lados: entre as mãos e na ponta
    const visTip = [...F.rodPx.entries()].filter(([i, v]) => !v.front && px[i] === v.col).length;
    check(visTip >= 4, tag + 'ponta da vara quase invisível (' + visTip + ' px)');
    // mãos seguram a vara: a linha passa dentro das duas mãos
    for (const [h, nome] of [[F.hl, 'de trás'], [F.ht, 'da frente']]) check(F.pts.some((p) => p[0] >= h[0] && p[0] < h[0] + 3 && p[1] >= h[1] && p[1] < h[1] + 2), tag + 'mão ' + nome + ' não está sobre a vara');
    // braços conectados: braço + mãos + tronco formam uma peça só (4-conexo)
    const body = new Set(); px.forEach((col, i) => { if (col && !(F.rodPx.has(i) && !F.rodPx.get(i).front && px[i] === F.rodPx.get(i).col)) body.add(i); });
    const seen = new Set(), start = [...body][0], q = [start]; seen.add(start);
    while (q.length) { const i = q.pop(); for (const j of [i - 1, i + 1, i - FRAME, i + FRAME]) if (body.has(j) && !seen.has(j)) { seen.add(j); q.push(j); } }
    check(seen.size === body.size, tag + 'partes desconectadas do corpo (' + (body.size - seen.size) + ' px soltos)');
    // a parte da vara atrás do corpo também precisa encostar no corpo (não pode flutuar)
    const behind = [...F.rodPx.entries()].filter(([i, v]) => !v.front && px[i] === v.col).map(([i]) => i);
    if (behind.length) { const all = new Set([...body, ...behind]); const s2 = new Set([start]), q2 = [start]; while (q2.length) { const i = q2.pop(); for (const j of [i - 1, i + 1, i - FRAME, i + FRAME, i - FRAME - 1, i - FRAME + 1, i + FRAME - 1, i + FRAME + 1]) if (all.has(j) && !s2.has(j)) { s2.add(j); q2.push(j); } } check(s2.size === all.size, tag + 'trecho da vara solto do corpo'); }
  });
  // continuidade entre quadros vizinhos (e saindo do IDLE)
  const idleHands = { low: [RIG.handLow[0] + 1, RIG.handLow[1] + 1], top: [RIG.handTop[0] + 1, RIG.handTop[1] + 1] };
  const seq = [{ low: idleHands.low, top: idleHands.top, tip: RIG.rodTip }, ...frames.map((f) => ({ low: f.low, top: f.top, tip: f.tip }))];
  const steps = [];
  for (let k = 0; k < seq.length - 1; k++) {
    const a = seq[k], b = seq[k + 1];
    const dh = Math.max(Math.hypot(a.low[0] - b.low[0], a.low[1] - b.low[1]), Math.hypot(a.top[0] - b.top[0], a.top[1] - b.top[1]));
    const dt = Math.hypot(a.tip[0] - b.tip[0], a.tip[1] - b.tip[1]);
    steps.push({ de: k === 0 ? 'IDLE' : k, para: k + 1, maos: +dh.toFixed(1), ponta: +dt.toFixed(1) });
    if (k > 0) check(dh <= 4.5, key + ': mãos saltam ' + dh.toFixed(1) + ' px entre os quadros ' + k + ' e ' + (k + 1));
  }
  return steps;
}

// ------------------------------------------------------------------ GIF (mesmo codificador do IDLE)
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

// ------------------------------------------------------------------ saída
const CHARS = { alemao: V4.ALEMAO, ale: V4.ALE };
const built = {}, steps = {};
for (const [key, def] of Object.entries(CHARS)) { built[key] = POSES.map((p) => frameFor(def, p)); steps[key] = verify(key, def, built[key]); }
if (problems.length) { console.error('FALHOU:\n  ' + problems.join('\n  ')); process.exit(1); }

const BG = [0x4f, 0x7a, 0x94];
const toRGBA = (mats, s, bg) => {
  const w = FRAME * mats.length * s, h = FRAME * s, buf = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const k = Math.floor(x / (FRAME * s)), col = mats[k][Math.floor(y / s) * FRAME + Math.floor((x % (FRAME * s)) / s)], o = (y * w + x) * 4;
    if (col) { buf[o] = parseInt(col.slice(1, 3), 16); buf[o + 1] = parseInt(col.slice(3, 5), 16); buf[o + 2] = parseInt(col.slice(5, 7), 16); buf[o + 3] = 255; }
    else if (bg) { buf[o] = bg[0]; buf[o + 1] = bg[1]; buf[o + 2] = bg[2]; buf[o + 3] = 255; }
  }
  return { w, h, buf };
};
fs.mkdirSync(path.join(OUT, 'previews'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'quadros'), { recursive: true });
const idleMat = {};
for (const [key, frames] of Object.entries(built)) {
  const mats = frames.map((f) => f.c.px);
  const sheet = toRGBA(mats, 1, null); writePNG(path.join(OUT, key + '_charge_spritesheet.png'), sheet.w, sheet.h, sheet.buf);
  mats.forEach((m, i) => { const one = toRGBA([m], 1, null); writePNG(path.join(OUT, 'quadros', key + '_charge_' + (i + 1) + '.png'), one.w, one.h, one.buf); });
  const big = toRGBA(mats, 4, BG); writePNG(path.join(OUT, 'previews', key + '_charge_quadros_x4.png'), big.w, big.h, big.buf);
  idleMat[key] = readIdleFrame1(key);
}

// Prévia: IDLE (quadro 1) → preparação (1, 2) → 2 ciclos do medidor de força (3/4/5 conforme a força)
// → retorno de cancelamento (2 → 1 → IDLE, 60 ms cada). Tempos do P1: medidor vai e volta em 1600 ms.
function sequence() {
  const s = [{ f: 'idle', ms: 600 }, { f: 0, ms: 100 }, { f: 1, ms: 100 }];
  for (let cyc = 0; cyc < 2; cyc++) s.push({ f: 2, ms: 270 }, { f: 3, ms: 260 }, { f: 4, ms: 540 }, { f: 3, ms: 260 }, { f: 2, ms: 270 });
  s.push({ f: 1, ms: 60 }, { f: 0, ms: 60 }, { f: 'idle', ms: 600 });
  return s;
}
function previewGif(keys) {
  const S = 4, colorIdx = new Map([[BG.join(','), 0]]), palette = [BG], out = [];
  for (const step of sequence()) {
    const mats = keys.map((k) => step.f === 'idle' ? idleMat[k] : built[k][step.f].c.px);
    const img = toRGBA(mats, S, BG), idx = new Uint8Array(img.w * img.h);
    for (let p = 0; p < img.w * img.h; p++) { const key = img.buf[p * 4] + ',' + img.buf[p * 4 + 1] + ',' + img.buf[p * 4 + 2]; if (!colorIdx.has(key)) { colorIdx.set(key, palette.length); palette.push([img.buf[p * 4], img.buf[p * 4 + 1], img.buf[p * 4 + 2]]); } idx[p] = colorIdx.get(key); }
    const last = out[out.length - 1];
    if (last && Buffer.compare(Buffer.from(last.idx), Buffer.from(idx)) === 0) { last.ms += step.ms; continue; }
    out.push({ idx, ms: step.ms, w: img.w, h: img.h });
  }
  if (palette.length > 256) throw new Error('paleta do GIF > 256');
  return gif(out[0].w, out[0].h, out, palette);
}
fs.writeFileSync(path.join(OUT, 'previews', 'alemao_charge_x4.gif'), previewGif(['alemao']));
fs.writeFileSync(path.join(OUT, 'previews', 'ale_charge_x4.gif'), previewGif(['ale']));
fs.writeFileSync(path.join(OUT, 'previews', 'ambos_charge_x4.gif'), previewGif(['alemao', 'ale']));

const data = {
  animacao: 'charge',
  quadro: { largura: FRAME, altura: FRAME },
  spritesheet: { arquivo: '<personagem>_charge_spritesheet.png', colunas: 5, linhas: 1, ordem: POSES.map((p) => p.id + ' ' + p.nome) },
  ancora: { phaserOrigin: [0.5, 1], deslocamentoV4: [OX, OY], solaY: SOLE_Y, pes: FEET, centroPesX: 47.5 },
  reproducao: {
    preparacao: { indices: [0, 1], msPorQuadro: [100, 100], tipo: 'pontual, ao começar a segurar' },
    carga: { tipo: 'quadro escolhido pela força atual do medidor (0–100), sem tempo próprio', faixas: POSES.slice(2).map((p, i) => ({ indice: i + 2, forcaDe: p.faixa[0], forcaAte: p.faixa[1] })) },
    cancelamento: { indices: [1, 0], msPorQuadro: [60, 60], depois: 'idle', quando: 'soltou antes de 0,2 s (toque curto) ou interrupção' },
    soltura: 'ao soltar com carga válida, o jogo troca para CAST (não faz parte desta animação)'
  },
  pontos: Object.fromEntries(Object.entries(built).map(([k, fr]) => [k, fr.map((f, i) => Object.assign({ indice: i }, f.out))]))
};
fs.writeFileSync(path.join(OUT, 'charge.json'), JSON.stringify(data, null, 2) + '\n');

console.log('OK — todas as verificações passaram');
for (const [k, fr] of Object.entries(built)) {
  console.log('  ' + k + ': pontas ' + JSON.stringify(fr.map((f) => f.out.pontaDaVara)) + ' · mãos (trás/frente) ' + JSON.stringify(fr.map((f) => [f.out.maoDeTras, f.out.maoDaFrente])));
  console.log('    deslocamentos entre quadros (px): ' + steps[k].map((s) => s.de + '→' + s.para + ' mãos ' + s.maos + ' ponta ' + s.ponta).join(' · '));
}
