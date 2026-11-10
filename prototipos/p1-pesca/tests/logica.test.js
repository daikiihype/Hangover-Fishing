/*
 * Testes automatizados da lógica de pesca do P1 (sem Phaser, sem navegador).
 * Executar a partir da pasta do protótipo:   node tests/logica.test.js
 * Requer apenas o Node.js; não usa nenhuma biblioteca externa.
 *
 * Os toques passam pelo TouchRouter de verdade (o mesmo módulo do P0), então
 * estes testes cobrem também a ligação entrada → pescaria.
 * O relógio é simulado em quadros de 16 ms (~60 FPS).
 */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', 'src');
require(path.join(SRC, 'input', 'PlayerZone.js'));
require(path.join(SRC, 'input', 'TouchRouter.js'));
require(path.join(SRC, 'logic', 'Random.js'));
const { createConfig, validateConfig, DEFAULT_CONFIG } = require(path.join(SRC, 'logic', 'config.js'));
const FishingPlayer = require(path.join(SRC, 'logic', 'FishingPlayer.js'));
const FishingSession = require(path.join(SRC, 'logic', 'FishingSession.js'));
const Sfx = require(path.join(SRC, 'audio', 'Sfx.js'));
const S = FishingPlayer.STATES;

const LARGURA = 1000;
const X = { P1: 200, P2: 800 };
const KEY = { P1: 1, P2: 2 };
const FRAME = 16;

// ---------------- utilitários ----------------

/** Sessão com espera fixa (3 s) e sem beliscadas, salvo sobrescrita. */
function novaSessao(overrides, seed) {
  let relogio = 0;
  const cfg = createConfig(Object.assign({ waitMinMs: 3000, waitMaxMs: 3000, nibbleMin: 0, nibbleMax: 0 }, overrides || {}));
  const s = new FishingSession({ now: () => relogio, config: cfg, seed: seed != null ? seed : 123 });
  s.router.setWidth(LARGURA);
  s.agora = () => relogio;
  s.held = { P1: false, P2: false };
  /** Avança o relógio em quadros; onFrame é chamado a cada quadro (para "jogar"). */
  s.avancar = (ms, onFrame) => {
    const fim = relogio + ms;
    while (relogio < fim) {
      relogio = Math.min(fim, relogio + FRAME);
      s.update(relogio);
      if (onFrame) onFrame();
    }
  };
  s.ate = (cond, maxMs, onFrame) => {
    const limite = relogio + (maxMs || 60000);
    while (!cond()) {
      if (relogio >= limite) throw new Error('condição não atingida em ' + (maxMs || 60000) + ' ms');
      s.avancar(FRAME, onFrame);
    }
  };
  s.down = (j, key, x) => { s.held[j] = true; return s.router.down({ key: key || KEY[j], identifier: key || KEY[j], x: x != null ? x : X[j], time: relogio }); };
  s.up = (j, key, canceled) => { s.held[j] = false; return s.router.up({ key: key || KEY[j], x: X[j], time: relogio, canceled: !!canceled }); };
  s.estado = (j) => s.players[j].state;
  s.p = (j) => s.players[j];
  s.eventos = (j, tipo) => s.log.filter((e) => e.jogador === j && (!tipo || e.tipo === tipo));
  return s;
}

function tocar(s, j, ms) { s.down(j); s.avancar(ms || 60); s.up(j); }
function arremessar(s, j, segurarMs) { s.down(j); s.avancar(segurarMs != null ? segurarMs : 800); s.up(j); }
function ateEstado(s, j, estado, maxMs) { s.ate(() => s.estado(j) === estado, maxMs); }

/** Lança, espera a mordida e fisga com reação de reacaoMs. */
function fisgar(s, j, reacaoMs) {
  arremessar(s, j);
  ateEstado(s, j, S.BITE, 20000);
  s.avancar(reacaoMs != null ? reacaoMs : 250);
  tocar(s, j, 60);
  assert.strictEqual(s.estado(j), S.FIGHTING, j + ' deveria estar brigando');
}

/** Política de um jogador atento: segura até 0,72 de tensão, solta até 0,45. */
function controlador(s, jogadores) {
  return () => {
    for (const j of jogadores) {
      const p = s.p(j);
      if (p.state !== S.FIGHTING) { if (s.held[j]) s.up(j); continue; }
      if (s.held[j] && p.tension > 0.72) s.up(j);
      else if (!s.held[j] && p.tension < 0.45) s.down(j);
    }
  };
}

function lutarAteOFim(s, jogadores, maxMs) {
  const ctl = controlador(s, jogadores);
  s.ate(() => jogadores.every((j) => s.estado(j) !== S.FIGHTING), maxMs || 90000, ctl);
  for (const j of jogadores) if (s.held[j]) s.up(j);
}

const testes = [];
function teste(nome, fn) { testes.push({ nome, fn }); }

// =====================================================================
// 1. Arremessos independentes
// =====================================================================
teste('1a. Arremessos independentes: P1 carrega e arremessa, P2 continua pronto', () => {
  const s = novaSessao();
  s.down('P1');
  s.avancar(400);
  assert.strictEqual(s.estado('P1'), S.CHARGING);
  assert.strictEqual(s.estado('P2'), S.IDLE);
  s.up('P1');
  assert.strictEqual(s.estado('P1'), S.CASTING);
  assert.strictEqual(s.estado('P2'), S.IDLE);
  assert.strictEqual(s.p('P2').stats.arremessos, 0);
});

teste('1b. Arremessos simultâneos com forças diferentes geram distâncias diferentes', () => {
  const s = novaSessao();
  s.down('P1'); s.down('P2');
  s.avancar(400);                       // força de P1 ≈ 50%
  s.up('P1');
  s.avancar(400);                       // força de P2 ≈ 100% (800 ms = meio ciclo)
  s.up('P2');
  const a1 = s.eventos('P1', 'arremesso')[0], a2 = s.eventos('P2', 'arremesso')[0];
  assert.ok(Math.abs(a1.forca - 0.5) < 0.03, 'força P1 ' + a1.forca);
  assert.ok(a2.forca > 0.97, 'força P2 ' + a2.forca);
  assert.ok(a2.distancia > a1.distancia + 10);
  s.avancar(1000);
  assert.strictEqual(s.estado('P1'), S.WAITING);
  assert.strictEqual(s.estado('P2'), S.WAITING);
});

teste('1c. Medidor de força vai e volta (força E timing contam); toque curto não arremessa', () => {
  const s = novaSessao();
  s.down('P1'); s.avancar(1600); s.up('P1');           // ciclo completo → força ≈ 0
  const a = s.eventos('P1', 'arremesso')[0];
  assert.ok(a.forca < 0.03, 'força ' + a.forca);
  assert.ok(Math.abs(a.distancia - DEFAULT_CONFIG.castMinDistance) < 1);
  const s2 = novaSessao();
  tocar(s2, 'P1', 80);                                  // toque rápido no estado "pronto"
  assert.strictEqual(s2.estado('P1'), S.IDLE);
  assert.strictEqual(s2.p('P1').stats.arremessos, 0);
  assert.strictEqual(s2.eventos('P1', 'arremesso-cancelado').length, 1);
});

