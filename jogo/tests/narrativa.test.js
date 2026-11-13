/*
 * Testes da narrativa (diálogos, Maria e Sirius), sem navegador:
 *   node jogo/tests/narrativa.test.js
 * Usa a lógica REAL da pesca (P1 + SessaoJogo) com jogadores virtuais e liga o Narrador
 * aos eventos, como na partida.
 */
'use strict';
const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const Random = require(path.join(ROOT, 'prototipos', 'p1-pesca', 'src', 'logic', 'Random.js'));
const { createConfig } = require(path.join(ROOT, 'prototipos', 'p1-pesca', 'src', 'logic', 'config.js'));
const L = path.join(__dirname, '..', 'src');
const Dados = require(path.join(L, 'logica', 'DadosPesca.js'));
const SessaoJogo = require(path.join(L, 'logica', 'SessaoJogo.js'));
const Falas = require(path.join(L, 'narrativa', 'Falas.js'));
for (const f of ['captura', 'fracasso', 'pesca', 'conversas', 'sirius', 'reacoes', 'mundo', 'familia']) require(path.join(L, 'narrativa', 'falas', f + '.js'));
const Sirius = require(path.join(L, 'narrativa', 'Sirius.js'));
const Narrador = require(path.join(L, 'narrativa', 'Narrador.js'));

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ✓ ' + name); } catch (e) { failed++; console.log('  ✗ ' + name + '\n      ' + (e && e.message)); }
}
const STEP = 10;
const cenas = Falas.cenas;
const linhasDe = (pessoa) => cenas.flatMap((c) => c.f.filter((l) => l[0] === pessoa).map((l) => ({ c, t: l[1] })));

console.log('Narrativa: diálogos, Maria e Sirius (' + cenas.length + ' cenas, ' + cenas.reduce((s, c) => s + c.f.length, 0) + ' falas)');

// ================================================================= dados e cânone
test('Dados: toda cena tem gatilho conhecido, falantes válidos, emoções e marcadores conhecidos', () => {
  const gat = new Set(Object.keys(Narrador.CATEGORIA));
  const quem = new Set(['alemao', 'ale', 'maria', 'sirius', 'S', 'O']);
  const emo = new Set(['neutro', 'serio', 'feliz', 'rindo', 'surpreso', 'preocupado', 'triste', 'bravo', 'frustrado']);
  const marc = /\{(peixe|Peixe|um|Um|o|O|kg|m|isca|regiao|zona|placar|vocS|vocO|balbucio(:(feliz|curioso|protesto|surpresa|bobo|sono|choro))?)\}/g;
  for (const c of cenas) {
    assert.ok(gat.has(c.g), c.id + ': gatilho ' + c.g);
    assert.ok(c.f.length >= 1 && c.f.length <= 4, c.id + ': ' + c.f.length + ' falas');
    assert.ok(c.p >= 1 && c.p <= 6, c.id + ': prioridade');
    for (const [q, t, e] of c.f) {
      assert.ok(quem.has(q), c.id + ': quem ' + q);
      assert.ok(!e || emo.has(e), c.id + ': emoção ' + e);
      assert.strictEqual(t.replace(marc, '').includes('{'), false, c.id + ': marcador desconhecido em "' + t + '"');
    }
  }
});

test('Dados: falas curtas (até 60 caracteres, como o GDD pede para não atrapalhar a ação)', () => {
  const longas = cenas.flatMap((c) => c.f.filter((l) => l[1].replace(/\{[^}]+\}/g, 'xxxxxxx').length > 60).map((l) => c.id + ' ' + l[1]));
  assert.deepStrictEqual(longas, []);
});

test('Cânone: Maria chama Lucas de "Lucas" (nunca "Alemão"); ALE chama de "Alemão" (nunca "Lucas")', () => {
  assert.deepStrictEqual(linhasDe('maria').filter((x) => /Alemão/.test(x.t)).map((x) => x.t), []);
  assert.deepStrictEqual(linhasDe('ale').filter((x) => /\bLucas\b/.test(x.t)).map((x) => x.t), []);
});

