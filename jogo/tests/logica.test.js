/*
 * Testes da lógica da versão jogável (sem navegador):  node jogo/tests/logica.test.js
 * Usa a lógica REAL do P1 (só leitura) e as camadas novas de jogo/src/logica.
 */
'use strict';
const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const P1 = path.join(ROOT, 'prototipos', 'p1-pesca', 'src');
const Random = require(path.join(P1, 'logic', 'Random.js'));
const FishingPlayer = require(path.join(P1, 'logic', 'FishingPlayer.js'));
const FishingSession = require(path.join(P1, 'logic', 'FishingSession.js'));
const { createConfig } = require(path.join(P1, 'logic', 'config.js'));
const L = path.join(__dirname, '..', 'src', 'logica');
const Dados = require(path.join(L, 'DadosPesca.js'));
const PescadorRegional = require(path.join(L, 'PescadorRegional.js'));
const SessaoJogo = require(path.join(L, 'SessaoJogo.js'));
const { Armazenamento, Opcoes, Catalogo, OPCOES_PADRAO } = require(path.join(L, 'Armazenamento.js'));
const Dialogos = require(path.join(L, 'Dialogos.js'));

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ✓ ' + name); } catch (e) { failed++; console.log('  ✗ ' + name + '\n      ' + (e && e.message)); }
}
const STEP = 10;

// Nomes do P1 → espécies equivalentes nas águas abertas com minhoca
const P1_PARA_ESPECIE = { rapido: 'tilapia', pesado: 'carpa', arisco: 'traira' };
const NOME_P1 = { 'Peixe rápido': 'Tilápia', 'Peixe pesado': 'Carpa', 'Peixe arisco': 'Traíra' };
function normaliza(e) {
  const o = Object.assign({}, e);
  if (o.perfil && P1_PARA_ESPECIE[o.perfil]) o.perfil = P1_PARA_ESPECIE[o.perfil];
  if (o.peixe && NOME_P1[o.peixe]) o.peixe = NOME_P1[o.peixe];
  return JSON.stringify(o);
}

/** Roteiro longo e variado (cargas, toque curto, recolhimento, mordida perdida, brigas, pulos de cartão). */
function roteiro(make) {
  const log = [];
  let t = 1000;
  const p = make((e) => log.push(e), t);
  const step = (ms, cb) => { for (let k = 0; k < ms; k += STEP) { t += STEP; p.update(t); if (cb) cb(); } };
  const until = (c, max, cb) => { let n = 0; while (!c() && n < max) { step(STEP, cb); n += STEP; } };
  const fight = () => until(() => p.state !== 'FIGHTING', 60000, () => {
    if (p.state !== 'FIGHTING') return;
    if (p.tension < 0.5 && !p.pressed) p.press(t); else if (p.tension > 0.62 && p.pressed) p.release(t, {});
  });
  p.press(t); step(120); p.release(t);
  for (let round = 0; round < 10; round++) {
    p.press(t); step(250 + round * 140); p.release(t, {});
    until(() => p.state === 'WAITING', 3000);
    if (round % 3 === 1) { p.press(t); step(260); p.release(t, {}); }
    until(() => p.state === 'BITE', 15000);
    if (round === 4) { until(() => p.state === 'IDLE', 5000); continue; }
    step(120 + 30 * round); p.press(t);
    if (round === 6) until(() => p.state !== 'FIGHTING', 30000); else fight();
    if (p.pressed) p.release(t, {});
    if (round % 2) { step(700); p.press(t); step(10); p.release(t, {}); }
    until(() => p.state === 'IDLE', 5000);
  }
  return { log, stats: p.stats, p };
}

console.log('Lógica da versão jogável (regiões, iscas, espécies, catálogo, diálogos)');

// ---------------------------------------------------------------- regressão com o P1
test('REGRESSÃO: regiões desligadas + minhoca = P1 idêntico (mesmos eventos, tempos, pesos e estatísticas)', () => {
  const cfg = createConfig({ nibbleMin: 0, nibbleMax: 2 });
  const a = roteiro((emit, t) => new FishingPlayer({ id: 'P1', label: 'ALEMÃO', config: cfg, rng: new Random(4242), time: t, emit }));
  const b = roteiro((emit, t) => new PescadorRegional({ id: 'P1', label: 'ALEMÃO', config: cfg, rng: new Random(4242), time: t, emit, regioes: false, isca: 'minhoca' }));
  assert.ok(a.log.length > 150, 'roteiro com ' + a.log.length + ' eventos');
  assert.ok(a.stats.capturas >= 4, 'capturas no roteiro: ' + a.stats.capturas);
  assert.deepStrictEqual(b.log.map(normaliza), a.log.map(normaliza));
  assert.deepStrictEqual(b.stats, a.stats);
});