// =====================================================================
// 2. Espera e mordida
// =====================================================================
teste('2a. Espera e mordida: a boia espera o tempo sorteado e então vem a mordida', () => {
  const s = novaSessao();
  arremessar(s, 'P1');
  ateEstado(s, 'P1', S.WAITING, 2000);
  const inicio = s.agora();
  s.avancar(2900);
  assert.strictEqual(s.estado('P1'), S.WAITING);
  s.avancar(200);
  assert.strictEqual(s.estado('P1'), S.BITE);
  const m = s.eventos('P1', 'mordida')[0];
  assert.ok(Math.abs(m.time - inicio - 3000) <= 16, 'mordida em ' + (m.time - inicio));
  assert.strictEqual(m.janelaMs, 1000, 'a janela de reação fica registrada no evento');
});

teste('2b. Tempo até a mordida é aleatório dentro dos limites configurados', () => {
  const tempos = [];
  for (let seed = 1; seed <= 150; seed++) {
    const s = novaSessao({ waitMinMs: 2000, waitMaxMs: 6000 }, seed);
    arremessar(s, 'P1');
    ateEstado(s, 'P1', S.WAITING, 2000);
    tempos.push(s.eventos('P1', 'espera')[0].mordidaEmMs);
  }
  assert.ok(tempos.every((t) => t >= 2000 && t <= 6000), 'fora dos limites');
  assert.ok(Math.max(...tempos) - Math.min(...tempos) > 3000, 'pouca variação');
});

teste('2c. Beliscadas (sinais falsos) acontecem antes da mordida e tocar nelas é ignorado', () => {
  const s = novaSessao({ waitMinMs: 6000, waitMaxMs: 6000, nibbleMin: 2, nibbleMax: 2 });
  arremessar(s, 'P1');
  s.ate(() => s.eventos('P1', 'beliscada').length === 1, 8000);
  tocar(s, 'P1', 50);
  assert.strictEqual(s.estado('P1'), S.WAITING);
  ateEstado(s, 'P1', S.BITE, 8000);
  assert.strictEqual(s.eventos('P1', 'beliscada').length, 2);
  assert.strictEqual(s.p('P1').stats.toquesPrematuros, 1);
});

// =====================================================================
// 3. Toque antecipado
// =====================================================================
teste('3a. Toques antes da mordida são ignorados e NÃO ficam guardados para depois', () => {
  const s = novaSessao();
  arremessar(s, 'P1');
  ateEstado(s, 'P1', S.WAITING, 2000);
  for (let i = 0; i < 5; i++) { tocar(s, 'P1', 60); s.avancar(300); }
  assert.strictEqual(s.estado('P1'), S.WAITING);
  assert.strictEqual(s.p('P1').stats.toquesPrematuros, 5);
  ateEstado(s, 'P1', S.BITE, 5000);
  s.avancar(1100);                                        // ninguém toca de novo
  assert.strictEqual(s.estado('P1'), S.ESCAPED);
  assert.strictEqual(s.p('P1').stats.fisgadas, 0);
  assert.strictEqual(s.p('P1').lastResult.motivo, 'sem-reacao');
});

teste('3b. Dedo apoiado antes da mordida não fisga; só um NOVO toque fisga', () => {
  const s = novaSessao();
  arremessar(s, 'P1');
  ateEstado(s, 'P1', S.WAITING, 2000);
  s.avancar(3000 - 100);                                  // 100 ms antes da mordida
  s.down('P1');
  s.avancar(500);                                         // mordida chega com o dedo na tela
  assert.strictEqual(s.estado('P1'), S.BITE);
  assert.strictEqual(s.eventos('P1', 'mordida')[0].dedoApoiado, true);
  s.up('P1');
  assert.strictEqual(s.estado('P1'), S.BITE, 'soltar o dedo antigo não fisga');
  assert.strictEqual(s.p('P1').stats.fisgadas, 0);
  s.avancar(50);
  tocar(s, 'P1', 50);
  assert.strictEqual(s.estado('P1'), S.FIGHTING);
});

teste('3c. Dedo apoiado durante toda a mordida: o peixe escapa', () => {
  const s = novaSessao();
  arremessar(s, 'P1');
  ateEstado(s, 'P1', S.WAITING, 2000);
  s.avancar(2950);
  s.down('P1');
  s.avancar(1500);
  assert.strictEqual(s.estado('P1'), S.ESCAPED);
  assert.strictEqual(s.p('P1').stats.fisgadas, 0);
});

// =====================================================================
// 4. Fisgada válida
// =====================================================================
teste('4a. Fisgada válida: novo toque dentro da janela inicia a briga e registra o tempo de reação', () => {
  const s = novaSessao();
  arremessar(s, 'P1');
  ateEstado(s, 'P1', S.BITE, 6000);
  const mordida = s.eventos('P1', 'mordida')[0].time;
  s.avancar(300);
  tocar(s, 'P1', 60);
  assert.strictEqual(s.estado('P1'), S.FIGHTING);
  const f = s.eventos('P1', 'fisgada')[0];
  assert.ok(Math.abs(f.reacaoMs - (f.time - mordida)) <= 1);
  assert.ok(f.reacaoMs >= 300 && f.reacaoMs <= 316, 'reação ' + f.reacaoMs);
  assert.strictEqual(f.janelaMs, 1000);
  assert.deepStrictEqual(s.p('P1').stats.temposReacaoMs, [f.reacaoMs]);
});

teste('4b. Limite da janela: tocar exatamente no último milissegundo ainda fisga', () => {
  const s = novaSessao({ reactionWindowMs: 700 });
  arremessar(s, 'P1');
  ateEstado(s, 'P1', S.BITE, 6000);
  const mordida = s.eventos('P1', 'mordida')[0].time;
  s.avancar(mordida + 700 - s.agora());
  tocar(s, 'P1', 40);
  assert.strictEqual(s.estado('P1'), S.FIGHTING);
  assert.strictEqual(s.eventos('P1', 'fisgada')[0].reacaoMs, 700);
});

// =====================================================================
// 5. Fisgada atrasada
// =====================================================================
teste('5a. Fisgada atrasada: toque depois da janela não fisga e o peixe escapa', () => {
  const s = novaSessao();
  arremessar(s, 'P1');
  ateEstado(s, 'P1', S.BITE, 6000);
  s.avancar(1050);
  tocar(s, 'P1', 50);
  assert.strictEqual(s.estado('P1'), S.ESCAPED);
  assert.strictEqual(s.p('P1').stats.fisgadas, 0);
  assert.strictEqual(s.p('P1').stats.mordidasPerdidas, 1);
  assert.strictEqual(s.p('P1').stats.toquesAtrasados, 1);
  assert.ok(s.eventos('P1', 'toque-atrasado')[0].atrasoMs > 0);
});

