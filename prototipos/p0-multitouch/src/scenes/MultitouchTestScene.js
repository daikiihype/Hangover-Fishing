/*
 * Hangover Fishing — Protótipo 0 (multitouch)
 * MultitouchTestScene: a tela de teste.
 *
 * Papel desta cena: ser a "ponte" entre o Phaser e a lógica (TouchRouter).
 *   - recebe os eventos de toque do Phaser e repassa ao TouchRouter;
 *   - a cada quadro, roda a rede de segurança (reconcile) e o limiar de "segurar";
 *   - desenha as duas zonas, os dedos e o painel de diagnóstico.
 *
 * Elementos apenas temporários (formas e texto), como pede o plano.
 */
(function (root) {
  'use strict';

  const COLORS = {
    P1: { base: 0x3a1616, pressed: 0x8a2525, held: 0xd23c3c, finger: 0xff5a5a },  // vara vermelha do Alemão
    P2: { base: 0x2c2810, pressed: 0x7a6a12, held: 0xd8b21f, finger: 0xffd23f }   // vara preta e amarela do ALE
  };

  class MultitouchTestScene extends Phaser.Scene {
    constructor() {
      super({ key: 'MultitouchTestScene' });
    }

    create() {
      this.app = root.HF.app;
      this.router = this.app.router;
      this.app.scene = this;
      this.portrait = false;

      this.zoneGfx = this.add.graphics();
      const res = Math.min(window.devicePixelRatio || 1, 3);
      this.bigLabels = {
        P1: this.add.text(0, 0, 'JOGADOR 1\nALEMÃO', { fontFamily: 'system-ui, sans-serif', fontStyle: 'bold', align: 'center', color: '#ffffff', resolution: res }).setOrigin(0.5).setAlpha(0.12),
        P2: this.add.text(0, 0, 'JOGADOR 2\nALE', { fontFamily: 'system-ui, sans-serif', fontStyle: 'bold', align: 'center', color: '#ffffff', resolution: res }).setOrigin(0.5).setAlpha(0.12)
      };
      this.panel = new root.HF.DiagnosticsPanel(this, this.router);
      this.fingerGfx = this.add.graphics();
      this.fingerLabels = [];
      for (let i = 0; i < 8; i++) {
        this.fingerLabels.push(this.add.text(0, 0, '', {
          fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontStyle: 'bold', color: '#ffffff', resolution: res
        }).setOrigin(0.5, 1).setVisible(false));
      }

      this.input.on('pointerdown', this.onPointerDown, this);
      // Toque que começa FORA do canvas (ex.: no botão do menu): não pertence a nenhum jogador.
      this.input.on('pointerdownoutside', (pointer) => this.router.ignore(pointer.id));
      this.input.on('pointermove', this.onPointerMove, this);
      this.input.on('pointerup', this.onPointerUp, this);
      this.input.on('pointerupoutside', this.onPointerUp, this);

      this.scale.on('resize', this.onResize, this);
      this.onResize(this.scale.gameSize);
      this.panel.setTest({ id: 'livre' });
      this.lastPanelUpdate = 0;
    }

    // ---------- entrada ----------

    isBlocked() {
      return this.portrait || this.app.menuOpen;
    }

    onPointerDown(pointer) {
      if (this.isBlocked()) {
        this.router.ignore(pointer.id);
        return;
      }
      this.router.down({ key: pointer.id, identifier: pointer.identifier, x: pointer.x, time: performance.now() });
    }

    onPointerMove(pointer) {
      if (pointer.isDown) {
        this.router.move({ key: pointer.id, x: pointer.x, time: performance.now() });
      }
    }

    onPointerUp(pointer) {
      this.router.up({
        key: pointer.id,
        identifier: pointer.identifier,
        x: pointer.x,
        time: performance.now(),
        canceled: !!pointer.wasCanceled      // o Phaser marca toques cancelados pelo sistema
      });
    }

    // ---------- layout ----------

    onResize(size) {
      const width = size.width;
      const height = size.height;
      this.router.setWidth(width);

      const portrait = height > width;
      if (portrait !== this.portrait) {
        this.portrait = portrait;
        if (portrait) this.router.cancelAll('orientação retrato');
        this.router.info('orientacao', portrait ? 'retrato (entrada bloqueada)' : 'horizontal');
      }

      const big = Math.max(18, Math.round(Math.min(width / 2, height) * 0.11));
      this.bigLabels.P1.setFontSize(big).setPosition(width / 4, height * 0.5);
      this.bigLabels.P2.setFontSize(big).setPosition(width * 0.75, height * 0.5);
      this.panel.layout(width, height);
      this.fingerRadius = Math.max(26, Math.round(height * 0.075));
      for (const label of this.fingerLabels) label.setFontSize(Math.max(12, Math.round(height * 0.032)));
    }

    setTest(test) {
      this.panel.setTest(test);
    }

    // ---------- quadro a quadro ----------

    update() {
      const now = performance.now();
      const pointers = this.input.manager.pointers;

      // Rede de segurança: nenhum toque pode ficar "preso" sem dedo de verdade.
      this.router.reconcile((key) => {
        const pointer = pointers[key];
        return !!(pointer && pointer.isDown);
      }, now);
      this.router.update(now);

      this.drawZones(now);
      this.drawFingers(now, pointers);

      if (now - this.lastPanelUpdate > 66) {          // ~15 atualizações de texto por segundo
        this.lastPanelUpdate = now;
        this.panel.update(now, {
          fps: Math.round(this.game.loop.actualFps),
          width: Math.round(this.scale.width),
          height: Math.round(this.scale.height),
          nativeTouches: this.app.nativeTouches,
          maxNativeTouches: this.app.maxNativeTouches
        });
      }
    }

    drawZones(now) {
      const g = this.zoneGfx;
      const width = this.scale.width;
      const height = this.scale.height;
      g.clear();
      for (const id of ['P1', 'P2']) {
        const state = this.router.zones[id].getState(now);
        const palette = COLORS[id];
        const color = state === 'segurando' ? palette.held : state === 'pressionado' ? palette.pressed : palette.base;
        const x = id === 'P1' ? 0 : width / 2;
        g.fillStyle(color, 1).fillRect(x, 0, width / 2, height);
        if (state !== 'livre') {
          g.lineStyle(6, 0xffffff, 0.85).strokeRect(x + 3, 3, width / 2 - 6, height - 6);
        }
      }
      g.lineStyle(2, 0xffffff, 0.5).lineBetween(width / 2, 0, width / 2, height);   // divisória
    }

    drawFingers(now, pointers) {
      const g = this.fingerGfx;
      g.clear();
      const fingers = this.router.activeFingers(now);
      const r = this.fingerRadius;

      this.fingerLabels.forEach((label) => label.setVisible(false));
      fingers.forEach((f, index) => {
        const pointer = pointers[f.key];
        if (!pointer) return;
        const color = COLORS[f.zona].finger;
        g.fillStyle(color, 0.35).fillCircle(pointer.x, pointer.y, r);
        g.lineStyle(4, color, 1).strokeCircle(pointer.x, pointer.y, r);
        if (f.sobreOutraZona) {
          // anel tracejado: "este dedo está na outra zona, mas continua sendo meu"
          const segments = 16;
          for (let i = 0; i < segments; i += 2) {
            g.beginPath();
            g.arc(pointer.x, pointer.y, r + 10, (i / segments) * Math.PI * 2, ((i + 1) / segments) * Math.PI * 2);
            g.strokePath();
          }
        }
        const label = this.fingerLabels[index];
        if (label) {
          label.setText(f.zona + ' · ptr ' + f.key).setColor('#' + color.toString(16).padStart(6, '0'))
            .setPosition(pointer.x, pointer.y - r - 14).setVisible(true);
        }
      });
    }
  }

  root.HF = root.HF || {};
  root.HF.MultitouchTestScene = MultitouchTestScene;
})(window);
