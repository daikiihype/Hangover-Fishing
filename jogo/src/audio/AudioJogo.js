/*
 * Hangover Fishing — versão jogável
 * AudioJogo: os sons do P1 (Sfx, sem alterações) + volumes + música ambiente.
 *
 * - Efeitos: os mesmos sons sintetizados do P1, agora com volume (geral × efeitos) e liga/desliga.
 * - Música: trilha ambiente SINTETIZADA na hora (WebAudio, sem arquivos): baixo, acordes suaves e
 *   uma melodia pentatônica que varia a cada volta. Volume próprio (geral × música) e liga/desliga.
 *   É uma trilha provisória, como os sons do P1.
 */
(function (root) {
  'use strict';

  const Sfx = root.HF.Sfx;
  const BASE_SFX = 0.35;          // ganho mestre original do P1
  const BASE_MUSICA = 0.16;
  const BASE_VOZES = 0.3;

  // Progressão I–vi–IV–V em dó (frequências em Hz). Um compasso de 4 tempos por acorde.
  const ACORDES = [
    { baixo: 65.41, notas: [261.63, 329.63, 392.0] },   // C
    { baixo: 55.0, notas: [220.0, 261.63, 329.63] },    // Am
    { baixo: 87.31, notas: [174.61, 220.0, 261.63] },   // F
    { baixo: 98.0, notas: [196.0, 246.94, 293.66] }     // G
  ];
  const PENTA = [392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0];

  class AudioJogo extends Sfx {
    constructor(opcoes) {
      super({});
      this.opcoes = opcoes;
      this.musicaTocando = false;
      this.passo = 0;
      this.proximoTempo = 0;
      this.timer = null;
      this.melodiaSemente = 7;
      this.aplicar();
      opcoes.onChange(() => this.aplicar());
    }

    unlock() {
      super.unlock();
      if (!this.ctx) return;
      if (!this.ganhoMusica) {
        try {
          this.ganhoMusica = this.ctx.createGain();
          this.ganhoMusica.gain.value = 0;
          this.ganhoMusica.connect(this.ctx.destination);
        } catch (e) { /* sem música */ }
      }
      if (!this.ganhoVozes) {
        try {
          // vozes: balbucios e choro do Sirius (8-bit) e os "bipes de fala" dos diálogos
          this.ganhoVozes = this.ctx.createGain();
          this.ganhoVozes.gain.value = 0;
          this.ganhoVozes.connect(this.ctx.destination);
        } catch (e) { /* sem vozes */ }
      }
      this.aplicar();
    }

    /** Lê as opções e ajusta ganhos, liga/desliga e a música. */
    aplicar() {
      const o = this.opcoes;
      this.enabled = !!o.get('efeitos');
      this.vibration = !!o.get('vibracao');
      if (this.master) this.master.gain.value = BASE_SFX * o.get('volumeGeral') * o.get('volumeEfeitos');
      const volMus = o.get('musica') ? BASE_MUSICA * o.get('volumeGeral') * o.get('volumeMusica') : 0;
      if (this.ganhoMusica) this.ganhoMusica.gain.setTargetAtTime(volMus, this.ctx.currentTime, 0.15);
      if (volMus > 0 && this.ctx) this._iniciarMusica();
      else this._pararMusica();
      this.volumeVozes = o.get('vozes') ? BASE_VOZES * o.get('volumeGeral') * o.get('volumeVozes') : 0;
      if (this.ganhoVozes) this.ganhoVozes.gain.setTargetAtTime(this.volumeVozes, this.ctx.currentTime, 0.05);
    }

    // ---------------------------------------------------------------- vozes (narrativa)
    _vozesOk() { return !!(this.ctx && this.ctx.state === 'running' && this.ganhoVozes && this.volumeVozes > 0); }

    /** Pedido vindo do Narrador: { tipo: 'balbucio' | 'choro' | 'fala', ... }. */
    narrativa(som) {
      if (!this._vozesOk()) return false;
      if (som.tipo === 'balbucio') this.balbucio(som.texto);
      else if (som.tipo === 'choro') this.choro();
      else if (som.tipo === 'fala') this.bipesDeFala(som.pessoa, som.texto, som.revelarMs);
      return true;
    }

    _osc(tipo, inicio, dur, freq, vol, filtro) {
      const ctx = this.ctx;
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = tipo;
      osc.frequency.setValueAtTime(freq, inicio);
      g.gain.setValueAtTime(0.0001, inicio);
      g.gain.exponentialRampToValueAtTime(vol, inicio + Math.min(0.025, dur / 4));
      g.gain.setValueAtTime(vol, inicio + dur * 0.7);
      g.gain.exponentialRampToValueAtTime(0.0001, inicio + dur);
      let saida = g;
      osc.connect(g);
      if (filtro) {
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass'; f.frequency.value = filtro;
        g.connect(f); saida = f;
      }
      saida.connect(this.ganhoVozes);
      osc.start(inicio);
      osc.stop(inicio + dur + 0.03);
      return osc;
    }

    /**
     * Balbucio 8-bit a partir do texto ("AGU!", "GUH?", "DAAA!"...): cada sílaba vira um bipe
     * com o tom da vogal; vogal repetida = som mais longo com vibrato; "?" sobe no fim;
     * "!" acentua; sem vogais ("PFFFT!", "BRRR!") = ruído de "framboesa". Sem gravações.
     */
    balbucio(texto) {
      if (!this._vozesOk()) return;
      const ctx = this.ctx;
      const T = String(texto || '').toUpperCase();
      const silabas = [];
      const re = /([^AEIOUÁÉÍÓÚÂÊÔÃÕ\s.!?…-]*)([AEIOUÁÉÍÓÚÂÊÔÃÕ]+)/g;
      let m;
      while ((m = re.exec(T)) && silabas.length < 6) silabas.push({ cons: m[1], vog: m[2] });
      let t = ctx.currentTime + 0.02;
      if (!silabas.length) {                                   // framboesa / ronco: ruído filtrado
        const dur = 0.32;
        const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (0.6 + 0.4 * Math.sin(i / 90));
        const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
        src.buffer = buf; f.type = 'bandpass'; f.frequency.value = 520; f.Q.value = 1.4;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        src.connect(f); f.connect(g); g.connect(this.ganhoVozes); src.start(t);
        return;
      }
      const BASE = { A: 520, Á: 540, Â: 520, Ã: 500, E: 610, É: 640, Ê: 600, I: 720, Í: 740, O: 470, Ó: 480, Ô: 470, Õ: 460, U: 430, Ú: 440 };
      const pergunta = /\?\s*$/.test(T), exclama = /!\s*$/.test(T), reticencias = /(\.\.\.|…)\s*$/.test(T);
      silabas.forEach((s, i) => {
        const ultima = i === silabas.length - 1;
        const L = s.vog.length;
        const dur = Math.min(0.62, 0.11 + 0.06 * (L - 1));
        let f = (BASE[s.vog[0]] || 520) * (0.94 + Math.random() * 0.12);
        const vol = (exclama && i === 0 ? 0.32 : 0.24) * (reticencias ? 0.6 : 1);
        if (s.cons && /[GKCDT]/.test(s.cons[0])) this._osc('square', t, 0.018, 180, 0.12, 1500);   // "clique" da consoante
        const osc = this._osc('square', t, dur, f, vol, 2400);
        if (ultima && pergunta) osc.frequency.exponentialRampToValueAtTime(f * 1.4, t + dur);
        else if (ultima && (exclama || reticencias)) osc.frequency.exponentialRampToValueAtTime(f * (reticencias ? 0.75 : 0.88), t + dur);
        if (L >= 3) {                                          // vogal longa: vibrato de bebê
          const lfo = ctx.createOscillator(), lg = ctx.createGain();
          lfo.frequency.value = 9; lg.gain.value = 18;
          lfo.connect(lg); lg.connect(osc.frequency); lfo.start(t); lfo.stop(t + dur);
        }
        t += dur + 0.045;
      });
    }

    /** Choro 8-bit estilizado: três lamentos curtos com vibrato (nunca uma gravação). */
    choro() {
      if (!this._vozesOk()) return;
      const ctx = this.ctx;
      let t = ctx.currentTime + 0.02;
      for (let i = 0; i < 3; i++) {
        const dur = 0.5 + Math.random() * 0.12;
        const osc = this._osc('square', t, dur, 640, 0.2, 1700);
        osc.frequency.linearRampToValueAtTime(860, t + 0.12);
        osc.frequency.linearRampToValueAtTime(590, t + dur);
        const lfo = ctx.createOscillator(), lg = ctx.createGain();
        lfo.frequency.value = 7; lg.gain.value = 30;
        lfo.connect(lg); lg.connect(osc.frequency); lfo.start(t); lfo.stop(t + dur);
        t += dur + 0.2;
      }
    }

    /** "Bipes de fala" (estilo RPG antigo) enquanto o texto aparece: um tom por personagem. */
    bipesDeFala(pessoa, texto, revelarMs) {
      if (!this._vozesOk()) return;
      const TOM = { alemao: ['square', 205], ale: ['triangle', 150], maria: ['triangle', 330] }[pessoa];
      if (!TOM) return;
      const n = Math.min(10, Math.max(2, Math.ceil(String(texto).length / 4)));
      const passo = Math.max(0.045, (revelarMs || 600) / 1000 / n);
      let t = this.ctx.currentTime + 0.01;
      for (let i = 0; i < n; i++) {
        this._osc(TOM[0], t, 0.035, TOM[1] * (0.93 + Math.random() * 0.14), 0.12, 1800);
        t += passo;
      }
    }

    /** Clique curto da interface (respeita volume e liga/desliga dos efeitos). */
    clique(agudo) {
      this.unlock();
      this.tone(null, { type: 'square', from: agudo ? 990 : 660, dur: 0.05, vol: 0.25 });
    }

    // ---------------------------------------------------------------- música
    _iniciarMusica() {
      if (this.musicaTocando || !this.ctx || !this.ganhoMusica) return;
      this.musicaTocando = true;
      this.proximoTempo = this.ctx.currentTime + 0.1;
      this.timer = root.setInterval(() => this._agendar(), 40);
    }

    _pararMusica() {
      if (!this.musicaTocando) return;
      this.musicaTocando = false;
      root.clearInterval(this.timer);
      this.timer = null;
    }

    _nota(tipo, freq, inicio, dur, vol, ataque) {
      const ctx = this.ctx;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = tipo;
      osc.frequency.setValueAtTime(freq, inicio);
      g.gain.setValueAtTime(0.0001, inicio);
      g.gain.exponentialRampToValueAtTime(vol, inicio + (ataque || 0.02));
      g.gain.exponentialRampToValueAtTime(0.0001, inicio + dur);
      osc.connect(g);
      g.connect(this.ganhoMusica);
      osc.start(inicio);
      osc.stop(inicio + dur + 0.05);
    }

    _rand() {           // gerador simples e determinístico para a melodia
      this.melodiaSemente = (this.melodiaSemente * 1103515245 + 12345) & 0x7fffffff;
      return this.melodiaSemente / 0x7fffffff;
    }

    /** Agenda as notas dos próximos ~200 ms (colcheias a 84 bpm). */
    _agendar() {
      if (!this.ctx || this.ctx.state !== 'running') return;
      const colcheia = 60 / 84 / 2;
      while (this.proximoTempo < this.ctx.currentTime + 0.2) {
        const t = this.proximoTempo;
        const compasso = Math.floor(this.passo / 8) % ACORDES.length;
        const pos = this.passo % 8;
        const ac = ACORDES[compasso];
        if (pos === 0 || pos === 4) this._nota('triangle', ac.baixo * (pos === 4 ? 1.5 : 1), t, colcheia * 3.6, 0.5, 0.01);
        if (pos % 2 === 0) this._nota('sine', ac.notas[(pos / 2) % 3] , t, colcheia * 1.8, 0.18, 0.03);
        // melodia: frases que mudam a cada volta, com pausas (respiro)
        if (this._rand() < (pos % 2 === 0 ? 0.55 : 0.25)) {
          const n = PENTA[Math.floor(this._rand() * PENTA.length)];
          this._nota('square', n, t, colcheia * (this._rand() < 0.3 ? 1.9 : 0.9), 0.06, 0.01);
        }
        this.proximoTempo += colcheia;
        this.passo++;
      }
    }
  }

  root.HF.AudioJogo = AudioJogo;
})(window);