test('REGRESSÃO: com regiões LIGADAS, arremessos que caem nas águas abertas também reproduzem o P1', () => {
  // força entre 34 % e 66 %: todos os arremessos do roteiro caem entre 14 e 22 m
  const cfg = createConfig({ nibbleMin: 0, nibbleMax: 0 });
  function play(make) {
    const log = []; let t = 1000; const p = make((e) => log.push(e), t);
    const step = (ms, cb) => { for (let k = 0; k < ms; k += STEP) { t += STEP; p.update(t); if (cb) cb(); } };
    const until = (c, max, cb) => { let n = 0; while (!c() && n < max) { step(STEP, cb); n += STEP; } };
    for (let r = 0; r < 8; r++) {
      p.press(t); step(400 + (r % 3) * 50); p.release(t, {});
      until(() => p.state === 'BITE', 15000); step(200); p.press(t);
      until(() => p.state !== 'FIGHTING', 60000, () => { if (p.state !== 'FIGHTING') return; if (p.tension < 0.5 && !p.pressed) p.press(t); else if (p.tension > 0.62 && p.pressed) p.release(t, {}); });
      if (p.pressed) p.release(t, {});
      until(() => p.state === 'IDLE', 5000);
    }
    return log;
  }
  const a = play((emit, t) => new FishingPlayer({ id: 'P1', label: 'x', config: cfg, rng: new Random(77), time: t, emit }));
  let regioes = new Set();
  const b = play((emit, t) => { const p = new PescadorRegional({ id: 'P1', label: 'x', config: cfg, rng: new Random(77), time: t, emit: (e) => { if (e.tipo === 'arremesso') regioes.add(p.regiao); emit(e); }, regioes: true }); return p; });
  assert.deepStrictEqual([...regioes], ['aberta']);
  assert.deepStrictEqual(b.map(normaliza), a.map(normaliza));
});

test('REGRESSÃO: SessaoJogo (2 jogadores, regiões desligadas, minhoca) = FishingSession do P1 com a mesma semente', () => {
  function play(S, jogo) {
    let now = 5000;
    const s = new S({ config: createConfig({ nibbleMin: 0, nibbleMax: 1 }), seed: 2026, now: () => now, jogo });
    s.router.setWidth(800);
    const tap = (x, key, ms) => { s.router.down({ key, identifier: key, x, time: now }); for (let k = 0; k < ms; k += STEP) { now += STEP; s.update(now); } s.router.up({ key, identifier: key, x, time: now }); };
    const wait = (ms) => { for (let k = 0; k < ms; k += STEP) { now += STEP; s.update(now); } };
    for (let r = 0; r < 4; r++) {
      tap(100, 'a' + r, 500 + r * 90); tap(700, 'b' + r, 650 + r * 60);
      for (let k = 0; k < 2000 && !(s.players.P1.state === 'BITE' && s.players.P2.state === 'BITE'); k++) {
        wait(STEP);
        for (const [id, x] of [['P1', 100], ['P2', 700]]) if (s.players[id].state === 'BITE') tap(x, id + 'h' + r + k, 40);
      }
      wait(9000);
    }
    return { log: s.log.map(normaliza), stats: [s.players.P1.stats, s.players.P2.stats] };
  }
  const a = play(FishingSession);
  const b = play(SessaoJogo, { modo: 2, regioes: false, iscas: { P1: 'minhoca', P2: 'minhoca' } });
  assert.ok(a.log.length > 60);
  assert.deepStrictEqual(b.log, a.log);
  assert.deepStrictEqual(b.stats, a.stats);
});

// ---------------------------------------------------------------- regiões
test('Regiões pela distância: < 14 m margem · 14–22 m abertas · ≥ 22 m fundo', () => {
  const r = Dados.regiaoDaDistancia;
  assert.deepStrictEqual([6, 13.99, 14, 21.99, 22, 30, 36].map(r), ['margem', 'margem', 'aberta', 'aberta', 'fundo', 'fundo', 'fundo']);
});

