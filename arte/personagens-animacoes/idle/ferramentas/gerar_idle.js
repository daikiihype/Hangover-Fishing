/*
 * Hangover Fishing — Animação IDLE (Alemão e ALE)
 *
 * Uso (na pasta do projeto):   node arte/personagens-animacoes/idle/ferramentas/gerar_idle.js
 *
 * Plano: docs/PLANO_ANIMACOES_PERSONAGENS.md (v1.1), seções 3.2 e 5.1.
 *
 * Fonte das peças: o gerador APROVADO da v4
 *   arte/personagens-base/ferramentas/gerar_personagens_base_v4.js
 * é lido em memória, SOMENTE LEITURA (o arquivo não é alterado), apenas para expor as peças
 * já existentes (pernas, botas, tronco, cabeça, braços, mãos, molinete, vara, paletas).
 * Nada é redesenhado: os quadros recompõem as mesmas peças com pequenos deslocamentos.
 * O quadro 1 precisa ser IDÊNTICO, pixel a pixel, aos PNGs aprovados (senão o gerador falha).
 *
 * Saída (pasta própria; nada anterior é sobrescrito):
 *   arte/personagens-animacoes/idle/alemao_idle_spritesheet.png    (480 × 96: 5 quadros de 96 × 96)
 *   arte/personagens-animacoes/idle/ale_idle_spritesheet.png
 *   arte/personagens-animacoes/idle/idle.json                      (quadros, tempos, âncora, piscar)
 *   arte/personagens-animacoes/idle/previews/*                     (ampliações e GIFs)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const Module = require('module');

const ROOT = path.join(__dirname, '..', '..', '..', '..');
const OUT = path.join(__dirname, '..');
const V4_GEN = path.join(ROOT, 'arte', 'personagens-base', 'ferramentas', 'gerar_personagens_base_v4.js');
const V4_PNG = { alemao: path.join(ROOT, 'arte', 'personagens-base', 'alemao_idle_v4.png'), ale: path.join(ROOT, 'arte', 'personagens-base', 'ale_idle_v4.png') };

// ------------------------------------------------------------------ peças da v4 (leitura)
function loadV4() {
  const src = fs.readFileSync(V4_GEN, 'utf8');
  const EXPORT = 'module.exports = { build, RIG, ALEMAO, ALE, readPNG, W, H };';
  if (!src.includes(EXPORT)) throw new Error('gerador v4 diferente do esperado: não encontrei a linha de exportação');
  const patched = src.replace(EXPORT, 'module.exports = { build, RIG, ALEMAO, ALE, readPNG, writePNG, W, H, Canvas, line4, OUTLINE, COMMON, LEGS, BOOTS, ARM_BACK_IDLE, ARM_FRONT_IDLE, HAND_LOW_ROWS, HAND_TOP_ROWS, REEL, camo };');
  const m = new Module(V4_GEN, module);
  m.filename = V4_GEN;
  m.paths = Module._nodeModulePaths(path.dirname(V4_GEN));
  m._compile(patched, V4_GEN);   // require.main !== m: o bloco de saída da v4 NÃO roda
  return m.exports;
}
const V4 = loadV4();
const { Canvas, line4, OUTLINE, COMMON, LEGS, BOOTS, ARM_BACK_IDLE, ARM_FRONT_IDLE, HAND_LOW_ROWS, HAND_TOP_ROWS, REEL, RIG, camo, readPNG, writePNG } = V4;

// ------------------------------------------------------------------ especificação do IDLE
const FRAME = 96;
const OFFSET = { x: 30, y: 32 };              // posição da v4 dentro do quadro (seção 3.2 do plano)
const SOLE_Y = 94;                            // linha da sola no quadro 96 × 96
const FEET = { x0: 39, x1: 56, y0: 91, y1: 95 }; // pés (botas + contorno)
const FRAMES = [
  { id: 1, nome: 'base',     ms: 700, up: 0, tipDy: 0 },  // a v4 exatamente
  { id: 2, nome: 'expirar',  ms: 500, up: 1, tipDy: 0 },  // tronco, cabeça, braços, mãos e equipamento descem 1 px
  { id: 3, nome: 'base',     ms: 700, up: 0, tipDy: 0 },  // igual ao 1
  { id: 4, nome: 'ponta',    ms: 500, up: 0, tipDy: -1 }  // ponta da vara sobe 1 px (vara gira em torno das mãos)
];
const BLINK = { ms: 100, offsetInFrameMs: 300, intervalMs: [3000, 6000], frames: [1, 3] };
const FLEX_X = 36;   // (coordenada da v4) a partir daqui a vara flexiona no quadro 4; antes disso fica idêntica

// ------------------------------------------------------------------ montagem de uma pose (64 × 64)
// Mesma sequência do build() da v4; 'up' desloca a parte superior, 'tipDy' move só a ponta da vara.
function pose(def, up, tipDy) {
  const c = new Canvas(64, 64);
  const P = Object.assign({}, COMMON, def.pal);
  c.stamp(11, 38, LEGS, P);                                    // fixas: nunca se movem
  if (def.camo) camo(c, P);
  c.stamp(10, 59, BOOTS, Object.assign({}, P, { S: P.sole }));
  c.stamp(9, 21 + up, def.torso, P);                           // deslocáveis
  c.stamp(RIG.shoulderBack[0] - 1, RIG.shoulderBack[1] + up, ARM_BACK_IDLE, P);
  c.stamp(9, 4 + up, def.head, P);
  c.stamp(RIG.shoulderFront[0] - 1, RIG.shoulderFront[1] + up, ARM_FRONT_IDLE, P);
  c.stamp(RIG.handLow[0], RIG.handLow[1] + up, HAND_LOW_ROWS, P);
  c.stamp(RIG.handTop[0], RIG.handTop[1] + up, HAND_TOP_ROWS, P);
  c.outline(OUTLINE);
  const rod = def.rod;
  c.stamp(RIG.reel[0], RIG.reel[1] + up, REEL, Object.assign({}, P, { r: rod.reel, u: rod.spool, z: rod.hub, m: rod.crank, k: rod.knob }));
  const butt = [RIG.rodButt[0], RIG.rodButt[1] + up], baseTip = [RIG.rodTip[0], RIG.rodTip[1] + up];
  const tip = [baseTip[0], baseTip[1] + tipDy];
  let n = 0;
  const paint = (x, y) => {
    const grip = x <= RIG.handLow[0] + 3;
    const thick = x <= RIG.rodSeat[0] + 6;
    const band = rod.band && x > RIG.rodSeat[0] + 2 && (n++ % 5 === 4);
    c.set(x, y, grip ? rod.grip : band ? rod.band : rod.main);
    if (thick) c.set(x, y + 1, grip ? rod.gripDark : rod.dark);
  };
  if (!tipDy) {
    line4(butt[0], butt[1], baseTip[0], baseTip[1], paint);                 // vara exatamente como na v4
  } else {
    // Flexão só na metade da ponta: até FLEX_X a vara é idêntica à v4; dali até a ponta, novo traço.
    let pivot = null;
    line4(butt[0], butt[1], baseTip[0], baseTip[1], (x, y) => { if (x <= FLEX_X) { paint(x, y); if (x === FLEX_X) pivot = [x, y]; } });
    let first = true;
    line4(pivot[0], pivot[1], tip[0], tip[1], (x, y) => { if (first) { first = false; return; } paint(x, y); });
  }
  c.set(tip[0], tip[1], rod.tip);
  c.stamp(RIG.handLow[0], RIG.handLow[1] + up, HAND_LOW_ROWS, P);
  c.stamp(RIG.handTop[0], RIG.handTop[1] + up, HAND_TOP_ROWS, P);
  c.tip = tip;
  return c;
}

/** Pixels dos olhos (caracteres 'w' e 'e' da cabeça), nas coordenadas da v4. */
function eyePixels(def) {
  const px = [];
  def.head.forEach((row, dy) => [...row].forEach((ch, dx) => { if (ch === 'w' || ch === 'e') px.push([9 + dx, 4 + dy]); }));
  return px;
}

