/*
 * Hangover Fishing — versão jogável
 * PescadorRegional: o FishingPlayer do P1 (sem alterações) + regiões, iscas e espécies.
 *
 * O que muda em relação ao P1: SÓ as tabelas dos sorteios.
 *   - _cast:         guarda a região de POUSO da boia (decisão D2: não muda ao recolher)
 *                    e a isca que foi para a água;
 *   - _scheduleBite: espera sorteada com a faixa da região × o multiplicador da isca;
 *   - _hook:         espécie e peso sorteados com a tabela região × isca; no fundo, o peixe
 *                    puxa mais forte e cansa mais devagar.
 * Estados, transições, entrada, tensão e resultados são os do P1.
 *
 * Igualdade com o P1: com as regiões DESLIGADAS (todo arremesso usa a tabela das águas
 * abertas) e a isca MINHOCA, as chamadas ao gerador aleatório e os valores sorteados são
 * exatamente os do P1 (testado em tests/logica.test.js).
 */
(function (root) {
  'use strict';

  const req = (p) => (typeof require === 'function' ? require(p) : null);
  const HF = root.HF || {};
  const FishingPlayer = HF.FishingPlayer || req('../../../prototipos/p1-pesca/src/logic/FishingPlayer.js');
  const Dados = HF.DadosPesca || req('./DadosPesca.js');

  class PescadorRegional extends FishingPlayer {
    constructor(opts) {
      super(opts);
      this.regioesAtivas = opts.regioes !== false;     // vale a partir do próximo arremesso
      this.isca = opts.isca || 'minhoca';              // vale a partir do próximo arremesso
      this.regiao = null;                              // região de pouso do arremesso atual (null = regiões desligadas)
      this.zona = null;                                // zona visual de pouso (Margem Rasa, Baía dos Lírios...)
      this.tabelaRegiao = 'aberta';
      this.iscaNaAgua = this.isca;
      this.consultarPonto = opts.consultarPonto || null; // (jogador, distância) → efeito do ponto de interesse ou null
      this.pontoNaAgua = null;                         // efeito do ponto em que a boia pousou (só neste arremesso)
    }

    setIsca(id) { if (Dados.iscaPorId[id]) this.isca = id; }
    setRegioes(on) { this.regioesAtivas = !!on; }

    _cast(t) {
      // Mesma conta do P1 (força no instante da soltura), feita ANTES de emitir 'arremesso',
      // para a tela já saber a região quando o evento chegar.
      const cfg = this.cfg;
      const phase = ((t - this.chargeStart) / cfg.castCycleMs) % 1;
      const power = phase < 0.5 ? phase * 2 : 2 - phase * 2;
      const distance = cfg.castMinDistance + (cfg.castMaxDistance - cfg.castMinDistance) * power;
      this.tabelaRegiao = this.regioesAtivas ? Dados.regiaoDaDistancia(distance) : 'aberta';
      this.regiao = this.regioesAtivas ? this.tabelaRegiao : null;
      this.zona = this.regioesAtivas ? Dados.zonaDaDistancia(distance) : null;
      this.iscaNaAgua = this.isca;
      // ponto de interesse: só com as regiões ligadas (desligadas = jogo do P1, sem pontos)
      this.pontoNaAgua = (this.regioesAtivas && this.consultarPonto) ? this.consultarPonto(this.id, distance) : null;
      super._cast(t);
    }

    /** Igual ao P1, com a faixa de espera da região, o multiplicador da isca e o do ponto de interesse. */
    _scheduleBite(t) {
      const cfg = this.cfg;
      const r = Dados.REGIOES[this.tabelaRegiao];
      const m = (Dados.iscaPorId[this.iscaNaAgua] || Dados.iscaPorId.minhoca).espera * (this.pontoNaAgua ? this.pontoNaAgua.espera : 1);
      const base = r.espera || [cfg.waitMinMs, cfg.waitMaxMs];
      const wait = this.rng.range(base[0] * m, base[1] * m);
      this.biteAt = t + wait;
      const count = this.rng.int(cfg.nibbleMin, cfg.nibbleMax);
      this.nibbles = [];
      if (wait > 1200) {
        for (let i = 0; i < count; i++) this.nibbles.push(this.rng.range(t + 500, this.biteAt - 400));
        this.nibbles.sort((a, b) => a - b);
      }
      this._emit({ tipo: 'espera', time: t, mordidaEmMs: Math.round(wait), beliscadas: this.nibbles.length });
    }

    /** Igual ao P1, com a tabela região × isca e os modificadores da região. */
    _hook(t) {
      const cfg = this.cfg;
      const r = Dados.REGIOES[this.tabelaRegiao];
      const reaction = t - this.biteStart;
      const pick = this.rng.weighted(this.tabelaDoSorteio(), 'chance');
      let def, objeto = false, comp;
      if (pick.id === 'objeto') {
        def = this.rng.weighted(Dados.OBJETOS, 'chance');
        objeto = true;
        comp = Dados.COMPORTAMENTO_OBJETO;
      } else {
        def = Dados.especiePorId[pick.id];
        comp = def.comportamento;
      }
      // faixa de peso da região (objetos: a faixa própria, sem modificador)
      const f = this.faixaDePeso(objeto);
      const span0 = def.pesoKg[1] - def.pesoKg[0];
      const w0 = round2(def.pesoKg[0] + span0 * f[0]), w1 = round2(def.pesoKg[0] + span0 * f[1]);
      const forca = objeto ? 1 : r.forca, cansaco = objeto ? 1 : r.cansaco;
      const profile = {
        id: def.id, nome: def.nome, objeto, chance: pick.chance, weightKg: [w0, w1],
        restPull: comp.restPull * forca, runPull: comp.runPull * forca,
        runMs: comp.runMs, restMs: comp.restMs, tireRate: comp.tireRate * cansaco
      };
      const weight = this.rng.range(profile.weightKg[0], profile.weightKg[1]);
      const span = profile.weightKg[1] - profile.weightKg[0];
      const weightNorm = span > 0 ? (weight - profile.weightKg[0]) / span : 0.5;
      this.fish = {
        profile,
        weightKg: Math.round(weight * 100) / 100,
        strength: 0.85 + 0.3 * weightNorm,
        energy: 1,
        phase: 'descanso',
        phaseUntil: t + this.rng.range(profile.restMs[0], profile.restMs[1]),
        pull: profile.restPull
      };
      this.tension = cfg.initialTension;
      this.slackMs = 0;
      this.criticalMs = 0;
      this.lastZone = this.tensionZone();
      this.fightStart = t;
      this.lastReactionMs = Math.round(reaction);
      this.stats.fisgadas++;
      this.stats.temposReacaoMs.push(Math.round(reaction));
      this._setState(FishingPlayer.STATES.FIGHTING, t, 'fisgou');
      this._emit({ tipo: 'fisgada', time: t, reacaoMs: Math.round(reaction), janelaMs: cfg.reactionWindowMs,
        perfil: profile.id, pesoKg: this.fish.weightKg });
    }

    /** Tabela do sorteio da espécie: região × isca, com o efeito do ponto de interesse (se a boia pousou nele). */
    tabelaDoSorteio() {
      const tab = Dados.tabela(this.tabelaRegiao, this.iscaNaAgua);
      const ponto = this.pontoNaAgua;
      if (!ponto || !ponto.especies) return tab;
      return tab.map((x) => ({ id: x.id, chance: x.chance * (ponto.especies[x.id] != null ? ponto.especies[x.id] : 1) }));
    }

    /** Fração da faixa de peso: a da região, deslocada pelo ponto de interesse (objetos: a faixa inteira). */
    faixaDePeso(objeto) {
      if (objeto) return [0, 1];
      const r = Dados.REGIOES[this.tabelaRegiao];
      const desloc = this.pontoNaAgua && this.pontoNaAgua.peso ? this.pontoNaAgua.peso : 0;
      return [r.faixaPeso[0] + desloc, Math.min(1.25, r.faixaPeso[1] + desloc)];
    }

    /** Captura: objetos não contam como peixe no placar (capturas, peso total, maior peixe). */
    _capture(t) {
      const fish = this.fish;
      if (!fish.profile.objeto) {
        super._capture(t);
        if (this.lastResult) Object.assign(this.lastResult, { regiao: this.regiao, isca: this.iscaNaAgua });
        const rec = this.captures[this.captures.length - 1];
        if (rec) Object.assign(rec, { regiao: this.regiao, isca: this.iscaNaAgua, especie: fish.profile.id });
        return;
      }
      this.objetos = this.objetos || [];
      const record = { jogador: this.id, nome: this.label, perfil: fish.profile.id, peixe: fish.profile.nome, pesoKg: fish.weightKg,
        objeto: true, brigaMs: Math.round(t - this.fightStart), reacaoMs: this.lastReactionMs, time: t, regiao: this.regiao, isca: this.iscaNaAgua };
      this.objetos.push(record);
      this._finish(FishingPlayer.STATES.CAUGHT, t, Object.assign({ tipo: 'captura' }, record));
    }

    snapshot(t) {
      const s = super.snapshot(t);
      s.regiao = this.regiao;
      s.zona = this.zona;
      s.ponto = this.pontoNaAgua ? this.pontoNaAgua.tipo : null;
      s.isca = this.isca;
      s.iscaNaAgua = this.iscaNaAgua;
      s.regioesAtivas = this.regioesAtivas;
      if (s.fish && this.fish) s.fish.objeto = !!this.fish.profile.objeto;
      return s;
    }
  }

  function round2(v) { return Math.round(v * 100) / 100; }

  root.HF = root.HF || {};
  root.HF.PescadorRegional = PescadorRegional;
  if (typeof module !== 'undefined' && module.exports) module.exports = PescadorRegional;
})(typeof window !== 'undefined' ? window : globalThis);
