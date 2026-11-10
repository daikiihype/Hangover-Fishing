/*
 * Hangover Fishing — Protótipo P1 (pesca)
 * FishingPlayer: a pescaria de UM jogador (máquina de estados).
 *
 * Não depende do Phaser nem do navegador. Recebe apenas três coisas:
 *   press(t)                      um NOVO dedo tocou a zona deste jogador
 *   release(t, {canceled, stillPressed})  um dedo saiu (stillPressed = ainda há outro dedo na zona)
 *   update(t)                     passagem do tempo (chamado a cada quadro)
 *
 * Estados (tabela completa de transições no README, seção 3):
 *   IDLE → CHARGING → CASTING → WAITING → BITE → FIGHTING → CAUGHT
 *   WAITING ⇄ REELING_EMPTY → IDLE        (recolher a linha vazia)
 *   BITE → ESCAPED                         (sem novo toque dentro da janela)
 *   FIGHTING → ESCAPED | LINE_BROKEN       (frouxa demais | crítica demais)
 *   CAUGHT / ESCAPED / LINE_BROKEN → IDLE  (fim do tempo ou novo toque)
 *
 * Regras de entrada importantes:
 *   - Só um NOVO toque (press) inicia ações. Um dedo que já estava na tela não
 *     "vira" outra ação quando o estado muda (ex.: dedo apoiado durante a
 *     mordida não fisga; dedo que ainda segura após a captura não arremessa).
 *   - Toques antes da mordida são ignorados e NÃO ficam guardados.
 *
 * A simulação avança em passos fixos (simStepMs), então o resultado não
 * depende da taxa de quadros do celular.
 */
