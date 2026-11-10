/*
 * Testes automatizados da lógica de zonas (sem Phaser, sem navegador).
 * Executar a partir da pasta do protótipo:   node tests/logica.test.js
 * Requer apenas o Node.js; não usa nenhuma biblioteca externa.
 */
'use strict';
const assert = require('assert');
const path = require('path');
require(path.join(__dirname, '..', 'src', 'input', 'PlayerZone.js'));
const TouchRouter = require(path.join(__dirname, '..', 'src', 'input', 'TouchRouter.js'));

const LARGURA = 1000;        // tela de 1000 px: P1 em x < 500, P2 em x >= 500
const ESQ = 200, DIR = 800;

function novoRouter() {
  let relogio = 0;
  const r = new TouchRouter({ now: () => relogio, holdThresholdMs: 200 });
  r.setWidth(LARGURA);
  r.avancar = (ms) => { relogio += ms; r.update(relogio); return relogio; };
  r.agora = () => relogio;
  return r;
}

const testes = [];
function teste(nome, fn) { testes.push({ nome, fn }); }

// 1. Jogador 1 sozinho
teste('1. P1 sozinho: toque rápido na esquerda pertence a P1', () => {
  const r = novoRouter();
  const ini = r.down({ key: 1, identifier: 10, x: ESQ, time: r.agora() });
  assert.strictEqual(ini.zona, 'P1');
  r.avancar(80);
  const fim = r.up({ key: 1, x: ESQ, time: r.agora() });
  assert.strictEqual(fim.zona, 'P1');
  assert.strictEqual(fim.classificacao, 'toque');
  assert.strictEqual(r.zones.P1.counters.toques, 1);
  assert.strictEqual(r.zones.P2.counters.inicios, 0);
});

// 2. Jogador 2 sozinho
teste('2. P2 sozinho: toque na direita pertence a P2', () => {
  const r = novoRouter();
  assert.strictEqual(r.down({ key: 1, identifier: 11, x: DIR, time: 0 }).zona, 'P2');
  r.avancar(50);
  r.up({ key: 1, x: DIR, time: r.agora() });
  assert.strictEqual(r.zones.P2.counters.toques, 1);
  assert.strictEqual(r.zones.P1.counters.inicios, 0);
});

// 3. Dois jogadores ao mesmo tempo
teste('3. Toques simultâneos: cada um na sua zona, ambos contados', () => {
  const r = novoRouter();
  for (let i = 0; i < 20; i++) {
    const t = r.agora();
    r.down({ key: 1, identifier: 100 + i, x: ESQ, time: t });
    r.down({ key: 2, identifier: 200 + i, x: DIR, time: t });
    r.avancar(60);
    r.up({ key: 2, x: DIR, time: r.agora() });
    r.up({ key: 1, x: ESQ, time: r.agora() });
    r.avancar(100);
  }
  assert.strictEqual(r.zones.P1.counters.toques, 20);
  assert.strictEqual(r.zones.P2.counters.toques, 20);
  assert.strictEqual(r.errors.length, 0);
});

// 4. Um segura enquanto o outro toca repetidamente
teste('4. P1 segura enquanto P2 toca 20 vezes: segurar de P1 não é interrompido', () => {
  const r = novoRouter();
  r.down({ key: 1, identifier: 1, x: ESQ, time: 0 });
  for (let i = 0; i < 20; i++) {
    r.down({ key: 2, identifier: 50 + i, x: DIR, time: r.agora() });
    r.avancar(40);
    r.up({ key: 2, x: DIR, time: r.agora() });
    r.avancar(40);
    assert.strictEqual(r.ownerOf(1), 'P1', 'P1 perdeu o toque na repetição ' + i);
  }
  assert.strictEqual(r.zones.P1.getState(r.agora()), 'segurando');
  assert.strictEqual(r.zones.P2.counters.toques, 20);
  const fim = r.up({ key: 1, x: ESQ, time: r.agora() });
  assert.strictEqual(fim.classificacao, 'segurar');
  assert.strictEqual(fim.duracao, 1600);
});

// 5. Dois segurando
teste('5. Os dois seguram juntos por 10 s', () => {
  const r = novoRouter();
  r.down({ key: 1, identifier: 1, x: ESQ, time: 0 });
  r.down({ key: 2, identifier: 2, x: DIR, time: 0 });
  for (let i = 0; i < 100; i++) r.avancar(100);
  assert.strictEqual(r.zones.P1.getState(r.agora()), 'segurando');
  assert.strictEqual(r.zones.P2.getState(r.agora()), 'segurando');
  const segurarInicios = r.log.filter(e => e.tipo === 'segurar-inicio');
  assert.strictEqual(segurarInicios.length, 2, 'cada dedo deve gerar um único "segurar-inicio"');
  r.up({ key: 1, x: ESQ, time: r.agora() });
  r.up({ key: 2, x: DIR, time: r.agora() });
  assert.strictEqual(r.zones.P1.counters.segurares, 1);
  assert.strictEqual(r.zones.P2.counters.segurares, 1);
});

