/*
 * Testes dos pontos de interesse (sem navegador):  node jogo/tests/pontos.test.js
 * Lógica real do P1 (só leitura) + SessaoJogo/PescadorRegional/PontosDeInteresse.
 */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const P1 = path.join(ROOT, 'prototipos', 'p1-pesca', 'src');
const { createConfig } = require(path.join(P1, 'logic', 'config.js'));
const Random = require(path.join(P1, 'logic', 'Random.js'));
const L = path.join(__dirname, '..', 'src', 'logica');
const Dados = require(path.join(L, 'DadosPesca.js'));
const PontosDeInteresse = require(path.join(L, 'PontosDeInteresse.js'));
const SessaoJogo = require(path.join(L, 'SessaoJogo.js'));

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ✓ ' + name); } catch (e) { failed++; console.log('  ✗ ' + name + '\n      ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join('\n      ') : e)); }
}
function ok(c, msg) { if (!c) throw new Error(msg || 'falhou'); }
const STEP = 10;

function sessao(o) {
  o = o || {};
  const ctx = { now: 0 };
  ctx.s = new SessaoJogo({ config: createConfig(), seed: o.seed != null ? o.seed : 5, now: () => ctx.now,
    jogo: { modo: o.modo || 2, personagens: { P1: 'alemao', P2: 'ale' }, iscas: o.iscas || { P1: 'minhoca', P2: 'minhoca' }, regioes: o.regioes !== false } });
  ctx.avancar = (ms, cb) => { for (let k = 0; k < ms; k += STEP) { ctx.now += STEP; ctx.s.update(ctx.now); if (cb) cb(); } };
  return ctx;
}
/**
 * Quanto segurar para a boia ir à distância d: o medidor sobe 0 → 100 % em 800 ms e volta.
 * Toques com menos de 200 ms são cancelados (P1), então perto da margem o jogador segura
 * até o medidor VOLTAR (mesma força na descida).
 */
function tempoPara(d) {
  const h = Math.max(0, Math.round(((d - 6) / 24) * 800 / STEP) * STEP);
  return h < 210 ? 1600 - h : h;
}
function arremessar(ctx, id, d) {
  const p = ctx.s.players[id];
  p.press(ctx.now); ctx.avancar(tempoPara(d)); p.release(ctx.now, {});
  return p;
}

/** Robô simples e determinístico para as duas metades. alvo(id) → distância desejada. */
function robo(ctx, alvo) {
  const b = { P1: { prox: 300, acao: 'idle' }, P2: { prox: 600, acao: 'idle' } };
  return () => {
    for (const id of ctx.s.ids) {
      const p = ctx.s.players[id], r = b[id], now = ctx.now;
      if (p.state === 'FIGHTING' && r.acao === 'briga') { if (p.pressed && p.tension > 0.8) p.release(now, {}); else if (!p.pressed && p.tension < 0.38) p.press(now); continue; }
      if (now < r.prox) continue;
      switch (p.state) {
        case 'IDLE': p.press(now); r.acao = 'carregando'; r.prox = now + tempoPara(alvo(id)); break;
        case 'CHARGING': p.release(now, {}); r.acao = 'idle'; r.prox = now + 200; break;
        case 'BITE': if (r.acao !== 'reagindo') { r.acao = 'reagindo'; r.prox = now + 320; } else { p.press(now); r.acao = 'briga'; } break;
        case 'CAUGHT': case 'ESCAPED': case 'LINE_BROKEN': if (p.pressed) p.release(now, {}); r.acao = 'idle'; r.prox = now + 1500; break;
        default: break;
      }
    }
  };
}

console.log('Pontos de interesse (espelhados, sorteio próprio, efeito moderado)');