test('Cânone: Lucas chama Maria de "Maria" (Operação Nova Identidade) e não usa vocativo para o ALE (ainda pendente)', () => {
  assert.deepStrictEqual(linhasDe('alemao').filter((x) => /\bALE\b|sogr|\bamor\b|\bvovô\b|\bvô\b/i.test(x.t)).map((x) => x.t), []);
  // se o Lucas chama a esposa, é "Maria" (nenhum outro apelido)
  assert.deepStrictEqual(linhasDe('alemao').filter((x) => /\b(mor|benzinho|querida|gata|nega|princesa)\b/i.test(x.t)).map((x) => x.t), []);
  assert.ok(linhasDe('alemao').some((x) => /\bMaria\b/.test(x.t)), 'o Lucas nunca chama a Maria pelo nome');
});

test('Cânone: todos chamam o bebê só de "Sirius" (nenhum apelido)', () => {
  const apelidos = /(?<!\p{L})(nenê|neném|bebezinho|bebê|garotão|campeão|filhão|netinho|pequenininho|princeso|gordinho)(?!\p{L})/iu;
  assert.deepStrictEqual(cenas.flatMap((c) => c.f.filter((l) => l[0] !== 'sirius' && apelidos.test(l[1])).map((l) => l[1])), []);
});

test('Sirius: só balbucios 8-bit — nenhuma palavra adulta (todas as falas e as variações sorteadas)', () => {
  const bal = /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ .!?…-]+$/;
  for (const x of linhasDe('sirius')) {
    const t = x.t;
    assert.ok(/^\{balbucio:\w+\}$/.test(t) || (bal.test(t) && t.length <= 14), x.c.id + ': "' + t + '"');
  }
  const n = new Narrador({ modo: 2, random: new Random(4).next.bind(new Random(4)) });
  const r = new Random(9);
  n.random = () => r.next();
  for (const humor of Object.keys(Narrador.BALBUCIOS)) for (let i = 0; i < 200; i++) {
    const t = n.balbucio(humor);
    assert.ok(bal.test(t) && t.length <= 14, humor + ': "' + t + '"');
  }
});

test('Maria não pesca: nenhuma fala dela com ação de pesca em primeira pessoa', () => {
  const pesca = /\b(peguei|pesquei|fisguei|vou arremessar|arremessei|minha vara|minha linha|meu peixe|minha boia|meu anzol)\b/i;
  assert.deepStrictEqual(linhasDe('maria').filter((x) => pesca.test(x.t)).map((x) => x.t), []);
});

test('Modo 1 jogador: conversas que falam da pescaria de alguém exigem que essa pessoa esteja pescando', () => {
  const desempenho = /\b(peguei|pesquei|meu placar|minha boia|minha linha|você não pega|você pesca|seu placar)\b/i;
  const ruins = [];
  for (const c of cenas.filter((x) => x.g === 'silencio' && !x.m)) {
    const q = c.q || {};
    for (const [quem, t] of c.f) {
      if (!desempenho.test(t)) continue;
      const alvoOk = q.alemaoPesca || q.alePesca || q.protagonista || q.modo === 2;
      if (!alvoOk) ruins.push(c.id + ' ' + quem + ': ' + t);
    }
  }
  assert.deepStrictEqual(ruins, []);
});

// ================================================================= quantidade e variedade
const GRUPO = { captura: 'captura', fracasso: 'fracasso', arremesso: 'arremesso e lagoa', regiao: 'arremesso e lagoa', isca: 'arremesso e lagoa',
  espera: 'espera', mordida: 'mordida e briga', briga: 'mordida e briga', espontanea: 'conversas', retomada: 'conversas', sirius: 'Sirius (choro e sono)', 'sirius-sono': 'Sirius (choro e sono)',
  mundo: 'mundo e pontos', clima: 'mundo e pontos', ponto: 'mundo e pontos' };