// 6. Arrastar de uma zona para outra
teste('6. Arrastar da esquerda para a direita: posse continua com P1', () => {
  const r = novoRouter();
  r.down({ key: 1, identifier: 1, x: ESQ, time: 0 });
  const cruzou = r.move({ key: 1, x: DIR, time: 100 });
  assert.strictEqual(cruzou.tipo, 'cruzou');
  assert.strictEqual(r.ownerOf(1), 'P1');
  assert.strictEqual(r.zones.P2.activeCount, 0, 'P2 não pode receber o dedo de P1');
  assert.strictEqual(r.zones.P2.getState(100), 'livre');
  const fim = r.up({ key: 1, x: DIR, time: 300 });
  assert.strictEqual(fim.zona, 'P1');
  assert.strictEqual(fim.zonaFim, 'P2');
  assert.strictEqual(fim.cruzou, true);
  assert.strictEqual(r.zones.P2.counters.inicios + r.zones.P2.counters.toques, 0);
});

teste('6b. Arrastar e voltar gera "cruzou" e "voltou" só uma vez cada', () => {
  const r = novoRouter();
  r.down({ key: 3, identifier: 3, x: DIR, time: 0 });
  r.move({ key: 3, x: ESQ, time: 10 });
  r.move({ key: 3, x: ESQ - 50, time: 20 });
  r.move({ key: 3, x: DIR, time: 30 });
  const tipos = r.log.map(e => e.tipo);
  assert.deepStrictEqual(tipos.filter(t => t === 'cruzou' || t === 'voltou'), ['cruzou', 'voltou']);
  assert.strictEqual(r.ownerOf(3), 'P2');
});

// 7. Soltar um dedo enquanto outro continua
teste('7. Soltar um dedo enquanto o outro continua pressionado (zonas diferentes)', () => {
  const r = novoRouter();
  r.down({ key: 1, identifier: 1, x: ESQ, time: 0 });
  r.down({ key: 2, identifier: 2, x: DIR, time: 0 });
  r.avancar(300);
  r.up({ key: 2, x: DIR, time: r.agora() });
  assert.strictEqual(r.zones.P2.getState(r.agora()), 'livre');
  assert.strictEqual(r.zones.P1.getState(r.agora()), 'segurando');
});

teste('7b. Dois dedos na mesma zona: zona só fica livre quando o último sai', () => {
  const r = novoRouter();
  r.down({ key: 1, identifier: 1, x: ESQ, time: 0 });
  r.down({ key: 2, identifier: 2, x: ESQ + 50, time: 10 });
  assert.strictEqual(r.zones.P1.activeCount, 2);
  r.up({ key: 1, x: ESQ, time: 50 });
  assert.notStrictEqual(r.zones.P1.getState(50), 'livre');
  r.up({ key: 2, x: ESQ, time: 60 });
  assert.strictEqual(r.zones.P1.getState(60), 'livre');
  assert.strictEqual(r.zones.P1.counters.maxDedos, 2);
});

// 8. Interromper a página e retornar
teste('8. Interrupção (perda de foco) encerra tudo; nada fica pressionado', () => {
  const r = novoRouter();
  r.down({ key: 1, identifier: 1, x: ESQ, time: 0 });
  r.down({ key: 2, identifier: 2, x: DIR, time: 0 });
  r.avancar(500);
  const afetados = r.cancelAll('perda de foco', r.agora());
  assert.strictEqual(afetados, 2);
  assert.strictEqual(r.zones.P1.getState(r.agora()), 'livre');
  assert.strictEqual(r.zones.P2.getState(r.agora()), 'livre');
  assert.strictEqual(r.zones.P1.counters.cancelamentos, 1);
  // ao voltar, o fim tardio do dedo antigo é absorvido: sem estado fantasma e sem erro falso
  assert.strictEqual(r.up({ key: 1, x: ESQ, time: r.agora() }), null);
  assert.strictEqual(r.zones.P1.getState(r.agora()), 'livre');
  assert.strictEqual(r.errors.length, 0);
  // e um novo toque funciona normalmente
  assert.strictEqual(r.down({ key: 1, identifier: 9, x: ESQ, time: r.agora() }).zona, 'P1');
});