test('Espelhado: o mesmo ponto (tipo, distância, instante) vale para os dois jogadores', () => {
  const ctx = sessao({ seed: 3 });
  ctx.avancar(41000);
  const a = ctx.s.pontos.ativo();
  ok(a, 'nenhum ponto depois de 41 s');
  const p1 = arremessar(ctx, 'P1', a.distancia), p2 = arremessar(ctx, 'P2', a.distancia);
  ok(p1.pontoNaAgua && p1.pontoNaAgua.tipo === a.tipo, 'P1 não acertou o ponto');
  ok(p2.pontoNaAgua && p2.pontoNaAgua.tipo === a.tipo, 'P2 não acertou o ponto');
  const ac = ctx.s.pontos.acertos;
  ok(ac.length === 2 && ac[0].ponto === ac[1].ponto, 'acertos registrados no mesmo ponto');
  // fora da tolerância (2 m) não vale (sessão nova, mesma semente: o mesmo ponto)
  const ctx2 = sessao({ seed: 3 });
  ctx2.avancar(41000);
  const p3 = arremessar(ctx2, 'P1', a.distancia + 3.2 > 29 ? a.distancia - 3.2 : a.distancia + 3.2);
  ok(p3.state === 'CASTING' || p3.state === 'WAITING', 'não arremessou: ' + p3.state);
  ok(!p3.pontoNaAgua, 'acertou fora da tolerância');
});

test('Regiões desligadas: nenhum ponto aparece e nenhum arremesso recebe efeito (jogo do P1)', () => {
  const ctx = sessao({ seed: 9, regioes: false });
  const bot = robo(ctx, () => 18);
  ctx.avancar(5 * 60000, bot);
  ok(ctx.s.pontos.historico.length === 0, 'apareceram pontos com as regiões desligadas');
  ok(!ctx.s.log.some((e) => /^ponto-/.test(e.tipo)), 'eventos de ponto no registro');
  ok(ctx.s.players.P1.pontoNaAgua === null, 'efeito aplicado');
});

test('Sorteio próprio: os pontos não mudam a sequência de sorteios da pesca (mesmos eventos de pesca)', () => {
  const a = sessao({ seed: 21 }), b = sessao({ seed: 21 });
  a.s.pontos.cfg.toleranciaM = -1;                        // pontos aparecem, mas ninguém acerta
  b.s.pontos.proximo = Infinity;                          // nenhum ponto aparece
  const alvos = [9, 16, 20, 26], i = { P1: 0, P2: 1 };
  const alvo = (id) => alvos[(i[id]++) % alvos.length];
  const botA = robo(a, alvo); a.avancar(4 * 60000, botA);
  i.P1 = 0; i.P2 = 1;
  const botB = robo(b, alvo); b.avancar(4 * 60000, botB);
  ok(a.s.pontos.historico.length >= 3, 'poucos pontos para o teste');
  const pesca = (s) => s.log.filter((e) => !/^ponto-/.test(e.tipo)).map((e) => JSON.stringify(Object.assign({}, e, { seq: undefined })));
  const la = pesca(a.s), lb = pesca(b.s);
  ok(la.length === lb.length, 'quantidade de eventos diferente: ' + la.length + ' × ' + lb.length);
  for (let k = 0; k < la.length; k++) if (la[k] !== lb[k]) throw new Error('evento ' + k + ' diferente:\n' + la[k] + '\n' + lb[k]);
});

test('Efeito exato: bolhas = espera até a mordida × 0,65 (os mesmos sorteios, só a espera muda)', () => {
  const a = sessao({ seed: 33 }), b = sessao({ seed: 33 });
  a.s.pontos.proximo = Infinity; b.s.pontos.proximo = Infinity;
  a.s.pontos.forcar('bolhas', 10);
  arremessar(a, 'P1', 10); arremessar(b, 'P1', 10);
  a.avancar(3000); b.avancar(3000);
  const ea = a.s.log.find((e) => e.tipo === 'espera' && e.jogador === 'P1'), eb = b.s.log.find((e) => e.tipo === 'espera' && e.jogador === 'P1');
  ok(ea && eb, 'sem evento de espera');
  const razao = ea.mordidaEmMs / eb.mordidaEmMs;
  ok(Math.abs(razao - PontosDeInteresse.TIPOS.bolhas.espera) < 0.01, 'razão ' + razao.toFixed(3));
  ok(a.s.players.P1.pontoNaAgua.tipo === 'bolhas' && !b.s.players.P1.pontoNaAgua, 'efeito no lugar errado');
});