/** Quadro 96 × 96 como matriz de cores ('#rrggbb' ou null). */
function toFrame(c) {
  const f = new Array(FRAME * FRAME).fill(null);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    const col = c.get(x, y); if (col) f[(y + OFFSET.y) * FRAME + x + OFFSET.x] = col;
  }
  return f;
}
const hexOf = (buf, i) => '#' + [0, 1, 2].map((k) => buf[i + k].toString(16).padStart(2, '0')).join('');
function rgbaOf(frames) {   // várias matrizes lado a lado → RGBA
  const w = FRAME * frames.length, buf = Buffer.alloc(w * FRAME * 4);
  frames.forEach((f, k) => f.forEach((col, i) => {
    if (!col) return; const x = (i % FRAME) + k * FRAME, y = Math.floor(i / FRAME), o = (y * w + x) * 4;
    buf[o] = parseInt(col.slice(1, 3), 16); buf[o + 1] = parseInt(col.slice(3, 5), 16); buf[o + 2] = parseInt(col.slice(5, 7), 16); buf[o + 3] = 255;
  }));
  return { w, h: FRAME, buf };
}
function scale(img, s, bg) {
  const w = img.w * s, h = img.h * s, buf = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (Math.floor(y / s) * img.w + Math.floor(x / s)) * 4, o = (y * w + x) * 4;
    if (img.buf[i + 3]) img.buf.copy(buf, o, i, i + 4);
    else if (bg) { buf[o] = bg[0]; buf[o + 1] = bg[1]; buf[o + 2] = bg[2]; buf[o + 3] = 255; }
  }
  return { w, h, buf };
}

