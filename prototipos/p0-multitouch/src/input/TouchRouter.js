/*
 * Hangover Fishing — Protótipo 0 (multitouch)
 * TouchRouter: decide a qual jogador cada toque pertence e registra tudo.
 *
 * Regra central — POSSE DO TOQUE:
 *   1. Um toque pertence à zona onde COMEÇOU (metade esquerda = P1, direita = P2).
 *   2. Ele continua pertencendo a essa zona até terminar, mesmo que o dedo
 *      seja arrastado para a outra metade.
 *   3. Nenhum evento posterior muda o dono de um toque.
 *
 * Também trata situações anormais:
 *   - cancelamento (o sistema interrompe o toque)            -> "cancelado"
 *   - interrupção da página (perda de foco, página oculta)   -> cancelAll()
 *   - toque "órfão" (ativo aqui, mas sem dedo de verdade)    -> reconcile()
 *   - início duplicado / fim de toque desconhecido           -> erro registrado
 *
 * Não depende do Phaser: a cena apenas repassa os eventos.
 */
(function (root) {
  'use strict';

  const PlayerZone = (root.HF && root.HF.PlayerZone) ||
    (typeof require === 'function' ? require('./PlayerZone.js') : null);

  class TouchRouter {
    constructor(opts) {
      opts = opts || {};
      this.now = opts.now || (() => performance.now());
      this.maxLog = opts.maxLog || 500;
      this.holdThresholdMs = opts.holdThresholdMs != null ? opts.holdThresholdMs : 200;
      this.zones = {
        P1: new PlayerZone({ id: 'P1', label: 'Alemão', holdThresholdMs: this.holdThresholdMs }),
        P2: new PlayerZone({ id: 'P2', label: 'ALE', holdThresholdMs: this.holdThresholdMs })
      };
      this.owner = new Map();     // chave do ponteiro -> 'P1' | 'P2'
      this.ignored = new Set();   // toques que começaram fora da área de jogo (ex.: botão do menu)
      this.width = 1;
      this.t0 = this.now();
      this.seq = 0;
      this.log = [];
      this.errors = [];
      this.warnings = [];
      this.testId = 'livre';
      this.listeners = [];
    }

    // ---------- configuração ----------

    setWidth(width) {
      this.width = Math.max(1, width);
    }

    setHoldThreshold(ms) {
      this.holdThresholdMs = ms;
      this.zones.P1.holdThresholdMs = ms;
      this.zones.P2.holdThresholdMs = ms;
    }

    setTest(testId) {
      this.testId = testId;
    }

    onEvent(fn) {
      this.listeners.push(fn);
    }

    zoneAt(x) {
      return x < this.width / 2 ? 'P1' : 'P2';
    }

    otherZone(zoneId) {
      return zoneId === 'P1' ? 'P2' : 'P1';
    }

    // ---------- eventos de entrada ----------

    down(input) {
      const time = input.time != null ? input.time : this.now();
      const key = input.key;

      if (this.owner.has(key)) {
        this._error('inicio-duplicado', {
          key, time, zona: this.owner.get(key),
          detalhe: 'ponteiro ' + key + ' começou de novo sem ter terminado; o toque anterior foi encerrado'
        });
        this._release(key, time, { canceled: true, motivo: 'inicio-duplicado' });
      }
      this.ignored.delete(key);

      const zoneId = this.zoneAt(input.x);
      const zone = this.zones[zoneId];
      const finger = zone.addFinger(key, input.identifier, time);
      this.owner.set(key, zoneId);

      const entry = this._emit({
        tipo: 'inicio', zona: zoneId, key, identifier: input.identifier, time,
        dedosNaZona: zone.activeCount
      });
      finger.startSeq = entry.seq;
      return entry;
    }

    move(input) {
      const zoneId = this.owner.get(input.key);
      if (!zoneId) return null;
      const finger = this.zones[zoneId].getFinger(input.key);
      const time = input.time != null ? input.time : this.now();
      const overOther = this.zoneAt(input.x) !== zoneId;

      if (overOther && !finger.overOther) {
        finger.overOther = true;
        finger.crossed = true;
        return this._emit({
          tipo: 'cruzou', zona: zoneId, key: input.key, identifier: finger.identifier, time,
          detalhe: 'dedo de ' + zoneId + ' sobre a zona de ' + this.otherZone(zoneId) + ' — posse mantida'
        });
      }
      if (!overOther && finger.overOther) {
        finger.overOther = false;
        return this._emit({
          tipo: 'voltou', zona: zoneId, key: input.key, identifier: finger.identifier, time,
          detalhe: 'dedo de ' + zoneId + ' voltou para a própria zona'
        });
      }
      return null;
    }

    up(input) {
      const time = input.time != null ? input.time : this.now();
      const key = input.key;

      if (this.ignored.has(key)) {
        this.ignored.delete(key);
        return null;
      }
      if (!this.owner.has(key)) {
        return this._error('fim-desconhecido', {
          key, time, identifier: input.identifier,
          detalhe: 'fim de um toque que não estava registrado'
        });
      }
      return this._release(key, time, {
        canceled: !!input.canceled,
        motivo: input.canceled ? 'cancelamento do sistema' : null,
        zonaFim: input.x != null ? this.zoneAt(input.x) : null
      });
    }

    /** Toque que começou fora da área de jogo (ex.: botão do menu): não pertence a ninguém. */
    ignore(key) {
      this.ignored.add(key);
    }

    /** Encerra todos os toques ativos (perda de foco, página oculta, menu aberto, rotação...). */
    cancelAll(motivo, time) {
      time = time != null ? time : this.now();
      const keys = Array.from(this.owner.keys());
      for (const key of keys) {
        this._release(key, time, { canceled: true, motivo });
        // o dedo talvez ainda esteja na tela: o "fim" que chegar depois é esperado e não é erro
        this.ignored.add(key);
      }
      this._emit({ tipo: 'reset', motivo, time, afetados: keys.length });
      return keys.length;
    }

    /**
     * Rede de segurança: libera toques registrados aqui cujo dedo já não existe.
     * isDown(key) deve dizer se o ponteiro ainda está realmente pressionado.
     */
    reconcile(isDown, time) {
      time = time != null ? time : this.now();
      let fixed = 0;
      for (const key of Array.from(this.owner.keys())) {
        if (!isDown(key)) {
          this._error('orfao', {
            key, time, zona: this.owner.get(key),
            detalhe: 'toque ativo sem dedo correspondente — liberado à força'
          });
          this._release(key, time, { canceled: true, motivo: 'orfao' });
          fixed++;
        }
      }
      return fixed;
    }

    /** Chamado a cada quadro: registra quando um toque vira "segurar". */
    update(time) {
      time = time != null ? time : this.now();
      for (const zoneId of ['P1', 'P2']) {
        for (const finger of this.zones[zoneId].update(time)) {
          this._emit({
            tipo: 'segurar-inicio', zona: zoneId, key: finger.key,
            identifier: finger.identifier, time, inicioSeq: finger.startSeq
          });
        }
      }
    }

    /** Registro informativo (não conta como erro nem aviso). */
    info(codigo, detalhe) {
      return this._emit({ tipo: 'info', codigo, detalhe, time: this.now() });
    }

    warn(codigo, dados) {
      const entry = this._emit(Object.assign({ tipo: 'aviso', codigo, time: this.now() }, dados));
      this.warnings.push(entry);
      return entry;
    }

    resetCounters() {
      this.zones.P1.resetCounters();
      this.zones.P2.resetCounters();
      this.log = [];
      this.errors = [];
      this.warnings = [];
      this._emit({ tipo: 'reset', motivo: 'contadores zerados', time: this.now(), afetados: 0 });
    }

    // ---------- consultas ----------

    activeFingers(time) {
      time = time != null ? time : this.now();
      const list = [];
      for (const zoneId of ['P1', 'P2']) {
        for (const finger of this.zones[zoneId].fingers.values()) {
          list.push({
            zona: zoneId,
            key: finger.key,
            identifier: finger.identifier,
            inicioSeq: finger.startSeq,
            duracao: Math.round(time - finger.startTime),
            segurando: finger.held,
            sobreOutraZona: finger.overOther
          });
        }
      }
      return list;
    }

    ownerOf(key) {
      return this.owner.get(key) || null;
    }

    // ---------- interno ----------

    _release(key, time, opts) {
      const zoneId = this.owner.get(key);
      this.owner.delete(key);
      const result = this.zones[zoneId].removeFinger(key, time, { canceled: opts.canceled });
      return this._emit({
        tipo: opts.canceled ? 'cancelado' : 'fim',
        zona: zoneId,
        key,
        identifier: result.finger.identifier,
        time,
        duracao: Math.round(result.duration),
        classificacao: result.kind,
        inicioSeq: result.finger.startSeq,
        zonaFim: opts.zonaFim || null,
        cruzou: result.finger.crossed,
        motivo: opts.motivo || null
      });
    }

    _error(codigo, dados) {
      const entry = this._emit(Object.assign({ tipo: 'erro', codigo }, dados));
      this.errors.push(entry);
      return entry;
    }

    _emit(entry) {
      entry.seq = ++this.seq;
      entry.t = Math.round(entry.time - this.t0);
      entry.teste = this.testId;
      this.log.push(entry);
      if (this.log.length > this.maxLog) this.log.shift();
      for (const fn of this.listeners) fn(entry);
      return entry;
    }
  }

  root.HF = root.HF || {};
  root.HF.TouchRouter = TouchRouter;
  if (typeof module !== 'undefined' && module.exports) module.exports = TouchRouter;
})(typeof window !== 'undefined' ? window : globalThis);
