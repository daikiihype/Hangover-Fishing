/*
 * Hangover Fishing — Protótipo 0 (multitouch)
 * PlayerZone: estado de UMA zona de jogador.
 *
 * Não depende do Phaser. Recebe "dedos" (toques) já atribuídos a esta zona
 * e responde: quantos dedos estão ativos, se a zona está livre/pressionada/
 * segurando, e como cada toque foi classificado ao terminar.
 *
 * Classificação por tempo (limiar = holdThresholdMs):
 *   duração <  limiar  -> "toque"
 *   duração >= limiar  -> "segurar"
 *   encerrado por cancelamento/interrupção -> "cancelado"
 */
(function (root) {
  'use strict';

  class PlayerZone {
    constructor(opts) {
      this.id = opts.id;                 // 'P1' ou 'P2'
      this.label = opts.label;           // nome exibido
      this.holdThresholdMs = opts.holdThresholdMs != null ? opts.holdThresholdMs : 200;
      this.fingers = new Map();          // chave do ponteiro -> dados do dedo
      this.resetCounters();
    }

    resetCounters() {
      this.counters = {
        inicios: 0,
        toques: 0,
        segurares: 0,
        cancelamentos: 0,
        maxDedos: this.fingers ? this.fingers.size : 0
      };
    }

    get activeCount() {
      return this.fingers.size;
    }

    hasFinger(key) {
      return this.fingers.has(key);
    }

    getFinger(key) {
      return this.fingers.get(key) || null;
    }

    addFinger(key, identifier, time) {
      const finger = {
        key,                 // id do ponteiro no Phaser
        identifier,          // id do toque fornecido pelo navegador
        startTime: time,
        startSeq: null,      // preenchido pelo TouchRouter
        held: false,         // já passou do limiar de "segurar"?
        overOther: false,    // está agora sobre a zona do outro jogador?
        crossed: false       // em algum momento passou para a outra zona?
      };
      this.fingers.set(key, finger);
      this.counters.inicios++;
      if (this.fingers.size > this.counters.maxDedos) {
        this.counters.maxDedos = this.fingers.size;
      }
      return finger;
    }

    /** Promove dedos que passaram do limiar. Retorna os promovidos agora. */
    update(time) {
      const promoted = [];
      for (const finger of this.fingers.values()) {
        if (!finger.held && time - finger.startTime >= this.holdThresholdMs) {
          finger.held = true;
          promoted.push(finger);
        }
      }
      return promoted;
    }

    removeFinger(key, time, options) {
      const canceled = !!(options && options.canceled);
      const finger = this.fingers.get(key);
      if (!finger) return null;
      this.fingers.delete(key);

      const duration = Math.max(0, time - finger.startTime);
      let kind;
      if (canceled) {
        kind = 'cancelado';
        this.counters.cancelamentos++;
      } else if (duration >= this.holdThresholdMs) {
        kind = 'segurar';
        this.counters.segurares++;
      } else {
        kind = 'toque';
        this.counters.toques++;
      }
      return { finger, duration, kind };
    }

    /** 'livre' | 'pressionado' | 'segurando' */
    getState(time) {
      if (this.fingers.size === 0) return 'livre';
      for (const finger of this.fingers.values()) {
        if (finger.held || time - finger.startTime >= this.holdThresholdMs) return 'segurando';
      }
      return 'pressionado';
    }

    /** Maior duração entre os dedos ativos (ms). */
    longestActiveDuration(time) {
      let longest = 0;
      for (const finger of this.fingers.values()) {
        longest = Math.max(longest, time - finger.startTime);
      }
      return longest;
    }
  }

  root.HF = root.HF || {};
  root.HF.PlayerZone = PlayerZone;
  if (typeof module !== 'undefined' && module.exports) module.exports = PlayerZone;
})(typeof window !== 'undefined' ? window : globalThis);