// ------------------------------------------------------------------ verificações
const problems = [];
function check(ok, msg) { if (!ok) problems.push(msg); }

function buildCharacter(key, def) {
  const frames = FRAMES.map((fr) => { const c = pose(def, fr.up, fr.tipDy); return { spec: fr, mat: toFrame(c), tip: [c.tip[0] + OFFSET.x, c.tip[1] + OFFSET.y] }; });
  // quadro de piscar: quadro 1 com os pixels dos olhos no tom de sombra da pele
  const eyes = eyePixels(def).map(([x, y]) => [x + OFFSET.x, y + OFFSET.y]);
  const blink = frames[0].mat.slice();
  for (const [x, y] of eyes) blink[y * FRAME + x] = def.pal.S;

  // 1) quadro 1 idêntico à v4 aprovada (deslocada +30, +32)
  const v4 = readPNG(V4_PNG[key]);
  let diff1 = 0;
  for (let y = 0; y < FRAME; y++) for (let x = 0; x < FRAME; x++) {
    const sx = x - OFFSET.x, sy = y - OFFSET.y;
    const exp = sx >= 0 && sy >= 0 && sx < 64 && sy < 64 && v4.buf[(sy * 64 + sx) * 4 + 3] ? hexOf(v4.buf, (sy * 64 + sx) * 4) : null;
    if (exp !== frames[0].mat[y * FRAME + x]) diff1++;
  }
  check(diff1 === 0, key + ': quadro 1 difere da v4 aprovada em ' + diff1 + ' pixels');
  // 2) quadro 3 = quadro 1
  check(frames[2].mat.every((c, i) => c === frames[0].mat[i]), key + ': quadro 3 ≠ quadro 1');
  // 3) paleta fechada: só cores da v4
  const v4cols = new Set(); for (let i = 0; i < v4.buf.length; i += 4) if (v4.buf[i + 3]) v4cols.add(hexOf(v4.buf, i));
  for (const m of [...frames.map((f) => f.mat), blink]) for (const c of m) if (c && !v4cols.has(c)) { check(false, key + ': cor fora da paleta v4 ' + c); break; }
  // 4) pés e sola idênticos em todos os quadros; sola em y = 94; pés centrados em 47,5
  for (const m of [...frames.map((f) => f.mat), blink]) for (let y = FEET.y0; y <= FEET.y1; y++) for (let x = 0; x < FRAME; x++) {
    if (m[y * FRAME + x] !== frames[0].mat[y * FRAME + x]) { check(false, key + ': pés diferentes entre quadros em (' + x + ',' + y + ')'); y = 999; break; }
  }
  const soleCols = []; for (let x = 0; x < FRAME; x++) if (frames[0].mat[SOLE_Y * FRAME + x] === def.pal.sole) soleCols.push(x);
  check(soleCols[0] === 40 && soleCols[soleCols.length - 1] === 55, key + ': sola fora de x 40–55 em y = 94');
  let fx0 = 99, fx1 = -1; for (let y = FEET.y0; y <= FEET.y1; y++) for (let x = 0; x < FRAME; x++) if (frames[0].mat[y * FRAME + x]) { fx0 = Math.min(fx0, x); fx1 = Math.max(fx1, x); }
  check(fx0 === FEET.x0 && fx1 === FEET.x1 && (fx0 + fx1) / 2 === 47.5, key + ': pés fora de x 39–56 (centro 47,5): ' + fx0 + '–' + fx1);
  let bottomRow = false; for (let x = 0; x < FRAME; x++) if (frames[0].mat[95 * FRAME + x]) bottomRow = true;
  check(bottomRow, key + ': contorno dos pés não está na última linha (âncora)');
  // 5) quadro 2 = quadro 1 com a parte superior 1 px abaixo; pernas (y ≥ 71) iguais
  let bad2 = 0;
  for (let y = OFFSET.y; y <= OFFSET.y + 36; y++) for (let x = 0; x < FRAME; x++) {
    const a = frames[0].mat[y * FRAME + x]; if (!a) continue;
    if (frames[1].mat[(y + 1) * FRAME + x] !== a) bad2++;
  }
  check(bad2 === 0, key + ': quadro 2 não é a parte superior do quadro 1 deslocada 1 px (' + bad2 + ' pixels)');
  // 6) cabeça e tronco preservados (por translação) também no quadro 4: só a vara muda
  const rodCols = new Set(Object.values(def.rod).filter(Boolean));
  // Regra: um pixel só pode mudar se for da vara antes OU depois (a vara cobre ou descobre o que está atrás).
  const bad4 = [];
  frames[3].mat.forEach((c, i) => {
    const a = frames[0].mat[i];
    if (c !== a && !((c && rodCols.has(c)) || (a && rodCols.has(a)))) bad4.push([i % FRAME, Math.floor(i / FRAME), a, c]);
  });
  const changed4 = frames[3].mat.reduce((n, c, i) => n + (c !== frames[0].mat[i] ? 1 : 0), 0);
  check(bad4.length === 0, key + ': quadro 4 muda algo além da vara: ' + JSON.stringify(bad4));
  // 7) piscar: só os pixels dos olhos mudam
  const changedBlink = blink.reduce((n, c, i) => n + (c !== frames[0].mat[i] ? 1 : 0), 0);
  check(changedBlink === eyes.length && eyes.every(([x, y]) => blink[y * FRAME + x] !== frames[0].mat[y * FRAME + x]), key + ': piscar muda pixels além dos olhos');
  // 8) margem: tudo ≥ 3 px das bordas, exceto os pés (que tocam a base)
  for (const m of [...frames.map((f) => f.mat), blink]) m.forEach((c, i) => {
    if (!c) return; const x = i % FRAME, y = Math.floor(i / FRAME);
    if (y >= FEET.y0) return;
    if (x < 3 || y < 3 || x > FRAME - 4 || y > FRAME - 4) check(false, key + ': pixel a menos de 3 px da borda em (' + x + ',' + y + ')');
  });
  // 9) continuidade do loop: entre quadros vizinhos (incluindo 4 → 1) só há deslocamentos de 1 px
  const tips = frames.map((f) => f.tip);
  for (let k = 0; k < 4; k++) {
    const a = tips[k], b = tips[(k + 1) % 4];
    check(Math.abs(a[0] - b[0]) <= 1 && Math.abs(a[1] - b[1]) <= 1, key + ': ponta da vara salta mais de 1 px entre os quadros ' + (k + 1) + ' e ' + ((k + 1) % 4 + 1));
  }
  return { frames, blink, eyes, changed4, changedBlink, colors: v4cols.size };
}