test('Correnteza: com isca artificial, tucunaré × 2 e dourado × 1,6; com minhoca eles continuam impossíveis', () => {
  const ctx = sessao({ seed: 1 });
  const p = ctx.s.players.P1;
  p.tabelaRegiao = 'aberta';
  const chance = (isca, ponto) => { p.iscaNaAgua = isca; p.pontoNaAgua = ponto; return Object.fromEntries(p.tabelaDoSorteio().map((x) => [x.id, x.chance])); };
  const sem = chance('artificial', null), com = chance('artificial', PontosDeInteresse.efeito('correnteza'));
  ok(Math.abs(com.tucunare - 2 * sem.tucunare) < 1e-9 && Math.abs(com.dourado - 1.6 * sem.dourado) < 1e-9, JSON.stringify({ sem, com }));
  const m = chance('minhoca', PontosDeInteresse.efeito('correnteza'));
  ok(m.tucunare === 0 && m.dourado === 0, 'predadores raros com minhoca');
});

test('Sombra grande: peixe um pouco mais pesado (faixa de peso + 20 %), sem passar de 125 % da faixa', () => {
  const ctx = sessao({ seed: 1 });
  const p = ctx.s.players.P1;
  p.tabelaRegiao = 'aberta'; p.pontoNaAgua = null;
  const base = p.faixaDePeso(false);
  p.pontoNaAgua = PontosDeInteresse.efeito('sombra');
  const com = p.faixaDePeso(false);
  const d = PontosDeInteresse.TIPOS.sombra.peso;
  ok(Math.abs(com[0] - base[0] - d) < 1e-9 && Math.abs(com[1] - base[1] - d) < 1e-9, JSON.stringify({ base, com }));
  p.tabelaRegiao = 'fundo';
  ok(p.faixaDePeso(false)[1] <= 1.25, 'passou de 125 %');
  ok(p.faixaDePeso(true)[0] === 0 && p.faixaDePeso(true)[1] === 1, 'objetos não mudam');
});

test('Ritmo: 1º ponto entre 25 e 40 s; duração 18–28 s; pausa 30–60 s; zona e distância coerentes', () => {
  const pt = new PontosDeInteresse({ seed: 77, config: createConfig() });
  const ev = [];
  pt.on((e) => ev.push(Object.assign({ t: pt.t }, e)));
  for (let k = 0; k < 30 * 60000; k += 100) pt.avancar(100);
  const surg = ev.filter((e) => e.tipo === 'ponto-surgiu'), sum = ev.filter((e) => e.tipo === 'ponto-sumiu');
  ok(surg.length >= 20, 'poucos pontos em 30 min: ' + surg.length);
  ok(surg[0].t >= 25000 && surg[0].t <= 40100, 'primeiro em ' + surg[0].t);
  for (const s of surg) {
    const p = s.ponto, dur = p.fim - p.inicio;
    ok(dur >= 18000 && dur <= 28000, 'duração ' + dur);
    ok(Dados.zonaDaDistancia(p.distancia) === p.zona, 'zona errada: ' + JSON.stringify(p));
    ok(PontosDeInteresse.TIPOS[p.tipo].zonas.includes(p.zona), 'tipo fora da zona: ' + JSON.stringify(p));
    ok(p.distancia >= 7 && p.distancia <= 29, 'fora do alcance: ' + p.distancia);
  }
  for (let k = 1; k < surg.length; k++) {
    const pausa = surg[k].t - sum[k - 1].t;
    ok(pausa >= 30000 - 100 && pausa <= 60100, 'pausa ' + pausa);
  }
  const tipos = new Set(surg.map((s) => s.ponto.tipo));
  ok(tipos.size >= 5, 'tipos que apareceram: ' + [...tipos].join(', '));
});