/** Faz N arremessos com força fixa (ms segurando) e devolve as fisgadas. */
function pescarias(opts) {
  const cfg = createConfig({ nibbleMin: 0, nibbleMax: 0 });
  const out = [];
  let t = 1000;
  const p = new PescadorRegional({ id: 'P1', label: 'x', config: cfg, rng: new Random(opts.seed || 9), time: t, regioes: opts.regioes !== false, isca: opts.isca || 'minhoca',
    emit: (e) => { if (e.tipo === 'espera') out.push({ espera: e.mordidaEmMs }); } });
  const step = (ms) => { for (let k = 0; k < ms; k += STEP) { t += STEP; p.update(t); } };
  const res = [];
  for (let i = 0; i < opts.n; i++) {
    p.press(t); step(opts.hold); p.release(t, {});
    let n = 0; while (p.state !== 'BITE' && n < 40000) { step(STEP); n += STEP; }
    if (opts.reelBack) { /* não usado */ }
    p.press(t);
    res.push({ regiao: p.regiao, distancia: p.distance, especie: p.fish.profile.id, objeto: p.fish.profile.objeto, peso: p.fish.weightKg,
      runPull: p.fish.profile.runPull, tire: p.fish.profile.tireRate, espera: out[out.length - 1].espera });
    p.release(t, {});
    p._toIdle(t, 'teste');   // atalho de TESTE: encerra a rodada sem brigar (só para amostrar sorteios)
  }
  return res;
}

test('Arremesso curto, médio e longo caem na região certa (pela força do medidor)', () => {
  // força 0→1 em 800 ms e 1→0 até 1600 ms: 1467 ms ≈ 17 % (10 m) · 400 ms = 50 % (18 m) · 700 ms ≈ 88 % (27 m)
  for (const [hold, reg] of [[1467, 'margem'], [400, 'aberta'], [700, 'fundo']]) {
    const r = pescarias({ n: 5, hold });
    assert.ok(r.every((x) => x.regiao === reg), hold + ' ms → ' + r.map((x) => x.regiao + ' ' + x.distancia.toFixed(1)).join(', '));
  }
});

test('D2: a região é a do POUSO — recolher a linha não muda a região nem a tabela da mordida', () => {
  const cfg = createConfig({ nibbleMin: 0, nibbleMax: 0, waitMinMs: 3000, waitMaxMs: 3000 });
  let t = 1000;
  const p = new PescadorRegional({ id: 'P1', label: 'x', config: cfg, rng: new Random(5), time: t, regioes: true });
  const step = (ms) => { for (let k = 0; k < ms; k += STEP) { t += STEP; p.update(t); } };
  p.press(t); step(700); p.release(t, {});            // ~27 m: fundo
  while (p.state !== 'WAITING') step(STEP);
  assert.strictEqual(p.regiao, 'fundo');
  p.press(t); step(900);                               // recolhe ~10 m (até a faixa das águas abertas/margem)
  assert.strictEqual(p.state, 'REELING_EMPTY');
  p.release(t, {});
  assert.ok(p.distance < 22, 'boia agora a ' + p.distance.toFixed(1) + ' m');
  assert.strictEqual(p.regiao, 'fundo', 'região continua a do pouso');
  while (p.state !== 'BITE') step(STEP);
  p.press(t);
  assert.ok(!['lambari'].includes(p.fish.profile.id), 'sorteado com a tabela do fundo');
  assert.ok(p.fish.profile.objeto || Math.abs(p.fish.profile.runPull / Dados.especiePorId[p.fish.profile.id].comportamento.runPull - 1.15) < 1e-9);
});

