/*
 * Hangover Fishing — Protótipo P1 (pesca)
 * FishingScene: a tela de jogo em GREYBOX (formas e texto, nenhuma imagem).
 *
 * Papel desta cena:
 *   - repassar os toques do Phaser para o TouchRouter (igual ao P0);
 *   - chamar session.update() a cada quadro;
 *   - DESENHAR o estado de cada jogador e os efeitos de feedback.
 * Nenhuma regra de pesca mora aqui: tudo vem de FishingPlayer.snapshot().
 *
 * Layout (celular na horizontal):
 *   ┌──────────── placar ────────────┐
 *   │ margem distante                │
 *   │ T  ~~~ boia P1 ~~ ┆ ~~ boia P2 ~~~  T │  T = medidor de tensão (bordas externas)
 *   │    rio (longe = mais acima)    │
 *   ├───────── margem próxima ───────┤
 *   │  ALEMÃO (vara vermelha) ┆ ALE (vara preta e amarela)
 *   └────────────────────────────────┘
 */
(function (root) {
  'use strict';

  const S = root.HF.FishingPlayer.STATES;
  const IDS = ['P1', 'P2'];

  const COLORS = {
    P1: { main: 0xd23c3c, light: 0xff6b6b, body: 0x8a2525, css: '#ff7b7b', tint: 0xd23c3c },
    P2: { main: 0xd8b21f, light: 0xffd23f, body: 0x222222, css: '#ffd23f', tint: 0xd8b21f }
  };
  const ZONE_COLORS = { frouxa: 0x4aa3ff, segura: 0x3ccf6e, alerta: 0xffa53c, critica: 0xff3b3b };
  const FISH_COLORS = { rapido: 0x9ad3ff, pesado: 0xa08a62, arisco: 0xc79cff };
  const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

  function kg(v) { return v.toFixed(2).replace('.', ',') + ' kg'; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  class FishingScene extends Phaser.Scene {
    constructor() {
      super({ key: 'FishingScene' });
    }

    create() {
      this.app = root.HF.app;
      this.session = this.app.session;
      this.router = this.session.router;
      this.app.scene = this;
      this.portrait = false;
      this.effects = [];
      this.marks = { P1: {}, P2: {} };     // marcas temporárias de feedback (piscar, beliscada...)

      this.bg = this.add.graphics();
      this.world = this.add.graphics();
      this.fx = this.add.graphics();
      this.ui = this.add.graphics();

      const res = Math.min(window.devicePixelRatio || 1, 3);
      const txt = (style) => this.add.text(0, 0, '', Object.assign({ fontFamily: FONT, color: '#ffffff', resolution: res }, style));
      this.texts = {};
      for (const id of IDS) {
        this.texts[id] = {
          hud: txt({ fontStyle: 'bold' }).setOrigin(id === 'P1' ? 0 : 1, 0.5),
          prompt: txt({ fontStyle: 'bold', align: 'center', stroke: '#000000' }).setOrigin(0.5, 0),
          title: txt({ fontStyle: 'bold', align: 'center', stroke: '#000000' }).setOrigin(0.5),
          sub: txt({ align: 'center' }).setOrigin(0.5, 0),
          bang: txt({ fontStyle: 'bold', color: '#ffffff', stroke: '#000000' }).setOrigin(0.5, 1),
          dist: txt({ color: '#d6e6f2' }).setOrigin(0.5, 0),
          name: txt({ fontStyle: 'bold', align: 'center' }).setOrigin(0.5, 0).setColor(COLORS[id].css),
          meter: txt({ fontStyle: 'bold', color: '#d6e6f2' }).setOrigin(id === 'P1' ? 0 : 1, 1),
          toast: txt({ fontStyle: 'bold', align: 'center', color: '#ffd23f', stroke: '#000000' }).setOrigin(0.5).setVisible(false)
        };
      }
      this.texts.P1.name.setText('ALEMÃO');
      this.texts.P2.name.setText('ALE');
      // D8: tela de pausa após interrupção (por cima de tudo)
      this.pauseGfx = this.add.graphics().setDepth(10);
      this.pauseText = txt({ fontStyle: 'bold', align: 'center', stroke: '#000000' }).setOrigin(0.5).setDepth(11).setVisible(false);

      this.input.on('pointerdown', this.onPointerDown, this);
      this.input.on('pointerdownoutside', (pointer) => this.router.ignore(pointer.id));
      this.input.on('pointermove', this.onPointerMove, this);
      this.input.on('pointerup', this.onPointerUp, this);
      this.input.on('pointerupoutside', this.onPointerUp, this);

      this.session.onEvent((e) => this.onGameEvent(e));
      this.scale.on('resize', this.onResize, this);
      this.onResize(this.scale.gameSize);
      this.lastPanelUpdate = 0;
    }

    // ================= entrada (mesma ponte do P0) =================

    isBlocked() {
      return this.portrait || this.app.menuOpen || this.session.isPaused();
    }

    onPointerDown(pointer) {
      this.app.sfx.unlock();
      if (!this.portrait && !this.app.menuOpen && this.session.awaitingTap) {
        // D8: o toque que retoma o jogo é consumido — não vira ação de nenhum jogador.
        this.session.continueAfterInterruption(performance.now());
        this.router.ignore(pointer.id);
        return;
      }
      if (this.isBlocked()) {
        this.router.ignore(pointer.id);
        return;
      }
      this.router.down({ key: pointer.id, identifier: pointer.identifier, x: pointer.x, time: performance.now() });
    }

    onPointerMove(pointer) {
      if (pointer.isDown) this.router.move({ key: pointer.id, x: pointer.x, time: performance.now() });
    }

    onPointerUp(pointer) {
      this.router.up({
        key: pointer.id, identifier: pointer.identifier, x: pointer.x,
        time: performance.now(), canceled: !!pointer.wasCanceled
      });
    }

    // ================= layout =================

    onResize(size) {
      const W = size.width, H = size.height;
      this.router.setWidth(W);
      const portrait = H > W;
      if (portrait !== this.portrait) {
        this.portrait = portrait;
        if (portrait) this.session.pause('orientação retrato', performance.now());
        else this.session.resume('orientação retrato', performance.now());
        this.router.info('orientacao', portrait ? 'retrato (jogo pausado)' : 'horizontal');
      }

      const hudH = Math.max(30, Math.round(H * 0.09));
      const L = {
        W, H, hudH,
        halfW: W / 2,
        waterTop: hudH + Math.round(H * 0.05),
        waterBottom: Math.round(H * 0.72),
        unit: Math.min(W / 2, H)
      };
      L.bankTop = L.waterBottom;
      L.meterW = Math.max(14, Math.round(W * 0.02));
      L.rodLen = H * 0.2;
      L.side = {
        P1: { x0: 0, cx: L.halfW / 2, playerX: L.halfW * 0.24, bobX: L.halfW * 0.6, dir: 1, meterX: 8 },
        P2: { x0: L.halfW, cx: L.halfW * 1.5, playerX: W - L.halfW * 0.24, bobX: W - L.halfW * 0.6, dir: -1, meterX: W - 8 - L.meterW }
      };
      this.L = L;

      const big = Math.max(16, Math.round(L.unit * 0.075));
      if (this.pauseText) this.pauseText.setFontSize(big).setStroke('#000000', 6).setPosition(W / 2, H / 2).setWordWrapWidth(W * 0.8);
      const mid = Math.max(13, Math.round(L.unit * 0.05));
      const small = Math.max(11, Math.round(L.unit * 0.04));
      for (const id of IDS) {
        const t = this.texts[id];
        const sd = L.side[id];
        t.hud.setFontSize(small).setPosition(id === 'P1' ? 10 : W - 10, hudH / 2);
        t.prompt.setFontSize(mid).setStroke('#000000', 4).setPosition(sd.cx, L.waterTop + 6).setWordWrapWidth(L.halfW * 0.8);
        t.title.setFontSize(big).setStroke('#000000', 5);
        t.sub.setFontSize(small).setWordWrapWidth(L.halfW * 0.62);
        t.bang.setFontSize(Math.round(big * 1.3)).setStroke('#000000', 6);
        t.dist.setFontSize(Math.max(10, Math.round(small * 0.85)));
        t.name.setFontSize(small).setPosition(sd.playerX, H - small - 8);
        t.toast.setFontSize(mid).setStroke('#000000', 5).setPosition(sd.cx, L.waterTop + (L.waterBottom - L.waterTop) * 0.5);
        t.meter.setFontSize(Math.max(9, Math.round(small * 0.75))).setPosition(id === 'P1' ? sd.meterX : sd.meterX + L.meterW, L.waterTop - 2);
      }
    }

    distToY(d) {
      const L = this.L;
      const max = this.session.config.maxLineDistance;
      // o topo da água (~30%) fica reservado para as instruções de cada jogador
      const farthest = L.waterTop + (L.waterBottom - L.waterTop) * 0.3;
      return L.waterBottom - 12 - (Math.max(0, d) / max) * (L.waterBottom - 12 - farthest);
    }

    // ================= eventos → feedback =================

    onGameEvent(e) {
      if (!e.jogador) return;
      this.app.sfx.onEvent(e);
      const id = e.jogador;
      const p = this.session.players[id];
      const sd = this.L.side[id];
      const now = performance.now();
      const at = () => ({ x: sd.bobX, y: this.distToY(p.distance) });
      const m = this.marks[id];
      switch (e.tipo) {
        case 'boia-na-agua': this.addRing(at(), 0xffffff, 300, 18); break;
        case 'arremesso-cancelado':
          // D2: aviso breve, sem pausa nem penalidade (só para o toque curto, não para interrupções)
          if (e.codigo === 'toque-curto') { m.toastUntil = now + 1100; m.toastText = 'SEGURE PARA ARREMESSAR!'; }
          break;
        case 'aviso-retomada':
          // Ajuste de UX: ao retomar (interrupção do sistema, menu ou retrato), só para quem estava carregando.
          if (e.codigo === 'arremesso-cancelado') { m.toastUntil = now + 1300; m.toastText = 'ARREMESSO CANCELADO'; }
          break;
        case 'beliscada': m.nibbleUntil = now + 220; this.addRing(at(), 0xffffff, 300, 10); break;
        case 'mordida':
          m.flashUntil = now + this.session.config.reactionWindowMs;
          m.flashColor = COLORS[id].light;
          this.addRing(at(), 0xffffff, 500, 34); this.addRing(at(), COLORS[id].light, 700, 50);
          break;
        case 'fisgada': m.flashUntil = now + 200; m.flashColor = 0xffffff; this.addRing(at(), 0xffffff, 300, 24); break;
        case 'arrancada': this.addRing(at(), 0xbfe3ff, 400, 22); break;
        case 'captura':
          m.flashUntil = now + 500; m.flashColor = 0x3ccf6e;
          this.addRing({ x: sd.bobX, y: this.L.waterBottom - 12 }, 0x3ccf6e, 700, 60);
          break;
        case 'linha-rompida':
          m.flashUntil = now + 400; m.flashColor = 0xff3b3b; m.snapAt = now; m.snapFrom = at();
          break;
        case 'fuga':
        case 'mordida-perdida':
          this.addRing(at(), 0x8899aa, 500, 30);
          break;
        default: break;
      }
    }

    addRing(pos, color, dur, radius) {
      this.effects.push({ x: pos.x, y: pos.y, color, dur, radius, t0: performance.now() });
    }

    // ================= quadro a quadro =================

    update() {
      const now = performance.now();
      const pointers = this.input.manager.pointers;
      this.router.reconcile((key) => {
        const pointer = pointers[key];
        return !!(pointer && pointer.isDown);
      }, now);
      // Menu aberto ou retrato: a pescaria fica pausada (o tempo parado não conta).
      if (!this.isBlocked()) this.session.update(now);

      const snaps = { P1: this.session.players.P1.snapshot(now), P2: this.session.players.P2.snapshot(now) };
      this.bg.clear(); this.world.clear(); this.fx.clear(); this.ui.clear();
      this.drawBackground(now, snaps);
      for (const id of IDS) this.drawPlayer(id, snaps[id], now);
      this.drawEffects(now);
      this.drawPauseOverlay();

      if (!this.isBlocked()) {
        for (const id of IDS) if (snaps[id].zone) this.app.sfx.warn(id, snaps[id].zone, now);
      }

      if (now - this.lastPanelUpdate > 100) {
        this.lastPanelUpdate = now;
        this.app.diagnostics.update(snaps, {
          fps: Math.round(this.game.loop.actualFps),
          width: Math.round(this.scale.width),
          height: Math.round(this.scale.height),
          paused: this.isBlocked()
        });
      }
    }

    drawBackground(now, snaps) {
      const g = this.bg, L = this.L;
      g.fillStyle(0x0d1418, 1).fillRect(0, 0, L.W, L.hudH);                          // placar
      g.fillStyle(0x24452f, 1).fillRect(0, L.hudH, L.W, L.waterTop - L.hudH);         // margem distante
      g.fillStyle(0x1b4f72, 1).fillRect(0, L.waterTop, L.W, (L.waterBottom - L.waterTop) * 0.5);
      g.fillStyle(0x215f88, 1).fillRect(0, L.waterTop + (L.waterBottom - L.waterTop) * 0.5, L.W, (L.waterBottom - L.waterTop) * 0.5);
      // ondinhas (só para a água "parecer" água)
      g.lineStyle(2, 0xffffff, 0.07);
      for (let i = 0; i < 7; i++) {
        const y = L.waterTop + 14 + i * (L.waterBottom - L.waterTop - 20) / 7;
        const off = ((now / 40) + i * 37) % 80;
        for (let x = -80 + off; x < L.W; x += 80) g.lineBetween(x, y, x + 26, y);
      }
      // margem próxima, com o lado de cada jogador tingido
      g.fillStyle(0x5b4a32, 1).fillRect(0, L.bankTop, L.W, L.H - L.bankTop);
      g.fillStyle(COLORS.P1.tint, 0.16).fillRect(0, L.bankTop, L.halfW, L.H - L.bankTop);
      g.fillStyle(COLORS.P2.tint, 0.14).fillRect(L.halfW, L.bankTop, L.halfW, L.H - L.bankTop);
      g.fillStyle(0x3d6b3a, 1).fillRect(0, L.bankTop, L.W, 5);
      // divisória tracejada: cada um tem sua área de água
      g.lineStyle(2, 0xffffff, 0.3);
      for (let y = L.hudH; y < L.H; y += 18) g.lineBetween(L.halfW, y, L.halfW, Math.min(L.H, y + 9));

      // bordas: piscar (mordida, captura...) e alerta de perigo
      for (const id of IDS) {
        const m = this.marks[id], x0 = L.side[id].x0;
        if (m.flashUntil && now < m.flashUntil) {
          const blink = snaps[id].state === S.BITE ? (Math.floor(now / 120) % 2 ? 1 : 0.45) : 1;
          g.lineStyle(10, m.flashColor, 0.9 * blink).strokeRect(x0 + 5, 5, L.halfW - 10, L.H - 10);
        } else if (snaps[id].zone === 'critica') {
          const pulse = 0.35 + 0.35 * Math.sin(now / 60);
          g.lineStyle(10, ZONE_COLORS.critica, pulse).strokeRect(x0 + 5, 5, L.halfW - 10, L.H - 10);
        } else if (snaps[id].zone === 'frouxa') {
          g.lineStyle(6, ZONE_COLORS.frouxa, 0.25 + 0.2 * Math.sin(now / 150)).strokeRect(x0 + 5, 5, L.halfW - 10, L.H - 10);
        }
      }
    }

    drawPlayer(id, s, now) {
      const g = this.world, L = this.L, sd = L.side[id], col = COLORS[id], t = this.texts[id], cfg = this.session.config;
      const m = this.marks[id];

      // ---- placar ----
      const st = s.stats;
      t.hud.setText((id === 'P1' ? 'ALEMÃO' : 'ALE') + '   🐟 ' + st.capturas +
        (st.capturas ? '  ·  maior ' + kg(st.maiorPesoKg) : '')).setColor(col.css);

      // ---- pescador (greybox) ----
      const bodyW = L.H * 0.07, bodyH = L.H * 0.13;
      const footY = L.H - (t.name.height + 12);
      const bodyTop = footY - bodyH;
      g.fillStyle(col.body, 1).fillRect(sd.playerX - bodyW / 2, bodyTop, bodyW, bodyH);
      g.lineStyle(3, col.main, 1).strokeRect(sd.playerX - bodyW / 2, bodyTop, bodyW, bodyH);
      g.fillStyle(0xcfcfcf, 1).fillCircle(sd.playerX, bodyTop - bodyW * 0.4, bodyW * 0.38);

      // ---- vara ----
      const hand = { x: sd.playerX + sd.dir * bodyW * 0.45, y: bodyTop + bodyH * 0.3 };
      let angle = 52;
      if (s.state === S.CHARGING) angle = 60 + 30 * s.chargePower;              // vara puxada para trás
      if (s.state === S.FIGHTING) angle = 52 - 28 * s.tension;                  // vara curva com a tensão
      if (s.state === S.FIGHTING && s.zone === 'critica') angle += Math.sin(now / 25) * 2;
      const a = angle * Math.PI / 180;
      const tip = { x: hand.x + sd.dir * Math.cos(a) * L.rodLen, y: hand.y - Math.sin(a) * L.rodLen };
      if (id === 'P1') {
        g.lineStyle(6, col.main, 1).lineBetween(hand.x, hand.y, tip.x, tip.y);
        g.fillStyle(col.main, 1).fillCircle(hand.x, hand.y + 4, 7);            // molinete vermelho
      } else {
        g.lineStyle(6, 0x111111, 1).lineBetween(hand.x, hand.y, tip.x, tip.y);
        for (let i = 0; i < 5; i++) {                                         // listras amarelas
          const a0 = (i * 2 + 1) / 10, a1 = (i * 2 + 2) / 10;
          g.lineStyle(6, col.main, 1).lineBetween(lerp(hand.x, tip.x, a0), lerp(hand.y, tip.y, a0), lerp(hand.x, tip.x, a1), lerp(hand.y, tip.y, a1));
        }
        g.fillStyle(0x111111, 1).fillCircle(hand.x, hand.y + 4, 7);
        g.lineStyle(2, col.main, 1).strokeCircle(hand.x, hand.y + 4, 7);
      }
      if (s.pressed) g.lineStyle(3, 0xffffff, 0.8).strokeCircle(hand.x, hand.y + 4, 12);   // "estou pressionando"

      // ---- linha, boia, peixe ----
      t.bang.setVisible(false);
      t.dist.setVisible(false);
      const bob = { x: sd.bobX, y: this.distToY(s.distance) };
      switch (s.state) {
        case S.CHARGING: {
          const d = cfg.castMinDistance + (cfg.castMaxDistance - cfg.castMinDistance) * s.chargePower;
          const ty = this.distToY(d);
          g.lineStyle(2, 0xffffff, 0.7).strokeCircle(sd.bobX, ty, 12);
          g.lineStyle(2, 0xffffff, 0.35).lineBetween(sd.bobX - 20, ty, sd.bobX + 20, ty);
          // medidor de força
          const bw = L.halfW * 0.34, bh = Math.max(10, L.H * 0.03);
          const bx = sd.playerX - bw / 2, by = bodyTop - bodyW - bh - 10;
          g.fillStyle(0x000000, 0.6).fillRect(bx - 2, by - 2, bw + 4, bh + 4);
          g.fillStyle(col.light, 1).fillRect(bx, by, bw * s.chargePower, bh);
          g.lineStyle(2, 0xffffff, 0.8).strokeRect(bx - 2, by - 2, bw + 4, bh + 4);
          break;
        }
        case S.CASTING: {
          const dur = cfg.castFlightBaseMs + cfg.castFlightPerPowerMs * s.castPower;
          const k = Math.min(1, s.msInState / dur);
          const x = lerp(tip.x, bob.x, k), y = lerp(tip.y, bob.y, k) - Math.sin(Math.PI * k) * L.H * 0.18;
          this.drawLine(g, tip, { x, y }, 0.2, 0xffffff, 1.5);
          this.drawBobber(g, x, y, col, 1);
          break;
        }
        case S.WAITING:
        case S.REELING_EMPTY: {
          const dip = m.nibbleUntil && now < m.nibbleUntil ? 5 : 0;
          const y = bob.y + Math.sin(now / 350) * 2 + dip;
          this.drawLine(g, tip, { x: bob.x, y }, 0.35, 0xffffff, 1.5);
          this.drawBobber(g, bob.x, y, col, 1);
          t.dist.setText(Math.round(s.distance) + ' m').setPosition(bob.x, y + 12).setVisible(true);
          break;
        }
        case S.BITE: {
          const y = bob.y + 7 + Math.sin(now / 40) * 2;                     // boia afundando
          this.drawLine(g, tip, { x: bob.x, y }, 0.05, 0xffffff, 2);
          this.drawBobber(g, bob.x, y, col, 0.55);
          g.fillStyle(0x215f88, 1).fillRect(bob.x - 14, y + 1, 28, 12);       // metade de baixo "dentro d'água"
          t.bang.setText('!').setPosition(bob.x, y - 16).setVisible(true);
          // barra da janela de reação (encolhe)
          const k = s.biteLeftMs / s.biteWindowMs, ww = 60;
          g.fillStyle(0xffffff, 0.9).fillRect(bob.x - ww / 2, y + 18, ww * k, 5);
          break;
        }
        case S.FIGHTING:
          this.drawFight(g, s, tip, bob, now, sd);
          break;
        case S.LINE_BROKEN:
          if (m.snapAt && now - m.snapAt < 600) {
            const k = (now - m.snapAt) / 600;
            g.lineStyle(2, 0xff3b3b, 1 - k).lineBetween(tip.x, tip.y, lerp(tip.x, m.snapFrom.x, 0.4), lerp(tip.y, m.snapFrom.y, 0.4) + k * 40);
          }
          break;
        default:
          break;
      }

      if (m.toastUntil && now < m.toastUntil && !s.paused) {
        const left = m.toastUntil - now;
        t.toast.setText(m.toastText).setAlpha(Math.min(1, left / 300)).setVisible(true);
      } else {
        t.toast.setVisible(false);
      }

      this.drawMeter(s, sd, now);
      this.drawPrompt(id, s, now);
      this.drawResult(id, s, now);
    }

    drawFight(g, s, tip, bob, now, sd) {
      const zone = s.zone;
      const pull = s.fish ? s.fish.puxao : 0;
      const run = s.fish && s.fish.fase === 'corrida';
      const amp = 8 + 26 * pull;
      const fx = bob.x + Math.sin(now / (run ? 110 : 380)) * amp;
      const fy = bob.y + Math.cos(now / 520) * 3;
      const sag = s.tension < 0.2 ? 0.45 : s.tension < 0.4 ? 0.15 : 0;
      const jitter = zone === 'critica' ? Math.sin(now / 18) * 3 : 0;
      const width = zone === 'critica' ? 3.5 : zone === 'alerta' ? 2.5 : 2;
      this.drawLine(g, tip, { x: fx + jitter, y: fy }, sag, ZONE_COLORS[zone], width);
      // peixe (sombra) — tamanho conforme o peso
      const size = 1 + Math.min(1, (s.fish ? s.fish.pesoKg : 1) / 6) * 0.9;
      const w = this.L.H * 0.07 * size, h = w * 0.42;
      g.fillStyle(0x08131c, 0.9).fillEllipse(fx, fy + 4, w, h);
      g.lineStyle(2, 0xbfe3ff, 0.5).strokeEllipse(fx, fy + 4, w, h);
      const tailDir = Math.sin(now / (run ? 110 : 380)) > 0 ? -1 : 1;
      g.fillStyle(0x08131c, 0.9).fillTriangle(fx + tailDir * w / 2, fy + 4, fx + tailDir * (w / 2 + h * 0.8), fy + 4 - h / 2, fx + tailDir * (w / 2 + h * 0.8), fy + 4 + h / 2);
      if (run && Math.floor(now / 140) % 2 === 0) {
        g.lineStyle(2, 0xffffff, 0.6).strokeCircle(fx, fy, w * 0.6);
      }
      const t = this.texts[s.id];
      t.dist.setText(Math.max(0, Math.round(s.distance)) + ' m').setPosition(fx, fy + h + 4).setVisible(true);
    }

    drawLine(g, from, to, sag, color, width) {
      const cx = (from.x + to.x) / 2;
      const cy = (from.y + to.y) / 2 + Math.abs(to.x - from.x) * sag + Math.abs(to.y - from.y) * sag * 0.3;
      g.lineStyle(width, color, 0.95);
      g.beginPath();
      g.moveTo(from.x, from.y);
      for (let i = 1; i <= 14; i++) {
        const k = i / 14, u = 1 - k;
        g.lineTo(u * u * from.x + 2 * u * k * cx + k * k * to.x, u * u * from.y + 2 * u * k * cy + k * k * to.y);
      }
      g.strokePath();
    }

    drawBobber(g, x, y, col, alpha) {
      const r = Math.max(7, this.L.H * 0.022);
      g.fillStyle(0xffffff, alpha).fillCircle(x, y, r);
      g.fillStyle(col.main, alpha).slice(x, y, r, Math.PI, 0, false).fillPath();
      g.lineStyle(2, 0x000000, 0.6 * alpha).strokeCircle(x, y, r);
      g.lineStyle(2, 0xffffff, alpha).lineBetween(x, y - r, x, y - r - 6);
    }

    drawMeter(s, sd, now) {
      const g = this.ui, L = this.L, cfg = this.session.config;
      const x = sd.meterX, w = L.meterW, top = L.waterTop + 8, bottom = L.waterBottom - 8, h = bottom - top;
      const active = s.state === S.FIGHTING;
      const alpha = active ? 1 : 0.25;
      const yOf = (v) => bottom - v * h;
      g.fillStyle(0x000000, 0.55 * alpha + 0.1).fillRect(x - 3, top - 3, w + 6, h + 6);
      const bands = [[0, cfg.slackMax, 'frouxa'], [cfg.slackMax, cfg.alertMin, 'segura'], [cfg.alertMin, cfg.criticalMin, 'alerta'], [cfg.criticalMin, 1, 'critica']];
      for (const [a, b, z] of bands) {
        const on = active && s.zone === z;
        g.fillStyle(ZONE_COLORS[z], (on ? 0.95 : 0.4) * alpha).fillRect(x, yOf(b), w, yOf(a) - yOf(b));
      }
      this.texts[s.id].meter.setText('TENSÃO').setAlpha(active ? 1 : 0.4);
      if (!active) return;
      // marcador
      const my = yOf(s.tension);
      g.fillStyle(0xffffff, 1).fillRect(x - 5, my - 2, w + 10, 4);
      const inward = sd.dir;   // ponta do marcador aponta para dentro da tela
      const px = inward > 0 ? x + w + 5 : x - 5;
      g.fillTriangle(px, my - 7, px, my + 7, px + inward * 10, my);
      // risco acumulado: vermelho desce do topo (arrebentar), azul sobe da base (escapar)
      const rx = inward > 0 ? x + w + 18 : x - 24, rw = 6;
      const kc = Math.min(1, s.criticalMs / cfg.criticalBreakMs);
      const ks = Math.min(1, s.slackMs / cfg.slackEscapeMs);
      g.fillStyle(0x000000, 0.5).fillRect(rx, top, rw, h);
      if (kc > 0) g.fillStyle(ZONE_COLORS.critica, 1).fillRect(rx, top, rw, h / 2 * kc);
      if (ks > 0) g.fillStyle(ZONE_COLORS.frouxa, 1).fillRect(rx, bottom - h / 2 * ks, rw, h / 2 * ks);
    }

    drawPrompt(id, s, now) {
      const t = this.texts[id].prompt;
      let text = '', color = '#ffffff';
      switch (s.state) {
        case S.IDLE: text = 'SEGURE para carregar\nSOLTE para arremessar'; break;
        case S.CHARGING: text = 'SOLTE para arremessar!  ' + Math.round(s.chargePower * 100) + '%'; break;
        case S.WAITING: text = 'Espere a boia AFUNDAR…\n(segure para recolher)'; color = '#d6e6f2'; break;
        case S.REELING_EMPTY: text = 'Recolhendo a linha…\n(solte para parar)'; color = '#d6e6f2'; break;
        case S.BITE: text = 'TOQUE AGORA!'; color = Math.floor(now / 120) % 2 ? '#ffffff' : this.cssOf(id); break;
        case S.FIGHTING:
          if (s.zone === 'critica') { text = 'SOLTE! A linha vai arrebentar'; color = '#ff6b6b'; }
          else if (s.zone === 'alerta') { text = 'Cuidado: solte para aliviar'; color = '#ffc46b'; }
          else if (s.zone === 'frouxa') { text = 'SEGURE! A linha está frouxa'; color = '#8cc8ff'; }
          else { text = 'SEGURE recolhe · SOLTE alivia'; color = '#9ff0b8'; }
          break;
        default: text = ''; break;
      }
      t.setText(text).setColor(color);
    }

    cssOf(id) { return COLORS[id].css; }

    drawResult(id, s, now) {
      const t = this.texts[id], L = this.L, sd = L.side[id], cfg = this.session.config;
      const show = s.state === S.CAUGHT || s.state === S.ESCAPED || s.state === S.LINE_BROKEN;
      t.title.setVisible(show);
      t.sub.setVisible(show);
      if (!show) return;
      const r = s.lastResult || {};
      const g = this.ui;
      const cw = L.halfW * 0.72, ch = (L.waterBottom - L.waterTop) * 0.62;
      const cx = sd.cx, cy = L.waterTop + (L.waterBottom - L.waterTop) * 0.55;
      const pop = Math.min(1, s.msInState / 150);
      let title, sub, border;
      if (s.state === S.CAUGHT) {
        title = 'PEGOU!';
        sub = r.peixe + ' · ' + kg(r.pesoKg) + '\nCapturado por ' + (id === 'P1' ? 'ALEMÃO' : 'ALE');
        border = 0x3ccf6e;
      } else if (s.state === S.LINE_BROKEN) {
        title = 'LINHA ROMPEU!';
        sub = 'Ficou no vermelho tempo demais.\nSolte quando a tensão subir.';
        border = 0xff3b3b;
      } else if (r.motivo === 'sem-reacao') {
        title = 'ESCAPOU!';
        sub = 'Não deu tempo de fisgar (janela de ' + (r.janelaMs / 1000).toFixed(1).replace('.', ',') + ' s).\nToque logo que a boia afundar.';
        border = 0x8899aa;
      } else {
        title = 'ESCAPOU!';
        sub = 'A linha ficou frouxa demais.\nSegure para manter a linha esticada.';
        border = 0x4aa3ff;
      }
      g.fillStyle(0x0b141b, 0.88 * pop).fillRoundedRect(cx - cw / 2, cy - ch / 2, cw, ch, 12);
      g.lineStyle(4, border, pop).strokeRoundedRect(cx - cw / 2, cy - ch / 2, cw, ch, 12);
      let titleY = cy - ch * 0.3;
      if (s.state === S.CAUGHT) {
        // "foto" do peixe: silhueta colorida pelo perfil, tamanho pelo peso
        const fw = cw * (0.22 + 0.25 * Math.min(1, r.pesoKg / 6)), fh = fw * 0.42;
        const fy = cy - ch * 0.08, color = FISH_COLORS[r.perfil] || 0xcccccc;
        g.fillStyle(color, pop).fillEllipse(cx - fh * 0.3, fy, fw, fh);
        g.fillTriangle(cx - fh * 0.3 + fw / 2 - 4, fy, cx - fh * 0.3 + fw / 2 + fh * 0.9, fy - fh / 2, cx - fh * 0.3 + fw / 2 + fh * 0.9, fy + fh / 2);
        g.fillStyle(0x000000, pop).fillCircle(cx - fh * 0.3 - fw * 0.32, fy - fh * 0.1, Math.max(2, fh * 0.08));
        titleY = cy - ch * 0.36;
      }
      t.title.setText(title).setPosition(cx, titleY).setAlpha(pop).setColor(s.state === S.CAUGHT ? '#9ff0b8' : '#ffffff');
      const canSkip = s.msInState >= cfg.resultSkipAfterMs;   // D7: igual para todos os cartões
      t.sub.setText(sub + (canSkip ? '\n\n(toque e segure para arremessar de novo)' : ''))
        .setPosition(cx, s.state === S.CAUGHT ? cy + ch * 0.1 : cy - ch * 0.12).setAlpha(pop);
    }

    /** D8: depois de uma interrupção, a tela pede um toque para continuar. */
    drawPauseOverlay() {
      const g = this.pauseGfx, L = this.L;
      g.clear();
      const show = this.session.awaitingTap && !this.app.menuOpen && !this.portrait;
      this.pauseText.setVisible(show);
      if (!show) return;
      g.fillStyle(0x000000, 0.6).fillRect(0, 0, L.W, L.H);
      this.pauseText.setText('PAUSADO\n\nToque na tela para continuar');
    }

    drawEffects(now) {
      const g = this.fx;
      this.effects = this.effects.filter((e) => now - e.t0 < e.dur);
      for (const e of this.effects) {
        const k = (now - e.t0) / e.dur;
        g.lineStyle(3, e.color, 1 - k).strokeEllipse(e.x, e.y, e.radius * 2 * (0.3 + k), e.radius * 0.8 * (0.3 + k));
      }
    }
  }

  root.HF = root.HF || {};
  root.HF.FishingScene = FishingScene;
})(window);