// ------------------------------------------------------------------ equilíbrio
const RESUMO = {};
test('Sem domínio: perseguir TODOS os pontos muda pouco o total da sessão (± 40 %; troca peso por rapidez)', () => {
  let capA = 0, capB = 0, kgA = 0, kgB = 0, acertos = 0, arremessosA = 0;
  for (const seed of [11, 12, 13, 14, 15, 16]) {
    const ctx = sessao({ seed });
    let i = { P1: 0, P2: 0 };
    const ciclo = [10, 16, 20, 26];
    const alvo = (id) => {
      const a = ctx.s.pontos.ativo();
      if (id === 'P1') { arremessosA++; if (a && a.fim - ctx.s.pontos.t > 4000) return a.distancia; }
      return ciclo[(i[id]++) % ciclo.length];
    };
    const bot = robo(ctx, alvo);
    ctx.avancar(20 * 60000, bot);
    const s1 = ctx.s.players.P1.stats, s2 = ctx.s.players.P2.stats;
    capA += s1.capturas; capB += s2.capturas; kgA += s1.pesoTotalKg; kgB += s2.pesoTotalKg;
    acertos += ctx.s.pontos.acertos.filter((x) => x.jogador === 'P1').length;
  }
  const gCap = capA / capB - 1, gKg = kgA / kgB - 1;
  Object.assign(RESUMO, { capturasMirando: capA, capturasSemMirar: capB, kgMirando: +kgA.toFixed(1), kgSemMirar: +kgB.toFixed(1),
    ganhoCapturas: +(gCap * 100).toFixed(1) + '%', ganhoKg: +(gKg * 100).toFixed(1) + '%', acertosNoPonto: acertos, arremessosQuemMira: arremessosA });
  ok(Math.abs(gKg) < 0.4 && Math.abs(gCap) < 0.4 && acertos >= 40, JSON.stringify(RESUMO));
});

// Efeito POR ARREMESSO: compara arremessos que pousaram num ponto com arremessos na MESMA zona sem ponto.
const POR_TIPO = {};
test('Por arremesso: no ponto a mordida vem mais cedo (bolhas, cardume, lírios) e o peixe é mais pesado (sombra, tronco)', () => {
  const esperas = {}, pesos = {};
  const add = (o, k, v) => { (o[k] = o[k] || []).push(v); };
  for (const seed of [61, 62, 63, 64, 65, 66, 67, 68, 69, 70]) {
    const ctx = sessao({ seed, modo: 1, iscas: { P1: 'minhoca', P2: 'minhoca' } });
    const p = ctx.s.players.P1, ciclo = [10, 16, 20, 26];
    let i = 0;
    const alvo = () => { const a = ctx.s.pontos.ativo(); return (a && a.fim - ctx.s.pontos.t > 3000 && (i++ % 2 === 0)) ? a.distancia : ciclo[(i++) % ciclo.length]; };
    ctx.s.onEvent((e) => {
      if (e.jogador !== 'P1') return;
      const chave = (p.pontoNaAgua ? p.pontoNaAgua.tipo : 'nenhum') + '@' + p.zona;
      if (e.tipo === 'espera') add(esperas, chave, e.mordidaEmMs);
      if (e.tipo === 'captura' && !e.objeto) {
        const def = Dados.especiePorId[e.perfil];
        add(pesos, chave, (e.pesoKg - def.pesoKg[0]) / (def.pesoKg[1] - def.pesoKg[0]));   // peso relativo à faixa da espécie
      }
    });
    ctx.avancar(20 * 60000, robo(ctx, alvo));
  }
  const media = (l) => l && l.length ? l.reduce((a, b) => a + b, 0) / l.length : NaN;
  const falhas = [];
  for (const [tipo, zona] of [['bolhas', 'rasa'], ['cardume', 'rasa'], ['bolhas', 'lirios'], ['lirios', 'lirios']]) {
    const com = esperas[tipo + '@' + zona], sem = esperas['nenhum@' + zona];
    const r = media(com) / media(sem);
    POR_TIPO[tipo + '@' + zona] = { arremessos: com ? com.length : 0, esperaRelativa: +r.toFixed(2) };
    if (com && com.length >= 5 && !(r < 0.92)) falhas.push(tipo + '@' + zona + ' espera ' + r.toFixed(2));
  }
  for (const [tipo, zona] of [['sombra', 'pedras'], ['sombra', 'poco'], ['tronco', 'poco']]) {
    const com = pesos[tipo + '@' + zona], sem = pesos['nenhum@' + zona];
    const d = media(com) - media(sem);
    POR_TIPO[tipo + '@' + zona] = { capturas: com ? com.length : 0, pesoRelativoMais: +(d * 100).toFixed(0) + ' pontos %' };
    if (com && com.length >= 5 && !(d > 0.03)) falhas.push(tipo + '@' + zona + ' peso ' + d.toFixed(2));
  }
  ok(!falhas.length, falhas.join(' | ') + ' ' + JSON.stringify(POR_TIPO));
});