const tabela = {};
for (const c of cenas) {
  const g = GRUPO[Narrador.CATEGORIA[c.g]] || 'outros';
  for (const [q] of c.f) {
    const p = q === 'S' || q === 'O' ? 'papel' : q;
    tabela[p] = tabela[p] || {};
    tabela[p][g] = (tabela[p][g] || 0) + 1;
  }
}
test('Variedade: pelo menos 15 falas de Lucas, ALE e Maria em cada categoria principal', () => {
  const faltas = [];
  for (const p of ['alemao', 'ale', 'maria']) for (const g of ['captura', 'fracasso', 'arremesso e lagoa', 'espera', 'mordida e briga', 'conversas']) {
    if ((tabela[p][g] || 0) < 15) faltas.push(p + ' / ' + g + ': ' + (tabela[p][g] || 0));
  }
  assert.deepStrictEqual(faltas, []);
});
test('Variedade: cenas específicas do modo 1 e do modo 2, e conversas com 3 ou 4 personagens', () => {
  assert.ok(cenas.filter((c) => c.m === 1).length >= 15, 'modo 1: ' + cenas.filter((c) => c.m === 1).length);
  assert.ok(cenas.filter((c) => c.m === 2).length >= 40, 'modo 2: ' + cenas.filter((c) => c.m === 2).length);
  const multi = cenas.filter((c) => new Set(c.f.map((l) => l[0])).size >= 3).length;
  assert.ok(multi >= 30, 'cenas com 3+ personagens: ' + multi);
  const comSirius = cenas.filter((c) => c.f.some((l) => l[0] === 'sirius')).length;
  assert.ok(comSirius >= 40, 'cenas com o Sirius: ' + comSirius);
});

// ================================================================= simulação com a pesca real
/** Pescaria simulada (2 ou 1 jogador) com jogadores virtuais; o Narrador recebe os eventos reais. */
function simular(opts) {
  const minutos = opts.minutos || 20;
  const rb = new Random(opts.semente || 7), rn = new Random((opts.semente || 7) * 13 + 1), rc = new Random((opts.semente || 7) * 31 + 5);
  let now = 0;
  const s = new SessaoJogo({ config: createConfig(), seed: opts.semente || 7, now: () => now,
    jogo: { modo: opts.modo || 2, personagens: opts.personagens || { P1: 'alemao', P2: 'ale' }, iscas: { P1: 'minhoca', P2: 'massa' }, regioes: true } });
  const n = opts.semNarrador ? null : new Narrador({ modo: opts.modo || 2, personagens: opts.personagens || { P1: 'alemao', P2: 'ale' }, random: () => rn.next(), dados: Dados });
  if (n) s.onEvent((e) => n.evento(e, s.players, e.tipo === 'captura' ? { novo: rc.next() < 0.1, recorde: false } : undefined));
  const ids = (opts.modo || 2) === 1 ? ['P1'] : ['P1', 'P2'];
  const bot = {};
  for (const id of ids) bot[id] = { prox: 500 + rb.next() * 1500, acao: 'idle', estilo: id === 'P1' ? [0.82, 0.35] : [0.9, 0.3] };
  const fim = minutos * 60000;
  while (now < fim) {
    now += STEP;
    for (const id of ids) {
      const p = s.players[id], b = bot[id];
      if (p.state === 'FIGHTING' && b.acao === 'briga') {
        const [hi, lo] = b.estilo;
        if (p.pressed && p.tension > hi) p.release(now, {});
        else if (!p.pressed && p.tension < lo) p.press(now);
        continue;
      }
      if (now < b.prox) continue;
      switch (p.state) {
        case 'IDLE':
          if (b.acao === 'carregando') break;
          p.press(now);
          b.acao = 'carregando';
          b.prox = now + (rb.next() < 0.06 ? 120 : 300 + rb.next() * 1300);   // às vezes um toque curto
          continue;
        case 'CHARGING':
          p.release(now, {}); b.acao = 'idle'; b.prox = now + 200; continue;
        case 'WAITING':
          if (rb.next() < 0.004) { p.press(now); b.prox = now + 60; b.acao = 'toque'; continue; }
          if (b.acao === 'toque') { p.release(now, {}); b.acao = 'idle'; }
          break;
        case 'BITE':
          if (b.acao !== 'reagindo') { b.acao = 'reagindo'; b.prox = now + (rb.next() < 0.1 ? 1300 : 200 + rb.next() * 600); continue; }
          p.press(now); b.acao = 'briga'; b.estilo = rb.next() < 0.2 ? [0.99, 0.15] : (id === 'P1' ? [0.8, 0.35] : [0.88, 0.3]);
          continue;
        case 'CAUGHT': case 'ESCAPED': case 'LINE_BROKEN':
          if (p.pressed) p.release(now, {});
          b.acao = 'idle'; b.prox = now + 1200 + rb.next() * 1200;
          continue;
        default: break;
      }
      if (p.state !== 'FIGHTING' && p.pressed && b.acao === 'briga') { p.release(now, {}); b.acao = 'idle'; }
    }
    s.update(now);
    if (n) n.atualizar(STEP, s.players);
  }
  return { s, n, log: s.log.map((e) => JSON.stringify(e)), stats: ids.map((id) => s.players[id].stats) };
}

