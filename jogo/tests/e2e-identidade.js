/*
 * Teste ponta a ponta OPCIONAL da Operação Nova Identidade (Chromium/Edge, celular emulado).
 * Confere o cenário em pixel art, o HUD, os lugares do lago, os pontos de interesse, as dicas,
 * o medidor de tensão, os diálogos, os eventos do mundo e o desempenho numa sessão longa;
 * e gera as capturas de tela pedidas pela missão (+ um vídeo curto, se o navegador permitir).
 *
 * Requer Playwright (ou playwright-core), que NÃO faz parte do projeto.
 * Uso:  node jogo/tests/e2e-identidade.js <pasta-de-saida> [endereço] [canal]
 */
'use strict';
let pw;
try { pw = require('playwright'); } catch (e) { pw = require('playwright-core'); }
const fs = require('fs');
const path = require('path');
const OUT = process.argv[2] || '.';
const URL = process.argv[3] || 'http://127.0.0.1:8765/jogo/index.html';
const CHANNEL = process.argv[4] || undefined;

const results = [];
function check(name, cond, detail) {
  results.push({ name, ok: !!cond, detail: detail || '' });
  console.log((cond ? '  ✓ ' : '  ✗ ') + name + (cond || !detail ? '' : '  → ' + String(detail).slice(0, 600)));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const inter = (a, b) => a && b && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const CFG2 = { modo: 2, personagens: { P1: 'alemao', P2: 'ale' }, iscas: { P1: 'minhoca', P2: 'minhoca' }, regioes: true };

// robô que pesca sozinho (chama a API do pescador, como os testes de lógica; não mexe nas regras)
const ROBO = () => {
  if (window.__robo) return;
  window.__b = {};
  window.__robo = setInterval(() => {
    const P = HF.app.partida;
    if (!P || P.bloqueado()) return;
    const now = performance.now();
    for (const id of P.ids) {
      const p = P.session.players[id], b = window.__b[id] = window.__b[id] || { prox: 0, acao: 'idle' };
      if (p.state === 'FIGHTING') { if (p.pressed && p.tension > 0.8) p.release(now, {}); else if (!p.pressed && p.tension < 0.38) p.press(now); continue; }
      if (now < b.prox) continue;
      switch (p.state) {
        case 'IDLE': p.press(now); b.acao = 'carregando'; b.prox = now + 260 + Math.random() * 450; break;
        case 'CHARGING': p.release(now, {}); b.acao = 'idle'; b.prox = now + 200; break;
        case 'BITE': if (b.acao !== 'reagindo') { b.acao = 'reagindo'; b.prox = now + 250; } else { p.press(now); b.acao = 'briga'; } break;
        case 'CAUGHT': case 'ESCAPED': case 'LINE_BROKEN': if (p.pressed) p.release(now, {}); b.acao = 'idle'; b.prox = now + 1300; break;
        default: break;
      }
    }
  }, 30);
};
const PARAR_ROBO = () => { clearInterval(window.__robo); window.__robo = null; };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await pw.chromium.launch({ channel: CHANNEL });
  const errors = [];
  const vigiar = (page) => {
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('response', (r) => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
  };
  try {
    // ================= menu vertical (celular em pé) =================
    {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 });
      const pr = await ctx.newPage(); vigiar(pr);
      await pr.goto(URL);
      await pr.waitForFunction(() => window.HF && HF.app && HF.app.ui && HF.app.ui.atual === 'menu', null, { timeout: 20000 });
      await sleep(600);
      await pr.screenshot({ path: path.join(OUT, '01_menu_vertical.png') });
      await ctx.close();
    }

    // ================= partida de 2 jogadores (celular deitado) =================
    const context = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 });
    const page = await context.newPage(); vigiar(page);
    const shot = (n, opts) => page.screenshot(Object.assign({ path: path.join(OUT, n + '.png') }, opts || {}));
    const iniciar = async (cfg) => { await page.evaluate((c) => HF.app.iniciarPartida(c), cfg); await page.waitForFunction(() => !!HF.app.partida && !!HF.app.partida.camadas, null, { timeout: 10000 }); };
    const sair = async () => { await page.evaluate(() => HF.app.sairDaPartida()); await sleep(200); await page.evaluate(() => HF.app.ui.mostrar('menu')); };
    const espera = async (pred, ms, rot, arg) => { const fim = Date.now() + (ms || 8000); while (Date.now() < fim) { if (await page.evaluate(pred, arg)) return true; await sleep(40); } throw new Error('tempo esgotado: ' + rot); };

    const t0 = Date.now();
    await page.goto(URL + '?seed=11');
    await page.waitForFunction(() => window.HF && HF.app && HF.app.ui && HF.app.ui.atual === 'menu', null, { timeout: 20000 });
    const carga = Date.now() - t0;
    check('Carregamento: menu pronto em menos de 15 s (celular emulado, servidor local)', carga < 15000, carga + ' ms');
    await page.evaluate(() => { try { localStorage.removeItem('hf.tutorial.v1'); } catch (e) { /* sem armazenamento */ } });
    await iniciar(CFG2);
    await sleep(900);

    // ---- cenário
    const cen = await page.evaluate(() => {
      const P = HF.app.partida, L = P.L;
      return {
        camadas: Object.keys(P.camadas),
        nearest: Object.keys(P.camadas).every((k) => P.textures.get('cen_' + k).source[0].scaleMode === Phaser.ScaleModes.NEAREST),
        escala: Object.values(P.camadas).every((im) => Math.abs(im.scaleX - L.P) < 1e-6),
        P: L.P, c: L.c, nuvens: P.vida.nuvens.length, peixes: P.vida.peixes.length,
        cestinho: !!P.cen.pos.cestinho, horizonte: L.horizonte, bank: L.bankTop, H: L.H
      };
    });
    check('Cenário em três planos: céu (e pôr do sol), água, superfície e margem em pixel art nítida (nearest, 1 pixel da arte = P pixels)',
      ['ceu', 'ceuPor', 'agua', 'superficie', 'margem'].every((k) => cen.camadas.includes(k)) && cen.nearest && cen.escala && cen.P === cen.c, JSON.stringify(cen));
    check('Vida no lago: nuvens, peixes ao fundo e o cestinho do Sirius na margem', cen.nuvens >= 3 && cen.peixes >= 5 && cen.cestinho, JSON.stringify(cen));

    // ---- HUD
    const hud = await page.evaluate(() => {
      const P = HF.app.partida, d = HF.app.dpr, bp = document.getElementById('botao-pausa').getBoundingClientRect();
      return { W: P.L.W / d, H: P.L.H / d, p1: P.placaRect.P1, p2: P.placaRect.P2, d,
        pausa: { x: bp.x, y: bp.y, w: bp.width, h: bp.height, hidden: document.getElementById('botao-pausa').hidden },
        t1: P.tx.P1.hud.text + ' | ' + P.tx.P1.hud2.text, t2: P.tx.P2.hud.text + ' | ' + P.tx.P2.hud2.text, isca: P.pl.P1.iscaHud.visible,
        cor1: P.tx.P1.hud.style.color, cor2: P.tx.P2.hud.style.color, barra: P.L.horizonte > 0 };
    });
    const px = (r) => r && { x: r.x / hud.d, y: r.y / hud.d, w: r.w / hud.d, h: r.h / hud.d };
    const p1 = px(hud.p1), p2 = px(hud.p2);
    check('HUD: placas compactas nos cantos de cima (Alemão à esquerda, ALE à direita), sem a barra preta antiga',
      p1.x < 20 && p1.y < 20 && p2.x + p2.w > hud.W - 70 && p2.y < 20 && p1.h < hud.H * 0.2 && p1.w < hud.W * 0.4, JSON.stringify({ p1, p2 }));
    check('HUD: botão de pausa pequeno no canto superior direito (não mais no centro)', !hud.pausa.hidden && hud.pausa.x + hud.pausa.w > hud.W - 20 && hud.pausa.y < 20 && hud.pausa.w <= 48 && hud.pausa.h <= 48 && !inter(hud.pausa, p2), JSON.stringify(hud.pausa));
    check('HUD: nome com a cor do personagem (vermelho / amarelo), peixes e isca com ícone e nome', /ALEMÃO/.test(hud.t1) && /peixes/.test(hud.t1) && /MINHOCA/.test(hud.t1) && /ALE/.test(hud.t2) && hud.isca && hud.cor1 === '#ff7b7b' && hud.cor2 === '#ffd23f', JSON.stringify([hud.t1, hud.t2, hud.cor1, hud.cor2]));
    const dica0 = await page.evaluate(() => ({ v: HF.app.partida.tx.P1.tutorial.visible, t: HF.app.partida.tx.P1.tutorial.text }));
    check('Dicas do tutorial: aparecem no começo, curtas, na metade de cada jogador', dica0.v && /SEGURE/.test(dica0.t) && dica0.t.length < 60, JSON.stringify(dica0));
    await shot('02_partida_dois_jogadores');
    await shot('05_hud', { clip: { x: 0, y: 0, width: 844, height: 70 } });

    // ---- lugares do lago no alvo (uma carga inteira passa pelos quatro)
    const lugares = await page.evaluate(async () => {
      const P = HF.app.partida, p = P.session.players.P1, vistos = new Set();
      p.press(performance.now());
      const fim = performance.now() + 820;
      while (performance.now() < fim) { await new Promise((r) => requestAnimationFrame(r)); if (P.tx.P1.regiao.visible) vistos.add(P.tx.P1.regiao.text); }
      return [...vistos];
    });
    await shot('07_regioes_alvo_carregando');
    await page.evaluate(() => HF.app.partida.session.players.P1.release(performance.now(), {}));
    check('Regiões: enquanto carrega, o alvo passa pelos quatro lugares (Margem Rasa, Baía dos Lírios, Curva das Pedras, Poço Profundo)',
      ['MARGEM RASA', 'BAÍA DOS LÍRIOS', 'CURVA DAS PEDRAS', 'POÇO PROFUNDO'].every((n) => lugares.includes(n)), JSON.stringify(lugares));

    // ---- ponto de interesse espelhado + pouso no ponto
    const pts = await page.evaluate(() => { const P = HF.app.partida; P.forcarPonto('bolhas', 16); return P.contextoDoLago().pontos.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y), tipo: p.tipo })); });
    await sleep(1200);
    check('Pontos de interesse: espelhados (mesmo tipo e mesma distância nas duas metades)', pts.length === 2 && pts[0].y === pts[1].y && pts[0].tipo === pts[1].tipo && pts[0].x < pts[1].x, JSON.stringify(pts));
    await page.evaluate(() => { const p = HF.app.partida.session.players.P2; p.press(performance.now()); });
    await sleep(333);                                   // 16 m: o medidor sobe 0 → 100 % em 800 ms (6 → 30 m)
    await page.evaluate(() => HF.app.partida.session.players.P2.release(performance.now(), {}));
    await espera(() => HF.app.partida.session.players.P2.state === 'WAITING', 4000, 'boia do P2');
    await sleep(150);
    const noPonto = await page.evaluate(() => { const P = HF.app.partida, p = P.session.players.P2; return { ponto: p.pontoNaAgua && p.pontoNaAgua.tipo, d: p.distance, rot: P.tx.P2.regiao.text, vis: P.tx.P2.regiao.visible }; });
    check('Ponto de interesse: a boia que pousa em cima recebe o efeito e a tela avisa "NO PONTO!"', noPonto.ponto === 'bolhas' && /NO PONTO/.test(noPonto.rot) && noPonto.vis, JSON.stringify(noPonto));
    await shot('08_ponto_de_interesse');

    // ---- medidor de tensão só na briga
    const antes = await page.evaluate(() => !!(HF.app.partida.medidorRect && HF.app.partida.medidorRect.P2));
    await espera(() => HF.app.partida.session.players.P2.state === 'BITE', 15000, 'mordida no ponto');
    await page.evaluate(() => HF.app.partida.session.players.P2.press(performance.now()));
    await espera(() => HF.app.partida.session.players.P2.state === 'FIGHTING', 2000, 'briga');
    await sleep(400);
    const durante = await page.evaluate(() => { const P = HF.app.partida, r = P.medidorRect && P.medidorRect.P2, b = P.pl.P2.sprite.getBounds(); return { r, corpo: { x: b.x + b.width * 0.3, y: b.y + b.height * 0.3, w: b.width * 0.4, h: b.height * 0.7 }, W: P.L.W }; });
    check('Medidor de tensão: compacto, ao lado do pescador, só durante a briga (sem cobrir o corpo)', !antes && durante.r && !inter(durante.r, durante.corpo) && durante.r.x > durante.W * 0.8, JSON.stringify(durante));
    await shot('09_briga_medidor');
    // termina a briga com a política do robô (segura e solta pela tensão)
    await page.evaluate(ROBO);
    await espera(() => ['CAUGHT', 'ESCAPED', 'LINE_BROKEN'].includes(HF.app.partida.session.players.P2.state), 40000, 'fim da briga');
    await page.evaluate(PARAR_ROBO);
    await sleep(500);
    const fim = await page.evaluate(() => { const P = HF.app.partida; return { estado: P.session.players.P2.state, card: P.cardRect.P2, titulo: P.tx.P2.titulo.text, dlg: P.dlgRect }; });
    check('Cartão de resultado com identidade (fita com o título), no alto da metade, sem cobrir a caixa de diálogo', fim.card && fim.titulo && (!fim.dlg || !inter(fim.card, fim.dlg)), JSON.stringify(fim));
    await shot(fim.estado === 'CAUGHT' ? '10_captura_de_peixe' : '10_resultado_da_briga');

    // ---- diálogos: ALE, Maria, Sirius acordado, Sirius dormindo
    const forcar = (filtro) => page.evaluate((f) => {
      const n = HF.app.partida.narrador;
      const c = n.cenas.find((x) => x.g === 'silencio' && (!x.m || x.m === n.modo) && (f.sirius ? x.f[0][0] === 'sirius' : x.f[0][0] === f.quem && !x.f.some((l) => l[0] === 'sirius')) && (!x.q || (f.sirius && x.q.sirius === 'acordado' && Object.keys(x.q).length === 1)));
      n.forcarCena(c.id); return c.id;
    }, filtro);
    await page.evaluate(() => HF.app.partida.narrador.forcarSirius('acordado'));
    await sleep(300);
    await forcar({ quem: 'ale' }); await sleep(1300); await shot('11_dialogo_ale');
    const dAle = await page.evaluate(() => ({ nome: HF.app.partida.caixa.nome.text, ret: HF.app.partida.caixa.retrato.texture.key }));
    await forcar({ quem: 'maria' }); await sleep(1300); await shot('12_dialogo_maria');
    const dMaria = await page.evaluate(() => ({ nome: HF.app.partida.caixa.nome.text, ret: HF.app.partida.caixa.retrato.texture.key }));
    await forcar({ sirius: true }); await sleep(500); await shot('13_sirius_acordado');
    const dSirius = await page.evaluate(() => ({ nome: HF.app.partida.caixa.nome.text, ret: HF.app.partida.caixa.retrato.texture.key }));
    check('Diálogos: retrato e nome certos para ALE, Maria e Sirius (um por vez)', /^ALE/.test(dAle.nome) && /^rosto_ale_/.test(dAle.ret) && /^MARIA/.test(dMaria.nome) && /^rosto_maria_/.test(dMaria.ret) && /SIRIUS/.test(dSirius.nome) && /balbuciando/.test(dSirius.nome) && /^rosto_sirius_/.test(dSirius.ret), JSON.stringify([dAle, dMaria, dSirius]));
    await sleep(2500);
    await page.evaluate(() => { const n = HF.app.partida.narrador; n.forcarSirius('dormindo'); const c = n.cenas.find((x) => x.g === 'sirius-dormiu'); n.forcarCena(c.id); });
    await sleep(1600); await shot('14_sirius_dormindo');

    // ---- eventos do mundo (e limpeza dos objetos)
    const base = await page.evaluate(() => HF.app.partida.children.list.length);
    await page.evaluate(() => { const P = HF.app.partida; ['salto', 'cardume', 'objeto', 'passaro'].forEach((t) => P.forcarEvento(t)); });
    await sleep(500); await shot('15_eventos_do_lago');
    await page.evaluate(() => HF.app.partida.forcarEvento('chuva'));
    await sleep(2500); await shot('16_chuva_leve');
    await page.evaluate(() => HF.app.partida.forcarEvento('entardecer'));
    await sleep(800); await shot('17_entardecer');
    const comEventos = await page.evaluate(() => HF.app.partida.children.list.length);
    check('Eventos do mundo (peixe saltando, cardume, objeto, pássaros, chuva, entardecer) sem erros', comEventos >= base, base + ' → ' + comEventos);

    // ---- sessão longa: robô pescando nas duas metades + eventos; FPS, memória e objetos estáveis
    await sair();
    await iniciar(CFG2);
    await sleep(800);
    await page.evaluate(ROBO);
    const amostras = [];
    for (let i = 0; i < 18; i++) {                     // 90 s
      if (i % 3 === 0) await page.evaluate((k) => { const P = HF.app.partida, tipos = ['salto', 'cardume', 'objeto', 'passaro', 'chuva', 'salto']; P.forcarEvento(tipos[k % tipos.length]); if (k % 2 === 0) P.forcarPonto(['bolhas', 'sombra', 'correnteza', 'lirios'][k % 4]); }, i / 3);
      await sleep(5000);
      amostras.push(await page.evaluate(() => ({ fps: Math.round(HF.app.game.loop.actualFps), heap: performance.memory ? performance.memory.usedJSHeapSize : 0, objetos: HF.app.partida.children.list.length,
        texturas: HF.app.game.textures.getTextureKeys().length, capturas: HF.app.partida.session.players.P1.stats.capturas + HF.app.partida.session.players.P2.stats.capturas })));
    }
    await page.evaluate(PARAR_ROBO);
    const fps = amostras.map((a) => a.fps), media = fps.reduce((a, b) => a + b, 0) / fps.length;
    const heapIni = amostras[1].heap, heapFim = amostras[amostras.length - 1].heap;
    const objIni = Math.min(...amostras.slice(0, 3).map((a) => a.objetos)), objFim = amostras[amostras.length - 1].objetos;
    const tex = amostras.map((a) => a.texturas);
    console.log('    amostras:', JSON.stringify(amostras.map((a) => [a.fps, Math.round(a.heap / 1048576), a.objetos, a.texturas])));
    check('Desempenho (Edge do computador, celular emulado): média ≥ 40 FPS e mínimo ≥ 25 em 90 s com eventos', media >= 40 && Math.min(...fps) >= 25, 'média ' + media.toFixed(1) + ' · mínimo ' + Math.min(...fps));
    check('Memória: heap JS estável (cresce menos de 25 MB em 90 s) e texturas sem acumular', (heapFim - heapIni) < 25 * 1048576 && Math.max(...tex) - Math.min(...tex) <= 2, Math.round((heapFim - heapIni) / 1048576) + ' MB · texturas ' + Math.min(...tex) + '–' + Math.max(...tex));
    check('Objetos da cena estáveis (eventos e efeitos são limpos ao terminar)', objFim <= objIni + 30, objIni + ' → ' + objFim);
    check('A pescaria aconteceu de verdade durante a sessão (o robô pegou peixes)', amostras[amostras.length - 1].capturas >= 2, String(amostras[amostras.length - 1].capturas));

    // ---- dicas somem depois do tutorial
    await sair();
    await page.evaluate(() => { localStorage.setItem('hf.tutorial.v1', JSON.stringify({ arremessos: 3, fisgadas: 3, capturas: 3 })); });
    await iniciar(CFG2);
    await sleep(1500);
    const dica1 = await page.evaluate(() => ({ v: HF.app.partida.tx.P1.tutorial.visible, a: HF.app.partida.tx.P1.tutorial.alpha }));
    check('Dicas do tutorial: somem depois de 3 acertos de cada etapa (as instruções não ficam ocupando a tela)', !dica1.v || dica1.a < 0.05, JSON.stringify(dica1));
    await page.evaluate(() => { const n = HF.app.partida.narrador; n.atual = null; });
    await sleep(400);
    await shot('04_cenario_completo');

    // ---- 1 jogador
    await sair();
    await iniciar({ modo: 1, personagens: { P1: 'ale' }, iscas: { P1: 'artificial' }, regioes: true });
    await sleep(900);
    await page.evaluate(() => { const n = HF.app.partida.narrador; const c = n.cenas.find((x) => x.m === 1 && x.f.length >= 2 && x.f[0][0] === 'alemao'); if (c) n.forcarCena(c.id); });
    await sleep(1300);
    const um = await page.evaluate(() => { const P = HF.app.partida; return { ids: P.ids, placas: Object.keys(P.placaRect || {}), d: P.dlgRect, corpo: P.pl.P1.sprite.getBounds() }; });
    check('1 jogador: uma placa, o pescador grande à esquerda e a caixa de diálogo ao lado, sem cobrir o pescador', um.ids.length === 1 && um.placas.length === 1 && um.d && um.d.x > um.corpo.x + um.corpo.width * 0.7, JSON.stringify(um));
    await shot('03_partida_um_jogador');
    await sair();

    // ---- outra tela de celular (Pixel 7 deitado, 915×412 @2,625)
    await context.close();
    const ctx2 = await browser.newContext({ viewport: { width: 915, height: 412 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2.625 });
    const pg2 = await ctx2.newPage(); vigiar(pg2);
    await pg2.goto(URL + '?seed=5');
    await pg2.waitForFunction(() => window.HF && HF.app && HF.app.ui && HF.app.ui.atual === 'menu', null, { timeout: 20000 });
    await pg2.evaluate((c) => HF.app.iniciarPartida(c), CFG2);
    await pg2.waitForFunction(() => !!HF.app.partida && !!HF.app.partida.camadas, null, { timeout: 10000 });
    await sleep(900);
    const g2 = await pg2.evaluate(() => { const P = HF.app.partida, d = HF.app.dpr, bp = document.getElementById('botao-pausa').getBoundingClientRect(); return { p1: P.placaRect.P1, p2: P.placaRect.P2, pausa: { x: bp.x * d, y: bp.y * d, w: bp.width * d, h: bp.height * d }, W: P.L.W }; });
    check('Tela 915×412 (Pixel 7): placas e pausa nos cantos, sem sobreposição', !inter(g2.p1, g2.p2) && !inter(g2.pausa, g2.p2) && g2.p2.x + g2.p2.w <= g2.W, JSON.stringify(g2));
    await pg2.screenshot({ path: path.join(OUT, '06_partida_915x412.png') });
    await ctx2.close();

    // ---- vídeo curto de demonstração: gravado pelo próprio navegador (MediaRecorder no canvas do jogo)
    try {
      const ctxV = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
      const pv = await ctxV.newPage(); vigiar(pv);
      await pv.goto(URL + '?seed=3');
      await pv.waitForFunction(() => window.HF && HF.app && HF.app.ui && HF.app.ui.atual === 'menu', null, { timeout: 20000 });
      await pv.evaluate((c) => HF.app.iniciarPartida(c), CFG2);
      await pv.waitForFunction(() => !!HF.app.partida && !!HF.app.partida.camadas, null, { timeout: 10000 });
      const gravando = await pv.evaluate(() => {
        const cv = HF.app.game.canvas, tipo = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((t) => window.MediaRecorder && MediaRecorder.isTypeSupported(t));
        if (!tipo || !cv.captureStream) return false;
        window.__pedacos = [];
        window.__rec = new MediaRecorder(cv.captureStream(30), { mimeType: tipo, videoBitsPerSecond: 2500000 });
        window.__rec.ondataavailable = (e) => { if (e.data && e.data.size) window.__pedacos.push(e.data); };
        window.__rec.start(1000);
        return tipo;
      });
      if (!gravando) throw new Error('MediaRecorder indisponível');
      await pv.evaluate(ROBO);
      await sleep(5000);
      await pv.evaluate(() => { const P = HF.app.partida; P.forcarPonto('sombra', 25); P.forcarEvento('salto'); P.narrador.forcarCena(P.narrador.cenas.find((x) => x.g === 'silencio' && x.f.length === 4 && !x.q && !x.m).id); });
      await sleep(9000);
      await pv.evaluate(() => { const P = HF.app.partida; P.forcarEvento('cardume'); P.forcarEvento('passaro'); });
      await sleep(7000);
      await pv.evaluate(() => { HF.app.partida.forcarEvento('entardecer'); HF.app.partida.forcarEvento('chuva'); });
      await sleep(8000);
      const b64 = await pv.evaluate(() => new Promise((res) => {
        window.__rec.onstop = async () => { const blob = new Blob(window.__pedacos, { type: 'video/webm' }); const buf = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 32768) s += String.fromCharCode.apply(null, buf.subarray(i, i + 32768)); res(btoa(s)); };
        window.__rec.stop();
      }));
      await pv.evaluate(PARAR_ROBO);
      await ctxV.close();
      fs.writeFileSync(path.join(OUT, 'demo_sessao.webm'), Buffer.from(b64, 'base64'));
      console.log('    vídeo: demo_sessao.webm (' + Math.round(b64.length * 0.75 / 1024) + ' KB, ' + gravando + ')');
    } catch (e) { console.log('    (vídeo não gravado neste ambiente: ' + e.message.split('\n')[0] + ')'); }
  } catch (e) {
    check('Execução do roteiro sem travar', false, e.message);
  }
  check('Nenhum erro de JavaScript nem arquivo faltando', errors.length === 0, JSON.stringify(errors.slice(0, 5)));
  const passed = results.filter((r) => r.ok).length;
  console.log('\n' + passed + ' de ' + results.length + ' verificações passaram.');
  fs.writeFileSync(path.join(OUT, 'resultado-e2e-identidade.json'), JSON.stringify({ results, errors }, null, 2));
  await browser.close();
  process.exit(passed === results.length ? 0 : 1);
})();
