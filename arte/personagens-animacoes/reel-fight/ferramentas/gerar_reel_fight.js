/*
 * Hangover Fishing — Animação REEL/FIGHT (Alemão e ALE)
 *
 * Uso (na pasta do projeto):   node arte/personagens-animacoes/reel-fight/ferramentas/gerar_reel_fight.js
 * Plano: docs/PLANO_ANIMACOES_PERSONAGENS.md (seção 5.4).
 *
 * 16 quadros por personagem = 4 níveis de tensão × 4 posições da manivela.
 *   Índice do quadro (0–15) = (nível − 1) × 4 + (posição − 1). Spritesheet em grade 4 × 4:
 *   cada LINHA é um nível, cada COLUNA é uma posição da manivela (1 cima · 2 frente · 3 baixo · 4 trás).
 *
 * Mesma construção do CHARGE e do CAST:
 *   - peças da v4 aprovada reaproveitadas sem alteração (gerador v4 lido em memória, só leitura):
 *     cabeça, tronco, pernas, botas, mãos, carretel do molinete, paletas, contorno;
 *   - braços calculados (ombro → cotovelo → mão) com o sombreado do moletom da v4;
 *   - mão de trás fixa no cabo; a vara passa exatamente por ela e pelo assento do molinete;
 *   - mão da frente na manopla da manivela, que gira em volta do cubo do carretel;
 *   - vara: cabo reto até o molinete; do molinete até a ponta, um arco com os mesmos 28 px da v4,
 *     curvando pouco perto do molinete e mais perto da ponta.
 * A animação só desenha o personagem: linha, peixe e indicadores continuam com o jogo.
 * Nada é sobrescrito fora de arte/personagens-animacoes/reel-fight/.
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
const CRANK_MS = 90;                           // cada posição da manivela: 90 ms (uma volta = 360 ms)
const FISGADA_MS = 100;

// Níveis (coordenadas da v4). low = centro da mão de trás (cabo) · seat = assento do molinete na vara
// dx = tronco e cabeça (− = para trás) · drop = quanto a ponta desce em relação à vara reta (px)
const LEVELS = [
  { nivel: 1, nome: 'linha frouxa',   zona: 'REELING_EMPTY ou FROUXA (tensão < 0,20)', low: [15, 37], seat: [24, 32], dx: 0,  drop: 0,  segF: 8.5 },
  { nivel: 2, nome: 'tensão segura',  zona: 'SEGURA (0,20 a 0,65)',                    low: [15, 36], seat: [24, 31], dx: 0,  drop: 3,  segF: 8.5 },
  { nivel: 3, nome: 'alerta',         zona: 'ALERTA (0,65 a 0,85)',                    low: [14, 36], seat: [23, 30], dx: -1, drop: 7,  segF: 8.5 },
  { nivel: 4, nome: 'crítica',        zona: 'CRÍTICA (0,85 ou mais)',                  low: [13, 36], seat: [22, 29], dx: -2, drop: 12, segF: 8.5 }
];
// 1: vara reta no ângulo da v4, corpo como na v4 (recolhendo sem peso)
// 2: vara 1 px mais alta e curva leve: controle
// 3: vara mais alta, curva média, tronco 1 px para trás, mãos 1 px para trás: esforço
// 4: vara bem levantada (~48°), curva forte, tronco 2 px para trás: a linha parece perto de arrebentar
// Manivela: a manopla gira em volta do cubo do carretel (raio 4 px), no sentido horário na tela.
const CRANK_R = 4;
const CRANK = [
  { pos: 1, nome: 'cima',   d: [0, -CRANK_R] },
  { pos: 2, nome: 'frente', d: [CRANK_R, 0] },
  { pos: 3, nome: 'baixo',  d: [0, CRANK_R] },
  { pos: 4, nome: 'trás',   d: [-CRANK_R, 0] }
];
const HUB_BELOW_SEAT = 5;                      // como na v4: assento (24,31) → cubo (24,36)
const FISGADA = { nivel: 3, posicao: 1, indice: 8, ms: FISGADA_MS };

// ------------------------------------------------------------------ utilitários de desenho
function stampAt(c, x, y, rows, pal) { c.stamp(x + OX, y + OY, rows, pal); }

/** Braço: traço de 3 px por dois segmentos, com sombreado do moletom. */
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

/** Arco da vara a partir do assento: ângulo θ(t) = θ0 + K·t², t = s/28. Devolve pontos reais a cada 0,25 px. */
function arc(seat, u, K) {
  const a0 = Math.atan2(u[1], u[0]), pts = [[seat[0], seat[1], 0, u[0], u[1]]];
  let x = seat[0], y = seat[1];
  const ds = 0.25;
  for (let s = ds; s <= ROD_SEAT_TO_TIP + 1e-9; s += ds) {
    const a = a0 + K * Math.pow((s - ds / 2) / ROD_SEAT_TO_TIP, 2);
    x += Math.cos(a) * ds; y += Math.sin(a) * ds;
    const at = a0 + K * Math.pow(s / ROD_SEAT_TO_TIP, 2);
    pts.push([x, y, s, Math.cos(at), Math.sin(at)]);
  }
  return pts;
}
/** K para que a ponta desça exatamente `drop` px em relação à vara reta (bissecção). */
function solveK(seat, u, drop) {
  if (drop === 0) return 0;
  const straightY = seat[1] + u[1] * ROD_SEAT_TO_TIP;
  let lo = 0, hi = 2;
  for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2, t = arc(seat, u, mid); (t[t.length - 1][1] - straightY < drop ? (lo = mid) : (hi = mid)); }
  return (lo + hi) / 2;
}