const sim2 = simular({ modo: 2, minutos: 30, semente: 21 });
const reg2 = sim2.n.registro;
test('Simulação (30 min, 2 jogadores): a família fala de verdade, sem exagero (média de 1 a 8 falas por minuto)', () => {
  const porMin = reg2.length / 30;
  assert.ok(porMin >= 1 && porMin <= 8, porMin.toFixed(2) + ' falas/min');
  const quem = new Set(reg2.map((r) => r.pessoa));
  assert.deepStrictEqual([...quem].sort(), ['ale', 'alemao', 'maria', 'sirius'], 'todos aparecem: ' + [...quem]);
});

function invariantes(reg, nome) {
  // 1) nunca duas falas ao mesmo tempo
  for (let i = 1; i < reg.length; i++) assert.ok(reg[i].t >= reg[i - 1].fim - 1e-6, nome + ': falas sobrepostas em ' + reg[i].t + ' (' + reg[i - 1].texto + ' / ' + reg[i].texto + ')');
  // 2) a mesma frase nunca duas vezes seguidas
  for (let i = 1; i < reg.length; i++) assert.ok(reg[i].modelo !== reg[i - 1].modelo || reg[i].pessoa === 'sirius', nome + ': repetiu "' + reg[i].texto + '"');
  // 3) sem fila de atrasados: toda cena começa no máximo 2,6 s depois do acontecimento real
  for (const r of reg.filter((x) => x.primeira)) assert.ok(r.t - r.disparo <= 2600, nome + ': cena ' + r.cena + ' começou ' + (r.t - r.disparo) + ' ms depois');
  // 4) no máximo 8 falas de prioridade comum por minuto (janela móvel)
  const comuns = reg.filter((r) => r.p > 2).map((r) => r.t);
  for (let i = 0; i < comuns.length; i++) assert.ok(comuns.filter((t) => t >= comuns[i] && t < comuns[i] + 60000).length <= Narrador.MAX_FALAS_MINUTO + 3, nome + ': falas demais num minuto');
  // 5) Sirius dormindo não balbucia; balbucio só acordado (exceto as cenas do choro)
  for (const r of reg.filter((x) => x.pessoa === 'sirius' && !x.c)) assert.strictEqual(r.sirius, 'acordado', nome + ': balbucio com o Sirius ' + r.sirius);
  // 6) enquanto o Sirius chora, a Maria só fala nas cenas em que cuida dele
  for (const r of reg.filter((x) => x.pessoa === 'maria' && ['inquieto', 'chorando', 'acalmando'].includes(x.sirius))) assert.ok(r.c, nome + ': Maria comentou a pescaria durante o choro: ' + r.texto);
  // 7) intervalo mínimo por personagem (cenas comuns)
  const ultimo = {};
  for (const r of reg.filter((x) => x.primeira)) {
    if (r.p > 2 && ultimo[r.pessoa] != null) assert.ok(r.t - ultimo[r.pessoa] >= Narrador.POR_PESSOA[r.pessoa] - 1, nome + ': ' + r.pessoa + ' começou cenas com ' + (r.t - ultimo[r.pessoa]) + ' ms');
    ultimo[r.pessoa] = r.t;
  }
}
test('Invariantes (2 jogadores): uma fala por vez, sem repetição seguida, sem fila atrasada, ritmo, Sirius e Maria', () => invariantes(reg2, '2J'));