teste('5b. Janela configurável: com 400 ms, 300 ms fisga e 500 ms é atrasado', () => {
  const ok = novaSessao({ reactionWindowMs: 400 });
  arremessar(ok, 'P1'); ateEstado(ok, 'P1', S.BITE, 6000); ok.avancar(300); tocar(ok, 'P1', 40);
  assert.strictEqual(ok.estado('P1'), S.FIGHTING);
  const tarde = novaSessao({ reactionWindowMs: 400 });
  arremessar(tarde, 'P1'); ateEstado(tarde, 'P1', S.BITE, 6000); tarde.avancar(500); tocar(tarde, 'P1', 40);
  assert.strictEqual(tarde.estado('P1'), S.ESCAPED);
  assert.strictEqual(tarde.eventos('P1', 'mordida')[0].janelaMs, 400);
});

teste('5c. Toque atrasado mesmo sem quadro intermediário (evento chega antes da atualização)', () => {
  const s = novaSessao({ reactionWindowMs: 500 });
  arremessar(s, 'P1');
  ateEstado(s, 'P1', S.BITE, 6000);
  const mordida = s.eventos('P1', 'mordida')[0].time;
  s.avancar(mordida + 400 - s.agora());                  // último quadro ainda dentro da janela
  // o toque chega 105 ms depois, já fora da janela, sem nenhum quadro no meio
  s.router.down({ key: 1, identifier: 1, x: X.P1, time: mordida + 505 });
  assert.strictEqual(s.estado('P1'), S.ESCAPED);
  assert.strictEqual(s.p('P1').stats.fisgadas, 0);
});

// =====================================================================
// 6. Linha rompida
// =====================================================================
teste('6. Linha rompida: segurar sem parar leva à zona crítica e arrebenta a linha', () => {
  const s = novaSessao();
  fisgar(s, 'P1');
  s.down('P1');
  s.ate(() => s.estado('P1') !== S.FIGHTING, 10000);
  assert.strictEqual(s.estado('P1'), S.LINE_BROKEN);
  assert.strictEqual(s.p('P1').stats.linhasRompidas, 1);
  const zonas = s.eventos('P1', 'zona-tensao').map((e) => e.zona);
  assert.ok(zonas.includes('alerta') && zonas.includes('critica'), 'passou por alerta e crítica');
  assert.ok(s.eventos('P1', 'linha-rompida').length === 1);
  s.up('P1');
});

teste('6b. A linha só arrebenta por PERMANÊNCIA na zona crítica, não por um instante', () => {
  const s = novaSessao();
  fisgar(s, 'P1');
  const p = s.p('P1');
  let visitas = 0, estava = false;
  // segura até entrar na crítica e solta logo em seguida, várias vezes
  s.ate(() => visitas >= 4 || p.state !== S.FIGHTING, 60000, () => {
    if (p.state !== S.FIGHTING) return;
    const critica = p.tensionZone() === 'critica';
    if (critica && !estava) visitas++;
    estava = critica;
    if (s.held.P1 && critica) s.up('P1');
    else if (!s.held.P1 && p.tension < 0.5) s.down('P1');
  });
  assert.ok(visitas >= 4, 'visitas à zona crítica: ' + visitas);
  assert.notStrictEqual(p.state, S.LINE_BROKEN);
  if (s.held.P1) s.up('P1');
});

// =====================================================================
// 7. Peixe escapando
// =====================================================================
teste('7. Peixe escapa: sem recolher, a linha fica frouxa tempo demais', () => {
  const s = novaSessao();
  fisgar(s, 'P1');
  s.ate(() => s.estado('P1') !== S.FIGHTING, 10000);
  assert.strictEqual(s.estado('P1'), S.ESCAPED);
  assert.strictEqual(s.p('P1').lastResult.motivo, 'linha-frouxa');
  assert.strictEqual(s.p('P1').stats.fugas, 1);
  assert.ok(s.eventos('P1', 'zona-tensao').some((e) => e.zona === 'frouxa'));
});

// =====================================================================
// 8. Captura bem-sucedida
// =====================================================================
teste('8a. Captura: alternar recolher/aliviar traz o peixe à margem e registra o jogador', () => {
  const s = novaSessao();
  fisgar(s, 'P1');
  lutarAteOFim(s, ['P1']);
  assert.strictEqual(s.estado('P1'), S.CAUGHT);
  const caps = s.captures();
  assert.strictEqual(caps.length, 1);
  assert.strictEqual(caps[0].jogador, 'P1');
  assert.strictEqual(caps[0].nome, 'Alemão');
  assert.ok(caps[0].pesoKg > 0);
  assert.strictEqual(s.p('P1').stats.capturas, 1);
  assert.strictEqual(s.eventos('P1', 'captura').length, 1);
});

teste('8b. Os três perfis de peixe podem ser capturados por um jogador atento (10 sementes cada)', () => {
  for (const perfil of DEFAULT_CONFIG.fishProfiles) {
    for (let seed = 1; seed <= 10; seed++) {
      const s = novaSessao({ fishProfiles: [perfil] }, seed);
      fisgar(s, 'P2');
      lutarAteOFim(s, ['P2']);
      assert.strictEqual(s.estado('P2'), S.CAUGHT, perfil.id + ' semente ' + seed + ': ' + s.estado('P2'));
      const c = s.captures()[0];
      assert.strictEqual(c.jogador, 'P2');
      assert.strictEqual(c.nome, 'ALE');
      assert.strictEqual(c.perfil, perfil.id);
      assert.ok(c.pesoKg >= perfil.weightKg[0] && c.pesoKg <= perfil.weightKg[1]);
    }
  }
});

// =====================================================================
// 9. Recolhimento vazio
// =====================================================================
teste('9a. Recolher a linha vazia: segurar na espera recolhe tudo, sem penalidade', () => {
  const s = novaSessao();
  arremessar(s, 'P1');
  ateEstado(s, 'P1', S.WAITING, 2000);
  s.down('P1');
  s.avancar(250);
  assert.strictEqual(s.estado('P1'), S.REELING_EMPTY);
  ateEstado(s, 'P1', S.IDLE, 5000);
  const st = s.p('P1').stats;
  assert.strictEqual(st.recolhimentosVazios, 1);
  assert.strictEqual(st.fugas + st.linhasRompidas + st.mordidasPerdidas, 0, 'sem penalidade');
  // o mesmo dedo continua na tela: não pode iniciar outro arremesso sozinho
  s.avancar(500);
  assert.strictEqual(s.estado('P1'), S.IDLE);
  s.up('P1');
  // novo arremesso imediato
  s.down('P1');
  assert.strictEqual(s.estado('P1'), S.CHARGING);
  s.up('P1');
});

teste('9b. Recolhimento interrompido: a boia fica mais perto e a espera recomeça; não há mordida durante o recolhimento', () => {
  const s = novaSessao({ waitMinMs: 400, waitMaxMs: 400 });
  arremessar(s, 'P1');                                   // 30 m
  ateEstado(s, 'P1', S.WAITING, 2000);
  s.down('P1');                                          // a mordida viria em 400 ms
  s.avancar(1000);
  assert.strictEqual(s.estado('P1'), S.REELING_EMPTY);
  assert.strictEqual(s.eventos('P1', 'mordida').length, 0, 'sem mordida durante o recolhimento');
  s.up('P1');
  assert.strictEqual(s.estado('P1'), S.WAITING);
  const d = s.p('P1').distance;
  assert.ok(d > 0 && d < 30, 'distância ' + d);
  ateEstado(s, 'P1', S.BITE, 2000);
});

