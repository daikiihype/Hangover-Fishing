/*
 * Hangover Fishing — narrativa
 * Sirius: o estado do bebê durante a partida. Só narrativa: NADA aqui toca na pescaria
 * (GDD 3.8, opção A — "só narrativo").
 *
 * Estados:  acordado → (inquieto → chorando → acalmando) → acordado | dormindo
 *           acordado ⇄ dormindo
 *   - acordado:  pode balbuciar (o Narrador decide quando).
 *   - inquieto:  aviso curto antes do choro ("AAAA!"), ~2,5 s.
 *   - chorando:  choro em 8-bit; Maria para de comentar a pescaria e cuida dele.
 *   - acalmando: Maria terminando de acalmar; depois ele volta acordado ou dorme.
 *   - dormindo:  sem balbucios e sem choro.
 *
 * Regras de equilíbrio do choro (GDD 3.8): frequência baixa, nunca nos primeiros 75 s,
 * no mínimo 4 min entre um choro e outro, duração curta (8–13 s).
 */
(function (root) {
  'use strict';

  const CFG = {
    acordadoMs: [100000, 200000],     // quanto tempo fica acordado antes de cochilar
    dormindoMs: [70000, 140000],      // duração do cochilo
    choroInicioMinMs: 75000,          // nunca chora antes disso
    choroIntervaloMinMs: 240000,      // mínimo entre dois choros
    choroChancePorMin: 0.32,          // chance por minuto acordado (fora das restrições)
    inquietoMs: 2500,
    chorandoMs: [6000, 8500],
    acalmandoMs: [2500, 4000],
    dormirDepoisDoChoro: 0.55         // depois de chorar, muitas vezes adormece
  };

  class Sirius {
    constructor(opts) {
      opts = opts || {};
      this.random = opts.random || Math.random;
      this.cfg = Object.assign({}, CFG, opts.cfg || {});
      this.t = 0;
      this.estado = 'acordado';
      this.desde = 0;
      this.ate = this._entre(this.cfg.acordadoMs);   // fim do estado atual (para acordado/dormindo)
      this.ultimoChoroFim = -Infinity;
      this.choros = 0;
      this.historico = [];
    }

    _entre([a, b]) { return a + this.random() * (b - a); }

    _mudar(estado, duracao) {
      this.historico.push({ t: this.t, de: this.estado, para: estado });
      if (this.historico.length > 100) this.historico.shift();
      this.estado = estado;
      this.desde = this.t;
      this.ate = this.t + duracao;
      return { tipo: estado };
    }

    /** Avança o tempo de jogo; devolve os eventos que aconteceram (para o Narrador). */
    update(dt) {
      dt = Math.max(0, dt || 0);
      this.t += dt;
      const out = [];
      switch (this.estado) {
        case 'acordado':
          if (this.t >= this.ate) { out.push(this._mudar('dormindo', this._entre(this.cfg.dormindoMs))); break; }
          if (this.podeChorar() && this.random() < this.cfg.choroChancePorMin * dt / 60000) out.push(this._mudar('inquieto', this.cfg.inquietoMs));
          break;
        case 'inquieto':
          if (this.t >= this.ate) { this.choros++; out.push(this._mudar('chorando', this._entre(this.cfg.chorandoMs))); }
          break;
        case 'chorando':
          if (this.t >= this.ate) out.push(this._mudar('acalmando', this._entre(this.cfg.acalmandoMs)));
          break;
        case 'acalmando':
          if (this.t >= this.ate) {
            this.ultimoChoroFim = this.t;
            if (this.random() < this.cfg.dormirDepoisDoChoro) out.push(this._mudar('dormindo', this._entre(this.cfg.dormindoMs)));
            else out.push(this._mudar('acordado', this._entre(this.cfg.acordadoMs)));
          }
          break;
        case 'dormindo':
          if (this.t >= this.ate) out.push(this._mudar('acordado', this._entre(this.cfg.acordadoMs)));
          break;
        default: break;
      }
      return out;
    }

    podeChorar() {
      return this.estado === 'acordado' && this.t >= this.cfg.choroInicioMinMs && this.t - this.ultimoChoroFim >= this.cfg.choroIntervaloMinMs;
    }

    /**
     * Barulho (comemoração, linha arrebentando...): acordado, aumenta a chance de ficar
     * inquieto; dormindo, pode acordar. Nunca quebra as regras de frequência do choro.
     * Devolve os eventos gerados.
     */
    barulho(intensidade) {
      const i = Math.max(0, Math.min(1, intensidade || 0));
      if (this.estado === 'dormindo' && this.random() < 0.25 * i) return [this._mudar('acordado', this._entre(this.cfg.acordadoMs))];
      if (this.podeChorar() && this.random() < 0.12 * i) return [this._mudar('inquieto', this.cfg.inquietoMs)];
      return [];
    }

    /** Só para testes e demonstração: força um estado (respeita a máquina de estados). */
    forcar(estado) {
      if (estado === 'choro') return [this._mudar('inquieto', this.cfg.inquietoMs)];
      if (estado === 'dormindo') return [this._mudar('dormindo', this._entre(this.cfg.dormindoMs))];
      if (estado === 'acordado') return [this._mudar('acordado', this._entre(this.cfg.acordadoMs))];
      return [];
    }

    get acordado() { return this.estado === 'acordado'; }
    get dormindo() { return this.estado === 'dormindo'; }
    get chorando() { return this.estado === 'inquieto' || this.estado === 'chorando' || this.estado === 'acalmando'; }
  }

  Sirius.CFG = CFG;
  root.HF = root.HF || {};
  root.HF.Sirius = Sirius;
  if (typeof module !== 'undefined' && module.exports) module.exports = Sirius;
})(typeof window !== 'undefined' ? window : globalThis);