test('Simulação: as categorias aparecem de verdade (capturas, fracassos, briga, espera, conversas, Sirius)', () => {
  const cats = new Set(reg2.map((r) => GRUPO[Narrador.CATEGORIA[r.g]]));
  for (const c of ['captura', 'fracasso', 'mordida e briga', 'conversas', 'Sirius (choro e sono)']) assert.ok(cats.has(c), 'faltou ' + c + ' em ' + [...cats]);
});

test('Sirius: chorou na meia hora, nunca antes de 75 s, com pelo menos 4 min entre os choros', () => {
  const choros = sim2.n.sirius.historico.filter((h) => h.para === 'inquieto').map((h) => h.t);
  assert.ok(choros.length >= 1 && choros.length <= 8, choros.length + ' choros');
  assert.ok(choros[0] >= 75000, 'primeiro aos ' + choros[0]);
  for (let i = 1; i < choros.length; i++) assert.ok(choros[i] - choros[i - 1] >= 240000, 'intervalo ' + (choros[i] - choros[i - 1]));
  const dormiu = sim2.n.sirius.historico.some((h) => h.para === 'dormindo');
  assert.ok(dormiu, 'o Sirius também dormiu');
});

test('A narrativa NÃO altera a pescaria: mesma partida com e sem o Narrador → registros e estatísticas idênticos', () => {
  const a = simular({ modo: 2, minutos: 12, semente: 5, semNarrador: true });
  const b = simular({ modo: 2, minutos: 12, semente: 5 });
  assert.ok(a.log.length > 300, a.log.length + ' eventos');
  assert.deepStrictEqual(b.log, a.log);
  assert.deepStrictEqual(b.stats, a.stats);
  assert.ok(b.n.registro.length > 10, 'houve diálogo: ' + b.n.registro.length);
});

const sim1 = simular({ modo: 1, minutos: 20, semente: 3, personagens: { P1: 'ale' } });
test('Modo 1 jogador (ALE pescando): nenhuma cena exclusiva do modo 2; Lucas e Maria comentam; invariantes', () => {
  const r = sim1.n.registro;
  assert.ok(r.length >= 15, r.length + ' falas');
  assert.ok(r.every((x) => x.m !== 2), 'cena do modo 2 no modo 1: ' + (r.find((x) => x.m === 2) || {}).texto);
  assert.ok(r.some((x) => x.pessoa === 'alemao') && r.some((x) => x.pessoa === 'maria'), 'observadores falaram');
  invariantes(r, '1J');
});
test('Modo 1 jogador (Alemão pescando): o mesmo, com o ALE assistindo', () => {
  const r = simular({ modo: 1, minutos: 15, semente: 8, personagens: { P1: 'alemao' } }).n.registro;
  assert.ok(r.every((x) => x.m !== 2));
  assert.ok(r.some((x) => x.pessoa === 'ale'));
  invariantes(r, '1J-A');
});

// ================================================================= prioridades, interrupção e fila
function narradorSolto(semente) {
  const r = new Random(semente || 1);
  const n = new Narrador({ modo: 2, random: () => r.next(), dados: Dados });
  const players = { P1: { state: 'WAITING', regiao: 'aberta', iscaNaAgua: 'minhoca', lastResult: { pesoKg: 1 } }, P2: { state: 'WAITING', regiao: 'aberta', iscaNaAgua: 'minhoca', lastResult: { pesoKg: 1 } } };
  return { n, players, avancar: (ms) => { for (let t = 0; t < ms; t += STEP) n.atualizar(STEP, players); } };
}

