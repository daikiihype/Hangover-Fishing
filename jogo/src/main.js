/*
 * Hangover Fishing — versão jogável (Operação Madrugada)
 * main.js: inicialização e fluxo do aplicativo.
 *
 *   carga → MENU (vertical) → preparação → [girar] → PARTIDA (horizontal) → pausa/resumo → MENU
 *
 * - Canvas na resolução real do aparelho (densidade de tela): a pixel art fica nítida.
 * - Orientação: ao começar a partida, tenta tela cheia + travar na horizontal (Android).
 *   Se o navegador não deixar (iPhone, computador), mostra "gire o celular" e espera,
 *   sempre com um botão para voltar ao menu (nunca prende o jogador).
 * - Interrupções do sistema (perda de foco, página oculta): pausam a partida como no P1 (D8).
 *
 * Endereço com parâmetros opcionais:  ?seed=1234 (sorteios repetíveis) · ?dpr=1 (densidade)
 */
(function (root) {
  'use strict';

  const HF = root.HF;
  const params = new URLSearchParams(root.location.search);
  const dprParam = Number(params.get('dpr'));
  const dpr = dprParam > 0 ? dprParam : Math.min(3, Math.max(1, root.devicePixelRatio || 1));
  const toqueGrosso = root.matchMedia && root.matchMedia('(pointer: coarse)').matches;

  const arm = new HF.Armazenamento();
  const opcoes = new HF.Opcoes(arm);
  const app = HF.app = {
    dpr, arm, opcoes,
    catalogo: new HF.Catalogo(arm),
    audio: new HF.AudioJogo(opcoes),
    partida: null,
    partidaPendente: null,
    urls: {},
    animData: null,
    pronto: false
  };
  const ui = new HF.Interface(app);
  app.ui = ui;

  // ---------- gestos do navegador (como no P0/P1), exceto nas áreas que rolam ----------
  const rolavel = (el) => !!(el && el.closest && el.closest('.rolavel, .ficha .painel, input[type="range"]'));
  document.addEventListener('touchmove', (ev) => { if (!rolavel(ev.target) && ev.cancelable) ev.preventDefault(); }, { passive: false });
  ['gesturestart', 'gesturechange', 'gestureend'].forEach((t) => document.addEventListener(t, (ev) => ev.preventDefault()));
  document.addEventListener('contextmenu', (ev) => ev.preventDefault());
  document.addEventListener('dblclick', (ev) => ev.preventDefault());
  document.addEventListener('touchstart', () => app.audio.unlock(), { capture: true, passive: true });
  document.addEventListener('mousedown', () => app.audio.unlock(), { capture: true });

  // ---------- Phaser ----------
  const w = () => Math.round(root.innerWidth * dpr), h = () => Math.round(root.innerHeight * dpr);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'jogo',
    backgroundColor: '#0b2a3f',
    banner: false,
    scale: { mode: Phaser.Scale.NONE, width: w(), height: h(), zoom: 1 / dpr },
    input: { activePointers: 4, touch: { capture: true }, keyboard: false },
    render: { antialias: true, roundPixels: false },
    scene: [HF.CenaCarga, HF.CenaMar, HF.CenaPartida]
  });
  app.game = game;

  function redimensionar() {
    const W = w(), H = h();
    if (game.scale.width !== W || game.scale.height !== H) game.scale.resize(W, H);
    game.scale.setZoom(1 / dpr);
    verificarOrientacao();
  }
  let timers = [];
  function agendarRedimensionar() {
    redimensionar();
    timers.forEach(clearTimeout);
    timers = [120, 450].map((ms) => setTimeout(redimensionar, ms));   // emulação/rotação: reaplica depois
  }
  root.addEventListener('resize', agendarRedimensionar);
  root.addEventListener('orientationchange', agendarRedimensionar);

  // ---------- carga ----------
  app.carregado = function ({ animData, urls }) {
    app.animData = animData;
    app.urls = urls;
    app.pronto = true;
    ui.prepararMenu();
    game.scene.start('Mar');
    ui.mostrar('menu');
  };
  app.erroDeCarga = function (msg) {
    const e = document.getElementById('erro-carga');
    e.hidden = false;
    e.textContent = msg + ' — Abra o jogo por um servidor local (veja o README).';
  };
  app.aoTrocarTela = function () {
    const mar = game.scene.getScene('Mar');
    if (mar && mar.sys.isActive()) mar.layout();
  };

  // ---------- orientação ----------
  const retrato = () => root.innerHeight > root.innerWidth;
  async function tentarHorizontal() {
    if (!toqueGrosso) return;                       // computador: não força tela cheia
    try {
      const el = document.documentElement;
      if (!document.fullscreenElement && el.requestFullscreen) { await el.requestFullscreen({ navigationUI: 'hide' }); app.entrouEmTelaCheia = true; }
    } catch (e) { /* recusado: segue com a tela "gire" */ }
    try { if (root.screen.orientation && root.screen.orientation.lock) await root.screen.orientation.lock('landscape'); } catch (e) { /* sem trava */ }
    verificarOrientacao();
  }
  function soltarOrientacao() {
    try { if (root.screen.orientation && root.screen.orientation.unlock) root.screen.orientation.unlock(); } catch (e) { /* ignorar */ }
    try { if (app.entrouEmTelaCheia && document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {}); } catch (e) { /* ignorar */ }
    app.entrouEmTelaCheia = false;
  }

  function verificarOrientacao() {
    if (app.partidaPendente) {
      if (retrato()) { if (ui.atual !== 'girar') ui.mostrarGirar(false); }
      else comecarAgora();
      return;
    }
    if (app.partida) {
      const r = retrato();
      app.partida.setRetrato(r);
      if (r && ui.atual !== 'girar' && ui.atual !== 'pausa') ui.mostrarGirar(true);
      if (!r && ui.atual === 'girar') ui.esconderTudo();
      document.getElementById('botao-pausa').hidden = r || ui.atual === 'pausa';
    }
  }

  // ---------- partida ----------
  app.iniciarPartida = function (cfg) {
    app.partidaPendente = cfg;
    if (params.get('seed') != null) cfg.seed = Number(params.get('seed')) >>> 0;
    tentarHorizontal();
    verificarOrientacao();
  };
  function comecarAgora() {
    const cfg = app.partidaPendente;
    app.partidaPendente = null;
    ui.esconderTudo();
    game.scene.stop('Mar');
    game.scene.start('Partida', cfg);
    document.getElementById('botao-pausa').hidden = false;
  }
  app.partidaCriada = function (cena) { app.partida = cena; };
  app.cancelarOuSair = function () {
    if (app.partidaPendente) { app.partidaPendente = null; soltarOrientacao(); ui.mostrar('menu'); return; }
    app.sairDaPartida();
  };
  app.pausarPartida = function () {
    if (!app.partida) return;
    app.partida.pausar();
    document.getElementById('botao-pausa').hidden = true;
    ui.mostrarPausa(app.partida);
  };
  app.continuarPartida = function () {
    if (!app.partida) return;
    ui.esconderTudo();
    app.partida.continuar();
    verificarOrientacao();
    document.getElementById('botao-pausa').hidden = retrato();
  };
  app.recomecarPartida = function () {
    if (!app.partida) return;
    app.partida.recomecar();
    app.continuarPartida();
  };
  app.sairDaPartida = function () {
    if (!app.partida) { ui.mostrar('menu'); return; }
    const resumo = app.partida.resumo();
    game.scene.stop('Partida');
    app.partida = null;
    document.getElementById('botao-pausa').hidden = true;
    soltarOrientacao();
    game.scene.start('Mar');
    ui.mostrarResumo(resumo);
  };

  // ---------- interrupções (D8): só pausam durante a partida ----------
  const interromper = (motivo) => { if (app.partida) app.partida.interromper(motivo); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) interromper('página oculta'); });
  root.addEventListener('blur', () => interromper('perda de foco'));
  root.addEventListener('pagehide', () => interromper('página escondida (pagehide)'));
  document.addEventListener('freeze', () => interromper('página congelada pelo navegador (freeze)'));
})(window);
