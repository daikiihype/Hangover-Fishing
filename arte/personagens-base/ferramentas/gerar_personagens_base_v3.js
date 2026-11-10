/*
 * Hangover Fishing — Personagens-base IDLE, revisão v3 (refinamento final pontual da v2)
 *
 * Uso (na pasta do projeto):   node arte/personagens-base/ferramentas/gerar_personagens_base_v3.js
 * Saída (NÃO sobrescreve v1 nem v2):
 *   arte/personagens-base/alemao_idle_v3.png, ale_idle_v3.png              (64 × 64, alfa real)
 *   arte/personagens-base/previews/*_v3_x6.png
 *   arte/personagens-base/previews/prancha_comparativa_v2_v3.png           (só para revisão)
 *
 * Mudanças da v3 em relação à v2 (somente estas três):
 *   1. Barba do ALE: menos quadrada e larga — curta, aparada, afinando até um queixo
 *      arredondado; bigode distinguível. Pele morena e tamanho do rosto mantidos.
 *   2. Molinete: carretel circular com cubo central e manivela com manopla visível,
 *      em vez do bloco retangular. Cores mantidas (vermelho / preto e amarelo).
 *   3. Vara: verificação automática de margem — nenhum pixel da vara a menos de 3 px
 *      da borda do quadro (o gerador falha se isso acontecer).
 * Todo o resto (cabeça do Alemão, cabelo, roupas, calças, proporções, pose, RIG) é a v2.
 *
 * Histórico da v2 (mantido abaixo como estava):
 * O que muda em relação à v1 (pedido da revisão criativa):
 *   - ALE: bigode e barba curta grisalha mais legíveis (mesmo tamanho de rosto, pele morena mantida).
 *   - Ambos: postura relaxada de espera (mãos na altura do quadril, cotovelos soltos),
 *     molinete maior e legível, vara mais curta e menos inclinada.
 *   - Estrutura pensada para as animações: braços, mãos, vara e molinete são peças
 *     separadas, posicionadas pelo "RIG" (pontos de articulação). As animações futuras
 *     trocam só essas peças; cabeça, tronco, pernas e botas não precisam ser redesenhados.
 * Cabeça do Alemão, roupas, cores, calça camuflada e cores das varas: iguais à v1.
 * A v1 (gerar_personagens_base.js e seus PNG) continua intacta.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT = path.join(__dirname, '..');
const W = 64, H = 64;

// ------------------------------------------------------------------ PNG (gravar e ler)
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(buf) { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function writePNG(file, w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  fs.writeFileSync(file, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))
  ]));
}
/** Lê um PNG RGBA de 8 bits gravado por estes geradores (filtro 0). Usado para a prancha comparativa. */
function readPNG(file) {
  const buf = fs.readFileSync(file);
  let pos = 8, w = 0, h = 0; const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos), type = buf.toString('ascii', pos + 4, pos + 8), data = buf.slice(pos + 8, pos + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); if (data[8] !== 8 || data[9] !== 6) throw new Error('PNG não suportado: ' + file); }
    if (type === 'IDAT') idat.push(data);
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat)), out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    if (raw[y * (w * 4 + 1)] !== 0) throw new Error('filtro PNG não suportado em ' + file);
    raw.copy(out, y * w * 4, y * (w * 4 + 1) + 1, (y + 1) * (w * 4 + 1));
  }
  return { w, h, buf: out };
}
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

