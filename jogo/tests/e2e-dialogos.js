/*
 * Teste ponta a ponta OPCIONAL da narrativa no navegador (Chromium/Edge, celular emulado).
 * Confere a caixa de diálogo (entrada, saída, um retrato por vez), a família sem retratos fixos
 * no cenário (o cestinho do Sirius mostra o estado), o choro, o sono, as vozes 8-bit e as opções
 * de áudio, a pausa, o recomeço e a geometria em várias telas (caixa, placas, pausa e dicas).
 *
 * Requer Playwright (ou playwright-core), que NÃO faz parte do projeto.
 * Uso:  node jogo/tests/e2e-dialogos.js <pasta-de-saida> [endereço] [canal]
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
  console.log((cond ? '  ✓ ' : '  ✗ ') + name + (cond || !detail ? '' : '  → ' + detail));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const inter = (a, b) => a && b && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await pw.chromium.launch({ channel: CHANNEL });
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('response', (r) => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
  const shot = (n) => page.screenshot({ path: path.join(OUT, n + '.png') });

  const iniciar = (cfg) => page.evaluate((c) => HF.app.iniciarPartida(c), cfg);
  const sair = async () => { await page.evaluate(() => HF.app.sairDaPartida()); await sleep(200); await page.evaluate(() => HF.app.ui.mostrar('menu')); };
  // Lê a fala atual e o nome mostrado na caixa DEPOIS de um quadro do jogo (o Phaser agenda o próximo quadro
  // no fim de cada passo, então este callback roda logo após o passo em que a caixa é desenhada).
  // Sem isso, logo depois de forcarCena() a leitura podia pegar a fala nova antes de a caixa ser redesenhada.
  const linha = () => page.evaluate(() => new Promise((res) => {
    const ler = () => { const P = HF.app.partida, l = P.narrador.linha(); res(l && { pessoa: l.pessoa, texto: l.texto, estilo: l.estilo, nome: l.nome, caixa: P.dlg.nome.text }); };
    const reserva = setTimeout(ler, 250);
    requestAnimationFrame(() => { clearTimeout(reserva); ler(); });
  }));
  const espera = async (pred, ms, rot) => { const fim = Date.now() + (ms || 8000); while (Date.now() < fim) { if (await page.evaluate(pred)) return true; await sleep(40); } throw new Error('tempo esgotado: ' + rot); };

  try {
    await page.goto(URL + '?seed=7');
    await page.waitForFunction(() => window.HF && HF.app && HF.app.ui && HF.app.ui.atual === 'menu', null, { timeout: 20000 });
    // espião do áudio narrativo (conta os pedidos de som; não muda o comportamento)
    await page.evaluate(() => {
      const a = HF.app.audio; window.__sons = [];
      const orig = a.narrativa.bind(a);
      a.narrativa = (s) => { const tocou = orig(s); window.__sons.push({ tipo: s.tipo, tocou }); return tocou; };
    });
    await page.tap('#tela-menu .rodape').catch(() => {});      // libera o áudio (regra dos navegadores)

    // ================= retratos =================
    const ret = await page.evaluate(() => ['alemao_serio', 'alemao_rindo', 'alemao_bravo', 'ale_neutro', 'ale_gargalhada', 'ale_frustrado', 'maria_feliz', 'maria_surpresa', 'maria_preocupada', 'maria_seria', 'sirius_manta', 'sirius_sorrindo']
      .filter((k) => !HF.app.game.textures.exists('rosto_' + k)));
    check('Retratos de expressão das folhas do criador (Alemão, ALE, Maria e Sirius) carregados', ret.length === 0, JSON.stringify(ret));

    // ================= 2 jogadores: a família participa pelos diálogos (sem retratos fixos no cenário) =================
    await iniciar({ modo: 2, personagens: { P1: 'alemao', P2: 'ale' }, iscas: { P1: 'minhoca', P2: 'minhoca' }, regioes: true });
    await page.waitForFunction(() => !!HF.app.partida);
    await sleep(600);
    const fam = await page.evaluate(() => {
      const P = HF.app.partida;
      const retratos = P.children.list.filter((o) => o.type === 'Image' && o.visible && /^rosto_/.test(o.texture.key) && o !== P.caixa.retrato).map((o) => o.texture.key);
      return { retratos, antigo: !!P.fam, cestinho: P.cen.pos.cestinho, bank: P.L.bankTop, b1: P.pl.P1.sprite.getBounds(), b2: P.pl.P2.sprite.getBounds() };
    });
    const core = (b) => ({ x: b.x + b.width * 0.3, y: b.y + b.height * 0.3, w: b.width * 0.4, h: b.height * 0.7 });
    const cest = fam.cestinho && { x: fam.cestinho.x - 8, y: fam.cestinho.y - 8, w: 16, h: 16 };
    check('Família sem retratos fixos no cenário (só na caixa de diálogo); o cestinho do Sirius fica na margem, sem rosto',
      fam.retratos.length === 0 && !fam.antigo && cest && cest.y >= fam.bank - 40 && !inter(cest, core(fam.b1)) && !inter(cest, core(fam.b2)), JSON.stringify(fam.retratos.concat([JSON.stringify(fam.cestinho)])));
    await shot('d01_partida_dois_jogadores');

    // ================= caixa de diálogo: entra, um retrato por vez, sai =================
    const anim = await page.evaluate(async () => {
      const P = HF.app.partida, n = P.narrador, quadro = () => new Promise((r) => requestAnimationFrame(() => r()));
      const c = n.cenas.find((x) => x.g === 'silencio' && x.f.length === 1 && x.f[0][0] === 'maria' && !x.q);
      n.forcarCena(c.id);
      await quadro(); await quadro();
      const inicio = P.caixa.alfa;
      const retratos = [];
      for (let i = 0; i < 20; i++) { await quadro(); retratos.push(P.children.list.filter((o) => o.type === 'Image' && o.visible && /^rosto_/.test(o.texture.key)).length); }
      const meio = P.caixa.alfa;
      n._encerrar(false);
      await quadro(); await quadro(); await quadro();
      const saindo = P.caixa.alfa;
      for (let i = 0; i < 40; i++) await quadro();
      return { inicio, meio, saindo, fim: P.caixa.alfa, visivel: P.caixa.retrato.visible, maxRetratos: Math.max(...retratos) };
    });
    check('Caixa de diálogo: entra suave, mostra UM retrato por vez e sai suave', anim.inicio < 0.9 && anim.meio === 1 && anim.saindo > 0 && anim.saindo < 1 && anim.fim === 0 && !anim.visivel && anim.maxRetratos === 1, JSON.stringify(anim));

    // ================= cena com várias pessoas: uma fala por vez =================
    await page.evaluate(() => HF.app.partida.narrador.forcarCena('conversas.24'));   // Sirius + interpretações (4 falas)
    const vistos = [];
    for (let i = 0; i < 60; i++) { const l = await linha(); if (l && (!vistos.length || vistos[vistos.length - 1].texto !== l.texto)) vistos.push(l); await sleep(100); }
    await shot('d02_conversa');
    check('Conversa com várias pessoas: as falas se sucedem (uma por vez), cada uma com o seu nome', vistos.length >= 3 && new Set(vistos.map((v) => v.pessoa)).size >= 3, JSON.stringify(vistos.map((v) => v.pessoa + ': ' + v.texto)));
    const bal = vistos.find((v) => v.pessoa === 'sirius');
    check('Balbucio do Sirius tem estilo próprio ("balbuciando") e só sílabas de bebê', bal && bal.estilo === 'balbucio' && /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ .!?…-]+$/.test(bal.texto) && /balbuciando/.test(bal.caixa), JSON.stringify(bal));

    // ================= choro =================
    await page.evaluate(() => { window.__sons = []; HF.app.partida.narrador.forcarSirius('choro'); });
    await espera(() => HF.app.partida.narrador.sirius.estado === 'chorando', 6000, 'choro');
    await sleep(700);
    const choro = await page.evaluate(() => { const P = HF.app.partida, n = P.narrador; return { fam: n.familia(), cestinho: P.contextoDoLago().sirius, linha: n.linha() && { p: n.linha().pessoa, e: n.linha().estilo }, sons: window.__sons.map((s) => s.tipo) }; });
    await shot('d03_choro');
    check('Choro: Sirius chorando, Maria ocupada cuidando dele e o sinal de choro saindo do cestinho', choro.fam.sirius === 'chorando' && choro.fam.mariaOcupada && choro.cestinho.estado === 'chorando', JSON.stringify(choro));
    check('Choro: som 8-bit sintetizado (sem gravação) pedido ao áudio', choro.sons.includes('choro'), JSON.stringify(choro.sons));
    await espera(() => !HF.app.partida.narrador.sirius.chorando, 20000, 'fim do choro');
    await sleep(3500);
    const pos = await page.evaluate(() => { const n = HF.app.partida.narrador; return { fam: n.familia(), reg: n.registro.slice(-12).map((r) => ({ p: r.pessoa, c: r.c, s: r.sirius, t: r.texto })) }; });
    const mariaFora = pos.reg.filter((r) => r.p === 'maria' && ['inquieto', 'chorando', 'acalmando'].includes(r.s) && !r.c);
    check('Durante o choro a Maria não comentou a pescaria; depois ela volta a ficar livre', mariaFora.length === 0 && !pos.fam.mariaOcupada, JSON.stringify(pos.reg));
    const pesca = await page.evaluate(() => ['P1', 'P2'].map((id) => HF.app.partida.session.players[id].state));
    check('A pescaria continuou normalmente durante o choro (nenhum estado travado)', pesca.every((s) => typeof s === 'string'), JSON.stringify(pesca));

    // ================= sono =================
    await page.evaluate(() => HF.app.partida.narrador.forcarSirius('dormindo'));
    await sleep(400);
    const sono = await page.evaluate(() => { const P = HF.app.partida, n = P.narrador; const antes = n.registro.length;
      // tenta provocar falas com o Sirius dormindo: nenhuma pode ter balbucio
      for (const id of ['conversas.22', 'conversas.23', 'conversas.25']) { const c = n.cenas.find((x) => x.id === id); n._tentar && c && n._disparar('silencio', { sujeitoId: 'P1', outroId: 'P2' }); }
      return { estado: n.sirius.estado, cestinho: P.contextoDoLago().sirius.estado, novos: n.registro.slice(antes).filter((r) => r.pessoa === 'sirius').length, podeChorar: n.sirius.podeChorar() }; });
    await sleep(1500);
    await shot('d04_sirius_dormindo');
    check('Sono: Sirius dormindo ("z" saindo do cestinho), sem balbucio e sem choro', sono.estado === 'dormindo' && sono.cestinho === 'dormindo' && sono.novos === 0 && !sono.podeChorar, JSON.stringify(sono));

    // ================= pausa e retomada =================
    await page.evaluate(() => HF.app.partida.narrador.forcarCena('conversas.1'));
    await sleep(500);
    await page.tap('#botao-pausa');
    await sleep(300);
    const p0 = await page.evaluate(() => ({ t: HF.app.partida.narrador.t, l: HF.app.partida.narrador.linha() && HF.app.partida.narrador.linha().texto }));
    await sleep(1500);
    const p1 = await page.evaluate(() => ({ t: HF.app.partida.narrador.t, l: HF.app.partida.narrador.linha() && HF.app.partida.narrador.linha().texto }));
    check('Pausa: a conversa congela (tempo da narrativa parado, mesma fala)', p0.t === p1.t && p0.l === p1.l, JSON.stringify([p0, p1]));
    await page.tap('#tela-pausa [data-acao="continuar"]');
    await sleep(800);
    const p2 = await page.evaluate(() => HF.app.partida.narrador.t);
    check('Retorno ao jogo: a narrativa volta a andar', p2 > p1.t, String(p2 - p1.t));

    // ================= opções de áudio =================
    const aud = await page.evaluate(() => {
      const o = HF.app.opcoes, a = HF.app.audio, out = {};
      o.set('vozes', false); out.desligado = a.volumeVozes; out.tocouDesligado = a.narrativa({ tipo: 'balbucio', texto: 'AGU!' });
      o.set('vozes', true); o.set('volumeVozes', 0); out.volumeZero = a.volumeVozes; out.tocouZero = a.narrativa({ tipo: 'balbucio', texto: 'AGU!' });
      o.set('volumeVozes', 0.7); out.ligado = a.volumeVozes; out.tocouLigado = a.narrativa({ tipo: 'balbucio', texto: 'AGU!' });
      out.ctx = a.ctx && a.ctx.state;
      return out;
    });
    check('Opções: vozes desligadas ou volume zero = silêncio; ligadas = os balbucios tocam (respeitando o volume geral)',
      aud.desligado === 0 && aud.tocouDesligado === false && aud.volumeZero === 0 && aud.tocouZero === false && aud.ligado > 0 && aud.tocouLigado === true, JSON.stringify(aud));

    // ================= recomeçar =================
    await page.tap('#botao-pausa'); await sleep(250);
    await page.tap('#tela-pausa [data-acao="reiniciar"]'); await sleep(500);
    const rec = await page.evaluate(() => ({ reg: HF.app.partida.narrador.registro.length, t: HF.app.partida.narrador.t }));
    check('Recomeçar a pescaria: a narrativa recomeça do zero (sem falas presas)', rec.reg === 0 && rec.t < 2000, JSON.stringify(rec));

    // ================= geometria em várias telas (2 e 1 jogador) =================
    await sair();
    for (const [w, h, modo] of [[640, 360, 2], [844, 390, 2], [1024, 768, 2], [844, 390, 1], [640, 360, 1]]) {
      await page.setViewportSize({ width: w, height: h });
      await iniciar(modo === 2 ? { modo: 2, personagens: { P1: 'alemao', P2: 'ale' }, iscas: { P1: 'minhoca', P2: 'minhoca' }, regioes: true }
        : { modo: 1, personagens: { P1: 'ale' }, iscas: { P1: 'minhoca' }, regioes: true });
      await page.waitForFunction(() => !!HF.app.partida);
      await sleep(400);
      // a fala mais longa possível (3 linhas) para medir o pior caso
      await page.evaluate(() => { const n = HF.app.partida.narrador;
        const c = n.cenas.filter((x) => (!x.m || x.m === n.modo) && x.f[0][0] !== 'sirius').sort((a, b) => b.f[0][1].length - a.f[0][1].length)[0];
        n.forcarCena(c.id); });
      await sleep(900);
      const g = await page.evaluate(() => {
        const P = HF.app.partida, L = P.L;
        const cartoes = P.ids.map((id) => ({ x: L.side[id].cardCx - L.cartao.w / 2, y: L.cartao.top, w: L.cartao.w, h: L.cartao.h }));
        const boias = P.ids.map((id) => ({ x: L.side[id].bobX - 40 * L.k, y: L.longe, w: 80 * L.k, h: L.perto - L.longe }));
        const corpos = P.ids.map((id) => { const b = P.pl[id].sprite.getBounds(); return { x: b.x + b.width * 0.3, y: b.y + b.height * 0.3, w: b.width * 0.4, h: b.height * 0.7 }; });
        // medidor de tensão compacto (ao lado do pescador) com a moldura, o ponteiro e os riscos
        const medidores = P.ids.map((id) => ({ x: L.side[id].medX - L.medW / 2 - 16 * L.k, y: L.medTop - 30 * L.k, w: L.medW + 32 * L.k, h: L.medBase - L.medTop + 34 * L.k }));
        const placas = P.ids.map((id) => P.placaRect[id]);
        const bp = document.getElementById('botao-pausa').getBoundingClientRect(), d = HF.app.dpr;
        const pausa = { x: bp.x * d, y: bp.y * d, w: bp.width * d, h: bp.height * d };
        const dicas = P.ids.map((id) => P.dicaRect && P.dicaRect[id]).filter(Boolean);
        return { d: P.dlgRect, cartoes, boias, corpos, medidores, placas, pausa, dicas, bank: L.bankTop, k: L.k, W: L.W, H: L.H };
      });
      const ok = g.d && g.d.x >= 0 && g.d.x + g.d.w <= g.W && g.d.y >= 0 && !g.cartoes.some((c) => inter(g.d, c)) && !g.boias.some((b) => inter(g.d, b)) &&
        !g.corpos.some((c) => inter(g.d, c)) && !g.medidores.some((m) => inter(g.d, m)) && !g.placas.some((p) => inter(g.d, p)) && g.d.y >= g.bank - 12 * g.k;
      check('Tela ' + w + '×' + h + ' (' + modo + ' jogador' + (modo > 1 ? 'es' : '') + '): o diálogo fica sobre a margem e não cobre água, cartões, boias, personagens, medidores nem placas', ok, JSON.stringify({ d: g.d, bank: g.bank }));
      const hud = !inter(g.pausa, g.placas[0]) && !(g.placas[1] && (inter(g.pausa, g.placas[1]) || inter(g.placas[0], g.placas[1]))) &&
        !g.dicas.some((x) => g.placas.some((p) => inter(x, p))) && g.placas.every((p) => p.x >= 0 && p.x + p.w <= g.W);
      check('Tela ' + w + '×' + h + ' (' + modo + '): placas, botão de pausa e dicas não se sobrepõem', hud, JSON.stringify({ placas: g.placas, pausa: g.pausa, dicas: g.dicas }));
      await shot('d05_' + modo + 'j_' + w + 'x' + h);
      await sair();
    }

    // ================= 1 jogador: só cenas próprias, nada de "segundo pescador" =================
    await page.setViewportSize({ width: 844, height: 390 });
    await iniciar({ modo: 1, personagens: { P1: 'alemao' }, iscas: { P1: 'minhoca' }, regioes: true });
    await page.waitForFunction(() => !!HF.app.partida);
    const um = await page.evaluate(() => {
      const n = HF.app.partida.narrador;
      for (let i = 0; i < 6; i++) { n.ultimaEspontanea = -1e9; n.fimUltima = -1e9; n.ultimaCategoria = {}; n.ultimaPessoa = {}; n.atual = null; n.atualizar(16, HF.app.partida.session.players); }
      return { modo: n.modo, cenas: n.registro.map((r) => ({ id: r.cena, m: r.m })), obs: n.observador };
    });
    check('1 jogador: o narrador sabe quem assiste (ALE) e não usa cenas do modo de 2 jogadores', um.modo === 1 && um.obs === 'ale' && um.cenas.every((c) => c.m !== 2), JSON.stringify(um));
    await sair();
  } catch (e) {
    check('Execução do roteiro sem travar', false, e.message);
    await shot('erro');
  }
  check('Nenhum erro de JavaScript nem arquivo faltando', errors.length === 0, JSON.stringify(errors.slice(0, 5)));
  const passed = results.filter((r) => r.ok).length;
  console.log('\n' + passed + ' de ' + results.length + ' verificações passaram.');
  fs.writeFileSync(path.join(OUT, 'resultado-e2e-dialogos.json'), JSON.stringify({ results, errors }, null, 2));
  await browser.close();
  process.exit(passed === results.length ? 0 : 1);
})();