// =====================================================================
// 10. Dois jogadores pescando simultaneamente
// =====================================================================
teste('10. Dois jogadores completam uma pescaria ao mesmo tempo', () => {
  for (let seed = 1; seed <= 5; seed++) {
    const s = novaSessao({ waitMinMs: 2000, waitMaxMs: 5000 }, seed);
    s.down('P1'); s.down('P2');
    s.avancar(700);
    s.up('P1'); s.up('P2');
    // cada um fisga a sua mordida quando ela vier (reação de 250 ms)
    const fisgou = { P1: false, P2: false }, mordidaEm = {};
    s.ate(() => fisgou.P1 && fisgou.P2, 15000, () => {
      for (const j of ['P1', 'P2']) {
        if (s.estado(j) === S.BITE && mordidaEm[j] == null) mordidaEm[j] = s.agora();
        if (s.estado(j) === S.BITE && s.agora() - mordidaEm[j] >= 250) { s.down(j); s.up(j); }
        if (s.estado(j) === S.FIGHTING) fisgou[j] = true;
      }
    });
    lutarAteOFim(s, ['P1', 'P2']);
    // quem terminou primeiro pode já ter voltado a "pronto": o que vale é o registro de capturas
    assert.strictEqual(s.p('P1').stats.capturas, 1, 'semente ' + seed + ' P1 ' + JSON.stringify(s.p('P1').lastResult));
    assert.strictEqual(s.p('P2').stats.capturas, 1, 'semente ' + seed + ' P2 ' + JSON.stringify(s.p('P2').lastResult));
    const quem = s.captures().map((c) => c.jogador).sort();
    assert.deepStrictEqual(quem, ['P1', 'P2']);
    assert.strictEqual(s.router.errors.length, 0);
  }
});

// =====================================================================
// 11. Estados independentes
// =====================================================================
function roteiroP1(s) {
  arremessar(s, 'P1', 600);
  ateEstado(s, 'P1', S.BITE, 20000);
  s.avancar(200);
  tocar(s, 'P1', 60);
  lutarAteOFim(s, ['P1']);
  s.avancar(3000);
}

teste('11a. Nada que P2 faça altera a pescaria de P1 (comparação exata dos registros)', () => {
  // A: P1 pesca sozinho
  const a = novaSessao({ waitMinMs: 2000, waitMaxMs: 6000 }, 77);
  roteiroP1(a);
  // B: mesmo roteiro de P1, mas P2 toca, segura, arremessa e recolhe o tempo todo
  const b = novaSessao({ waitMinMs: 2000, waitMaxMs: 6000 }, 77);
  let n = 0;
  const bagunca = () => {
    n++;
    if (n % 37 === 0) { if (b.held.P2) b.up('P2'); else b.down('P2'); }
    if (n % 101 === 0 && !b.held.P2) { b.down('P2', 9, 650); b.up('P2', 9); }   // dedo extra
  };
  const avancarOriginal = b.avancar;
  b.avancar = (ms, onFrame) => avancarOriginal(ms, () => { bagunca(); if (onFrame) onFrame(); });
  roteiroP1(b);
  const limpa = (log) => log.filter((e) => e.jogador === 'P1').map((e) => {
    const c = Object.assign({}, e); delete c.seq; return c;
  });
  assert.ok(b.eventos('P2').length > 10, 'P2 precisa ter feito coisas');
  assert.deepStrictEqual(limpa(b.log), limpa(a.log));
  assert.deepStrictEqual(b.p('P1').stats, a.p('P1').stats);
  assert.strictEqual(a.estado('P1'), b.estado('P1'));
});

teste('11b. Toque de P2 durante a mordida de P1 não fisga o peixe de P1', () => {
  const s = novaSessao();
  arremessar(s, 'P1');
  ateEstado(s, 'P1', S.BITE, 6000);
  for (let i = 0; i < 6; i++) { tocar(s, 'P2', 40); s.avancar(100); }
  s.avancar(400);
  assert.strictEqual(s.estado('P1'), S.ESCAPED);
  assert.strictEqual(s.p('P1').stats.fisgadas, 0);
});

teste('11c. Dedo de P1 arrastado até a metade de P2 continua recolhendo para P1', () => {
  const s = novaSessao();
  fisgar(s, 'P1');
  s.down('P1');
  s.router.move({ key: KEY.P1, x: 900, time: s.agora() });
  s.avancar(300);
  assert.ok(s.p('P1').pressed, 'P1 continua segurando');
  assert.strictEqual(s.estado('P2'), S.IDLE);
  assert.strictEqual(s.p('P2').stats.arremessos, 0);
  s.router.up({ key: KEY.P1, x: 900, time: s.agora() });
  assert.strictEqual(s.p('P1').pressed, false);
  assert.strictEqual(s.estado('P2'), S.IDLE);
});

teste('11d. Tensões independentes: P1 segurando e P2 soltando ao mesmo tempo', () => {
  // limites de risco altos só para os dois ficarem brigando durante o teste
  const s = novaSessao({ slackEscapeMs: 1e9, criticalBreakMs: 1e9 });
  fisgar(s, 'P1');
  fisgar(s, 'P2');
  assert.strictEqual(s.estado('P1'), S.FIGHTING);
  s.down('P2'); s.avancar(800); s.up('P2');              // P2 com tensão alta
  const t1 = s.p('P1').tension, t2 = s.p('P2').tension;
  s.down('P1');
  s.avancar(500);
  assert.ok(s.p('P1').tension > t1, 'P1 sobe');
  assert.ok(s.p('P2').tension < t2, 'P2 desce');
  s.up('P1');
});

// =====================================================================
// 12. Reinício após captura ou fuga
// =====================================================================
teste('12a. Após a captura, volta a "pronto" e permite nova pescaria', () => {
  const s = novaSessao();
  fisgar(s, 'P1');
  lutarAteOFim(s, ['P1']);
  assert.strictEqual(s.estado('P1'), S.CAUGHT);
  s.avancar(DEFAULT_CONFIG.resultCaughtMs + 50);
  assert.strictEqual(s.estado('P1'), S.IDLE);
  arremessar(s, 'P1');
  assert.strictEqual(s.estado('P1'), S.CASTING);
  assert.strictEqual(s.p('P1').stats.arremessos, 2);
});

teste('12b. Após fuga e após linha rompida, volta a "pronto"', () => {
  const s = novaSessao();
  fisgar(s, 'P1');
  ateEstado(s, 'P1', S.ESCAPED, 10000);
  s.avancar(DEFAULT_CONFIG.resultLostMs + 50);
  assert.strictEqual(s.estado('P1'), S.IDLE);
  fisgar(s, 'P1');
  s.down('P1');
  ateEstado(s, 'P1', S.LINE_BROKEN, 10000);
  s.up('P1');
  s.avancar(DEFAULT_CONFIG.resultLostMs + 50);
  assert.strictEqual(s.estado('P1'), S.IDLE);
  assert.strictEqual(s.p('P1').fish, null);
  assert.strictEqual(s.p('P1').tension, 0);
});

