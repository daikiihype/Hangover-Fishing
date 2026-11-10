/*
 * Hangover Fishing — Protótipo 0 (multitouch)
 * main.js: inicialização.
 *
 * 1. Cria a lógica de entrada (TouchRouter).
 * 2. Bloqueia gestos do navegador que atrapalham dois jogadores.
 * 3. Trata interrupções da página (perda de foco, página oculta).
 * 4. Conta os toques "nativos" do navegador, para comparar com o que o jogo acompanha.
 * 5. Cria o jogo Phaser e o menu de testes.
 */
(function (root) {
  'use strict';

  const ACTIVE_POINTERS = 4;      // dedos acompanhados ao mesmo tempo (2 jogadores + margem)
  const HOLD_THRESHOLD_MS = 200;  // limiar inicial entre "toque" e "segurar" (ajustável no menu)

  const router = new root.HF.TouchRouter({ holdThresholdMs: HOLD_THRESHOLD_MS });
  const app = root.HF.app = {
    router,
    scene: null,
    menuOpen: false,
    nativeTouches: 0,
    maxNativeTouches: 0,
    activePointers: ACTIVE_POINTERS,
    startedAt: new Date()
  };

  // ---------- 1. Gestos do navegador ----------

  const insideMenu = (target) => !!(target && target.closest && target.closest('#menu'));

  // Rolagem, "puxar para atualizar" e zoom por pinça (exceto dentro do menu, que precisa rolar)
  document.addEventListener('touchmove', (event) => {
    if (!insideMenu(event.target) && event.cancelable) event.preventDefault();
  }, { passive: false });

  // Zoom por pinça do Safari (iPhone/iPad)
  ['gesturestart', 'gesturechange', 'gestureend'].forEach((type) => {
    document.addEventListener(type, (event) => event.preventDefault());
  });

  // Menu de toque longo e zoom por toque duplo
  document.addEventListener('contextmenu', (event) => {
    if (!insideMenu(event.target)) event.preventDefault();
  });
  document.addEventListener('dblclick', (event) => event.preventDefault());

  // ---------- 2. Toques nativos (diagnóstico) ----------

  function trackNative(event) {
    app.nativeTouches = event.touches.length;
    if (event.touches.length > app.maxNativeTouches) app.maxNativeTouches = event.touches.length;
  }

  document.addEventListener('touchstart', (event) => {
    trackNative(event);
    if (!insideMenu(event.target) && event.touches.length > ACTIVE_POINTERS) {
      router.warn('limite-de-dedos', {
        detalhe: event.touches.length + ' dedos na tela; o protótipo acompanha até ' + ACTIVE_POINTERS
      });
    }
  }, { capture: true, passive: true });

  document.addEventListener('touchend', trackNative, { capture: true, passive: true });

  document.addEventListener('touchcancel', (event) => {
    trackNative(event);
    router.warn('touchcancel-nativo', {
      detalhe: event.changedTouches.length + ' toque(s) cancelado(s) pelo sistema'
    });
  }, { capture: true, passive: true });

  // ---------- 3. Interrupções ----------

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) router.cancelAll('página oculta');
    else router.info('pagina-visivel', 'a página voltou a ficar visível');
  });
  window.addEventListener('blur', () => router.cancelAll('perda de foco'));
  window.addEventListener('pagehide', () => router.cancelAll('página escondida (pagehide)'));

  // ---------- 4. Phaser ----------

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#101418',
    banner: false,
    scale: {
      mode: Phaser.Scale.RESIZE,        // o canvas ocupa a tela inteira, sem faixas mortas
      width: window.innerWidth,
      height: window.innerHeight
    },
    input: {
      activePointers: ACTIVE_POINTERS,  // por padrão o Phaser acompanha só 1 toque
      touch: { capture: true },         // o Phaser impede o comportamento padrão dos toques no canvas
      keyboard: false
    },
    scene: [root.HF.MultitouchTestScene, root.HF.OrientationScene]
  });
  app.game = game;

  // ---------- 5. Menu de testes ----------

  function requestFullscreen() {
    const el = document.documentElement;
    const isFull = document.fullscreenElement || document.webkitFullscreenElement;
    if (isFull) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      return;
    }
    const request = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!request) {
      router.info('tela-cheia', 'indisponível neste navegador (normal no iPhone)');
      return;
    }
    try {
      const result = request.call(el);
      if (result && result.catch) {
        result.catch(() => router.info('tela-cheia', 'pedido recusado pelo navegador'));
      }
    } catch (err) {
      router.info('tela-cheia', 'pedido recusado pelo navegador');
    }
  }

  function buildReport() {
    const format = root.HF.DiagnosticsPanel.formatEntry;
    const now = performance.now();
    const lines = [];
    lines.push('# Relatório — Protótipo 0 (multitouch)');
    lines.push('Gerado em: ' + new Date().toLocaleString('pt-BR'));
    lines.push('Navegador: ' + navigator.userAgent);
    lines.push('Tela: ' + Math.round(game.scale.width) + '×' + Math.round(game.scale.height) +
      ' (densidade de pixels ' + (window.devicePixelRatio || 1) + ')');
    lines.push('Phaser: ' + Phaser.VERSION + ' · ponteiros de toque: ' + ACTIVE_POINTERS +
      ' · limiar: ' + router.holdThresholdMs + ' ms');
    lines.push('Máximo de toques nativos simultâneos observado: ' + app.maxNativeTouches);
    lines.push('');
    for (const id of ['P1', 'P2']) {
      const z = router.zones[id];
      const c = z.counters;
      lines.push(id + ' (' + z.label + '): estado ' + z.getState(now) + ' · inícios ' + c.inicios + ' · toques ' + c.toques +
        ' · segurar ' + c.segurares + ' · cancelados ' + c.cancelamentos + ' · máx. dedos ' + c.maxDedos);
    }
    lines.push('Erros: ' + router.errors.length + ' · Avisos: ' + router.warnings.length);
    for (const e of router.errors) lines.push('  ' + format(e));
    lines.push('');
    lines.push('## Registro (teste · evento)');
    for (const e of router.log) lines.push('[' + e.teste + '] ' + format(e));
    return lines.join('\n');
  }

  const menu = new root.HF.TestMenu({
    onOpen() {
      app.menuOpen = true;
      router.cancelAll('menu aberto');
    },
    onClose() {
      app.menuOpen = false;
    },
    onSelectTest(test) {
      router.setTest(test.id);
      router.info('teste', test.titulo);
      if (app.scene) app.scene.setTest(test);
    },
    onThreshold(delta) {
      const value = Math.min(500, Math.max(100, router.holdThresholdMs + delta));
      router.setHoldThreshold(value);
      router.info('limiar', value + ' ms');
      return value;
    },
    onReset() {
      router.resetCounters();
      app.maxNativeTouches = app.nativeTouches;
    },
    onFullscreen: requestFullscreen,
    onReport: buildReport
  });
  menu.setThresholdLabel(HOLD_THRESHOLD_MS);
  app.menu = menu;
  app.buildReport = buildReport;
})(window);