test('Espécies coerentes com a região (minhoca): margem sem bagre; fundo sem lambari; tucunaré e dourado só com isca artificial', () => {
  const m = pescarias({ n: 400, hold: 1467, seed: 3 });
  const f = pescarias({ n: 400, hold: 700, seed: 4 });
  const ab = pescarias({ n: 400, hold: 400, seed: 5 });
  const conta = (r) => r.reduce((o, x) => { const k = x.objeto ? 'objeto' : x.especie; o[k] = (o[k] || 0) + 1; return o; }, {});
  const cm = conta(m), cf = conta(f), ca = conta(ab);
  assert.ok(!cm.bagre && !cm.tucunare && !cm.dourado, 'margem: ' + JSON.stringify(cm));
  assert.ok(!cf.lambari && !cf.tucunare && !cf.dourado, 'fundo: ' + JSON.stringify(cf));
  assert.deepStrictEqual(Object.keys(ca).sort(), ['carpa', 'tilapia', 'traira'], 'abertas = espécies do P1: ' + JSON.stringify(ca));
  // frequências perto da tabela (tolerância de 6 pontos percentuais em 400 amostras)
  for (const [res, reg] of [[cm, 'margem'], [cf, 'fundo'], [ca, 'aberta']]) {
    const p = Dados.probabilidades(reg, 'minhoca');
    for (const k of Object.keys(p)) assert.ok(Math.abs((res[k] || 0) / 400 - p[k]) < 0.06, reg + ' ' + k + ': ' + (res[k] || 0) / 400 + ' × ' + p[k].toFixed(2));
  }
  const art = conta(pescarias({ n: 300, hold: 400, seed: 6, isca: 'artificial' }));
  assert.ok(art.tucunare > 0 && !art.lambari, 'artificial nas abertas: ' + JSON.stringify(art));
  const artF = conta(pescarias({ n: 400, hold: 700, seed: 7, isca: 'artificial' }));
  assert.ok(artF.dourado > 0, 'artificial no fundo traz dourado: ' + JSON.stringify(artF));
});

test('Espera por região × isca: margem 2–5 s, abertas 2,5–8 s, fundo 6,5–12 s (massa × 0,85; artificial × 1,1)', () => {
  const casos = [[1467, 'minhoca', [2000, 5000]], [400, 'minhoca', [2500, 8000]], [700, 'minhoca', [6500, 12000]],
    [1467, 'massa', [1700, 4250]], [700, 'artificial', [7150, 13200]]];
  for (const [hold, isca, [a, b]] of casos) {
    const r = pescarias({ n: 60, hold, isca, seed: 11 });
    assert.ok(r.every((x) => x.espera >= a - 1 && x.espera <= b + 1), isca + ' ' + hold + ': ' + Math.min(...r.map((x) => x.espera)) + '–' + Math.max(...r.map((x) => x.espera)));
  }
});

test('Pesos pela faixa da região: margem até 60 % da faixa; fundo de 40 % a 110 % (passa do máximo de hoje)', () => {
  for (const x of pescarias({ n: 200, hold: 1467, seed: 12 })) {
    if (x.objeto) continue;
    const e = Dados.especiePorId[x.especie], s = e.pesoKg[1] - e.pesoKg[0];
    assert.ok(x.peso <= e.pesoKg[0] + 0.6 * s + 0.01, x.especie + ' ' + x.peso);
  }
  let acima = 0;
  for (const x of pescarias({ n: 200, hold: 700, seed: 13 })) {
    if (x.objeto) continue;
    const e = Dados.especiePorId[x.especie], s = e.pesoKg[1] - e.pesoKg[0];
    assert.ok(x.peso >= e.pesoKg[0] + 0.4 * s - 0.01 && x.peso <= e.pesoKg[0] + 1.1 * s + 0.01, x.especie + ' ' + x.peso);
    if (x.peso > e.pesoKg[1]) acima++;
    assert.ok(Math.abs(x.runPull / e.comportamento.runPull - 1.15) < 1e-9, 'fundo: peixe 15 % mais forte');
  }
  assert.ok(acima > 0, 'algum peixe do fundo passou do peso máximo');
});

test('Iscas: a troca vale a partir do PRÓXIMO arremesso; regiões ligar/desligar também', () => {
  const cfg = createConfig({ nibbleMin: 0, nibbleMax: 0 });
  let t = 1000;
  const p = new PescadorRegional({ id: 'P1', label: 'x', config: cfg, rng: new Random(1), time: t, regioes: true, isca: 'minhoca' });
  const step = (ms) => { for (let k = 0; k < ms; k += STEP) { t += STEP; p.update(t); } };
  p.press(t); step(700); p.release(t, {});
  p.setIsca('artificial'); p.setRegioes(false);
  assert.strictEqual(p.iscaNaAgua, 'minhoca'); assert.strictEqual(p.regiao, 'fundo');
  while (p.state !== 'BITE') step(STEP);
  p.press(t); p.release(t, {}); p._toIdle(t, 'teste');
  p.press(t); step(700); p.release(t, {});
  assert.strictEqual(p.iscaNaAgua, 'artificial'); assert.strictEqual(p.regiao, null, 'regiões desligadas: sem região');
  assert.strictEqual(p.tabelaRegiao, 'aberta');
});