teste('12c. Durante o resultado: toque logo no início é ignorado; depois, um toque já começa a carregar', () => {
  const s = novaSessao();
  fisgar(s, 'P1');
  s.down('P1');
  ateEstado(s, 'P1', S.LINE_BROKEN, 10000);
  s.avancar(300);
  assert.strictEqual(s.estado('P1'), S.LINE_BROKEN, 'dedo da briga ainda na tela não arremessa');
  s.up('P1');
  tocar(s, 'P1', 40);                                    // < resultSkipAfterMs
  assert.strictEqual(s.estado('P1'), S.LINE_BROKEN);
  s.avancar(400);
  s.down('P1');
  assert.strictEqual(s.estado('P1'), S.CHARGING);
  s.up('P1');
});

// =====================================================================
// Robustez (interrupções herdadas do P0)
// =====================================================================
teste('R1. Cancelamento do sistema durante a carga cancela o arremesso', () => {
  const s = novaSessao();
  s.down('P1');
  s.avancar(500);
  s.up('P1', null, true);
  assert.strictEqual(s.estado('P1'), S.IDLE);
  assert.strictEqual(s.p('P1').stats.arremessos, 0);
});

teste('R2. Interrupção da página (cancelAll) durante a briga vale como soltar para os dois', () => {
  const s = novaSessao();
  fisgar(s, 'P1');
  fisgar(s, 'P2');
  s.down('P1'); s.down('P2');
  s.avancar(100);
  s.router.cancelAll('página oculta', s.agora());
  s.held.P1 = s.held.P2 = false;
  assert.strictEqual(s.p('P1').pressed, false);
  assert.strictEqual(s.p('P2').pressed, false);
  // o fim atrasado do dedo antigo não gera erro nem efeito
  s.router.up({ key: KEY.P1, x: X.P1, time: s.agora() });
  assert.strictEqual(s.router.errors.length, 0);
});

teste('R3. Página parada por muito tempo: o tempo parado não conta', () => {
  const s = novaSessao();
  arremessar(s, 'P1');
  ateEstado(s, 'P1', S.WAITING, 2000);
  const antes = s.agora();
  s.update(antes + 20000);                               // um único quadro 20 s depois
  assert.strictEqual(s.estado('P1'), S.WAITING, 'a mordida não "passou" enquanto a página estava parada');
  assert.ok(s.eventos('P1', 'pausa').length === 1);
});

teste('R3b. Dois dedos do mesmo jogador: a zona só é "solta" quando o último dedo sai', () => {
  // carregando: soltar um dos dois dedos não arremessa
  const s = novaSessao();
  s.down('P1', 1); s.down('P1', 3);
  s.avancar(500);
  s.up('P1', 1);
  assert.strictEqual(s.estado('P1'), S.CHARGING, 'ainda há um dedo: continua carregando');
  s.up('P1', 3);
  assert.strictEqual(s.estado('P1'), S.CASTING);
  // brigando: com um dedo ainda apoiado, continua recolhendo
  const b = novaSessao({ slackEscapeMs: 1e9, criticalBreakMs: 1e9 });
  fisgar(b, 'P1');
  b.down('P1', 1); b.down('P1', 3);
  b.avancar(100);
  b.up('P1', 1);
  const t0 = b.p('P1').tension;
  b.avancar(300);
  assert.ok(b.p('P1').pressed && b.p('P1').tension > t0, 'continua recolhendo com o segundo dedo');
  b.up('P1', 3);
  assert.strictEqual(b.p('P1').pressed, false);
});

// =====================================================================
// PATCH 01 — D8 (interrupções), D4, D3, D7, D2, D9
// =====================================================================

/** Sfx com áudio e vibração falsos, para contar o que seria tocado. */
function sfxFalso() {
  const chamadas = { tons: 0, ruidos: 0, vibracoes: [] };
  const sfx = new Sfx({ navigator: { vibrate: (p) => { chamadas.vibracoes.push(p); return true; } } });
  sfx.tone = () => { chamadas.tons++; };
  sfx.noise = () => { chamadas.ruidos++; };
  return { sfx, chamadas };
}

teste('P01-1. D8: interrupção durante a espera congela o tempo até a mordida', () => {
  const s = novaSessao();
  arremessar(s, 'P1');
  ateEstado(s, 'P1', S.WAITING, 2000);
  s.avancar(1000);
  const antes = s.p('P1').snapshot(s.agora()).biteInMs;           // ~2000 ms
  s.interrupt('página oculta', s.agora());
  assert.ok(s.isPaused() && s.awaitingTap);
  s.avancar(20000);
  assert.strictEqual(s.estado('P1'), S.WAITING);
  assert.strictEqual(s.eventos('P1', 'mordida').length, 0, 'nenhuma mordida durante a pausa');
  assert.ok(Math.abs(s.p('P1').snapshot(s.agora()).biteInMs - antes) <= 16, 'tempo restante preservado');
  s.continueAfterInterruption(s.agora());
  s.avancar(antes - 100);
  assert.strictEqual(s.estado('P1'), S.WAITING);
  s.avancar(250);
  assert.strictEqual(s.estado('P1'), S.BITE);
});

teste('P01-2. D8: interrupção durante a briga preserva tensão, risco, distância e peixe', () => {
  const s = novaSessao();
  fisgar(s, 'P1');
  s.down('P1');
  s.avancar(300);
  s.interrupt('perda de foco', s.agora());
  s.held.P1 = false;
  const p = s.p('P1');
  const foto = JSON.stringify([p.tension, p.slackMs, p.criticalMs, p.distance, p.fish.energy, p.fish.pull, p.fish.phase]);
  assert.strictEqual(p.pressed, false, 'o dedo foi encerrado');
  s.avancar(15000);
  assert.strictEqual(p.state, S.FIGHTING, 'a pausa não causou fuga nem rompimento');
  assert.strictEqual(JSON.stringify([p.tension, p.slackMs, p.criticalMs, p.distance, p.fish.energy, p.fish.pull, p.fish.phase]), foto);
  s.continueAfterInterruption(s.agora());
  assert.strictEqual(p.state, S.FIGHTING);
  assert.strictEqual(p.pressed, false);
});

teste('P01-3. D8: interrupção com os jogadores em estados diferentes (briga e janela de mordida)', () => {
  const s = novaSessao({ slackEscapeMs: 1e9, criticalBreakMs: 1e9 });
  fisgar(s, 'P1');                                         // P1 brigando
  arremessar(s, 'P2');
  ateEstado(s, 'P2', S.BITE, 6000);                        // P2 na janela de mordida
  s.avancar(300);
  const restante = s.p('P2').snapshot(s.agora()).biteLeftMs;
  const tensao1 = s.p('P1').tension;
  s.interrupt('troca de aplicativo', s.agora());
  s.avancar(10000);
  assert.strictEqual(s.estado('P1'), S.FIGHTING);
  assert.strictEqual(s.estado('P2'), S.BITE, 'a janela de P2 não acabou durante a pausa');
  assert.strictEqual(s.p('P2').snapshot(s.agora()).biteLeftMs, restante);
  assert.strictEqual(s.p('P1').tension, tensao1);
  s.continueAfterInterruption(s.agora());
  s.avancar(300);
  tocar(s, 'P2', 40);
  assert.strictEqual(s.estado('P2'), S.FIGHTING, 'P2 ainda fisga dentro do que restava da janela');
  const r = s.eventos('P2', 'fisgada')[0].reacaoMs;
  assert.ok(r >= 600 && r <= 640, 'reação sem contar a pausa: ' + r);
});