test('Prioridade: um fracasso INTERROMPE uma conversa espontânea em andamento (sem esperar)', () => {
  let ok = false;
  for (let sem = 1; sem < 40 && !ok; sem++) {
    const { n, players, avancar } = narradorSolto(sem);
    n.sirius.estado = 'dormindo'; n.sirius.ate = Infinity;   // sem choro neste teste
    avancar(70000);
    if (!n.atual || n.atual.cena.p !== 6) continue;
    const antes = n.atual.cena.id;
    n.evento({ tipo: 'estado', jogador: 'P1', de: 'FIGHTING', para: 'LINE_BROKEN' }, players);
    n.evento({ tipo: 'linha-rompida', jogador: 'P1' }, players);
    if (!n.atual || n.atual.cena.id === antes) continue;     // a chance de comentar não saiu: tenta outra semente
    assert.strictEqual(n.atual.cena.g, 'rompeu');
    ok = true;
  }
  assert.ok(ok, 'cenário não reproduzido');
});

test('Fila: um comentário comum durante uma cena importante é DESCARTADO (não vira comentário atrasado)', () => {
  const { n, players, avancar } = narradorSolto(3);
  avancar(8000);
  n.forcarSirius('choro');                                   // cena de prioridade 1 em andamento
  avancar(200);
  assert.ok(n.atual && n.atual.cena.p === 1);
  n.evento({ tipo: 'arremesso', jogador: 'P1', distancia: 29, forca: 0.99 }, players);
  assert.ok(!n.pendente || n.pendente.cena.g !== 'arremesso', 'arremesso guardado na fila');
});

test('Fila: no máximo UMA cena pendente, que expira em 2,5 s', () => {
  const { n, players, avancar } = narradorSolto(5);
  avancar(8000);
  n.forcarSirius('choro');
  avancar(300);
  for (let i = 0; i < 5; i++) {
    n.evento({ tipo: 'estado', jogador: 'P2', de: 'FIGHTING', para: 'LINE_BROKEN' }, players);
    n.evento({ tipo: 'linha-rompida', jogador: 'P2' }, players);
  }
  assert.ok(!n.pendente || typeof n.pendente === 'object');
  const ate = n.pendente ? n.pendente.ate : null;
  avancar(Narrador.PENDENTE_MS + 400);
  if (ate != null) assert.ok(n.pendente === null || n.pendente.ate !== ate, 'pendente não expirou');
});

test('Pausa: com dt = 0 o narrador congela (a fala atual não avança nem some)', () => {
  const { n, players, avancar } = narradorSolto(2);
  avancar(8000);
  n.forcarSirius('choro');
  avancar(300);
  const antes = JSON.stringify([n.t, n.linha() && n.linha().texto]);
  for (let i = 0; i < 500; i++) n.atualizar(0, players);
  assert.strictEqual(JSON.stringify([n.t, n.linha() && n.linha().texto]), antes);
});

// ================================================================= Sirius
test('Sirius: dormindo não chora nem pode balbuciar; barulho às vezes acorda; choro dura pouco', () => {
  const r = new Random(11);
  const s = new Sirius({ random: () => r.next() });
  s.forcar('dormindo');
  for (let i = 0; i < 1000; i++) s.update(STEP);
  assert.ok(s.dormindo && !s.podeChorar());
  let acordou = 0;
  for (let i = 0; i < 200; i++) { const s2 = new Sirius({ random: () => r.next() }); s2.forcar('dormindo'); if (s2.barulho(1).length) acordou++; }
  assert.ok(acordou > 20 && acordou < 120, acordou + ' de 200 acordaram com barulho máximo');
  const s3 = new Sirius({ random: () => r.next() });
  s3.forcar('choro');
  let t = 0;
  while (s3.chorando && t < 30000) { s3.update(STEP); t += STEP; }
  assert.ok(t >= 8000 && t <= 15500, 'choro durou ' + t + ' ms');
});