// ------------------------------------------------------------------ piscar: agenda independente
function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = Math.imul(s ^ (s >>> 15), s | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const CYCLE = FRAMES.reduce((a, f) => a + f.ms, 0);
const FRAME_START = FRAMES.reduce((acc, f, i) => { acc.push(i ? acc[i - 1] + FRAMES[i - 1].ms : 0); return acc; }, []);
/** Instantes de piscar (ms) num período, seguindo a regra do plano. */
function blinkSchedule(seed, totalMs) {
  const r = rng(seed), out = [];
  let due = BLINK.intervalMs[0] + r() * (BLINK.intervalMs[1] - BLINK.intervalMs[0]);
  for (;;) {
    // próximo quadro 1 ou 3 cujo "meio" (início + 300 ms) já passou do instante sorteado
    let t = null;
    for (let c = Math.floor(due / CYCLE) * CYCLE; t === null; c += CYCLE) {
      for (const fid of BLINK.frames) { const s = c + FRAME_START[fid - 1] + BLINK.offsetInFrameMs; if (s >= due) { t = s; break; } }
    }
    if (t + BLINK.ms > totalMs) break;
    out.push(Math.round(t));
    due = t + BLINK.intervalMs[0] + r() * (BLINK.intervalMs[1] - BLINK.intervalMs[0]);
  }
  return out;
}
function frameAt(t, blinks) {
  for (const b of blinks) if (t >= b && t < b + BLINK.ms) return 'P';
  const m = t % CYCLE; let k = 0; while (k < 3 && m >= FRAME_START[k + 1]) k++;
  return k;
}

// ------------------------------------------------------------------ GIF (codificador mínimo, sem dependências)
function gif(w, h, frames, palette) {
  let bits = 1; while ((1 << bits) < palette.length) bits++;
  const size = 1 << bits, parts = [];
  const u16 = (n) => Buffer.from([n & 255, (n >> 8) & 255]);
  parts.push(Buffer.from('GIF89a'), u16(w), u16(h), Buffer.from([0x80 | 0x70 | (bits - 1), 0, 0]));
  const pal = Buffer.alloc(size * 3); palette.forEach((c, i) => { pal[i * 3] = c[0]; pal[i * 3 + 1] = c[1]; pal[i * 3 + 2] = c[2]; }); parts.push(pal);
  parts.push(Buffer.from([0x21, 0xff, 0x0b]), Buffer.from('NETSCAPE2.0'), Buffer.from([3, 1, 0, 0, 0]));
  const minCode = Math.max(2, bits);
  for (const f of frames) {
    parts.push(Buffer.from([0x21, 0xf9, 4, 0]), u16(Math.round(f.ms / 10)), Buffer.from([0, 0]));
    parts.push(Buffer.from([0x2c]), u16(0), u16(0), u16(w), u16(h), Buffer.from([0]));
    parts.push(Buffer.from([minCode]), lzw(f.idx, minCode), Buffer.from([0]));
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
    const k = idx[i], key = prefix * 256 + k;
    const hit = dict.get(key);
    if (hit !== undefined) { prefix = hit; continue; }
    emit(prefix);
    if (next === 4096) { emit(clear); dict = new Map(); size = minCode + 1; next = eoi + 1; }
    else { if (next >= (1 << size)) size++; dict.set(key, next++); }
    prefix = k;
  }
  emit(prefix); emit(eoi);
  if (nbits > 0) out.push(acc & 255);
  const blocks = []; for (let i = 0; i < out.length; i += 255) { const b = out.slice(i, i + 255); blocks.push(Buffer.from([b.length]), Buffer.from(b)); }
  return Buffer.concat(blocks);
}

// ------------------------------------------------------------------ saída
const CHARS = { alemao: V4.ALEMAO, ale: V4.ALE };
const SEEDS = { alemao: 11, ale: 29 };               // sementes diferentes: piscares independentes
// Na prévia conjunta, o ciclo do ALE começa 950 ms "depois" (no jogo cada um entra no IDLE em
// momentos diferentes). Cada agenda de piscar é calculada no tempo do próprio personagem.
const PHASE = { alemao: 0, ale: 950 };
const built = {};
for (const [key, def] of Object.entries(CHARS)) built[key] = buildCharacter(key, def);

// agenda de piscar: 60 s simulados para cada personagem
const SIM_MS = 60000, schedules = {};
for (const key of Object.keys(CHARS)) {
  const s = blinkSchedule(SEEDS[key], SIM_MS); schedules[key] = s;
  for (let i = 0; i < s.length; i++) {
    const inFrame = frameAt(s[i] + 1, []);       // quadro do ciclo no momento do piscar
    check(inFrame === 0 || inFrame === 2, key + ': piscar fora dos quadros 1 ou 3 em ' + s[i] + ' ms');
    if (i) check(s[i] - s[i - 1] >= BLINK.intervalMs[0] && s[i] - s[i - 1] <= BLINK.intervalMs[1] + CYCLE, key + ': intervalo de piscar fora de 3–6 s (+espera do quadro)');
    check((s[i] % CYCLE) + BLINK.ms <= FRAME_START[inFrame] + FRAMES[inFrame].ms, key + ': piscar ultrapassa o fim do quadro');
  }
}
// piscares que se sobrepõem no tempo da prévia conjunta (já com a defasagem dos ciclos)
const globalBlinks = (k) => schedules[k].map((t) => t - PHASE[k]);
const same = globalBlinks('alemao').filter((a) => globalBlinks('ale').some((b) => Math.abs(a - b) < BLINK.ms)).length;
check(JSON.stringify(schedules.alemao) !== JSON.stringify(schedules.ale), 'os dois personagens piscam exatamente juntos (não são independentes)');

if (problems.length) { console.error('FALHOU:\n  ' + problems.join('\n  ')); process.exit(1); }

fs.mkdirSync(path.join(OUT, 'previews'), { recursive: true });
const BG = [0x4f, 0x7a, 0x94];
for (const [key, b] of Object.entries(built)) {
  const sheet = rgbaOf([...b.frames.map((f) => f.mat), b.blink]);
  writePNG(path.join(OUT, key + '_idle_spritesheet.png'), sheet.w, sheet.h, sheet.buf);
  const big = scale(sheet, 4, BG);
  writePNG(path.join(OUT, 'previews', key + '_idle_quadros_x4.png'), big.w, big.h, big.buf);
  const f1 = scale(rgbaOf([b.frames[0].mat]), 6, null);
  writePNG(path.join(OUT, 'previews', key + '_idle_quadro1_x6.png'), f1.w, f1.h, f1.buf);
}

// GIFs ×4 com fundo: um por personagem (12 s) e os dois lado a lado (12 s), piscares independentes
function timelineGif(keys, ms) {
  const S = 4, W = FRAME * keys.length * S, H = FRAME * S;
  const colorIdx = new Map([[BG.join(','), 0]]), palette = [BG];
  const cuts = new Set([0, ms]);
  for (const k of keys) {
    const ph = keys.length > 1 ? PHASE[k] : 0;
    for (let c = -CYCLE; c < ms + CYCLE; c += CYCLE) FRAME_START.forEach((s) => { const g = c + s - ph; if (g > 0 && g < ms) cuts.add(g); });
    for (const t of schedules[k]) { const g = t - ph; if (g > 0 && g < ms) { cuts.add(g); if (g + BLINK.ms < ms) cuts.add(g + BLINK.ms); } }
  }
  const times = [...cuts].filter((t) => t <= ms).sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < times.length - 1; i++) {
    const t = times[i], dur = times[i + 1] - t; if (dur <= 0) continue;
    const mats = keys.map((k) => { const lt = t + (keys.length > 1 ? PHASE[k] : 0); const f = frameAt(lt, schedules[k]); return f === 'P' ? built[k].blink : built[k].frames[f].mat; });
    const img = scale(rgbaOf(mats), S, BG), idx = new Uint8Array(W * H);
    for (let p = 0; p < W * H; p++) {
      const key = img.buf[p * 4] + ',' + img.buf[p * 4 + 1] + ',' + img.buf[p * 4 + 2];
      if (!colorIdx.has(key)) { colorIdx.set(key, palette.length); palette.push([img.buf[p * 4], img.buf[p * 4 + 1], img.buf[p * 4 + 2]]); }
      idx[p] = colorIdx.get(key);
    }
    const last = out[out.length - 1];
    if (last && Buffer.compare(Buffer.from(last.idx), Buffer.from(idx)) === 0) { last.ms += dur; continue; }
    out.push({ idx, ms: dur });
  }
  if (palette.length > 256) throw new Error('paleta do GIF passou de 256 cores');
  return gif(W, H, out, palette);
}
const GIF_MS = 12000;
fs.writeFileSync(path.join(OUT, 'previews', 'alemao_idle_x4.gif'), timelineGif(['alemao'], GIF_MS));
fs.writeFileSync(path.join(OUT, 'previews', 'ale_idle_x4.gif'), timelineGif(['ale'], GIF_MS));
fs.writeFileSync(path.join(OUT, 'previews', 'ambos_idle_x4.gif'), timelineGif(['alemao', 'ale'], GIF_MS));

