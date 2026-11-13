/*
 * Hangover Fishing — versão jogável
 * SessaoJogo: a FishingSession do P1 (sem alterações) com pescadores regionais.
 *
 * - Mesmo TouchRouter, mesma pausa e mesmas interrupções do P1 (D8).
 * - Os pescadores são PescadorRegional, com as MESMAS sementes do P1 (mixSeed idêntico).
 * - Modo 1 jogador: só o P1 recebe toques (a cena manda todos os toques para a metade
 *   do P1). O P2 continua existindo, parado em IDLE, e não aparece na tela.
 */
(function (root) {
  'use strict';

  const req = (p) => (typeof require === 'function' ? require(p) : null);
  const HF = root.HF || {};
  const FishingSession = HF.FishingSession || req('../../../prototipos/p1-pesca/src/logic/FishingSession.js');
  const Random = HF.Random || req('../../../prototipos/p1-pesca/src/logic/Random.js');
  const PescadorRegional = HF.PescadorRegional || req('./PescadorRegional.js');
  const PontosDeInteresse = HF.PontosDeInteresse || req('./PontosDeInteresse.js');
  const MAX_DT_PONTOS = 250;              // depois de uma pausa, o relógio do lago não dá saltos

  /** Cópia exata do mixSeed do P1 (FishingSession.js), para as sementes serem as mesmas. */
  function mixSeed(seed, offset) {
    let h = (seed ^ Math.imul(offset, 0x9E3779B1)) >>> 0;
    h = Math.imul(h ^ (h >>> 16), 0x85EBCA6B) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 0xC2B2AE35) >>> 0;
    return (h ^ (h >>> 16)) >>> 0;
  }

  class SessaoJogo extends FishingSession {
    /**
     * opts.jogo = { modo: 1 | 2, personagens: { P1: 'alemao' | 'ale', P2: 'ale' },
     *               iscas: { P1, P2 }, regioes: true | false }
     */
    constructor(opts) {
      super(opts);
      this.jogo = Object.assign({ modo: 2, personagens: { P1: 'alemao', P2: 'ale' }, iscas: { P1: 'minhoca', P2: 'minhoca' }, regioes: true },
        opts && opts.jogo);
      this._createPlayers(this.now());                 // recria com os pescadores regionais
    }

    _createPlayers(t) {
      if (!this.jogo) return super._createPlayers(t);  // primeira chamada, de dentro do construtor do P1
      this.t0 = t;
      this.seq = 0;
      this.log = [];
      // pontos de interesse: semente PRÓPRIA (a sequência de sorteios da pesca não muda)
      if (!this.pontos) {
        this.pontos = new PontosDeInteresse({ seed: mixSeed(this.seed, 77), config: this.config });
        this.pontos.on((ev) => { if (this.jogo.regioes) this._record(Object.assign({ time: this.now() }, ev, { ponto: ev.ponto ? Object.assign({}, ev.ponto) : ev.ponto })); });
      } else this.pontos.reiniciar(mixSeed(this.seed, 77));
      this._ultimoT = null;
      const nomes = { alemao: 'ALEMÃO', ale: 'ALE' };
      const make = (id, seedOffset) => new PescadorRegional({
        id, label: nomes[this.jogo.personagens[id]] || id, config: this.config, time: t,
        rng: new Random(mixSeed(this.seed, seedOffset)),
        emit: (entry) => this._record(entry),
        regioes: this.jogo.regioes, isca: this.jogo.iscas[id],
        consultarPonto: (jogador, distancia) => (this.jogo.regioes && this.ids.includes(jogador) ? this.pontos.consultar(jogador, distancia) : null)
      });
      this.players = { P1: make('P1', 1), P2: make('P2', 2) };
    }

    /** Igual ao P1 + o relógio dos pontos de interesse (só corre quando a sessão é atualizada, ou seja, fora da pausa). */
    update(t) {
      t = t != null ? t : this.now();
      const dt = this._ultimoT == null ? 0 : Math.max(0, Math.min(MAX_DT_PONTOS, t - this._ultimoT));
      this._ultimoT = t;
      if (this.jogo && this.jogo.regioes && this.pontos) this.pontos.avancar(dt);
      super.update(t);
    }

    get ids() { return this.jogo.modo === 1 ? ['P1'] : ['P1', 'P2']; }

    setRegioes(on) {
      this.jogo.regioes = !!on;
      for (const id of ['P1', 'P2']) this.players[id].setRegioes(on);
    }

    setIsca(id, isca) {
      this.jogo.iscas[id] = isca;
      this.players[id].setIsca(isca);
    }

    /** Objetos pescados (não contam como peixe). */
    objetos() {
      return (this.players.P1.objetos || []).concat(this.players.P2.objetos || []).sort((a, b) => a.time - b.time);
    }
  }

  SessaoJogo.mixSeed = mixSeed;
  root.HF = root.HF || {};
  root.HF.SessaoJogo = SessaoJogo;
  if (typeof module !== 'undefined' && module.exports) module.exports = SessaoJogo;
})(typeof window !== 'undefined' ? window : globalThis);