// ================================================================= Operação Nova Identidade: mordida, retomada, mundo
const conversaLonga = (n) => n.cenas.find((c) => c.g === 'silencio' && c.f.length === 4 && !c.q && !c.m && !c.f.some((l) => l[0] === 'sirius'));
const limpar = (n) => { n.atual = null; n.fimUltima = n.t - 20000; n.inicios = []; n.ultimaPessoa = {}; n.ultimaCategoria = {}; };

test('Mordida: corta a conversa solta em andamento (a pescaria vem primeiro) e guarda o resto', () => {
  const { n, players, avancar } = narradorSolto(2);
  n.sirius.estado = 'dormindo'; n.sirius.ate = Infinity;
  avancar(5000);
  const conversa = conversaLonga(n);
  n.forcarCena(conversa.id);
  avancar(300);
  assert.ok(n.atual && n.atual.cena.id === conversa.id, 'a conversa não começou');
  players.P1.state = 'BITE';
  n.evento({ tipo: 'mordida', jogador: 'P1' }, players);
  assert.ok(!n.atual || n.atual.cena.id !== conversa.id, 'a conversa continuou depois da mordida');
  assert.ok(n.retomar && n.retomar.cena.id === conversa.id && n.retomar.proxima === 0, 'não guardou para retomar: ' + JSON.stringify(n.retomar && n.retomar.proxima));
  const ult = n.registro.filter((r) => r.cena === conversa.id).pop();
  assert.ok(ult && ult.cortada, 'a fala cortada não ficou marcada');
});

test('Retomada: quando a calma volta, a conversa cortada continua ("Como eu ia dizendo...")', () => {
  let ok = false, visto = '';
  for (let sem = 1; sem <= 10 && !ok; sem++) {
    const { n, players, avancar } = narradorSolto(sem);
    n.sirius.estado = 'dormindo'; n.sirius.ate = Infinity;
    avancar(5000);
    const conversa = conversaLonga(n);
    n.forcarCena(conversa.id);
    avancar(300);
    n.random = () => 0.01;                                    // a retomada acontece sempre que possível
    players.P1.state = 'BITE'; n.evento({ tipo: 'mordida', jogador: 'P1' }, players);
    avancar(800); players.P1.state = 'FIGHTING'; avancar(4000); players.P1.state = 'WAITING';
    avancar(20000);
    const ret = n.registro.filter((r) => r.g === 'retomada');
    visto = JSON.stringify(ret.map((r) => r.pessoa + ': ' + r.texto));
    ok = ret.length >= 2 && /dizendo|parou|assunto|tava/i.test(ret[0].texto) && ret[1].modelo === conversa.f[0][1];
  }
  assert.ok(ok, 'sem retomada: ' + visto);
});

test('Retomada: depois de 60 s a conversa cortada fica para trás (nada de assunto velho)', () => {
  const { n, players, avancar } = narradorSolto(4);
  n.sirius.estado = 'dormindo'; n.sirius.ate = Infinity;
  avancar(5000);
  n.forcarCena(conversaLonga(n).id);
  avancar(300);
  players.P1.state = 'BITE'; n.evento({ tipo: 'mordida', jogador: 'P1' }, players);
  players.P1.state = 'FIGHTING'; avancar(65000);                 // briga longa: sem calma
  players.P1.state = 'WAITING'; avancar(15000);
  assert.ok(!n.retomar, 'continuou guardada');
  assert.ok(!n.registro.some((r) => r.g === 'retomada'), 'retomou um assunto de mais de 1 minuto');
});

