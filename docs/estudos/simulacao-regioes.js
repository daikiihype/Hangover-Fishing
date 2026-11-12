// ESTUDO das regiões de pesca (docs/PLANO_REGIOES_DE_PESCA.md). Não é parte do jogo nem teste de aprovação.
// Sessões simuladas de 10 min por região, com a lógica REAL do P1 (só leitura; nada do P1 é alterado).
// Cada região é só uma configuração: espera, chances de perfil, faixa de peso e força/cansaço do peixe.
// Uso, na pasta do projeto:  node docs/estudos/simulacao-regioes.js [recomendado|atual|proposto|calibrado|calibrado2|profundaSemForca|profundaEsperaCurta|profundaCansaNormal]
// Jogadores virtuais leem a tensão exata: subestimam as perdas de pessoas reais.
'use strict';
const path = require('path');
const SRC = path.join(__dirname, '..', '..', 'prototipos', 'p1-pesca', 'src', 'logic');
const { createConfig } = require(path.join(SRC, 'config.js'));
const FishingPlayer = require(path.join(SRC, 'FishingPlayer.js'));
const Random = require(path.join(SRC, 'Random.js'));

const MODEL = process.argv[2] || 'recomendado';
const SESSION_MS = 10 * 60 * 1000;
const SEEDS = 30;

// hold = tempo segurando para cair no centro da região (força 0→1 em 800 ms, 1→0 até 1600 ms)
const MODELS = {
  atual: {   // o P1 de hoje: as três faixas de distância com as MESMAS regras
    margem: { hold: 1467, wait: [2500, 8000], chances: { rapido: 45, pesado: 25, arisco: 30 }, band: [0, 1] },
    aberta: { hold: 400, wait: [2500, 8000], chances: { rapido: 45, pesado: 25, arisco: 30 }, band: [0, 1] },
    profunda: { hold: 667, wait: [2500, 8000], chances: { rapido: 45, pesado: 25, arisco: 30 }, band: [0, 1] }
  },
  proposto: {
    margem: { hold: 1467, wait: [2000, 5000], chances: { rapido: 65, pesado: 10, arisco: 25 }, band: [0, 0.6] },
    aberta: { hold: 400, wait: [2500, 8000], chances: { rapido: 45, pesado: 25, arisco: 30 }, band: [0, 1] },
    profunda: { hold: 667, wait: [4000, 10000], chances: { rapido: 15, pesado: 55, arisco: 30 }, band: [0.4, 1] }
  },
  // calibrado: limites 15 / 24 m (centros 10 · 19,5 · 27 m)
  calibrado: {
    margem: { hold: 1467, wait: [2000, 5000], chances: { rapido: 60, pesado: 10, arisco: 30 }, band: [0, 0.6] },
    aberta: { hold: 450, wait: [2500, 8000], chances: { rapido: 40, pesado: 30, arisco: 30 }, band: [0, 1] },
    profunda: { hold: 700, wait: [5000, 12000], chances: { rapido: 15, pesado: 55, arisco: 30 }, band: [0.4, 1.25], pull: 1.1, tire: 0.9 }
  },
  calibrado2: {
    margem: { hold: 1467, wait: [2000, 5000], chances: { rapido: 60, pesado: 10, arisco: 30 }, band: [0, 0.6] },
    aberta: { hold: 450, wait: [2500, 8000], chances: { rapido: 35, pesado: 25, arisco: 40 }, band: [0, 1] },
    profunda: { hold: 700, wait: [6000, 12000], chances: { rapido: 10, pesado: 60, arisco: 30 }, band: [0.4, 1.2], pull: 1.25, tire: 0.85 }
  },
  // RECOMENDADO no plano: águas abertas = regras de hoje (o jogo validado nas sessões de 30 min)
  recomendado: {
    margem: { hold: 1467, wait: [2000, 5000], chances: { rapido: 60, pesado: 10, arisco: 30 }, band: [0, 0.6] },
    aberta: { hold: 450, wait: [2500, 8000], chances: { rapido: 45, pesado: 25, arisco: 30 }, band: [0, 1] },
    profunda: { hold: 700, wait: [6000, 12000], chances: { rapido: 10, pesado: 60, arisco: 30 }, band: [0.4, 1.2], pull: 1.25, tire: 0.85 }
  },
  // variações para medir sensibilidade
  profundaCansaNormal: {   // sensibilidade: fundo mais forte, mas cansando no ritmo normal (briga mais curta)
    profunda: { hold: 700, wait: [6000, 12000], chances: { rapido: 10, pesado: 60, arisco: 30 }, band: [0.4, 1.2], pull: 1.25, tire: 1 }
  },
  profundaSemForca: {   // sensibilidade: fundo sem peixe mais forte
    profunda: { hold: 700, wait: [6000, 12000], chances: { rapido: 10, pesado: 60, arisco: 30 }, band: [0.4, 1.2] }
  },
  profundaEsperaCurta: {   // sensibilidade: fundo com a espera de hoje
    profunda: { hold: 700, wait: [2500, 8000], chances: { rapido: 10, pesado: 60, arisco: 30 }, band: [0.4, 1.2], pull: 1.25, tire: 0.85 }
  }
};

const STYLES = [
  // nome, solta acima de, segura abaixo de, atraso de controle (ms), reação à mordida (ms), espera para pular o cartão (ms)
  ['atento', 0.72, 0.45, 200, 300, 900],
  ['médio', 0.82, 0.35, 300, 450, 1400],
  ['desleixado', 0.9, 0.3, 400, 650, 2200],
  ['reação lenta', 0.85, 0.35, 900, 850, 2200],
  ['muito desleixado', 0.97, 0.25, 500, 600, 2200]
];

