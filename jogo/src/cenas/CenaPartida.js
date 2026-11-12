/*
 * Hangover Fishing — versão jogável
 * CenaPartida: a pescaria (horizontal), para 1 ou 2 jogadores.
 *
 * Toda a regra de pesca vem da SessaoJogo (FishingSession + FishingPlayer do P1, sem
 * alterações, com as tabelas de região e isca do PescadorRegional). Esta cena só:
 *   - repassa os toques ao TouchRouter do P1 (no modo 1 jogador, todos vão para o P1);
 *   - desenha: lago com regiões, margem, personagens (CharacterAnimator aprovado), linha,
 *     boia, peixe na briga, medidor de tensão, cartões, diálogos e efeitos;
 *   - registra as capturas no catálogo e alimenta os diálogos.
 * Nada aqui altera estados, prazos ou sorteios da pescaria.
 */
(function (root) {
  'use strict';

  const HF = root.HF;
  const S = HF.FishingPlayer.STATES;
  const D = HF.DadosPesca;
  const FONTE = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';
  const CORES = {
    alemao: { main: 0xd23c3c, light: 0xff6b6b, css: '#ff7b7b' },
    ale: { main: 0xd8b21f, light: 0xffd23f, css: '#ffd23f' }
  };
  const ZONAS = { frouxa: 0x4aa3ff, segura: 0x3ccf6e, alerta: 0xffa53c, critica: 0xff3b3b };
  const REGIAO_COR = { margem: 0x7bd389, aberta: 0x58b4ff, fundo: 0xa58bff };
  const REGIAO_AGUA = { margem: [0x2f7f8f, 0x2a7383], aberta: [0x22648f, 0x1f5b84], fundo: [0x163f6b, 0x12365f] };
  const AGUA_UNICA = [0x1f5f8a, 0x215f88];
  // fração da altura útil da água de cada região (de baixo para cima): leitura clara das três faixas
  const FAIXAS = [{ ate: 14, frac: 0.36 }, { ate: 22, frac: 0.28 }, { ate: 36, frac: 0.36 }];

  function lerp(a, b, t) { return a + (b - a) * t; }
  // cores da caixa de diálogo por personagem e estilo
  const CORES_FALA = {
    alemao: { nome: '#ff7b7b', retrato: 0x3a1d24 }, ale: { nome: '#ffd23f', retrato: 0x3a3418 },
    maria: { nome: '#ff9fd0', retrato: 0x3a1d33 }, sirius: { nome: '#2b5fa8', retrato: 0xbfe3ff }
  };
  const ESTILO_CAIXA = {
    fala: { borda: 0xf3e3b5, fundo: 0x14244a, texto: '#ffffff' },
    balbucio: { borda: 0x2b5fa8, fundo: 0xdff1ff, texto: '#14244a' },
    choro: { borda: 0xd04a6a, fundo: 0xffe0e7, texto: '#7a1630' }
  };
  function kg(v) { return v.toFixed(2).replace('.', ',') + ' kg'; }

  class CenaPartida extends Phaser.Scene {
    constructor() { super({ key: 'Partida' }); }

    init(data) { this.cfg = data; }

    create() {
      const app = HF.app, cfg = this.cfg;
      this.app = app;
      this.modo = cfg.modo;
      this.solo = cfg.modo === 1;
      this.session = new HF.SessaoJogo({
        config: HF.createConfig(), seed: cfg.seed != null ? cfg.seed : (Date.now() >>> 0),
        jogo: { modo: cfg.modo, personagens: cfg.personagens, iscas: Object.assign({}, cfg.iscas), regioes: cfg.regioes }
      });
      this.router = this.session.router;
      this.ids = this.session.ids;
      this.efeitos = [];
      this.marcas = { P1: {}, P2: {} };
      this.particulas = [];
      this.inicioMs = performance.now();
      this.novasEspecies = [];
      this.recordes = [];
      this.pausadoPeloMenu = false;
      this.retrato = false;

      this.gFundo = this.add.graphics().setDepth(-10);
      this.gAmbiente = this.add.graphics().setDepth(-8);
      this.gMundo = this.add.graphics().setDepth(0);
      this.gEfeitos = this.add.graphics().setDepth(1);
      this.gUi = this.add.graphics().setDepth(5);
      this.gDialogo = this.add.graphics().setDepth(8);
      this.gPausa = this.add.graphics().setDepth(20);

      const txt = (style, depth) => this.add.text(0, 0, '', Object.assign({ fontFamily: FONTE, color: '#ffffff' }, style)).setDepth(depth || 6);
      this.tx = {};
      this.pl = {};
      for (const id of this.ids) {
        const pers = cfg.personagens[id];
        this.pl[id] = {
          id, pers, cores: CORES[pers],
          anim: new HF.CharacterAnimator({ character: pers, data: app.animData, random: Math.random }),
          sprite: this.add.sprite(0, 0, pers + '_idle', 0).setOrigin(0.5, 1).setDepth(-5),
          peixeMao: this.add.image(0, 0, 'peixe_tilapia').setDepth(-4).setVisible(false),
          iscaHud: this.add.image(0, 0, 'isca_minhoca').setDepth(6),
          imgCartao: this.add.image(0, 0, 'peixe_tilapia').setDepth(6).setVisible(false),
          shown: null
        };
        this.tx[id] = {
          hud: txt({ fontStyle: 'bold' }).setOrigin(id === 'P1' ? 0 : 1, 0.5),
          prompt: txt({ fontStyle: 'bold', align: 'center' }).setOrigin(0.5, 0),
          titulo: txt({ fontStyle: 'bold', align: 'center' }).setOrigin(0.5),
          sub: txt({ align: 'center' }).setOrigin(0.5, 0),
          selo: txt({ fontStyle: 'bold', align: 'center', color: '#ffe9a8' }).setOrigin(0.5),
          dica: txt({ align: 'center', color: '#9fb7d1' }).setOrigin(0.5, 1),
          bang: txt({ fontStyle: 'bold' }).setOrigin(0.5, 1),
          dist: txt({ color: '#d6e6f2' }).setOrigin(0.5, 0),
          medidor: txt({ fontStyle: 'bold', color: '#d6e6f2' }).setOrigin(id === 'P1' ? 0 : 1, 1),
          aviso: txt({ fontStyle: 'bold', align: 'center', color: '#ffd23f' }).setOrigin(0.5).setVisible(false),
          regiao: txt({ fontStyle: 'bold', align: 'center' }).setOrigin(0.5, 1).setVisible(false)
        };
        if (this.solo) this.pl[id].sprite.setFlipX(false);
        else this.pl[id].sprite.setFlipX(id === 'P2');
      }
      this.rotulosRegiao = ['margem', 'aberta', 'fundo'].map((r) => txt({ fontStyle: 'bold', color: '#ffffff' }, -7).setOrigin(0.5, 0).setText(D.REGIOES[r].curta));
      this.dlg = {
        nome: txt({ fontStyle: 'bold' }, 9).setOrigin(0, 0),
        texto: txt({ color: '#ffffff' }, 9).setOrigin(0, 0),
        nota: txt({ fontStyle: 'bold', color: '#2b5fa8' }, 9).setOrigin(0.5).setVisible(false),
        retrato: this.add.image(0, 0, 'rosto_alemao_serio').setDepth(9).setVisible(false),
        alfa: 0, linha: null, mudouEm: 0, hTexto: 0
      };
      // Maria e Sirius na margem (retratos das folhas do criador), com o estado do Sirius à vista
      this.gFamilia = this.add.graphics().setDepth(-4.5);
      this.fam = {
        maria: this.add.image(0, 0, 'rosto_maria_feliz').setDepth(-4),
        sirius: this.add.image(0, 0, 'rosto_sirius_manta').setDepth(-4),
        nomeMaria: txt({ fontStyle: 'bold', color: '#ff9fd0' }, -3).setOrigin(0.5, 0).setText('MARIA'),
        nomeSirius: txt({ fontStyle: 'bold', color: '#9fd0ff' }, -3).setOrigin(0.5, 0).setText('SIRIUS'),
        icone: txt({ fontStyle: 'bold', color: '#ffffff' }, -3).setOrigin(0.5)
      };
      this.textoPausa = txt({ fontStyle: 'bold', align: 'center' }, 21).setOrigin(0.5).setVisible(false);

      this.narrador = this.novoNarrador();
      this.criarPeixesAmbiente();

      // entrada (mesma ponte do P1; no modo 1 jogador todo toque é do P1)
      this.input.on('pointerdown', this.aoTocar, this);
      this.input.on('pointerdownoutside', (p) => this.router.ignore(p.id));
      this.input.on('pointermove', (p) => { if (p.isDown) this.router.move({ key: p.id, x: this.xEntrada(p.x), time: performance.now() }); });
      this.input.on('pointerup', this.aoSoltar, this);
      this.input.on('pointerupoutside', this.aoSoltar, this);

      this.session.onEvent((e) => this.aoEvento(e));
      this.scale.on('resize', this.layout, this);
      this.events.once('shutdown', () => this.scale.off('resize', this.layout, this));
      this.layout();
      this.ultimoAgora = null;
      app.partidaCriada(this);
    }

    // ================================================================= entrada
    xEntrada(x) { return this.solo ? 0 : x; }

    bloqueado() { return this.retrato || this.pausadoPeloMenu || this.session.isPaused(); }

    aoTocar(p) {
      this.app.audio.unlock();
      if (!this.retrato && !this.pausadoPeloMenu && this.session.awaitingTap) {
        this.session.continueAfterInterruption(performance.now());   // D8: o toque que retoma não vira ação
        this.router.ignore(p.id);
        return;
      }
      if (this.bloqueado()) { this.router.ignore(p.id); return; }
      this.router.down({ key: p.id, identifier: p.identifier, x: this.xEntrada(p.x), time: performance.now() });
    }

    aoSoltar(p) {
      this.router.up({ key: p.id, identifier: p.identifier, x: this.xEntrada(p.x), time: performance.now(), canceled: !!p.wasCanceled });
    }

    // ---- API usada pelo aplicativo (pausa, retrato, interrupções, isca, regiões) ----
    pausar() { this.pausadoPeloMenu = true; this.session.pause('menu de pausa', performance.now()); }
    continuar() { this.pausadoPeloMenu = false; this.session.resume('menu de pausa', performance.now()); }
    setRetrato(r) {
      if (r === this.retrato) return;
      this.retrato = r;
      if (r) this.session.pause('retrato', performance.now()); else this.session.resume('retrato', performance.now());
    }
    interromper(motivo) { this.session.interrupt(motivo, performance.now()); }
    setIsca(id, isca) { if (this.pl[id]) this.session.setIsca(id, isca); }
    setRegioes(on) { this.session.setRegioes(on); }
    /** Camada narrativa (só lê a pescaria). */
    novoNarrador() {
      return new HF.Narrador({ modo: this.modo, personagens: this.cfg.personagens, random: Math.random, dados: D });
    }

    recomecar() {
      this.session.reset(Date.now() >>> 0);
      this.narrador = this.novoNarrador();
      this.dlg.linha = null; this.dlg.alfa = 0;
      this.marcas = { P1: {}, P2: {} };
      this.efeitos = [];
      this.inicioMs = performance.now();
      this.novasEspecies = []; this.recordes = [];
    }
    resumo() {
      const out = { modo: this.modo, minutos: (performance.now() - this.inicioMs) / 60000, jogadores: [], novas: this.novasEspecies.slice(), recordes: this.recordes.slice() };
      for (const id of this.ids) {
        const p = this.session.players[id];
        const maior = p.captures.slice().sort((a, b) => b.pesoKg - a.pesoKg)[0] || null;
        out.jogadores.push({ id, pers: this.pl[id].pers, nome: p.label, capturas: p.stats.capturas, kg: p.stats.pesoTotalKg,
          maior: maior ? { nome: maior.peixe, kg: maior.pesoKg } : null, objetos: (p.objetos || []).length,
          perdas: p.stats.fugas + p.stats.linhasRompidas + p.stats.mordidasPerdidas });
      }
      return out;
    }

    // ================================================================= layout
    layout() {
      const W = this.scale.width, H = this.scale.height, k = this.app.dpr;
      this.router.setWidth(W);
      const hudH = Math.round(Math.max(30 * k, H * 0.085));
      const bankTop = Math.round(H * (this.solo ? 0.63 : 0.66));
      const c = Math.max(1, Math.floor(H * (this.solo ? 0.5 : 0.36) / 64));     // px do aparelho por pixel da arte
      const pe = H - Math.round(Math.max(4 * k, H * 0.02));
      const L = { W, H, k, hudH, waterTop: hudH, bankTop, c, pe, meterW: Math.max(12 * k, Math.round(W * 0.016)) };
      L.unit = this.solo ? Math.min(W * 0.6, H) : Math.min(W / 2, H);
      if (this.solo) {
        L.side = { P1: { x0: 0, x1: W, charX: Math.round(W * 0.14), bobX: W * 0.64, cx: W * 0.6, cardCx: W * 0.71, meterX: W - 8 * k - L.meterW, dir: 1 } };
        L.dialogo = { cx: W * 0.41, w: W * 0.24 };
        L.familia = { cx: W * 0.52, cy: bankTop + (H - bankTop) * 0.5, s: Math.round(Math.min(H * 0.17, W * 0.1)) };
      } else {
        L.side = {
          P1: { x0: 0, x1: W / 2, charX: Math.round(W * 0.11), bobX: W * 0.31, cx: W * 0.26, cardCx: W * 0.23, meterX: 8 * k, dir: 1 },
          P2: { x0: W / 2, x1: W, charX: Math.round(W * 0.89), bobX: W * 0.69, cx: W * 0.74, cardCx: W * 0.77, meterX: W - 8 * k - L.meterW, dir: -1 }
        };
        L.dialogo = { cx: W / 2, w: W * 0.24 };
        L.familia = { cx: W / 2, cy: bankTop + (H - bankTop) * 0.5, s: Math.round(Math.min(H * 0.17, W * 0.08)) };
      }
      L.dialogo.y = bankTop - (bankTop - hudH) * 0.03;          // base da caixa de diálogo (acima da margem)
      L.cartao = { top: hudH + Math.round(H * 0.025), h: Math.round((bankTop - hudH) * 0.7), w: Math.round(this.solo ? W * 0.32 : W * 0.27) };
      // água útil para a distância: o topo fica para as instruções
      L.longe = hudH + (bankTop - hudH) * 0.2;
      L.perto = bankTop - 6 * k;
      this.L = L;

      const grande = Math.max(16 * k, Math.round(L.unit * 0.075));
      const medio = Math.max(13 * k, Math.round(L.unit * 0.05));
      const pequeno = Math.max(11 * k, Math.round(L.unit * 0.038));
      this.fontes = { grande, medio, pequeno };
      for (const id of this.ids) {
        const t = this.tx[id], sd = L.side[id], pl = this.pl[id];
        t.hud.setFontSize(pequeno).setPosition(id === 'P1' ? 12 * k + (this.solo ? 0 : 0) : W - 12 * k, hudH / 2);
        t.prompt.setFontSize(medio).setStroke('#000000', 4 * k).setPosition(sd.cx, L.waterTop + 6 * k).setWordWrapWidth((sd.x1 - sd.x0) * 0.78);
        t.titulo.setFontSize(grande).setStroke('#000000', 5 * k);
        t.sub.setFontSize(pequeno).setWordWrapWidth(L.cartao.w * 0.9).setLineSpacing(2 * k);
        t.selo.setFontSize(pequeno).setStroke('#000000', 4 * k);
        t.dica.setFontSize(Math.max(9 * k, Math.round(pequeno * 0.78))).setWordWrapWidth(L.cartao.w * 0.92);
        t.bang.setFontSize(Math.round(grande * 1.3)).setStroke('#000000', 6 * k);
        t.dist.setFontSize(Math.max(10 * k, Math.round(pequeno * 0.85)));
        t.aviso.setFontSize(medio).setStroke('#000000', 5 * k).setPosition(sd.cx, L.waterTop + (L.bankTop - L.waterTop) * 0.45).setWordWrapWidth((sd.x1 - sd.x0) * 0.8);
        t.medidor.setFontSize(Math.max(9 * k, Math.round(pequeno * 0.75))).setPosition(id === 'P1' && !this.solo ? sd.meterX : sd.meterX + L.meterW, L.waterTop + 18 * k);
        t.regiao.setFontSize(Math.max(10 * k, Math.round(pequeno * 0.9))).setStroke('#000000', 4 * k);
        pl.sprite.setScale(c).setPosition(sd.charX, L.pe);
        const ih = Math.round(hudH * 0.7);
        pl.iscaHud.setDisplaySize(ih, ih).setPosition(0, hudH / 2);
      }
      for (const t of this.rotulosRegiao) t.setFontSize(Math.max(9 * k, Math.round(pequeno * 0.75))).setStroke('#000000', 3 * k);
      this.dlg.ret = Math.round(Math.max(36 * k, Math.min(L.H * 0.13, 52 * k)));
      this.dlg.pad = Math.round(7 * k);
      this.dlg.nome.setFontSize(pequeno);
      this.dlg.texto.setFontSize(Math.round(pequeno * 1.05)).setWordWrapWidth(L.dialogo.w - this.dlg.ret - this.dlg.pad * 3.5).setLineSpacing(2 * k);
      this.dlg.nota.setFontSize(Math.round(pequeno * 1.2));
      this.dlg.linha = null;
      const fs = Math.max(8 * k, Math.round(pequeno * 0.7));
      this.fam.nomeMaria.setFontSize(fs).setStroke('#000000', 3 * k);
      this.fam.nomeSirius.setFontSize(fs).setStroke('#000000', 3 * k);
      this.fam.icone.setFontSize(Math.round(pequeno * 1.1)).setStroke('#000000', 3 * k);
      this.textoPausa.setFontSize(grande).setStroke('#000000', 6 * k).setPosition(W / 2, H / 2).setWordWrapWidth(W * 0.8);
      this.posicionarPeixesAmbiente(true);
    }

    /** Distância (m) → altura na água. Três faixas de altura fixa (margem, abertas, fundo). */
    distY(d) {
      const L = this.L, util = L.perto - L.longe;
      let y = L.perto, ini = 0;
      for (const f of FAIXAS) {
        const fimM = f.ate, alt = util * f.frac;
        if (d <= fimM) return y - alt * (Math.max(0, d) - ini) / (fimM - ini);
        y -= alt; ini = fimM;
      }
      return L.longe;
    }

    /** Ponto do quadro 96 × 96 → tela. */
    toScreen(id, pt) {
      const pl = this.pl[id], sd = this.L.side[id], c = this.L.c;
      const fx = pl.sprite.flipX ? 95 - pt[0] : pt[0];
      return { x: sd.charX - 48 * c + (fx + 0.5) * c, y: this.L.pe - 96 * c + (pt[1] + 0.5) * c };
    }

    // ================================================================= eventos da pescaria
    aoEvento(e) {
      if (!e.jogador || !this.pl[e.jogador]) return;
      const id = e.jogador, p = this.session.players[id], pl = this.pl[id], m = this.marcas[id], sd = this.L.side[id];
      const now = performance.now();
      // a narrativa recebe os eventos reais (a captura vai depois, com o resultado do catálogo)
      if (e.tipo !== 'captura') this.narrador.evento(e, this.session.players);
      if (e.tipo === 'estado') {
        pl.anim.onState(e.de, e.para, { castPower: p.castPower, pressed: p.pressed, time: e.time });
        return;
      }
      this.app.audio.onEvent(e);
      const at = () => ({ x: sd.bobX, y: this.distY(p.distance) });
      switch (e.tipo) {
        case 'boia-na-agua':
          this.anel(at(), 0xffffff, 300, 18);
          if (p.regiao) { m.tagAte = now + 1500; m.tagRegiao = p.regiao; }
          break;
        case 'arremesso-cancelado':
          if (e.codigo === 'toque-curto') { m.avisoAte = now + 1100; m.avisoTexto = 'SEGURE PARA ARREMESSAR!'; }
          break;
        case 'aviso-retomada':
          if (e.codigo === 'arremesso-cancelado') { m.avisoAte = now + 1300; m.avisoTexto = 'ARREMESSO CANCELADO'; }
          break;
        case 'beliscada': m.beliscadaAte = now + 220; this.anel(at(), 0xffffff, 300, 10); break;
        case 'mordida':
          m.flashAte = now + this.session.config.reactionWindowMs; m.flashCor = pl.cores.light;
          this.anel(at(), 0xffffff, 500, 34); this.anel(at(), pl.cores.light, 700, 50);
          break;
        case 'fisgada': m.flashAte = now + 200; m.flashCor = 0xffffff; this.anel(at(), 0xffffff, 300, 24); break;
        case 'arrancada': this.anel(at(), 0xbfe3ff, 400, 22); break;
        case 'captura': this.aoCapturar(id, e, p); break;
        case 'linha-rompida':
          m.flashAte = now + 400; m.flashCor = 0xff3b3b; m.partiuEm = now; m.partiuDe = at();
          break;
        case 'fuga':
          this.anel(at(), 0x8899aa, 500, 30);
          break;
        case 'mordida-perdida':
          this.anel(at(), 0x8899aa, 500, 30);
          break;
        default: break;
      }
    }

    aoCapturar(id, e, p) {
      const m = this.marcas[id];
      m.flashAte = performance.now() + 500; m.flashCor = 0x3ccf6e;
      this.anel({ x: this.L.side[id].bobX, y: this.L.perto }, 0x3ccf6e, 700, 60);
      const objeto = !!e.objeto;
      const reg = this.app.catalogo.registrar({ id: e.perfil, pesoKg: e.pesoKg, objeto, quem: p.label, regiao: p.regiao, isca: p.iscaNaAgua });
      const def = objeto ? D.objetoPorId[e.perfil] : D.especiePorId[e.perfil];
      let grande = false;
      if (!objeto && def) {
        const lim = def.pesoKg[0] + 0.75 * (def.pesoKg[1] - def.pesoKg[0]);
        grande = e.pesoKg >= lim || e.pesoKg >= 4;
      }
      m.cartao = { objeto, id: e.perfil, nome: def ? def.nome : e.peixe, kg: e.pesoKg, novo: reg.novo, recorde: reg.recorde, grande, regiao: p.regiao, isca: p.iscaNaAgua };
      if (reg.novo && !objeto) this.novasEspecies.push(def.nome);
      if (reg.recorde && !objeto) this.recordes.push(def.nome);
      this.narrador.evento(e, this.session.players, { novo: reg.novo && !objeto, recorde: reg.recorde && !objeto });
    }

    anel(pos, color, dur, radius) {
      this.efeitos.push({ x: pos.x, y: pos.y, color, dur, radius: radius * this.app.dpr, t0: performance.now() });
    }

    // ================================================================= quadro a quadro
    update() {
      const now = performance.now();
      const pointers = this.input.manager.pointers;
      this.router.reconcile((key) => { const pt = pointers[key]; return !!(pt && pt.isDown); }, now);
      if (!this.bloqueado()) this.session.update(now);
      const dtBruto = this.ultimoAgora == null ? 0 : Math.min(HF.FishingPlayer.MAX_CATCH_UP_MS, now - this.ultimoAgora);
      this.ultimoAgora = now;
      this.dt = this.bloqueado() ? 0 : dtBruto;
      // narrativa: relógio de jogo (para na pausa) e sons do Sirius / vozes
      this.narrador.atualizar(this.dt, this.session.players);
      for (const som of this.narrador.tirarSons()) this.app.audio.narrativa(som);

      const snaps = {};
      for (const id of this.ids) snaps[id] = this.session.players[id].snapshot(now);
      this.gFundo.clear(); this.gAmbiente.clear(); this.gMundo.clear(); this.gEfeitos.clear(); this.gUi.clear(); this.gDialogo.clear();
      this.desenharLago(now, snaps);
      for (const id of this.ids) this.desenharJogador(id, snaps[id], now);
      this.desenharEfeitos(now);
      this.desenharFamilia(now);
      this.desenharDialogo();
      this.desenharPausa();
      if (!this.bloqueado()) for (const id of this.ids) if (snaps[id].zone) this.app.audio.warn(id, snaps[id].zone, now);
      this.app.aoQuadro && this.app.aoQuadro(this, snaps);
    }

    // ---------------------------------------------------------------- lago, margem e ambiente
    desenharLago(now, snaps) {
      const g = this.gFundo, L = this.L, W = L.W, k = L.k;
      const regioes = this.session.jogo.regioes;
      g.fillStyle(0x0d1418, 1).fillRect(0, 0, W, L.hudH);
      // água por região (ou única, com as regiões desligadas)
      const yFundo = this.distY(22), yMargem = this.distY(14);
      const faixa = (y0, y1, cores) => { g.fillStyle(cores[0], 1).fillRect(0, y0, W, (y1 - y0) / 2 + 1); g.fillStyle(cores[1], 1).fillRect(0, (y0 + y1) / 2, W, (y1 - y0) / 2 + 1); };
      if (regioes) {
        faixa(L.waterTop, yFundo, REGIAO_AGUA.fundo);
        faixa(yFundo, yMargem, REGIAO_AGUA.aberta);
        faixa(yMargem, L.bankTop, REGIAO_AGUA.margem);
        // limites tracejados e rótulos discretos
        for (const y of [yFundo, yMargem]) {
          g.lineStyle(Math.max(1, k), 0xffffff, 0.18);
          for (let x = 0; x < W; x += 22 * k) g.lineBetween(x, y, x + 10 * k, y);
        }
      } else faixa(L.waterTop, L.bankTop, AGUA_UNICA);
      // rótulos no meio de cada faixa (no modo 2 jogadores, sobre a divisória; longe do botão de pausa)
      const rx = this.solo ? L.side.P1.meterX - 34 * k : W / 2;
      const ys = { fundo: (L.waterTop + yFundo) / 2 + 10 * k, aberta: (yFundo + yMargem) / 2, margem: (yMargem + L.bankTop) / 2 };
      this.rotulosRegiao.forEach((t, i) => { const r = ['margem', 'aberta', 'fundo'][i]; t.setVisible(regioes).setPosition(rx, ys[r]).setAlpha(0.5).setOrigin(this.solo ? 1 : 0.5, 0.5); });
      // ondinhas
      g.lineStyle(2 * k, 0xffffff, 0.07);
      for (let i = 0; i < 7; i++) {
        const y = L.waterTop + 14 * k + i * (L.bankTop - L.waterTop - 20 * k) / 7;
        const off = ((now / 40) + i * 37) % (80 * k);
        for (let x = -80 * k + off; x < W; x += 80 * k) g.lineBetween(x, y, x + 26 * k, y);
      }
      this.desenharMargem(g);
      // divisória: cada um tem sua água (só no modo 2 jogadores)
      if (!this.solo) {
        g.lineStyle(2 * k, 0xffffff, 0.28);
        for (let y = L.hudH; y < L.H; y += 18 * k) g.lineBetween(W / 2, y, W / 2, Math.min(L.H, y + 9 * k));
      }
      // bordas: piscar e perigo (como no P1)
      for (const id of this.ids) {
        const m = this.marcas[id], sd = L.side[id], s = snaps[id];
        const x0 = sd.x0 + 5 * k, w = sd.x1 - sd.x0 - 10 * k;
        if (m.flashAte && now < m.flashAte) {
          const blink = s.state === S.BITE ? (Math.floor(now / 120) % 2 ? 1 : 0.45) : 1;
          this.gUi.lineStyle(10 * k, m.flashCor, 0.9 * blink).strokeRect(x0, 5 * k, w, L.H - 10 * k);
        } else if (s.zone === 'critica') {
          this.gUi.lineStyle(10 * k, ZONAS.critica, 0.35 + 0.35 * Math.sin(now / 60)).strokeRect(x0, 5 * k, w, L.H - 10 * k);
        } else if (s.zone === 'frouxa') {
          this.gUi.lineStyle(6 * k, ZONAS.frouxa, 0.25 + 0.2 * Math.sin(now / 150)).strokeRect(x0, 5 * k, w, L.H - 10 * k);
        }
      }
      this.atualizarAmbiente(now, regioes);
    }

    /** Margem em pixel art: grama, terra, pedrinhas e juncos (desenho em código). */
    desenharMargem(g) {
      const L = this.L, W = L.W, p = Math.max(2, Math.round(L.c / 2) * 2);
      g.fillStyle(0x5b4a32, 1).fillRect(0, L.bankTop, W, L.H - L.bankTop);
      g.fillStyle(0x6a573b, 1).fillRect(0, L.bankTop + p * 3, W, L.H - L.bankTop - p * 3);
      g.fillStyle(0x3d6b3a, 1).fillRect(0, L.bankTop, W, p * 2);
      g.fillStyle(0x5c9a4a, 1).fillRect(0, L.bankTop, W, p);
      for (let i = 0; i < 70; i++) {
        const x = Math.round(((i * 7919) % 1000) / 1000 * W / p) * p;
        const y = L.bankTop + p * 4 + Math.round((((i * 104729) % 997) / 997) * (L.H - L.bankTop - p * 6) / p) * p;
        g.fillStyle(i % 3 ? 0x4c3d29 : 0x8a7454, 1).fillRect(x, y, p * (1 + (i % 2)), p);
      }
      // tufos de grama na beira
      for (let i = 0; i < 26; i++) {
        const x = Math.round(((i * 3571) % 1000) / 1000 * W / p) * p;
        g.fillStyle(0x5c9a4a, 1).fillRect(x, L.bankTop - p * 2, p, p * 2).fillRect(x + p * 2, L.bankTop - p * 3, p, p * 3);
      }
      // juncos nos cantos externos
      for (const lado of (this.solo ? [0] : [0, 1])) {
        for (let j = 0; j < 5; j++) {
          const x = lado ? W - p * (4 + j * 3) : p * (2 + j * 3), alt = p * (10 + (j * 7) % 9);
          g.fillStyle(0x3f7a3a, 1).fillRect(x, L.bankTop - alt, p, alt);
          g.fillStyle(0x7a5a32, 1).fillRect(x - p / 2, L.bankTop - alt - p * 3, p * 2, p * 3);
        }
      }
    }

    /** Peixes ao fundo e sinais da água: indicam o que cada região oferece, sem revelar tudo. */
    criarPeixesAmbiente() {
      const defs = [
        { r: 'margem', k: 'peixe_lambari', n: 5, l: 0.035, a: 0.45, v: 0.06 },
        { r: 'aberta', k: 'peixe_tilapia', n: 2, l: 0.05, a: 0.3, v: 0.03 },
        { r: 'aberta', k: 'peixe_traira', n: 1, l: 0.05, a: 0.3, v: 0.035 },
        { r: 'fundo', k: 'peixe_bagre', n: 2, l: 0.1, a: 0.22, v: 0.012 },
        { r: 'fundo', k: 'peixe_carpa', n: 1, l: 0.09, a: 0.2, v: 0.01 }
      ];
      this.ambiente = [];
      let i = 0;
      for (const d of defs) for (let j = 0; j < d.n; j++, i++) {
        this.ambiente.push({ d, img: this.add.image(0, 0, d.k).setDepth(-9).setTint(0x06121f), x: (i * 0.37) % 1, fy: ((i * 0.53) % 1), v: d.v * (i % 2 ? 1 : -1), f: i * 1.7, pausa: 0 });
      }
    }

    posicionarPeixesAmbiente(redimensionar) {
      if (!redimensionar) return;
      const W = this.L.W;
      for (const a of this.ambiente) {
        const tex = this.textures.get(a.d.k).getSourceImage();
        const w = W * a.d.l;
        a.img.setDisplaySize(w, w * tex.height / tex.width);
      }
    }

    atualizarAmbiente(now, regioes) {
      const L = this.L, dt = this.dt / 1000, g = this.gAmbiente, k = L.k;
      const faixas = { fundo: [L.waterTop + 0.1 * (this.distY(22) - L.waterTop), this.distY(22) - 10 * k],
        aberta: [this.distY(22) + 8 * k, this.distY(14) - 8 * k], margem: [this.distY(14) + 8 * k, L.bankTop - 10 * k] };
      for (const a of this.ambiente) {
        a.x += a.v * dt * (regioes ? 1 : 0.8);
        if (a.x > 1.08) a.v = -Math.abs(a.v);
        if (a.x < -0.08) a.v = Math.abs(a.v);
        const [y0, y1] = regioes ? faixas[a.d.r] : [L.waterTop + 20 * k, L.bankTop - 12 * k];
        const y = lerp(y0, y1, a.fy) + Math.sin(now / 900 + a.f) * 3 * k;
        const cab = HF.Recortes.RECORTES[a.d.k].cabeca;
        a.img.setPosition(a.x * L.W, y).setFlipX(cab === 'esq' ? a.v > 0 : a.v < 0).setAlpha(regioes ? a.d.a : 0.22);
      }
      // sinais: margem com bolhinhas; abertas com ondulações; fundo com redemoinhos lentos
      if (this.dt > 0) {
        const pr = regioes ? [['margem', 0.9], ['aberta', 0.25], ['fundo', 0.12]] : [['aberta', 0.4]];
        for (const [r, taxa] of pr) {
          if (Math.random() < taxa * this.dt / 1000) {
            const [y0, y1] = regioes ? faixas[r] : [L.waterTop + 20 * k, L.bankTop - 12 * k];
            const xs = this.ids.map((id) => L.side[id]);
            const sd = xs[Math.floor(Math.random() * xs.length)];
            this.particulas.push({ r: regioes ? r : 'aberta', x: lerp(sd.x0 + 30 * k, sd.x1 - 30 * k, Math.random()), y: lerp(y0, y1, Math.random()), t0: now, n: 3 + Math.floor(Math.random() * 3) });
          }
        }
      }
      this.particulas = this.particulas.filter((p) => now - p.t0 < 1800);
      for (const p of this.particulas) {
        const u = (now - p.t0) / 1800;
        if (p.r === 'margem') {
          for (let i = 0; i < p.n; i++) g.lineStyle(Math.max(1, k), 0xd8f4ff, 0.6 * (1 - u)).strokeRect(p.x + i * 5 * k, p.y - u * 26 * k - i * 6 * k, 3 * k, 3 * k);
        } else if (p.r === 'aberta') {
          g.lineStyle(1.5 * k, 0xffffff, 0.22 * (1 - u)).strokeEllipse(p.x, p.y, 40 * k * (0.3 + u), 12 * k * (0.3 + u));
        } else {
          g.lineStyle(2 * k, 0x060f1c, 0.35 * (1 - u)).strokeEllipse(p.x, p.y, 70 * k * (0.4 + u * 0.6), 22 * k * (0.4 + u * 0.6));
          g.lineStyle(2 * k, 0x9fb7ff, 0.12 * (1 - u)).strokeEllipse(p.x, p.y, 40 * k * (0.4 + u), 12 * k * (0.4 + u));
        }
      }
    }

    // ---------------------------------------------------------------- jogador
    desenharJogador(id, s, now) {
      const g = this.gMundo, L = this.L, sd = L.side[id], t = this.tx[id], pl = this.pl[id], cfg = this.session.config;
      const m = this.marcas[id], k = L.k, c = L.c;

      // placar
      const st = s.stats;
      const isca = D.iscaPorId[s.isca];
      t.hud.setText(this.session.players[id].label + '  🐟 ' + st.capturas + (st.capturas ? '  ·  maior ' + kg(st.maiorPesoKg) : '') + '   ' + isca.curto)
        .setColor(pl.cores.css);
      const ih = pl.iscaHud;
      ih.setTexture('isca_' + s.isca);
      const ihs = Math.round(L.hudH * 0.66);
      const tex = this.textures.get('isca_' + s.isca).getSourceImage();
      ih.setDisplaySize(ihs * Math.min(1, tex.width / tex.height), ihs * Math.min(1, tex.height / tex.width));
      ih.setPosition(id === 'P1' ? t.hud.x + t.hud.width + 8 * k + ihs / 2 : t.hud.x - t.hud.width - 8 * k - ihs / 2, L.hudH / 2);

      // personagem
      pl.anim.update(s.paused ? 0 : this.dt, s, now);
      const f = pl.anim.frame();
      const chave = pl.pers + '_' + f.anim;
      if (!pl.shown || pl.shown.key !== chave || pl.shown.index !== f.index) {
        pl.sprite.setTexture(chave, f.index);
        pl.shown = { key: chave, index: f.index };
      }
      const tip = this.toScreen(id, f.rodTip);
      const mao = this.toScreen(id, f.frontHand || this.app.animData.reel.pontos[pl.pers][0].maoDaFrente);
      if (s.pressed) g.lineStyle(2 * k, 0xffffff, 0.75).strokeCircle(mao.x, mao.y, 7 * c);
      this.desenharPeixeNaMao(id, f, s, mao);

      // linha, boia, peixe
      t.bang.setVisible(false); t.dist.setVisible(false);
      const bob = { x: sd.bobX, y: this.distY(s.distance) };
      const r = Math.max(7 * k, L.H * 0.022);
      switch (s.state) {
        case S.CHARGING: {
          const d = cfg.castMinDistance + (cfg.castMaxDistance - cfg.castMinDistance) * s.chargePower;
          const ty = this.distY(d);
          const reg = s.regioesAtivas ? D.regiaoDaDistancia(d) : null;
          const cor = reg ? REGIAO_COR[reg] : 0xffffff;
          g.lineStyle(2 * k, cor, 0.85).strokeCircle(sd.bobX, ty, 12 * k);
          g.lineStyle(2 * k, cor, 0.45).lineBetween(sd.bobX - 22 * k, ty, sd.bobX + 22 * k, ty);
          if (reg) t.regiao.setText(D.REGIOES[reg].curta).setColor('#' + cor.toString(16).padStart(6, '0')).setPosition(sd.bobX, ty - 16 * k).setVisible(true).setAlpha(1);
          // medidor de força acima da cabeça
          const bw = (sd.x1 - sd.x0) * (this.solo ? 0.2 : 0.34), bh = Math.max(10 * k, L.H * 0.03);
          const bx = Math.max(sd.x0 + 6 * k, Math.min(sd.x1 - bw - 6 * k, sd.charX - bw / 2)), by = L.pe - 74 * c - bh - 6 * k;
          g.fillStyle(0x000000, 0.6).fillRect(bx - 2 * k, by - 2 * k, bw + 4 * k, bh + 4 * k);
          // faixas das regiões no medidor (33 % / 66 %)
          if (s.regioesAtivas) {
            g.fillStyle(REGIAO_COR.margem, 0.25).fillRect(bx, by, bw / 3, bh);
            g.fillStyle(REGIAO_COR.aberta, 0.25).fillRect(bx + bw / 3, by, bw / 3, bh);
            g.fillStyle(REGIAO_COR.fundo, 0.25).fillRect(bx + 2 * bw / 3, by, bw / 3, bh);
          }
          g.fillStyle(reg ? REGIAO_COR[reg] : pl.cores.light, 1).fillRect(bx, by, bw * s.chargePower, bh);
          g.lineStyle(2 * k, 0xffffff, 0.8).strokeRect(bx - 2 * k, by - 2 * k, bw + 4 * k, bh + 4 * k);
          break;
        }
        case S.CASTING: {
          t.regiao.setVisible(false);
          const spec = pl.anim.spec.cast;
          const band = HF.CharacterAnimator.castBand(pl.anim.spec, s.castPower);
          const rel = spec.releaseMs[band];
          const dur = cfg.castFlightBaseMs + cfg.castFlightPerPowerMs * s.castPower;
          if (s.msInState >= rel) {
            const from = this.toScreen(id, spec.points[spec.releaseIndex].pontaDaVara);
            const u = Math.min(1, (s.msInState - rel) / Math.max(1, dur - rel));
            const x = lerp(from.x, bob.x, u), y = lerp(from.y, bob.y, u) - Math.sin(Math.PI * u) * L.H * 0.16;
            this.linha(g, tip, { x, y }, 0.2, 0xffffff, 1.5 * k);
            this.boia(g, x, y, pl.cores, 1, r, null);
          }
          break;
        }
        case S.WAITING:
        case S.REELING_EMPTY: {
          const dip = m.beliscadaAte && now < m.beliscadaAte ? 5 * k : 0;
          const y = bob.y + Math.sin(now / 350) * 2 * k + dip;
          this.linha(g, tip, { x: bob.x, y }, 0.35, 0xffffff, 1.5 * k);
          this.boia(g, bob.x, y, pl.cores, 1, r, s.regiao);
          t.dist.setText(Math.round(s.distance) + ' m').setPosition(bob.x, y + r + 4 * k).setVisible(true);
          break;
        }
        case S.BITE: {
          const y = bob.y + 7 * k + Math.sin(now / 40) * 2 * k;
          this.linha(g, tip, { x: bob.x, y }, 0.05, 0xffffff, 2 * k);
          this.boia(g, bob.x, y, pl.cores, 0.55, r, null);
          t.bang.setText('!').setPosition(bob.x, y - r - 6 * k).setVisible(true);
          const u = s.biteLeftMs / s.biteWindowMs, ww = 60 * k;
          g.fillStyle(0xffffff, 0.9).fillRect(bob.x - ww / 2, y + r + 8 * k, ww * u, 5 * k);
          break;
        }
        case S.FIGHTING: this.desenharBriga(g, s, tip, bob, now, id); break;
        case S.LINE_BROKEN:
          if (m.partiuEm && now - m.partiuEm < 600) {
            const u = (now - m.partiuEm) / 600;
            g.lineStyle(2 * k, 0xff3b3b, 1 - u).lineBetween(tip.x, tip.y, lerp(tip.x, m.partiuDe.x, 0.4), lerp(tip.y, m.partiuDe.y, 0.4) + u * 40 * k);
          }
          break;
        default: break;
      }
      if (s.state !== S.CHARGING) {
        const mostrar = m.tagAte && now < m.tagAte && s.state === S.WAITING && s.regiao;
        if (mostrar) {
          const cor = REGIAO_COR[s.regiao];
          t.regiao.setText(D.REGIOES[s.regiao].curta).setColor('#' + cor.toString(16).padStart(6, '0'))
            .setPosition(bob.x, bob.y - r - 10 * k).setAlpha(Math.min(1, (m.tagAte - now) / 400)).setVisible(true);
        } else t.regiao.setVisible(false);
      }

      if (m.avisoAte && now < m.avisoAte && !s.paused) t.aviso.setText(m.avisoTexto).setAlpha(Math.min(1, (m.avisoAte - now) / 300)).setVisible(true);
      else t.aviso.setVisible(false);

      this.desenharMedidor(s, id, now);
      this.desenharPrompt(id, s, now);
      this.desenharCartao(id, s);
    }

    desenharPeixeNaMao(id, f, s, mao) {
      const pl = this.pl[id], img = pl.peixeMao, m = this.marcas[id], c = this.L.c;
      if (!(f.fish && s.state === S.CAUGHT && m.cartao)) { img.setVisible(false); return; }
      const chave = (m.cartao.objeto ? 'objeto_' : 'peixe_') + m.cartao.id;
      if (img.texture.key !== chave) img.setTexture(chave);
      const src = this.textures.get(chave).getSourceImage();
      const comp = (m.cartao.objeto ? 13 : 10 + 12 * Math.min(1, m.cartao.kg / 8)) * c;
      const asp = src.height / src.width;
      img.setDisplaySize(comp, comp * asp);
      const cab = (HF.Recortes.RECORTES[chave] || {}).cabeca;
      const out = pl.sprite.flipX ? -1 : 1;
      img.setAngle(m.cartao.objeto ? 0 : (cab === 'esq' ? 90 : -90));
      const alt = m.cartao.objeto ? comp * asp : comp;
      img.setPosition(mao.x + out * 2 * c, mao.y + alt / 2 + c).setVisible(true);
    }

    linha(g, from, to, sag, color, width) {
      const cx = (from.x + to.x) / 2;
      const cy = (from.y + to.y) / 2 + Math.abs(to.x - from.x) * sag + Math.abs(to.y - from.y) * sag * 0.3;
      g.lineStyle(width, color, 0.95);
      g.beginPath(); g.moveTo(from.x, from.y);
      for (let i = 1; i <= 14; i++) { const u = i / 14, v = 1 - u; g.lineTo(v * v * from.x + 2 * v * u * cx + u * u * to.x, v * v * from.y + 2 * v * u * cy + u * u * to.y); }
      g.strokePath();
    }

    boia(g, x, y, cores, alpha, r, regiao) {
      const k = this.L.k;
      if (regiao) g.lineStyle(3 * k, REGIAO_COR[regiao], 0.9 * alpha).strokeCircle(x, y, r + 4 * k);
      g.fillStyle(0xffffff, alpha).fillCircle(x, y, r);
      g.fillStyle(cores.main, alpha).slice(x, y, r, Math.PI, 0, false).fillPath();
      g.lineStyle(2 * k, 0x000000, 0.6 * alpha).strokeCircle(x, y, r);
      g.lineStyle(2 * k, 0xffffff, alpha).lineBetween(x, y - r, x, y - r - 6 * k);
    }

    desenharBriga(g, s, tip, bob, now, id) {
      const k = this.L.k, zone = s.zone;
      const pull = s.fish ? s.fish.puxao : 0, run = s.fish && s.fish.fase === 'corrida';
      const amp = (8 + 26 * pull) * k;
      const fx = bob.x + Math.sin(now / (run ? 110 : 380)) * amp, fy = bob.y + Math.cos(now / 520) * 3 * k;
      const sag = s.tension < 0.2 ? 0.45 : s.tension < 0.4 ? 0.15 : 0;
      const jitter = zone === 'critica' ? Math.sin(now / 18) * 3 * k : 0;
      this.linha(g, tip, { x: fx + jitter, y: fy }, sag, ZONAS[zone], (zone === 'critica' ? 3.5 : zone === 'alerta' ? 2.5 : 2) * k);
      const size = 1 + Math.min(1, (s.fish ? s.fish.pesoKg : 1) / 6) * 0.9;
      const w = this.L.H * 0.07 * size, h = w * 0.42;
      g.fillStyle(0x08131c, 0.9).fillEllipse(fx, fy + 4 * k, w, h);
      g.lineStyle(2 * k, 0xbfe3ff, 0.5).strokeEllipse(fx, fy + 4 * k, w, h);
      const td = Math.sin(now / (run ? 110 : 380)) > 0 ? -1 : 1;
      g.fillStyle(0x08131c, 0.9).fillTriangle(fx + td * w / 2, fy + 4 * k, fx + td * (w / 2 + h * 0.8), fy + 4 * k - h / 2, fx + td * (w / 2 + h * 0.8), fy + 4 * k + h / 2);
      if (run && Math.floor(now / 140) % 2 === 0) g.lineStyle(2 * k, 0xffffff, 0.6).strokeCircle(fx, fy, w * 0.6);
      this.tx[id].dist.setText(Math.max(0, Math.round(s.distance)) + ' m').setPosition(fx, fy + h + 4 * k).setVisible(true);
    }

    desenharMedidor(s, id, now) {
      const g = this.gUi, L = this.L, sd = L.side[id], cfg = this.session.config, k = L.k;
      const x = sd.meterX, w = L.meterW, top = L.waterTop + 22 * k, bottom = L.bankTop - 10 * k, h = bottom - top;
      const ativo = s.state === S.FIGHTING, a = ativo ? 1 : 0.25;
      const yOf = (v) => bottom - v * h;
      g.fillStyle(0x000000, 0.55 * a + 0.1).fillRect(x - 3 * k, top - 3 * k, w + 6 * k, h + 6 * k);
      const bands = [[0, cfg.slackMax, 'frouxa'], [cfg.slackMax, cfg.alertMin, 'segura'], [cfg.alertMin, cfg.criticalMin, 'alerta'], [cfg.criticalMin, 1, 'critica']];
      for (const [b0, b1, z] of bands) g.fillStyle(ZONAS[z], (ativo && s.zone === z ? 0.95 : 0.4) * a).fillRect(x, yOf(b1), w, yOf(b0) - yOf(b1));
      this.tx[id].medidor.setText('TENSÃO').setAlpha(ativo ? 1 : 0.4);
      if (!ativo) return;
      const my = yOf(s.tension), dentro = (id === 'P1' && !this.solo) ? 1 : -1;
      g.fillStyle(0xffffff, 1).fillRect(x - 5 * k, my - 2 * k, w + 10 * k, 4 * k);
      const px = dentro > 0 ? x + w + 5 * k : x - 5 * k;
      g.fillTriangle(px, my - 7 * k, px, my + 7 * k, px + dentro * 10 * k, my);
      const rx = dentro > 0 ? x + w + 18 * k : x - 24 * k, rw = 6 * k;
      const kc = Math.min(1, s.criticalMs / cfg.criticalBreakMs), ks = Math.min(1, s.slackMs / cfg.slackEscapeMs);
      g.fillStyle(0x000000, 0.5).fillRect(rx, top, rw, h);
      if (kc > 0) g.fillStyle(ZONAS.critica, 1).fillRect(rx, top, rw, h / 2 * kc);
      if (ks > 0) g.fillStyle(ZONAS.frouxa, 1).fillRect(rx, bottom - h / 2 * ks, rw, h / 2 * ks);
    }

    desenharPrompt(id, s, now) {
      const t = this.tx[id].prompt;
      let text = '', color = '#ffffff';
      switch (s.state) {
        case S.IDLE: text = 'SEGURE para carregar\nSOLTE para arremessar'; break;
        case S.CHARGING: text = 'SOLTE para arremessar!  ' + Math.round(s.chargePower * 100) + '%'; break;
        case S.WAITING: text = 'Espere a boia AFUNDAR…\n(segure para recolher)'; color = '#d6e6f2'; break;
        case S.REELING_EMPTY: text = 'Recolhendo a linha…\n(solte para parar)'; color = '#d6e6f2'; break;
        case S.BITE: text = 'TOQUE AGORA!'; color = Math.floor(now / 120) % 2 ? '#ffffff' : this.pl[id].cores.css; break;
        case S.FIGHTING:
          if (s.zone === 'critica') { text = 'SOLTE! A linha vai arrebentar'; color = '#ff6b6b'; }
          else if (s.zone === 'alerta') { text = 'Cuidado: solte para aliviar'; color = '#ffc46b'; }
          else if (s.zone === 'frouxa') { text = 'SEGURE! A linha está frouxa'; color = '#8cc8ff'; }
          else { text = 'SEGURE recolhe · SOLTE alivia'; color = '#9ff0b8'; }
          break;
        default: break;
      }
      t.setText(text).setColor(color);
    }

    /** Cartão de resultado no alto da água do jogador: nunca cobre o personagem nem o diálogo. */
    desenharCartao(id, s) {
      const t = this.tx[id], L = this.L, sd = L.side[id], cfg = this.session.config, k = L.k, pl = this.pl[id];
      const show = s.state === S.CAUGHT || s.state === S.ESCAPED || s.state === S.LINE_BROKEN;
      t.titulo.setVisible(show); t.sub.setVisible(show); t.dica.setVisible(show); t.selo.setVisible(false); pl.imgCartao.setVisible(false);
      this.cardRect = this.cardRect || {};
      this.cardRect[id] = null;
      if (!show) return;
      const r = s.lastResult || {}, m = this.marcas[id], g = this.gUi;
      const cw = L.cartao.w, ch = L.cartao.h, cx = sd.cardCx, top = L.cartao.top;
      this.cardRect[id] = { x: cx - cw / 2, y: top, w: cw, h: ch };
      const pop = Math.min(1, s.msInState / 150);
      let titulo, sub, borda, corTitulo = '#ffffff';
      const pular = '';
      t.dica.setText(s.msInState >= cfg.resultSkipAfterMs ? 'toque e segure para arremessar de novo' : '').setPosition(cx, top + ch - 6 * k).setAlpha(pop);
      if (s.state === S.CAUGHT && m.cartao) {
        const c = m.cartao;
        titulo = c.objeto ? 'OBJETO ESTRANHO!' : (c.grande ? 'PEIXÃO!' : 'PEGOU!');
        corTitulo = c.objeto ? '#ffe9a8' : '#9ff0b8';
        borda = c.objeto ? 0xe2b75a : 0x3ccf6e;
        const onde = c.regiao ? D.REGIOES[c.regiao].nome + ' · ' : '';
        const curto = D.iscaPorId[c.isca].curto;                  // "Coração" em vez de "Coração de galinha"
        sub = c.nome + ' · ' + kg(c.kg) + '\n' + onde + curto.charAt(0) + curto.slice(1).toLowerCase() + pular;
        const selo = c.objeto ? '' : c.novo ? '★ NOVO NO CATÁLOGO ★' : c.recorde ? '★ RECORDE ★' : '';
        if (selo) t.selo.setText(selo).setPosition(cx, top + ch * 0.25).setAlpha(pop).setVisible(true);
        // imagem do peixe (recorte da folha do criador)
        const chave = (c.objeto ? 'objeto_' : 'peixe_') + c.id;
        const img = pl.imgCartao;
        if (img.texture.key !== chave) img.setTexture(chave);
        const src = this.textures.get(chave).getSourceImage();
        const mw = cw * (c.objeto ? 0.24 : 0.3 + 0.2 * Math.min(1, c.kg / 7)), mh = ch * 0.24;
        const esc = Math.min(mw / src.width, mh / src.height);
        img.setDisplaySize(src.width * esc, src.height * esc).setPosition(cx, top + ch * 0.46).setAlpha(pop).setVisible(true).setFlipX(id === 'P2' && !this.solo);
      } else if (s.state === S.LINE_BROKEN) {
        titulo = 'LINHA ROMPEU!'; borda = 0xff3b3b;
        sub = 'Ficou no vermelho tempo demais.\nSolte quando a tensão subir.' + pular;
      } else if (r.motivo === 'sem-reacao') {
        titulo = 'ESCAPOU!'; borda = 0x8899aa;
        sub = 'Não deu tempo de fisgar.\nToque logo que a boia afundar.' + pular;
      } else {
        titulo = 'ESCAPOU!'; borda = 0x4aa3ff;
        sub = 'A linha ficou frouxa demais.\nSegure para manter a linha esticada.' + pular;
      }
      g.fillStyle(0x0b141b, 0.9 * pop).fillRect(cx - cw / 2, top, cw, ch);
      g.lineStyle(4 * k, borda, pop).strokeRect(cx - cw / 2, top, cw, ch);
      g.lineStyle(2 * k, 0x000000, 0.6 * pop).strokeRect(cx - cw / 2 + 4 * k, top + 4 * k, cw - 8 * k, ch - 8 * k);
      const temImg = s.state === S.CAUGHT && m.cartao;
      t.titulo.setScale(1).setText(titulo).setColor(corTitulo).setPosition(cx, top + ch * 0.12).setAlpha(pop);
      if (t.titulo.width > cw * 0.92) t.titulo.setScale(cw * 0.92 / t.titulo.width);   // títulos longos cabem no cartão
      t.sub.setScale(1).setText(sub).setPosition(cx, top + ch * (temImg ? 0.6 : 0.3)).setAlpha(pop);
      // o texto nunca invade a linha da dica (telas estreitas ou nomes longos): encolhe se precisar
      const livre = (top + ch - 8 * k - t.dica.height) - t.sub.y;
      if (t.sub.height > livre || t.sub.width > cw * 0.94) t.sub.setScale(Math.max(0.6, Math.min(livre / t.sub.height, cw * 0.94 / t.sub.width)));
    }

    desenharEfeitos(now) {
      const g = this.gEfeitos;
      this.efeitos = this.efeitos.filter((e) => now - e.t0 < e.dur);
      for (const e of this.efeitos) {
        const u = (now - e.t0) / e.dur;
        g.lineStyle(3 * this.L.k, e.color, 1 - u).strokeEllipse(e.x, e.y, e.radius * 2 * (0.3 + u), e.radius * 0.8 * (0.3 + u));
      }
    }

    // ---------------------------------------------------------------- diálogos centrais
    /**
     * Caixa de diálogo no centro, sobre a água (entre as colunas das boias, acima da margem).
     * Uma fala por vez (o Narrador garante). Estilos: fala (adultos), balbucio e choro (Sirius).
     * O texto aparece letra a letra no relógio da narrativa (congela na pausa).
     */
    desenharDialogo() {
      const d = this.dlg, L = this.L, k = L.k, g = this.gDialogo, n = this.narrador;
      const linha = n.linha();
      if (linha && linha !== d.linha) {
        d.linha = linha;
        d.mudouEm = n.t;
        const est = ESTILO_CAIXA[linha.estilo] || ESTILO_CAIXA.fala;
        const cor = CORES_FALA[linha.pessoa] || CORES_FALA.alemao;
        d.retrato.setTexture(HF.Recortes.rosto(linha.pessoa, linha.emo));
        d.nome.setText(linha.estilo === 'fala' ? linha.nome : linha.nome + (linha.estilo === 'choro' ? '  (chorando)' : '  (balbuciando)')).setColor(cor.nome)
          .setStroke(linha.estilo === 'fala' ? '#000000' : '#ffffff', linha.estilo === 'fala' ? 3 * k : 0);
        const balb = linha.estilo !== 'fala';
        d.texto.setFontSize(Math.round(this.fontes.pequeno * (balb ? 1.55 : 1.05))).setFontStyle(balb ? 'bold' : 'normal').setColor(est.texto);
        d.texto.setText(linha.texto);
        d.hTexto = d.texto.height;                       // altura final (a caixa não pula enquanto o texto aparece)
      }
      const ativo = !!n.atual;
      const passo = (this.dt || 16) / 180;
      d.alfa = ativo && d.linha ? Math.min(1, d.alfa + passo) : Math.max(0, d.alfa - passo);
      const vis = d.alfa > 0.01 && !!d.linha;
      d.nome.setVisible(vis); d.texto.setVisible(vis); d.retrato.setVisible(vis); d.nota.setVisible(false);
      this.dlgRect = null;
      if (!vis) { if (!ativo) d.linha = null; return; }
      const l = d.linha, est = ESTILO_CAIXA[l.estilo] || ESTILO_CAIXA.fala, cor = CORES_FALA[l.pessoa] || CORES_FALA.alemao;
      // máquina de escrever (adultos); balbucio aparece de uma vez
      const mostra = l.estilo === 'fala' ? Math.min(l.texto.length, Math.ceil((n.t - l.inicio) / Math.max(1, l.revelarMs) * l.texto.length)) : l.texto.length;
      d.texto.setText(l.texto.slice(0, Math.max(1, mostra)));
      const pad = d.pad, ret = d.ret, p = 3 * k;
      const w = L.dialogo.w, h = Math.max(ret + pad * 2, d.nome.height + d.hTexto + pad * 2.4);
      const pulo = Math.max(0, 1 - (n.t - d.mudouEm) / 160);           // pulinho quando troca quem fala
      let x = L.dialogo.cx - w / 2;
      const y = L.dialogo.y - h - (1 - d.alfa) * 10 * k - pulo * 4 * k;
      if (l.estilo === 'choro') x += Math.round(Math.sin(n.t / 28) * 2 * k);
      const a = d.alfa;
      // caixa em pixel art: cantos em degrau, borda, sombra
      g.fillStyle(0x000000, 0.35 * a).fillRect(x + p, y + p * 2, w, h);
      g.fillStyle(est.borda, a).fillRect(x + p, y, w - 2 * p, h).fillRect(x, y + p, w, h - 2 * p);
      g.fillStyle(est.fundo, 0.97 * a).fillRect(x + 2 * p, y + p, w - 4 * p, h - 2 * p).fillRect(x + p, y + 2 * p, w - 2 * p, h - 4 * p);
      // ponteiro: pescadores apontam para o seu lado; Maria e Sirius apontam para a margem (onde estão)
      const lado = (!this.solo && l.pessoa === 'alemao') ? -1 : (!this.solo && l.pessoa === 'ale') ? 1 : (this.solo && l.pessoa === this.pl.P1.pers ? -1 : 0);
      const tx = lado < 0 ? x + 3 * p : lado > 0 ? x + w - 6 * p : x + w / 2 - p;
      g.fillStyle(est.borda, a).fillRect(tx, y + h - p, 3 * p, p).fillRect(tx + (lado < 0 ? 0 : p), y + h, 2 * p, p).fillRect(tx + (lado < 0 ? 0 : lado > 0 ? 2 * p : p), y + h + p, p, p);
      // moldura do retrato
      const rx = x + pad, ry = y + (h - ret) / 2;
      g.fillStyle(est.borda, a).fillRect(rx - p, ry - p, ret + 2 * p, ret + 2 * p);
      g.fillStyle(cor.retrato, a).fillRect(rx, ry, ret, ret);
      const src = this.textures.get(d.retrato.texture.key).getSourceImage();
      const esc = ret / Math.max(src.width, src.height);
      d.retrato.setDisplaySize(src.width * esc, src.height * esc).setPosition(rx + ret / 2, ry + ret / 2 + (l.estilo === 'balbucio' ? Math.sin(n.t / 90) * 1.5 * k : 0)).setAlpha(a);
      if (l.estilo === 'choro') {                                         // lágrimas em pixel
        for (let i = 0; i < 3; i++) {
          const u = ((n.t / 420) + i / 3) % 1;
          g.fillStyle(0x6ec1ff, a * (1 - u)).fillRect(rx + ret * (0.3 + 0.2 * i), ry + ret * 0.45 + u * ret * 0.5, 2 * k, 3 * k);
        }
      }
      const tx0 = rx + ret + pad * 1.5;
      d.nome.setPosition(tx0, y + pad * 0.8).setAlpha(a);
      d.texto.setPosition(tx0, y + pad * 0.8 + d.nome.height + 2 * k + (l.estilo === 'balbucio' ? Math.sin(n.t / 110) * 2 * k : 0)).setAlpha(a);
      if (l.estilo !== 'fala') {
        d.nota.setText(l.estilo === 'choro' ? '!' : '♪').setColor(l.estilo === 'choro' ? '#d04a6a' : '#2b5fa8')
          .setPosition(x + w - pad * 1.6, y + pad * 1.4 + Math.sin(n.t / 150) * 3 * k).setAlpha(a).setVisible(true);
      }
      this.dlgRect = { x, y, w, h: h + 2 * p };          // área ocupada (para os testes de sobreposição)
    }

    /**
     * Maria e Sirius na margem: os retratos das folhas do criador sobre uma manta de piquenique
     * desenhada em código. O estado do Sirius fica visível (dormindo, balbuciando, chorando).
     * Só visual: nada aqui interfere na pescaria.
     */
    desenharFamilia(now) {
      const L = this.L, k = L.k, f = this.fam, g = this.gFamilia, n = this.narrador;
      g.clear();
      const st = n.familia(), linha = n.linha();
      const s = L.familia.s, cx = L.familia.cx, cy = L.familia.cy;
      const px = Math.max(2, Math.round(s / 9));
      // manta xadrez
      const mw = Math.round(s * 2.7 / px) * px, mh = Math.round(s * 0.5 / px) * px;
      const mx = Math.round((cx - mw / 2) / px) * px, my = Math.round((cy + s * 0.3) / px) * px;
      for (let yy = 0; yy < mh; yy += px) for (let xx = 0; xx < mw; xx += px) {
        const xadrez = (Math.floor(xx / (px * 2)) + Math.floor(yy / (px * 2))) % 2;
        g.fillStyle(xadrez ? 0xd8434a : 0xf5efe0, 1).fillRect(mx + xx, my + yy, px, px);
      }
      g.fillStyle(0x000000, 0.25).fillRect(mx, my + mh, mw, px);
      // Maria
      const ocupada = st.mariaOcupada;
      const emoM = ocupada ? 'preocupado' : (linha && linha.pessoa === 'maria' ? linha.emo : 'feliz');
      const kM = HF.Recortes.rosto('maria', emoM);
      if (f.maria.texture.key !== kM) f.maria.setTexture(kM);
      const fala = (quem) => linha && linha.pessoa === quem;
      const tamM = s * (fala('maria') ? 1.08 : 1);
      const srcM = this.textures.get(kM).getSourceImage();
      f.maria.setDisplaySize(tamM * srcM.width / Math.max(srcM.width, srcM.height), tamM * srcM.height / Math.max(srcM.width, srcM.height))
        .setPosition(cx - s * 0.62, cy - s * 0.12);
      // Sirius
      const est = st.sirius;
      const kS = HF.Recortes.rosto('sirius', est === 'acordado' && fala('sirius') ? 'feliz' : 'curioso');
      if (f.sirius.texture.key !== kS) f.sirius.setTexture(kS);
      const tamS = s * 0.82 * (fala('sirius') ? 1.1 : 1);
      const tremor = (est === 'chorando' || est === 'inquieto') ? Math.sin(now / 35) * 1.5 * k : 0;
      f.sirius.setDisplaySize(tamS, tamS).setPosition(cx + s * 0.62 + tremor, cy + s * 0.02).setAlpha(est === 'dormindo' ? 0.78 : 1);
      // nomes acima dos retratos (embaixo não cabe em telas baixas)
      f.nomeMaria.setOrigin(0.5, 1).setPosition(cx - s * 0.62, cy - s * 0.66 - px);
      f.nomeSirius.setOrigin(0.5, 1).setPosition(cx + s * 0.62, cy - s * 0.4 - px);
      // ícone de estado do Sirius
      let icone = '', cor = '#ffffff';
      if (est === 'dormindo') { icone = ['z', 'z Z', 'z Z z'][Math.floor(now / 600) % 3]; cor = '#cfe6ff'; }
      else if (est === 'inquieto') { icone = '!'; cor = '#ffd23f'; }
      else if (est === 'chorando' || est === 'acalmando') { icone = est === 'chorando' ? '!!' : '...'; cor = '#ff9fb0'; }
      else if (fala('sirius')) { icone = '♪'; cor = '#9fd0ff'; }
      f.icone.setText(icone).setColor(cor).setPosition(cx + s * 0.95, cy - s * 0.55 + Math.sin(now / 300) * 3 * k).setVisible(!!icone);
      if (est === 'chorando') {                                           // lágrimas
        for (let i = 0; i < 2; i++) {
          const u = ((now / 500) + i / 2) % 1;
          g.fillStyle(0x6ec1ff, 1 - u).fillRect(cx + s * (0.5 + 0.22 * i), cy + u * s * 0.4, px, px * 1.5);
        }
      }
      // destaque discreto em quem está falando
      if (fala('maria') || fala('sirius')) {
        const ox = fala('maria') ? cx - s * 0.62 : cx + s * 0.62;
        g.lineStyle(2 * k, 0xf3e3b5, 0.8).strokeRect(ox - s * 0.55, cy - s * 0.66, s * 1.1, s * 1.1);
      }
      const topo = cy - s * 0.66 - px - f.nomeMaria.height;
      this.familiaRect = { x: mx - px, y: topo, w: mw + 2 * px, h: my + mh + px - topo };
    }

    /** D8: depois de uma interrupção, a tela pede um toque para continuar (como no P1). */
    desenharPausa() {
      const g = this.gPausa;
      g.clear();
      const show = this.session.awaitingTap && !this.pausadoPeloMenu && !this.retrato;
      this.textoPausa.setVisible(show);
      if (!show) return;
      g.fillStyle(0x000000, 0.6).fillRect(0, 0, this.L.W, this.L.H);
      this.textoPausa.setText('PAUSADO\n\nToque na tela para continuar');
    }
  }

  CenaPartida.REGIAO_COR = REGIAO_COR;
  root.HF.CenaPartida = CenaPartida;
})(window);
