/*
 * Hangover Fishing — Personagens-base (IDLE) em pixel art
 * Gera os sprites de ALE e Alemão desenhados pixel a pixel (mapas de caracteres abaixo).
 *
 * Uso (na pasta do projeto):   node arte/personagens-base/ferramentas/gerar_personagens_base.js
 * Saída: arte/personagens-base/*.png (alfa real) e arte/personagens-base/previews/*.png
 * Não depende de nenhuma biblioteca: o PNG é codificado aqui (zlib do Node).
 *
 * Referências visuais: alemao rosto.jpg, Pai rosto.jpg (ALE), logo.jpg, sprite.jpg, sprite 2.jpg.
 * Nada é recortado das referências: tudo é redesenhado nesta escala.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT = path.join(__dirname, '..');
const W = 64, H = 64;          // tela de cada sprite; sola na linha y = 62, contorno em y = 63

// ------------------------------------------------------------------ PNG
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
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  fs.writeFileSync(file, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))
  ]));
}
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

// ------------------------------------------------------------------ tela
class Canvas {
  constructor(w, h) { this.w = w; this.h = h; this.px = new Array(w * h).fill(null); }
  set(x, y, c) { if (x >= 0 && y >= 0 && x < this.w && y < this.h && c) this.px[y * this.w + x] = c; }
  get(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.px[y * this.w + x] : null; }
  /** Carimba um mapa de caracteres; '.' e ' ' = vazio. */
  stamp(x0, y0, rows, pal) {
    rows.forEach((row, dy) => [...row].forEach((ch, dx) => {
      if (ch === '.' || ch === ' ') return;
      if (!(ch in pal)) throw new Error('cor sem paleta: ' + ch);
      this.set(x0 + dx, y0 + dy, pal[ch]);
    }));
  }
  /** Contorno externo: pixel vazio vizinho (4 direções) de um pixel preenchido. */
  outline(color) {
    const add = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.get(x, y)) continue;
      if (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1)) add.push([x, y]);
    }
    for (const [x, y] of add) this.set(x, y, color);
  }
  toRGBA(scale) {
    const s = scale || 1, w = this.w * s, h = this.h * s, buf = Buffer.alloc(w * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const c = this.px[Math.floor(y / s) * this.w + Math.floor(x / s)];
      if (!c) continue;
      const [r, g, b] = hex(c), i = (y * w + x) * 4;
      buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = 255;
    }
    return { w, h, buf };
  }
}

// Linha de Bresenham
function line(x0, y0, x1, y1, fn) {
  const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
  let err = dx + dy, i = 0;
  for (;;) { fn(x0, y0, i++); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
}

// ------------------------------------------------------------------ cores comuns
const OUTLINE = '#1b1622';
const COMMON = {
  K: OUTLINE,
  e: '#1e1418',        // olho
  w: '#f2ece4'         // brilho do olho
};

// ------------------------------------------------------------------ cabeças (rosto em 3/4 voltado para a direita)
// ALEMÃO: boné de frente cinza-clara com emblema azul-marinho e peixe claro, aba azul;
// cabelo castanho ondulado saindo por baixo do boné; sobrancelhas grossas; barba cheia castanha.
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
// ALE: cabelo grisalho curto e texturizado, sem boné; sobrancelhas retas e escuras;
// barba curta grisalha bem aparada, mandíbula quadrada; orelha visível; pele morena.
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
  '...Sgsssssssssg.',
  '...gggskkkkksgg.',
  '...gggsMMMMsggg.',
  '...gggggggggggg.',
  '....gggggggggg..',
  '......ggggggg...'
];

