/*
 * Simulação de balanceamento da versão jogável (estudo, não é teste de aprovação).
 *   node jogo/tests/simulacao-regioes-iscas.js [sessoes]
 *
 * Sessões de 10 min com a lógica REAL (P1 + PescadorRegional) para cada região × isca × estilo
 * de jogador. Mede peixes, kg, maior peixe, perdas, tempo esperando, duração das brigas e
 * a variedade de espécies. Jogadores virtuais leem a tensão exata: subestimam as perdas de
 * pessoas reais.
 */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const { createConfig } = require(path.join(ROOT, 'prototipos', 'p1-pesca', 'src', 'logic', 'config.js'));
const Random = require(path.join(ROOT, 'prototipos', 'p1-pesca', 'src', 'logic', 'Random.js'));
const PescadorRegional = require(path.join(__dirname, '..', 'src', 'logica', 'PescadorRegional.js'));
const D = require(path.join(__dirname, '..', 'src', 'logica', 'DadosPesca.js'));

const SESSOES = Number(process.argv[2]) || 20;
const SESSION_MS = 10 * 60 * 1000;
const HOLD = { margem: 1467, aberta: 450, fundo: 700 };       // centro de cada região (força do medidor)
const ESTILOS = [
  // nome, solta acima de, segura abaixo de, atraso de controle, reação à mordida, espera para pular o cartão
  ['atento', 0.72, 0.45, 200, 300, 900],
  ['médio', 0.82, 0.35, 300, 450, 1400],
  ['descuidado', 0.95, 0.27, 450, 600, 2200]
];

function sessao(regiao, isca, estilo, seed) {
  const [, hi, lo, lag, react, skip] = estilo;
  const cfg = createConfig();
  const p = new PescadorRegional({ id: 'P1', label: 'sim', config: cfg, rng: new Random(seed), time: 0, regioes: true, isca });
  const jit = new Random(seed * 31 + 7);
  let t = 0;
  const o = { peixes: 0, kg: 0, maior: 0, grandes: 0, perdas: 0, objetos: 0, esperaMs: 0, brigaMs: 0, brigas: 0, especies: {} };
  const step = (ms) => { const end = t + ms; while (t < end) { t += 10; p.update(t); } };
  while (t < SESSION_MS) {
    if (p.state === 'IDLE') p.press(t);
    step(HOLD[regiao] + (jit.next() - 0.5) * 60);
    p.release(t, {});
    if (p.state !== 'CASTING') { step(100); continue; }
    while (p.state === 'CASTING') step(10);
    const w0 = t;
    while (p.state === 'WAITING') step(10);
    o.esperaMs += t - w0;
    step(react * (0.6 + 0.8 * jit.next()));
    if (p.state === 'BITE') p.press(t);
    if (p.state === 'FIGHTING') {
      const f0 = t; let segurando = true, prox = t;
      while (p.state === 'FIGHTING') {
        step(10);
        if (t < prox) continue;
        const quer = segurando ? p.tension < hi : p.tension < lo;
        if (quer !== segurando) { segurando = quer; if (segurando) p.press(t); else p.release(t, {}); prox = t + lag * (0.5 + jit.next()); }
      }
      o.brigaMs += t - f0; o.brigas++;
    }
    if (p.pressed) p.release(t, {});
    const r = p.lastResult;
    if (p.state === 'CAUGHT' && r.objeto) o.objetos++;
    else if (p.state === 'CAUGHT') { o.peixes++; o.kg += r.pesoKg; o.maior = Math.max(o.maior, r.pesoKg); if (r.pesoKg >= 3) o.grandes++; o.especies[r.perfil] = (o.especies[r.perfil] || 0) + 1; }
    else o.perdas++;
    const s0 = t;
    while (p.isResult() && t - s0 < skip) step(10);
    p.press(t);
  }
  return o;
}

const linhas = [];
console.log('Sessões de 10 min · ' + SESSOES + ' por célula · arremesso no centro da região');
console.log('estilo      região   isca         peixes   kg   maior  ≥3kg perdas obj  espera% briga(s) espécies');
for (const est of ESTILOS) {
  for (const reg of D.ORDEM_REGIOES) {
    for (const isca of D.ISCAS.map((i) => i.id)) {
      const a = { peixes: 0, kg: 0, maior: 0, grandes: 0, perdas: 0, objetos: 0, esperaMs: 0, brigaMs: 0, brigas: 0, especies: {} };
      for (let s = 1; s <= SESSOES; s++) {
        const o = sessao(reg, isca, est, s * 101 + reg.length);
        for (const k of ['peixes', 'kg', 'maior', 'grandes', 'perdas', 'objetos', 'esperaMs', 'brigaMs', 'brigas']) a[k] += o[k];
        for (const [e, n] of Object.entries(o.especies)) a.especies[e] = (a.especies[e] || 0) + n;
      }
      const m = (v) => v / SESSOES;
      const esp = Object.entries(a.especies).sort((x, y) => y[1] - x[1]).map(([e, n]) => e.slice(0, 4) + ' ' + Math.round(100 * n / a.peixes) + '%').join(' ');
      const l = { est: est[0], reg, isca, peixes: m(a.peixes), kg: m(a.kg), maior: m(a.maior), grandes: m(a.grandes), perdas: m(a.perdas), objetos: m(a.objetos),
        espera: 100 * a.esperaMs / (SESSOES * SESSION_MS), briga: a.brigaMs / Math.max(1, a.brigas) / 1000, esp };
      linhas.push(l);
      console.log(est[0].padEnd(12) + reg.padEnd(9) + isca.padEnd(12) + l.peixes.toFixed(1).padStart(6) + l.kg.toFixed(1).padStart(6) + l.maior.toFixed(2).padStart(7) +
        l.grandes.toFixed(1).padStart(6) + l.perdas.toFixed(1).padStart(6) + l.objetos.toFixed(1).padStart(5) + l.espera.toFixed(0).padStart(8) + '%' + l.briga.toFixed(0).padStart(8) + '  ' + esp);
    }
  }
}

// ---- quem vence o quê (princípio central: nenhuma escolha é a melhor em tudo) ----
console.log('\nMelhor escolha por objetivo (cada estilo):');
for (const est of ESTILOS.map((e) => e[0])) {
  const ls = linhas.filter((l) => l.est === est);
  const melhor = (k) => { const b = ls.slice().sort((x, y) => y[k] - x[k])[0]; return b.reg + '+' + b.isca + ' (' + b[k].toFixed(1) + ')'; };
  console.log('  ' + est.padEnd(11) + 'mais peixes: ' + melhor('peixes') + ' · mais kg: ' + melhor('kg') + ' · maior peixe: ' + melhor('maior') + ' · menos perdas: ' +
    (() => { const b = ls.slice().sort((x, y) => x.perdas - y.perdas || y.kg - x.kg)[0]; return b.reg + '+' + b.isca + ' (' + b.perdas.toFixed(1) + ')'; })());
}
module.exports = linhas;