teste('P01-4. D8: retorno sem toque fantasma (dedos encerrados, toque de retomada consumido)', () => {
  const s = novaSessao();
  arremessar(s, 'P2');
  ateEstado(s, 'P2', S.WAITING, 2000);
  s.down('P1');                                            // P1 carregando
  s.down('P2'); s.avancar(400);                            // P2 recolhendo
  assert.strictEqual(s.estado('P2'), S.REELING_EMPTY);
  s.interrupt('página oculta', s.agora());
  assert.strictEqual(s.router.zones.P1.activeCount + s.router.zones.P2.activeCount, 0);
  assert.strictEqual(s.estado('P1'), S.IDLE, 'carga interrompida: sem arremesso');
  assert.strictEqual(s.eventos('P1', 'arremesso-cancelado')[0].codigo, 'interrupcao');
  assert.strictEqual(s.estado('P2'), S.WAITING, 'recolhimento interrompido volta à espera');
  s.avancar(5000);
  // a cena consome o toque de retomada: ele é ignorado pelo roteador
  s.router.ignore(7);
  assert.ok(s.continueAfterInterruption(s.agora()));
  s.router.up({ key: 7, x: X.P1, time: s.agora() });
  // os dedos antigos saem da tela depois: absorvidos sem erro e sem efeito
  s.router.up({ key: KEY.P1, x: X.P1, time: s.agora() });
  s.router.up({ key: KEY.P2, x: X.P2, time: s.agora() });
  s.held.P1 = s.held.P2 = false;
  s.avancar(500);
  assert.strictEqual(s.p('P1').pressed, false);
  assert.strictEqual(s.p('P2').pressed, false);
  assert.strictEqual(s.estado('P1'), S.IDLE, 'nenhum arremesso fantasma');
  assert.strictEqual(s.estado('P2'), S.WAITING, 'nenhum recolhimento fantasma');
  assert.strictEqual(s.router.errors.length, 0);
});

teste('P01-5. D8: temporizadores preservados — cartão de resultado e pausa por menu (sem exigir toque)', () => {
  const s = novaSessao();
  fisgar(s, 'P1');
  s.down('P1');
  ateEstado(s, 'P1', S.LINE_BROKEN, 10000);
  s.avancar(300);
  s.pause('menu aberto', s.agora());
  s.held.P1 = false;
  assert.ok(s.isPaused() && !s.awaitingTap, 'menu não exige toque para continuar');
  s.avancar(5000);
  assert.strictEqual(s.estado('P1'), S.LINE_BROKEN);
  s.resume('menu aberto', s.agora());
  assert.ok(!s.isPaused());
  s.avancar(DEFAULT_CONFIG.resultLostMs - 300 - 50);
  assert.strictEqual(s.estado('P1'), S.LINE_BROKEN, 'o cartão não "andou" durante o menu');
  s.avancar(100);
  assert.strictEqual(s.estado('P1'), S.IDLE);
  // interrupção com o menu aberto: fechar o menu não retoma; só o toque retoma
  s.pause('menu aberto', s.agora());
  s.interrupt('perda de foco', s.agora());
  s.resume('menu aberto', s.agora());
  assert.ok(s.isPaused() && s.awaitingTap);
  s.continueAfterInterruption(s.agora());
  assert.ok(!s.isPaused());
  assert.strictEqual(s.pauseCount, 2);
});

teste('P01-6. D4: recolhimento parcial preserva a espera restante (sem novo sorteio, sem mordida no recolhimento)', () => {
  const s = novaSessao({ waitMinMs: 6000, waitMaxMs: 6000, nibbleMin: 2, nibbleMax: 2 });
  arremessar(s, 'P1');
  ateEstado(s, 'P1', S.WAITING, 2000);
  s.avancar(2000);                                        // faltam ~4000 ms
  s.down('P1');
  s.avancar(250);                                         // vira recolhimento após o limiar (200 ms)
  assert.strictEqual(s.estado('P1'), S.REELING_EMPTY);
  const restante = s.eventos('P1', 'recolhimento-inicio')[0].esperaRestanteMs;
  assert.ok(Math.abs(restante - 3800) <= 20, 'espera restante ' + restante);   // 4000 − 200 ms até virar recolhimento
  s.avancar(1000);
  s.up('P1');
  assert.strictEqual(s.estado('P1'), S.WAITING);
  assert.strictEqual(s.eventos('P1', 'espera').length, 1, 'nenhum sorteio novo');
  const retomada = s.eventos('P1', 'espera-retomada')[0];
  assert.strictEqual(retomada.mordidaEmMs, restante);
  assert.strictEqual(s.eventos('P1', 'mordida').length, 0, 'sem mordida durante o recolhimento');
  const t0 = s.agora();
  ateEstado(s, 'P1', S.BITE, 8000);
  const dt = s.eventos('P1', 'mordida')[0].time - t0;
  assert.ok(Math.abs(dt - restante) <= 16, 'mordida no tempo restante: ' + dt);
  assert.strictEqual(s.p('P1').stats.recolhimentosVazios, 0);
});

teste('P01-6b. D4: toque prematuro um pouco longo não empurra a mordida além do tempo em que recolheu', () => {
  const s = novaSessao({ waitMinMs: 4000, waitMaxMs: 4000 });
  arremessar(s, 'P1');
  ateEstado(s, 'P1', S.WAITING, 2000);
  const inicio = s.agora();
  s.avancar(1000);
  tocar(s, 'P1', 260);                                    // passa do limiar: ~60 ms de recolhimento
  ateEstado(s, 'P1', S.BITE, 6000);
  const dt = s.eventos('P1', 'mordida')[0].time - inicio;
  assert.ok(dt >= 4000 && dt <= 4000 + 100, 'atraso pequeno (só o tempo recolhendo): ' + dt);
});

teste('P01-7. D3: beliscadas não tocam som nenhum (nem vibram)', () => {
  const { sfx, chamadas } = sfxFalso();
  sfx.vibration = true;
  sfx.onEvent({ tipo: 'beliscada', jogador: 'P1' });
  assert.deepStrictEqual([chamadas.tons, chamadas.ruidos, chamadas.vibracoes.length], [0, 0, 0]);
  // numa pescaria real com 2 beliscadas, todos os eventos de beliscada ficam em silêncio
  const s = novaSessao({ waitMinMs: 6000, waitMaxMs: 6000, nibbleMin: 2, nibbleMax: 2 });
  const f = sfxFalso();
  s.onEvent((e) => { if (e.tipo === 'beliscada') f.sfx.onEvent(e); });
  arremessar(s, 'P1');
  ateEstado(s, 'P1', S.BITE, 9000);
  assert.strictEqual(s.eventos('P1', 'beliscada').length, 2);
  assert.strictEqual(f.chamadas.tons + f.chamadas.ruidos, 0);
});

