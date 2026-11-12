/*
 * Hangover Fishing — Animação CATCH (Alemão e ALE)
 *
 * Uso (na pasta do projeto):   node arte/personagens-animacoes/catch/ferramentas/gerar_catch.js
 * Plano: docs/PLANO_ANIMACOES_PERSONAGENS.md (seção 5.5). Entra a partir do REEL/FIGHT (peixe recolhido: FIGHTING → CAUGHT);
 * o quadro 4 (pose final) fica na tela durante o cartão de captura; no fim do cartão, a saída volta ao IDLE.
 *
 * Mesma construção do CHARGE, CAST, REEL/FIGHT e FRUSTRATION:
 *   - peças da v4 aprovada reaproveitadas sem alteração (gerador v4 lido em memória, só leitura);
 *   - cabeça e tronco só se deslocam (o "pulinho" de 1 px do plano);
 *   - braços calculados (ombro → cotovelo → mão) com o sombreado do moletom da v4;
 *   - a vara da v4, reta, passa para a mão de trás, segurada pelo assento do molinete e apontando para cima e para trás.
 * O PEIXE NÃO FAZ PARTE DO SPRITE: o jogo o desenha preso ao ponto da mão da frente (frame 2 em diante).
 *
 * Personalidade (dentro dos limites do plano: mesmos 4 quadros, mesmos tempos e o mesmo pulinho de 1 px):
 *   Alemão — espontâneo: ergue o peixe bem alto (mão na altura do boné) e levanta a vara junto: os dois braços para cima.
 *   ALE    — tranquilo e experiente: mostra o peixe à frente, na altura do ombro; a vara fica apoiada, inclinada para trás.
 * Nada é sobrescrito fora de arte/personagens-animacoes/catch/.
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
const ROD_SEAT_TO_TIP = 28, SEAT_TO_BUTT = 15; // vara da v4: 15 px do assento ao fim do cabo, 28 px do assento à ponta
const MIN_MARGIN = 3;
const CARD_MS = 2200;                          // cartão de captura do P1 (config.resultCaughtMs)
const SKIP_AFTER_MS = 600;                     // o cartão pode ser pulado depois disto (config.resultSkipAfterMs)
// Reprodução (plano 5.5): 1 (150) → 2 (150) → 3 (200) → 4 mantido até o fim do cartão. Sem loop.
// Saída (proposta, mesmo padrão aprovado na FRUSTRATION): no fim do cartão, 4 → 2 (100) → 1 (100) → IDLE.
const ENTRY = [{ i: 0, ms: 150 }, { i: 1, ms: 150 }, { i: 2, ms: 200 }, { i: 3, ms: null }];
const EXIT = [{ i: 1, ms: 100 }, { i: 0, ms: 100 }];
const HOLD_INDEX = 3, FISH_FROM_INDEX = 1;

// Pose (coordenadas da v4; mãos = centro):
//   dy   — deslocamento de cabeça + tronco (−1 = pulinho)
//   back — mão de trás no assento do molinete; ang = graus a partir da vertical, para trás (+) — a vara aponta para cima e para trás
//   front — mão da frente (livre; segura o peixe a partir do quadro 2); seg e dir do cotovelo
const POSES = {
  alemao: [
    { nome: 'troca de mão',   dy: 0,  back: { at: [10, 32], ang: 20, seg: 8, dir: [-0.6, 1] },  front: { at: [26, 26], seg: 6,   dir: [0.6, 1] } },
    { nome: 'peixe no ombro', dy: 0,  back: { at: [9, 30],  ang: 15, seg: 8, dir: [-1, 0.6] },  front: { at: [29, 17], seg: 6.5, dir: [0.7, 1] } },
    { nome: 'pulinho',        dy: -1, back: { at: [7, 26],  ang: 10, seg: 8, dir: [-1, 0.3] },  front: { at: [30, 8],  seg: 8.5, dir: [1, 0.1] } },
    { nome: 'pose final',     dy: 0,  back: { at: [7, 27],  ang: 10, seg: 8, dir: [-1, 0.3] },  front: { at: [30, 9],  seg: 8.5, dir: [1, 0.1] } }
  ],
  ale: [
    { nome: 'troca de mão',   dy: 0,  back: { at: [10, 33], ang: 25, seg: 8, dir: [-0.6, 1] },  front: { at: [26, 27], seg: 6,   dir: [0.6, 1] } },
    { nome: 'peixe no ombro', dy: 0,  back: { at: [9, 33],  ang: 25, seg: 8, dir: [-0.6, 1] },  front: { at: [30, 21], seg: 6.5, dir: [0.7, 1] } },
    { nome: 'pulinho',        dy: -1, back: { at: [9, 32],  ang: 25, seg: 8, dir: [-0.6, 1] },  front: { at: [31, 18], seg: 6.5, dir: [0.7, 1] } },
    { nome: 'pose final',     dy: 0,  back: { at: [9, 33],  ang: 25, seg: 8, dir: [-0.6, 1] },  front: { at: [31, 19], seg: 6.5, dir: [0.7, 1] } }
  ]
};
const HAND_STEP_MAX = 9.5;                     // gesto rápido (100–200 ms por quadro), mesmo limite da FRUSTRATION
const EXIT_TO_IDLE_MAX = 6.5;                  // volta ao IDLE: mesmo limite do CAST e da FRUSTRATION

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
  const dy = pose.dy;
  // 1) pernas (com camuflado) e botas, exatamente como na v4
  const legs = new Canvas(64, 64);
  legs.stamp(11, 38, LEGS, P); if (def.camo) camo(legs, P);
  legs.stamp(10, 59, BOOTS, Object.assign({}, P, { S: P.sole }));
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const col = legs.get(x, y); if (col) c.set(x + OX, y + OY, col); }
  // 2) tronco e cabeça (só translação vertical: o pulinho)
  const headO = [9, 4 + dy];
  stampAt(c, 9, 21 + dy, def.torso, P);
  stampAt(c, headO[0], headO[1], def.head, P);
  // 3) braços e mãos
  const arms = new Set();
  const shB = [RIG.shoulderBack[0], RIG.shoulderBack[1] + 1 + dy];
  const shF = [RIG.shoulderFront[0], RIG.shoulderFront[1] + 1 + dy];
  const back = pose.back.at, front = pose.front.at;
  paintArm(c, [shB, elbow(shB, back, pose.back.seg, pose.back.dir), back], P, arms);
  paintArm(c, [shF, elbow(shF, front, pose.front.seg, pose.front.dir), front], P, arms);
  const hl = [back[0] - 1, back[1] - 1], ht = [front[0] - 1, front[1] - 1];
  stampAt(c, hl[0], hl[1], HAND_LOW_ROWS, P);
  stampAt(c, ht[0], ht[1], HAND_TOP_ROWS, P);
  c.outline(OUTLINE);
  // 4) vara: segura pelo assento do molinete na mão de trás, para cima e para trás
  const a = pose.back.ang * Math.PI / 180, u = [-Math.sin(a), -Math.cos(a)];
  const seat = back;
  const butt = [Math.round(seat[0] - u[0] * SEAT_TO_BUTT), Math.round(seat[1] - u[1] * SEAT_TO_BUTT)];
  const tip = [Math.round(seat[0] + u[0] * ROD_SEAT_TO_TIP), Math.round(seat[1] + u[1] * ROD_SEAT_TO_TIP)];
  const rod = def.rod, pts = [];
  line4(butt[0], butt[1], tip[0], tip[1], (x, y) => pts.push([x, y]));
  const proj = (p) => (p[0] - butt[0]) * u[0] + (p[1] - butt[1]) * u[1];
  const sSeat = proj(seat);
  const rodPx = new Map();
  // A vara fica ao lado do corpo, na mão de trás: passa NA FRENTE do braço e do tronco (senão pareceria nascer do ombro)
  // e só vai para trás onde cruzaria a cabeça, que nunca é coberta.
  const headMask = new Set();
  def.head.forEach((row, ry) => [...row].forEach((ch, rx) => { if (ch !== '.') headMask.add((headO[1] + ry + OY) * FRAME + headO[0] + rx + OX); }));
  let n = 0;
  for (const p of pts) {
    const s = proj(p);
    const front = !headMask.has((p[1] + OY) * FRAME + p[0] + OX) && !headMask.has((p[1] + OY) * FRAME + p[0] + 1 + OX);
    const grip = s <= sSeat - 7;                        // cabo escuro (mesma proporção da v4)
    const thick = s <= sSeat + 6;
    const band = rod.band && s > sSeat + 2 && (n++ % 5 === 4);
    const col = grip ? rod.grip : band ? rod.band : rod.main;
    const up = s > sSeat + 0.5;
    const put = (x, y, cc) => { const k = (y + OY) * FRAME + x + OX; if (!rodPx.has(k) || front) rodPx.set(k, { col: cc, front, up }); };
    put(p[0], p[1], col);
    if (thick) put(p[0] + 1, p[1], grip ? rod.gripDark : rod.dark);   // vara em pé: espessura para o lado
  }
  const tipK = (tip[1] + OY) * FRAME + tip[0] + OX; rodPx.set(tipK, { col: rod.tip, front: !headMask.has(tipK), up: true });
  for (const [k, v] of rodPx) { const x = k % FRAME, y = Math.floor(k / FRAME); if (v.front) c.set(x, y, v.col); else if (!c.get(x, y)) c.set(x, y, v.col); }
  // 5) molinete da v4 ao lado da mão, com a vara em pé (como no CHARGE e no CAST "lado")
  const reelOrigin = [seat[0] + 1, seat[1] - 1];
  stampAt(c, reelOrigin[0], reelOrigin[1], REEL.slice(1), Object.assign({}, P, { r: rod.reel, u: rod.spool, z: rod.hub, m: rod.crank, k: rod.knob }));
  // 6) mãos por cima de tudo
  stampAt(c, hl[0], hl[1], HAND_LOW_ROWS, P);
  stampAt(c, ht[0], ht[1], HAND_TOP_ROWS, P);
  return {
    c, arms, rodPx, pts, tip, butt, seat, hl, ht, reelOrigin, dy, headO, back, front,
    out: {
      nome: pose.nome, maoDaFrente: [front[0] + OX, front[1] + OY], maoDeTras: [back[0] + OX, back[1] + OY],
      pontaDaVara: [tip[0] + OX, tip[1] + OY], cabo: [butt[0] + OX, butt[1] + OY],
      varaGrausDaVertical: pose.back.ang, puloPx: -dy
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
  const faceGap = [];
  frames.forEach((F, k) => {
    const tag = key + ' quadro ' + (k + 1) + ' (' + F.out.nome + '): ';
    const px = F.c.px;
    for (const col of px) if (col && !pal.has(col)) { check(false, tag + 'cor fora da paleta v4 ' + col); break; }
    for (let y = FEET.y0; y <= FEET.y1; y++) for (let x = 0; x < FRAME; x++) if (px[y * FRAME + x] !== idle[y * FRAME + x]) { check(false, tag + 'pés diferentes do IDLE em (' + x + ',' + y + ')'); y = 999; break; }
    px.forEach((col, i) => { if (!col) return; const x = i % FRAME, y = Math.floor(i / FRAME); if (y >= FEET.y0) return; if (x < MIN_MARGIN || y < MIN_MARGIN || x > FRAME - 1 - MIN_MARGIN || y > FRAME - 1 - MIN_MARGIN) check(false, tag + 'pixel perto da borda em (' + x + ',' + y + ')'); });
    // cabeça e rosto: só translação; nada cobre a cabeça
    const handBox = (x, y) => [F.hl, F.ht].some((h) => x >= h[0] + OX && x < h[0] + OX + 3 && y >= h[1] + OY && y < h[1] + OY + 2);
    const occl = (i) => F.arms.has(i) || handBox(i % FRAME, Math.floor(i / FRAME)) || (F.rodPx.has(i) && F.rodPx.get(i).front);
    let headBad = 0, headCovered = 0, faceRight = -1;
    def.head.forEach((row, ry) => [...row].forEach((ch, rx) => {
      if (ch === '.') return;
      const i = (F.headO[1] + ry + OY) * FRAME + F.headO[0] + rx + OX;
      if (occl(i)) headCovered++; else if (px[i] !== P[ch]) headBad++;
      faceRight = Math.max(faceRight, F.headO[0] + rx);
    }));
    check(headBad === 0, tag + headBad + ' pixels da cabeça alterados');
    check(headCovered === 0, tag + 'braço, mão ou vara cobrindo a cabeça (' + headCovered + ' px)');
    faceGap.push(F.front[0] - 1 - faceRight);          // espaço entre a borda direita da cabeça e a mão (para o peixe)
    // tronco fora das áreas cobertas
    let torsoBad = 0;
    const reelBox = (x, y) => x >= F.reelOrigin[0] + OX && x < F.reelOrigin[0] + OX + 10 && y >= F.reelOrigin[1] + OY && y < F.reelOrigin[1] + OY + 7;
    def.torso.forEach((row, ry) => [...row].forEach((ch, rx) => { if (ch === '.') return; const x = 9 + rx + OX, y = 21 + F.dy + ry + OY, i = y * FRAME + x; if (px[i] !== P[ch] && !occl(i) && !reelBox(x, y) && !F.rodPx.has(i)) torsoBad++; }));
    check(torsoBad === 0, tag + torsoBad + ' pixels do tronco alterados fora das áreas cobertas');
    // vara
    let gaps = 0; for (const p of F.pts) if (!px[(p[1] + OY) * FRAME + p[0] + OX]) gaps++;
    check(gaps === 0, tag + 'vara com ' + gaps + ' falhas');
    const tipVis = [...F.rodPx.entries()].filter(([i, v]) => px[i] === v.col && v.up).length;
    check(tipVis >= 24, tag + 'trecho de cima da vara pouco visível (' + tipVis + ' px)');
    check(F.pts.some((p) => p[0] >= F.hl[0] && p[0] < F.hl[0] + 3 && p[1] >= F.hl[1] && p[1] < F.hl[1] + 2), tag + 'mão de trás não está na vara');
    check(F.tip[1] < F.headO[1] + 8, tag + 'a ponta da vara deveria ficar no alto (acima dos olhos)');
    // peça única
    const body = new Set(); px.forEach((col, i) => { if (col && !(F.rodPx.has(i) && !F.rodPx.get(i).front && px[i] === F.rodPx.get(i).col)) body.add(i); });
    const start = [...body][0], seen = new Set([start]), q = [start];
    while (q.length) { const i = q.pop(); for (const j of [i - 1, i + 1, i - FRAME, i + FRAME]) if (body.has(j) && !seen.has(j)) { seen.add(j); q.push(j); } }
    check(seen.size === body.size, tag + 'partes desconectadas (' + (body.size - seen.size) + ' px)');
    const behind = [...F.rodPx.entries()].filter(([i, v]) => !v.front && px[i] === v.col).map(([i]) => i);
    const all = new Set([...body, ...behind]), s2 = new Set([start]), q2 = [start];
    while (q2.length) { const i = q2.pop(); for (const j of [i - 1, i + 1, i - FRAME, i + FRAME, i - FRAME - 1, i - FRAME + 1, i + FRAME - 1, i + FRAME + 1]) if (all.has(j) && !s2.has(j)) { s2.add(j); q2.push(j); } }
    check(s2.size === all.size, tag + 'trecho da vara solto');
  });
  // pose final = pose do quadro 3 com o tronco de volta (plano): braço e mão 1 px abaixo, vara igual
  const f3 = frames[2], f4 = frames[3];
  check(f4.front[1] - f3.front[1] === 1 && f4.front[0] === f3.front[0], key + ': a mão do quadro 4 deveria ser a do quadro 3 descida 1 px (tronco de volta)');
  // continuidade pela ordem de reprodução: IDLE → 1 → 2 → 3 → 4 (mantido) → 2 → 1 → IDLE
  const idleP = { nome: 'IDLE', back: [RIG.handLow[0] + 1, RIG.handLow[1] + 1], front: [RIG.handTop[0] + 1, RIG.handTop[1] + 1] };
  const fr = (i) => ({ nome: 'quadro ' + (i + 1), back: frames[i].back, front: frames[i].front });
  const play = [...ENTRY.map((e) => fr(e.i)), ...EXIT.map((e) => fr(e.i)), idleP];
  const step = (a, b) => Math.max(dist(a.back, b.back), dist(a.front, b.front));
  const steps = [];
  for (let i = 0; i < play.length - 1; i++) {
    const d = step(play[i], play[i + 1]), last = i === play.length - 2;
    steps.push({ de: play[i].nome, para: play[i + 1].nome, maosPx: +d.toFixed(1) });
    check(d <= (last ? EXIT_TO_IDLE_MAX : HAND_STEP_MAX), key + ': mãos saltam ' + d.toFixed(1) + ' px de ' + play[i].nome + ' para ' + play[i + 1].nome);
  }
  // entrada a partir do REEL/FIGHT (o peixe chega com a briga em qualquer nível e posição da manivela)
  const reel = JSON.parse(fs.readFileSync(path.join(REEL_DIR, 'reel_fight.json'), 'utf8')).pontos[key];
  const v = (p) => [p[0] - OX, p[1] - OY];
  const entradas = [1, 2, 3, 4].map((lv) => [0, 1, 2, 3].map((p) => { const r = reel[(lv - 1) * 4 + p]; return +step({ back: v(r.maoDeTras), front: v(r.maoDaFrente) }, fr(0)).toFixed(1); }));
  const worstIn = Math.max(...entradas.flat());
  // só medida (como na FRUSTRATION): a captura não pode esperar a manivela; o pior caso vai para o README
  void worstIn;
  return { steps, entradas, faceGap };
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
  const sheet = rgba(mats, 1, null); writePNG(path.join(OUT, key + '_catch_spritesheet.png'), sheet.w, sheet.h, sheet.buf);
  mats.forEach((m, i) => { const one = rgba([m], 1, null); writePNG(path.join(OUT, 'quadros', key + '_catch_' + (i + 1) + '.png'), one.w, one.h, one.buf); });
  const big = rgba(mats, 4, BG); writePNG(path.join(OUT, 'previews', key + '_catch_quadros_x4.png'), big.w, big.h, big.buf);
  ext[key] = { idle: readIdle1(key), reel: (i) => readSheetFrame(path.join(REEL_DIR, key + '_reel_fight_spritesheet.png'), i, 4) };
}
// Prévia (tempos do P1; o peixe é do jogo e não aparece): briga no nível 2 → peixe recolhido → CATCH com o quadro 4
// mantido até o fim do cartão de 2,2 s → saída → IDLE; depois, uma briga no nível 4 → CATCH → IDLE.
const HELD_MS = CARD_MS - ENTRY.slice(0, 3).reduce((a, e) => a + e.ms, 0);
function sequence() {
  const ct = () => [...ENTRY.map((e) => ({ f: e.i, ms: e.ms == null ? HELD_MS : e.ms })), ...EXIT.map((e) => ({ f: e.i, ms: e.ms }))];
  const reelLoop = (lv, n) => { const s = []; for (let i = 0; i < n; i++) s.push({ reel: (lv - 1) * 4 + (i % 4), ms: 90 }); return s; };
  return [{ idle: true, ms: 500 }, ...reelLoop(2, 8), ...ct(), { idle: true, ms: 900 }, ...reelLoop(4, 8), ...ct(), { idle: true, ms: 900 }];
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
fs.writeFileSync(path.join(OUT, 'previews', 'alemao_catch_x4.gif'), previewGif(['alemao']));
fs.writeFileSync(path.join(OUT, 'previews', 'ale_catch_x4.gif'), previewGif(['ale']));
fs.writeFileSync(path.join(OUT, 'previews', 'ambos_catch_x4.gif'), previewGif(['alemao', 'ale']));

const data = {
  animacao: 'catch',
  quadro: { largura: FRAME, altura: FRAME },
  spritesheet: { arquivo: '<personagem>_catch_spritesheet.png', colunas: 4, linhas: 1, ordem: POSES.alemao.map((p, i) => (i + 1) + ' ' + p.nome) },
  ancora: { phaserOrigin: [0.5, 1], deslocamentoV4: [OX, OY], solaY: SOLE_Y, pes: FEET, centroPesX: 47.5 },
  quando: 'estado CAUGHT do P1 (FIGHTING → CAUGHT, peixe recolhido)',
  reproducao: {
    tipo: 'pontual, sem loop: 1 → 2 → 3 → 4; o quadro 4 (pose final) fica parado até o fim do cartão de captura',
    entrada: ENTRY.map((e) => ({ indice: e.i, quadro: e.i + 1, ms: e.ms == null ? 'mantido até o fim do cartão' : e.ms })),
    poseFinal: { indice: HOLD_INDEX, quadro: HOLD_INDEX + 1, noCartaoDe2200msFicaMs: HELD_MS },
    pulinho: 'quadros 3 → 4: tronco e cabeça sobem 1 px no 3 e voltam no 4; acontece uma vez só',
    saida: { quadros: EXIT.map((e) => ({ indice: e.i, quadro: e.i + 1, ms: e.ms })), depois: 'idle', quando: 'transição CAUGHT → IDLE do P1 (fim do cartão de ' + CARD_MS + ' ms). Só visual (200 ms): não atrasa a lógica', status: 'PROPOSTA — aguardando aprovação criativa (o plano não define a saída)' },
    cartaoPulado: 'se o jogador pular o cartão (toque após ' + SKIP_AFTER_MS + ' ms), o P1 começa a carga: a animação troca para o CHARGE na hora, sem tocar a saída (plano, seção 4)'
  },
  peixe: {
    desenhadoPeloJogo: true,
    aPartirDoQuadro: FISH_FROM_INDEX + 1,
    pontoDePresa: 'maoDaFrente de cada quadro (pontos.<personagem>[i].maoDaFrente)',
    recomendacao: 'desenhar o peixe pendurado a partir da mão, para baixo e para o lado de fora (direita, ou esquerda com flipX); a largura livre entre a cabeça e a mão está em espacoAteACabecaPx'
  },
  personalidade: {
    alemao: 'espontâneo: ergue o peixe bem alto (mão na altura do boné, ao lado da cabeça) e levanta a vara junto; os dois braços para cima no pulinho',
    ale: 'tranquilo e experiente: mostra o peixe à frente, na altura do ombro; a vara fica apoiada, inclinada para trás, na mão de trás; o mesmo pulinho de 1 px'
  },
  pontos: Object.fromEntries(Object.entries(built).map(([k, fr]) => [k, fr.map((f, i) => Object.assign({ indice: i, quadro: i + 1, peixe: i >= FISH_FROM_INDEX, espacoAteACabecaPx: report[k].faceGap[i] }, f.out))])),
  continuidade: Object.fromEntries(Object.entries(report).map(([k, r]) => [k, { passosDasMaosPx: r.steps, entradaVindaDoReelFightPx: { porNivelEPosicao: r.entradas } }]))
};
fs.writeFileSync(path.join(OUT, 'catch.json'), JSON.stringify(data, null, 2) + '\n');

console.log('OK — todas as verificações passaram');
for (const [k, fr] of Object.entries(built)) {
  console.log('  ' + k + ': ' + fr.map((f, i) => (i + 1) + ' ' + f.out.nome + ' mão ' + JSON.stringify(f.out.maoDaFrente) + ' ponta ' + JSON.stringify(f.out.pontaDaVara)).join(' · '));
  console.log('    mãos (1 → 2 → 3 → 4 → 2 → 1 → IDLE): ' + report[k].steps.map((s) => s.maosPx).join(' · ') + ' · entrada do REEL (pior): ' + Math.max(...report[k].entradas.flat()) + ' · espaço cabeça→mão: ' + report[k].faceGap.join('/'));
}