// ------------------------------------------------------------------ corpo (mesmo esqueleto para os dois)
// Tronco do moletom (inclui gola/capuz e barra). Origem (9, 21).
const TORSO_ABERTO = [            // Alemão: moletom aberto, camiseta à mostra
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
const TORSO_FECHADO = [           // ALE: moletom fechado, cordões e estampa indistinta no peito
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
// Braço de trás (lado esquerdo da imagem) descendo até a mão de baixo. Origem (8, 22).
const ARM_BACK = [
  '.ij.....',
  'ijjJ....',
  'ijjJ....',
  'ijjJ....',
  'ijjJ....',
  'ijjJ....',
  'ijjJ....',
  'ijjjJ...',
  '.ijjjJ..',
  '..ijjjJJ',
  '...JjjjJ',
  '....JJJ.'
];
// Braço da frente (lado direito da imagem), cotovelo dobrado, mão de cima. Origem (21, 22).
const ARM_FRONT = [
  '.jjJ..',
  'jjjjJ.',
  'jjjjJ.',
  'jjjjJ.',
  'Jjjjj.',
  'Jjjjjj',
  '.JjjjJ'
];
// Calças. Origem (11, 38), logo abaixo da barra do moletom. Duas pernas, leve abertura; perna da direita um pouco à frente.
const LEGS = [
  'lllllllllllLL',
  'lllllllllllLL',
  'lllllllllllLL',
  'lllllllllllLL',
  'llllLL.llllLL',
  'llllLL.llllLL',
  'llllLL.llllLL',
  'llllLL.llllLL',
  'llllLL.llllLL',
  'llllLL..llllLL',
  'llllLL..llllLL',
  'llllLL..llllLL',
  'llllLL..llllLL',
  'llllLL..llllLL',
  'llllLL..llllLL',
  'llllLL..llllLL',
  'llllLL..llllLL',
  'llllLL..llllLL',
  'llllLL..llllLL',
  'llllLL..llllLL',
  'LLLLLL..LLLLLL'
];
// Botas. Origem (10, 59); sola em y = 62.
const BOOTS = [
  '.ooooO...ooooO..',
  'ooooooO..oooooOO',
  'oooooOO..ooooooO',
  'SSSSSSS..SSSSSSS'
];
const HAND_LOW = { x: 18, y: 33, rows: ['ss', 'sS'] };   // mão de baixo (segura o cabo)
const HAND_TOP = { x: 26, y: 27, rows: ['ss', 'Ss'] };   // mão de cima

// ------------------------------------------------------------------ montagem
function build(def) {
  const c = new Canvas(W, H);
  const P = Object.assign({}, COMMON, def.pal);
  // ordem: pernas e botas, tronco, braço de trás, cabeça, braço da frente
  c.stamp(11, 38, LEGS, P);
  if (def.camo) camo(c, P);
  c.stamp(10, 59, BOOTS, Object.assign({}, P, { S: P.sole }));
  c.stamp(9, 21, def.torso, P);
  c.stamp(8, 22, ARM_BACK, P);
  c.stamp(9, 4, def.head, P);
  c.stamp(23, 22, ARM_FRONT, P);
  for (const h of [HAND_LOW, HAND_TOP]) c.stamp(h.x, h.y, h.rows, P);
  c.outline(OUTLINE);

  // vara (desenhada depois do contorno, com borda própria)
  const butt = [14, 38], low = [19, 34], top = [27, 28], tip = [58, 1];
  const rod = def.rod;
  line(butt[0], butt[1], low[0], low[1], (x, y) => { c.set(x, y, rod.grip); c.set(x, y + 1, rod.gripDark); });
  line(low[0], low[1], tip[0], tip[1], (x, y, i) => {
    const col = rod.band && (i % 7 === 4) ? rod.band : rod.main;
    c.set(x, y, col);
    if (x <= top[0] + 3) c.set(x, y + 1, rod.dark);   // grossa só perto das mãos; afina até a ponta
  });
  c.set(tip[0], tip[1], rod.tip || rod.main);
  // molinete pendurado sob a vara, entre as mãos
  c.stamp(21, 33, ['KKKK', 'KrrK', 'KrRKk', 'KKKK'], Object.assign({}, P, { r: rod.reel, R: rod.reelDark, k: rod.reelKnob }));
  // mãos por cima da vara
  for (const h of [HAND_LOW, HAND_TOP]) c.stamp(h.x, h.y, h.rows, P);
  return c;
}

function camo(c, P) {
  // Camuflado em blocos de 2×2 (determinístico), só sobre a cor base das calças.
  const tones = [null, null, P.m, P.n, P.m, P.y, null, P.n];
  for (let y = 38; y < 59; y++) for (let x = 10; x < 26; x++) {
    if (c.get(x, y) !== P.l) continue;
    const cx = Math.floor((x + (Math.floor(y / 3) % 2)) / 2), cy = Math.floor(y / 2);
    const k = (cx * 7 + cy * 13 + ((cx * cy) % 5)) % tones.length;
    if (tones[k]) c.set(x, y, tones[k]);
  }
}

// ------------------------------------------------------------------ paletas
const ALEMAO = {
  head: HEAD_ALEMAO,
  torso: TORSO_ABERTO,
  pal: {
    a: '#a9bdd4', A: '#7d93b3',              // frente do boné (cinza-azulada) e sombra
    n: '#2c4677', f: '#dfe6d6',              // emblema azul-marinho e peixe claro
    v: '#2f62b8', V: '#1d3d78',              // aba azul e sombra sob a aba
    b: '#5a3520', B: '#3a2113',              // cabelo castanho escuro
    d: '#4e2e1b', D: '#33190d',              // barba
    s: '#f0b58c', S: '#c98a63',              // pele clara
    j: '#2c5bb4', J: '#1c3a7a', i: '#4a7bd6', // moletom azul
    t: '#8fbbe8', T: '#6e98c8',              // camiseta azul-clara
    l: '#3d5f92', L: '#273f66',              // calça jeans
    o: '#6e4a2c', O: '#4a3019', sole: '#2a1c12',
    c: '#2c5bb4', p: '#2c5bb4', P: '#2c5bb4', q: '#2c5bb4'
  },
  rod: { main: '#d22a2f', dark: '#7c1419', grip: '#2b2326', gripDark: '#161114', reel: '#d22a2f', reelDark: '#8a1a1e', reelKnob: '#e8e0d8', tip: '#d22a2f' }
};

const ALEMAO_JAQUETA = JSON.parse(JSON.stringify(ALEMAO));
Object.assign(ALEMAO_JAQUETA.pal, {
  j: '#2a2d36', J: '#181a21', i: '#3d414c',     // jaqueta escura (GDD v0.3; sprite.jpg)
  t: '#4b5a78', T: '#3a4660'                    // camiseta escura por baixo
});

const ALE = {
  head: HEAD_ALE,
  torso: TORSO_FECHADO,
  camo: true,
  pal: {
    h: '#8f9093', H: '#b9babd', G: '#4a4b50',   // cabelo grisalho; sobrancelhas escuras
    g: '#a3a3a6', k: '#7c7c80', M: '#6b3b2b',   // barba grisalha, bigode mais escuro, boca
    s: '#b4774c', S: '#8c5634',                  // pele morena
    j: '#4a4f58', J: '#30343b', i: '#5f6570',   // moletom chumbo
    c: '#c9c9cc',                                // cordões do capuz
    p: '#646a75', P: '#8a909a', q: '#585e69',   // estampa indistinta no peito
    l: '#6a6f47', L: '#464a2d',                  // camuflado: base e sombra
    m: '#3e4427', n: '#6e5236', y: '#8d8f5e',    // camuflado: manchas
    o: '#6e4a2c', O: '#4a3019', sole: '#2a1c12',
    a: '#000', A: '#000', n2: '#000', f: '#000', v: '#000', V: '#000', b: '#000', B: '#000', d: '#000', D: '#000', t: '#000', T: '#000'
  },
  rod: { main: '#1d1d22', dark: '#0e0e11', band: '#f2c230', grip: '#2b2326', gripDark: '#161114', reel: '#1d1d22', reelDark: '#f2c230', reelKnob: '#f2c230', tip: '#f2c230' }
};
// camuflado usa 'q' como terceira cor de mancha
ALE.pal.q = '#585e69';

module.exports = { build, ALEMAO, ALEMAO_JAQUETA, ALE, W, H };

if (require.main === module) {
  fs.mkdirSync(path.join(OUT, 'previews'), { recursive: true });
  const sprites = [
    ['alemao_idle', ALEMAO],
    ['ale_idle', ALE],
    ['alemao_idle_variante_jaqueta_escura', ALEMAO_JAQUETA]
  ];
  const built = {};
  for (const [name, def] of sprites) {
    const c = build(def);
    built[name] = c;
    const a = c.toRGBA(1); writePNG(path.join(OUT, name + '.png'), a.w, a.h, a.buf);
    const z = c.toRGBA(6); writePNG(path.join(OUT, 'previews', name + '_x6.png'), z.w, z.h, z.buf);
    // caixa ocupada pelo personagem (sem a vara): para registrar a escala
    console.log(name + '.png  ' + W + '×' + H);
  }
  // prancha de revisão (não é sprite): os dois lado a lado, ×4, sobre margem de rio
  const S = 4, gap = 8, cw = (W * 3 + gap * 4) * S, ch = (H + 16) * S;
  const sheet = Buffer.alloc(cw * ch * 4);
  const fill = (x0, y0, x1, y1, col) => { const [r, g, b] = hex(col); for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = (y * cw + x) * 4; sheet[i] = r; sheet[i + 1] = g; sheet[i + 2] = b; sheet[i + 3] = 255; } };
  fill(0, 0, cw, ch, '#215f88');
  fill(0, (H + 4) * S, cw, ch, '#5b4a32');
  fill(0, (H + 4) * S, cw, (H + 5) * S, '#3d6b3a');
  [['alemao_idle', 0], ['ale_idle', 1], ['alemao_idle_variante_jaqueta_escura', 2]].forEach(([name, k]) => {
    const z = built[name].toRGBA(S);
    const ox = (gap + k * (W + gap)) * S, oy = 5 * S;
    for (let y = 0; y < z.h; y++) for (let x = 0; x < z.w; x++) {
      const i = (y * z.w + x) * 4; if (z.buf[i + 3] === 0) continue;
      const o = ((oy + y) * cw + ox + x) * 4; z.buf.copy(sheet, o, i, i + 4);
    }
  });
  writePNG(path.join(OUT, 'previews', 'prancha_revisao_x4.png'), cw, ch, sheet);
  console.log('previews/ gerado');
}
