/*
 * Hangover Fishing — Protótipo 0 (multitouch)
 * OrientationScene: aviso "Gire o celular" quando a tela está em retrato.
 *
 * Uma página comum não consegue travar a orientação (principalmente no
 * iPhone). Por isso a solução é avisar e bloquear a entrada enquanto a
 * tela estiver em retrato. Esta cena fica por cima da cena de teste e
 * aparece/desaparece sozinha.
 */
(function (root) {
  'use strict';

  class OrientationScene extends Phaser.Scene {
    constructor() {
      super({ key: 'OrientationScene', active: true });
    }

    create() {
      this.bg = this.add.rectangle(0, 0, 10, 10, 0x101418, 0.97).setOrigin(0, 0);
      this.message = this.add.text(0, 0, '↻\n\nGire o celular para a horizontal', {
        fontFamily: 'system-ui, -apple-system, Roboto, sans-serif',
        fontSize: '22px',
        color: '#e8edf2',
        align: 'center',
        resolution: Math.min(window.devicePixelRatio || 1, 3)
      }).setOrigin(0.5);
      this.scale.on('resize', this.layout, this);
      this.layout(this.scale.gameSize);
    }

    layout(size) {
      const width = size.width;
      const height = size.height;
      this.bg.setSize(width, height);
      this.message.setPosition(width / 2, height / 2).setWordWrapWidth(width * 0.8);
      this.sys.setVisible(height > width);
    }
  }

  root.HF = root.HF || {};
  root.HF.OrientationScene = OrientationScene;
})(window);
