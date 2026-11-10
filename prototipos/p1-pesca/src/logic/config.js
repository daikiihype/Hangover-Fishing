/*
 * Hangover Fishing — Protótipo P1 (pesca)
 * config.js: TODOS os parâmetros de balanceamento em um só lugar.
 *
 * Valores iniciais [PROTÓTIPO] — servem para começar os testes em celular,
 * não são decisões de design. O registro comentado está em BALANCEAMENTO.md.
 *
 * Unidades: tempos em milissegundos (ms), distâncias em metros "de jogo" (m),
 * tensão de 0 (linha solta) a 1 (máxima), taxas "por segundo" (/s).
 */
(function (root) {
  'use strict';

  const DEFAULT_CONFIG = {
    // ---------- entrada ----------
    holdThresholdMs: 200,        // toque × segurar (mesmo limiar do P0)

    // ---------- FASE A — arremesso ----------
    castMinChargeMs: 200,        // soltar antes disso cancela o arremesso (evita arremesso acidental com um toque)
    castCycleMs: 1600,           // ciclo completo do medidor de força: 0 → 100% → 0 (força E timing contam)
    castMinDistance: 6,          // distância com força 0%
    castMaxDistance: 30,         // distância com força 100%
    castFlightBaseMs: 450,       // voo da boia: base...
    castFlightPerPowerMs: 450,   // ...+ este valor × força

    // ---------- FASE B — espera ----------
    waitMinMs: 2500,             // tempo até a mordida: sorteado entre mín. e máx.
    waitMaxMs: 8000,
    nibbleMin: 0,                // "beliscadas" falsas antes da mordida: só visuais, sem som (D3); tocar nelas é ignorado
    nibbleMax: 2,
    emptyReelSpeed: 14,          // m/s ao recolher a linha vazia (30 m ≈ 2,1 s)

    // ---------- FASE C — mordida e fisgada ----------
    reactionWindowMs: 1000,      // janela para um NOVO toque depois do sinal de mordida

    // ---------- FASE D — luta / tensão ----------
    initialTension: 0.4,         // tensão no momento da fisgada
    slackMax: 0.2,               // abaixo disto: zona FROUXA
    alertMin: 0.65,              // a partir disto: zona de ALERTA
    criticalMin: 0.85,           // a partir disto: zona CRÍTICA
    reelTensionRate: 0.18,       // /s: subida da tensão só por segurar
    pullTensionRate: 0.5,        // /s por unidade de puxão do peixe (segurando)
    slackPullFactor: 0.7,        // fração do puxão que ainda pesa na tensão quando o jogador solta
    relaxRate: 0.4,              // /s: queda da tensão ao soltar
    reelSpeed: 3,                // m/s recolhidos ao segurar, sem puxão
    pullReelResist: 0.6,         // quanto o puxão reduz o recolhimento (0 = nada, 1 = trava com puxão máximo)
    lineOutSpeed: 2,             // m/s que o peixe leva de linha, por unidade de puxão, quando o jogador solta
    criticalBreakMs: 1000,       // tempo acumulado na zona crítica para a linha arrebentar
    slackEscapeMs: 2000,         // tempo acumulado na zona frouxa para o peixe escapar
    riskRecoveryRate: 0.5,       // fora da zona de risco, o tempo acumulado "descansa" nesta velocidade (0,5 = metade da velocidade do acúmulo)
    slackTireFactor: 0.25,       // o peixe cansa mais devagar com a linha frouxa
    maxLineDistance: 36,         // o peixe não leva linha além disto

    // ---------- FASE E — resultado ----------
    resultCaughtMs: 2200,        // duração da tela de captura (depois volta a "pronto")
    resultLostMs: 1600,          // duração de "escapou" / "linha arrebentou"
    resultSkipAfterMs: 600,      // depois disto, um novo toque pula o resultado e já começa a carregar o arremesso

    // ---------- peixes (perfis provisórios de jogabilidade, NÃO espécies reais) ----------
    fishProfiles: [
      {
        id: 'rapido', nome: 'Peixe rápido', descricao: 'rápido e curto: puxões curtos e frequentes',
        chance: 45, weightKg: [0.3, 1.2],
        restPull: 0.2, runPull: 0.75, runMs: [500, 1000], restMs: [700, 1500], tireRate: 0.12
      },
      {
        id: 'pesado', nome: 'Peixe pesado', descricao: 'lento e pesado: puxões longos e fortes',
        chance: 25, weightKg: [2, 6],
        restPull: 0.4, runPull: 0.85, runMs: [1500, 2800], restMs: [1500, 2500], tireRate: 0.08
      },
      {
        id: 'arisco', nome: 'Peixe arisco', descricao: 'imprevisível: alterna pausas e arrancadas sem ritmo',
        chance: 30, weightKg: [0.8, 3],
        restPull: 0.1, runPull: 1.0, runMs: [300, 1600], restMs: [400, 2200], tireRate: 0.09
      }
    ]
  };

  /** Cópia profunda da configuração padrão com sobrescritas opcionais. */
  function createConfig(overrides) {
    const cfg = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    if (overrides) {
      for (const key of Object.keys(overrides)) cfg[key] = JSON.parse(JSON.stringify(overrides[key]));
    }
    return cfg;
  }

  /** Lista de problemas (vazia = configuração válida). */
  function validateConfig(cfg) {
    const problems = [];
    const positive = ['castCycleMs', 'castFlightBaseMs', 'reactionWindowMs', 'criticalBreakMs', 'slackEscapeMs',
      'reelSpeed', 'emptyReelSpeed', 'relaxRate', 'reelTensionRate'];
    for (const key of positive) if (!(cfg[key] > 0)) problems.push(key + ' deve ser maior que zero');
    if (cfg.waitMinMs < 0 || cfg.waitMaxMs < cfg.waitMinMs) problems.push('waitMinMs/waitMaxMs inválidos');
    if (cfg.castMaxDistance < cfg.castMinDistance) problems.push('castMaxDistance < castMinDistance');
    if (!(cfg.slackMax < cfg.alertMin && cfg.alertMin < cfg.criticalMin && cfg.criticalMin <= 1)) {
      problems.push('zonas de tensão fora de ordem (slackMax < alertMin < criticalMin ≤ 1)');
    }
    if (cfg.initialTension <= cfg.slackMax || cfg.initialTension >= cfg.alertMin) {
      problems.push('initialTension deveria começar na zona segura');
    }
    if (cfg.nibbleMax < cfg.nibbleMin) problems.push('nibbleMax < nibbleMin');
    if (!cfg.fishProfiles || cfg.fishProfiles.length === 0) problems.push('nenhum perfil de peixe');
    return problems;
  }

  root.HF = root.HF || {};
  root.HF.DEFAULT_CONFIG = DEFAULT_CONFIG;
  root.HF.createConfig = createConfig;
  root.HF.validateConfig = validateConfig;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DEFAULT_CONFIG, createConfig, validateConfig };
  }
})(typeof window !== 'undefined' ? window : globalThis);
