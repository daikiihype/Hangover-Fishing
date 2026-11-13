/*
 * Hangover Fishing — Operação Nova Identidade
 * Cenario: a pixel art do lago, gerada por código (nenhum arquivo de imagem novo).
 *
 * Três planos:
 *   1. fundo distante: céu de fim de tarde, sol baixo, morros, a outra margem com árvores,
 *      uma casinha com píer e a ponte de madeira na entrada do rio;
 *   2. água: profundidade em degradê pontilhado (sem faixas retas), reflexo da outra margem,
 *      fundo de areia e pedrinhas na parte rasa, plantas, pedras e troncos submersos;
 *      superfície com vitórias-régias, pedras com musgo e espuma, juncos e folhas;
 *   3. primeiro plano: margem de borda irregular, grama, terra texturizada, pedras, raízes,
 *      sombras sob os pescadores, equipamentos e a manta com o cestinho do Sirius (sem rosto).
 *
 * Tudo é desenhado UMA vez por layout numa tela pequena (1 pixel da arte = P pixels do
 * aparelho) e ampliado com filtro "nearest": nítido e barato. As animações ficam em
 * VidaDoLago.js. Sorteio com semente fixa: o lago é o mesmo em toda partida (é um lugar).
 *
 * Só visual: nada aqui toca na pescaria.
 */