teste('P01-8. D3: a mordida verdadeira continua com bipe duplo e evento visual', () => {
  const { sfx, chamadas } = sfxFalso();
  sfx.onEvent({ tipo: 'mordida', jogador: 'P2' });
  assert.strictEqual(chamadas.tons, 2, 'bipe duplo');
  const s = novaSessao();
  arremessar(s, 'P1');
  ateEstado(s, 'P1', S.BITE, 6000);
  assert.strictEqual(s.eventos('P1', 'mordida')[0].janelaMs, 1000);
});

function resultado(s, tipo) {
  if (tipo === 'captura') { fisgar(s, 'P1'); lutarAteOFim(s, ['P1']); return S.CAUGHT; }
  if (tipo === 'fuga') { fisgar(s, 'P1'); ateEstado(s, 'P1', S.ESCAPED, 10000); return S.ESCAPED; }
  if (tipo === 'rompida') { fisgar(s, 'P1'); s.down('P1'); ateEstado(s, 'P1', S.LINE_BROKEN, 10000); s.up('P1'); return S.LINE_BROKEN; }
  arremessar(s, 'P1'); ateEstado(s, 'P1', S.BITE, 6000); ateEstado(s, 'P1', S.ESCAPED, 2000); return S.ESCAPED;
}

teste('P01-9. D7: avanço uniforme dos quatro cartões (um registro por toque, sem duplicar)', () => {
  for (const tipo of ['captura', 'fuga', 'rompida', 'mordida-perdida']) {
    const s = novaSessao();
    const estado = resultado(s, tipo);
    assert.strictEqual(s.estado('P1'), estado, tipo);
    const desde = s.p('P1').stateSince;
    s.avancar(desde + 300 - s.agora());
    const antes = s.log.length;
    tocar(s, 'P1', 40);                                   // cedo: não avança
    assert.strictEqual(s.estado('P1'), estado, tipo + ': toque antes de 0,6 s não avança');
    const novos = s.log.slice(antes).filter((e) => e.tipo === 'toque-ignorado' || e.tipo === 'toque-atrasado');
    assert.strictEqual(novos.length, 1, tipo + ': exatamente um registro para o toque');
    assert.strictEqual(novos[0].tipo, tipo === 'mordida-perdida' ? 'toque-atrasado' : 'toque-ignorado');
    s.avancar(desde + 700 - s.agora());
    s.down('P1');                                         // depois de 0,6 s: avança e já carrega
    assert.strictEqual(s.estado('P1'), S.CHARGING, tipo + ': toque após 0,6 s avança');
    s.up('P1');
  }
});

teste('P01-10. D7: dedo que já estava na tela não avança o cartão nem inicia arremesso', () => {
  const s = novaSessao();
  fisgar(s, 'P1');
  s.down('P1');                                           // segura até romper e continua segurando
  ateEstado(s, 'P1', S.LINE_BROKEN, 10000);
  s.avancar(1000);                                        // passou de 0,6 s com o dedo antigo
  assert.strictEqual(s.estado('P1'), S.LINE_BROKEN);
  s.avancar(DEFAULT_CONFIG.resultLostMs);                 // cartão acaba com o dedo ainda apoiado
  assert.strictEqual(s.estado('P1'), S.IDLE, 'volta a pronto, mas não carrega');
  s.avancar(1000);
  assert.strictEqual(s.estado('P1'), S.IDLE);
  s.up('P1');
  s.down('P1');
  assert.strictEqual(s.estado('P1'), S.CHARGING, 'só um toque novo carrega');
  s.up('P1');
});

teste('P01-11. D2: arremesso cancelado por toque curto gera o aviso, sem penalidade nem espera', () => {
  const s = novaSessao();
  tocar(s, 'P1', 80);
  const ev = s.eventos('P1', 'arremesso-cancelado');
  assert.strictEqual(ev.length, 1);
  assert.strictEqual(ev[0].codigo, 'toque-curto', 'código que a cena usa para mostrar "SEGURE PARA ARREMESSAR!"');
  assert.strictEqual(s.estado('P1'), S.IDLE);
  s.down('P1');                                          // imediatamente depois: já carrega
  assert.strictEqual(s.estado('P1'), S.CHARGING);
  s.avancar(500); s.up('P1');
  assert.strictEqual(s.estado('P1'), S.CASTING);
  // o cancelamento por interrupção NÃO usa o código do aviso
  const b = novaSessao();
  b.down('P1'); b.avancar(400); b.up('P1', null, true);
  assert.strictEqual(b.eventos('P1', 'arremesso-cancelado')[0].codigo, 'interrupcao');
});

teste('P01-12. D9: vibração desligada por padrão e ativável manualmente; sons inalterados', () => {
  const { sfx, chamadas } = sfxFalso();
  assert.strictEqual(sfx.vibration, false, 'desligada por padrão');
  sfx.onEvent({ tipo: 'mordida', jogador: 'P1' });
  assert.strictEqual(chamadas.vibracoes.length, 0);
  assert.strictEqual(chamadas.tons, 2, 'o som da mordida continua');
  sfx.vibration = true;                                   // o que o botão "Vibração" do menu faz
  sfx.onEvent({ tipo: 'mordida', jogador: 'P1' });
  assert.deepStrictEqual(chamadas.vibracoes, [120]);
  // padrões da interface (botão do menu e valor inicial do main.js)
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(/data-name="vibracao" aria-pressed="false"/.test(html), 'botão começa desligado');
  const main = fs.readFileSync(path.join(SRC, 'main.js'), 'utf8');
  assert.ok(/vibracao: false/.test(main) && /setToggle\('vibracao', false\)/.test(main), 'main.js começa desligado');
});

// =====================================================================
// AJUSTE DE UX — "ARREMESSO CANCELADO" após interrupção do sistema
// =====================================================================

teste('P02-1. Interrupção durante a carga: cancela sem penalidade e avisa SÓ quem carregava, ao retomar', () => {
  const s = novaSessao();
  arremessar(s, 'P2');                                   // P2 em outro estado (boia no ar / espera)
  s.down('P1');
  s.avancar(500);
  assert.strictEqual(s.estado('P1'), S.CHARGING);
  s.interrupt('troca de aplicativo', s.agora());
  s.held.P1 = false;
  assert.strictEqual(s.estado('P1'), S.IDLE, 'arremesso cancelado');
  assert.strictEqual(s.p('P1').stats.arremessos, 0, 'nenhum arremesso lançado');
  assert.strictEqual(s.log.filter((e) => e.tipo === 'aviso-retomada').length, 0, 'nada de aviso enquanto pausado');
  s.avancar(3000);
  s.continueAfterInterruption(s.agora());
  const avisos = s.log.filter((e) => e.tipo === 'aviso-retomada');
  assert.strictEqual(avisos.length, 1);
  assert.strictEqual(avisos[0].jogador, 'P1');
  assert.strictEqual(avisos[0].codigo, 'arremesso-cancelado');
  s.avancar(1000);
  assert.strictEqual(s.estado('P1'), S.IDLE, 'nenhum arremesso automático depois da retomada');
  s.down('P1');
  assert.strictEqual(s.estado('P1'), S.CHARGING, 'sem penalidade: um toque novo já carrega');
  s.up('P1');
});

