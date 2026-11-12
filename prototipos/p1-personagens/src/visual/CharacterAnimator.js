/*
 * Hangover Fishing — P1 com personagens
 * CharacterAnimator: decide QUAL quadro de QUAL animação um personagem mostra.
 *
 * É só uma camada visual:
 *   - LÊ o estado do P1 (FishingPlayer) e NUNCA o altera;
 *   - não emite eventos, não conta toques e não muda prazos;
 *   - não depende do Phaser (os testes rodam no Node com o FishingPlayer real).
 *
 * Entradas:
 *   onState(de, para, ctx)  cada transição de estado do P1, na ordem em que acontece
 *                           (evento 'estado' da sessão). ctx = { castPower, pressed, time }
 *   update(dt, snap, now)   a cada quadro: dt = ms de JOGO (0 durante a pausa),
 *                           snap = FishingPlayer.snapshot(), now = instante do quadro (opcional;
 *                           com ctx.time, o modo novo conta só o tempo depois da transição)
 * Saída:
 *   frame()                 { anim, index, rodTip, frontHand, fish }
 *
 * Todos os tempos, índices e pontos vêm dos JSONs aprovados das seis animações
 * (arte/personagens-animacoes/<animação>/<animação>.json). Nada é inventado aqui.
 */
(function (root) {
  'use strict';

  const ZONE_LEVEL = { frouxa: 1, segura: 2, alerta: 3, critica: 4 };

  /** Faixa de força 0–100 → 'baixa' | 'media' | 'alta' (mesmas faixas do CHARGE e do CAST). */
  function bandOf(power, faixas) {
    const pct = Math.round(Math.max(0, Math.min(1, power || 0)) * 100);
    for (const f of faixas) if (pct >= f.forcaDe && pct <= f.forcaAte) return f;
    return faixas[faixas.length - 1];
  }

  /** Lê dos JSONs tudo o que a reprodução precisa (uma vez por personagem). */
  function buildSpec(data, character) {
    const idle = data.idle, charge = data.charge, cast = data.cast, reel = data.reel,
      cat = data.catch, fru = data.frustration;
    const pts = (anim) => anim.pontos[character];
    const castBands = cast.reproducao.faixas;
    const chargeRanges = charge.reproducao.carga.faixas;   // [{indice, forcaDe, forcaAte}]
    return {
      idle: {
        frames: idle.ciclo.quadros.map((q) => ({ i: q.indice, ms: q.ms })),
        blink: {
          index: idle.piscar.indice,
          ms: idle.piscar.ms,
          interval: idle.piscar.intervaloMs,
          at: idle.piscar.inicioDentroDoQuadroMs,
          onlyIndices: idle.piscar.apenasNosQuadros.map((id) => id - 1)   // quadros 1 e 3 → índices 0 e 2
        },
        tips: idle.pontaDaVara[character]
      },
      charge: {
        prep: charge.reproducao.preparacao.indices.map((i, k) => ({ i, ms: charge.reproducao.preparacao.msPorQuadro[k] })),
        ranges: chargeRanges,
        cancel: charge.reproducao.cancelamento.indices.map((i, k) => ({ i, ms: charge.reproducao.cancelamento.msPorQuadro[k] })),
        points: pts(charge)
      },
      cast: {
        bands: {
          baixa: { range: castBands.baixa.forca, ms: castBands.baixa.msPorQuadro },
          media: { range: castBands.media.forca, ms: castBands.media.msPorQuadro },
          alta: { range: castBands.alta.forca, ms: castBands.alta.msPorQuadro }
        },
        releaseIndex: cast.soltura.indice,
        releaseMs: cast.soltura.msAposSoltarOControle,
        points: pts(cast)
      },
      reel: {
        msPerPos: reel.manivela.msPorPosicao,
        hook: { i: reel.fisgada.indice, ms: reel.fisgada.ms },
        points: pts(reel)
      },
      catch: {
        entry: cat.reproducao.entrada.map((q) => ({ i: q.indice, ms: typeof q.ms === 'number' ? q.ms : null })),
        exit: cat.reproducao.saida.quadros.map((q) => ({ i: q.indice, ms: q.ms })),
        points: pts(cat)
      },
      frustration: {
        entry: fru.reproducao.entrada.map((q) => ({ i: q.indice, ms: typeof q.ms === 'number' ? q.ms : null })),
        exit: fru.reproducao.saida.quadros.map((q) => ({ i: q.indice, ms: q.ms })),
        points: pts(fru)
      }
    };
  }

  /** Faixa de força do CAST a partir da força da soltura (0–1). */
  function castBand(spec, power) {
    const pct = Math.round(Math.max(0, Math.min(1, power || 0)) * 100);
    for (const name of ['baixa', 'media', 'alta']) {
      const r = spec.cast.bands[name].range;
      if (pct >= r[0] && pct <= r[1]) return name;
    }
    return 'alta';
  }

  class CharacterAnimator {
    /**
     * opts.character  'alemao' | 'ale'
     * opts.data       { idle, charge, cast, reel, catch, frustration } (os JSONs aprovados)
     * opts.random     função () → [0, 1) só para o sorteio do piscar (cada personagem tem a sua)
     */
    constructor(opts) {
      this.character = opts.character;
      this.spec = buildSpec(opts.data, opts.character);
      this.random = opts.random || Math.random;
      this.clock = 0;               // ms de jogo acumulados por esta camada (congela na pausa)
      this.logic = 'IDLE';          // último estado do P1 recebido
      this.nextBlinkAt = this._drawBlinkDelay();
      this.history = [];            // trocas de animação (para os testes e o diagnóstico)
      this._enterIdle();
    }

    // ================= entrada: transições do P1 =================

    onState(from, to, ctx) {
      ctx = ctx || {};
      this.logic = to;
      // Instante da transição (opcional). No próximo update, o modo novo só avança o tempo que
      // passou DEPOIS dela, em vez do quadro de tela inteiro.
      this.freshAt = ctx.time != null ? ctx.time : null;
      const m = this.mode;
      switch (to) {
        case 'CHARGING':
          this._set('charge', { t: 0, last: this.spec.charge.prep[0].i });
          break;

        case 'CASTING': {
          const band = castBand(this.spec, ctx.castPower);
          const ms = this.spec.cast.bands[band].ms;
          this._set('cast', { band, seq: ms.map((v, i) => ({ i, ms: v })), t: 0, then: 'idle' });
          break;
        }

        case 'REELING_EMPTY':
          // Completar a volta: começa SEMPRE na posição 1, a não ser que esteja finalizando
          // (aí continua da posição atual, sem salto).
          if (m.name === 'reelEmpty' || m.name === 'finishing') this._set('reelEmpty', { pos: m.pos, acc: m.acc });
          else this._set('reelEmpty', { pos: 0, acc: 0 });
          break;

        case 'FIGHTING':
          if (from === 'BITE') this._set('hook', { t: 0 });
          else this._set('fight', { pos: 0, acc: 0, level: 2 });
          break;

        case 'CAUGHT':
          this._set('catch', { seq: this.spec.catch.entry, t: 0, then: null });
          break;

        case 'ESCAPED':
        case 'LINE_BROKEN':
          this._set('frustration', { seq: this.spec.frustration.entry, t: 0, then: null });
          break;

        case 'WAITING':
        case 'BITE':
        case 'IDLE':
          this._toRestingState(from, to);
          break;

        default:
          this._enterIdle();
          break;
      }
    }

    /** IDLE, WAITING e BITE mostram o IDLE — mas cada saída tem a sua passagem. */
    _toRestingState(from, to) {
      const m = this.mode;
      if (m.name === 'reelEmpty') {
        // Completar a volta (REELING_EMPTY → IDLE ou → WAITING)
        if (m.pos === 0) this._enterIdle();
        else this._set('finishing', { pos: m.pos, acc: m.acc });
        return;
      }
      if (m.name === 'finishing') return;                 // BITE durante a finalização: a volta termina
      if (m.name === 'cast') return;                      // a boia caiu antes do fim do CAST: deixa terminar
      if (to === 'IDLE' && from === 'CHARGING') {
        // Arremesso cancelado (toque curto ou interrupção): volta pelos quadros de preparação.
        const cancel = this.spec.charge.cancel;
        const seq = m.name === 'charge' && m.last > cancel[cancel.length - 1].i ? cancel : cancel.slice(-1);
        this._set('chargeCancel', { seq, t: 0, then: 'idle' });
        return;
      }
      if (to === 'IDLE' && from === 'CAUGHT' && m.name === 'catch') {
        this._set('catchExit', { seq: this.spec.catch.exit, t: 0, then: 'idle' });
        return;
      }
      if (to === 'IDLE' && (from === 'ESCAPED' || from === 'LINE_BROKEN') && m.name === 'frustration') {
        this._set('frustrationExit', { seq: this.spec.frustration.exit, t: 0, then: 'idle' });
        return;
      }
      if (m.name !== 'idle') this._enterIdle();
    }

    // ================= quadro a quadro =================

    update(dt, snap, now) {
      dt = Math.max(0, dt || 0);
      // Rede de segurança: se uma transição não chegou (ex.: sessão reiniciada pelo menu),
      // ressincroniza com o estado real do P1 em vez de ficar preso.
      if (snap && snap.state !== this.logic) this.onState(this.logic, snap.state, { castPower: snap.castPower, pressed: snap.pressed });
      this.clock += dt;
      if (this.freshAt != null) {
        if (now != null) dt = Math.min(dt, Math.max(0, now - this.freshAt));
        this.freshAt = null;
      }
      const m = this.mode;
      switch (m.name) {
        case 'idle': this._updateIdle(dt); break;

        case 'charge': {
          m.t += dt;
          const prep = this.spec.charge.prep;
          let acc = 0, idx = null;
          for (const f of prep) { acc += f.ms; if (m.t < acc) { idx = f.i; break; } }
          if (idx == null) idx = bandOf(snap ? snap.chargePower : 0, this.spec.charge.ranges).indice;  // quadro pela força
          m.last = idx;
          break;
        }

        case 'reelEmpty':
          m.acc += dt;
          while (m.acc >= this.spec.reel.msPerPos) { m.acc -= this.spec.reel.msPerPos; m.pos = (m.pos + 1) % 4; }
          break;

        case 'finishing':
          if (m.showedHome) { this._enterIdle(); break; }   // a posição 1 apareceu no quadro anterior
          m.acc += dt;
          while (m.pos !== 0 && m.acc >= this.spec.reel.msPerPos) { m.acc -= this.spec.reel.msPerPos; m.pos = (m.pos + 1) % 4; }
          if (m.pos === 0) m.showedHome = true;              // mostra a posição 1 agora; IDLE no próximo quadro
          break;

        case 'hook':
          m.t += dt;
          if (m.t >= this.spec.reel.hook.ms) {
            // Depois da fisgada: posição 1, ou posição 2 se o jogador já estiver segurando.
            const pressed = !!(snap && snap.pressed);
            this._set('fight', { pos: pressed ? 1 : 0, acc: 0, level: this._level(snap) });
          }
          break;

        case 'fight':
          m.level = this._level(snap);                       // troca de nível imediata, mantém a posição
          if (snap && snap.pressed) {                        // a manivela só gira enquanto segura
            m.acc += dt;
            while (m.acc >= this.spec.reel.msPerPos) { m.acc -= this.spec.reel.msPerPos; m.pos = (m.pos + 1) % 4; }
          }
          break;

        default:                                             // sequências: cast, catch, frustration e saídas
          if (m.seq) {
            m.t += dt;
            this._seqIndex(m);
            if (m.done && m.then === 'idle') this._enterIdle();
          }
          break;
      }
    }

    _level(snap) {
      return (snap && ZONE_LEVEL[snap.zone]) || (this.mode.level || 2);
    }

    _seqIndex(m) {
      let acc = 0;
      for (let k = 0; k < m.seq.length; k++) {
        const f = m.seq[k];
        if (f.ms == null) { m.cur = f.i; m.done = false; m.holding = true; return; }  // pose mantida
        acc += f.ms;
        if (m.t < acc) { m.cur = f.i; m.done = false; return; }
      }
      m.cur = m.seq[m.seq.length - 1].i;
      m.done = true;
    }

    // ================= IDLE e piscar =================

    _drawBlinkDelay() {
      const [a, b] = this.spec.idle.blink.interval;
      return (this.clock || 0) + a + this.random() * (b - a);
    }

    _enterIdle() {
      // Um piscar reservado e interrompido (o IDLE acabou antes dele) não pode travar os próximos.
      if (this.nextBlinkAt === Infinity) this.nextBlinkAt = this._drawBlinkDelay();
      this._set('idle', { t: 0, frameK: -1, blinkFrame: false });
    }

    _updateIdle(dt) {
      const m = this.mode, frames = this.spec.idle.frames, blink = this.spec.idle.blink;
      const cycle = frames.reduce((s, f) => s + f.ms, 0);
      m.t = (m.t + dt) % cycle;
      let acc = 0, k = 0;
      for (; k < frames.length; k++) { if (m.t < acc + frames[k].ms) break; acc += frames[k].ms; }
      if (k !== m.frameK) {
        // Começou um quadro novo. O piscar só acontece em um quadro 1 ou 3 que COMEÇA depois
        // da hora sorteada: 300 ms de olhos abertos, 100 ms do quadro P, o resto aberto.
        m.frameK = k;
        m.blinkFrame = blink.onlyIndices.includes(frames[k].i) && this.clock >= this.nextBlinkAt;
        if (m.blinkFrame) this.nextBlinkAt = Infinity;  // reservado; o próximo é sorteado ao fim deste
      }
      m.base = frames[k].i;
      const inFrame = m.t - acc;
      m.blinking = m.blinkFrame && inFrame >= blink.at && inFrame < blink.at + blink.ms;
      if (m.blinkFrame && inFrame >= blink.at + blink.ms && this.nextBlinkAt === Infinity) {
        m.blinkFrame = false;
        this.blinkCount = (this.blinkCount || 0) + 1;
        this.nextBlinkAt = this._drawBlinkDelay();
      }
    }

    // ================= saída =================

    frame() {
      const m = this.mode, s = this.spec;
      let anim, index;
      switch (m.name) {
        case 'idle':
          anim = 'idle';
          index = m.blinking ? s.idle.blink.index : (m.base != null ? m.base : s.idle.frames[0].i);
          break;
        case 'charge': anim = 'charge'; index = m.last; break;
        case 'chargeCancel': anim = 'charge'; index = m.cur != null ? m.cur : m.seq[0].i; break;
        case 'cast': anim = 'cast'; index = m.cur != null ? m.cur : 0; break;
        case 'reelEmpty':
        case 'finishing': anim = 'reel'; index = m.pos; break;            // nível 1
        case 'hook': anim = 'reel'; index = s.reel.hook.i; break;          // nível 3, posição 1
        case 'fight': anim = 'reel'; index = (m.level - 1) * 4 + m.pos; break;
        case 'catch':
        case 'catchExit': anim = 'catch'; index = m.cur != null ? m.cur : m.seq[0].i; break;
        case 'frustration':
        case 'frustrationExit': anim = 'frustration'; index = m.cur != null ? m.cur : m.seq[0].i; break;
        default: anim = 'idle'; index = 0;
      }
      return Object.assign({ anim, index, mode: m.name }, this.pointsOf(anim, index));
    }

    /** Pontos do quadro (coordenadas do quadro de 96 × 96, sem espelhar). */
    pointsOf(anim, index) {
      const s = this.spec;
      if (anim === 'idle') {
        const tips = s.idle.tips;
        return { rodTip: tips[index < tips.length ? index : 0], frontHand: null, fish: false };
      }
      const p = s[anim].points[index];
      return { rodTip: p.pontaDaVara, frontHand: p.maoDaFrente || null, fish: anim === 'catch' && !!p.peixe };
    }

    _set(name, fields) {
      const prev = this.mode ? this.mode.name : null;
      this.mode = Object.assign({ name }, fields);
      if (this.mode.seq) this._seqIndex(this.mode);
      if (prev !== name) {
        this.history.push({ clock: this.clock, mode: name, logic: this.logic });
        if (this.history.length > 200) this.history.shift();
      }
    }
  }

  CharacterAnimator.buildSpec = buildSpec;
  CharacterAnimator.castBand = castBand;
  CharacterAnimator.ZONE_LEVEL = ZONE_LEVEL;

  root.HF = root.HF || {};
  root.HF.CharacterAnimator = CharacterAnimator;
  if (typeof module !== 'undefined' && module.exports) module.exports = CharacterAnimator;
})(typeof window !== 'undefined' ? window : globalThis);