// 9. Cancelar toques
teste('9. Cancelamento do sistema: toque contado como cancelado, zona liberada', () => {
  const r = novoRouter();
  r.down({ key: 1, identifier: 1, x: ESQ, time: 0 });
  r.avancar(400);
  const fim = r.up({ key: 1, x: ESQ, time: r.agora(), canceled: true });
  assert.strictEqual(fim.tipo, 'cancelado');
  assert.strictEqual(fim.classificacao, 'cancelado');
  assert.strictEqual(r.zones.P1.counters.cancelamentos, 1);
  assert.strictEqual(r.zones.P1.counters.segurares, 0);
  assert.strictEqual(r.zones.P1.getState(r.agora()), 'livre');
});

teste('9b. Rede de segurança: toque órfão é liberado e registrado como erro', () => {
  const r = novoRouter();
  r.down({ key: 1, identifier: 1, x: ESQ, time: 0 });
  r.down({ key: 2, identifier: 2, x: DIR, time: 0 });
  const corrigidos = r.reconcile(key => key === 2, 100);   // ponteiro 1 sumiu
  assert.strictEqual(corrigidos, 1);
  assert.strictEqual(r.zones.P1.getState(100), 'livre');
  assert.strictEqual(r.zones.P2.getState(100), 'pressionado');
  assert.strictEqual(r.errors[0].codigo, 'orfao');
});

teste('9c. Início duplicado do mesmo ponteiro encerra o anterior e registra erro', () => {
  const r = novoRouter();
  r.down({ key: 1, identifier: 1, x: ESQ, time: 0 });
  r.down({ key: 1, identifier: 2, x: DIR, time: 50 });
  assert.strictEqual(r.errors[0].codigo, 'inicio-duplicado');
  assert.strictEqual(r.zones.P1.activeCount, 0);
  assert.strictEqual(r.ownerOf(1), 'P2');
});

teste('9e. Fim de toque nunca registrado gera erro "fim-desconhecido"', () => {
  const r = novoRouter();
  const e = r.up({ key: 4, x: ESQ, time: 10 });
  assert.strictEqual(e.tipo, 'erro');
  assert.strictEqual(e.codigo, 'fim-desconhecido');
});

teste('9d. Toque iniciado no botão do menu é ignorado sem erro', () => {
  const r = novoRouter();
  r.ignore(7);
  assert.strictEqual(r.up({ key: 7, x: ESQ, time: 10 }), null);
  assert.strictEqual(r.errors.length, 0);
});

// 10. Toques rápidos e sustentados
teste('10. Limiar toque × segurar (200 ms)', () => {
  const r = novoRouter();
  const casos = [[50, 'toque'], [199, 'toque'], [200, 'segurar'], [1500, 'segurar']];
  let k = 1;
  for (const [ms, esperado] of casos) {
    const t = r.agora();
    r.down({ key: k, identifier: k, x: ESQ, time: t });
    r.avancar(ms);
    const fim = r.up({ key: k, x: ESQ, time: t + ms });
    assert.strictEqual(fim.classificacao, esperado, ms + ' ms deveria ser ' + esperado);
    k++;
  }
});

teste('10b. Limiar ajustável', () => {
  const r = novoRouter();
  r.setHoldThreshold(300);
  r.down({ key: 1, identifier: 1, x: ESQ, time: 0 });
  assert.strictEqual(r.up({ key: 1, x: ESQ, time: 250 }).classificacao, 'toque');
});

teste('Sequência: cada fim aponta para a sequência do seu início', () => {
  const r = novoRouter();
  const a = r.down({ key: 1, identifier: 1, x: ESQ, time: 0 });
  const b = r.down({ key: 2, identifier: 2, x: DIR, time: 5 });
  const fimB = r.up({ key: 2, x: DIR, time: 30 });
  const fimA = r.up({ key: 1, x: ESQ, time: 40 });
  assert.strictEqual(fimA.inicioSeq, a.seq);
  assert.strictEqual(fimB.inicioSeq, b.seq);
  assert.ok(fimB.seq > b.seq && fimA.seq > fimB.seq);
});

let falhas = 0;
for (const { nome, fn } of testes) {
  try {
    fn();
    console.log('  ✓ ' + nome);
  } catch (err) {
    falhas++;
    console.log('  ✗ ' + nome + '\n      ' + err.message);
  }
}
console.log('\n' + (testes.length - falhas) + ' de ' + testes.length + ' testes passaram.');
process.exitCode = falhas ? 1 : 0;