teste('P02-2. Interrupção em qualquer outro estado não mostra o aviso', () => {
  const casos = {
    pronto: (s) => {},
    esperando: (s) => { arremessar(s, 'P1'); ateEstado(s, 'P1', S.WAITING, 2000); },
    recolhendo: (s) => { arremessar(s, 'P1'); ateEstado(s, 'P1', S.WAITING, 2000); s.down('P1'); s.avancar(300); },
    mordida: (s) => { arremessar(s, 'P1'); ateEstado(s, 'P1', S.BITE, 6000); },
    briga: (s) => { fisgar(s, 'P1'); s.down('P1'); s.avancar(200); },
    resultado: (s) => { fisgar(s, 'P1'); ateEstado(s, 'P1', S.ESCAPED, 10000); }
  };
  for (const [nome, preparar] of Object.entries(casos)) {
    const s = novaSessao();
    preparar(s);
    s.interrupt('perda de foco', s.agora());
    s.held.P1 = s.held.P2 = false;
    s.avancar(1000);
    s.continueAfterInterruption(s.agora());
    assert.strictEqual(s.log.filter((e) => e.tipo === 'aviso-retomada').length, 0, nome + ': sem aviso');
  }
});

teste('P02-3. Menu e retrato durante a carga também avisam, só o afetado, e só quando o jogo volta', () => {
  const avisos = (s) => s.log.filter((e) => e.tipo === 'aviso-retomada');
  for (const motivo of ['menu aberto', 'orientação retrato']) {
    const s = novaSessao();
    arremessar(s, 'P2');                                  // P2 em outro estado
    s.down('P1'); s.avancar(400);
    s.pause(motivo, s.agora());
    s.held.P1 = false;
    assert.strictEqual(s.estado('P1'), S.IDLE, motivo + ': arremesso cancelado');
    assert.strictEqual(avisos(s).length, 0, motivo + ': nada enquanto pausado');
    s.avancar(3000);
    s.resume(motivo, s.agora());
    assert.strictEqual(avisos(s).length, 1, motivo + ': um aviso ao voltar');
    assert.strictEqual(avisos(s)[0].jogador, 'P1');
    assert.strictEqual(s.p('P1').stats.arremessos, 0, motivo + ': nada lançado');
    s.avancar(1000);
    assert.strictEqual(s.estado('P1'), S.IDLE, motivo + ': nenhum arremesso automático');
    s.down('P1');
    assert.strictEqual(s.estado('P1'), S.CHARGING, motivo + ': sem penalidade');
    s.up('P1');
    // menu/retrato em outros estados: sem aviso
    const b = novaSessao();
    arremessar(b, 'P1'); ateEstado(b, 'P1', S.WAITING, 2000);
    b.pause(motivo, b.agora()); b.resume(motivo, b.agora());
    assert.strictEqual(avisos(b).length, 0, motivo + ': sem carga, sem aviso');
  }
  // menu aberto e retrato ao mesmo tempo: o aviso espera o jogo voltar de fato
  const r = novaSessao();
  r.down('P1'); r.avancar(400);
  r.pause('menu aberto', r.agora());
  r.held.P1 = false;
  r.pause('orientação retrato', r.agora());
  r.resume('orientação retrato', r.agora());
  assert.strictEqual(avisos(r).length, 0, 'menu ainda aberto');
  r.resume('menu aberto', r.agora());
  assert.strictEqual(avisos(r).length, 1);
});

teste('P02-3b. Interrupção do sistema com o menu aberto: o aviso espera a retomada real', () => {
  const s = novaSessao();
  // interrupção do sistema enquanto carrega, e o menu é aberto antes do toque de retomada
  s.down('P1'); s.avancar(400);
  s.interrupt('página oculta', s.agora());
  s.held.P1 = false;
  s.pause('menu aberto', s.agora());
  s.continueAfterInterruption(s.agora());
  assert.strictEqual(s.log.filter((e) => e.tipo === 'aviso-retomada').length, 0, 'ainda pausado pelo menu');
  s.resume('menu aberto', s.agora());
  assert.strictEqual(s.log.filter((e) => e.tipo === 'aviso-retomada').length, 1, 'aviso só quando o jogo volta de fato');
});

teste('P02-4. Diagnóstico do B5: durante o recolhimento, "mordida em" fica congelada no tempo restante', () => {
  const s = novaSessao({ waitMinMs: 6000, waitMaxMs: 6000 });
  arremessar(s, 'P1');
  ateEstado(s, 'P1', S.WAITING, 2000);
  s.avancar(1000);
  s.down('P1'); s.avancar(250);
  const a = s.p('P1').snapshot(s.agora()).biteInMs;
  s.avancar(1500);
  const b = s.p('P1').snapshot(s.agora()).biteInMs;
  assert.strictEqual(s.estado('P1'), S.REELING_EMPTY);
  assert.ok(a != null && a === b, 'congelada: ' + a + ' / ' + b);
  s.up('P1');
  assert.ok(Math.abs(s.p('P1').snapshot(s.agora()).biteInMs - a) <= 16, 'ao soltar, continua do mesmo valor');
});

teste('R4. Configuração padrão válida e validação detecta erros', () => {
  assert.deepStrictEqual(validateConfig(createConfig()), []);
  assert.ok(validateConfig(createConfig({ waitMinMs: 5000, waitMaxMs: 1000 })).length > 0);
  assert.ok(validateConfig(createConfig({ alertMin: 0.1 })).length > 0);
  assert.ok(validateConfig(createConfig({ reactionWindowMs: 0 })).length > 0);
});

teste('R5. Módulos de entrada são cópias fiéis do P0 (nenhuma reescrita)', () => {
  const p0 = path.join(__dirname, '..', '..', 'p0-multitouch', 'src');
  for (const rel of ['input/PlayerZone.js', 'input/TouchRouter.js', 'scenes/OrientationScene.js']) {
    const original = path.join(p0, rel);
    if (!fs.existsSync(original)) { console.log('    (P0 não encontrado; comparação de ' + rel + ' pulada)'); continue; }
    assert.strictEqual(fs.readFileSync(path.join(SRC, rel), 'utf8'), fs.readFileSync(original, 'utf8'), rel + ' difere do P0');
  }
});

// ---------------- execução ----------------
let falhas = 0;
for (const t of testes) {
  try {
    t.fn();
    console.log('  ✓ ' + t.nome);
  } catch (err) {
    falhas++;
    console.log('  ✗ ' + t.nome);
    console.log('      ' + (err && err.stack ? err.stack.split('\n').slice(0, 3).join('\n      ') : err));
  }
}
console.log('');
console.log((testes.length - falhas) + ' de ' + testes.length + ' testes passaram.');
process.exitCode = falhas ? 1 : 0;
