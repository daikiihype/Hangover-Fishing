/*
 * Hangover Fishing — Operação Nova Identidade
 * VidaDoLago: o que se mexe no cenário. Discreto, barato e longe de competir com a pescaria.
 *
 *   - água: brilhos que deslizam, correnteza na Curva das Pedras, reflexos do sol, ondulações;
 *   - margem: juncos e capim balançando, insetos, vagalumes no entardecer;
 *   - céu: nuvens, fumaça da chaminé, pássaros de vez em quando;
 *   - peixes ao fundo, menores e mais escuros quanto mais longe e mais fundo;
 *   - eventos raros do mundo (peixe saltando, cardume, objeto boiando, chuva leve, entardecer),
 *     que avisam a narrativa (comentários) por um callback;
 *   - sinais dos pontos de interesse e do estado do Sirius (saindo do cestinho, sem rosto).
 *
 * Usa o relógio de JOGO (dt = 0 na pausa) e um sorteio próprio: não toca na pescaria.
 */
(function (root) {
  'use strict';

  const HF = root.HF;
  // glifos em pixel art (1 = pixel aceso)
  const GLIFOS = {
    z: ['111', '001', '010', '100', '111'],
    nota: ['0110', '0101', '0100', '1100', '1100'],
    ex: ['1', '1', '1', '0', '1'],
    pt: ['1']
  };

  function sorteador(s) {
    let a = s >>> 0;
    return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const lerp = (a, b, t) => a + (b - a) * t;

  class VidaDoLago {
    constructor(cena, opts) {
      opts = opts || {};
      this.cena = cena;
      this.rnd = opts.random || sorteador((Date.now() ^ 0x5eed) >>> 0);
      this.gCeu = cena.add.graphics().setDepth(-28);
      this.gAgua = cena.add.graphics().setDepth(-22);
      this.gMargem = cena.add.graphics().setDepth(-20);
      this.gFrente = cena.add.graphics().setDepth(-4.5);
      this.gLuz = cena.add.graphics().setDepth(-0.5);
      this.gChuva = cena.add.graphics().setDepth(2);
      this.nuvens = [];
      this.peixes = [];
      this.t = 0;
      this.luz = opts.entardecer ? 1 : 0;           // 0 = tarde · 1 = pôr do sol
      this.luzFixa = !!opts.entardecer;
      this.entardecerAvisado = this.luz >= 0.5;
      this.aoEvento = null;
      this.eventos = [];                             // salto, cardume, objeto, passaro
      this.ondas = [];
      this.chuva = null;
      this.ultimaChuva = -Infinity;
      this.prox = { salto: this._entre(25000, 50000), cardume: this._entre(45000, 90000), objeto: this._entre(70000, 140000),
        passaro: this._entre(20000, 50000), onda: this._entre(1500, 4000), chuva: 300000 };
    }

    _entre(a, b) { return a + this.rnd() * (b - a); }

    // ------------------------------------------------------------------ layout
    /** cen = resultado de HF.Cenario.gerar; L = layout da cena (com distY e lados). */
    layout(cen, L) {
      this.cen = cen; this.L = L; this.P = cen.P;
      const P = this.P, W = L.W, rnd = sorteador(99);
      // brilhos da água (posições fixas em pixels da arte; deslizam com o tempo)
      const Wa = Math.ceil(W / P), y0 = Math.round(L.horizonte / P), y1 = Math.round(L.bankTop / P);
      const y22 = Math.round(this.cena.distY(22) / P), y18 = Math.round(this.cena.distY(18) / P);
      this.brilhos = [];
      const n = Math.round(Wa * 0.35);
      for (let i = 0; i < n; i++) {
        const u = Math.pow(rnd(), 1.6);                         // mais perto do horizonte
        const y = Math.round(y0 + 1 + u * (y1 - y0 - 3));
        const corrente = y > y22 && y < y18;
        this.brilhos.push({ x0: rnd() * Wa, y, len: corrente ? 3 + Math.round(rnd() * 4) : 1 + Math.round(rnd() * 3),
          v: corrente ? -(6 + rnd() * 6) : (rnd() - 0.5) * 1.2, fase: rnd() * 6.28, corrente });
      }
      // correnteza saindo do rio (sob a ponte) para a esquerda
      this.correntes = [];
      for (let i = 0; i < 10; i++) this.correntes.push({ fase: rnd(), y: lerp(y22 + 1, y18 - 1, rnd()), len: 4 + Math.round(rnd() * 6), v: 0.05 + rnd() * 0.05 });
      this.y22 = y22; this.y18 = y18; this.Wa = Wa; this.yH = y0; this.yB = y1;
      // juncos e capim que balançam (na frente)
      this.juncos = [];
      for (const lado of (L.solo ? [0, 1] : [0, 1])) for (let i = 0; i < 4; i++) {
        this.juncos.push({ x: lado ? Wa - 3 - Math.round(rnd() * Wa * 0.05) : 2 + Math.round(rnd() * Wa * 0.05), base: y1 + 1, alt: 7 + Math.round(rnd() * 8), fase: rnd() * 6.28 });
      }
      this.tufos = [];
      const Ha = Math.ceil(L.H / P);
      for (let i = 0; i < Math.round(Wa / 26); i++) this.tufos.push({ x: Math.round(rnd() * Wa), y: Ha - 1, alt: 2 + Math.round(rnd() * 3), fase: rnd() * 6.28 });
      // insetos e vagalumes
      this.insetos = [0, 1, 2].map((i) => ({ ax: (i === 1 ? 0.5 : i === 0 ? 0.07 : 0.93) * Wa, ay: y1 - 3 - i, fx: 0.7 + rnd(), fy: 1.1 + rnd(), fase: rnd() * 6.28 }));
      this.vagalumes = Array.from({ length: 9 }, () => ({ x: rnd() * Wa, y: lerp(y1 - 10, y1 + 8, rnd()), fase: rnd() * 6.28, v: 0.5 + rnd() }));
      // gotas de chuva: posição e velocidade sorteadas uma vez (sem colunas repetidas)
      this.gotas = Array.from({ length: Math.round(Wa * 0.4) }, () => ({ x: rnd() * Wa, y: rnd() * 1000, v: 95 + rnd() * 50 }));
      // nuvens (texturas geradas pelo Cenario)
      for (const nv of this.nuvens) nv.img.destroy();
      this.nuvens = cen.nuvens.map((tela, i) => {
        const chave = 'nuvem_' + i;
        if (this.cena.textures.exists(chave)) this.cena.textures.remove(chave);
        const tex = this.cena.textures.addCanvas(chave, tela);
        tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
        const img = this.cena.add.image(0, 0, chave).setOrigin(0, 0).setScale(P).setDepth(-29);
        return { img, x: (0.08 + i * 0.33) * W, y: (0.025 + i * 0.03) * L.H, v: (0.004 + i * 0.002) * W };
      });
      this.criarPeixes();
    }

    // ------------------------------------------------------------------ peixes ao fundo
    criarPeixes() {
      for (const p of this.peixes) p.img.destroy();
      const defs = [
        { zona: 'rasa', k: 'peixe_lambari', n: 4, l: 0.03, a: 0.55, v: 0.05, tint: 0x24584f },
        { zona: 'rasa', k: 'peixe_tilapia', n: 1, l: 0.045, a: 0.45, v: 0.03, tint: 0x24584f },
        { zona: 'lirios', k: 'peixe_traira', n: 1, l: 0.045, a: 0.4, v: 0.03, tint: 0x173d40 },
        { zona: 'pedras', k: 'peixe_tilapia', n: 1, l: 0.035, a: 0.35, v: 0.04, tint: 0x10304a },
        { zona: 'poco', k: 'peixe_bagre', n: 1, l: 0.07, a: 0.28, v: 0.012, tint: 0x081a2c },
        { zona: 'poco', k: 'peixe_carpa', n: 1, l: 0.06, a: 0.25, v: 0.01, tint: 0x081a2c }
      ];
      this.peixes = [];
      let i = 0;
      for (const d of defs) for (let j = 0; j < d.n; j++, i++) {
        if (!this.cena.textures.exists(d.k)) continue;
        const img = this.cena.add.image(0, 0, d.k).setDepth(-24).setTint(d.tint);
        this.peixes.push({ d, img, x: (i * 0.37 + 0.1) % 1, fy: (i * 0.53 + 0.2) % 1, v: d.v * (i % 2 ? 1 : -1), f: i * 1.7 });
      }
      this.posicionarPeixes();
    }

    faixaDaZona(zona) {
      const c = this.cena, k = this.L.k;
      if (zona === 'poco') return [this.L.horizonte + 0.25 * (c.distY(22) - this.L.horizonte), c.distY(22) - 6 * k];
      if (zona === 'pedras') return [c.distY(22) + 4 * k, c.distY(18) - 4 * k];
      if (zona === 'lirios') return [c.distY(18) + 4 * k, c.distY(14) - 4 * k];
      return [c.distY(14) + 6 * k, this.L.bankTop - 10 * k];
    }

    /** Perspectiva: mais longe = menor. */
    escala(y) { const L = this.L; return 0.55 + 0.45 * Math.max(0, Math.min(1, (y - L.horizonte) / (L.bankTop - L.horizonte))); }

    posicionarPeixes() {
      for (const p of this.peixes) {
        const tex = this.cena.textures.get(p.d.k).getSourceImage();
        const [y0, y1] = this.faixaDaZona(p.d.zona);
        const y = lerp(y0, y1, p.fy);
        const w = this.L.W * p.d.l * this.escala(y);
        p.img.setDisplaySize(w, w * tex.height / tex.width);
      }
    }

    // ------------------------------------------------------------------ eventos do mundo
    _emitir(ev) { if (this.aoEvento) this.aoEvento(ev); }

    /** Para testes e demonstração: dispara um evento agora. */
    forcarEvento(tipo, ctx) {
      ctx = ctx || this.ultimoCtx || { boias: [] };
      if (tipo === 'salto') this._salto(ctx);
      else if (tipo === 'cardume') this._cardume();
      else if (tipo === 'objeto') this._objeto();
      else if (tipo === 'passaro') this._passaro();
      else if (tipo === 'chuva') this._comecarChuva();
      else if (tipo === 'entardecer') { this.luz = 1; this.luzFixa = true; }
      return true;
    }

    _salto(ctx) {
      const L = this.L, boias = (ctx.boias || []).filter((b) => b.esperando);
      let x, y, perto = null;
      if (boias.length && this.rnd() < 0.6) {
        const b = boias[Math.floor(this.rnd() * boias.length)];
        x = b.x + (this.rnd() < 0.5 ? -1 : 1) * L.W * (0.03 + this.rnd() * 0.04); y = b.y + (this.rnd() - 0.5) * L.H * 0.03; perto = b.id;
      } else {
        const z = ['rasa', 'lirios', 'pedras'][Math.floor(this.rnd() * 3)];
        const [y0, y1] = this.faixaDaZona(z);
        x = L.W * (0.12 + this.rnd() * 0.76); y = lerp(y0, y1, this.rnd());
      }
      const opcoes = ['peixe_lambari', 'peixe_tilapia', 'peixe_tucunare', 'peixe_traira'];
      const k = opcoes[Math.floor(this.rnd() * opcoes.length)];
      const img = this.cena.textures.exists(k) ? this.cena.add.image(x, y, k).setDepth(-21.5) : null;
      if (img) {
        const src = this.cena.textures.get(k).getSourceImage(), w = L.W * 0.035 * this.escala(y);
        img.setDisplaySize(w, w * src.height / src.width);
      }
      const dir = this.rnd() < 0.5 ? -1 : 1;
      this.eventos.push({ tipo: 'salto', t0: this.t, dur: 750, x, y, img, dir, alt: L.H * (0.05 + this.rnd() * 0.04) });
      this.onda(x, y, 1.2); this.cena.app && this.cena.app.audio && this.cena.app.audio.ambiente && this.cena.app.audio.ambiente('salto');
      this._emitir({ tipo: 'salto', perto, especie: k.replace('peixe_', '') });
    }

    _cardume() {
      const L = this.L, [y0, y1] = this.faixaDaZona(this.rnd() < 0.6 ? 'rasa' : 'lirios');
      const dir = this.rnd() < 0.5 ? 1 : -1, y = lerp(y0, y1, 0.3 + this.rnd() * 0.4);
      const imgs = [];
      for (let i = 0; i < 7; i++) {
        if (!this.cena.textures.exists('peixe_lambari')) break;
        const img = this.cena.add.image(0, 0, 'peixe_lambari').setDepth(-24).setTint(0x1d4a44).setAlpha(0.6);
        const src = this.cena.textures.get('peixe_lambari').getSourceImage(), w = L.W * 0.022 * this.escala(y);
        img.setDisplaySize(w, w * src.height / src.width);
        const cab = (HF.Recortes && HF.Recortes.RECORTES.peixe_lambari || {}).cabeca;
        img.setFlipX(cab === 'esq' ? dir > 0 : dir < 0);
        imgs.push({ img, dx: (this.rnd() - 0.5) * L.W * 0.06, dy: (this.rnd() - 0.5) * L.H * 0.025, f: this.rnd() * 6.28 });
      }
      this.eventos.push({ tipo: 'cardume', t0: this.t, dur: 11000, y, dir, imgs });
      this._emitir({ tipo: 'cardume' });
    }

    _objeto() {
      const L = this.L, tipos = ['garrafa', 'galho', 'folha'];
      const objeto = tipos[Math.floor(this.rnd() * tipos.length)];
      const [y0, y1] = this.faixaDaZona(this.rnd() < 0.5 ? 'pedras' : 'poco');
      this.eventos.push({ tipo: 'objeto', t0: this.t, dur: 30000, y: lerp(y0, y1, this.rnd()), dir: -1, objeto });
      this._emitir({ tipo: 'objeto-boiando', objeto });
    }

    _passaro() {
      const L = this.L, dir = this.rnd() < 0.5 ? 1 : -1, n = 1 + Math.floor(this.rnd() * 3);
      this.eventos.push({ tipo: 'passaro', t0: this.t, dur: 9000 + this.rnd() * 4000, y: L.horizonte * (0.15 + this.rnd() * 0.45), dir, n });
      if (this.cena.app && this.cena.app.audio && this.cena.app.audio.ambiente) this.cena.app.audio.ambiente('passaro');
      this._emitir({ tipo: 'passaro', quantos: n });
    }

    _comecarChuva() {
      if (this.chuva) return;
      this.chuva = { t0: this.t, dur: this._entre(35000, 60000) };
      this.ultimaChuva = this.t;
      this.cena.app && this.cena.app.audio && this.cena.app.audio.ambiente && this.cena.app.audio.ambiente('chuva', true);
      this._emitir({ tipo: 'chuva-inicio' });
    }

    onda(x, y, forca) { if (this.ondas.length < 14) this.ondas.push({ x, y, t0: this.t, dur: 900 + 500 * (forca || 1), r: (forca || 1) }); }

    _agendar(ctx) {
      const t = this.t, pr = this.prox, mult = 1 - 0.35 * this.luz;           // no entardecer os peixes saltam mais
      if (t >= pr.salto) { this._salto(ctx); pr.salto = t + this._entre(35000, 80000) * mult; }
      if (t >= pr.cardume) { this._cardume(); pr.cardume = t + this._entre(60000, 120000); }
      if (t >= pr.objeto) { this._objeto(); pr.objeto = t + this._entre(110000, 200000); }
      if (t >= pr.passaro) { this._passaro(); pr.passaro = t + this._entre(40000, 90000); }
      if (t >= pr.onda) {
        const z = ['rasa', 'lirios', 'pedras', 'poco'][Math.floor(this.rnd() * 4)], [y0, y1] = this.faixaDaZona(z);
        this.onda(this.L.W * this.rnd(), lerp(y0, y1, this.rnd()), 0.6);
        pr.onda = t + this._entre(2500, 6000);
      }
      // chuva leve: rara (depois de 5 min, no máximo uma a cada 12 min)
      if (!this.chuva && t >= pr.chuva) {
        if (t - this.ultimaChuva > 720000 && this.rnd() < 0.15) this._comecarChuva();
        pr.chuva = t + 60000;
      }
      if (this.chuva && t - this.chuva.t0 > this.chuva.dur) {
        this.chuva = null;
        this.cena.app && this.cena.app.audio && this.cena.app.audio.ambiente && this.cena.app.audio.ambiente('chuva', false);
        this._emitir({ tipo: 'chuva-fim' });
      }
      // entardecer: de 4 a 9 minutos de jogo a tarde vira pôr do sol (só visual)
      if (!this.luzFixa) this.luz = Math.max(0, Math.min(1, (t - 240000) / 300000));
      if (!this.entardecerAvisado && this.luz >= 0.5) { this.entardecerAvisado = true; this._emitir({ tipo: 'entardecer' }); }
    }

    // ------------------------------------------------------------------ quadro a quadro
    /**
     * ctx = { boias: [{id, x, y, esperando}], pontos: [{x, y, tipo, alfa}], sirius: {estado, falando} }
     */
    atualizar(dt, now, ctx) {
      if (!this.cen) return;
      this.ultimoCtx = ctx;
      this.t += dt;
      if (dt > 0) this._agendar(ctx);
      const P = this.P, L = this.L, t = this.t / 1000;
      const gA = this.gAgua, gM = this.gMargem, gC = this.gCeu, gF = this.gFrente;
      gA.clear(); gM.clear(); gC.clear(); gF.clear(); this.gLuz.clear(); this.gChuva.clear();
      const px = (g, x, y, cor, a, w, h) => g.fillStyle(cor, a).fillRect(Math.round(x) * P, Math.round(y) * P, (w || 1) * P, (h || 1) * P);

      // nuvens
      for (const n of this.nuvens) {
        n.x += n.v * dt / 1000;
        if (n.x > L.W + 20) n.x = -n.img.displayWidth - 10;
        n.img.setPosition(Math.round(n.x / P) * P, Math.round(n.y / P) * P).setAlpha(1 - this.luz * 0.25);
        n.img.setTint(this.luz > 0 ? Phaser.Display.Color.GetColor(255, Math.round(255 - 60 * this.luz), Math.round(255 - 90 * this.luz)) : 0xffffff);
      }
      // fumaça da chaminé
      const ch = this.cen.pos.chamine;
      if (ch) for (let i = 0; i < 3; i++) {
        const u = ((t * 0.25) + i / 3) % 1;
        px(gC, ch.x / P + Math.sin(u * 4 + i) * 1.5 + u * 2, ch.y / P - 1 - u * 6, 0xd8d0c8, 0.5 * (1 - u));
      }
      // água: brilhos deslizando e correnteza
      for (const b of this.brilhos) {
        const x = ((b.x0 + t * b.v) % this.Wa + this.Wa) % this.Wa;
        const a = b.corrente ? 0.32 : 0.12 + 0.12 * (0.5 + 0.5 * Math.sin(t * 1.3 + b.fase));
        px(gA, x, b.y, b.corrente ? 0xdff3ff : 0xffffff, a, b.len, 1);
      }
      const rio = this.cen.pos.rio;
      for (const c of this.correntes) {
        const u = (c.fase + t * c.v) % 1;
        const x0 = (rio.x0 + rio.x1) / 2 / P, x = x0 - u * this.Wa * 0.75;
        const y = this.yH + 2 + (c.y - this.yH - 2) * Math.min(1, u * 3);
        px(gA, x, y, 0xe8f6ff, 0.35 * Math.sin(u * Math.PI), c.len, 1);
      }
      // espuma pulsando nas pedras
      for (const p of this.cen.pos.pedras) {
        const a = 0.25 + 0.2 * Math.sin(t * 3 + p.x);
        px(gA, (p.x - p.rx) / P - 1 - (t * 4 % 3), p.y / P + 1, 0xffffff, a, 2, 1);
      }
      // reflexo do sol (cintilando)
      const sol = this.cen.pos.sol;
      for (let i = 0; i < 7; i++) {
        const slot = Math.floor(t * 6 + i * 13);
        const h = Math.sin(slot * 12.9898 + i * 78.233) * 43758.5453; const r = h - Math.floor(h);
        const yy = this.yH + 1 + Math.floor(r * (this.y18 - this.yH - 2));
        const larg = (sol.r / P) * (0.6 + 1.6 * (yy - this.yH) / Math.max(1, this.y18 - this.yH));
        px(gA, sol.x / P + (r - 0.5) * 2 * larg, yy, 0xfff1c0, 0.55, 1 + (i % 2), 1);
      }
      // ondulações
      this.ondas = this.ondas.filter((o) => this.t - o.t0 < o.dur);
      for (const o of this.ondas) {
        const u = (this.t - o.t0) / o.dur, e = this.escala(o.y);
        gA.lineStyle(Math.max(1, P * 0.5), 0xffffff, 0.35 * (1 - u)).strokeEllipse(o.x, o.y, (8 + 26 * u) * P * e * o.r, (3 + 8 * u) * P * e * o.r);
      }
      // peixes ao fundo
      for (const p of this.peixes) {
        p.x += p.v * dt / 1000;
        if (p.x > 1.08) p.v = -Math.abs(p.v);
        if (p.x < -0.08) p.v = Math.abs(p.v);
        const [y0, y1] = this.faixaDaZona(p.d.zona);
        const y = lerp(y0, y1, p.fy) + Math.sin(now / 900 + p.f) * 2 * L.k;
        const cab = (HF.Recortes && HF.Recortes.RECORTES[p.d.k] || {}).cabeca;
        p.img.setPosition(p.x * L.W, y).setFlipX(cab === 'esq' ? p.v > 0 : p.v < 0).setAlpha(p.d.a * (1 - 0.3 * this.luz));
      }
      // pontos de interesse
      for (const pt of (ctx.pontos || [])) this.desenharPonto(gA, pt, t);
      // eventos
      this.eventos = this.eventos.filter((e) => {
        const u = (this.t - e.t0) / e.dur;
        if (u >= 1) { if (e.img) e.img.destroy(); if (e.imgs) e.imgs.forEach((f) => f.img.destroy()); return false; }
        this.desenharEvento(e, u, t, gA, gC, px);
        return true;
      });
      // juncos balançando (na beira) e capim da frente
      for (const j of this.juncos) {
        const s = Math.sin(t * 1.4 + j.fase) * 0.8;
        for (let k = 0; k < j.alt; k++) px(gM, j.x + Math.round(s * (k / j.alt) * 2), j.base - k, k > j.alt * 0.7 ? 0x79a64f : 0x4f7f3a, 1);
        px(gM, j.x + Math.round(s * 2), j.base - j.alt - 3, 0x7a4f2e, 1, 1, 3);
      }
      for (const tf of this.tufos) {
        const s = Math.sin(t * 1.1 + tf.fase);
        for (let k = 0; k < tf.alt; k++) { px(gF, tf.x - 1 + Math.round(s * k / tf.alt), tf.y - k, 0x3f7539, 1); px(gF, tf.x + 1 + Math.round(s * k / tf.alt), tf.y - k + 1, 0x4b8442, 1); }
      }
      // insetos perto da margem
      for (const ins of this.insetos) {
        const x = ins.ax + Math.sin(t * ins.fx + ins.fase) * 6, y = ins.ay + Math.sin(t * ins.fy + ins.fase * 2) * 3;
        px(gM, x, y, 0x1d1d1d, 0.8); if (Math.floor(t * 12 + ins.fase) % 2) px(gM, x, y - 1, 0xdfe8ee, 0.6);
      }
      // estado do Sirius saindo do cestinho (sem rosto)
      this.desenharCestinho(gM, ctx.sirius, t, px);
      // entardecer: luz quente sobre o lago e vagalumes
      if (this.luz > 0) {
        this.gLuz.fillStyle(0xff8a3d, 0.1 * this.luz).fillRect(0, L.horizonte, L.W, L.H - L.horizonte);
        if (this.luz > 0.55) {
          for (const v of this.vagalumes) {
            const a = (0.4 + 0.6 * Math.max(0, Math.sin(t * v.v * 2 + v.fase))) * (this.luz - 0.55) / 0.45;
            const x = v.x + Math.sin(t * 0.4 * v.v + v.fase) * 8, y = v.y + Math.sin(t * 0.7 * v.v + v.fase) * 3;
            px(gM, x, y, 0xe8ff7a, a); px(gM, x, y, 0xffffff, a * 0.4);
          }
        }
      }
      // chuva leve
      if (this.chuva) {
        const dec = this.t - this.chuva.t0, forca = Math.max(0, Math.min(1, dec / 3000, (this.chuva.dur - dec) / 3000));
        this.gChuva.fillStyle(0x1c2a3a, 0.16 * forca).fillRect(0, 0, L.W, L.H);
        const n = Math.round(this.gotas.length * forca), Ha = L.H / P;
        for (let i = 0; i < n; i++) {
          const gt = this.gotas[i];
          const y = (gt.y + t * gt.v) % Ha, x = ((gt.x - y * 0.35) % this.Wa + this.Wa) % this.Wa;   // gotas inclinadas pelo vento
          px(this.gChuva, x, y, 0xdbe9f7, 0.6 * forca, 1, 2);
          px(this.gChuva, x - 1, y + 2, 0xdbe9f7, 0.45 * forca, 1, 2);
        }
        if (this.rnd() < 0.35 * forca) {
          const z = ['rasa', 'lirios', 'pedras', 'poco'][Math.floor(this.rnd() * 4)], [y0, y1] = this.faixaDaZona(z);
          this.onda(L.W * this.rnd(), lerp(y0, y1, this.rnd()), 0.3);
        }
      }
    }

    desenharPonto(g, pt, t) {
      const P = this.P, e = this.escala(pt.y), a = pt.alfa;
      const px = (x, y, cor, al, w, h) => g.fillStyle(cor, al * a).fillRect(Math.round(x / P) * P, Math.round(y / P) * P, (w || 1) * P, (h || 1) * P);
      // pulso de destaque (para o olho achar o ponto) + brilho piscando acima
      const pu = (t * 0.7 + (pt.fase || 0)) % 1;
      g.lineStyle(P, 0xfff3c4, 0.55 * (1 - pu) * a).strokeEllipse(pt.x, pt.y, (10 + 24 * pu) * P * e, (4 + 8 * pu) * P * e);
      g.fillStyle(0xfff3c4, 0.12 * a).fillEllipse(pt.x, pt.y, 18 * P * e, 6 * P * e);
      if (Math.floor(t * 2.5 + (pt.fase || 0) * 7) % 3 !== 0) {
        const gy = pt.y - 7 * P - Math.sin(t * 3) * P;
        px(pt.x, gy - P, 0xffffff, 0.9, 1, 3); px(pt.x - P, gy, 0xffffff, 0.9, 3, 1);
      }
      switch (pt.tipo) {
        case 'bolhas':
          for (let i = 0; i < 7; i++) {
            const u = (t * 0.8 + i / 7 + (pt.fase || 0)) % 1;
            const bx = pt.x + Math.sin(i * 2.1 + t * 3) * 4 * P * e, by = pt.y + 2 * P - u * 9 * P;
            g.lineStyle(Math.max(1, P * 0.5), 0xffffff, 0.85 * (1 - u * 0.6) * a).strokeRect(Math.round(bx / P) * P, Math.round(by / P) * P, P * (i % 3 ? 1 : 2), P * (i % 3 ? 1 : 2));
          }
          break;
        case 'cardume':
          for (let i = 0; i < 6; i++) {
            const ang = t * 1.6 + i * 1.05;
            px(pt.x + Math.cos(ang) * 6 * P * e, pt.y + Math.sin(ang) * 2 * P * e, 0x173d3a, 0.75, 2, 1);
          }
          if (Math.floor(t * 2) % 3 === 0) px(pt.x, pt.y - P, 0xffffff, 0.5, 1, 1);
          break;
        case 'lirios':
          for (let i = 0; i < 3; i++) {
            const sx = pt.x + (i - 1) * 4 * P * e, sy = pt.y + Math.sin(t * 2.4 + i) * P * 0.6;
            g.fillStyle(0x4f9a3e, 0.95 * a).fillEllipse(sx, sy, 6 * P * e, 2.4 * P * e);
            g.fillStyle(0x78c255, 0.9 * a).fillRect(sx - P, sy - P * 0.6, P, P * 0.6);
          }
          if (Math.floor(t * 1.5 + pt.fase * 5) % 4 === 0) px(pt.x + 5 * P * e, pt.y + P, 0x1d3f3a, 0.8, 2, 1);
          break;
        case 'correnteza':
          for (let i = 0; i < 3; i++) {
            const ang0 = t * 2.2 + i * 2.09;
            for (let k = 0; k < 5; k++) {
              const ang = ang0 + k * 0.28, r = (3 + i * 1.5) * P * e;
              px(pt.x + Math.cos(ang) * r * 1.6, pt.y + Math.sin(ang) * r * 0.55, 0xe8f6ff, 0.55 - k * 0.08, 1, 1);
            }
          }
          break;
        case 'sombra':
          g.fillStyle(0x06121f, 0.42 * a).fillEllipse(pt.x + Math.sin(t * 0.5) * 3 * P * e, pt.y + P, 16 * P * e, 4.5 * P * e);
          g.fillStyle(0x06121f, 0.42 * a).fillTriangle(pt.x + Math.sin(t * 0.5) * 3 * P * e + 8 * P * e, pt.y + P, pt.x + Math.sin(t * 0.5) * 3 * P * e + 12 * P * e, pt.y - P, pt.x + Math.sin(t * 0.5) * 3 * P * e + 12 * P * e, pt.y + 3 * P);
          break;
        case 'tronco':
          g.fillStyle(0x2a1e15, 0.75 * a).fillRect(pt.x - 6 * P * e, pt.y + Math.sin(t * 1.2) * P * 0.5, 12 * P * e, 1.5 * P);
          px(pt.x + 4 * P * e, pt.y - P, 0x2a1e15, 0.75, 1, 2);
          if (Math.floor(t * 1.3 + pt.fase * 3) % 3 === 0) px(pt.x - 2 * P, pt.y - 2 * P - (t * 6 % 4) * P, 0xe8f6ff, 0.6, 1, 1);
          break;
        default: break;
      }
    }

    desenharEvento(e, u, t, gA, gC, px) {
      const L = this.L, P = this.P;
      if (e.tipo === 'salto') {
        const x = e.x + e.dir * u * L.W * 0.03, y = e.y - Math.sin(u * Math.PI) * e.alt;
        if (e.img) e.img.setPosition(x, y).setAngle(e.dir * (u - 0.5) * 120).setFlipX(e.dir < 0).setVisible(u < 0.97);
        if (u < 0.2 || u > 0.85) for (let i = 0; i < 4; i++) px(gA, x / P + (i - 1.5) * 1.5, (u < 0.5 ? e.y : y + 2) / P - (u < 0.5 ? u * 20 : (u - 0.85) * 25) * (i % 2 ? 1 : 0.6), 0xffffff, 0.8, 1, 1);
        if (u > 0.85 && !e.respingou) { e.respingou = true; this.onda(x, e.y + 2, 1.4); }
      } else if (e.tipo === 'cardume') {
        const x0 = e.dir > 0 ? -0.1 * L.W : 1.1 * L.W, x1 = e.dir > 0 ? 1.1 * L.W : -0.1 * L.W;
        const cx = lerp(x0, x1, u);
        for (const f of e.imgs) f.img.setPosition(cx + f.dx + Math.sin(t * 3 + f.f) * 2 * L.k, e.y + f.dy + Math.sin(t * 2 + f.f) * 2 * L.k);
        if (Math.floor(t * 4) % 2) px(gA, cx / P, e.y / P - 2, 0xffffff, 0.4, 1, 1);
      } else if (e.tipo === 'objeto') {
        const x = lerp(1.05 * L.W, -0.05 * L.W, u), y = e.y + Math.sin(t * 2) * P * 0.6;
        const xa = x / P, ya = y / P;
        if (e.objeto === 'garrafa') { px(gA, xa, ya, 0x3f7f4f, 0.95, 3, 1); px(gA, xa + 3, ya, 0x6fa37a, 0.95, 1, 1); px(gA, xa - 1, ya, 0x8a5a3b, 0.95, 1, 1); }
        else if (e.objeto === 'galho') { px(gA, xa, ya, 0x4a3220, 0.95, 5, 1); px(gA, xa + 3, ya - 1, 0x4a3220, 0.95, 1, 1); }
        else { px(gA, xa, ya, 0xd9822f, 0.95, 2, 1); px(gA, xa + 1, ya - 1, 0xf0b14a, 0.95, 1, 1); }
        px(gA, xa - 1, ya + 1, 0xffffff, 0.3, 4, 1);
      } else if (e.tipo === 'passaro') {
        const x0 = e.dir > 0 ? -0.05 * L.W : 1.05 * L.W, x1 = e.dir > 0 ? 1.05 * L.W : -0.05 * L.W;
        for (let i = 0; i < e.n; i++) {
          const x = lerp(x0, x1, u) - e.dir * i * 7 * P, y = e.y + Math.sin(t * 2 + i) * 2 * P + i * 2 * P;
          const asa = Math.floor(t * 6 + i) % 2;
          const xa = x / P, ya = y / P;
          px(gC, xa, ya, 0x2a2a3a, 0.85, 1, 1);
          px(gC, xa - 1, ya - (asa ? 1 : 0), 0x2a2a3a, 0.85, 1, 1); px(gC, xa + 1, ya - (asa ? 1 : 0), 0x2a2a3a, 0.85, 1, 1);
          px(gC, xa - 2, ya - (asa ? 2 : 0), 0x2a2a3a, 0.85, 1, 1); px(gC, xa + 2, ya - (asa ? 2 : 0), 0x2a2a3a, 0.85, 1, 1);
        }
      }
    }

    /** Glifo em pixel art com contorno escuro (lê bem sobre a grama e a água). */
    glifo(g, nome, xa, ya, cor, a) {
      const G = GLIFOS[nome], P = this.P;
      for (let j = 0; j < G.length; j++) for (let i = 0; i < G[j].length; i++) if (G[j][i] === '1') g.fillStyle(0x10203a, 0.55 * a).fillRect((xa + i) * P - P / 2, (ya + j) * P - P / 2, P * 2, P * 2);
      for (let j = 0; j < G.length; j++) for (let i = 0; i < G[j].length; i++) if (G[j][i] === '1') g.fillStyle(cor, a).fillRect((xa + i) * P, (ya + j) * P, P, P);
    }

    desenharCestinho(g, sirius, t, px) {
      const c = this.cen.pos.cestinho;
      if (!c || !sirius) return;
      const xa = c.x / this.P, ya = c.y / this.P;
      const est = sirius.estado;
      if (est === 'dormindo') {
        for (let i = 0; i < 2; i++) {
          const u = ((t * 0.35) + i / 2) % 1;
          this.glifo(g, 'z', Math.round(xa + 2 + u * 4), Math.round(ya - 6 - u * 10), 0xdfeaff, 0.85 * (1 - u));
        }
      } else if (est === 'inquieto') {
        this.glifo(g, 'ex', Math.round(xa + 3), Math.round(ya - 9 + Math.sin(t * 10)), 0xffd23f, 0.95);
      } else if (est === 'chorando' || est === 'acalmando') {
        const tremor = est === 'chorando' ? Math.round(Math.sin(t * 40)) : 0;
        if (est === 'chorando') { this.glifo(g, 'ex', Math.round(xa + 2 + tremor), Math.round(ya - 9), 0xff9fb0, 1); this.glifo(g, 'ex', Math.round(xa + 4 + tremor), Math.round(ya - 9), 0xff9fb0, 1); }
        // "ondas" de som saindo do cestinho
        const u = (t * 1.5) % 1;
        px(g, xa - 5 - u * 2, ya - 3, 0xff9fb0, 0.7 * (1 - u), 1, 2); px(g, xa + 5 + u * 2, ya - 3, 0xff9fb0, 0.7 * (1 - u), 1, 2);
        if (est === 'acalmando') for (let i = 0; i < 3; i++) px(g, xa - 1 + i * 2, ya - 8, 0xffffff, 0.6 * ((Math.floor(t * 3) % 3) >= i ? 1 : 0.2), 1, 1);
      } else if (sirius.falando) {
        const u = (t * 0.6) % 1;
        this.glifo(g, 'nota', Math.round(xa + 3 + Math.sin(u * 6) * 1), Math.round(ya - 8 - u * 6), 0x9fd0ff, 0.9 * (1 - u));
      }
    }

    destruir() {
      for (const n of this.nuvens) n.img.destroy();
      for (const p of this.peixes) p.img.destroy();
      for (const e of this.eventos) { if (e.img) e.img.destroy(); if (e.imgs) e.imgs.forEach((f) => f.img.destroy()); }
      [this.gCeu, this.gAgua, this.gMargem, this.gFrente, this.gLuz, this.gChuva].forEach((g) => g.destroy());
    }
  }

  root.HF.VidaDoLago = VidaDoLago;
})(window);