(function (root) {
  'use strict';

  const Random = (root.HF && root.HF.Random) ||
    (typeof require === 'function' ? require('./Random.js') : null);

  const S = Object.freeze({
    IDLE: 'IDLE',
    CHARGING: 'CHARGING',
    CASTING: 'CASTING',
    WAITING: 'WAITING',
    REELING_EMPTY: 'REELING_EMPTY',
    BITE: 'BITE',
    FIGHTING: 'FIGHTING',
    CAUGHT: 'CAUGHT',
    ESCAPED: 'ESCAPED',
    LINE_BROKEN: 'LINE_BROKEN'
  });

  const STATE_LABELS = {
    IDLE: 'pronto',
    CHARGING: 'carregando',
    CASTING: 'arremessando',
    WAITING: 'esperando',
    REELING_EMPTY: 'recolhendo (vazio)',
    BITE: 'MORDIDA',
    FIGHTING: 'briga',
    CAUGHT: 'capturado',
    ESCAPED: 'escapou',
    LINE_BROKEN: 'linha rompida'
  };

  const RESULT_STATES = [S.CAUGHT, S.ESCAPED, S.LINE_BROKEN];
  const SIM_STEP_MS = 10;
  const MAX_CATCH_UP_MS = 250;

  function emptyStats() {
    return {
      arremessos: 0,
      arremessosCancelados: 0,
      mordidas: 0,
      fisgadas: 0,
      mordidasPerdidas: 0,     // ninguém tocou dentro da janela
      toquesPrematuros: 0,     // toques ignorados durante a espera
      toquesAtrasados: 0,      // toques depois de a janela fechar
      toquesIgnorados: 0,      // outros toques sem efeito (voo da boia, resultado na tela)
      recolhimentosVazios: 0,
      fugas: 0,                // peixe escapou por linha frouxa
      linhasRompidas: 0,
      capturas: 0,
      pesoTotalKg: 0,
      maiorPesoKg: 0,
      temposReacaoMs: []
    };
  }

  class FishingPlayer {
    constructor(opts) {
      this.id = opts.id;
      this.label = opts.label;
      this.cfg = opts.config;
      this.rng = opts.rng || new Random(opts.seed || 1);
      this.emitFn = opts.emit || (() => {});
      const t = opts.time != null ? opts.time : 0;
      this.simTime = t;
      this.pressed = false;
      this.paused = false;
      this.pausedAt = 0;
      this.stats = emptyStats();
      this.captures = [];
      this.state = S.IDLE;
      this.stateSince = t;
      this.lastReactionMs = null;
      this.lastResult = null;
      this._clearRound();
    }

    // ================= entrada =================

    press(t) {
      if (this.paused) return;             // durante uma pausa nenhum toque chega à pescaria
      this._advance(t);
      this.pressed = true;
      const cfg = this.cfg;

      switch (this.state) {
        case S.IDLE:
          this._startCharging(t);
          break;

        case S.WAITING:
          // Pode ser um toque (ignorado) ou o começo de um "segurar" (recolher).
          // Nada fica guardado para a mordida.
          if (this.waitPressAt == null) this.waitPressAt = t;
          break;

        case S.BITE:
          if (t <= this.biteDeadline) {
            this._hook(t);
          } else {
            this._loseBite(t);
            this._lateTouch(t);
          }
          break;

        case S.CASTING:
          this.stats.toquesIgnorados++;
          this._emit({ tipo: 'toque-ignorado', time: t, motivo: 'boia no ar' });
          break;

        case S.CAUGHT:
        case S.ESCAPED:
        case S.LINE_BROKEN:
          // D7: o MESMO comportamento para todos os cartões (captura, fuga, linha rompida
          // e mordida perdida). Cada toque gera exatamente UM registro.
          if (t - this.stateSince >= cfg.resultSkipAfterMs) {
            // "Tocar para continuar": encerra o resultado e já começa a carregar o arremesso.
            this._toIdle(t, 'novo toque');
            this._startCharging(t);
          } else if (this.state === S.ESCAPED && this.lastResult && this.lastResult.motivo === 'sem-reacao') {
            // Logo depois de perder a mordida: o toque chegou tarde demais (medição de reação).
            this._lateTouch(t);
          } else {
            this.stats.toquesIgnorados++;
            this._emit({ tipo: 'toque-ignorado', time: t, motivo: 'resultado na tela' });
          }
          break;

        // CHARGING, REELING_EMPTY, FIGHTING: um dedo a mais na mesma zona não muda nada.
        default:
          break;
      }
    }

    release(t, opts) {
      opts = opts || {};
      if (this.paused) {                   // fim atrasado de um dedo durante a pausa: só atualiza o estado do dedo
        this.pressed = !!opts.stillPressed;
        return;
      }
      this._advance(t);
      this.pressed = !!opts.stillPressed;
      if (this.pressed) return;            // outro dedo do mesmo jogador continua na zona

      switch (this.state) {
        case S.CHARGING: {
          const held = t - this.chargeStart;
          if (opts.canceled) {
            this._cancelCast(t, 'interrupcao', 'interrupção do sistema');
          } else if (held < this.cfg.castMinChargeMs) {
            // D2: a cena mostra "SEGURE PARA ARREMESSAR!" ao ver o código 'toque-curto'. Sem penalidade.
            this._cancelCast(t, 'toque-curto', 'toque curto (' + Math.round(held) + ' ms)');
          } else {
            this._cast(t);
          }
          break;
        }

        case S.WAITING:
          if (this.waitPressAt != null) {
            const dur = t - this.waitPressAt;
            this.waitPressAt = null;
            if (dur < this.cfg.holdThresholdMs) {
              this.stats.toquesPrematuros++;
              this._emit({ tipo: 'toque-prematuro', time: t, duracaoMs: Math.round(dur),
                mordidaEmMs: Math.round(this.biteAt - t) });
            }
          }
          break;

        case S.REELING_EMPTY:
          // D4: parou de recolher no meio. A boia fica onde está e a espera CONTINUA de onde
          // estava (sem novo sorteio). O tempo de recolhimento não conta como espera.
          this._setState(S.WAITING, t, 'recolhimento interrompido');
          this._resumeWait(t);
          break;

        default:
          break;
      }
    }

    update(t) {
      if (this.paused) return;
      this._advance(t);
    }

    // ================= pausa (D8) =================

    /** Congela a pescaria: estado, tensão, peixe e todos os prazos ficam parados. */
    pause(t) {
      if (this.paused) return;
      this._advance(t);
      this.paused = true;
      this.pausedAt = t;
    }

    /** Retoma: todos os prazos são empurrados pelo tempo em que ficou parado. */
    resume(t) {
      if (!this.paused) return 0;
      const ms = Math.max(0, t - this.pausedAt);
      this._shiftTimes(ms);
      this.simTime += ms;
      this.paused = false;
      return ms;
    }

    // ================= consultas =================

    isResult() {
      return RESULT_STATES.includes(this.state);
    }

    chargePower(t) {
      if (this.state !== S.CHARGING) return 0;
      const phase = ((t - this.chargeStart) / this.cfg.castCycleMs) % 1;
      return phase < 0.5 ? phase * 2 : 2 - phase * 2;   // 0 → 1 → 0
    }

    tensionZone(tension) {
      const cfg = this.cfg;
      const v = tension != null ? tension : this.tension;
      if (v < cfg.slackMax) return 'frouxa';
      if (v < cfg.alertMin) return 'segura';
      if (v < cfg.criticalMin) return 'alerta';
      return 'critica';
    }

    /** Fotografia do estado para a tela e o painel de diagnóstico. */
    snapshot(t) {
      const cfg = this.cfg;
      t = t != null ? t : this.simTime;
      if (this.paused) t = this.pausedAt;  // em pausa, a tela mostra os tempos congelados
      const snap = {
        id: this.id,
        label: this.label,
        state: this.state,
        stateLabel: STATE_LABELS[this.state],
        msInState: Math.max(0, Math.round(t - this.stateSince)),
        pressed: this.pressed,
        paused: !!this.paused,
        distance: this.distance,
        castPower: this.castPower,
        chargePower: this.chargePower(t),
        biteInMs: this.state === S.WAITING ? Math.max(0, Math.round(this.biteAt - t))
          : this.state === S.REELING_EMPTY && this.waitRemainingMs != null ? Math.round(this.waitRemainingMs) : null,
        biteWindowMs: cfg.reactionWindowMs,
        biteLeftMs: this.state === S.BITE ? Math.max(0, Math.round(this.biteDeadline - t)) : null,
        tension: this.tension,
        zone: this.state === S.FIGHTING ? this.tensionZone() : null,
        slackMs: Math.round(this.slackMs),
        criticalMs: Math.round(this.criticalMs),
        fish: null,
        lastReactionMs: this.lastReactionMs,
        lastResult: this.lastResult,
        stats: this.stats
      };
      if (this.fish) {
        snap.fish = {
          perfil: this.fish.profile.id,
          nome: this.fish.profile.nome,
          pesoKg: this.fish.weightKg,
          energia: this.fish.energy,
          fase: this.fish.phase,
          puxao: this.fish.pull,
          brigaMs: Math.round(t - this.fightStart)
        };
      }
      return snap;
    }

    // ================= simulação =================

    _advance(t) {
      const gap = t - this.simTime;
      if (gap > MAX_CATCH_UP_MS) {
        // A página ficou parada (troca de app, travada). O tempo parado não conta:
        // todos os prazos são empurrados para frente.
        const skip = gap - MAX_CATCH_UP_MS;
        this._shiftTimes(skip);
        this.simTime += skip;
        this._emit({ tipo: 'pausa', time: t, ms: Math.round(skip) });
      }
      while (this.simTime + SIM_STEP_MS <= t) {
        this.simTime += SIM_STEP_MS;
        this._step(this.simTime, SIM_STEP_MS);
      }
    }

    _step(now, dtMs) {
      const cfg = this.cfg;
      switch (this.state) {
        case S.CASTING:
          if (now >= this.castLandAt) {
            this._setState(S.WAITING, now, 'boia na água');
            this._emit({ tipo: 'boia-na-agua', time: now, distancia: round1(this.distance) });
            this._scheduleBite(now);
            // Dedo que tocou durante o voo e continua apoiado: conta como início de um "segurar".
            this.waitPressAt = this.pressed ? now : null;
          }
          break;

        case S.WAITING:
          while (this.nibbles.length && this.nibbles[0] <= now) {
            this.nibbles.shift();
            this._emit({ tipo: 'beliscada', time: now });
          }
          if (this.pressed && this.waitPressAt != null && now - this.waitPressAt >= cfg.holdThresholdMs) {
            // D4: guarda quanto faltava da espera (e das beliscadas) para retomar depois.
            this.waitRemainingMs = Math.max(0, this.biteAt - now);
            this.nibbleOffsets = this.nibbles.map((n) => n - now);
            this.biteAt = Infinity;
            this.nibbles = [];
            this._setState(S.REELING_EMPTY, now, 'segurar durante a espera');
            this._emit({ tipo: 'recolhimento-inicio', time: now, distancia: round1(this.distance),
              esperaRestanteMs: Math.round(this.waitRemainingMs) });
            this.waitPressAt = null;
          } else if (now >= this.biteAt) {
            this.waitPressAt = null;
            this.biteStart = now;
            this.biteDeadline = now + cfg.reactionWindowMs;
            this.stats.mordidas++;
            this._setState(S.BITE, now, 'peixe mordeu');
            this._emit({ tipo: 'mordida', time: now, janelaMs: cfg.reactionWindowMs, dedoApoiado: this.pressed });
          }
          break;

        case S.REELING_EMPTY:
          this.distance -= cfg.emptyReelSpeed * dtMs / 1000;
          if (this.distance <= 0) {
            this.distance = 0;
            this.stats.recolhimentosVazios++;
            this._emit({ tipo: 'recolhimento-concluido', time: now });
            this._toIdle(now, 'linha recolhida');
          }
          break;

        case S.BITE:
          if (now > this.biteDeadline) this._loseBite(now);
          break;

        case S.FIGHTING:
          this._fightStep(now, dtMs);
          break;

        case S.CAUGHT:
        case S.ESCAPED:
        case S.LINE_BROKEN:
          if (now >= this.resultUntil) this._toIdle(now, 'fim do resultado');
          break;

        default:
          break;
      }
    }

    _fightStep(now, dtMs) {
      const cfg = this.cfg;
      const fish = this.fish;
      const dt = dtMs / 1000;
      const p = fish.profile;

      if (now >= fish.phaseUntil) {
        fish.phase = fish.phase === 'corrida' ? 'descanso' : 'corrida';
        const range = fish.phase === 'corrida' ? p.runMs : p.restMs;
        fish.phaseUntil = now + this.rng.range(range[0], range[1]);
        if (fish.phase === 'corrida') this._emit({ tipo: 'arrancada', time: now });
      }

      const target = (fish.phase === 'corrida' ? p.runPull : p.restPull) * (0.35 + 0.65 * fish.energy) * fish.strength;
      fish.pull += (target - fish.pull) * Math.min(1, dt * 8);   // puxão suavizado
      const pull = fish.pull;

      if (this.pressed) {
        this.tension += (cfg.reelTensionRate + pull * cfg.pullTensionRate) * dt;
        this.distance -= cfg.reelSpeed * Math.max(0, 1 - cfg.pullReelResist * pull) * dt;
      } else {
        this.tension += (-cfg.relaxRate + pull * cfg.pullTensionRate * cfg.slackPullFactor) * dt;
        this.distance += cfg.lineOutSpeed * pull * dt;
      }
      this.tension = clamp(this.tension, 0, 1);
      this.distance = Math.min(this.distance, cfg.maxLineDistance);

      const zone = this.tensionZone();
      fish.energy = Math.max(0, fish.energy - p.tireRate * (zone === 'frouxa' ? cfg.slackTireFactor : 1) * dt);

      if (zone === 'frouxa') this.slackMs += dtMs;
      else this.slackMs = Math.max(0, this.slackMs - dtMs * cfg.riskRecoveryRate);
      if (zone === 'critica') this.criticalMs += dtMs;
      else this.criticalMs = Math.max(0, this.criticalMs - dtMs * cfg.riskRecoveryRate);

      if (zone !== this.lastZone) {
        this._emit({ tipo: 'zona-tensao', time: now, zona: zone, tensao: round2(this.tension) });
        this.lastZone = zone;
      }

      if (this.criticalMs >= cfg.criticalBreakMs) {
        this.stats.linhasRompidas++;
        this._finish(S.LINE_BROKEN, now, { tipo: 'linha-rompida', motivo: 'tensão crítica por ' + Math.round(this.criticalMs) + ' ms' });
      } else if (this.slackMs >= cfg.slackEscapeMs) {
        this.stats.fugas++;
        this._finish(S.ESCAPED, now, { tipo: 'fuga', motivo: 'linha-frouxa' });
      } else if (this.distance <= 0) {
        this.distance = 0;
        this._capture(now);
      }
    }

    // ================= transições =================

    _startCharging(t) {
      this.chargeStart = t;
      this._setState(S.CHARGING, t, 'segurar para arremessar');
    }

    _cancelCast(t, codigo, motivo) {
      this.stats.arremessosCancelados++;
      this._emit({ tipo: 'arremesso-cancelado', time: t, codigo, motivo });
      this._toIdle(t, 'arremesso cancelado');
    }

    _cast(t) {
      const cfg = this.cfg;
      // Força no instante exato da soltura (não no último passo da simulação).
      const phase = ((t - this.chargeStart) / cfg.castCycleMs) % 1;
      const power = phase < 0.5 ? phase * 2 : 2 - phase * 2;
      this.castPower = power;
      this.distance = cfg.castMinDistance + (cfg.castMaxDistance - cfg.castMinDistance) * power;
      this.castLandAt = t + cfg.castFlightBaseMs + cfg.castFlightPerPowerMs * power;
      this.stats.arremessos++;
      this._setState(S.CASTING, t, 'soltou');
      this._emit({ tipo: 'arremesso', time: t, forca: round2(power), distancia: round1(this.distance) });
    }

    _scheduleBite(t) {
      const cfg = this.cfg;
      const wait = this.rng.range(cfg.waitMinMs, cfg.waitMaxMs);
      this.biteAt = t + wait;
      const count = this.rng.int(cfg.nibbleMin, cfg.nibbleMax);
      this.nibbles = [];
      if (wait > 1200) {
        for (let i = 0; i < count; i++) this.nibbles.push(this.rng.range(t + 500, this.biteAt - 400));
        this.nibbles.sort((a, b) => a - b);
      }
      this._emit({ tipo: 'espera', time: t, mordidaEmMs: Math.round(wait), beliscadas: this.nibbles.length });
    }

    /** D4: retoma a espera interrompida pelo recolhimento, com o tempo que faltava. */
    _resumeWait(t) {
      const remaining = this.waitRemainingMs != null ? this.waitRemainingMs : 0;
      this.biteAt = t + remaining;
      this.nibbles = (this.nibbleOffsets || []).filter((o) => o >= 0).map((o) => t + o);
      this.waitRemainingMs = null;
      this.nibbleOffsets = [];
      this._emit({ tipo: 'espera-retomada', time: t, mordidaEmMs: Math.round(remaining), beliscadas: this.nibbles.length });
    }

    _hook(t) {
      const cfg = this.cfg;
      const reaction = t - this.biteStart;
      const profile = this.rng.weighted(cfg.fishProfiles, 'chance');
      const weight = this.rng.range(profile.weightKg[0], profile.weightKg[1]);
      const span = profile.weightKg[1] - profile.weightKg[0];
      const weightNorm = span > 0 ? (weight - profile.weightKg[0]) / span : 0.5;
      this.fish = {
        profile,
        weightKg: Math.round(weight * 100) / 100,
        strength: 0.85 + 0.3 * weightNorm,       // dentro do perfil, o mais pesado puxa um pouco mais
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
      this._setState(S.FIGHTING, t, 'fisgou');
      this._emit({ tipo: 'fisgada', time: t, reacaoMs: Math.round(reaction), janelaMs: cfg.reactionWindowMs,
        perfil: profile.id, pesoKg: this.fish.weightKg });
    }

    _loseBite(t) {
      this.stats.mordidasPerdidas++;
      this._finish(S.ESCAPED, t, { tipo: 'mordida-perdida', motivo: 'sem-reacao',
        janelaMs: this.cfg.reactionWindowMs });
    }

    _lateTouch(t) {
      this.stats.toquesAtrasados++;
      this._emit({ tipo: 'toque-atrasado', time: t,
        atrasoMs: Math.round(t - this.biteDeadline), janelaMs: this.cfg.reactionWindowMs });
    }

    _capture(t) {
      const fish = this.fish;
      const record = {
        jogador: this.id,
        nome: this.label,
        perfil: fish.profile.id,
        peixe: fish.profile.nome,
        pesoKg: fish.weightKg,
        brigaMs: Math.round(t - this.fightStart),
        reacaoMs: this.lastReactionMs,
        time: t
      };
      this.captures.push(record);
      this.stats.capturas++;
      this.stats.pesoTotalKg = Math.round((this.stats.pesoTotalKg + fish.weightKg) * 100) / 100;
      this.stats.maiorPesoKg = Math.max(this.stats.maiorPesoKg, fish.weightKg);
      this._finish(S.CAUGHT, t, Object.assign({ tipo: 'captura' }, record));
    }

    _finish(state, t, info) {
      const cfg = this.cfg;
      this.lastResult = Object.assign({ estado: state }, info);
      if (this.fish) {
        this.lastResult.peixe = this.lastResult.peixe || this.fish.profile.nome;
        this.lastResult.pesoKg = this.fish.weightKg;
      }
      this.resultUntil = t + (state === S.CAUGHT ? cfg.resultCaughtMs : cfg.resultLostMs);
      this._setState(state, t, info.tipo);
      this._emit(Object.assign({ time: t }, info, { tipo: info.tipo }));
    }

    _toIdle(t, motivo) {
      this._clearRound();
      this._setState(S.IDLE, t, motivo);
    }

    _clearRound() {
      this.distance = 0;
      this.castPower = 0;
      this.chargeStart = 0;
      this.castLandAt = 0;
      this.biteAt = Infinity;
      this.nibbles = [];
      this.waitRemainingMs = null;
      this.nibbleOffsets = [];
      this.waitPressAt = null;
      this.biteStart = 0;
      this.biteDeadline = 0;
      this.fish = null;
      this.tension = 0;
      this.slackMs = 0;
      this.criticalMs = 0;
      this.lastZone = null;
      this.fightStart = 0;
      this.resultUntil = 0;
    }

    _shiftTimes(ms) {
      const fields = ['stateSince', 'chargeStart', 'castLandAt', 'biteAt', 'biteStart', 'biteDeadline',
        'fightStart', 'resultUntil'];
      for (const f of fields) this[f] += ms;
      if (this.waitPressAt != null) this.waitPressAt += ms;
      this.nibbles = this.nibbles.map((n) => n + ms);
      if (this.fish) this.fish.phaseUntil += ms;
    }

    _setState(state, t, motivo) {
      const from = this.state;
      this.state = state;
      this.stateSince = t;
      this._emit({ tipo: 'estado', time: t, de: from, para: state, motivo: motivo || null });
    }

    _emit(entry) {
      entry.jogador = this.id;
      this.emitFn(entry);
    }
  }

  function clamp(v, min, max) { return v < min ? min : v > max ? max : v; }
  function round1(v) { return Math.round(v * 10) / 10; }
  function round2(v) { return Math.round(v * 100) / 100; }

  FishingPlayer.STATES = S;
  FishingPlayer.STATE_LABELS = STATE_LABELS;
  FishingPlayer.SIM_STEP_MS = SIM_STEP_MS;
  FishingPlayer.MAX_CATCH_UP_MS = MAX_CATCH_UP_MS;

  root.HF = root.HF || {};
  root.HF.FishingPlayer = FishingPlayer;
  if (typeof module !== 'undefined' && module.exports) module.exports = FishingPlayer;
})(typeof window !== 'undefined' ? window : globalThis);
