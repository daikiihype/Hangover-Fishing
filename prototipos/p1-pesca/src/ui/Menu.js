/*
 * Hangover Fishing — Protótipo P1 (pesca)
 * Menu: menu HTML de teste (fora do canvas: tocar nele não conta para nenhum jogador).
 *
 * - liga/desliga o painel de diagnóstico, som e vibração;
 * - ajusta os principais parâmetros de balanceamento sem editar código;
 * - reinicia a sessão, tela cheia e relatório copiável.
 * Abrir o menu PAUSA a pescaria dos dois jogadores.
 */
(function (root) {
  'use strict';

  /** Parâmetros ajustáveis no celular: [chave, rótulo, passo, mín, máx, casas decimais]. */
  const PARAMS = [
    ['reactionWindowMs', 'Janela de fisgada (ms)', 100, 200, 3000, 0],
    ['waitMinMs', 'Espera mínima (ms)', 500, 0, 20000, 0],
    ['waitMaxMs', 'Espera máxima (ms)', 500, 0, 30000, 0],
    ['criticalBreakMs', 'Tempo na crítica p/ arrebentar (ms)', 250, 250, 5000, 0],
    ['slackEscapeMs', 'Tempo frouxa p/ escapar (ms)', 250, 250, 6000, 0],
    ['reelSpeed', 'Velocidade de recolher (m/s)', 0.5, 0.5, 10, 1],
    ['reelTensionRate', 'Subida da tensão ao segurar (/s)', 0.02, 0.02, 1, 2],
    ['relaxRate', 'Queda da tensão ao soltar (/s)', 0.05, 0.05, 1.5, 2],
    ['pullTensionRate', 'Força dos puxões na tensão (/s)', 0.05, 0, 1.5, 2],
    ['castCycleMs', 'Ciclo do medidor de força (ms)', 200, 600, 4000, 0],
    ['holdThresholdMs', 'Limiar toque × segurar (ms)', 25, 100, 500, 0]
  ];

  class Menu {
    constructor(opts) {
      this.opts = opts;
      this.button = document.getElementById('menu-button');
      this.diagButton = document.getElementById('diag-button');
      this.el = document.getElementById('menu');
      this.paramsEl = document.getElementById('params');
      this.report = document.getElementById('report');
      this.reportText = document.getElementById('report-text');
      this.values = {};

      this.button.addEventListener('click', () => this.open());
      this.diagButton.addEventListener('click', () => opts.onToggle('diag'));
      this.el.addEventListener('click', (event) => {
        const target = event.target.closest('button');
        if (!target) {
          if (event.target === this.el) this.close();     // tocar fora do painel fecha
          return;
        }
        this.handle(target);
      });
      this.buildParams();
    }

    buildParams() {
      const cfg = this.opts.config();
      this.paramsEl.innerHTML = '';
      for (const [key, label, , , , dec] of PARAMS) {
        const row = document.createElement('div');
        row.className = 'param';
        row.innerHTML = '<span>' + label + '</span>' +
          '<button type="button" data-action="param" data-key="' + key + '" data-dir="-1">−</button>' +
          '<strong data-value="' + key + '">' + cfg[key].toFixed(dec) + '</strong>' +
          '<button type="button" data-action="param" data-key="' + key + '" data-dir="1">+</button>';
        this.paramsEl.appendChild(row);
      }
    }

    refreshParams() {
      const cfg = this.opts.config();
      for (const [key, , , , , dec] of PARAMS) {
        const el = this.paramsEl.querySelector('[data-value="' + key + '"]');
        if (el) el.textContent = Number(cfg[key]).toFixed(dec);
      }
    }

    setToggle(name, on) {
      const el = this.el.querySelector('[data-action="toggle"][data-name="' + name + '"]');
      if (el) el.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (name === 'diag') this.diagButton.setAttribute('aria-pressed', on ? 'true' : 'false');
    }

    handle(btn) {
      const action = btn.dataset.action;
      if (action === 'close') return this.close();
      if (action === 'toggle') return this.opts.onToggle(btn.dataset.name);
      if (action === 'param') {
        const def = PARAMS.find((p) => p[0] === btn.dataset.key);
        const [key, , step, min, max] = def;
        const cfg = this.opts.config();
        const raw = cfg[key] + step * Number(btn.dataset.dir);
        const value = Math.min(max, Math.max(min, Math.round(raw * 1000) / 1000));
        this.opts.onParam(key, value);
        this.refreshParams();
        return;
      }
      if (action === 'defaults') { this.opts.onDefaults(); this.refreshParams(); return; }
      if (action === 'reset') { this.opts.onReset(); return; }
      if (action === 'fullscreen') { this.opts.onFullscreen(); return; }
      if (action === 'report') {
        this.reportText.value = this.opts.onReport();
        this.report.hidden = false;
        return;
      }
    }

    open() {
      this.el.hidden = false;
      this.report.hidden = true;
      this.refreshParams();
      this.opts.onOpen();
    }

    close() {
      this.el.hidden = true;
      this.opts.onClose();
    }
  }

  Menu.PARAMS = PARAMS;
  root.HF = root.HF || {};
  root.HF.Menu = Menu;
})(window);