function regionConfig(r) {
  const cfg = createConfig({ waitMinMs: r.wait[0], waitMaxMs: r.wait[1] });
  cfg.fishProfiles = cfg.fishProfiles.map((p) => {
    const span = p.weightKg[1] - p.weightKg[0];
    const f = r.pull || 1, tire = r.tire || 1;
    return Object.assign({}, p, { chance: r.chances[p.id], restPull: p.restPull * f, runPull: p.runPull * f, tireRate: p.tireRate * tire,
      weightKg: [round2(p.weightKg[0] + span * r.band[0]), round2(p.weightKg[0] + span * r.band[1])] });
  });
  return cfg;
}
function round2(v) { return Math.round(v * 100) / 100; }

function session(region, style, seed) {
  const [, hi, lo, lag, react, skip] = style;
  const cfg = regionConfig(region);
  const p = new FishingPlayer({ id: 'P1', label: 'sim', config: cfg, rng: new Random(seed), time: 0 });
  const jit = new Random(seed * 31 + 7);
  let t = 0;
  const out = { caught: 0, kg: 0, max: 0, big: 0, broken: 0, escaped: 0, missed: 0, waitMs: 0, fightMs: 0, dist: 0, casts: 0 };
  const step = (ms) => { const end = t + ms; while (t < end) { t += 10; p.update(t); } };
  while (t < SESSION_MS) {
    if (p.state === 'IDLE') p.press(t);
    // carga (o toque de pular o cartão já pode ter começado a carga)
    step(region.hold + (jit.next() - 0.5) * 60);
    p.release(t, {});
    if (p.state !== 'CASTING') { step(100); continue; }
    out.casts++; out.dist += p.distance;
    while (p.state === 'CASTING') step(10);
    const w0 = t;
    while (p.state === 'WAITING') step(10);
    out.waitMs += t - w0;
    const r = react * (0.6 + 0.8 * jit.next());
    step(r);
    if (p.state === 'BITE') { p.press(t); }
    if (p.state === 'FIGHTING') {
      const f0 = t; let holding = true, next = t;
      while (p.state === 'FIGHTING') {
        step(10);
        if (t < next) continue;
        const want = holding ? p.tension < hi : p.tension < lo;
        if (want !== holding) { holding = want; if (holding) p.press(t); else p.release(t, {}); next = t + lag * (0.5 + jit.next()); }
      }
      out.fightMs += t - f0;
      if (p.pressed) p.release(t, {});
    } else if (p.pressed) p.release(t, {});
    const res = p.state, last = p.lastResult;
    if (res === 'CAUGHT') { out.caught++; out.kg += last.pesoKg; out.max = Math.max(out.max, last.pesoKg); if (last.pesoKg >= 3) out.big++; }
    else if (res === 'LINE_BROKEN') out.broken++;
    else if (res === 'ESCAPED' && last.motivo === 'sem-reacao') out.missed++;
    else if (res === 'ESCAPED') out.escaped++;
    // cartão: pula depois de `skip` ms (o toque já começa a carga), ou espera o fim
    const s0 = t;
    while (p.isResult() && t - s0 < skip) step(10);
    if (p.isResult()) p.press(t); else if (p.state === 'IDLE') p.press(t);
  }
  return out;
}

const base = MODEL === 'atual' || MODEL === 'proposto' ? MODELS.proposto : MODEL === 'calibrado' ? MODELS.calibrado : MODEL === 'calibrado2' ? MODELS.calibrado2 : MODELS.recomendado;
const merged = Object.assign({}, base, MODELS[MODEL] || {});
const names = ['margem', 'aberta', 'profunda'];
console.log('Modelo: ' + MODEL + ' · ' + SEEDS + ' sessões de 10 min por célula · arremesso no centro da região');
console.log('estilo'.padEnd(14) + 'região'.padEnd(10) + 'dist  peixes/10min  kg/10min  maior(méd)  ≥3kg/10min  perdas(R/F/M)  espera%  briga%');
for (const style of STYLES) {
  for (const n of names) {
    const agg = { caught: 0, kg: 0, max: 0, big: 0, broken: 0, escaped: 0, missed: 0, waitMs: 0, fightMs: 0, dist: 0, casts: 0 };
    for (let s = 1; s <= SEEDS; s++) { const o = session(merged[n], style, s * 101); for (const k of Object.keys(agg)) agg[k] += o[k]; }
    const per = (v) => (v / SEEDS).toFixed(1);
    console.log(style[0].padEnd(14) + n.padEnd(10) + (agg.dist / agg.casts).toFixed(0).padStart(3) + ' m ' +
      per(agg.caught).padStart(10) + per(agg.kg).padStart(12) + (agg.max / SEEDS).toFixed(2).padStart(10) + per(agg.big).padStart(11) +
      ('   ' + per(agg.broken) + '/' + per(agg.escaped) + '/' + per(agg.missed)).padEnd(16) +
      String(Math.round(100 * agg.waitMs / (SEEDS * SESSION_MS))).padStart(5) + '%' + String(Math.round(100 * agg.fightMs / (SEEDS * SESSION_MS))).padStart(7) + '%' + ((agg.fightMs / 1000) / Math.max(1, agg.caught + agg.broken + agg.escaped)).toFixed(0).padStart(6) + ' s/briga');
  }
}