(function (root) {
  'use strict';

  // ------------------------------------------------------------------ utilidades
  function semente(s) {
    let a = s >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const limiar = (x, y) => (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
  function mistura(a, b, t) {
    const r = ((a >> 16) & 255) + (((b >> 16) & 255) - ((a >> 16) & 255)) * t;
    const g = ((a >> 8) & 255) + (((b >> 8) & 255) - ((a >> 8) & 255)) * t;
    const bl = (a & 255) + ((b & 255) - (a & 255)) * t;
    return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(bl);
  }
  function escurecida(c, f) { return mistura(c, 0x000000, f); }
  /** Ruído de valor suave (manchas orgânicas em vez de padrões repetidos). */
  function hash2(x, y, s) {
    let h = (Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(s, 2246822519)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function ruido(x, y, s) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }

  /** Buffer de pixels (0xAABBGGRR, little-endian) com primitivas simples. */
  class Pix {
    constructor(w, h) { this.w = Math.max(1, w | 0); this.h = Math.max(1, h | 0); this.d = new Uint32Array(this.w * this.h); }
    p(x, y, c, a) {
      x = Math.round(x); y = Math.round(y);
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
      const al = a == null ? 255 : a;
      this.d[y * this.w + x] = ((al << 24) | ((c & 0xff) << 16) | (c & 0xff00) | ((c >> 16) & 0xff)) >>> 0;
    }
    cor(x, y) {
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return -1;
      const v = this.d[y * this.w + x];
      if ((v >>> 24) === 0) return -1;
      return ((v & 0xff) << 16) | (v & 0xff00) | ((v >> 16) & 0xff);
    }
    /** pixel pontilhado: pinta só onde o limiar de Bayer é menor que t (0–1). */
    pd(x, y, c, t) { if (limiar(x, y) < t) this.p(x, y, c); }
    rect(x, y, w, h, c, a) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.p(x + i, y + j, c, a); }
    elipse(cx, cy, rx, ry, c, t) {
      for (let y = -Math.ceil(ry); y <= Math.ceil(ry); y++) for (let x = -Math.ceil(rx); x <= Math.ceil(rx); x++) {
        if ((x * x) / (rx * rx + 0.01) + (y * y) / (ry * ry + 0.01) <= 1) {
          if (t == null) this.p(cx + x, cy + y, c); else this.pd(cx + x, cy + y, c, t);
        }
      }
    }
    escurecer(x, y, f) { const c = this.cor(x, y); if (c >= 0) this.p(x, y, escurecida(c, f)); }
    linha(x0, y0, x1, y1, c) {
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let e = dx + dy;
      for (let n = 0; n < 2000; n++) {
        this.p(x0, y0, c);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * e;
        if (e2 >= dy) { e += dy; x0 += sx; }
        if (e2 <= dx) { e += dx; y0 += sy; }
      }
    }
    canvas() {
      const cv = document.createElement('canvas');
      cv.width = this.w; cv.height = this.h;
      const ctx = cv.getContext('2d');
      const img = ctx.createImageData(this.w, this.h);
      new Uint32Array(img.data.buffer).set(this.d);
      ctx.putImageData(img, 0, 0);
      return cv;
    }
  }

  // ------------------------------------------------------------------ paletas
  const PALETAS = {
    tarde: {
      ceu: [0x5b8ccc, 0x74a3d6, 0x95bcdc, 0xbfd0d4, 0xe9cfa3, 0xffd9a0],
      sol: 0xfff3c8, brilho: 0xffd88f, nuvem: 0xfbecd6, nuvemSombra: 0xd9ab8e,
      morro1: 0x8a8fbf, morro1Luz: 0xa7a8cf, morro2: 0x5f7d9c, morro2Luz: 0x7895ad,
      arvore: 0x2c5640, arvoreMeio: 0x3b6e4c, arvoreLuz: 0x82a85a, arvoreSombra: 0x1f3d2f,
      margemLonge: 0xc9c08e, reflexo: 0x9cb7c6
    },
    por: {
      ceu: [0x3d4f8e, 0x6a5aa3, 0xa8669d, 0xd9746c, 0xf3955a, 0xffc063],
      sol: 0xffe2a0, brilho: 0xffa860, nuvem: 0xffc9a0, nuvemSombra: 0xb0607a,
      morro1: 0x7b5f9a, morro1Luz: 0x9a72a6, morro2: 0x4f4f80, morro2Luz: 0x6a5f8e,
      arvore: 0x2a3a40, arvoreMeio: 0x34494a, arvoreLuz: 0xc9864f, arvoreSombra: 0x1c2730,
      margemLonge: 0xd8a070, reflexo: 0xd99a7a
    }
  };
  const C = {
    // água (de longe para perto)
    reflexoAlto: 0x8eaabd, poco: [0x1c3d5d, 0x163552, 0x122d47], pedras: [0x245a7e, 0x2a6488],
    lirios: [0x2a6a6b, 0x2f7570], rasa: [0x3a8a84, 0x47998d], areia: 0xb7a46e, areiaClara: 0xcdbb84,
    pocoBorda: 0x1d4565, pedrasBorda: 0x2a6a7c,
    seixo: 0x7d6f52, seixoClaro: 0xd6c796, alga: 0x2f6a3a, algaClara: 0x4f8f45, troncoAgua: 0x1a2b2c,
    pedraAgua: 0x1f4a63, brilhoAgua: 0xcfe6f0,
    // superfície
    lirio: 0x4f9a3e, lirioLuz: 0x78c255, lirioEscuro: 0x2c6427, flor: 0xff9fc0, florClara: 0xffe3ee, miolo: 0xffd54a,
    pedra: 0x7d858b, pedraLuz: 0xa3abae, pedraSombra: 0x52585e, musgo: 0x5f8f3a, espuma: 0xe8f6ff,
    junco: 0x4f7f3a, juncoClaro: 0x79a64f, taboa: 0x7a4f2e, galho: 0x3b2a1e, folha: 0xd9822f, folhaClara: 0xf0b14a,
    // margem
    lama: 0x3b2d21, areiaMolhada: 0x8a7650, grama: 0x5a964a, gramaClara: 0x6ca853, gramaEscura: 0x4b8442,
    gramaLuz: 0x8cc263, gramaFolha: 0x3f7539,
    terra: 0x6e5136, terraClara: 0x83623f, terraEscura: 0x523b28, pedrinha: 0x8e8a7f, pedrinhaClara: 0xbab4a4,
    raiz: 0x4a3220, florAmarela: 0xffd94f, florBranca: 0xf4f0e2,
    caixa: 0x2f6f8f, caixaEscura: 0x1f4c63, dourado: 0xe2b75a, balde: 0x9aa6ad, baldeEscuro: 0x6b767c,
    manta: 0xd8434a, mantaClara: 0xf5efe0, vime: 0xc49a5a, vimeEscuro: 0x8a6534, mantinha: 0x3f63b8,
    garrafa: 0xc8282e, garrafaClara: 0xf2f2f2
  };

  // ------------------------------------------------------------------ 1. fundo distante
  function desenharCeu(pix, W, hA, pal, info) {
    const st = pal.ceu, n = st.length - 1;
    for (let y = 0; y < hA; y++) {
      const u = (y / Math.max(1, hA - 1)) * n, i = Math.min(n - 1, Math.floor(u)), f = u - i;
      for (let x = 0; x < W; x++) pix.p(x, y, f > limiar(x, y) ? st[i + 1] : st[i]);
    }
    // sol baixo, com halo pontilhado
    const sx = info.sol.x, sy = info.sol.y, r = info.sol.r;
    for (let y = -r * 3; y <= r * 3; y++) for (let x = -r * 3; x <= r * 3; x++) {
      const d = Math.sqrt(x * x + y * y);
      if (d <= r) pix.p(sx + x, sy + y, pal.sol);
      else if (d <= r * 1.6) pix.pd(sx + x, sy + y, pal.brilho, 0.75);
      else if (d <= r * 2.6) pix.pd(sx + x, sy + y, pal.brilho, 0.35 * (1 - (d - r * 1.6) / (r * 1.0)));
    }
  }

  function desenharMorros(pix, W, hA, pal) {
    const esc = Math.max(1, hA / 40);
    const m1 = (x) => hA - Math.round((6 + 5 * (0.5 + 0.5 * Math.sin(x * 0.021 + 0.7)) + 3 * (0.5 + 0.5 * Math.sin(x * 0.057 + 2.1)) + 1.2 * Math.sin(x * 0.13)) * esc);
    const m2 = (x) => hA - Math.round((3 + 3 * (0.5 + 0.5 * Math.sin(x * 0.034 + 4.1)) + 1.5 * (0.5 + 0.5 * Math.sin(x * 0.09 + 1.3))) * esc);
    for (let x = 0; x < W; x++) {
      const t1 = m1(x);
      for (let y = t1; y < hA; y++) pix.p(x, y, y === t1 ? pal.morro1Luz : pal.morro1);
      const t2 = m2(x);
      for (let y = t2; y < hA; y++) pix.p(x, y, y === t2 ? pal.morro2Luz : (limiar(x, y) < 0.12 ? pal.morro2Luz : pal.morro2));
    }
  }

  /** Árvores da outra margem; devolve o perfil (topo por coluna) para o reflexo na água. */
  function desenharArvores(pix, W, hA, pal, rnd, info) {
    const topo = new Array(W).fill(hA);
    const esc = Math.max(1, hA / 40);
    const rio = info.rio;
    let x = -3;
    while (x < W + 4) {
      const r = Math.round((2 + rnd() * 3) * esc * 0.8 + 1);
      const pinheiro = rnd() < 0.22;
      const dentroDoRio = x > rio.x0 - r && x < rio.x1 + r;
      if (!dentroDoRio) {
        if (pinheiro) {
          const h = Math.round(r * 2.6);
          for (let j = 0; j < h; j++) {
            const meia = Math.round((j / h) * r);
            for (let i = -meia; i <= meia; i++) {
              const xx = x + i, yy = hA - h + j;
              pix.p(xx, yy, i > 0 ? (limiar(xx, yy) < 0.5 ? pal.arvoreMeio : pal.arvore) : pal.arvoreSombra);
              if (xx >= 0 && xx < W) topo[xx] = Math.min(topo[xx], yy);
            }
          }
        } else {
          const cy = hA - 1 - Math.round(r * 0.9);
          for (let yy = -r; yy <= r; yy++) for (let i = -r; i <= r; i++) {
            if (i * i + yy * yy > r * r) continue;
            const xx = x + i, py = cy + yy;
            if (py >= hA) continue;
            let c = pal.arvore;
            if (i > 0 && yy < 0 && (i - yy) > r * 0.9) c = limiar(xx, py) < 0.6 ? pal.arvoreLuz : pal.arvoreMeio;
            else if (i < 0 && yy > 0) c = pal.arvoreSombra;
            else if (limiar(xx, py) < 0.25) c = pal.arvoreMeio;
            pix.p(xx, py, c);
            if (xx >= 0 && xx < W) topo[xx] = Math.min(topo[xx], py);
          }
          for (let yy = cy + r; yy < hA; yy++) pix.p(x, yy, pal.arvoreSombra);
        }
      }
      x += Math.max(2, Math.round(r * (1.1 + rnd() * 0.6)));
    }
    // faixa de margem distante (areia e capim, iluminada pelo sol)
    for (let xx = 0; xx < W; xx++) {
      if (xx > rio.x0 && xx < rio.x1) continue;
      pix.p(xx, hA - 1, pal.margemLonge);
    }
    return topo;
  }

  function desenharCasinha(pix, x, hA, pal, esc) {
    const s = Math.max(1, Math.round(esc));
    const w = 7 * s, h = 5 * s, base = hA - 1;
    pix.rect(x, base - h, w, h, 0x8a5a3b);
    pix.rect(x, base - h, w, s, 0x6f4630);
    for (let j = 0; j <= 3 * s; j++) {                     // telhado: largo embaixo, estreito em cima
      for (let i = j - 1; i <= w - j; i++) pix.p(x + i, base - h - 1 - j, j === 0 ? 0x8f3530 : 0xb8463c);
    }
    pix.rect(x + 2 * s, base - h + 2 * s, s, s, 0xffd479);           // janela acesa
    pix.rect(x + 4 * s, base - 2 * s, s, 2 * s, 0x4a2f20);           // porta
    pix.rect(x + w - 2 * s, base - h - 3 * s, s, 2 * s, 0x5a4033);   // chaminé
    // píer até a água
    for (let i = 0; i < 9 * s; i++) pix.p(x + w + i, base, 0x7a5636);
    for (let i = 0; i < 9 * s; i += 3 * s) pix.p(x + w + i, base + 1, 0x4e341f);
    return { x: x + w - 2 * s, y: base - h - 3 * s };      // topo da chaminé (fumaça animada)
  }

  function desenharPonte(pix, rio, hA, pal, esc) {
    const s = Math.max(1, Math.round(esc));
    // entrada do rio (água clara entre as árvores)
    for (let x = rio.x0; x <= rio.x1; x++) for (let y = hA - 3 * s; y < hA; y++) pix.p(x, y, limiar(x, y) < 0.5 ? 0xa9c3cf : 0x86a7ba);
    // arco e tabuleiro
    const y0 = hA - 5 * s;
    for (let x = rio.x0 - s; x <= rio.x1 + s; x++) {
      pix.p(x, y0, 0x7a5233); pix.p(x, y0 + 1, 0x5a3b24);
      if ((x - rio.x0) % (3 * s) === 0) { pix.p(x, y0 - 1, 0x7a5233); pix.p(x, y0 - 2, 0x7a5233); }
      pix.p(x, y0 - 3, 0x8a6240);
      const u = (x - rio.x0) / Math.max(1, rio.x1 - rio.x0);
      const arco = Math.round(y0 + 2 + Math.sin(u * Math.PI) * 2 * s);
      if (u >= 0 && u <= 1) for (let y = y0 + 2; y < Math.min(hA, arco); y++) pix.p(x, y, 0x4e341f);
    }
  }

  function gerarCeu(W, hA, nomePaleta, info) {
    const pal = PALETAS[nomePaleta];
    const pix = new Pix(W, hA);
    const rnd = semente(20261112);
    desenharCeu(pix, W, hA, pal, info);
    desenharMorros(pix, W, hA, pal);
    const esc = Math.max(1, hA / 40);
    const topo = desenharArvores(pix, W, hA, pal, rnd, info);
    info.chamine = desenharCasinha(pix, Math.round(W * 0.16), hA, pal, esc * 0.8);
    desenharPonte(pix, info.rio, hA, pal, esc * 0.8);
    info.topoArvores = topo;
    return pix;
  }

  /** Nuvem em pixel art (textura pequena; ela anda devagar em VidaDoLago). */
  function gerarNuvem(w, h, pal, sem) {
    const rnd = semente(sem);
    const pix = new Pix(w, h);
    const bolhas = 3 + Math.floor(rnd() * 3);
    for (let i = 0; i < bolhas; i++) {
      const cx = Math.round(w * (0.2 + 0.6 * (i / Math.max(1, bolhas - 1)))), ry = Math.round(h * (0.25 + rnd() * 0.25));
      const rx = Math.round(w * (0.16 + rnd() * 0.1)), cy = h - ry - 1;
      for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
        if ((x * x) / (rx * rx) + (y * y) / (ry * ry) > 1) continue;
        pix.p(cx + x, cy + y, y > ry * 0.35 ? pal.nuvemSombra : pal.nuvem);
      }
    }
    return pix;
  }

  // ------------------------------------------------------------------ 2. água
  /**
   * z = limites das regiões em linhas da textura da água (0 = horizonte):
   *   { y22, y18, y14, fim }. colunas = x (pixels da arte) das boias, que ficam com o caminho limpo.
   */
  /** Cor da água num ponto. Os limites entre regiões ONDULAM (o) e se misturam com pontilhado e ruído. */
  function corDaAgua(y, x, z, o) {
    const faixa = (y0, y1, cores) => {
      const t = Math.max(0, Math.min(1, (y - y0) / Math.max(1, y1 - y0)));
      const u = t * (cores.length - 1), i = Math.min(cores.length - 2, Math.floor(u));
      return (u - i) > limiar(x, y) ? cores[i + 1] : cores[i];
    };
    const borda = 5;
    const misturar = (yb, cimaFn, baixoFn) => {
      const t = (y - (yb - borda)) / (2 * borda) + (ruido(x * 0.15, y * 0.4, 3) - 0.5) * 0.5;
      return t > limiar(x + 1, y) ? baixoFn() : cimaFn();
    };
    const b22 = z.y22 + o.a[x], b18 = z.y18 + o.b[x], b14 = z.y14 + o.c[x];
    // cada região clareia um pouco perto da vizinha: regiões distintas, sem degrau duro
    const poco = () => faixa(0, b22, [C.poco[0], C.poco[1], C.poco[2], C.pocoBorda]);
    const pedras = () => faixa(b22, b18, [C.pedras[0], C.pedras[1], C.pedrasBorda]);
    const lirios = () => faixa(b18, b14, C.lirios);
    const rasa = () => faixa(b14, z.fim, C.rasa);
    if (y < b22 - borda) return poco();
    if (y < b22 + borda) return misturar(b22, poco, pedras);
    if (y < b18 - borda) return pedras();
    if (y < b18 + borda) return misturar(b18, pedras, lirios);
    if (y < b14 - borda) return lirios();
    if (y < b14 + borda) return misturar(b14, lirios, rasa);
    return rasa();
  }

  function longeDasColunas(x, colunas, folga) { for (const c of colunas) if (Math.abs(x - c) < folga) return false; return true; }

  function gerarAgua(W, h, z, colunas, info) {
    const pix = new Pix(W, h);
    const rnd = semente(777);
    // limites ondulados (nada de faixa reta)
    const ond = (fase, amp) => Array.from({ length: W }, (_, x) => Math.round(amp * (1.4 * Math.sin(x * 0.045 + fase) + 0.8 * Math.sin(x * 0.12 + fase * 2.3))));
    const o = { a: ond(0.3, 1.2), b: ond(2.1, 1.1), c: ond(4.4, 1.3) };
    // base: profundidade + manchas suaves de luz e sombra
    for (let y = 0; y < h; y++) for (let x = 0; x < W; x++) {
      let c = corDaAgua(y, x, z, o);
      const n = ruido(x * 0.05, y * 0.22, 11);
      if (n > 0.68 && limiar(x, y) < 0.5) c = mistura(c, 0xffffff, 0.06);
      else if (n < 0.3 && limiar(x, y) < 0.5) c = escurecida(c, 0.09);
      pix.p(x, y, c);
    }
    // reflexo da outra margem logo abaixo do horizonte (só as árvores, discreto)
    const topo = info.topoArvores, hA = info.hA, R = Math.max(3, Math.round(z.y22 * 0.3));
    for (let y = 0; y < R; y++) for (let x = 0; x < W; x++) {
      const alturaArv = topo ? hA - topo[Math.min(W - 1, x)] : 0;
      const t = 1 - y / R;
      if (y < alturaArv * 0.6) pix.pd(x, y, escurecida(C.poco[0], 0.3), 0.5 * t + 0.25);
      else if (y < 2) pix.pd(x, y, C.reflexoAlto, 0.35);
    }
    // entrada do rio: só um leve clarão sob a ponte (a correnteza em si é animada em VidaDoLago)
    const rio = info.rio;
    for (let y = 0; y < Math.min(h, 5); y++) for (let x = rio.x0 - 2; x <= rio.x1 + 2; x++) pix.pd(x, y, mistura(C.poco[0], C.brilhoAgua, 0.3), 0.35 * (1 - y / 5));
    // brilho do sol (coluna de reflexos)
    for (let y = 1; y < z.y18; y += 2) {
      const larg = Math.round(info.sol.r * (0.6 + 1.4 * y / Math.max(1, z.y18)));
      for (let x = info.sol.x - larg; x <= info.sol.x + larg; x++) pix.pd(x, y, mistura(C.brilhoAgua, 0xffe2a0, 0.4), 0.2 * (1 - Math.abs(x - info.sol.x) / (larg + 1)));
    }
    // poço: manchas escuras e troncos submersos
    for (let i = 0; i < 4; i++) {
      const cx = Math.round(rnd() * W), cy = Math.round(z.y22 * (0.35 + rnd() * 0.5));
      pix.elipse(cx, cy, 6 + rnd() * 10, 1.5 + rnd() * 2, escurecida(C.poco[2], 0.25), 0.5);
    }
    info.troncos = [];
    for (let i = 0; i < 2; i++) {
      let x0 = Math.round(W * (0.12 + i * 0.5 + rnd() * 0.25));
      if (!longeDasColunas(x0, colunas, 10)) x0 += 14;
      const y0 = Math.round(z.y22 * (0.45 + rnd() * 0.35)), comp = 10 + Math.round(rnd() * 8);
      for (let k = 0; k < comp; k++) { pix.p(x0 + k, y0 + Math.round(k * 0.25), C.troncoAgua); pix.p(x0 + k, y0 + 1 + Math.round(k * 0.25), C.troncoAgua); }
      pix.linha(x0 + 4, y0, x0 + 2, y0 - 3, C.troncoAgua);
      info.troncos.push({ x: x0 + comp / 2, y: y0 });
    }
    // curva das pedras: pedras submersas
    for (let i = 0; i < 7; i++) {
      const cx = Math.round(rnd() * W), cy = Math.round(z.y22 + (z.y18 - z.y22) * (0.2 + rnd() * 0.7));
      if (!longeDasColunas(cx, colunas, 6)) continue;
      pix.elipse(cx, cy, 2 + rnd() * 3, 1 + rnd(), C.pedraAgua, 0.8);
    }
    // margem rasa: fundo de areia visto através da água (manchas orgânicas, mais perto = mais areia)
    const y0Areia = Math.round(z.y14 + (h - z.y14) * 0.3);
    for (let y = y0Areia; y < h; y++) {
      const t = (y - y0Areia) / Math.max(1, h - y0Areia);
      for (let x = 0; x < W; x++) {
        const n = ruido(x * 0.09, y * 0.3, 21);
        if (n < 0.1 + 0.5 * t) {
          const agua = pix.cor(x, y);
          const areia = n < 0.05 + 0.3 * t && limiar(x, y) < 0.5 ? C.areiaClara : C.areia;
          pix.p(x, y, mistura(agua, areia, 0.25 + 0.35 * t));
        }
      }
    }
    const nSeixos = Math.round(W * (h - z.y14) * 0.015);
    for (let i = 0; i < nSeixos; i++) {
      const x = Math.round(rnd() * W), y = Math.round(z.y14 + 2 + rnd() * (h - z.y14 - 3));
      pix.p(x, y, rnd() < 0.5 ? C.seixo : C.seixoClaro);
      if (rnd() < 0.3) pix.p(x + 1, y, C.seixo);
    }
    // plantas aquáticas (tufos que balançam são desenhados em VidaDoLago; aqui a base)
    info.algas = [];
    for (let i = 0; i < Math.round(W / 18); i++) {
      const x = Math.round(rnd() * W);
      if (!longeDasColunas(x, colunas, 7)) continue;
      const y = Math.round(z.y14 + (h - z.y14) * (0.35 + rnd() * 0.6)), alt = 3 + Math.round(rnd() * 5);
      for (let j = 0; j < alt; j++) pix.p(x + Math.round(Math.sin(j * 0.9 + i) * 0.6), y - j, j > alt * 0.6 ? C.algaClara : C.alga);
      info.algas.push({ x, y, alt });
    }
    // lírios: caules sob as folhas (as folhas vêm na superfície)
    for (const f of info.lirios) for (let j = 1; j < 4; j++) pix.pd(f.x, f.y + f.ry + j, escurecida(C.lirios[1], 0.3), 0.6);
    return pix;
  }

  function gerarSuperficie(W, h, z, colunas, info) {
    const pix = new Pix(W, h);
    const rnd = semente(4242);
    // vitórias-régias na Baía dos Lírios (fora do caminho das boias)
    for (const f of info.lirios) {
      const { x, y, rx, ry } = f;
      for (let yy = -ry; yy <= ry; yy++) for (let xx = -rx; xx <= rx; xx++) {
        const d = (xx * xx) / (rx * rx) + (yy * yy) / (ry * ry);
        if (d > 1) continue;
        // corte da folha (fatia)
        const ang = Math.atan2(yy, xx);
        if (Math.abs(ang - f.corte) < 0.28 && d > 0.05) continue;
        let c = C.lirio;
        if (d > 0.72 && yy >= 0) c = C.lirioEscuro;
        else if (xx < 0 && yy < 0 && d < 0.6) c = limiar(x + xx, y + yy) < 0.5 ? C.lirioLuz : C.lirio;
        pix.p(x + xx, y + yy, c);
      }
      if (f.flor) {
        pix.p(x - 1, y - 1, C.flor); pix.p(x, y - 1, C.florClara); pix.p(x + 1, y - 1, C.flor);
        pix.p(x, y - 2, C.flor); pix.p(x, y - 1, C.miolo);
      }
    }
    // pedras com musgo e espuma na Curva das Pedras
    info.pedras = [];
    let tentativas = 0;
    while (info.pedras.length < 6 && tentativas++ < 60) {
      const x = Math.round(rnd() * W);
      if (!longeDasColunas(x, colunas, 9)) continue;
      const y = Math.round(z.y22 + (z.y18 - z.y22) * (0.3 + rnd() * 0.6));
      const rx = 2 + Math.round(rnd() * 3), ry = 1 + Math.round(rnd() * 2);
      for (let yy = -ry * 2; yy <= 0; yy++) for (let xx = -rx; xx <= rx; xx++) {
        if ((xx * xx) / (rx * rx) + (yy * yy) / (4 * ry * ry) > 1) continue;
        let c = C.pedra;
        if (yy < -ry * 1.3) c = limiar(x + xx, y + yy) < 0.6 ? C.musgo : C.pedraLuz;
        else if (xx > rx * 0.4) c = C.pedraSombra;
        else if (xx < 0 && yy < -ry * 0.5) c = C.pedraLuz;
        pix.p(x + xx, y + yy, c);
      }
      for (let xx = -rx - 1; xx <= rx + 1; xx++) pix.pd(x + xx, y + 1, C.espuma, 0.7);
      for (let k = 1; k < 6; k++) pix.pd(x - rx - k, y + (k % 2), C.espuma, 0.5 - k * 0.08);     // esteira da correnteza (para a esquerda)
      info.pedras.push({ x, y, rx });
    }
    // juncos e taboas nas pontas da margem rasa
    for (const lado of [0, 1]) {
      for (let i = 0; i < 6; i++) {
        const x = lado ? W - 2 - Math.round(rnd() * W * 0.06) : 1 + Math.round(rnd() * W * 0.06);
        const base = h - 1 - Math.round(rnd() * 3), alt = 6 + Math.round(rnd() * 10);
        for (let j = 0; j < alt; j++) pix.p(x, base - j, j > alt * 0.7 ? C.juncoClaro : C.junco);
        if (rnd() < 0.6) { pix.rect(x, base - alt - 3, 1, 3, C.taboa); pix.p(x, base - alt - 4, C.junco); }
      }
    }
    // galho seco saindo do poço
    const gx = Math.round(W * 0.47), gy = Math.round(z.y22 * 0.7);
    if (longeDasColunas(gx, colunas, 6)) { pix.linha(gx, gy, gx + 3, gy - 6, C.galho); pix.linha(gx + 2, gy - 4, gx + 5, gy - 6, C.galho); pix.pd(gx - 1, gy + 1, C.espuma, 0.6); pix.pd(gx + 1, gy + 1, C.espuma, 0.6); }
    // folhas boiando
    for (let i = 0; i < 6; i++) {
      const x = Math.round(rnd() * W), y = Math.round(z.y22 + rnd() * (h - z.y22 - 4));
      if (!longeDasColunas(x, colunas, 5)) continue;
      pix.p(x, y, C.folha); pix.p(x + 1, y, C.folhaClara);
    }
    return pix;
  }

  // ------------------------------------------------------------------ 3. primeiro plano
  function gerarMargem(W, h, borda, info) {
    const pix = new Pix(W, h);
    const rnd = semente(9091);
    // perfil irregular da beira (passeio aleatório suave + morrotes)
    const perfil = new Array(W);
    let v = 0;
    for (let x = 0; x < W; x++) {
      v += (rnd() - 0.5) * 0.9; v = Math.max(-2.5, Math.min(2.5, v)) * 0.96;
      const morrote = 1.6 * Math.sin(x * 0.045 + 0.4) + 0.8 * Math.sin(x * 0.13 + 2);
      perfil[x] = Math.round(borda + v + morrote);
    }
    info.perfil = perfil;
    // terra batida onde os pescadores pisam e onde fica a manta; o resto é capim
    const clareiras = info.personagens.map((ps) => ({ x: ps.x, y: ps.pe - Math.round(ps.larg * 0.06), rx: ps.larg * 0.5, ry: Math.max(4, ps.larg * 0.16) }));
    const dentroDaClareira = (x, y) => {
      for (const c of clareiras) {
        const d = ((x - c.x) * (x - c.x)) / (c.rx * c.rx) + ((y - c.y) * (y - c.y)) / (c.ry * c.ry);
        if (d + (ruido(x * 0.3, y * 0.3, 8) - 0.5) * 0.6 < 1) return true;
      }
      return false;
    };
    for (let x = 0; x < W; x++) {
      const t0 = perfil[x];
      for (let y = Math.max(0, t0); y < h; y++) {
        const d = y - t0;
        const prof = d / Math.max(1, h - t0);
        let c;
        if (d === 0) c = C.lama;
        else if (d === 1) c = C.areiaMolhada;
        else if (dentroDaClareira(x, y)) {
          const n = ruido(x * 0.18, y * 0.3, 14);
          c = n > 0.62 ? C.terraClara : n < 0.3 ? C.terraEscura : C.terra;
        } else {
          // capim: variação miúda e de pouco contraste + folhinhas; mais luz perto da água
          const n = ruido(x * 0.16, y * 0.4, 31) * 0.6 + ruido(x * 0.04, y * 0.1, 32) * 0.4;
          c = n > 0.6 ? C.gramaClara : n < 0.38 ? C.gramaEscura : C.grama;
          if (d <= 3) c = C.gramaClara;
          const folha = hash2(x, y, 77);
          if (folha < 0.06) c = C.gramaFolha;
          else if (folha > 0.95 && prof < 0.5) c = C.gramaLuz;
          if (limiar(x, y) < prof * 0.28) c = escurecida(c, 0.14);      // mais escuro perto da câmera
        }
        pix.p(x, y, c);
      }
      // capim passando da beira (na água)
      if (rnd() < 0.35) { const a = 1 + Math.round(rnd() * 2); for (let j = 1; j <= a; j++) pix.p(x, t0 + 1 - j, j === a ? C.gramaClara : C.grama); }
    }
    // tufos de capim (3 folhas) espalhados
    for (let i = 0; i < Math.round(W * 0.22); i++) {
      const x = Math.round(rnd() * W), y = Math.round(perfil[Math.min(W - 1, x)] + 5 + rnd() * (h - perfil[Math.min(W - 1, x)] - 6));
      if (dentroDaClareira(x, y)) continue;
      pix.p(x - 1, y - 1, C.gramaClara); pix.p(x, y - 2, C.gramaClara); pix.p(x + 1, y - 1, C.gramaClara); pix.p(x, y - 1, C.grama);
    }
    // pedrinhas na terra batida
    for (let i = 0; i < Math.round(W * 0.2); i++) {
      const x = Math.round(rnd() * W), y = Math.round(perfil[Math.min(W - 1, x)] + 6 + rnd() * (h - perfil[Math.min(W - 1, x)] - 8));
      if (!dentroDaClareira(x, y)) continue;
      pix.p(x, y, rnd() < 0.4 ? C.pedrinhaClara : C.pedrinha); if (rnd() < 0.5) pix.p(x + 1, y, C.pedrinha); pix.p(x, y + 1, C.terraEscura);
    }
    // raízes expostas só no barranco molhado da beira
    for (let i = 0; i < Math.round(W / 40); i++) {
      let x = Math.round(rnd() * W);
      const y = perfil[Math.min(W - 1, x)];
      for (let k = 0; k < 3 + rnd() * 3; k++) { pix.p(x, y + (k % 2), C.raiz); x += 1; }
    }
    for (let i = 0; i < Math.round(W / 9); i++) {
      const x = Math.round(rnd() * W), y = perfil[Math.min(W - 1, x)] + 2 + Math.round(rnd() * 3);
      pix.p(x, y, rnd() < 0.5 ? C.florAmarela : C.florBranca);
    }
    // sombras sob os pescadores
    for (const ps of info.personagens) {
      const cy = ps.pe, rx = Math.round(ps.larg * 0.36), ry = Math.max(2, Math.round(ps.larg * 0.07));
      for (let yy = -ry; yy <= ry; yy++) for (let xx = -rx; xx <= rx; xx++) {
        const d = (xx * xx) / (rx * rx) + (yy * yy) / (ry * ry);
        if (d <= 1 && limiar(ps.x + xx, cy + yy) < 0.85 - d * 0.4) pix.escurecer(ps.x + xx, cy + yy, 0.35);
      }
    }
    // equipamentos
    for (const e of info.equipamentos) {
      const x = e.x, y = e.y;
      if (e.tipo === 'caixa') {
        pix.rect(x, y - 5, 10, 5, C.caixa); pix.rect(x, y - 5, 10, 1, C.caixaEscura); pix.rect(x, y - 1, 10, 1, C.caixaEscura);
        pix.p(x + 5, y - 4, C.dourado); pix.rect(x + 3, y - 7, 4, 1, C.caixaEscura); pix.p(x + 3, y - 6, C.caixaEscura); pix.p(x + 6, y - 6, C.caixaEscura);
        pix.rect(x, y, 10, 1, C.terraEscura);
      } else if (e.tipo === 'balde') {
        for (let j = 0; j < 6; j++) for (let i = -3 + Math.floor(j / 3); i <= 3 - Math.floor(j / 3); i++) pix.p(x + i, y - 6 + j, i > 1 ? C.baldeEscuro : C.balde);
        pix.rect(x - 3, y - 6, 7, 1, 0xc7d0d4); pix.rect(x - 2, y - 7, 5, 1, 0x2a3a40);
        pix.linha(x - 3, y - 7, x, y - 10, C.baldeEscuro); pix.linha(x, y - 10, x + 3, y - 7, C.baldeEscuro);
        pix.rect(x - 3, y, 7, 1, C.terraEscura);
      } else if (e.tipo === 'garrafa') {
        pix.rect(x, y - 6, 2, 6, C.garrafa); pix.rect(x, y - 4, 2, 1, C.garrafaClara); pix.rect(x, y - 7, 2, 1, 0x333333);
        pix.p(x + 2, y, C.terraEscura);
      } else if (e.tipo === 'manta') {
        // manta xadrez em perspectiva + cestinho do Sirius (sem rosto: só a mantinha azul aparecendo)
        const mw = e.w, mh = Math.max(4, Math.round(e.w * 0.22));
        for (let j = 0; j < mh; j++) for (let i = 0; i < mw; i++) {
          const xadrez = (Math.floor(i / 3) + Math.floor(j / 2)) % 2;
          pix.p(x + i - Math.round(j * 0.4), y - mh + j, xadrez ? C.manta : C.mantaClara);
        }
        for (let i = 0; i < mw; i++) pix.p(x + i - Math.round(mh * 0.4), y, C.terraEscura);
        const bx = x + Math.round(mw * 0.6), by = y - Math.round(mh * 0.4);
        pix.rect(bx, by - 4, 9, 4, C.vime);
        for (let i = 0; i < 9; i += 2) pix.p(bx + i, by - 3, C.vimeEscuro);
        pix.rect(bx, by - 1, 9, 1, C.vimeEscuro);
        pix.rect(bx + 1, by - 5, 7, 1, C.mantinha); pix.p(bx + 2, by - 6, C.mantinha); pix.p(bx + 5, by - 6, 0x5a7fd0);
        pix.linha(bx, by - 4, bx + 4, by - 8, C.vimeEscuro); pix.linha(bx + 4, by - 8, bx + 8, by - 4, C.vimeEscuro);
        info.cestinho = { x: bx + 4, y: by - 6 };
        // garrafa térmica ao lado
        pix.rect(x + 2, y - mh - 5, 2, 5, 0x3f7f9f); pix.rect(x + 2, y - mh - 6, 2, 1, 0xdddddd);
      }
    }
    return pix;
  }

  // ------------------------------------------------------------------ API
  /**
   * Gera todas as camadas para um layout.
   * g = { W, H, P, horizonte, margem, y22, y18, y14, colunas[], personagens[{x, pe, larg}], equipamentos[], manta{x}, solo }
   * (em pixels do aparelho). Devolve as telas (canvas) e as informações para as animações.
   */
  function gerar(g) {
    const P = g.P;
    const W = Math.ceil(g.W / P), hA = Math.max(8, Math.round(g.horizonte / P));
    const bordaA = Math.round(g.margem / P);
    const hAgua = Math.max(8, bordaA - hA + 4);
    const sobra = 6;                                          // linhas acima da beira (capim e perfil irregular)
    const hMargem = Math.ceil(g.H / P) - bordaA + sobra;
    const colunas = g.colunas.map((x) => Math.round(x / P));
    const info = {
      P, W, hA, bordaA,
      sol: { x: Math.round(W * 0.7), y: hA - Math.max(6, Math.round(hA * 0.46)), r: Math.max(3, Math.round(hA * 0.1)) },
      rio: { x0: Math.round(W * 0.86), x1: Math.round(W * 0.86) + Math.max(8, Math.round(W * 0.04)) }
    };
    const ceu = gerarCeu(W, hA, 'tarde', info);
    const infoPor = Object.assign({}, info);
    const ceuPor = gerarCeu(W, hA, 'por', infoPor);
    const z = {
      y22: Math.round(g.y22 / P) - hA, y18: Math.round(g.y18 / P) - hA, y14: Math.round(g.y14 / P) - hA, fim: hAgua
    };
    // vitórias-régias: posições usadas pela água (caules) e pela superfície (folhas)
    const rnd = semente(1311);
    info.lirios = [];
    let tent = 0;
    while (info.lirios.length < Math.round(W / 14) && tent++ < 200) {
      const x = Math.round(rnd() * W);
      if (!longeDasColunas(x, colunas, 8)) continue;
      const y = Math.round(z.y18 + (z.y14 - z.y18) * (0.15 + rnd() * 0.75));
      const rx = 3 + Math.round(rnd() * 3), ry = Math.max(1, Math.round(rx * 0.42));
      if (info.lirios.some((f) => Math.abs(f.x - x) < f.rx + rx + 1 && Math.abs(f.y - y) < f.ry + ry + 1)) continue;
      info.lirios.push({ x, y, rx, ry, corte: rnd() * Math.PI * 2 - Math.PI, flor: rnd() < 0.3 });
    }
    const agua = gerarAgua(W, hAgua, z, colunas, info);
    const superficie = gerarSuperficie(W, hAgua, z, colunas, info);
    info.personagens = g.personagens.map((p) => ({ x: Math.round(p.x / P), pe: Math.round(p.pe / P) - bordaA + sobra, larg: Math.round(p.larg / P) }));
    info.equipamentos = (g.equipamentos || []).map((e) => Object.assign({}, e, { x: Math.round(e.x / P), y: Math.round(e.y / P) - bordaA + sobra, w: e.w ? Math.round(e.w / P) : 0 }));
    const margem = gerarMargem(W, hMargem, sobra, info);
    const nuvens = [0, 1, 2].map((i) => gerarNuvem(Math.max(12, Math.round(W * (0.09 + i * 0.03))), Math.max(5, Math.round(hA * 0.2)), PALETAS.tarde, 50 + i));
    return {
      P, info, z,
      camadas: {
        ceu: { tela: ceu.canvas(), x: 0, y: 0 },
        ceuPor: { tela: ceuPor.canvas(), x: 0, y: 0 },
        agua: { tela: agua.canvas(), x: 0, y: hA * P },
        superficie: { tela: superficie.canvas(), x: 0, y: hA * P },
        margem: { tela: margem.canvas(), x: 0, y: (bordaA - sobra) * P }
      },
      nuvens: nuvens.map((n) => n.canvas()),
      // para as animações: posições em pixels do aparelho
      pos: {
        cestinho: info.cestinho ? { x: info.cestinho.x * P, y: (info.cestinho.y + bordaA - sobra) * P } : null,
        chamine: info.chamine ? { x: info.chamine.x * P, y: info.chamine.y * P } : null,
        sol: { x: info.sol.x * P, y: info.sol.y * P, r: info.sol.r * P },
        rio: { x0: info.rio.x0 * P, x1: info.rio.x1 * P, y: hA * P },
        pedras: (info.pedras || []).map((p) => ({ x: p.x * P, y: (p.y + hA) * P, rx: p.rx * P })),
        algas: (info.algas || []).map((a) => ({ x: a.x * P, y: (a.y + hA) * P, alt: a.alt * P })),
        lirios: info.lirios.map((f) => ({ x: f.x * P, y: (f.y + hA) * P, rx: f.rx * P, flor: f.flor })),
        troncos: (info.troncos || []).map((t) => ({ x: t.x * P, y: (t.y + hA) * P })),
        perfil: info.perfil ? info.perfil.map((y) => (y + bordaA - sobra) * P) : null
      }
    };
  }

  root.HF = root.HF || {};
  root.HF.Cenario = { gerar, PALETAS, CORES: C, semente, limiar };
})(typeof window !== 'undefined' ? window : globalThis);
