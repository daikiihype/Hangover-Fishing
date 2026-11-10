/*
 * Hangover Fishing — Protótipo P1 (pesca)
 * main.js: inicialização.
 *
 * 1. Cria a sessão de pesca (que já contém o TouchRouter do P0).
 * 2. Bloqueia gestos do navegador (mesmas proteções do P0).
 * 3. Trata interrupções da página (perda de foco, página oculta).
 * 4. Cria o jogo Phaser, o painel de diagnóstico, o som e o menu.
 *
 * Endereço com parâmetros opcionais:
 *   ?diag=1        abre já com o painel de diagnóstico
 *   ?seed=1234     fixa a semente aleatória (repete a mesma sequência de sorteios)
 */
(function (root) {
  'use strict';

  const ACTIVE_POINTERS = 4;
  const params = new URLSearchParams(root.location.search);
  const seedParam = params.get('seed');
  const seed = seedParam != null && seedParam !== '' ? (Number(seedParam) >>> 0) : (Date.now() >>> 0);

  const config = root.HF.createConfig();
  const problems = root.HF.validateConfig(config);
  if (problems.length) console.warn('Configuração com problemas:', problems);

  const session = new root.HF.FishingSession({ config, seed });
  const router = session.router;
  const app = root.HF.app = {
    session,
    router,
    scene: null,
    menuOpen: false,
    sfx: new root.HF.Sfx(),
    diagnostics: new root.HF.DiagnosticsPanel(session),
    startedAt: new Date()
  };

  // ---------- 1. Gestos do navegador (igual ao P0) ----------
  const insideMenu = (target) => !!(target && target.closest && target.closest('#menu'));
  document.addEventListener('touchmove', (event) => {
    if (!insideMenu(event.target) && event.cancelable) event.preventDefault();
  }, { passive: false });
  ['gesturestart', 'gesturechange', 'gestureend'].forEach((type) => {
    document.addEventListener(type, (event) => event.preventDefault());
  });
  document.addEventListener('contextmenu', (event) => {
    if (!insideMenu(event.target)) event.preventDefault();
  });
  document.addEventListener('dblclick', (event) => event.preventDefault());
  // libera o áudio no primeiro toque em qualquer lugar
  document.addEventListener('touchstart', () => app.sfx.unlock(), { capture: true, passive: true });
  document.addEventListener('mousedown', () => app.sfx.unlock(), { capture: true });

  // ---------- 2. Interrupções (D8) ----------
  // Eventos que o navegador realmente oferece:
  //   blur                 a janela perdeu o foco (alguns painéis do sistema, alertas, outra janela)
  //   visibilitychange     a página ficou oculta (troca de app, tela bloqueada, outra aba)
  //   pagehide / freeze    a página foi escondida ou congelada pelo navegador
  // Qualquer um deles: encerra os toques e CONGELA a pescaria dos dois jogadores.
  // A volta (focus, visibilitychange visível, pageshow) NÃO retoma sozinha: os jogadores
  // retomam tocando na tela, e esse toque não vira ação de nenhum dos dois.
  // Não existe evento para tudo: um painel do sistema que não tira o foco nem oculta a
  // página é invisível para o jogo (ver README, limitações).
  const interrupt = (motivo) => session.interrupt(motivo, performance.now());
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) interrupt('página oculta');
    else router.info('pagina-visivel', 'página visível de novo — aguardando toque para continuar');
  });
  root.addEventListener('blur', () => interrupt('perda de foco'));
  root.addEventListener('focus', () => router.info('foco', 'janela recuperou o foco'));
  root.addEventListener('pagehide', () => interrupt('página escondida (pagehide)'));
  root.addEventListener('pageshow', (event) => {
    if (event.persisted) interrupt('página restaurada do cache (pageshow)');
  });
  document.addEventListener('freeze', () => interrupt('página congelada pelo navegador (freeze)'));
  // Página aberta já oculta (ex.: carregada em segundo plano): começa pausada.
  if (document.hidden) interrupt('página carregada oculta');

  // ---------- 3. Phaser ----------
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#101418',
    banner: false,
    scale: { mode: Phaser.Scale.RESIZE, width: root.innerWidth, height: root.innerHeight },
    input: { activePointers: ACTIVE_POINTERS, touch: { capture: true }, keyboard: false },
    scene: [root.HF.FishingScene, root.HF.OrientationScene]
  });
  app.game = game;

  // Proteção extra (não existe no P0): na emulação de celular do Chromium/Edge
  // o Phaser às vezes registra o novo tamanho do contêiner sem reaplicar a
  // escala depois de girar a tela. Forçar um refresh logo depois resolve.
  let refreshTimers = [];
  function scheduleScaleRefresh() {
    refreshTimers.forEach(clearTimeout);
    refreshTimers = [120, 450].map((ms) => setTimeout(() => {
      const w = Math.round(game.scale.width), h = Math.round(game.scale.height);
      const el = document.getElementById('game');
      if (el && (Math.round(el.clientWidth) !== w || Math.round(el.clientHeight) !== h)) game.scale.refresh();
    }, ms));
  }
  root.addEventListener('resize', scheduleScaleRefresh);
  root.addEventListener('orientationchange', scheduleScaleRefresh);

  // ---------- 4. Menu, diagnóstico e relatório ----------
  function requestFullscreen() {
    const el = document.documentElement;
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      return;
    }
    const request = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!request) return;   // iPhone: indisponível em páginas comuns
    try {
      const result = request.call(el);
      if (result && result.catch) result.catch(() => {});
    } catch (err) { /* recusado pelo navegador */ }
  }

  function buildReport() {
    const fmt = root.HF.DiagnosticsPanel.formatEntry;
    const now = performance.now();
    const lines = [];
    lines.push('# Relatório — Protótipo P1 (pesca)');
    lines.push('Gerado em: ' + new Date().toLocaleString('pt-BR'));
    lines.push('Navegador: ' + navigator.userAgent);
    lines.push('Tela: ' + Math.round(game.scale.width) + '×' + Math.round(game.scale.height) +
      ' (densidade ' + (root.devicePixelRatio || 1) + ') · Phaser ' + Phaser.VERSION + ' · semente ' + session.seed);
    lines.push('');
    lines.push('## Parâmetros');
    for (const [key] of root.HF.Menu.PARAMS) lines.push('- ' + key + ' = ' + config[key]);
    lines.push('');
    lines.push('## Jogadores');
    for (const id of ['P1', 'P2']) {
      lines.push(root.HF.DiagnosticsPanel.playerText(session.players[id].snapshot(now)));
      const r = session.players[id].stats.temposReacaoMs;
      if (r.length) {
        const sorted = r.slice().sort((a, b) => a - b);
        lines.push('tempos de reação (ms): ' + r.join(', ') + '  · mediana ' + sorted[sorted.length >> 1]);
      }
      lines.push('');
    }
    lines.push('## Capturas');
    const caps = session.captures();
    if (!caps.length) lines.push('(nenhuma)');
    for (const c of caps) {
      lines.push('- ' + (Math.round(c.time - session.t0) / 1000).toFixed(1) + ' s · ' + c.jogador + ' (' + c.nome + ') · ' +
        c.peixe + ' ' + c.pesoKg + ' kg · reação ' + c.reacaoMs + ' ms · briga ' + (c.brigaMs / 1000).toFixed(1) + ' s');
    }
    lines.push('');
    lines.push('Erros de toque (TouchRouter): ' + router.errors.length);
    lines.push('Pausas por interrupção/menu/retrato: ' + session.pauseCount + ' · vibração: ' + (toggles.vibracao ? 'ligada' : 'desligada'));
    lines.push('');
    lines.push('## Registro');
    for (const e of session.log) if (e.tipo !== 'zona-tensao') lines.push(fmt(e));
    return lines.join('\n');
  }

  const toggles = { diag: false, som: true, vibracao: false };   // D9: vibração desligada por padrão
  function setToggle(name, on) {
    toggles[name] = on;
    if (name === 'diag') app.diagnostics.setVisible(on);
    if (name === 'som') app.sfx.enabled = on;
    if (name === 'vibracao') app.sfx.vibration = on;
    menu.setToggle(name, on);
  }

  const menu = new root.HF.Menu({
    config: () => config,
    onOpen() {
      app.menuOpen = true;
      session.pause('menu aberto', performance.now());     // encerra os toques e congela a pescaria
    },
    onClose() {
      app.menuOpen = false;
      session.resume('menu aberto', performance.now());
    },
    onToggle(name) { setToggle(name, !toggles[name]); },
    onParam(key, value) { session.setConfigValue(key, value); },
    onDefaults() {
      const defaults = root.HF.createConfig();
      for (const [key] of root.HF.Menu.PARAMS) session.setConfigValue(key, defaults[key]);
    },
    onReset() { session.reset((Date.now() >>> 0)); },
    onFullscreen: requestFullscreen,
    onReport: buildReport
  });
  app.menu = menu;
  app.buildReport = buildReport;
  setToggle('diag', params.get('diag') === '1');
  setToggle('som', true);
  setToggle('vibracao', false);
})(window);
