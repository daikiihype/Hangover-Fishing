/*
 * Hangover Fishing — versão jogável
 * CenaMar: o cenário marítimo animado atrás de TODAS as telas do menu (tela inteira).
 * Pixel art desenhada em código: céu de madrugada, sol nascendo, ondas, raios de luz,
 * algas, areia, bolhas e peixes (recortes da folha do criador) nadando.
 * No menu principal, os dois personagens (IDLE aprovado, com o piscar) pescam de um barco,
 * alinhados à área ".espaco-arte" da tela do menu.
 */
(function (root) {
  'use strict';

  const CEU = [0x141c46, 0x1d2658, 0x2b2f6a, 0x4a3b7a, 0x7a4a86, 0xb45e7e, 0xe07e6c, 0xf3a774];
  const AGUA = [0x2a9bc0, 0x2489b0, 0x1d76a0, 0x17638e, 0x12507a, 0x0e4067, 0x0b3256, 0x082646, 0x061c37];
  const PEIXES = [
    { k: 'peixe_lambari', l: 0.09 }, { k: 'peixe_tilapia', l: 0.15 }, { k: 'peixe_carpa', l: 0.17 },
    { k: 'peixe_traira', l: 0.15 }, { k: 'peixe_bagre', l: 0.18 }, { k: 'peixe_lambari', l: 0.08 }, { k: 'peixe_dourado', l: 0.2 }
  ];

  class CenaMar extends Phaser.Scene {
    constructor() { super({ key: 'Mar' }); }

    create() {
      this.t = 0;
      this.g = this.add.graphics().setDepth(0);         // céu, água, raios
      this.gFrente = this.add.graphics().setDepth(2);   // algas, areia, bolhas
      this.gBarco = this.add.graphics().setDepth(4);    // casco do barco
      this.gLinhas = this.add.graphics().setDepth(5);   // linhas e boias
      this.rng = new root.HF.Random(20261112);
      this.peixes = PEIXES.map((p, i) => ({
        def: p, img: this.add.image(0, 0, p.k).setDepth(1),
        y: 0.12 + (i / PEIXES.length) * 0.78, v: (0.02 + this.rng.next() * 0.035) * (i % 2 ? 1 : -1),
        x: this.rng.next(), fase: this.rng.next() * 6
      }));
      this.bolhas = [];
      const data = root.HF.app.animData;
      this.chars = ['ale', 'alemao'].map((c, i) => ({
        key: c, flip: i === 0,
        anim: new root.HF.CharacterAnimator({ character: c, data, random: Math.random }),
        sprite: this.add.sprite(0, 0, c + '_idle', 0).setOrigin(0.5, 1).setDepth(3).setFlipX(i === 0)
      }));
      this.scale.on('resize', this.layout, this);
      this.events.once('shutdown', () => this.scale.off('resize', this.layout, this));
      this.layout();
    }

    /** Posições a partir da tela e da área reservada para a arte no menu (DOM). */
    layout() {
      const W = this.scale.width, H = this.scale.height, k = root.HF.app.dpr;
      this.W = W; this.H = H;
      this.P = Math.max(2, Math.floor(Math.min(W, H) / 170));
      const el = document.querySelector('#tela-menu.ativa .espaco-arte');
      const r = el ? el.getBoundingClientRect() : null;
      this.arte = r && r.height > 0 ? { x: r.left * k, y: r.top * k, w: r.width * k, h: r.height * k } : null;
      this.linhaAgua = this.arte ? Math.round(this.arte.y + this.arte.h * 0.74) : Math.round(H * 0.06);
      // personagens: a maior escala inteira que cabe na área da arte
      const c = this.arte ? Math.max(1, Math.floor(Math.min(this.arte.h * 0.95 / 66, this.arte.w / 150))) : 1;
      this.c = c;
      const cx = this.arte ? this.arte.x + this.arte.w / 2 : W / 2;
      this.barco = { cx: Math.round(cx), y: this.linhaAgua, c };
      this.chars[0].sprite.setScale(c).setPosition(Math.round(cx - 14 * c), this.linhaAgua + 3 * c).setVisible(!!this.arte);
      this.chars[1].sprite.setScale(c).setPosition(Math.round(cx + 14 * c), this.linhaAgua + 3 * c).setVisible(!!this.arte);
      for (const p of this.peixes) {
        const tex = this.textures.get(p.def.k).getSourceImage();
        const largura = Math.min(W, H * 0.75) * p.def.l;
        p.img.setDisplaySize(largura, largura * tex.height / tex.width);
      }
    }

    update(time, delta) {
      const dt = Math.min(100, delta);
      this.t += dt / 1000;
      if (!this.arte !== !document.querySelector('#tela-menu.ativa .espaco-arte')) this.layout();
      const { W, H, P } = this;
      const g = this.g, gf = this.gFrente;
      g.clear(); gf.clear(); this.gBarco.clear(); this.gLinhas.clear();
      const wl = this.linhaAgua;

      // ---- céu (só acima da linha d'água) ----
      if (wl > 0) {
        const faixa = Math.ceil(wl / CEU.length / P) * P;
        CEU.forEach((cor, i) => g.fillStyle(cor, 1).fillRect(0, i * faixa, W, faixa + 1));
        // estrelas piscando
        for (let i = 0; i < 26; i++) {
          const sx = ((i * 7919) % 997) / 997 * W, sy = ((i * 104729) % 991) / 991 * wl * 0.55;
          const a = 0.35 + 0.35 * Math.sin(this.t * 1.7 + i);
          g.fillStyle(0xffffff, a).fillRect(Math.round(sx / P) * P, Math.round(sy / P) * P, P, P);
        }
        // sol nascendo (meio disco de pixels) e reflexo
        const sr = Math.round(Math.min(W, H) * 0.07 / P) * P, sx = Math.round(W * 0.7 / P) * P;
        for (let yy = 0; yy < sr; yy += P) {
          const half = Math.round(Math.sqrt(sr * sr - yy * yy) / P) * P;
          g.fillStyle(yy < sr * 0.35 ? 0xffe9a0 : 0xffd27a, 1).fillRect(sx - half, wl - yy - P, half * 2, P);
        }
      }

      // ---- água (degradê em faixas de pixel) ----
      const fundoY = H;
      const faixaA = Math.ceil((fundoY - wl) / AGUA.length / P) * P;
      AGUA.forEach((cor, i) => g.fillStyle(cor, 1).fillRect(0, wl + i * faixaA, W, faixaA + 1));
      // raios de luz balançando
      for (let i = 0; i < 5; i++) {
        const x0 = W * (0.1 + i * 0.22) + Math.sin(this.t * 0.4 + i) * W * 0.04;
        g.fillStyle(0xbfeaff, 0.06).fillTriangle(x0, wl, x0 + W * 0.08, wl, x0 + W * 0.02 - W * 0.12, H);
      }
      // reflexo do sol
      if (wl > 0) for (let i = 0; i < 6; i++) {
        const w = (6 - i) * P * 3, x = W * 0.7 - w / 2 + Math.sin(this.t * 2 + i) * P * 2;
        g.fillStyle(0xffe1a0, 0.5 - i * 0.07).fillRect(Math.round(x / P) * P, wl + P * (1 + i * 2), w, P);
      }
      // ondas na superfície
      for (let x = 0; x < W + P * 8; x += P * 8) {
        const off = Math.round(((this.t * 18) % 8)) * P;
        g.fillStyle(0xd8f4ff, 0.9).fillRect(x - off, wl - P, P * 3, P);
        g.fillStyle(0x7fd0ea, 1).fillRect(x - off + P * 3, wl - P, P * 5, P);
        g.fillStyle(0x7fd0ea, 1).fillRect(x - off, wl, P * 8, P);
      }

      // ---- peixes ----
      const altA = fundoY - wl;
      for (const p of this.peixes) {
        p.x += p.v * dt / 1000;
        if (p.x > 1.15) { p.x = 1.15; p.v = -Math.abs(p.v); }
        if (p.x < -0.15) { p.x = -0.15; p.v = Math.abs(p.v); }
        const cab = root.HF.Recortes.RECORTES[p.def.k].cabeca;
        const indoDireita = p.v > 0;
        p.img.setFlipX(cab === 'esq' ? indoDireita : !indoDireita);
        const y = wl + altA * (0.1 + p.y * 0.72) + Math.sin(this.t * 1.3 + p.fase) * P * 2;
        const prof = (y - wl) / altA;
        p.img.setPosition(Math.round(p.x * W), Math.round(y)).setAlpha(0.95 - prof * 0.45).setTint(prof > 0.5 ? 0x9fb8d0 : 0xffffff);
      }

      // ---- areia, pedras e algas ----
      const areia = Math.round(H * 0.035 / P) * P;
      gf.fillStyle(0xc9a76a, 1).fillRect(0, H - areia, W, areia);
      gf.fillStyle(0xa8874f, 1);
      for (let i = 0; i < 40; i++) gf.fillRect(Math.round(((i * 7907) % 1000) / 1000 * W / P) * P, H - areia + P * (1 + (i % 3)), P * 2, P);
      for (let i = 0; i < 9; i++) {
        const bx = Math.round((W * (0.04 + i * 0.12) + (i % 2) * W * 0.03) / P) * P;
        const alt = Math.round(H * (0.07 + ((i * 37) % 10) / 100)) ;
        for (let yy = 0; yy < alt; yy += P) {
          const k = yy / alt;
          const dx = Math.round(Math.sin(this.t * 1.5 + i + k * 3) * k * P * 3 / P) * P;
          gf.fillStyle(k > 0.7 ? 0x5fbf6a : 0x2f8f4a, 1).fillRect(bx + dx, H - areia - yy - P, P * 2, P);
        }
      }

      // ---- bolhas ----
      if (this.rng.next() < dt / 300) this.bolhas.push({ x: this.rng.next() * W, y: H - areia, v: H * (0.05 + this.rng.next() * 0.06), s: this.rng.next() < 0.3 ? 2 : 1, f: this.rng.next() * 6 });
      this.bolhas = this.bolhas.filter((b) => b.y > wl + P);
      for (const b of this.bolhas) {
        b.y -= b.v * dt / 1000;
        const x = Math.round((b.x + Math.sin(this.t * 3 + b.f) * P * 2) / P) * P;
        gf.lineStyle(Math.max(1, P / 2), 0xd8f4ff, 0.8).strokeRect(x, Math.round(b.y / P) * P, P * b.s * 2, P * b.s * 2);
      }

      // ---- barco e personagens (só no menu principal) ----
      if (this.arte) this.desenharBarco(dt);
    }

    desenharBarco(dt) {
      const { cx, y, c } = this.barco;
      const gb = this.gBarco, gl = this.gLinhas;
      const balanco = Math.round(Math.sin(this.t * 1.6) * c * 0.6);
      for (const ch of this.chars) {
        ch.anim.update(dt, null);
        const f = ch.anim.frame();
        ch.sprite.setTexture(ch.key + '_' + f.anim, f.index);
        ch.sprite.y = y + 3 * c + balanco;
        // linha da ponta da vara até a boia
        const tip = f.rodTip, fx = ch.flip ? 95 - tip[0] : tip[0];
        const tx = ch.sprite.x - 48 * c + (fx + 0.5) * c, ty = ch.sprite.y - 96 * c + (tip[1] + 0.5) * c;
        const bx = tx + (ch.flip ? -1 : 1) * c * 26, by = y + c * 2 + Math.sin(this.t * 2 + (ch.flip ? 1 : 0)) * c;
        gl.lineStyle(Math.max(1, c / 2), 0xffffff, 0.8).beginPath();
        gl.moveTo(tx, ty);
        for (let i = 1; i <= 10; i++) { const u = i / 10; gl.lineTo(tx + (bx - tx) * u, ty + (by - ty) * u + Math.sin(Math.PI * u) * c * 5); }
        gl.strokePath();
        gl.fillStyle(0xffffff, 1).fillRect(bx - c, by - c * 2, c * 2, c * 2);
        gl.fillStyle(ch.key === 'alemao' ? 0xd23c3c : 0xd8b21f, 1).fillRect(bx - c, by - c * 3, c * 2, c);
      }
      // casco de madeira (pixel art), por cima das pernas
      const L = 62 * c, top = y + balanco - 9 * c, x0 = Math.round(cx - L / 2);
      const linhas = [[0, 0, L, 0x3b2418], [c, c, L - 2 * c, 0xc58b4f], [c, 2 * c, L - 2 * c, 0x9a6534], [2 * c, 4 * c, L - 4 * c, 0x9a6534],
        [3 * c, 6 * c, L - 6 * c, 0x7a4a22], [5 * c, 8 * c, L - 10 * c, 0x7a4a22], [7 * c, 10 * c, L - 14 * c, 0x3b2418]];
      gb.fillStyle(0x3b2418, 1).fillRect(x0 - c, top - c, L + 2 * c, 12 * c);
      for (const [dx, dy, w, cor] of linhas) gb.fillStyle(cor, 1).fillRect(x0 + dx, top + dy, w, 2 * c);
      gb.fillStyle(0xe2b75a, 1).fillRect(x0 + 6 * c, top + 3 * c, 4 * c, c).fillRect(x0 + L - 10 * c, top + 3 * c, 4 * c, c);
      // água por cima do casco (linha d'água)
      gb.fillStyle(0x7fd0ea, 0.85).fillRect(x0 - 3 * c, y + 4 * c, L + 6 * c, c);
    }
  }

  root.HF.CenaMar = CenaMar;
})(window);