test('Objetos (capturas inusitadas): não contam como peixe no placar, mas terminam em CAUGHT com o cartão', () => {
  const cfg = createConfig({ nibbleMin: 0, nibbleMax: 0 });
  let t = 1000, found = null;
  const eventos = [];
  for (let seed = 1; seed < 400 && !found; seed++) {
    const p = new PescadorRegional({ id: 'P1', label: 'x', config: cfg, rng: new Random(seed), time: t, regioes: true, emit: (e) => eventos.push(e) });
    const step = (ms) => { for (let k = 0; k < ms; k += STEP) { t += STEP; p.update(t); } };
    p.press(t); step(1467); p.release(t, {});
    while (p.state !== 'BITE') step(STEP);
    p.press(t);
    if (p.fish.profile.objeto) found = { p, step };
    else { p.release(t, {}); }
  }
  assert.ok(found, 'nenhum objeto em 400 sementes');
  const { p, step } = found;
  let n = 0;
  while (p.state === 'FIGHTING' && n < 60000) { step(STEP); if (p.tension > 0.6 && p.pressed) p.release(t, {}); else if (p.tension < 0.5 && !p.pressed) p.press(t); n += STEP; }
  assert.strictEqual(p.state, 'CAUGHT');
  assert.strictEqual(p.stats.capturas, 0); assert.strictEqual(p.stats.pesoTotalKg, 0);
  assert.strictEqual(p.objetos.length, 1);
  assert.ok(p.lastResult.objeto === true);
});

test('Guia: toda espécie tem região e isca; tucunaré e dourado exigem a isca artificial; toda isca é a melhor para alguma espécie', () => {
  const melhorPor = {};
  for (const e of Dados.ESPECIES) {
    const g = Dados.guiaDaEspecie(e.id);
    assert.ok(g.regioes.length > 0 && g.iscas.length > 0, e.id);
    melhorPor[g.melhor.isca] = (melhorPor[g.melhor.isca] || 0) + 1;
  }
  assert.deepStrictEqual(Dados.guiaDaEspecie('tucunare').iscas.map((i) => i.id), ['artificial']);
  assert.deepStrictEqual(Dados.guiaDaEspecie('dourado').iscas.map((i) => i.id), ['artificial']);
  for (const i of Dados.ISCAS) if (i.id !== 'minhoca') assert.ok(melhorPor[i.id] > 0, 'isca sem espécie preferida: ' + i.id + ' ' + JSON.stringify(melhorPor));
});

// ---------------------------------------------------------------- catálogo e opções
function lojaFalsa() { const m = {}; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; }, m }; }

test('Catálogo: registra descoberta, quantidade e maior exemplar; persiste e apaga', () => {
  const loja = lojaFalsa();
  const c = new Catalogo(new Armazenamento(loja));
  assert.deepStrictEqual(c.registrar({ id: 'tilapia', pesoKg: 0.8, quem: 'ALEMÃO' }), { novo: true, recorde: false });
  assert.deepStrictEqual(c.registrar({ id: 'tilapia', pesoKg: 0.5 }), { novo: false, recorde: false });
  assert.deepStrictEqual(c.registrar({ id: 'tilapia', pesoKg: 1.1, quem: 'ALE' }), { novo: false, recorde: true });
  c.registrar({ id: 'bota', pesoKg: 1, objeto: true });
  const c2 = new Catalogo(new Armazenamento(loja));
  assert.deepStrictEqual([c2.estado('tilapia').quantidade, c2.estado('tilapia').maiorKg, c2.estado('tilapia').quem], [3, 1.1, 'ALE']);
  assert.strictEqual(c2.descobertos(), 1); assert.strictEqual(c2.objeto('bota').quantidade, 1);
  assert.strictEqual(c2.estado('bagre'), null);
  c2.apagarTudo();
  assert.strictEqual(new Catalogo(new Armazenamento(loja)).descobertos(), 0);
});

