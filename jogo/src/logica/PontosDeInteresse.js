/*
 * Hangover Fishing — Operação Nova Identidade
 * PontosDeInteresse: "tem alguma coisa ali" — motivos para escolher ONDE arremessar.
 *
 * Primeira versão funcional dos "pontos quentes" do plano de regiões (seção 8):
 *   - UM ponto por vez, ESPELHADO: mesmo tipo, mesma distância e mesmo instante nas duas metades
 *     da tela (igualdade S7). Cada jogador mira o seu com a força do arremesso, como sempre.
 *   - duração limitada; aparece e some com intervalos sorteados;
 *   - o efeito vale só para o arremesso cuja boia POUSA no ponto (até TOLERANCIA m de distância),
 *     e é moderado: mordida mais cedo, espécies mais prováveis ou peixe um pouco mais pesado.
 *     Nunca garante captura: ainda é preciso fisgar e vencer a briga.
 *   - sorteio PRÓPRIO (semente separada): não mexe na sequência de sorteios da pesca.
 *     Com as regiões desligadas, não há pontos (o jogo continua igual ao P1).
 *
 * Sem Phaser: testável no Node.
 */
(function (root) {
  'use strict';

  const req = (p) => (typeof require === 'function' ? require(p) : null);
  const HF = root.HF || {};
  const Random = HF.Random || req('../../../prototipos/p1-pesca/src/logic/Random.js');
  const Dados = HF.DadosPesca || req('./DadosPesca.js');

  // Tipos de ponto: em que zona aparecem e o efeito no arremesso que pousa neles.
  //   espera: multiplica a espera até a mordida · especies: multiplica a chance das espécies
  //   peso: desloca a faixa de peso (fração da faixa da espécie)
  const TIPOS = {
    bolhas: { nome: 'Bolhas', zonas: ['rasa', 'lirios'], peso_sorteio: 3, espera: 0.65, especies: {}, peso: 0,
      dica: 'Bolhas subindo: tem peixe mexendo no fundo.' },
    cardume: { nome: 'Cardume', zonas: ['rasa'], peso_sorteio: 2, espera: 0.75, especies: { lambari: 1.8, tilapia: 1.4 }, peso: 0,
      dica: 'Cardume de peixes pequenos: mordida rápida.' },
    lirios: { nome: 'Peixes sob os lírios', zonas: ['lirios'], peso_sorteio: 2, espera: 0.8, especies: { tilapia: 1.5, traira: 1.6 }, peso: 0,
      dica: 'Folhas tremendo: tilápias e traíras se escondem ali.' },
    correnteza: { nome: 'Redemoinho', zonas: ['pedras'], peso_sorteio: 2, espera: 0.9, especies: { traira: 1.4, tucunare: 2, dourado: 1.6 }, peso: 0,
      dica: 'Água girando: predadores caçam na correnteza (isca artificial!).' },
    sombra: { nome: 'Sombra grande', zonas: ['pedras', 'poco'], peso_sorteio: 2, espera: 0.95, especies: { carpa: 1.3, bagre: 1.3, dourado: 1.3 }, peso: 0.2,
      dica: 'Uma sombra enorme passando: peixe pesado por perto.' },
    tronco: { nome: 'Tronco submerso', zonas: ['poco'], peso_sorteio: 1, espera: 0.95, especies: { bagre: 1.6, carpa: 1.3 }, peso: 0.15,
      dica: 'Tronco no fundo: esconderijo de bagre e carpa.' }
  };
  const CFG = {
    primeiroMs: [25000, 40000],      // o primeiro ponto aparece depois disso
    intervaloMs: [30000, 60000],     // pausa entre um ponto e o próximo
    duracaoMs: [18000, 28000],
    toleranciaM: 2,                  // a boia precisa pousar a até 2 m da distância do ponto
    margemM: 1                       // distância mínima das bordas da zona e do alcance do arremesso
  };

  class PontosDeInteresse {
    /** opts: { seed, config (do P1: castMinDistance/castMaxDistance), cfg (sobrepõe CFG) } */
    constructor(opts) {
      opts = opts || {};
      this.cfg = Object.assign({}, CFG, opts.cfg || {});
      this.alcance = [opts.config ? opts.config.castMinDistance : 6, opts.config ? opts.config.castMaxDistance : 30];
      this.seed = opts.seed >>> 0;
      this.ouvintes = [];
      this.reiniciar(this.seed);
    }

    reiniciar(seed) {
      if (seed != null) this.seed = seed >>> 0;
      this.rng = new Random(this.seed);
      this.t = 0;
      this.atual = null;
      this.seq = 0;
      this.proximo = this.rng.range(this.cfg.primeiroMs[0], this.cfg.primeiroMs[1]);
      this.historico = [];          // pontos criados
      this.acertos = [];            // { jogador, tipo, zona, distancia, pouso, t }
    }

    on(fn) { this.ouvintes.push(fn); return () => { this.ouvintes = this.ouvintes.filter((f) => f !== fn); }; }
    _emitir(ev) { for (const fn of this.ouvintes) fn(ev); }

    /** Avança o relógio do lago (ms de JOGO; a pausa não conta). */
    avancar(dt) {
      if (!(dt > 0)) return;
      this.t += dt;
      if (this.atual && this.t >= this.atual.fim) {
        const a = this.atual;
        this.atual = null;
        this.proximo = this.t + this.rng.range(this.cfg.intervaloMs[0], this.cfg.intervaloMs[1]);
        this._emitir({ tipo: 'ponto-sumiu', ponto: a });
      }
      if (!this.atual && this.t >= this.proximo) this._criar();
    }

    _criar() {
      const lista = Object.keys(TIPOS).map((id) => ({ id, chance: TIPOS[id].peso_sorteio }));
      const tipo = this.rng.weighted(lista, 'chance').id;
      const zonas = TIPOS[tipo].zonas;
      const zona = zonas[Math.min(zonas.length - 1, Math.floor(this.rng.next() * zonas.length))];
      const z = Dados.zonaPorId[zona];
      const m = this.cfg.margemM;
      const a = Math.max(z.de + m, this.alcance[0] + m), b = Math.min(z.ate - m, this.alcance[1] - m);
      const distancia = Math.round(this.rng.range(a, Math.max(a, b)) * 10) / 10;
      const dur = this.rng.range(this.cfg.duracaoMs[0], this.cfg.duracaoMs[1]);
      this.atual = { id: ++this.seq, tipo, zona, distancia, inicio: this.t, fim: this.t + dur };
      this.historico.push(this.atual);
      this._emitir({ tipo: 'ponto-surgiu', ponto: this.atual });
    }

    /** O ponto ativo (o mesmo nas duas metades), ou null. */
    ativo() { return this.atual; }

    /** Efeito de um tipo de ponto (cópia). */
    static efeito(tipo) {
      const d = TIPOS[tipo];
      return d ? { tipo, espera: d.espera, especies: Object.assign({}, d.especies), peso: d.peso } : null;
    }

    /**
     * Chamado na SOLTURA do arremesso, com a distância de pouso. Se pousar no ponto ativo,
     * devolve o efeito (só para esse arremesso) e registra o acerto; senão, null.
     */
    consultar(jogador, distancia) {
      const a = this.atual;
      if (!a || Math.abs(distancia - a.distancia) > this.cfg.toleranciaM) return null;
      const reg = { jogador, tipo: a.tipo, zona: a.zona, distancia: a.distancia, pouso: Math.round(distancia * 10) / 10, t: this.t, ponto: a.id };
      this.acertos.push(reg);
      this._emitir(Object.assign({ tipo: 'ponto-acerto' }, reg, { tipoPonto: a.tipo }));
      return PontosDeInteresse.efeito(a.tipo);
    }

    /** Fração de vida do ponto (0 → 1), para a animação de entrada e saída. */
    vida() { const a = this.atual; return a ? Math.max(0, Math.min(1, (this.t - a.inicio) / Math.max(1, a.fim - a.inicio))) : 0; }

    /** Só para testes e demonstração: cria agora um ponto de um tipo (e distância opcional). */
    forcar(tipo, distancia) {
      if (!TIPOS[tipo]) return null;
      const z = Dados.zonaPorId[TIPOS[tipo].zonas[0]];
      const d = distancia != null ? distancia : Math.round(((Math.max(z.de, this.alcance[0]) + Math.min(z.ate, this.alcance[1])) / 2) * 10) / 10;
      if (this.atual) this._emitir({ tipo: 'ponto-sumiu', ponto: this.atual });
      this.atual = { id: ++this.seq, tipo, zona: Dados.zonaDaDistancia(d), distancia: d, inicio: this.t, fim: this.t + this.cfg.duracaoMs[1] };
      this.historico.push(this.atual);
      this._emitir({ tipo: 'ponto-surgiu', ponto: this.atual });
      return this.atual;
    }
  }

  PontosDeInteresse.TIPOS = TIPOS;
  PontosDeInteresse.CFG = CFG;
  root.HF = root.HF || {};
  root.HF.PontosDeInteresse = PontosDeInteresse;
  if (typeof module !== 'undefined' && module.exports) module.exports = PontosDeInteresse;
})(typeof window !== 'undefined' ? window : globalThis);
