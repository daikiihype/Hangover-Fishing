/*
 * Hangover Fishing — versão jogável
 * Recortes: usa a arte do criador (JPEG com o xadrez DESENHADO dentro da imagem) sem
 * alterar nenhum arquivo. Na carga do jogo, cada elemento é copiado para um canvas na
 * memória e o xadrez é removido por um preenchimento a partir das bordas do recorte:
 * só pixels claros e pouco saturados, conectados à borda, viram transparentes. O contorno
 * escuro dos desenhos protege o interior (inclusive partes brancas).
 *
 * Coordenadas medidas em 12/11/2026 por análise de componentes das folhas originais.
 */
(function (root) {
  'use strict';

  // [x, y, largura, altura] na folha original; cabeca = lado da cabeça do peixe no desenho
  const RECORTES = {
    // arte 3.jpg — peixes com nome (folha do criador)
    peixe_tilapia: { folha: 'arte3', r: [18, 66, 207, 114], cabeca: 'esq' },
    peixe_carpa: { folha: 'arte3', r: [237, 72, 188, 105], cabeca: 'esq' },
    peixe_traira: { folha: 'arte3', r: [437, 93, 170, 77], cabeca: 'dir' },
    peixe_bagre: { folha: 'arte3', r: [619, 85, 150, 81], cabeca: 'dir' },
    peixe_lambari: { folha: 'arte3', r: [781, 98, 97, 57], cabeca: 'dir' },
    peixe_tucunare: { folha: 'arte3', r: [20, 474, 228, 107], cabeca: 'dir' },
    peixe_dourado: { folha: 'arte3', r: [266, 469, 232, 117], cabeca: 'dir' },
    // arte 2.jpg — objetos e iscas
    objeto_bota: { folha: 'arte2', r: [6, 933, 117, 110] },
    objeto_pneu: { folha: 'arte2', r: [130, 922, 114, 121] },
    objeto_lata: { folha: 'arte2', r: [261, 926, 86, 114] },
    isca_minhoca: { folha: 'arte2', r: [17, 476, 105, 88] },
    isca_artificial: { folha: 'arte2', r: [276, 472, 45, 100] },
    // logo.jpg — selo inteiro
    logo: { folha: 'logo', r: [9, 100, 878, 1021] }
  };

  // Retratos de expressão para os diálogos (folhas do criador; medidos em 12/11/2026).
  // Alemão e ALE: os bustos encostam pelos ombros, então o recorte pega cabeça e pescoço
  // dentro da faixa de cada busto (faixas da auditoria de assets). Os retratos do Sirius de
  // óculos/"Magic by birth" NÃO são usados (referência a propriedade intelectual de terceiros).
  const ROSTOS = {
    alemao: { folha: 'alemao_rosto', y: 586, w: 132, h: 150, centros: { serio: 88, rindo: 243, preocupado: 381, bravo: 519, surpreso: 677 } },
    ale: { folha: 'ale_rosto', y: 586, w: 132, h: 150, centros: { neutro: 90, surpreso: 241, irritado: 381, gargalhada: 523, frustrado: 682 } }
  };
  for (const [p, def] of Object.entries(ROSTOS)) {
    for (const [emo, cx] of Object.entries(def.centros)) RECORTES['rosto_' + p + '_' + emo] = { folha: def.folha, r: [cx - def.w / 2, def.y, def.w, def.h] };
  }
  Object.assign(RECORTES, {
    rosto_maria_feliz: { folha: 'maria_sirius', r: [62, 52, 210, 215] },
    rosto_maria_surpresa: { folha: 'maria_sirius', r: [62, 388, 210, 215] },
    rosto_maria_preocupada: { folha: 'maria_sirius', r: [62, 724, 210, 215] },
    rosto_maria_seria: { folha: 'maria_sirius', r: [62, 1061, 210, 215] },
    rosto_sirius_manta: { folha: 'maria_sirius', r: [462, 50, 200, 200] },
    rosto_sirius_sorrindo: { folha: 'maria_sirius', r: [466, 395, 200, 200] }
  });

  /** Emoção da fala → retrato disponível de cada personagem. */
  const EMOCOES = {
    alemao: { neutro: 'serio', serio: 'serio', feliz: 'rindo', rindo: 'rindo', surpreso: 'surpreso', preocupado: 'preocupado', triste: 'preocupado', bravo: 'bravo', frustrado: 'bravo' },
    ale: { neutro: 'neutro', serio: 'irritado', feliz: 'neutro', rindo: 'gargalhada', surpreso: 'surpreso', preocupado: 'frustrado', triste: 'frustrado', bravo: 'irritado', frustrado: 'frustrado' },
    maria: { neutro: 'feliz', serio: 'seria', feliz: 'feliz', rindo: 'feliz', surpreso: 'surpresa', preocupado: 'preocupada', triste: 'preocupada', bravo: 'seria', frustrado: 'preocupada' },
    sirius: { neutro: 'manta', curioso: 'manta', feliz: 'sorrindo', rindo: 'sorrindo', surpreso: 'manta', protesto: 'manta', sono: 'manta', choro: 'manta' }
  };
  function rosto(pessoa, emo) {
    const m = EMOCOES[pessoa] || {};
    return 'rosto_' + pessoa + '_' + (m[emo] || m.neutro);
  }

  function claroNeutro(d, i) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    return mn > 172 && mx - mn < 30;
  }

  /** Copia o retângulo (com 3 px de folga) e remove o fundo xadrez ligado à borda. */
  function recortar(img, r) {
    const pad = 3;
    const x0 = Math.max(0, r[0] - pad), y0 = Math.max(0, r[1] - pad);
    const w = Math.min(img.width - x0, r[2] + pad * 2), h = Math.min(img.height - y0, r[3] + pad * 2);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, x0, y0, w, h, 0, 0, w, h);
    const im = ctx.getImageData(0, 0, w, h), d = im.data;
    const fundo = new Uint8Array(w * h), pilha = [];
    for (let x = 0; x < w; x++) pilha.push(x, (h - 1) * w + x);
    for (let y = 0; y < h; y++) pilha.push(y * w, y * w + w - 1);
    while (pilha.length) {
      const k = pilha.pop();
      if (fundo[k] || !claroNeutro(d, k * 4)) continue;
      fundo[k] = 1;
      const px = k % w, py = (k / w) | 0;
      if (px > 0) pilha.push(k - 1);
      if (px < w - 1) pilha.push(k + 1);
      if (py > 0) pilha.push(k - w);
      if (py < h - 1) pilha.push(k + w);
    }
    // borda: pixels claros encostados no fundo também saem (franja do JPEG)
    const franja = [];
    for (let k = 0; k < w * h; k++) {
      if (fundo[k]) continue;
      const px = k % w, py = (k / w) | 0;
      const viz = (px > 0 && fundo[k - 1]) || (px < w - 1 && fundo[k + 1]) || (py > 0 && fundo[k - w]) || (py < h - 1 && fundo[k + w]);
      if (!viz) continue;
      const i = k * 4, mn = Math.min(d[i], d[i + 1], d[i + 2]), mx = Math.max(d[i], d[i + 1], d[i + 2]);
      if (mn > 150 && mx - mn < 40) franja.push(k);
    }
    for (const k of franja) fundo[k] = 1;
    for (let k = 0; k < w * h; k++) if (fundo[k]) d[k * 4 + 3] = 0;
    ctx.putImageData(im, 0, 0);
    return c;
  }

  /** Cabeça do personagem (retrato do diálogo) a partir do quadro 1 do IDLE aprovado. */
  function retrato(fonte) {
    const c = document.createElement('canvas');
    c.width = 26; c.height = 26;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(fonte, 34, 31, 26, 26, 0, 0, 26, 26);
    return c;
  }

  /** Ícones desenhados em código para as iscas que não existem nas folhas (pixel art 16 × 16). */
  function iconeDesenhado(tipo) {
    const c = document.createElement('canvas');
    c.width = 16; c.height = 16;
    const ctx = c.getContext('2d');
    const px = (x, y, cor) => { ctx.fillStyle = cor; ctx.fillRect(x, y, 1, 1); };
    const mapa = {
      massa: ['................', '................', '.....######.....', '....#oooooo#....', '...#oOOOooooo#..',
        '..#oOOooooooo#..', '..#oOooooo.ooo#.', '..#ooooooooooo#.', '..#oooo.oooooo#.', '..#ooooooooo.o#.',
        '...#oooooooooo#.', '....#oooooooo#..', '.....########...', '................', '................', '................'],
      coracao: ['................', '................', '....###..###....', '...#rrr##rrr#...', '..#rRRrrrrrrr#..',
        '..#rRrrrrrrrr#..', '..#rrrrrrrrrr#..', '...#rrrrrrrr#...', '....#rrrrrr#....', '.....#rrrr#.....',
        '......#rr#......', '.......##.......', '................', '................', '................', '................']
    };
    const cores = { '#': '#3b2418', o: '#f2d79a', O: '#fff3cf', r: '#b8323a', R: '#e8707a' };
    mapa[tipo].forEach((linha, y) => [...linha].forEach((ch, x) => { if (cores[ch]) px(x, y, cores[ch]); }));
    return c;
  }

  /**
   * Cria todas as texturas (Phaser) e imagens (DOM, dataURL) a partir das folhas carregadas.
   * folhas = { arte2: HTMLImageElement, arte3: ..., logo: ... }
   */
  function criar(scene, folhas, personagens) {
    const urls = {};
    for (const [chave, def] of Object.entries(RECORTES)) {
      const c = recortar(folhas[def.folha], def.r);
      scene.textures.addCanvas(chave, c);
      urls[chave] = c.toDataURL('image/png');
    }
    for (const tipo of ['massa', 'coracao']) {
      const c = iconeDesenhado(tipo);
      scene.textures.addCanvas('isca_' + tipo, c).setFilter(root.Phaser.Textures.FilterMode.NEAREST);
      urls['isca_' + tipo] = c.toDataURL('image/png');
    }
    for (const p of personagens) {
      const c = retrato(scene.textures.get(p + '_idle').getSourceImage());
      scene.textures.addCanvas('retrato_' + p, c).setFilter(root.Phaser.Textures.FilterMode.NEAREST);
      urls['retrato_' + p] = c.toDataURL('image/png');
    }
    return urls;
  }

  root.HF = root.HF || {};
  root.HF.Recortes = { RECORTES, EMOCOES, recortar, criar, rosto };
})(window);
