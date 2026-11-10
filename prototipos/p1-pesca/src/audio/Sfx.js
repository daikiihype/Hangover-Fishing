/*
 * Hangover Fishing — Protótipo P1 (pesca)
 * Sfx: sons TEMPORÁRIOS sintetizados na hora (WebAudio). Nenhum arquivo de áudio.
 *
 * Servem só para validar o tempo de reação e a leitura do feedback
 * (GDD 16.3: sons temporários são permitidos). Não são o áudio final.
 *
 * Cada jogador soa do seu lado (P1 à esquerda, P2 à direita) quando há fone
 * ou alto-falante estéreo.
 *
 * Decisões da direção criativa (GDD 16.6), Patch 01:
 *   D3 — as beliscadas NÃO têm som (são só visuais); a mordida tem bipe duplo.
 *   D9 — a vibração começa DESLIGADA (ela é do aparelho inteiro e chega às mãos
 *        dos dois jogadores). Pode ser ligada no menu. No iPhone, o navegador
 *        não permite vibração.
 */
(function (root) {
  'use strict';

  const PAN = { P1: -0.6, P2: 0.6 };

  class Sfx {
    constructor(opts) {
      opts = opts || {};
      this.enabled = true;
      this.vibration = false;            // D9: desligada por padrão
      this.navigator = opts.navigator || root.navigator;
      this.ctx = null;
      this.lastWarn = { P1: 0, P2: 0 };
    }

    /** Navegadores só liberam o áudio depois de um toque do usuário. */
    unlock() {
      try {
        if (!this.ctx) {
          const AC = root.AudioContext || root.webkitAudioContext;
          if (!AC) return;
          this.ctx = new AC();
          this.master = this.ctx.createGain();
          this.master.gain.value = 0.35;
          this.master.connect(this.ctx.destination);
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
      } catch (err) { /* sem áudio: o jogo continua */ }
    }

    vibrate(pattern) {
      const nav = this.navigator;
      if (!this.vibration || !nav || !nav.vibrate) return;
      try { nav.vibrate(pattern); } catch (err) { /* ignorar */ }
    }

    /** Um bipe: freq inicial → final, duração em segundos. */
    tone(player, opts) {
      if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
      const ctx = this.ctx;
      const t = ctx.currentTime + (opts.delay || 0);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = opts.type || 'square';
      osc.frequency.setValueAtTime(opts.from, t);
      if (opts.to) osc.frequency.exponentialRampToValueAtTime(opts.to, t + opts.dur);
      gain.gain.setValueAtTime(opts.vol || 0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + opts.dur);
      osc.connect(gain);
      let node = gain;
      if (ctx.createStereoPanner && PAN[player] != null) {
        const pan = ctx.createStereoPanner();
        pan.pan.value = PAN[player];
        node.connect(pan);
        node = pan;
      }
      node.connect(this.master);
      osc.start(t);
      osc.stop(t + opts.dur + 0.02);
    }

    noise(player, dur, vol) {
      if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
      const ctx = this.ctx;
      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.value = vol || 0.4;
      src.connect(gain);
      let node = gain;
      if (ctx.createStereoPanner) {
        const pan = ctx.createStereoPanner();
        pan.pan.value = PAN[player] || 0;
        node.connect(pan);
        node = pan;
      }
      node.connect(this.master);
      src.start();
    }

    /** Reage aos eventos da pescaria (FishingSession). */
    onEvent(e) {
      const p = e.jogador;
      switch (e.tipo) {
        case 'arremesso':
          this.tone(p, { type: 'triangle', from: 300, to: 900, dur: 0.18, vol: 0.35 });
          break;
        case 'boia-na-agua':
          this.tone(p, { type: 'sine', from: 500, to: 160, dur: 0.12, vol: 0.5 });
          break;
        // 'beliscada': sem som de propósito (D3). O sinal é só visual.
        case 'mordida':
          // sinal inconfundível: dois bipes agudos + vibração
          this.tone(p, { type: 'square', from: 1320, dur: 0.07, vol: 0.45 });
          this.tone(p, { type: 'square', from: 1760, dur: 0.09, vol: 0.45, delay: 0.09 });
          this.vibrate(120);
          break;
        case 'fisgada':
          this.tone(p, { type: 'square', from: 400, to: 1200, dur: 0.12, vol: 0.4 });
          this.vibrate(40);
          break;
        case 'arrancada':
          this.tone(p, { type: 'sawtooth', from: 140, to: 90, dur: 0.15, vol: 0.3 });
          break;
        case 'captura':
          [660, 880, 1100, 1320].forEach((f, i) => this.tone(p, { type: 'square', from: f, dur: 0.1, vol: 0.35, delay: i * 0.09 }));
          this.vibrate([30, 40, 30]);
          break;
        case 'fuga':
        case 'mordida-perdida':
          this.tone(p, { type: 'triangle', from: 600, to: 150, dur: 0.4, vol: 0.4 });
          break;
        case 'linha-rompida':
          this.noise(p, 0.18, 0.5);
          this.tone(p, { type: 'square', from: 900, to: 80, dur: 0.3, vol: 0.3 });
          this.vibrate([80, 40, 80]);
          break;
        case 'recolhimento-concluido':
          this.tone(p, { type: 'sine', from: 900, dur: 0.06, vol: 0.25 });
          break;
        default:
          break;
      }
    }

    /** Avisos contínuos de perigo (chamado a cada quadro): sons diferentes para os dois riscos. */
    warn(player, zone, now) {
      if (zone === 'critica' && now - this.lastWarn[player] > 160) {
        this.lastWarn[player] = now;
        this.tone(player, { type: 'square', from: 2000, dur: 0.04, vol: 0.2 });   // linha "cantando"
      } else if (zone === 'frouxa' && now - this.lastWarn[player] > 450) {
        this.lastWarn[player] = now;
        this.tone(player, { type: 'sine', from: 220, to: 160, dur: 0.12, vol: 0.35 }); // linha "mole"
      }
    }
  }

  root.HF = root.HF || {};
  root.HF.Sfx = Sfx;
  if (typeof module !== 'undefined' && module.exports) module.exports = Sfx;
})(typeof window !== 'undefined' ? window : globalThis);
