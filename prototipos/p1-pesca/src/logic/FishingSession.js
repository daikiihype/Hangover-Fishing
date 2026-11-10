/*
 * Hangover Fishing — Protótipo P1 (pesca)
 * FishingSession: liga a entrada (TouchRouter, reaproveitado do P0) aos dois
 * jogadores (FishingPlayer) e guarda o registro da sessão.
 *
 *   dedos → TouchRouter (posse do toque: P1 / P2) → FishingSession → FishingPlayer P1
 *                                                                  → FishingPlayer P2
 *
 * Cada jogador recebe SOMENTE os eventos da própria zona e tem o próprio
 * gerador aleatório. Não há nenhum estado compartilhado entre os dois além
 * do registro (que é só leitura para eles).
 *
 * Também não depende do Phaser: os testes usam esta classe diretamente.
 */
(function (root) {
  'use strict';

  const req = (name) => (typeof require === 'function' ? require(name) : null);
  const HF = root.HF || {};
  const TouchRouter = HF.TouchRouter || req('../input/TouchRouter.js');
  const FishingPlayer = HF.FishingPlayer || req('./FishingPlayer.js');
  const Random = HF.Random || req('./Random.js');
  const configModule = HF.createConfig ? HF : req('./config.js');

  class FishingSession {
    constructor(opts) {
      opts = opts || {};
      this.now = opts.now || (() => performance.now());
      this.config = opts.config || configModule.createConfig();
      this.seed = opts.seed != null ? opts.seed : (Date.now() >>> 0);
      this.maxLog = opts.maxLog || 2000;
      this.listeners = [];
      this.router = new TouchRouter({ now: this.now, holdThresholdMs: this.config.holdThresholdMs });
      this.router.onEvent((e) => this._onInput(e));
      this.pauseReasons = new Set();   // motivos ativos: 'menu', 'retrato', 'foco', 'oculta', ...
      this.awaitingTap = false;        // interrupção: só um toque na tela retoma
      this.pausedSince = null;
      this.pauseCount = 0;
      this.pendingNotices = new Set(); // jogadores que verão "ARREMESSO CANCELADO" ao retomar
      this._createPlayers(this.now());
    }

    // ---------- pausa e interrupções (D8) ----------
    //
    // pause(motivo)      pausa por um motivo que se desfaz sozinho (menu aberto, tela em retrato).
    // interrupt(motivo)  pausa por interrupção do sistema (perda de foco, página oculta, troca de app).
    //                    Só termina com um toque na tela: continueAfterInterruption().
    // Em todos os casos: os toques ativos são encerrados ANTES de congelar (ninguém fica
    // "segurando"), e o estado, a tensão e os prazos dos dois jogadores ficam parados.

    isPaused() {
      return this.pauseReasons.size > 0 || this.awaitingTap;
    }

    pause(motivo, t) {
      t = t != null ? t : this.now();
      this._cancelTouchesNotingCharges(motivo, t);   // menu e retrato também avisam quem carregava
      const was = this.isPaused();
      this.pauseReasons.add(motivo);
      if (!was) this._freeze(motivo, t);
    }

    resume(motivo, t) {
      t = t != null ? t : this.now();
      this.pauseReasons.delete(motivo);
      this._tryUnfreeze(t, motivo);
    }

    interrupt(motivo, t) {
      t = t != null ? t : this.now();
      this._cancelTouchesNotingCharges(motivo, t);
      const was = this.isPaused();
      this.awaitingTap = true;
      if (!was) this._freeze(motivo, t);
      else this._record({ tipo: 'interrupcao-extra', time: t, motivo });
    }

    /** O toque que retoma o jogo é consumido: não vira ação de nenhum jogador. */
    continueAfterInterruption(t) {
      t = t != null ? t : this.now();
      if (!this.awaitingTap) return false;
      this.awaitingTap = false;
      this._tryUnfreeze(t, 'toque para continuar');
      return true;
    }

    /**
     * Ajuste de UX (aprovado): encerra todos os toques; quem estava CARREGANDO um arremesso
     * perde só esse arremesso (sem penalidade, sem arremesso automático) e recebe o aviso
     * "ARREMESSO CANCELADO" quando o jogo voltar de fato. Vale para interrupções do sistema,
     * menu aberto e tela em retrato.
     */
    _cancelTouchesNotingCharges(motivo, t) {
      const charging = ['P1', 'P2'].filter((id) => this.players[id].state === FishingPlayer.STATES.CHARGING);
      this.router.cancelAll(motivo, t);
      for (const id of charging) {
        if (this.players[id].state === FishingPlayer.STATES.IDLE) this.pendingNotices.add(id);
      }
    }

    _freeze(motivo, t) {
      this.pausedSince = t;
      this.pauseCount++;
      this.players.P1.pause(t);
      this.players.P2.pause(t);
      this._record({ tipo: 'interrupcao-inicio', time: t, motivo, aguardaToque: this.awaitingTap });
    }

    _tryUnfreeze(t, motivo) {
      if (this.isPaused() || this.pausedSince == null) return;
      const ms = this.players.P1.resume(t);
      this.players.P2.resume(t);
      this.pausedSince = null;
      this._record({ tipo: 'interrupcao-fim', time: t, motivo, ms: Math.round(ms) });
      // Só quando o jogo volta de fato: aviso para quem perdeu um arremesso na interrupção.
      for (const id of ['P1', 'P2']) {
        if (this.pendingNotices.has(id)) this._record({ tipo: 'aviso-retomada', jogador: id, codigo: 'arremesso-cancelado', time: t });
      }
      this.pendingNotices.clear();
    }

    _createPlayers(t) {
      this.t0 = t;
      this.seq = 0;
      this.log = [];
      const make = (id, label, seedOffset) => new FishingPlayer({
        id, label, config: this.config, time: t,
        rng: new Random(mixSeed(this.seed, seedOffset)),
        emit: (entry) => this._record(entry)
      });
      this.players = {
        P1: make('P1', this.router.zones.P1.label, 1),
        P2: make('P2', this.router.zones.P2.label, 2)
      };
    }

    // ---------- entrada ----------

    _onInput(e) {
      const player = e.zona ? this.players[e.zona] : null;
      if (!player) return;
      if (e.tipo === 'inicio') {
        player.press(e.time);
      } else if (e.tipo === 'fim' || e.tipo === 'cancelado') {
        player.release(e.time, {
          canceled: e.tipo === 'cancelado',
          stillPressed: this.router.zones[e.zona].activeCount > 0
        });
      }
    }

    /** A cada quadro. */
    update(t) {
      t = t != null ? t : this.now();
      this.router.update(t);
      this.players.P1.update(t);
      this.players.P2.update(t);
    }

    // ---------- configuração ----------

    setConfigValue(key, value) {
      this.config[key] = value;
      if (key === 'holdThresholdMs') this.router.setHoldThreshold(value);
      this._record({ tipo: 'config', time: this.now(), chave: key, valor: value });
    }

    /** Recomeça a sessão (zera registros e estatísticas). Nova semente opcional. */
    reset(seed) {
      if (seed != null) this.seed = seed;
      this.router.cancelAll('sessão reiniciada');
      this.router.resetCounters();
      const t = this.now();
      this._createPlayers(t);
      this.pauseCount = 0;
      this.awaitingTap = false;
      this.pendingNotices.clear();
      // motivos ainda ativos (ex.: menu aberto ao reiniciar) continuam valendo
      this.pausedSince = null;
      if (this.pauseReasons.size) this._freeze(Array.from(this.pauseReasons).join(','), t);
    }

    // ---------- registro ----------

    onEvent(fn) {
      this.listeners.push(fn);
    }

    captures() {
      return this.players.P1.captures.concat(this.players.P2.captures).sort((a, b) => a.time - b.time);
    }

    _record(entry) {
      entry.seq = ++this.seq;
      entry.t = Math.round(entry.time - this.t0);
      this.log.push(entry);
      if (this.log.length > this.maxLog) this.log.shift();
      for (const fn of this.listeners) fn(entry);
    }
  }

  /** Semente independente por jogador a partir da semente da sessão. */
  function mixSeed(seed, offset) {
    let h = (seed ^ Math.imul(offset, 0x9E3779B1)) >>> 0;
    h = Math.imul(h ^ (h >>> 16), 0x85EBCA6B) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 0xC2B2AE35) >>> 0;
    return (h ^ (h >>> 16)) >>> 0;
  }

  root.HF = root.HF || {};
  root.HF.FishingSession = FishingSession;
  if (typeof module !== 'undefined' && module.exports) module.exports = FishingSession;
})(typeof window !== 'undefined' ? window : globalThis);