test('Fisgada: reação curta logo depois da fala anterior (não espera o intervalo das conversas)', () => {
  let ok = 0;
  for (let sem = 1; sem <= 10; sem++) {
    const { n, players, avancar } = narradorSolto(sem);
    n.sirius.estado = 'dormindo'; n.sirius.ate = Infinity;
    avancar(3000);
    limpar(n); n.fimUltima = n.t - 800;                          // uma fala terminou há 0,8 s
    n.random = () => 0.01;
    players.P1.state = 'FIGHTING';
    n.evento({ tipo: 'fisgada', jogador: 'P1', reacaoMs: 400 }, players);
    if (n.atual && n.atual.cena.g === 'fisgada') ok++;
  }
  assert.strictEqual(ok, 10);
});

test('Mundo: peixe saltando perto da boia rende comentário; com o Sirius dormindo, ninguém balbucia', () => {
  let comentou = 0, balbucioDormindo = 0;
  for (let sem = 1; sem <= 30; sem++) {
    const { n, players, avancar } = narradorSolto(sem);
    n.forcarSirius('dormindo'); n.sirius.ate = Infinity;
    avancar(3000);
    limpar(n);
    n.eventoMundo({ tipo: 'salto', perto: 'P1' });
    if (n.atual && n.atual.cena.g === 'salto') comentou++;
    avancar(8000);
    balbucioDormindo += n.registro.filter((r) => r.pessoa === 'sirius' && r.sirius === 'dormindo').length;
  }
  assert.ok(comentou >= 8 && comentou <= 25, 'comentários: ' + comentou + ' de 30 (chance de 50 %)');
  assert.strictEqual(balbucioDormindo, 0);
});

test('Pontos de interesse: a boia que pousa no ponto rende comentário próprio (no lugar do comentário do lugar)', () => {
  let ok = 0;
  for (let sem = 1; sem <= 20; sem++) {
    const { n, players, avancar } = narradorSolto(sem);
    n.sirius.estado = 'dormindo'; n.sirius.ate = Infinity;
    avancar(3000);
    limpar(n);
    Object.assign(players.P1, { zona: 'rasa', regiao: 'margem', pontoNaAgua: { tipo: 'bolhas', espera: 0.65 } });
    n.evento({ tipo: 'boia-na-agua', jogador: 'P1' }, players);
    if (n.atual && n.atual.cena.g === 'ponto-acerto') ok++;
  }
  assert.ok(ok >= 7, ok + ' de 20 (chance de 60 %)');
});

test('Chuva e entardecer: o narrador sabe que chove e comenta o começo, o fim e o pôr do sol', () => {
  const { n, players, avancar } = narradorSolto(5);
  n.sirius.estado = 'dormindo'; n.sirius.ate = Infinity;
  avancar(3000); limpar(n);
  n.eventoMundo({ tipo: 'chuva-inicio' });
  assert.ok(n.chovendo && n.atual && n.atual.cena.g === 'chuva-inicio', 'sem comentário da chuva');
  avancar(20000); limpar(n);
  n.eventoMundo({ tipo: 'chuva-fim' });
  assert.ok(!n.chovendo, 'continua chovendo');
  avancar(20000); limpar(n);
  n.eventoMundo({ tipo: 'entardecer' });
  assert.ok(n.atual && n.atual.cena.g === 'entardecer', 'sem comentário do entardecer');
});

console.log('\nFalas por personagem e categoria:');
const gs = ['captura', 'fracasso', 'arremesso e lagoa', 'espera', 'mordida e briga', 'conversas', 'Sirius (choro e sono)', 'mundo e pontos'];
console.log('  ' + 'pessoa'.padEnd(8) + gs.map((g) => g.slice(0, 13).padStart(14)).join('') + '     total');
for (const p of ['alemao', 'ale', 'maria', 'sirius']) {
  const v = tabela[p] || {};
  console.log('  ' + p.padEnd(8) + gs.map((g) => String(v[g] || 0).padStart(14)).join('') + String(Object.values(v).reduce((a, b) => a + b, 0)).padStart(10));
}
console.log('\n' + passed + ' de ' + (passed + failed) + ' testes passaram.');
process.exit(failed ? 1 : 0);