// dados para integração futura
const data = {
  animacao: 'idle',
  quadro: { largura: FRAME, altura: FRAME },
  spritesheet: { arquivo: '<personagem>_idle_spritesheet.png', colunas: 5, linhas: 1, ordem: ['1 base', '2 expirar', '3 base', '4 ponta', 'P piscar'] },
  ancora: { phaserOrigin: [0.5, 1], deslocamentoV4: [OFFSET.x, OFFSET.y], solaY: SOLE_Y, pes: FEET, centroPesX: 47.5 },
  ciclo: { loop: true, totalMs: CYCLE, quadros: FRAMES.map((f, i) => ({ indice: i, id: f.id, nome: f.nome, ms: f.ms })) },
  piscar: { indice: 4, ms: BLINK.ms, intervaloMs: BLINK.intervalMs, apenasNosQuadros: BLINK.frames, inicioDentroDoQuadroMs: BLINK.offsetInFrameMs,
    regra: 'sorteia o próximo instante entre 3 e 6 s; espera o próximo quadro 1 ou 3; mostra o quadro P aos 300 ms desse quadro por 100 ms; volta ao mesmo quadro; cada personagem tem o próprio sorteio' },
  pontaDaVara: Object.fromEntries(Object.entries(built).map(([k, b]) => [k, b.frames.map((f) => f.tip)])),
  pixelsDosOlhos: Object.fromEntries(Object.entries(built).map(([k, b]) => [k, b.eyes]))
};
fs.writeFileSync(path.join(OUT, 'idle.json'), JSON.stringify(data, null, 2) + '\n');

console.log('OK — todas as verificações passaram');
for (const [k, b] of Object.entries(built)) {
  console.log('  ' + k + ': quadro 1 = v4 (0 px de diferença) · quadro 4 muda ' + b.changed4 + ' px (só vara) · piscar muda ' + b.changedBlink + ' px (só olhos) · ' + b.colors + ' cores');
  console.log('    ponta da vara por quadro: ' + JSON.stringify(b.frames.map((f) => f.tip)) + ' · piscares em 60 s: ' + schedules[k].length + ' (primeiros: ' + schedules[k].slice(0, 4).map((t) => (t / 1000).toFixed(1) + ' s').join(', ') + ')');
}
console.log('  piscares sobrepostos em 60 s na prévia conjunta (ciclos defasados 950 ms): ' + same);
