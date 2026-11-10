/*
 * Hangover Fishing — Protótipo P1 (pesca)
 * Random: gerador pseudoaleatório com semente (mulberry32).
 *
 * Cada jogador tem o SEU gerador. Assim, o que um jogador faz nunca muda os
 * sorteios do outro (tempo de mordida, peixe, peso) — e os testes conseguem
 * reproduzir exatamente a mesma pescaria.
 */
(function (root) {
  'use strict';

  class Random {
    constructor(seed) {
      this.seed = (seed >>> 0) || 1;
      this.state = this.seed;
    }

    /** Número em [0, 1). */
    next() {
      let t = (this.state = (this.state + 0x6D2B79F5) >>> 0);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    range(min, max) {
      return min + (max - min) * this.next();
    }

    int(min, max) {
      return Math.floor(this.range(min, max + 1));
    }

    /** Escolhe um item pelo campo de peso informado. */
    weighted(items, field) {
      const total = items.reduce((sum, item) => sum + (item[field] || 0), 0);
      let roll = this.next() * total;
      for (const item of items) {
        roll -= item[field] || 0;
        if (roll < 0) return item;
      }
      return items[items.length - 1];
    }
  }

  root.HF = root.HF || {};
  root.HF.Random = Random;
  if (typeof module !== 'undefined' && module.exports) module.exports = Random;
})(typeof window !== 'undefined' ? window : globalThis);