// ------------------------------------------------------------------ montagem de um quadro
const REEL_BODY = REEL.map((r) => r.slice(0, 7));     // carretel da v4 com a haste, sem a manivela fixa

function frameFor(def, L, C) {
  const P = Object.assign({}, COMMON, def.pal);
  const rod = def.rod;
  const c = new Canvas(FRAME, FRAME);
  const lean = L.dx;
  // 1) partes fixas: pernas (com camuflado) e botas, exatamente como na v4
  const legs = new Canvas(64, 64);
  legs.stamp(11, 38, LEGS, P); if (def.camo) camo(legs, P);
  legs.stamp(10, 59, BOOTS, Object.assign({}, P, { S: P.sole }));
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const col = legs.get(x, y); if (col) c.set(x + OX, y + OY, col); }
  // 2) tronco e cabeça (só translação)
  stampAt(c, 9 + lean, 21, def.torso, P);
  stampAt(c, 9 + lean, 4, def.head, P);
  // 3) geometria: vara pela mão de trás e pelo assento; cubo do carretel abaixo do assento; manopla no círculo
  const low = L.low.slice(), seat = L.seat.slice();
  const hub = [seat[0], seat[1] + HUB_BELOW_SEAT];
  const knob = [hub[0] + C.d[0], hub[1] + C.d[1]];
  // 4) braços e mãos
  const arms = new Set();
  const shB = [RIG.shoulderBack[0] + lean, RIG.shoulderBack[1] + 1];
  const shF = [RIG.shoulderFront[0] + lean, RIG.shoulderFront[1] + 1];
  const eB = elbow(shB, low, 8, [-0.4, 1]);
  const eF = elbow(shF, knob, L.segF, [0.6, 1]);
  paintArm(c, [shB, eB, low], P, arms);
  paintArm(c, [shF, eF, knob], P, arms);
  const hl = [low[0] - 1, low[1] - 1], ht = [knob[0] - 1, knob[1] - 1];
  stampAt(c, hl[0], hl[1], HAND_LOW_ROWS, P);
  stampAt(c, ht[0], ht[1], HAND_TOP_ROWS, P);
  c.outline(OUTLINE);

  // 5) vara: cabo reto (fim do cabo → mão de trás → assento) e arco do assento até a ponta
  const dd = [seat[0] - low[0], seat[1] - low[1]], dl = Math.hypot(dd[0], dd[1]);
  const u = [dd[0] / dl, dd[1] / dl];
  const butt = [Math.round(low[0] - u[0] * BUTT_BEHIND_LOW), Math.round(low[1] - u[1] * BUTT_BEHIND_LOW)];
  const K = solveK(seat, u, L.drop);
  const curve = arc(seat, u, K);
  const tipReal = curve[curve.length - 1];
  const tip = [Math.round(tipReal[0]), Math.round(tipReal[1])];
  const straightTip = [seat[0] + u[0] * ROD_SEAT_TO_TIP, seat[1] + u[1] * ROD_SEAT_TO_TIP];
  const pts = [];                                       // {x, y, s (distância desde o fim do cabo), dir}
  const proj = (x, y) => (x - butt[0]) * u[0] + (y - butt[1]) * u[1];
  line4(butt[0], butt[1], seat[0], seat[1], (x, y) => pts.push({ x, y, s: proj(x, y), dir: u }));
  const sSeat = proj(seat[0], seat[1]), sLow = proj(low[0], low[1]);
  let prev = [seat[0], seat[1]];
  for (const q of curve) {
    const r = [Math.round(q[0]), Math.round(q[1])];
    if (r[0] === prev[0] && r[1] === prev[1]) continue;
    let first = true;
    line4(prev[0], prev[1], r[0], r[1], (x, y) => { if (first) { first = false; return; } pts.push({ x, y, s: sSeat + q[2], dir: [q[3], q[4]] }); });
    prev = r;
  }
  const rodPx = new Map();
  let n = 0;
  for (const p of pts) {
    const front = p.s <= sSeat + 0.5;                   // do cabo até o molinete: na frente do corpo
    const grip = p.s <= sLow + 2;
    const thick = p.s <= sSeat + 6;
    const band = rod.band && p.s > sSeat + 2 && (n++ % 5 === 4);
    const col = grip ? rod.grip : band ? rod.band : rod.main;
    const steep = Math.abs(p.dir[1]) > Math.abs(p.dir[0]);
    const put = (x, y, cc) => { const k = (y + OY) * FRAME + x + OX; if (!rodPx.has(k) || front) rodPx.set(k, { col: cc, front }); };
    put(p.x, p.y, col);
    if (thick) { const q = steep ? [p.x + 1, p.y] : [p.x, p.y + 1]; put(q[0], q[1], grip ? rod.gripDark : rod.dark); }
  }
  const tipK = (tip[1] + OY) * FRAME + tip[0] + OX; rodPx.set(tipK, { col: rod.tip, front: false });
  for (const [k, v] of rodPx) {
    const x = k % FRAME, y = Math.floor(k / FRAME);
    if (v.front) c.set(x, y, v.col);
    else if (!c.get(x, y)) c.set(x, y, v.col);
  }
  // 6) molinete: carretel da v4 pendurado sob o assento (haste encostada na vara), como no IDLE
  const reelOrigin = [hub[0] - 3, hub[1] - 4];
  const RP = Object.assign({}, P, { r: rod.reel, u: rod.spool, z: rod.hub, m: rod.crank, k: rod.knob });
  // a haste não pode passar por cima da vara: só a parte do carretel abaixo dela
  REEL_BODY.forEach((row, dy) => [...row].forEach((ch, dx) => {
    if (ch === '.') return;
    const x = reelOrigin[0] + dx + OX, y = reelOrigin[1] + dy + OY, k = y * FRAME + x;
    if (rodPx.has(k) && rodPx.get(k).front) return;
    c.set(x, y, RP[ch]);
  }));
  // 7) manivela: braço do cubo até a manopla (cor da manivela da v4), manopla na ponta
  const crankPx = [];
  line4(hub[0], hub[1], knob[0], knob[1], (x, y, i) => { crankPx.push([x, y]); });
  crankPx.forEach(([x, y], i) => {
    if (i === 0) return;                               // o cubo continua com a cor do cubo
    c.set(x + OX, y + OY, i === crankPx.length - 1 ? rod.knob : rod.crank);
  });
  // 8) mãos por cima de tudo
  stampAt(c, hl[0], hl[1], HAND_LOW_ROWS, P);
  stampAt(c, ht[0], ht[1], HAND_TOP_ROWS, P);

  // curvatura medida: maior distância da vara até a corda assento → ponta
  const ch = [tipReal[0] - seat[0], tipReal[1] - seat[1]], cl = Math.hypot(ch[0], ch[1]);
  const sag = Math.max(...curve.map((q) => Math.abs((q[0] - seat[0]) * ch[1] - (q[1] - seat[1]) * ch[0]) / cl));
  let arcLen = 0; for (let i = 1; i < curve.length; i++) arcLen += Math.hypot(curve[i][0] - curve[i - 1][0], curve[i][1] - curve[i - 1][1]);

  return {
    c, arms, rodPx, pts, butt, tip, low, seat, hub, knob, hl, ht, reelOrigin, lean, crankPx, sag, arcLen,
    dropReal: tipReal[1] - straightTip[1],
    out: {
      nivel: L.nivel, posicaoManivela: C.pos, manivela: C.nome,
      pontaDaVara: [tip[0] + OX, tip[1] + OY], cabo: [butt[0] + OX, butt[1] + OY],
      maoDeTras: [low[0] + OX, low[1] + OY], maoDaFrente: [knob[0] + OX, knob[1] + OY],
      assentoDoMolinete: [seat[0] + OX, seat[1] + OY], cuboDoMolinete: [hub[0] + OX, hub[1] + OY],
      inclinacaoPx: L.dx, anguloCaboGraus: Math.round(Math.atan2(-u[0], -u[1]) * 180 / Math.PI),
      quedaDaPontaPx: +(tipReal[1] - straightTip[1]).toFixed(1), flechaDaVaraPx: +sag.toFixed(1)
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
const readIdleFrame1 = (key) => readSheetFrame(path.join(IDLE_DIR, key + '_idle_spritesheet.png'), 0, 5);

function verify(key, def, grid) {
  const idle = readIdleFrame1(key);
  const v4 = readPNG(path.join(ROOT, 'arte/personagens-base/' + key + '_idle_v4.png'));
  const pal = new Set(); for (let i = 0; i < v4.buf.length; i += 4) if (v4.buf[i + 3]) pal.add(hexOf(v4.buf, i));
  const P = Object.assign({}, COMMON, def.pal);
  const frames = grid.flat();
  frames.forEach((F, k) => {
    const tag = key + ' quadro ' + (k + 1) + ' (nível ' + F.out.nivel + ', manivela ' + F.out.posicaoManivela + '): ';
    const px = F.c.px;
    for (const col of px) if (col && !pal.has(col)) { check(false, tag + 'cor fora da paleta v4 ' + col); break; }
    for (let y = FEET.y0; y <= FEET.y1; y++) for (let x = 0; x < FRAME; x++) if (px[y * FRAME + x] !== idle[y * FRAME + x]) { check(false, tag + 'pés diferentes do IDLE em (' + x + ',' + y + ')'); y = 999; break; }
    px.forEach((col, i) => { if (!col) return; const x = i % FRAME, y = Math.floor(i / FRAME); if (y >= FEET.y0) return; if (x < MIN_MARGIN || y < MIN_MARGIN || x > FRAME - 1 - MIN_MARGIN || y > FRAME - 1 - MIN_MARGIN) check(false, tag + 'pixel perto da borda em (' + x + ',' + y + ')'); });
    // cabeça e rosto: só translação, nada cobrindo
    const occl = (i) => F.arms.has(i) || (F.rodPx.has(i) && F.rodPx.get(i).front);
    let headBad = 0, headCovered = 0;
    def.head.forEach((row, dy) => [...row].forEach((ch, dx) => { if (ch === '.') return; const i = (4 + dy + OY) * FRAME + 9 + F.lean + dx + OX; if (occl(i)) headCovered++; else if (px[i] !== P[ch]) headBad++; }));
    check(headBad === 0, tag + headBad + ' pixels da cabeça alterados');
    check(headCovered === 0, tag + 'braço ou vara cobrindo o rosto (' + headCovered + ' px)');
    // tronco fora das áreas cobertas
    let torsoBad = 0;
    const reelBox = (x, y) => x >= F.reelOrigin[0] + OX && x < F.reelOrigin[0] + OX + 7 && y >= F.reelOrigin[1] + OY && y < F.reelOrigin[1] + OY + 8;
    const handBox = (x, y) => [F.hl, F.ht].some((h) => x >= h[0] + OX && x < h[0] + OX + 3 && y >= h[1] + OY && y < h[1] + OY + 2);
    def.torso.forEach((row, dy) => [...row].forEach((ch, dx) => { if (ch === '.') return; const x = 9 + F.lean + dx + OX, y = 21 + dy + OY, i = y * FRAME + x; if (px[i] !== P[ch] && !occl(i) && !reelBox(x, y) && !handBox(x, y) && !F.rodPx.has(i)) torsoBad++; }));
    check(torsoBad === 0, tag + torsoBad + ' pixels do tronco alterados fora das áreas cobertas');
    // vara sem falhas
    let gaps = 0; for (const p of F.pts) { const i = (p.y + OY) * FRAME + p.x + OX; if (!px[i]) gaps++; }
    check(gaps === 0, tag + 'vara com ' + gaps + ' falhas');
    const visTip = [...F.rodPx.entries()].filter(([i, v]) => !v.front && px[i] === v.col).length;
    check(visTip >= 15, tag + 'trecho da ponta pouco visível (' + visTip + ' px)');
    check(Math.abs(F.arcLen - ROD_SEAT_TO_TIP) < 0.5, tag + 'comprimento da vara do molinete à ponta = ' + F.arcLen.toFixed(2));
    // mão de trás sobre a vara; mão da frente sobre a manopla; manivela ligada ao cubo e à mão
    check(F.pts.some((p) => p.x >= F.hl[0] && p.x < F.hl[0] + 3 && p.y >= F.hl[1] && p.y < F.hl[1] + 2), tag + 'mão de trás não está sobre a vara');
    check(F.knob[0] >= F.ht[0] && F.knob[0] < F.ht[0] + 3 && F.knob[1] >= F.ht[1] && F.knob[1] < F.ht[1] + 2, tag + 'mão da frente não está na manopla');
    const RPcol = { hub: def.rod.hub, crank: def.rod.crank, knob: def.rod.knob };
    const hubI = (F.hub[1] + OY) * FRAME + F.hub[0] + OX;
    check(px[hubI] === RPcol.hub, tag + 'cubo do carretel encoberto');
    let crankOk = true;
    F.crankPx.forEach(([x, y], i) => { if (i === 0) return; const inHand = x >= F.ht[0] && x < F.ht[0] + 3 && y >= F.ht[1] && y < F.ht[1] + 2; const col = px[(y + OY) * FRAME + x + OX]; if (!inHand && col !== RPcol.crank && col !== RPcol.knob) crankOk = false; });
    check(crankOk, tag + 'manivela interrompida entre o cubo e a mão');
    const crankVisible = F.crankPx.slice(1).filter(([x, y]) => !(x >= F.ht[0] && x < F.ht[0] + 3 && y >= F.ht[1] && y < F.ht[1] + 2)).length;
    check(crankVisible >= 1, tag + 'braço da manivela invisível');
    // molinete pendurado na vara: a haste encosta na vara
    const stemTop = [F.reelOrigin[0] + 3 + OX, F.reelOrigin[1] + OY];
    check([[0, -1], [0, 0]].some(([ax, ay]) => F.rodPx.has((stemTop[1] + ay) * FRAME + stemTop[0] + ax)), tag + 'molinete solto da vara');
    // peça única
    const body = new Set(); px.forEach((col, i) => { if (col && !(F.rodPx.has(i) && !F.rodPx.get(i).front && px[i] === F.rodPx.get(i).col)) body.add(i); });
    const start = [...body][0], seen = new Set([start]), q = [start];
    while (q.length) { const i = q.pop(); for (const j of [i - 1, i + 1, i - FRAME, i + FRAME]) if (body.has(j) && !seen.has(j)) { seen.add(j); q.push(j); } }
    check(seen.size === body.size, tag + 'partes desconectadas (' + (body.size - seen.size) + ' px soltos)');
    const behind = [...F.rodPx.entries()].filter(([i, v]) => !v.front && px[i] === v.col).map(([i]) => i);
    const all = new Set([...body, ...behind]), s2 = new Set([start]), q2 = [start];
    while (q2.length) { const i = q2.pop(); for (const j of [i - 1, i + 1, i - FRAME, i + FRAME, i - FRAME - 1, i - FRAME + 1, i + FRAME - 1, i + FRAME + 1]) if (all.has(j) && !s2.has(j)) { s2.add(j); q2.push(j); } }
    check(s2.size === all.size, tag + 'trecho da vara solto do corpo');
  });

  // curvatura progressiva e níveis distintos
  const levelStats = grid.map((row) => ({ drop: row[0].dropReal, sag: row[0].sag, tip: row[0].tip }));
  check(Math.abs(levelStats[0].drop) < 0.01 && levelStats[0].sag < 0.01, key + ': nível 1 deveria ter a vara reta');
  for (let l = 1; l < 4; l++) {
    check(levelStats[l].drop > levelStats[l - 1].drop + 2.5, key + ': queda da ponta não cresce do nível ' + l + ' para o ' + (l + 1));
    check(levelStats[l].sag > levelStats[l - 1].sag + 0.5, key + ': flecha da vara não cresce do nível ' + l + ' para o ' + (l + 1));
  }
  const diffs = [];
  for (let l = 0; l < 4; l++) for (let m = l + 1; m < 4; m++) for (let p = 0; p < 4; p++) {
    const a = grid[l][p].c.px, b = grid[m][p].c.px; let d = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
    diffs.push({ niveis: (l + 1) + '×' + (m + 1), posicao: p + 1, pixels: d });
    check(d >= 40, key + ': níveis ' + (l + 1) + ' e ' + (m + 1) + ' quase iguais na posição ' + (p + 1) + ' (' + d + ' px)');
    check(grid[m][p].tip[1] > grid[l][p].tip[1], key + ': a ponta da vara não fica mais baixa do nível ' + (l + 1) + ' para o ' + (m + 1));
  }
  // manivela: ordem horária, passos pequenos, volta fechada; troca de nível preserva a posição
  const steps = [];
  for (const row of grid) for (let p = 0; p < 4; p++) {
    const a = row[p], b = row[(p + 1) % 4];
    const ang = (f) => Math.atan2(f.knob[1] - f.hub[1], f.knob[0] - f.hub[0]);
    let da = ang(b) - ang(a); while (da <= 0) da += 2 * Math.PI;
    check(Math.abs(da - Math.PI / 2) < 1e-6, key + ': manivela fora de ordem no nível ' + a.out.nivel);
    const dh = Math.hypot(a.knob[0] - b.knob[0], a.knob[1] - b.knob[1]);
    const dl = Math.hypot(a.low[0] - b.low[0], a.low[1] - b.low[1]);
    check(dh <= 6, key + ': mão da manivela salta ' + dh.toFixed(1) + ' px');
    check(dl === 0, key + ': mão do cabo se move durante a volta da manivela');
    if (p === 0) steps.push({ tipo: 'manivela', nivel: a.out.nivel, maoDaFrentePx: +dh.toFixed(1) });
  }
  for (let l = 0; l < 3; l++) for (let p = 0; p < 4; p++) {
    const a = grid[l][p], b = grid[l + 1][p];
    const dk = Math.hypot(a.knob[0] - b.knob[0], a.knob[1] - b.knob[1]), dl = Math.hypot(a.low[0] - b.low[0], a.low[1] - b.low[1]);
    check(Math.max(dk, dl) <= 3, key + ': troca de nível ' + (l + 1) + '→' + (l + 2) + ' (posição ' + (p + 1) + ') move a mão ' + Math.max(dk, dl).toFixed(1) + ' px');
    if (p === 0) steps.push({ tipo: 'nivel', de: l + 1, para: l + 2, maosPx: +Math.max(dk, dl).toFixed(1), pontaPx: +Math.hypot(a.tip[0] - b.tip[0], a.tip[1] - b.tip[1]).toFixed(1) });
  }
  // fisgada: do IDLE (espera) para o nível 3, posição 1
  const idleLow = [RIG.handLow[0] + 1, RIG.handLow[1] + 1], idleTop = [RIG.handTop[0] + 1, RIG.handTop[1] + 1];
  const f9 = grid[FISGADA.nivel - 1][FISGADA.posicao - 1];
  const dFis = Math.max(Math.hypot(f9.low[0] - idleLow[0], f9.low[1] - idleLow[1]), Math.hypot(f9.knob[0] - idleTop[0], f9.knob[1] - idleTop[1]));
  check(dFis <= 4, key + ': mãos saltam ' + dFis.toFixed(1) + ' px do IDLE para a fisgada');
  steps.push({ tipo: 'fisgada', de: 'IDLE', para: 'nível 3 posição 1', maosPx: +dFis.toFixed(1) });
  // volta ao IDLE (ex.: linha arrebentou / peixe escapou): do nível 1, qualquer posição
  const backIdle = Math.max(...grid[0].map((f) => Math.max(Math.hypot(f.low[0] - idleLow[0], f.low[1] - idleLow[1]), Math.hypot(f.knob[0] - idleTop[0], f.knob[1] - idleTop[1]))));
  steps.push({ tipo: 'nivel1→IDLE (pior posição)', maosPx: +backIdle.toFixed(1) });
  return { steps, diffs, levelStats };
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

// ------------------------------------------------------------------ geração e verificação
const CHARS = { alemao: V4.ALEMAO, ale: V4.ALE };
const built = {}, report = {};
for (const [key, def] of Object.entries(CHARS)) {
  built[key] = LEVELS.map((L) => CRANK.map((C) => frameFor(def, L, C)));
  report[key] = verify(key, def, built[key]);
}
if (problems.length) { console.error('FALHOU:\n  ' + problems.join('\n  ')); process.exit(1); }

// ------------------------------------------------------------------ saída
const BG = [0x4f, 0x7a, 0x94];
// Indicador de nível só nas prévias (não faz parte do sprite): 4 blocos no alto, acesos até o nível atual.
const LEVEL_COLORS = ['#8fa3b0', '#5fb35a', '#f2c230', '#d22a2f'];
const OFF_COLOR = '#2e4656';
function rgba(mats, s, bg, layout, levels) {
  const cols = layout ? layout[0] : mats.length, rows = layout ? layout[1] : 1;
  const w = FRAME * cols * s, h = FRAME * rows * s, buf = Buffer.alloc(w * h * 4);
  const setPx = (o, hex) => { buf[o] = parseInt(hex.slice(1, 3), 16); buf[o + 1] = parseInt(hex.slice(3, 5), 16); buf[o + 2] = parseInt(hex.slice(5, 7), 16); buf[o + 3] = 255; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const fx = Math.floor(x / (FRAME * s)), fy = Math.floor(y / (FRAME * s)), k = fy * cols + fx;
    const lx = Math.floor((x % (FRAME * s)) / s), ly = Math.floor((y % (FRAME * s)) / s), o = (y * w + x) * 4;
    let col = mats[k] ? mats[k][ly * FRAME + lx] : null;
    if (levels && levels[k] != null && ly >= 3 && ly < 7 && lx >= 3 && lx < 3 + 4 * 6 && (lx - 3) % 6 < 5) {
      const b = Math.floor((lx - 3) / 6); col = b < levels[k] ? LEVEL_COLORS[b] : OFF_COLOR;
    }
    if (col) setPx(o, col);
    else if (bg) { buf[o] = bg[0]; buf[o + 1] = bg[1]; buf[o + 2] = bg[2]; buf[o + 3] = 255; }
  }
  return { w, h, buf };
}
fs.mkdirSync(path.join(OUT, 'previews'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'quadros'), { recursive: true });
const idleMat = {};
for (const [key, grid] of Object.entries(built)) {
  const mats = grid.flat().map((f) => f.c.px);
  const sheet = rgba(mats, 1, null, [4, 4]); writePNG(path.join(OUT, key + '_reel_fight_spritesheet.png'), sheet.w, sheet.h, sheet.buf);
  mats.forEach((m, i) => { const one = rgba([m], 1, null); writePNG(path.join(OUT, 'quadros', key + '_reel_fight_' + String(i + 1).padStart(2, '0') + '.png'), one.w, one.h, one.buf); });
  const big = rgba(mats, 4, BG, [4, 4], mats.map((_, i) => Math.floor(i / 4) + 1)); writePNG(path.join(OUT, 'previews', key + '_reel_fight_quadros_x4.png'), big.w, big.h, big.buf);
  idleMat[key] = readIdleFrame1(key);
}
// Comparação dos 4 níveis lado a lado (posição 1 da manivela), os dois personagens
{
  const mats = [], lv = [];
  for (const key of Object.keys(built)) for (let l = 0; l < 4; l++) { mats.push(built[key][l][0].c.px); lv.push(l + 1); }
  const img = rgba(mats, 4, BG, [4, 2], lv); writePNG(path.join(OUT, 'previews', 'ambos_reel_fight_niveis_x4.png'), img.w, img.h, img.buf);
}

// Prévia 1 — "níveis": nível 1 → 2 → 3 → 4, duas voltas de manivela em cada um (comparação direta).
// Prévia 2 — "briga": como no jogo: IDLE → fisgada (100 ms) → a tensão sobe e desce entre os níveis,
//   com a posição da manivela preservada a cada troca; uma pausa (soltando: manivela parada) → IDLE.
const turn = (lv, n) => { const out = []; for (let t = 0; t < n; t++) for (let p = 0; p < 4; p++) out.push({ l: lv, p, ms: CRANK_MS }); return out; };
const seqNiveis = () => [...turn(1, 2), ...turn(2, 2), ...turn(3, 2), ...turn(4, 2)];
function seqBriga() {
  const s = [{ idle: true, ms: 700 }, { l: FISGADA.nivel, p: FISGADA.posicao - 1, ms: FISGADA.ms }];
  let p = 0;
  const go = (lv, steps) => { for (let i = 0; i < steps; i++) { s.push({ l: lv, p, ms: CRANK_MS }); p = (p + 1) % 4; } };
  go(2, 8); go(3, 6); go(4, 9); go(3, 3);
  s.push({ l: 2, p: (p + 3) % 4, ms: 300 });          // soltou: manivela parada, tensão caindo
  s.push({ l: 1, p: (p + 3) % 4, ms: 300 });
  go(1, 8);                                          // recolhendo com a linha frouxa
  s.push({ idle: true, ms: 700 });
  return s;
}
function previewGif(keys, seq) {
  const S = 4, colorIdx = new Map([[BG.join(','), 0]]), palette = [BG], out = [];
  for (const step of seq) {
    const mats = keys.map((k) => step.idle ? idleMat[k] : built[k][step.l - 1][step.p].c.px);
    const img = rgba(mats, S, BG, null, keys.map(() => step.idle ? 0 : step.l));
    const idx = new Uint8Array(img.w * img.h);
    for (let p = 0; p < img.w * img.h; p++) { const key = img.buf[p * 4] + ',' + img.buf[p * 4 + 1] + ',' + img.buf[p * 4 + 2]; if (!colorIdx.has(key)) { colorIdx.set(key, palette.length); palette.push([img.buf[p * 4], img.buf[p * 4 + 1], img.buf[p * 4 + 2]]); } idx[p] = colorIdx.get(key); }
    const last = out[out.length - 1];
    if (last && Buffer.compare(Buffer.from(last.idx), Buffer.from(idx)) === 0) { last.ms += step.ms; continue; }
    out.push({ idx, ms: step.ms, w: img.w, h: img.h });
  }
  if (palette.length > 256) throw new Error('paleta do GIF > 256');
  return gif(out[0].w, out[0].h, out, palette);
}
for (const [name, keys] of [['alemao', ['alemao']], ['ale', ['ale']], ['ambos', ['alemao', 'ale']]]) {
  fs.writeFileSync(path.join(OUT, 'previews', name + '_reel_fight_niveis_x4.gif'), previewGif(keys, seqNiveis()));
  fs.writeFileSync(path.join(OUT, 'previews', name + '_reel_fight_briga_x4.gif'), previewGif(keys, seqBriga()));
}

const data = {
  animacao: 'reel_fight',
  quadro: { largura: FRAME, altura: FRAME },
  spritesheet: {
    arquivo: '<personagem>_reel_fight_spritesheet.png', largura: FRAME * 4, altura: FRAME * 4, colunas: 4, linhas: 4,
    organizacao: 'cada linha é um nível de tensão (1 a 4, de cima para baixo); cada coluna é uma posição da manivela (1 cima, 2 frente, 3 baixo, 4 trás)',
    indice: 'indice (0–15) = (nivel − 1) × 4 + (posicao − 1); quadro (1–16) = indice + 1'
  },
  ancora: { phaserOrigin: [0.5, 1], deslocamentoV4: [OX, OY], solaY: SOLE_Y, pes: FEET, centroPesX: 47.5 },
  niveis: LEVELS.map((L, i) => ({
    nivel: L.nivel, nome: L.nome, zonaDeTensaoP1: L.zona, quadros: [i * 4 + 1, i * 4 + 4], indices: [i * 4, i * 4 + 3],
    quedaDaPontaPx: L.drop, inclinacaoTroncoPx: L.dx
  })),
  selecaoDoNivel: {
    fonte: 'zona de tensão do P1 (config.js: slackMax 0,20 · alertMin 0,65 · criticalMin 0,85)',
    regra: 'tensão < 0,20 ou linha vazia (REELING_EMPTY) → 1 · 0,20 a < 0,65 → 2 · 0,65 a < 0,85 → 3 · ≥ 0,85 → 4',
    automatico: false,
    trocaDeNivel: 'imediata, no quadro seguinte, preservando a posição da manivela (ex.: nível 2 posição 3 = quadro 7 → nível 3 posição 3 = quadro 11)'
  },
  manivela: {
    posicoes: CRANK.map((C) => ({ posicao: C.pos, nome: C.nome })),
    msPorPosicao: CRANK_MS, msPorVolta: CRANK_MS * 4,
    segurando: 'loop das 4 posições do nível atual (1 → 2 → 3 → 4 → 1 …)',
    soltando: 'em FIGHTING: a manivela para na posição atual; o nível continua acompanhando a tensão (no recolhimento vazio vale a regra completarAVolta)'
  },
  // Regra "completar a volta" — APROVADA pela direção criativa (11/11/2026). Só para REELING_EMPTY.
  completarAVolta: {
    status: 'APROVADO — DIREÇÃO CRIATIVA (11/11/2026)',
    aplicaSe: 'somente ao recolhimento da linha vazia (REELING_EMPTY, nível 1, índices 0–3); não vale para FIGHTING',
    entrada: 'ao começar o recolhimento vazio a partir do IDLE, a animação sempre começa na posição 1 (índice 0)',
    saidas: [
      'conclusão: REELING_EMPTY → IDLE (linha recolhida)',
      'soltura antecipada: REELING_EMPTY → WAITING (recolhimento interrompido; o P1 retoma a espera de onde parou)'
    ],
    finalizacao: 'nas duas saídas, a manivela continua girando no nível 1 (' + CRANK_MS + ' ms por posição) até mostrar a posição 1; no quadro seguinte o personagem volta ao IDLE. Se a saída acontecer já na posição 1, o IDLE é imediato',
    duracaoMaximaMs: CRANK_MS * 3,
    duracaoMediaMs: CRANK_MS * 1.5,
    retomada: 'se a lógica voltar a REELING_EMPTY durante a finalização (o jogador segurou de novo além do limiar do P1), o loop continua da posição atual, sem voltar à posição 1 e sem salto',
    toqueCurto: 'um toque curto durante a finalização não muda nada no visual: a lógica continua em WAITING e a volta termina normalmente',
    somenteVisual: 'a finalização é só visual: lê o estado do P1 e nunca o altera; não reinicia nem pausa a espera, não emite eventos, não conta toques e não gera penalidades. O tempo da finalização é tempo de jogo (congela na pausa)',
    prioridadeDaLogica: 'se a lógica pedir outra animação durante a finalização (fisgada em FIGHTING, carga em CHARGING), a troca é imediata: a finalização é abandonada e nunca atrasa a resposta. BITE mostra o IDLE (plano, seção 4), então uma mordida durante a finalização não a interrompe',
    saltoDasMaos: 'saída pela posição 1 → IDLE: 2 px (antes da regra: até 10 px). Casos de prioridade da lógica (raros): fisgada a partir das posições 3 / 4: 10 / 6,7 px; carga a partir da posição 4: 13,6 px'
  },
  fisgada: {
    quando: 'transição BITE → FIGHTING do P1',
    nivel: FISGADA.nivel, posicaoManivela: FISGADA.posicao, quadro: FISGADA.indice + 1, indice: FISGADA.indice, ms: FISGADA.ms,
    depois: 'entra no nível indicado pela tensão, a partir da posição 1 da manivela (ou da posição 2, se o jogador já estiver segurando)',
    observacao: 'não é uma animação separada: é o quadro 9 (nível 3, curva média) mostrado por ~100 ms'
  },
  phaser: {
    carregar: "this.load.spritesheet('<personagem>_reel_fight', '<personagem>_reel_fight_spritesheet.png', { frameWidth: 96, frameHeight: 96 })",
    recomendacao: 'quatro animações em loop (uma por nível, frames [n*4 .. n*4+3], 90 ms cada) ou escolha manual do frame pelo código; ao trocar de nível, manter a posição da manivela (índice % 4)'
  },
  pontos: Object.fromEntries(Object.entries(built).map(([k, grid]) => [k, grid.flat().map((f, i) => Object.assign({ indice: i, quadro: i + 1 }, f.out))]))
};
fs.writeFileSync(path.join(OUT, 'reel_fight.json'), JSON.stringify(data, null, 2) + '\n');

console.log('OK — todas as verificações passaram');
for (const [k, grid] of Object.entries(built)) {
  console.log('  ' + k + ':');
  grid.forEach((row, l) => console.log('    nível ' + (l + 1) + ': ponta ' + JSON.stringify(row[0].out.pontaDaVara) + ' · queda ' + row[0].out.quedaDaPontaPx + ' px · flecha ' + row[0].out.flechaDaVaraPx + ' px · ângulo do cabo ' + row[0].out.anguloCaboGraus + '° · mão de trás ' + JSON.stringify(row[0].out.maoDeTras) + ' · manopla ' + JSON.stringify(row.map((f) => f.out.maoDaFrente))));
  console.log('    transições: ' + report[k].steps.map((s) => JSON.stringify(s)).join(' '));
  const dmin = Math.min(...report[k].diffs.map((d) => d.pixels));
  console.log('    menor diferença entre níveis (mesma posição da manivela): ' + dmin + ' px · ' + report[k].diffs.filter((d) => d.posicao === 1).map((d) => d.niveis + ':' + d.pixels).join(' '));
}
