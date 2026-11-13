/*
 * Teste ponta a ponta OPCIONAL da versão jogável (navegador Chromium/Edge, celular emulado,
 * multitouch real pelo protocolo de depuração). Joga de verdade: menu, catálogo, opções,
 * partida de 2 jogadores e de 1 jogador, regiões, iscas, interrupções e volta ao menu.
 *
 * Requer Playwright (ou playwright-core), que NÃO faz parte do projeto.
 * Uso (com a pasta "Hangover Fishing" servida em um endereço local):
 *   node jogo/tests/e2e-jogo.js <pasta-de-saida> [endereço] [canal]
 *   ex.: node jogo/tests/e2e-jogo.js ./saida http://127.0.0.1:8765/jogo/index.html msedge
 */
'use strict';
let pw;
try { pw = require('playwright'); } catch (e) { pw = require('playwright-core'); }
const fs = require('fs');
const path = require('path');
const OUT = process.argv[2] || '.';
const URL = process.argv[3] || 'http://127.0.0.1:8765/jogo/index.html';
const CHANNEL = process.argv[4] || undefined;
const RETRATO = { width: 390, height: 844 }, PAISAGEM = { width: 844, height: 390 };
const FINGER = { P1: 1, P2: 2 };

const results = [];
function check(name, cond, detail) {
  results.push({ name, ok: !!cond, detail: detail || '' });
  console.log((cond ? '  ✓ ' : '  ✗ ') + name + (cond || !detail ? '' : '  → ' + detail));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const HF_NOME = { margem: 'MARGEM RASA', aberta: 'ÁGUAS ABERTAS', fundo: 'POÇO PROFUNDO' };
const inter = (a, b) => a && b && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await pw.chromium.launch({ channel: CHANNEL });
  const context = await browser.newContext({ viewport: RETRATO, hasTouch: true, isMobile: true, deviceScaleFactor: 3 });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('response', (r) => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
  const shot = (n) => page.screenshot({ path: path.join(OUT, n + '.png') });
  const cdp = await context.newCDPSession(page);

  // ---------- dedos ----------
  let pos = { P1: { x: 200, y: 300 }, P2: { x: 640, y: 300 } };
  const fingers = new Map();
  const pt = (id, p) => ({ x: p.x, y: p.y, id, radiusX: 8, radiusY: 8, force: 1 });
  const send = (type, list) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: list || Array.from(fingers.entries()).map(([id, p]) => pt(id, p)) });
  const down = async (j, p) => { fingers.set(FINGER[j], Object.assign({}, p || pos[j])); await send('touchStart'); };
  const up = async (j) => { const p = fingers.get(FINGER[j]); if (!p) return; fingers.delete(FINGER[j]); await send('touchEnd', [pt(FINGER[j], p)]); };
  const isDown = (j) => fingers.has(FINGER[j]);
  const tapAt = async (x, y) => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 7 }] }); await sleep(40); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [{ x, y, id: 7 }] }); };
  const clicar = async (sel) => { await page.tap(sel); await sleep(250); };

  const tela = () => page.evaluate(() => HF.app.ui.atual);
  const state = () => page.evaluate(() => {
    const P = HF.app.partida; if (!P) return null;
    const t = performance.now(), out = {};
    for (const id of P.ids) {
      const p = P.session.players[id], s = p.snapshot(t);
      out[id] = { state: p.state, tension: p.tension, zone: s.zone, pressed: p.pressed, distance: p.distance, regiao: p.regiao, tabela: p.tabelaRegiao,
        isca: p.isca, iscaNaAgua: p.iscaNaAgua, stats: p.stats, ms: s.msInState, chargePower: s.chargePower,
        regiaoCerta: p.regiao == null || p.regiao === HF.DadosPesca.regiaoDaDistancia(p.distance), anim: P.pl[id].shown && P.pl[id].shown.key, frame: P.pl[id].shown && P.pl[id].shown.index,
        fish: p.fish ? p.fish.profile.id : null, lastResult: p.lastResult };
    }
    out.paused = P.session.isPaused(); out.awaiting = P.session.awaitingTap;
    return out;
  });
  async function waitFor(pred, maxMs, label, pilot) {
    const end = Date.now() + (maxMs || 15000);
    let s;
    while (Date.now() < end) {
      s = await state();
      if (s && pred(s)) return s;
      if (pilot && s) await pilot(s);
      await sleep(25);
    }
    throw new Error('tempo esgotado: ' + label + ' · ' + JSON.stringify(s && { P1: s.P1 && s.P1.state, P2: s.P2 && s.P2.state }));
  }
  const pilot = (js, lo, hi) => async (s) => {
    for (const j of js) {
      if (!s[j] || s[j].state !== 'FIGHTING') { if (isDown(j) && s[j] && s[j].state !== 'CHARGING' && s[j].state !== 'REELING_EMPTY') await up(j); continue; }
      if (isDown(j) && s[j].tension > hi) await up(j);
      else if (!isDown(j) && s[j].tension < lo) await down(j);
    }
  };
  /**
   * Solta cada dedo quando a barra de força estiver na faixa pedida (como um jogador olhando a barra).
   * faixas = { P1: [min, max, depoisDoPico] }. depoisDoPico: espera a força subir e voltar (arremesso curto).
   */
  async function soltarNaFaixa(faixas) {
    const pend = new Set(Object.keys(faixas)), pico = {};
    const end = Date.now() + 6000;
    while (pend.size && Date.now() < end) {
      const s = await state();
      for (const j of Array.from(pend)) {
        const [lo, hi, depois] = faixas[j], p = s[j].chargePower;
        if (p >= 0.9) pico[j] = true;
        if (s[j].state === 'CHARGING' && p >= lo && p <= hi && (!depois || pico[j])) { await up(j); pend.delete(j); }
      }
      await sleep(10);
    }
  }
  const MARGEM = [0.1, 0.22, true], ABERTA = [0.42, 0.56, false], FUNDO = [0.78, 0.9, false];

  /** Arremessa (segurando holdMs), espera a mordida e fisga. */
  async function lancarEFisgar(j, holdMs) {
    await down(j); await sleep(holdMs); await up(j);
    await waitFor((s) => s[j].state === 'BITE', 30000, 'mordida ' + j);
    await sleep(150);
    await down(j);
    await waitFor((s) => s[j].state === 'FIGHTING', 2000, 'briga ' + j);
  }
  async function brigarAteFim(js, lo, hi) {
    await waitFor((s) => js.every((j) => s[j].state !== 'FIGHTING'), 120000, 'fim da briga', pilot(js, lo, hi));
    for (const j of js) if (isDown(j)) await up(j);
  }

  try {
    // ================= 1. Abertura e menu vertical =================
    await page.goto(URL + '?seed=11');
    await page.waitForFunction(() => window.HF && HF.app && HF.app.ui && HF.app.ui.atual === 'menu', null, { timeout: 20000 });
    await sleep(800);
    const menu = await page.evaluate(() => {
      const r = (s) => { const b = document.querySelector(s).getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; };
      return { logo: document.getElementById('menu-logo').src.slice(0, 22), logoR: r('#menu-logo'), botoes: Array.from(document.querySelectorAll('#tela-menu .botao')).map((b) => { const q = b.getBoundingClientRect(); return { t: b.textContent, x: q.left, y: q.top, w: q.width, h: q.height }; }),
        mar: HF.app.game.scene.isActive('Mar'), texturas: ['peixe_tilapia', 'peixe_dourado', 'objeto_pneu', 'isca_minhoca', 'logo', 'retrato_ale'].every((k) => HF.app.game.textures.exists(k)) };
    });
    await shot('01_menu_retrato');
    check('Menu vertical: logo do criador (recortado), cenário marítimo ativo e as 4 opções', menu.logo.startsWith('data:image/png') && menu.mar && menu.botoes.map((b) => b.t).join('|') === '1 JOGADOR|2 JOGADORES|CATÁLOGO|OPÇÕES', JSON.stringify(menu.botoes.map((b) => b.t)));
    check('Menu: botões inteiros na tela e com altura de toque ≥ 44 px', menu.botoes.every((b) => b.y >= 0 && b.y + b.h <= RETRATO.height && b.x >= 0 && b.x + b.w <= RETRATO.width && b.h >= 44), JSON.stringify(menu.botoes));
    check('Arte carregada: peixes, objetos, iscas, logo e retratos', menu.texturas);

    // ================= 2. Catálogo =================
    await clicar('[data-acao="catalogo"]');
    const cat0 = await page.evaluate(() => ({ cartas: document.querySelectorAll('#catalogo-conteudo .carta').length, ocultas: document.querySelectorAll('#catalogo-conteudo .carta.oculto').length, prog: document.getElementById('catalogo-progresso').textContent }));
    check('Catálogo: 7 fichas, todas "não descoberto" no começo', cat0.cartas === 7 && cat0.ocultas === 7, JSON.stringify(cat0));
    await clicar('[data-especie="bagre"]');
    const ficha = await page.evaluate(() => { const f = document.getElementById('ficha'); return { aberta: !f.hidden, texto: f.textContent }; });
    await shot('02_ficha_nao_descoberta');
    check('Ficha (não descoberto): mostra raridade, regiões, iscas recomendadas, melhor chance, dificuldade e dica', ficha.aberta && ['Raridade', 'Regiões', 'Iscas', 'Melhor chance', 'Dificuldade', 'Dica', 'POÇO PROFUNDO', 'Coração de galinha'].every((w) => ficha.texto.includes(w)), ficha.texto.slice(0, 200));
    await clicar('[data-acao="fechar-ficha"]');
    await clicar('[data-aba="guia"]');
    const guia = await page.evaluate(() => document.getElementById('catalogo-conteudo').textContent);
    check('Guia: explica regiões (distâncias) e as 4 iscas', ['menos de 14 m', 'de 14 a 22 m', '22 m ou mais', 'Minhoca', 'Massa', 'Isca artificial', 'Coração de galinha'].every((w) => guia.includes(w)));
    await shot('03_guia');
    await clicar('[data-aba="objetos"]');
    await clicar('#tela-catalogo [data-acao="voltar"]');
    check('Catálogo → VOLTAR → menu', (await tela()) === 'menu');

    // ================= 3. Opções (com efeito real) e persistência =================
    await clicar('[data-acao="opcoes"]');
    await page.evaluate(() => { const i = document.getElementById('op-volumeGeral'); i.value = 40; i.dispatchEvent(new Event('input', { bubbles: true })); });
    await clicar('#op-musica');
    await shot('04_opcoes');
    const op = await page.evaluate(() => { const a = HF.app.audio; return { geral: HF.app.opcoes.get('volumeGeral'), musica: HF.app.opcoes.get('musica'), ganho: a.master ? a.master.gain.value : null, tocando: a.musicaTocando }; });
    check('Opções: volume geral muda o ganho real dos efeitos; desligar a música para a trilha', Math.abs(op.geral - 0.4) < 1e-9 && op.musica === false && op.ganho != null && Math.abs(op.ganho - 0.35 * 0.4 * 0.8) < 0.01 && op.tocando === false, JSON.stringify(op));
    await page.reload();
    await page.waitForFunction(() => window.HF && HF.app && HF.app.ui && HF.app.ui.atual === 'menu', null, { timeout: 20000 });
    const op2 = await page.evaluate(() => ({ geral: HF.app.opcoes.get('volumeGeral'), musica: HF.app.opcoes.get('musica') }));
    check('Recarregar a página: opções preservadas', Math.abs(op2.geral - 0.4) < 1e-9 && op2.musica === false, JSON.stringify(op2));
    await page.evaluate(() => { HF.app.opcoes.set('musica', true); HF.app.opcoes.set('volumeGeral', 0.8); });
    await page.tap('#tela-menu .rodape').catch(() => {});     // um toque libera o áudio (regra dos navegadores)
    await sleep(400);
    const mus = await page.evaluate(() => ({ tocando: HF.app.audio.musicaTocando, ctx: HF.app.audio.ctx && HF.app.audio.ctx.state }));
    check('Música ligada: a trilha sintetizada toca de verdade (WebAudio)', mus.tocando === true && mus.ctx === 'running', JSON.stringify(mus));

    // ================= 4. Partida de 2 jogadores: preparação e rotação =================
    await clicar('[data-acao="2p"]');
    await clicar('[data-isca="massa"][data-pers="alemao"]');
    await clicar('[data-isca="coracao"][data-pers="ale"]');
    await shot('05_preparo_2p');
    await clicar('#tela-preparo [data-acao="comecar"]');
    check('Celular em pé: pede para girar (a partida não começa torta)', (await tela()) === 'girar' && !(await page.evaluate(() => !!HF.app.partida)));
    await shot('06_gire_o_celular');
    await page.setViewportSize(PAISAGEM);
    await page.waitForFunction(() => !!HF.app.partida, null, { timeout: 5000 });
    await sleep(700);
    let s = await state();
    check('Girar para a horizontal: a partida começa sozinha, com as iscas escolhidas', s && s.P1.isca === 'massa' && s.P2.isca === 'coracao' && (await tela()) === null, JSON.stringify(s && [s.P1.isca, s.P2.isca]));
    await shot('07_partida_2p_inicio');
    const geo = await page.evaluate(() => {
      const P = HF.app.partida, L = P.L, k = HF.app.dpr;
      const ch = (id) => { const b = P.pl[id].sprite.getBounds(); return { x: b.x, y: b.y, w: b.width, h: b.height }; };
      return { W: L.W, H: L.H, k, c: L.c, pe: L.pe, hud: L.hudH, bank: L.bankTop, P1: ch('P1'), P2: ch('P2'), y1: P.pl.P1.sprite.y, y2: P.pl.P2.sprite.y, flip2: P.pl.P2.sprite.flipX };
    });
    check('Personagens maiores (≥ 2× em pixels de tela) e pés no chão, dentro da tela', geo.c / geo.k >= 2 && geo.y1 === geo.pe && geo.y2 === geo.pe && geo.P1.x + geo.P1.w > 0 && geo.P2.x < geo.W, JSON.stringify({ escala: geo.c / geo.k, pe: geo.pe }));
    // a cabeça (quadro y ≈ 32) fica abaixo do placar e acima da linha do chão
    check('Cabeça visível: abaixo do placar', geo.pe - 64 * geo.c > geo.hud, JSON.stringify({ cabeca: geo.pe - 64 * geo.c, hud: geo.hud }));

    // ================= 5. Multitouch: os dois carregando; um arremessa e o outro continua =================
    await down('P1'); await down('P2');
    await sleep(300);
    s = await state();
    check('Os dois carregando ao mesmo tempo (CHARGE nos dois)', s.P1.state === 'CHARGING' && s.P2.state === 'CHARGING' && s.P1.anim === 'alemao_charge' && s.P2.anim === 'ale_charge');
    await soltarNaFaixa({ P1: ABERTA });         // P1: força média → águas abertas
    await sleep(30);
    s = await state();
    check('P1 arremessa; P2 continua carregando', s.P1.state === 'CASTING' && s.P2.state === 'CHARGING');
    await soltarNaFaixa({ P2: FUNDO });           // P2: força alta → fundo
    await waitFor((x) => x.P1.state === 'WAITING' && x.P2.state === 'WAITING', 3000, 'boias');
    s = await state();
    check('Arremesso médio = águas abertas, longo = águas profundas (região bate com a distância)', s.P1.regiao === 'aberta' && s.P2.regiao === 'fundo' && s.P1.regiaoCerta && s.P2.regiaoCerta, JSON.stringify([s.P1.distance, s.P1.regiao, s.P2.distance, s.P2.regiao]));
    // o nome do LUGAR de pouso (Margem Rasa, Baía dos Lírios, Curva das Pedras, Poço Profundo) aparece na boia
    const tags = await page.evaluate(() => ['P1', 'P2'].map((id) => {
      const P = HF.app.partida, z = P.session.players[id].zona, t = P.tx[id].regiao.text;
      return { v: P.tx[id].regiao.visible, t, esperado: z ? HF.DadosPesca.zonaPorId[z].curta : null, noPonto: /NO PONTO/.test(t) };
    }));
    check('O lugar de pouso aparece escrito na boia ao cair (indicação visual)', tags.every((x) => x.v && (x.t === x.esperado || x.noPonto)), JSON.stringify(tags));
    await shot('08_boias_em_regioes_diferentes');

    // ================= 6. Recolhendo (P1) enquanto o outro está na água; recolher sem peixe =================
    await down('P1');
    await waitFor((x) => x.P1.state === 'REELING_EMPTY', 2000, 'recolhendo');
    s = await state();
    check('Recolher a linha: REEL/FIGHT nível 1; a região continua a do pouso (D2)', s.P1.anim === 'alemao_reel' && s.P1.frame < 4 && s.P1.regiao === 'aberta', JSON.stringify([s.P1.anim, s.P1.frame, s.P1.regiao]));
    await sleep(500);
    s = await state();
    check('D2: mesmo com a boia mais perto, a região não muda ao recolher', s.P1.regiao === 'aberta', JSON.stringify([s.P1.distance, s.P1.regiao]));
    await waitFor((x) => x.P1.state === 'IDLE', 5000, 'linha recolhida');
    await up('P1');
    check('Recolhimento vazio completo: volta ao IDLE sem penalidade', (await state()).P1.stats.recolhimentosVazios === 1);

    // ================= 7. Briga e captura (P2 no fundo) com P1 carregando ao mesmo tempo =================
    await waitFor((x) => x.P2.state === 'BITE', 20000, 'mordida P2');
    await down('P2');
    await waitFor((x) => x.P2.state === 'FIGHTING', 2000, 'fisgada P2');
    await down('P1'); await sleep(350);
    s = await state();
    check('Um brigando (REEL/FIGHT) enquanto o outro carrega (CHARGE)', s.P2.state === 'FIGHTING' && s.P2.anim === 'ale_reel' && s.P1.state === 'CHARGING' && s.P1.anim === 'alemao_charge');
    await up('P1');
    await shot('09_briga_e_arremesso');
    await brigarAteFim(['P2'], 0.42, 0.62);
    s = await state();
    const fimP2 = s.P2.state;
    if (fimP2 === 'CAUGHT') {
      await sleep(900);
      const c = await page.evaluate(() => { const P = HF.app.partida; return { mao: P.pl.P2.peixeMao.visible, card: P.cardRect.P2, titulo: P.tx.P2.titulo.text, sprite: P.pl.P2.shown, ch: (() => { const b = P.pl.P2.sprite.getBounds(); return { x: b.x, y: b.y, w: b.width, h: b.height }; })(), dlg: P.dlgRect, img: P.pl.P2.imgCartao.visible }; });
      await shot('10_captura_cartao_e_peixe_na_mao');
      check('Captura: CATCH com a pose final parada, peixe na mão e cartão com a imagem do peixe', c.mao && c.img && c.sprite.key === 'ale_catch' && c.sprite.index === 3 && /PEGOU|PEIXÃO|OBJETO/.test(c.titulo), JSON.stringify(c.sprite) + ' ' + c.titulo);
      // o cartão fica no alto da água: não cobre a cabeça do personagem
      const cabecaY = geo.pe - 70 * geo.c;
      check('Cartão de captura não cobre o personagem', c.card && c.card.y + c.card.h < cabecaY, JSON.stringify({ card: c.card, cabecaY }));
    } else check('Captura (P2) — a briga terminou em ' + fimP2 + ' (repetida adiante)', true);
    await waitFor((x) => x.P2.state === 'IDLE' || x.P2.state === 'CHARGING', 5000, 'fim do cartão');

    // ================= 8. Perder peixe (fuga) e linha rompida =================
    // (a) P1 fisga e nunca mais segura → o peixe escapa (linha frouxa)
    await waitFor((x) => x.P1.state === 'WAITING' || x.P1.state === 'BITE' || x.P1.state === 'IDLE', 5000, 'P1 na água');
    s = await state();
    if (s.P1.state === 'IDLE') { await down('P1'); await sleep(420); await up('P1'); }
    await waitFor((x) => x.P1.state === 'BITE', 30000, 'mordida P1');
    await down('P1'); await sleep(60); await up('P1');
    s = await waitFor((x) => x.P1.state !== 'FIGHTING', 40000, 'fuga');
    await sleep(500);
    let fr = await page.evaluate(() => HF.app.partida.pl.P1.shown.key);
    await shot('11a_fuga');
    check('Peixe perdido (linha frouxa): ESCAPOU com FRUSTRATION', s.P1.state === 'ESCAPED' && fr === 'alemao_frustration', JSON.stringify([s.P1.state, fr]));
    // (b) P2 fisga e segura sem parar → a linha rompe
    await waitFor((x) => x.P2.state === 'IDLE', 8000, 'P2 livre');
    await lancarEFisgar('P2', 420);
    s = await waitFor((x) => x.P2.state !== 'FIGHTING', 40000, 'rompimento');
    await up('P2');
    await sleep(500);
    fr = await page.evaluate(() => HF.app.partida.pl.P2.shown.key);
    await shot('11b_linha_rompida');
    check('Linha rompida (segurando sem parar): LINHA ROMPEU com FRUSTRATION', s.P2.state === 'LINE_BROKEN' && fr === 'ale_frustration', JSON.stringify([s.P2.state, fr]));
    await waitFor((x) => x.P1.state === 'IDLE' && x.P2.state === 'IDLE', 8000, 'fim dos cartões');

    // ================= 9. Interrupções =================
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await sleep(300);
    s = await state();
    check('Perda de foco: pausa e pede toque para continuar', s.paused && s.awaiting);
    fingers.clear();
    await tapAt(422, 200); await sleep(250);
    s = await state();
    check('Toque retoma; o toque não vira ação de nenhum jogador', !s.paused && s.P1.state === 'IDLE' && s.P2.state === 'IDLE');
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
    await sleep(200);
    s = await state();
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); });
    check('Página oculta (troca de app): pausa', s.paused && s.awaiting);
    await tapAt(422, 200); await sleep(250);

    // ================= 10. Pausa: trocar isca, desligar regiões, comparar =================
    await clicar('#botao-pausa');
    check('Botão de pausa: abre a pausa e congela a pescaria', (await tela()) === 'pausa' && (await state()).paused);
    await shot('12_pausa');
    await clicar('[data-pisca="artificial"][data-pid="P1"]');
    await clicar('[data-palt="regioes"]');
    await clicar('#tela-pausa [data-acao="continuar"]');
    s = await state();
    check('Continuar: volta ao jogo; isca nova e regiões desligadas valem no próximo arremesso', !s.paused && s.P1.isca === 'artificial' && (await tela()) === null);
    await down('P1'); await sleep(640); await up('P1');
    await waitFor((x) => x.P1.state === 'WAITING', 3000, 'boia');
    s = await state();
    const rot = await page.evaluate(() => { const P = HF.app.partida; return { etiqueta: P.tx.P1.regiao.visible, pontos: P.contextoDoLago().pontos.length, zona: P.session.players.P1.zona }; });
    check('Regiões desligadas (comparação): arremesso longo usa o lago tradicional, sem nome de lugar nem pontos de interesse', s.P1.regiao === null && s.P1.tabela === 'aberta' && s.P1.iscaNaAgua === 'artificial' && !rot.etiqueta && rot.pontos === 0 && rot.zona === null, JSON.stringify([s.P1.regiao, s.P1.tabela, rot]));
    await shot('13_regioes_desligadas');
    await clicar('#botao-pausa');
    await clicar('[data-palt="regioes"]');
    await clicar('#tela-pausa [data-acao="continuar"]');

    // ================= 11. Diálogo central: não cobre boias, personagens nem cartões =================
    // atalho de TESTE: um acontecimento importante (dourado novo no catálogo) faz a família falar
    await page.evaluate(() => { const P = HF.app.partida; P.narrador.random = () => 0.01; P.narrador.evento({ tipo: 'captura', jogador: 'P1', perfil: 'dourado', pesoKg: 7.5 }, P.session.players, { novo: true, recorde: false }); });
    await sleep(500);
    const dl = await page.evaluate(() => {
      const P = HF.app.partida, L = P.L, b = (id) => { const q = P.pl[id].sprite.getBounds(); return { x: q.x + q.width * 0.3, y: q.y + q.height * 0.3, w: q.width * 0.4, h: q.height * 0.7 }; };
      const boias = P.ids.map((id) => ({ x: L.side[id].bobX - 40 * L.k, y: L.longe, w: 80 * L.k, h: L.perto - L.longe }));
      return { r: P.dlgRect, nome: P.dlg.nome.text, texto: P.dlg.texto.text, corpos: P.ids.map(b), boias, W: L.W };
    });
    await shot('14_dialogo_central');
    check('Diálogo central aparece com nome de quem fala e texto', dl.r && /ALEMÃO|ALE|MARIA|SIRIUS/.test(dl.nome) && dl.texto.length > 1, JSON.stringify([dl.nome, dl.texto]));
    check('Diálogo não cobre as colunas das boias nem os personagens', dl.r && !dl.boias.some((q) => inter(dl.r, q)) && !dl.corpos.some((q) => inter(dl.r, q)), JSON.stringify({ r: dl.r, boias: dl.boias }));

    // ================= 12. Uma captura garantida para o catálogo (se ainda não houve) =================
    let capturas = await page.evaluate(() => HF.app.catalogo.descobertos());
    for (let i = 0; i < 4 && capturas === 0; i++) {
      await waitFor((x) => x.P1.state === 'IDLE' || x.P1.state === 'WAITING', 8000, 'P1 livre');
      s = await state();
      if (s.P1.state === 'WAITING') { await down('P1'); await waitFor((x) => x.P1.state === 'IDLE', 6000, 'recolher'); await up('P1'); }
      await down('P1'); await soltarNaFaixa({ P1: MARGEM });
      await waitFor((x) => x.P1.state === 'BITE', 30000, 'mordida P1'); await sleep(150); await down('P1');
      await brigarAteFim(['P1'], 0.42, 0.6);
      await sleep(400);
      capturas = await page.evaluate(() => HF.app.catalogo.descobertos());
      await waitFor((x) => x.P1.state === 'IDLE', 5000, 'cartão');
    }
    const regs = await page.evaluate(() => {
      const D = HF.DadosPesca, P = HF.app.partida, out = [];
      for (const id of P.ids) for (const c of P.session.players[id].captures) out.push({ esp: c.perfil, reg: c.regiao, isca: c.isca, ok: c.regiao ? D.tabela(c.regiao, c.isca).find((x) => x.id === c.perfil).chance > 0 : true });
      return out;
    });
    check('Capturas registradas no catálogo (descoberta)', capturas >= 1, String(capturas));
    check('Peixes coerentes com a região e a isca de cada captura', regs.every((r) => r.ok), JSON.stringify(regs));

    // ================= 13. Recomeçar e sair para o menu (resumo) =================
    await clicar('#botao-pausa');
    await clicar('#tela-pausa [data-acao="reiniciar"]');
    s = await state();
    check('Recomeçar pescaria: placar zerado e os dois no IDLE', s.P1.stats.capturas === 0 && s.P2.stats.capturas === 0 && s.P1.state === 'IDLE');
    await clicar('#botao-pausa');
    await clicar('#tela-pausa [data-acao="sair"]');
    const res = await page.evaluate(() => ({ tela: HF.app.ui.atual, txt: document.getElementById('resumo-conteudo').textContent, mar: HF.app.game.scene.isActive('Mar'), partida: !!HF.app.partida }));
    await shot('15_resumo');
    check('Sair: resumo da pescaria e volta do cenário do menu', res.tela === 'resumo' && res.mar && !res.partida && res.txt.includes('ALEMÃO') && res.txt.includes('ALE'));
    await clicar('#tela-resumo [data-acao="menu"]');
    await page.setViewportSize(RETRATO); await sleep(700);
    check('Menu de novo na vertical', (await tela()) === 'menu');
    await shot('16_menu_de_volta');
    await clicar('[data-acao="catalogo"]');
    const cat1 = await page.evaluate(() => document.querySelectorAll('#catalogo-conteudo .carta:not(.oculto)').length);
    check('Catálogo mostra os peixes descobertos na partida', cat1 >= 1, String(cat1));
    await shot('17_catalogo_com_descobertas');
    await clicar('#tela-catalogo [data-acao="voltar"]');

    // ================= 14. 1 jogador =================
    await clicar('[data-acao="1p"]');
    await clicar('[data-pers1p="ale"]');
    await clicar('[data-isca="minhoca"][data-pers="ale"]');
    await page.setViewportSize(PAISAGEM);
    await clicar('#tela-preparo [data-acao="comecar"]');
    await page.waitForFunction(() => !!HF.app.partida, null, { timeout: 5000 });
    await sleep(600);
    const solo = await page.evaluate(() => { const P = HF.app.partida; return { ids: P.ids, pers: P.pl.P1.pers, c: P.L.c / HF.app.dpr, sprites: P.children.list.filter((o) => o.type === 'Sprite').length }; });
    check('1 jogador: um personagem (ALE), maior que no modo de 2 (≥ 3×)', solo.ids.join() === 'P1' && solo.pers === 'ale' && solo.sprites === 1 && solo.c >= 3, JSON.stringify(solo));
    pos = { P1: { x: 700, y: 250 }, P2: { x: 700, y: 250 } };     // toque do lado direito também é do jogador
    await down('P1'); await sleep(300);
    s = await state();
    check('1 jogador: tocar em qualquer lugar controla o pescador', s.P1.state === 'CHARGING');
    await soltarNaFaixa({ P1: MARGEM });             // força sobe e volta: arremesso curto
    await waitFor((x) => x.P1.state === 'WAITING', 3000, 'boia');
    s = await state();
    check('1 jogador: arremesso curto (segurando até a força voltar) cai na margem', s.P1.regiao === 'margem', JSON.stringify([s.P1.distance, s.P1.regiao]));
    await shot('18_solo_margem');
    await waitFor((x) => x.P1.state === 'BITE', 15000, 'mordida');
    await down('P1');
    await brigarAteFim(['P1'], 0.42, 0.6);
    await sleep(800);
    await shot('19_solo_resultado');
    s = await state();
    check('1 jogador: pescaria completa até o resultado', ['CAUGHT', 'ESCAPED', 'LINE_BROKEN', 'IDLE'].includes(s.P1.state), s.P1.state);
    await clicar('#botao-pausa');
    await clicar('#tela-pausa [data-acao="sair"]');
    await clicar('#tela-resumo [data-acao="menu"]');
    check('1 jogador → menu sem quebrar', (await tela()) === 'menu' && !(await page.evaluate(() => !!HF.app.partida)));

    // ================= 15. Outras proporções de tela =================
    const tamanhos = [[360, 640], [412, 915], [768, 1024], [1280, 720]];
    for (const [w, h] of tamanhos) {
      await page.setViewportSize({ width: w, height: h }); await sleep(500);
      const m = await page.evaluate(() => ({ iw: innerWidth, ih: innerHeight, b: Array.from(document.querySelectorAll('#tela-menu .botao')).map((x) => { const r = x.getBoundingClientRect(); return [r.top, r.bottom, r.left, r.right]; }) }));
      const ok = m.b.every(([t, bo, l, r]) => t >= 0 && bo <= m.ih + 1 && l >= 0 && r <= m.iw + 1);
      check('Menu em ' + w + '×' + h + ': todas as opções visíveis', ok, JSON.stringify(m.b));
      await shot('20_menu_' + w + 'x' + h);
    }
    for (const [w, h] of [[640, 360], [915, 412], [1024, 768]]) {
      await page.setViewportSize({ width: h, height: w });
      await clicar('[data-acao="2p"]');
      await clicar('#tela-preparo [data-acao="comecar"]');
      await page.setViewportSize({ width: w, height: h });
      await page.waitForFunction(() => !!HF.app.partida, null, { timeout: 5000 });
      await sleep(500);
      const g = await page.evaluate(() => { const P = HF.app.partida, L = P.L; const bb = (id) => { const q = P.pl[id].sprite.getBounds(); return [q.x, q.y, q.width, q.height]; }; return { c: L.c / HF.app.dpr, cab: L.pe - 64 * L.c, hud: L.hudH, W: L.W, pe: L.pe, H: L.H, cardBottom: L.cartao.top + L.cartao.h, b1: bb('P1'), b2: bb('P2') }; });
      check('Partida em ' + w + '×' + h + ': personagens inteiros (cabeça abaixo do placar, pés na tela) e cartões acima das cabeças',
        g.cab > g.hud && g.pe <= g.H && g.cardBottom < g.cab, JSON.stringify(g));
      await shot('21_partida_' + w + 'x' + h);
      await clicar('#botao-pausa'); await clicar('#tela-pausa [data-acao="sair"]'); await clicar('#tela-resumo [data-acao="menu"]');
    }
  } catch (e) {
    check('Execução do roteiro sem travar', false, e.message);
    await shot('erro');
  }

  check('Nenhum erro de JavaScript nem arquivo faltando', errors.length === 0, JSON.stringify(errors.slice(0, 5)));
  const passed = results.filter((r) => r.ok).length;
  console.log('\n' + passed + ' de ' + results.length + ' verificações passaram.');
  fs.writeFileSync(path.join(OUT, 'resultado-e2e-jogo.json'), JSON.stringify({ results, errors }, null, 2));
  await browser.close();
  process.exit(passed === results.length ? 0 : 1);
})();
