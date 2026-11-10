/*
 * Hangover Fishing — Protótipo 0 (multitouch)
 * DiagnosticsPanel: textos de diagnóstico desenhados pelo Phaser.
 *
 * Mostra, para cada jogador: estado, dedos ativos, contadores e a lista de
 * toques ativos (ponteiro, id do navegador, sequência de início, duração).
 * Embaixo: linha técnica (FPS, tela, limiar, toques nativos, erros),
 * último erro e o registro dos eventos mais recentes.
 */
(function (root) {
  'use strict';

  const ESTADOS = { livre: 'LIVRE', pressionado: 'PRESSIONADO', segurando: 'SEGURANDO' };

  function seg(ms) {
    return (ms / 1000).toFixed(2) + ' s';
  }

  function formatEntry(e) {
    const cab = '#' + String(e.seq).padStart(3, ' ') + '  ' + (e.t / 1000).toFixed(3) + 's  ' + (e.zona || '--') + '  ';
    const ptr = 'ponteiro ' + e.key + (e.identifier != null ? ' (toque ' + e.identifier + ')' : '');
    switch (e.tipo) {
      case 'inicio':
        return cab + 'INÍCIO     ' + ptr + '  · dedos na zona: ' + e.dedosNaZona;
      case 'fim':
        return cab + 'FIM        ' + ptr + '  · ' + e.classificacao + ' ' + e.duracao + ' ms  [início #' + e.inicioSeq + ']' +
          (e.cruzou ? '  · passou pela outra zona' + (e.zonaFim && e.zonaFim !== e.zona ? ' e terminou nela' : '') : '');
      case 'cancelado':
        return cab + 'CANCELADO  ' + ptr + '  · ' + e.duracao + ' ms  [início #' + e.inicioSeq + ']  · ' + (e.motivo || '');
      case 'segurar-inicio':
        return cab + 'SEGURAR    ' + ptr + '  [início #' + e.inicioSeq + ']';
      case 'cruzou':
      case 'voltou':
        return cab + (e.tipo === 'cruzou' ? 'CRUZOU     ' : 'VOLTOU     ') + ptr + '  · ' + e.detalhe;
      case 'reset':
        return cab + 'RESET      ' + e.motivo + '  · toques encerrados: ' + e.afetados;
      case 'erro':
        return cab + 'ERRO       ' + e.codigo + '  · ' + (e.detalhe || '') + (e.key != null ? '  (ponteiro ' + e.key + ')' : '');
      case 'aviso':
        return cab + 'AVISO      ' + e.codigo + '  · ' + (e.detalhe || '');
      case 'info':
        return cab + 'INFO       ' + e.codigo + '  · ' + (e.detalhe || '');
      default:
        return cab + e.tipo;
    }
  }

  class DiagnosticsPanel {
    constructor(scene, router) {
      this.scene = scene;
      this.router = router;
      const res = Math.min(window.devicePixelRatio || 1, 3);
      const base = { fontFamily: 'ui-monospace, Menlo, Consolas, monospace', color: '#e8edf2', resolution: res };

      // Fundo escuro atrás dos textos de cada zona (contraste com as cores fortes)
      this.zoneBg = {
        P1: scene.add.rectangle(0, 0, 10, 10, 0x000000, 0.45).setOrigin(0, 0),
        P2: scene.add.rectangle(0, 0, 10, 10, 0x000000, 0.45).setOrigin(0, 0)
      };
      this.zoneTitle = {
        P1: scene.add.text(0, 0, 'P1 · ALEMÃO', Object.assign({}, base, { fontStyle: 'bold' })),
        P2: scene.add.text(0, 0, 'P2 · ALE', Object.assign({}, base, { fontStyle: 'bold' }))
      };
      this.zoneText = {
        P1: scene.add.text(0, 0, '', base),
        P2: scene.add.text(0, 0, '', base)
      };
      this.logBg = scene.add.rectangle(0, 0, 10, 10, 0x000000, 0.55).setOrigin(0, 0);
      this.statusText = scene.add.text(0, 0, '', Object.assign({}, base, { color: '#9aa7b3' }));
      this.testText = scene.add.text(0, 0, '', Object.assign({}, base, { color: '#ffd23f' }));
      this.errorText = scene.add.text(0, 0, '', Object.assign({}, base, { color: '#ff6b6b' }));
      this.logText = scene.add.text(0, 0, '', base);
      this.logLines = 6;
    }

    layout(width, height) {
      const fs = Math.max(11, Math.min(16, Math.round(height * 0.032)));
      const pad = Math.round(fs * 0.9);
      this.fs = fs;
      const lineH = Math.round(fs * 1.3);

      // O botão "☰ TESTES" fica no centro do topo: os painéis desviam dele.
      const menuGap = 64;
      this.pad = pad;
      this.panelWidth = width / 2 - pad - menuGap;
      for (const id of ['P1', 'P2']) {
        const x = id === 'P1' ? pad : width / 2 + menuGap;
        this.zoneTitle[id].setFontSize(Math.round(fs * 1.35)).setPosition(x, pad);
        this.zoneText[id].setFontSize(fs).setPosition(x, pad + Math.round(fs * 2)).setLineSpacing(Math.round(fs * 0.25));
        this.zoneText[id].setWordWrapWidth(this.panelWidth);
      }

      // Caixa inferior: status + teste atual + último erro + registro
      this.logLines = height < 380 ? 3 : 5;
      const logStep = Math.round(fs * 1.25) + Math.round(fs * 0.3);   // altura de cada linha do registro
      const boxH = lineH * 3 + logStep * this.logLines + pad;
      const boxY = height - boxH;
      this.logBg.setPosition(0, boxY).setSize(width, boxH);
      this.statusText.setFontSize(fs).setPosition(pad, boxY + pad / 2);
      this.testText.setFontSize(fs).setPosition(pad, boxY + pad / 2 + lineH).setWordWrapWidth(null);
      this.errorText.setFontSize(fs).setPosition(pad, boxY + pad / 2 + lineH * 2);
      this.logText.setFontSize(fs).setPosition(pad, boxY + pad / 2 + lineH * 3).setLineSpacing(Math.round(fs * 0.3));
      this.logText.setWordWrapWidth(null);
      this.bottomY = boxY;
    }

    setTest(test) {
      this.testText.setText(test.id === 'livre'
        ? 'Teste livre — escolha um roteiro em ☰ TESTES'
        : 'Teste ' + test.titulo + '  (instruções em ☰ TESTES)');
    }

    update(time, info) {
      const router = this.router;
      const ativos = router.activeFingers(time);

      for (const id of ['P1', 'P2']) {
        const zone = router.zones[id];
        const c = zone.counters;
        const lines = [
          ESTADOS[zone.getState(time)] + '  ·  dedos: ' + zone.activeCount,
          'toques ' + c.toques + ' · segurar ' + c.segurares + ' · cancel. ' + c.cancelamentos,
          'máx. dedos ' + c.maxDedos + ' · maior duração ' + seg(zone.longestActiveDuration(time))
        ];
        for (const f of ativos.filter((a) => a.zona === id)) {
          lines.push('▸ ptr ' + f.key + ' · toque ' + f.identifier + ' · início #' + f.inicioSeq + ' · ' + seg(f.duracao) +
            (f.segurando ? ' · SEG' : '') + (f.sobreOutraZona ? ' · NA OUTRA ZONA' : ''));
        }
        this.zoneText[id].setText(lines.join('\n'));
        const title = this.zoneTitle[id];
        const body = this.zoneText[id];
        this.zoneBg[id]
          .setPosition(title.x - this.pad / 2, title.y - this.pad / 2)
          .setSize(this.panelWidth + this.pad, body.y + body.height - title.y + this.pad);
      }

      this.statusText.setText(
        'FPS ' + info.fps + '  ·  tela ' + info.width + '×' + info.height +
        '  ·  limiar ' + router.holdThresholdMs + ' ms' +
        '  ·  toques nativos ' + info.nativeTouches + ' (máx. ' + info.maxNativeTouches + ')' +
        '  ·  erros ' + router.errors.length + '  ·  avisos ' + router.warnings.length
      );

      const lastError = router.errors[router.errors.length - 1];
      this.errorText.setText(lastError ? 'Último erro → ' + formatEntry(lastError) : 'Nenhum erro detectado.');
      this.errorText.setColor(lastError ? '#ff6b6b' : '#6bd18b');

      const recent = router.log.slice(-this.logLines);
      this.logText.setText(recent.map(formatEntry).join('\n'));
    }
  }

  DiagnosticsPanel.formatEntry = formatEntry;

  root.HF = root.HF || {};
  root.HF.DiagnosticsPanel = DiagnosticsPanel;
})(window);