// Ganho DENTRO de cada zona: o mesmo robô pescando sempre na mesma zona, com e sem pontos
// (com pontos ele mira no ponto quando o ponto está nessa zona). Isola o efeito do ponto.
const POR_ZONA = {};
test('Equilíbrio por zona: pescar numa zona com os pontos dela nunca atrapalha (> −10 %) nem domina (< +45 %)', () => {
  const alvoDaZona = { rasa: 10, lirios: 16, pedras: 20, poco: 26 };
  const isca = { rasa: 'minhoca', lirios: 'minhoca', pedras: 'artificial', poco: 'coracao' };
  const falhas = [];
  for (const zona of Object.keys(alvoDaZona)) {
    let capCom = 0, capSem = 0, kgCom = 0, kgSem = 0, acertos = 0;
    for (const seed of [41, 42, 43, 44, 45, 46, 47, 48]) {
      for (const comPontos of [true, false]) {
        const ctx = sessao({ seed, modo: 1, iscas: { P1: isca[zona], P2: 'minhoca' } });
        if (!comPontos) ctx.s.pontos.proximo = Infinity;
        // pontos só nesta zona (os outros não interessam a este pescador)
        const alvo = () => { const a = ctx.s.pontos.ativo(); return (comPontos && a && a.zona === zona && a.fim - ctx.s.pontos.t > 3000) ? a.distancia : alvoDaZona[zona]; };
        ctx.avancar(15 * 60000, robo(ctx, alvo));
        const st = ctx.s.players.P1.stats;
        if (comPontos) { capCom += st.capturas; kgCom += st.pesoTotalKg; acertos += ctx.s.pontos.acertos.length; } else { capSem += st.capturas; kgSem += st.pesoTotalKg; }
      }
    }
    const r = { capturas: capCom + ' × ' + capSem, kg: kgCom.toFixed(0) + ' × ' + kgSem.toFixed(0),
      ganhoCapturas: +((capCom / capSem - 1) * 100).toFixed(1), ganhoKg: +((kgCom / kgSem - 1) * 100).toFixed(1), acertos };
    POR_ZONA[zona] = r;
    if (!(r.ganhoCapturas > -10 && r.ganhoKg > -10 && r.ganhoCapturas < 45 && r.ganhoKg < 45)) falhas.push(zona + ': ' + JSON.stringify(r));
  }
  ok(!falhas.length, falhas.join(' | '));
});

console.log('\nResumo do equilíbrio (mirando em todos os pontos × ciclo fixo):', JSON.stringify(RESUMO));
console.log('Ganho por zona (% com pontos × sem pontos, 8 sementes × 15 min):', JSON.stringify(POR_ZONA));
console.log('Efeito por arremesso no ponto (mesma zona, sem ponto = 1):', JSON.stringify(POR_TIPO));
console.log('\n' + passed + ' de ' + (passed + failed) + ' testes passaram.');
process.exitCode = failed ? 1 : 0;