// ------------------------------------------------------------------ tela
class Canvas {
  constructor(w, h) { this.w = w; this.h = h; this.px = new Array(w * h).fill(null); }
  set(x, y, c) { if (x >= 0 && y >= 0 && x < this.w && y < this.h && c) this.px[y * this.w + x] = c; }
  get(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.px[y * this.w + x] : null; }
  stamp(x0, y0, rows, pal) {
    rows.forEach((row, dy) => [...row].forEach((ch, dx) => {
      if (ch === '.' || ch === ' ') return;
      if (!(ch in pal)) throw new Error('cor sem paleta: ' + ch);
      this.set(x0 + dx, y0 + dy, pal[ch]);
    }));
  }
  outline(color) {
    const add = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.get(x, y)) continue;
      if (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1)) add.push([x, y]);
    }
    for (const [x, y] of add) this.set(x, y, color);
  }
  toRGBA() {
    const buf = Buffer.alloc(this.w * this.h * 4);
    this.px.forEach((c, i) => { if (!c) return; const [r, g, b] = hex(c); buf[i * 4] = r; buf[i * 4 + 1] = g; buf[i * 4 + 2] = b; buf[i * 4 + 3] = 255; });
    return { w: this.w, h: this.h, buf };
  }
}
function line(x0, y0, x1, y1, fn) {
  const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
  let err = dx + dy, i = 0;
  for (;;) { fn(x0, y0, i++); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
}

const OUTLINE = '#1b1622';
const COMMON = { K: OUTLINE, e: '#1e1418', w: '#f2ece4' };

// ------------------------------------------------------------------ cabeças
// Alemão: IGUAL à v1 (identidade aprovada na revisão).
const HEAD_ALEMAO = [
  '....aaaaaa......',
  '...aannnnaa.....',
  '..aannfffnaa....',
  '..aaannnnaaA....',
  '.AAaaaaaaaaAvvv.',
  'bbbAAAAAAAAvvvvv',
  'bbBbssssssssVV..',
  'bBbsBBBssBBBs...',
  'bbBsswesswes....',
  'bBbSssssssssS...',
  'bbBSsssssssSS...',
  'bBddssdDDdssd...',
  'bbdddDDsssDdd...',
  'bbBddddDDDdddd..',
  '.bbddddddddddd..',
  '..bdDdddddddD...',
  '.....dDDDDd.....'
];
// ALE v2: mesmo contorno de cabeça e mesmo tamanho de rosto da v1.
// Mudanças só na metade de baixo do rosto:
//   - bigode em "ferradura" com tom cinza-escuro (u), destacado da pele morena;
//   - barba curta mais clara (g) com sombra (x) na linha do queixo, para ler como "aparada";
//   - boca (M) entre bigode e barba; bochechas com pele aparente acima da barba.
const HEAD_ALE = [
  '................',
  '....hhHhhhh.....',
  '..hhHhhHhhhhh...',
  '.hhhhHhhhHhhhh..',
  '.hhHhhhhhhhhhh..',
  '.hhhhhhsssssss..',
  '.hhhhhsssssssss.',
  '.hhhsSsGGGsGGGs.',
  '.hhsSssswesssesS',
  '.hhsSsssssssssSS',
  '..hssSssssssssS.',
  '...gsssssssssSs.',
  '...gssuuuuuussS.',
  '....gguMMMMugg..',
  '....gggggggggg..',
  '.....xggggggx...',
  '.......xxxx.....'
];
// v3: barba mais estreita a cada linha (12 → 10 → 8 → 4 px) até um queixo arredondado;
// costeleta de 1 px; bochechas com pele aparente; bigode (u) separado da barba clara (g).

// ------------------------------------------------------------------ corpo (igual à v1)
const TORSO_ABERTO = [
  '...JJjjjjjjjJJ..',
  '..JjjjjJtttJjjJ.',
  '.ijjjjjJtttJjjjJ',
  '.ijjjjjJtttJjjjJ',
  '.ijjjjjJtttJjjJJ',
  '.ijjjjjJtttJjjJJ',
  '.ijjjjjJtttJjjJJ',
  '.ijjjjjJtttJjjJJ',
  '.ijjjjjJtttJjjJJ',
  '.ijjjjjJtttJjjJJ',
  '.ijjjjjJtttJjjJJ',
  '.ijjjjjJtttJjjJJ',
  '.ijjjjjJtTtJjjJJ',
  '.ijjjjjJTTTJjjJJ',
  '.ijjjjjJTTTJjjJJ',
  '.JJJJJJJJJJJJJJJ',
  '.JJJJJJJJJJJJJJJ'
];
const TORSO_FECHADO = [
  '...JJjjjjjjjJJ..',
  '..JjjjjJjjjJjjJ.',
  '.ijjjjjcjcjjjjjJ',
  '.ijjjjjcjcjjjjjJ',
  '.ijjjjjcjcjjjjJJ',
  '.ijjjjjjjjjjjjJJ',
  '.ijjjjjpppjjjjJJ',
  '.ijjjjjpPpjjjjJJ',
  '.ijjjjjpppjjjjJJ',
  '.ijjjjjjjjjjjjJJ',
  '.ijjjjjjjjjjjjJJ',
  '.ijjjJJJJJJJjjJJ',
  '.ijjjJjjjjjJjjJJ',
  '.ijjjJjjjjjJjjJJ',
  '.ijjjJJJJJJJjjJJ',
  '.JJJJJJJJJJJJJJJ',
  '.JJJJJJJJJJJJJJJ'
];
const LEGS = [
  'lllllllllllLL', 'lllllllllllLL', 'lllllllllllLL', 'lllllllllllLL',
  'llllLL.llllLL', 'llllLL.llllLL', 'llllLL.llllLL', 'llllLL.llllLL', 'llllLL.llllLL',
  'llllLL..llllLL', 'llllLL..llllLL', 'llllLL..llllLL', 'llllLL..llllLL', 'llllLL..llllLL',
  'llllLL..llllLL', 'llllLL..llllLL', 'llllLL..llllLL', 'llllLL..llllLL', 'llllLL..llllLL',
  'llllLL..llllLL', 'LLLLLL..LLLLLL'
];
const BOOTS = [
  '.ooooO...ooooO..',
  'ooooooO..oooooOO',
  'oooooOO..ooooooO',
  'SSSSSSS..SSSSSSS'
];

// ------------------------------------------------------------------ RIG (pontos de articulação)
// Tudo que as animações futuras vão mexer está aqui. Coordenadas na tela 64 × 64.
const RIG = {
  shoulderBack: [10, 22],     // ombro do braço de trás (lado esquerdo da imagem)
  shoulderFront: [23, 22],    // ombro do braço da frente
  handLow: [14, 35],          // mão de baixo: segura o cabo, na altura do quadril
  handTop: [23, 30],          // mão de cima: segura o assento do molinete
  rodButt: [11, 39],          // fim do cabo, atrás da mão de baixo
  rodSeat: [24, 31],          // assento do molinete
  rodTip: [48, 17],           // ponta da vara: na altura da cabeça, sem dominar a figura
  reel: [23, 31]              // canto superior esquerdo do molinete (haste logo à direita da mão de cima)
};

// Peças de braço da pose IDLE (cada animação terá as suas; o tronco não muda).
// Braço de trás: desce colado ao corpo e o antebraço vai até a mão de baixo. Origem = ombro de trás − (1, 0).
const ARM_BACK_IDLE = [
  'ij......',
  'ijJ.....',
  'ijJ.....',
  'ijJ.....',
  'ijJ.....',
  'ijJ.....',
  'ijJ.....',
  'ijJ.....',
  'ijJ.....',
  '.ijJ....',
  '.ijjJ...',
  '..ijjJ..',
  '...ijjJ.'
];
// Braço da frente: cotovelo solto ao lado do corpo, antebraço para a frente até o molinete. Origem = ombro da frente − (1, 0).
const ARM_FRONT_IDLE = [
  '.jjJ.',
  'jjjjJ',
  'jjjjJ',
  'jjjjJ',
  'Jjjjj',
  'Jjjjj',
  '.Jjjj',
  '.Jjjj'
];
// Mãos (3 × 2): dedos fechados sobre a vara.
const HAND_LOW_ROWS = ['sss', 'SsS'];
const HAND_TOP_ROWS = ['sss', 'SSs'];
// Molinete v3: carretel CIRCULAR (7 × 7 com contorno, cantos cortados) pendurado por uma haste,
// com cubo central e manivela saindo para a direita até a manopla em "T".
//   K contorno · r aro (cor do equipamento) · u face do carretel com linha (clara)
//   z cubo central · m braço da manivela · k manopla
const REEL = [
  '...K......',
  '..KKK.....',
  '.KrrrK....',
  'KruuurK..k',
  'KruzurKmmk',
  'KruuurK...',
  '.KrrrK....',
  '..KKK.....'
];

// ------------------------------------------------------------------ montagem
function build(def) {
  const c = new Canvas(W, H);
  const P = Object.assign({}, COMMON, def.pal);
  // 1) partes fixas (iguais em todas as animações futuras)
  c.stamp(11, 38, LEGS, P);
  if (def.camo) camo(c, P);
  c.stamp(10, 59, BOOTS, Object.assign({}, P, { S: P.sole }));
  c.stamp(9, 21, def.torso, P);
  // 2) peças da pose (braços e mãos)
  c.stamp(RIG.shoulderBack[0] - 1, RIG.shoulderBack[1], ARM_BACK_IDLE, P);
  c.stamp(9, 4, def.head, P);
  c.stamp(RIG.shoulderFront[0] - 1, RIG.shoulderFront[1], ARM_FRONT_IDLE, P);
  c.stamp(RIG.handLow[0], RIG.handLow[1], HAND_LOW_ROWS, P);
  c.stamp(RIG.handTop[0], RIG.handTop[1], HAND_TOP_ROWS, P);
  c.outline(OUTLINE);

  // 3) vara: grossa (2 px) do cabo ao molinete; fina (1 px) do molinete até a ponta
  const rod = def.rod;
  const rodPx = [];
  const put = (x, y, col) => { c.set(x, y, col); rodPx.push([x, y]); };
  line(RIG.rodButt[0], RIG.rodButt[1], RIG.rodSeat[0], RIG.rodSeat[1], (x, y) => {
    const grip = x <= RIG.handLow[0] + 3;
    put(x, y, grip ? rod.grip : rod.main);
    put(x, y + 1, grip ? rod.gripDark : rod.dark);
  });
  line(RIG.rodSeat[0], RIG.rodSeat[1], RIG.rodTip[0], RIG.rodTip[1], (x, y, i) => {
    put(x, y, rod.band && i > 0 && i % 6 === 0 ? rod.band : rod.main);
  });
  put(RIG.rodTip[0], RIG.rodTip[1], rod.tip);
  // v3: a vara nunca pode encostar nem ser cortada pela borda do quadro.
  const MIN_MARGIN = 3;
  const m = { left: Infinity, right: Infinity, top: Infinity, bottom: Infinity };
  for (const [x, y] of rodPx) {
    m.left = Math.min(m.left, x); m.right = Math.min(m.right, W - 1 - x);
    m.top = Math.min(m.top, y); m.bottom = Math.min(m.bottom, H - 1 - y);
  }
  if (Math.min(m.left, m.right, m.top, m.bottom) < MIN_MARGIN) throw new Error('vara perto demais da borda: ' + JSON.stringify(m));
  c.rodMargins = m;
  // 4) molinete pendurado sob o assento
  c.stamp(RIG.reel[0], RIG.reel[1], REEL, Object.assign({}, P, { r: rod.reel, u: rod.spool, z: rod.hub, m: rod.crank, k: rod.knob }));
  // 5) mãos por cima da vara
  c.stamp(RIG.handLow[0], RIG.handLow[1], HAND_LOW_ROWS, P);
  c.stamp(RIG.handTop[0], RIG.handTop[1], HAND_TOP_ROWS, P);
  return c;
}

function camo(c, P) {
  const tones = [null, null, P.m, P.n, P.m, P.y, null, P.n];
  for (let y = 38; y < 59; y++) for (let x = 10; x < 26; x++) {
    if (c.get(x, y) !== P.l) continue;
    const cx = Math.floor((x + (Math.floor(y / 3) % 2)) / 2), cy = Math.floor(y / 2);
    const k = (cx * 7 + cy * 13 + ((cx * cy) % 5)) % tones.length;
    if (tones[k]) c.set(x, y, tones[k]);
  }
}

// ------------------------------------------------------------------ paletas (cores principais iguais à v1)
const ALEMAO = {
  head: HEAD_ALEMAO,
  torso: TORSO_ABERTO,
  pal: {
    a: '#a9bdd4', A: '#7d93b3', n: '#2c4677', f: '#dfe6d6', v: '#2f62b8', V: '#1d3d78',
    b: '#5a3520', B: '#3a2113', d: '#4e2e1b', D: '#33190d',
    s: '#f0b58c', S: '#c98a63',
    j: '#2c5bb4', J: '#1c3a7a', i: '#4a7bd6',
    t: '#8fbbe8', T: '#6e98c8',
    l: '#3d5f92', L: '#273f66',
    o: '#6e4a2c', O: '#4a3019', sole: '#2a1c12',
    c: '#2c5bb4', p: '#2c5bb4', P: '#2c5bb4'
  },
  rod: { main: '#d22a2f', dark: '#7c1419', grip: '#2b2326', gripDark: '#161114', tip: '#d22a2f',
    reel: '#d22a2f', spool: '#e9e4dc', hub: '#7c1419', crank: '#3a3236', knob: '#f2ece4' }
};
const ALE = {
  head: HEAD_ALE,
  torso: TORSO_FECHADO,
  camo: true,
  pal: {
    h: '#8f9093', H: '#b9babd', G: '#4a4b50',
    g: '#c3c3c6', x: '#8e8e93',            // barba curta (mais clara que o cabelo) e sombra do queixo
    u: '#68686e', M: '#5a2e22',            // bigode cinza-escuro e boca
    s: '#b4774c', S: '#8c5634',            // pele morena (igual à v1)
    j: '#4a4f58', J: '#30343b', i: '#5f6570',
    c: '#c9c9cc', p: '#646a75', P: '#8a909a',
    l: '#6a6f47', L: '#464a2d', m: '#3e4427', n: '#6e5236', y: '#8d8f5e',
    o: '#6e4a2c', O: '#4a3019', sole: '#2a1c12'
  },
  rod: { main: '#1d1d22', dark: '#0e0e11', band: '#f2c230', grip: '#2b2326', gripDark: '#161114', tip: '#f2c230',
    reel: '#2c2c33', spool: '#d9d9dc', hub: '#f2c230', crank: '#f2c230', knob: '#f2c230' }
};

module.exports = { build, RIG, ALEMAO, ALE, readPNG, W, H };

// ------------------------------------------------------------------ saída
if (require.main === module) {
  fs.mkdirSync(path.join(OUT, 'previews'), { recursive: true });
  const v3 = { alemao: build(ALEMAO), ale: build(ALE) };
  for (const [k, cv] of Object.entries(v3)) {
    const name = (k === 'alemao' ? 'alemao' : 'ale') + '_idle_v3';
    const file = path.join(OUT, name + '.png');
    const a = cv.toRGBA(); writePNG(file, a.w, a.h, a.buf);
    writePNG(path.join(OUT, 'previews', name + '_x6.png'), ...scaled(a, 6));
    console.log(path.relative(process.cwd(), file) + '  ' + W + 'x' + H + '  margens da vara (px): ' + JSON.stringify(cv.rodMargins));
  }

  // Prancha comparativa V2 x V3 (só para revisão; não é sprite; sem textos).
  // Colunas: Alemão v2 | Alemão v3 | ALE v2 | ALE v3  (a v2 é lida dos PNG gravados)
  // Linha 1: corpo inteiro x4 · Linha 2: rostos x10 · Linha 3: mãos, vara e molinete x8
  const imgs = [
    readPNG(path.join(OUT, 'alemao_idle_v2.png')), v3.alemao.toRGBA(),
    readPNG(path.join(OUT, 'ale_idle_v2.png')), v3.ale.toRGBA()
  ];
  const colW = 64 * 4 + 24, rows = [
    { crop: [0, 0, 64, 64], scale: 4 },
    { crop: [6, 2, 26, 23], scale: 10 },
    { crop: [8, 26, 36, 41], scale: 8 }
  ];
  const rowH = rows.map((r) => (r.crop[3] - r.crop[1]) * r.scale + 24);
  const SW = colW * 4 + 24, SH = rowH.reduce((a, b) => a + b, 0) + 24;
  const sheet = Buffer.alloc(SW * SH * 4);
  const paint = (x0, y0, x1, y1, col) => { const [r, g, b] = hex(col); for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = (y * SW + x) * 4; sheet[i] = r; sheet[i + 1] = g; sheet[i + 2] = b; sheet[i + 3] = 255; } };
  paint(0, 0, SW, SH, '#2a3036');
  let oy = 12;
  rows.forEach((r, ri) => {
    imgs.forEach((img, ci) => {
      const [cx0, cy0, cx1, cy1] = r.crop, s = r.scale;
      const ox = 12 + ci * colW + Math.floor((colW - 24 - (cx1 - cx0) * s) / 2);
      // fundo do quadro: v2 cinza-esverdeado (como na prancha anterior), v3 cinza-arroxeado
      paint(ox - 6, oy, ox + (cx1 - cx0) * s + 6, oy + (cy1 - cy0) * s + 12, ci % 2 === 0 ? '#6b8070' : '#7a7090');
      for (let y = cy0; y < cy1; y++) for (let x = cx0; x < cx1; x++) {
        const i = (y * img.w + x) * 4; if (img.buf[i + 3] === 0) continue;
        const col = '#' + [0, 1, 2].map((k) => img.buf[i + k].toString(16).padStart(2, '0')).join('');
        paint(ox + (x - cx0) * s, oy + 6 + (y - cy0) * s, ox + (x - cx0 + 1) * s, oy + 6 + (y - cy0 + 1) * s, col);
      }
    });
    oy += rowH[ri];
  });
  writePNG(path.join(OUT, 'previews', 'prancha_comparativa_v2_v3.png'), SW, SH, sheet);
  console.log('previews/prancha_comparativa_v2_v3.png  ' + SW + 'x' + SH);
}

function scaled(a, s) {
  const w = a.w * s, h = a.h * s, buf = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) a.buf.copy(buf, (y * w + x) * 4, ((Math.floor(y / s)) * a.w + Math.floor(x / s)) * 4, ((Math.floor(y / s)) * a.w + Math.floor(x / s)) * 4 + 4);
  return [w, h, buf];
}
