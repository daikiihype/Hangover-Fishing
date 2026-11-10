/*
 * Simulação de balanceamento do P1 (não é teste de aprovação).
 * Executar a partir da pasta do protótipo:   node tests/simulacao-balanceamento.js
 *
 * Simula 80 brigas por perfil de peixe com "jogadores" virtuais de estilos
 * diferentes e mostra a taxa de captura, as perdas (R = linha rompida,
 * F = fuga) e a duração mediana da briga. Arremesso sempre a 30 m.
 *
 * Serve para comparar ajustes de config.js antes de testar no celular.
 * Jogadores virtuais NÃO substituem pessoas: eles leem a tensão exata.
 */
'use strict';
const path = require('path');
const SRC = path.join(__dirname, '..', 'src');
const { createConfig } = require(path.join(SRC, 'logic', 'config.js'));
const FishingPlayer = require(path.join(SRC, 'logic', 'FishingPlayer.js'));
const Random = require(path.join(SRC, 'logic', 'Random.js'));

const ESTILOS = [
  // [nome, solta acima de, segura abaixo de, atraso médio de reação (ms)]
  ['atento', 0.72, 0.45, 200],
  ['médio', 0.82, 0.35, 300],
  ['desleixado', 0.9, 0.3, 400],
  ['muito desleixado', 0.97, 0.25, 500],
  ['reação lenta', 0.85, 0.35, 900],
  ['sempre segura', 2, 2, 0],
  ['nunca segura', -1, -1, 0]
];

function briga(perfilId, estilo, seed) {
  const [, alto, baixo, atraso] = estilo;
  const cfg = createConfig({ waitMinMs: 1000, waitMaxMs: 1000, nibbleMax: 0 });
  cfg.fishProfiles = cfg.fishProfiles.filter((p) => p.id === perfilId);
  const p = new FishingPlayer({ id: 'P1', label: 'sim', config: cfg, rng: new Random(seed), time: 0 });
  let t = 0;
  p.press(t); t = 800; p.release(t, {});                       // força 100% → 30 m
  while (p.state !== 'BITE') { t += 10; p.update(t); }
  t += 250; p.press(t); t += 60; p.release(t, {});              // fisgada com 250 ms de reação
  const jitter = new Random(seed * 7 + 3);
  let segurando = false, proxima = t;
  const inicio = t;
  while (p.state === 'FIGHTING') {
    t += 10; p.update(t);
    if (t < proxima) continue;
    const quer = segurando ? p.tension < alto : p.tension < baixo;
    if (quer !== segurando) {
      segurando = quer;
      if (segurando) p.press(t); else p.release(t, {});
      proxima = t + atraso * (0.5 + jitter.next());
    }
  }
  return { estado: p.state, ms: t - inicio };
}

const perfis = createConfig().fishProfiles.map((p) => p.id);
console.log('Estilo'.padEnd(18) + perfis.map((p) => p.padEnd(26)).join(''));
for (const estilo of ESTILOS) {
  let linha = estilo[0].padEnd(18);
  for (const perfil of perfis) {
    const cont = {}; const tempos = [];
    for (let seed = 1; seed <= 80; seed++) {
      const r = briga(perfil, estilo, seed);
      cont[r.estado] = (cont[r.estado] || 0) + 1;
      if (r.estado === 'CAUGHT') tempos.push(r.ms);
    }
    tempos.sort((a, b) => a - b);
    const med = tempos.length ? (tempos[tempos.length >> 1] / 1000).toFixed(1) + ' s' : '—';
    linha += (String(Math.round(100 * (cont.CAUGHT || 0) / 80)).padStart(3) + '% R' + (cont.LINE_BROKEN || 0) +
      ' F' + (cont.ESCAPED || 0) + ' ' + med).padEnd(26);
  }
  console.log(linha);
}