test('Catálogo e opções funcionam sem armazenamento (navegador bloqueado)', () => {
  const quebrado = { getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('bloqueado'); }, removeItem() { throw new Error('x'); } };
  const c = new Catalogo(new Armazenamento(quebrado));
  assert.deepStrictEqual(c.registrar({ id: 'lambari', pesoKg: 0.1 }).novo, true);
  const o = new Opcoes(new Armazenamento(quebrado));
  o.set('volumeGeral', 0.3);
  assert.strictEqual(o.get('volumeGeral'), 0.3);
});

test('Opções: padrão, validação (0–1, booleanos) e persistência', () => {
  const loja = lojaFalsa();
  const o = new Opcoes(new Armazenamento(loja));
  assert.deepStrictEqual(o.valores, OPCOES_PADRAO);
  o.set('volumeMusica', 2); o.set('regioes', false); o.set('efeitos', 'sim'); o.set('inexistente', 1);
  const o2 = new Opcoes(new Armazenamento(loja));
  assert.strictEqual(o2.get('volumeMusica'), 1); assert.strictEqual(o2.get('regioes'), false); assert.strictEqual(o2.get('efeitos'), true);
  assert.ok(!('inexistente' in o2.valores));
});

// ---------------------------------------------------------------- diálogos
test('Diálogos: ocasionais — nunca duas falas com menos de 15 s (exceto espécie nova, ≥ 6 s), mesmo com muitos eventos', () => {
  const rng = new Random(8);
  const d = new Dialogos({ modo: 2, random: () => rng.next() });
  const falas = [];
  for (let s = 0; s < 1800; s++) {           // 30 min, um evento a cada 2 s em média
    d.update(1000);
    const r = rng.next();
    if (r < 0.25) d.captura(rng.next() < 0.5 ? 'P1' : 'P2', { id: 'tilapia', nome: 'Tilápia', pesoKg: 1, grande: rng.next() < 0.3, novo: rng.next() < 0.03, objeto: rng.next() < 0.05 });
    else if (r < 0.4) d.perdeu(rng.next() < 0.5 ? 'P1' : 'P2', rng.next() < 0.5 ? 'linha-rompida' : 'fuga');
    if (d.atual && (!falas.length || falas[falas.length - 1] !== d.atual)) falas.push(d.atual);
  }
  assert.ok(falas.length >= 20 && falas.length <= 130, falas.length + ' falas em 30 min');
  for (let i = 1; i < falas.length; i++) {
    const gap = falas[i].desde - falas[i - 1].desde;
    assert.ok(gap >= 15000 || (falas[i].situacao === 'novo' && gap >= 6000), 'intervalo ' + gap + ' ms (' + falas[i].situacao + ')');
  }
  assert.ok(falas.every((f) => !/[{}]/.test(f.texto) && f.texto.length <= 60), 'texto montado');
  const quem = new Set(falas.map((f) => f.personagem));
  assert.ok(quem.has('alemao') && quem.has('ale'), 'os dois falam');
});

test('Diálogos: nenhuma fala com artigo antes do nome do peixe (Carpa, Tilápia e Traíra são femininos)', () => {
  const ruins = [];
  const anda = (o) => { for (const v of Object.values(o)) { if (Array.isArray(v)) v.forEach((t) => { if (/\b(um|uma|esse|essa|o|a)\s+\{peixe\}/i.test(t)) ruins.push(t); }); else if (v && typeof v === 'object') anda(v); } };
  anda(Dialogos.FALAS);
  assert.deepStrictEqual(ruins, []);
});

test('Diálogos: seca depois de 75 s sem capturas; modo 1 jogador só o personagem dele fala', () => {
  const d = new Dialogos({ modo: 1, personagens: { P1: 'ale' }, random: () => 0.1 });
  let fala = null;
  for (let s = 0; s < 80 && !fala; s++) fala = d.update(1000);
  assert.ok(fala && fala.situacao === 'seca' && fala.personagem === 'ale', JSON.stringify(fala));
  assert.ok(fala.desde >= 75000);
  d.update(20000);
  d.captura('P1', { id: 'dourado', nome: 'Dourado', pesoKg: 7, grande: true, novo: true });
  assert.ok(d.atual && d.atual.personagem === 'ale' && d.atual.situacao === 'novo', JSON.stringify(d.atual));
});

console.log('\n' + passed + ' de ' + (passed + failed) + ' testes passaram.');
process.exit(failed ? 1 : 0);
