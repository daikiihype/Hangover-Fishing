/*
 * Hangover Fishing — versão jogável (Operação Nova Identidade)
 * CenaPartida: a pescaria (horizontal), para 1 ou 2 jogadores.
 *
 * Toda a regra de pesca vem da SessaoJogo (FishingSession + FishingPlayer do P1, sem
 * alterações, com as tabelas de região e isca do PescadorRegional e os pontos de interesse).
 * Esta cena só:
 *   - repassa os toques ao TouchRouter do P1 (no modo 1 jogador, todos vão para o P1);
 *   - mostra o lago (Cenario: pixel art gerada por código; VidaDoLago: animações e eventos),
 *     os personagens aprovados, a linha, a boia, o peixe na briga, o HUD (placas nos cantos,
 *     medidor de tensão compacto, dicas que somem, cartões) e a caixa de diálogo;
 *   - registra as capturas no catálogo e alimenta a narrativa.
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
  // cor de cada lugar do lago (alvo, medidor de força e rótulo)
  const ZONA_COR = { rasa: 0x8fe8c8, lirios: 0xff9fc8, pedras: 0x8cc8ff, poco: 0xb9a2ff };
  const REGIAO_COR = { margem: ZONA_COR.rasa, aberta: ZONA_COR.lirios, fundo: ZONA_COR.poco };
  const css = (c) => '#' + c.toString(16).padStart(6, '0');
  // distância → altura na água: 4 lugares (Margem Rasa, Baía dos Lírios, Curva das Pedras, Poço Profundo)
  const FAIXAS = [{ ate: 14, frac: 0.3 }, { ate: 18, frac: 0.16 }, { ate: 22, frac: 0.16 }, { ate: 32, frac: 0.38 }];
  const TUTORIAL = 'hf.tutorial.v1';
  const DICAS_ATE = 3;                    // as dicas somem depois de 3 acertos de cada etapa (GDD S8)

  function lerp(a, b, t) { return a + (b - a) * t; }
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
      this.inicioMs = performance.now();
      this.novasEspecies = [];
      this.recordes = [];
      this.pausadoPeloMenu = false;
      this.retrato = false;
      // o Phaser reaproveita a MESMA cena entre partidas: zera os registros de desenho da partida anterior
      this.camadas = {}; this.placaRect = {}; this.cardRect = {}; this.medidorRect = {}; this.dicaRect = {};
      this.tut = Object.assign({ arremessos: 0, fisgadas: 0, capturas: 0 }, app.arm.ler(TUTORIAL, {}) || {});

      this.gMundo = this.add.graphics().setDepth(0);
      this.gEfeitos = this.add.graphics().setDepth(1);
      this.gUi = this.add.graphics().setDepth(5);
      this.gPausa = this.add.graphics().setDepth(20);

      const params = new URLSearchParams(root.location.search);
      this.vida = new HF.VidaDoLago(this, { entardecer: params.get('entardecer') === '1' });
      this.vida.aoEvento = (ev) => this.aoEventoDoLago(ev);
      this.caixa = new HF.CaixaDialogo(this);
      this.dlg = this.caixa;                    // nome antigo (testes): .nome e .texto são os textos da caixa

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
          hud: txt({ fontStyle: 'bold' }).setOrigin(0, 0),
          hud2: txt({ color: '#fff1c9' }).setOrigin(0, 0),
          titulo: txt({ fontStyle: 'bold', align: 'center' }).setOrigin(0.5),
          sub: txt({ align: 'center' }).setOrigin(0.5, 0),
          selo: txt({ fontStyle: 'bold', align: 'center', color: '#ffe9a8' }).setOrigin(0.5),
          dica: txt({ align: 'center', color: '#9fb7d1' }).setOrigin(0.5, 1),
          bang: txt({ fontStyle: 'bold' }).setOrigin(0.5, 1),
          toque: txt({ fontStyle: 'bold', align: 'center' }).setOrigin(0.5, 0).setVisible(false),
          dist: txt({ color: '#e8f2f8' }).setOrigin(0.5, 0),
          alerta: txt({ fontStyle: 'bold', align: 'center' }).setOrigin(0.5, 1).setVisible(false),
          aviso: txt({ fontStyle: 'bold', align: 'center', color: '#ffd23f' }).setOrigin(0.5).setVisible(false),
          regiao: txt({ fontStyle: 'bold', align: 'center' }).setOrigin(0.5, 0).setVisible(false),
          tutorial: txt({ fontStyle: 'bold', align: 'center', color: '#fff1c9' }).setOrigin(0.5).setVisible(false)
        };
        if (this.solo) this.pl[id].sprite.setFlipX(false);
        else this.pl[id].sprite.setFlipX(id === 'P2');
      }
      this.textoPausa = txt({ fontStyle: 'bold', align: 'center' }, 21).setOrigin(0.5).setVisible(false);

      this.narrador = this.novoNarrador();

      // entrada (mesma ponte do P1; no modo 1 jogador todo toque é do P1)
      this.input.on('pointerdown', this.aoTocar, this);
      this.input.on('pointerdownoutside', (p) => this.router.ignore(p.id));
      this.input.on('pointermove', (p) => { if (p.isDown) this.router.move({ key: p.id, x: this.xEntrada(p.x), time: performance.now() }); });
      this.input.on('pointerup', this.aoSoltar, this);
      this.input.on('pointerupoutside', this.aoSoltar, this);

      this.session.onEvent((e) => this.aoEvento(e));
      const desligar = this.session.pontos.on((ev) => this.aoPonto(ev));
      this.scale.on('resize', this.layout, this);
      this.events.once('shutdown', () => {
        this.scale.off('resize', this.layout, this);
        desligar();
        if (this.app.audio.ambiente) this.app.audio.ambiente('chuva', false);   // a chuva não continua no menu
      });
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
    /** Só para testes e demonstração. */
    forcarEvento(tipo) { return this.vida.forcarEvento(tipo, this.contextoDoLago()); }
    forcarPonto(tipo, distancia) { return this.session.pontos.forcar(tipo, distancia); }

    recomecar() {
      this.session.reset(Date.now() >>> 0);
      this.narrador = this.novoNarrador();
      this.caixa.limpar();
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
      const P = Math.max(1, Math.floor(H * 0.36 / 64));                         // pixel da arte (= personagens no modo 2)
      const c = this.solo ? Math.max(1, Math.floor(H * 0.5 / 64)) : P;           // escala dos personagens
      const horizonte = Math.round(H * (this.solo ? 0.2 : 0.22) / P) * P;
      const bankTop = Math.round(H * (this.solo ? 0.63 : 0.66) / P) * P;
      const pe = H - Math.round(Math.max(4 * k, H * 0.02));
      const hudH = Math.round(Math.max(38 * k, H * 0.125));
      const L = { W, H, k, P, c, horizonte, bankTop, pe, hudH, waterTop: horizonte };
      L.perto = bankTop - 4 * P;
      L.longe = horizonte + (bankTop - horizonte) * 0.05;
      L.reservaPausa = Math.round(52 * k);                                      // o botão de pausa fica no canto superior direito
      L.medW = Math.round(Math.max(9 * k, W * 0.011));
      L.medTop = Math.round(bankTop - H * 0.17);
      L.medBase = Math.round(pe - H * 0.1);
      if (this.solo) {
        const charX = Math.round(W * 0.14);
        L.side = { P1: { x0: 0, x1: W, charX, bobX: W * 0.64, cx: W * 0.6, cardCx: W * 0.78, medX: Math.max(14 * k, charX - W * 0.095), dir: 1 } };
        L.dialogo = { cx: W * 0.64, w: Math.round(W * 0.56) };
      } else {
        const c1 = Math.round(W * 0.11), c2 = Math.round(W * 0.89);
        L.side = {
          P1: { x0: 0, x1: W / 2, charX: c1, bobX: W * 0.31, cx: W * 0.25, cardCx: W * 0.25, medX: Math.max(14 * k, c1 - W * 0.075), dir: 1 },
          P2: { x0: W / 2, x1: W, charX: c2, bobX: W * 0.69, cx: W * 0.75, cardCx: W * 0.75, medX: Math.min(W - 14 * k, c2 + W * 0.075), dir: -1 }
        };
        L.dialogo = { cx: W / 2, w: Math.round(W * 0.46) };
      }
      L.dialogo.base = H - Math.round(Math.max(6 * k, H * 0.03));
      L.cartao = { top: hudH + Math.round(H * 0.035), h: Math.round(Math.min(H * 0.42, bankTop - hudH - H * 0.14)), w: Math.round(this.solo ? W * 0.3 : W * 0.26) };
      L.dicaY = hudH + Math.round(H * 0.045);
      this.L = L;

      const unit = this.solo ? Math.min(W * 0.6, H) : Math.min(W / 2, H);
      const grande = Math.max(16 * k, Math.round(unit * 0.075));
      const medio = Math.max(13 * k, Math.round(unit * 0.05));
      const pequeno = Math.max(11 * k, Math.round(unit * 0.038));
      this.fontes = { grande, medio, pequeno };
      for (const id of this.ids) {
        const t = this.tx[id], sd = L.side[id], pl = this.pl[id];
        t.hud.setFontSize(pequeno).setStroke('#000000', 3 * k);
        t.hud2.setFontSize(Math.max(10 * k, Math.round(pequeno * 0.85))).setStroke('#000000', 3 * k);
        t.titulo.setFontSize(grande).setStroke('#000000', 5 * k);
        t.sub.setFontSize(pequeno).setWordWrapWidth(L.cartao.w * 0.9).setLineSpacing(2 * k);
        t.selo.setFontSize(pequeno).setStroke('#000000', 4 * k);
        t.dica.setFontSize(Math.max(9 * k, Math.round(pequeno * 0.78))).setWordWrapWidth(L.cartao.w * 0.92);
        t.bang.setFontSize(Math.round(grande * 1.3)).setStroke('#000000', 6 * k);
        t.toque.setFontSize(medio).setStroke('#000000', 5 * k);
        t.dist.setFontSize(Math.max(9 * k, Math.round(pequeno * 0.72))).setStroke('#000000', 3 * k);
        t.alerta.setFontSize(Math.max(10 * k, Math.round(pequeno * 0.9))).setStroke('#000000', 4 * k);
        t.aviso.setFontSize(medio).setStroke('#000000', 5 * k).setPosition(sd.cx, lerp(L.horizonte, L.bankTop, 0.45)).setWordWrapWidth((sd.x1 - sd.x0) * 0.8);
        t.regiao.setFontSize(Math.max(10 * k, Math.round(pequeno * 0.85))).setStroke('#000000', 4 * k);
        t.tutorial.setFontSize(Math.max(10 * k, Math.round(pequeno * 0.92))).setStroke('#000000', 4 * k).setWordWrapWidth((sd.x1 - sd.x0) * (this.solo ? 0.5 : 0.8));
        pl.sprite.setScale(c).setPosition(sd.charX, L.pe);
      }
      this.textoPausa.setFontSize(grande).setStroke('#000000', 6 * k).setPosition(W / 2, H / 2).setWordWrapWidth(W * 0.8);
      this.caixa.layout({ cx: L.dialogo.cx, w: L.dialogo.w, base: L.dialogo.base, H, k, fontes: this.fontes, ladoDe: (p) => this.ladoDe(p) });
      this.criarCenario();
    }

    /** Para que lado da caixa fica quem fala (−1 esquerda, 1 direita, 0 centro). */
    ladoDe(pessoa) {
      if (this.solo) return pessoa === this.pl.P1.pers ? -1 : 0;
      if (pessoa === this.pl.P1.pers) return -1;
      if (this.pl.P2 && pessoa === this.pl.P2.pers) return 1;
      return 0;
    }

    /** Gera as camadas do lago (pixel art) para o tamanho atual da tela. */
    criarCenario() {
      const L = this.L, P = L.P, W = L.W, H = L.H;
      const equip = this.solo
        ? [{ tipo: 'caixa', x: W * 0.27, y: H * 0.9 }, { tipo: 'balde', x: W * 0.95, y: H * 0.86 }, { tipo: 'manta', x: W * 0.47, y: L.bankTop + H * 0.075, w: W * 0.09 }]
        : [{ tipo: 'caixa', x: W * 0.17, y: H * 0.91 }, { tipo: 'balde', x: W * 0.83, y: H * 0.88 }, { tipo: 'manta', x: W * 0.445, y: L.bankTop + H * 0.075, w: W * 0.09 }];
      const cen = HF.Cenario.gerar({
        W, H, P, horizonte: L.horizonte, margem: L.bankTop, y22: this.distY(22), y18: this.distY(18), y14: this.distY(14),
        colunas: this.ids.map((id) => L.side[id].bobX),
        personagens: this.ids.map((id) => ({ x: L.side[id].charX, pe: L.pe, larg: 96 * L.c })),
        equipamentos: equip, solo: this.solo
      });
      this.cen = cen;
      const prof = { ceu: -30, ceuPor: -29.9, agua: -25, superficie: -23, margem: -21 };
      this.camadas = this.camadas || {};
      for (const [nome, cam] of Object.entries(cen.camadas)) {
        const chave = 'cen_' + nome;
        if (this.camadas[nome]) this.camadas[nome].destroy();
        if (this.textures.exists(chave)) this.textures.remove(chave);
        const tex = this.textures.addCanvas(chave, cam.tela);
        tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
        this.camadas[nome] = this.add.image(cam.x, cam.y, chave).setOrigin(0, 0).setScale(P).setDepth(prof[nome]);
      }
      this.vida.layout(cen, L);
    }

    /** Distância (m) → altura na água. Quatro lugares com altura própria; mais longe = mais alto. */
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
        if (e.para === S.IDLE) m.idleDesde = now;
        return;
      }
      this.app.audio.onEvent(e);
      const at = () => ({ x: sd.bobX, y: this.distY(p.distance) });
      switch (e.tipo) {
        case 'arremesso': this.contarTutorial('arremessos'); break;
        case 'boia-na-agua':
          this.anel(at(), 0xffffff, 300, 18);
          this.vida.onda(at().x, at().y, 0.8);
          if (p.zona) { m.tagAte = now + 1500; m.tagZona = p.zona; }
          if (p.pontoNaAgua) { m.noPontoAte = now + 1700; this.anel(at(), 0xfff3c4, 700, 40); this.anel(at(), 0xffd23f, 900, 26); }
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
        case 'fisgada': this.contarTutorial('fisgadas'); m.flashAte = now + 200; m.flashCor = 0xffffff; this.anel(at(), 0xffffff, 300, 24); break;
        case 'arrancada': this.anel(at(), 0xbfe3ff, 400, 22); break;
        case 'captura': this.aoCapturar(id, e, p); break;
        case 'linha-rompida':
          m.flashAte = now + 400; m.flashCor = 0xff3b3b; m.partiuEm = now; m.partiuDe = at();
          break;
        case 'fuga': case 'mordida-perdida': this.anel(at(), 0x8899aa, 500, 30); break;
        default: break;
      }
    }

    aoCapturar(id, e, p) {
      const m = this.marcas[id];
      m.flashAte = performance.now() + 500; m.flashCor = 0x3ccf6e;
      this.anel({ x: this.L.side[id].bobX, y: this.L.perto }, 0x3ccf6e, 700, 60);
      this.contarTutorial('capturas');
      const objeto = !!e.objeto;
      const reg = this.app.catalogo.registrar({ id: e.perfil, pesoKg: e.pesoKg, objeto, quem: p.label, regiao: p.regiao, isca: p.iscaNaAgua });
      const def = objeto ? D.objetoPorId[e.perfil] : D.especiePorId[e.perfil];
      let grande = false;
      if (!objeto && def) {
        const lim = def.pesoKg[0] + 0.75 * (def.pesoKg[1] - def.pesoKg[0]);
        grande = e.pesoKg >= lim || e.pesoKg >= 4;
      }
      m.cartao = { objeto, id: e.perfil, nome: def ? def.nome : e.peixe, kg: e.pesoKg, novo: reg.novo, recorde: reg.recorde, grande, zona: p.zona, isca: p.iscaNaAgua };
      if (reg.novo && !objeto) this.novasEspecies.push(def.nome);
      if (reg.recorde && !objeto) this.recordes.push(def.nome);
      this.narrador.evento(e, this.session.players, { novo: reg.novo && !objeto, recorde: reg.recorde && !objeto });
    }

    /** Pontos de interesse (o ponto que surge pode render um comentário; o acerto vem pelo pouso da boia). */
    aoPonto(ev) {
      if (ev.tipo === 'ponto-surgiu' && this.narrador.eventoMundo) this.narrador.eventoMundo({ tipo: 'ponto-surgiu', ponto: ev.ponto.tipo, zona: ev.ponto.zona }, this.session.players);
    }

    /** Eventos do lago (peixe saltando, cardume, chuva, entardecer...): só comentários e balbucios. */
    aoEventoDoLago(ev) {
      if (this.narrador.eventoMundo) this.narrador.eventoMundo(ev, this.session.players);
    }

    contarTutorial(chave) {
      if (this.tut[chave] >= DICAS_ATE) return;
      this.tut[chave]++;
      this.app.arm.gravar(TUTORIAL, this.tut);
    }

    anel(pos, color, dur, radius) {
      this.efeitos.push({ x: pos.x, y: pos.y, color, dur, radius: radius * this.app.dpr, t0: performance.now() });
    }

    // ================================================================= quadro a quadro
    contextoDoLago() {
      const pts = [], ponto = this.session.jogo.regioes ? this.session.pontos.ativo() : null;
      if (ponto) {
        const vida = this.session.pontos.vida(), resta = ponto.fim - this.session.pontos.t;
        const alfa = Math.min(1, (this.session.pontos.t - ponto.inicio) / 900, resta / 2500);
        for (const id of this.ids) pts.push({ x: this.L.side[id].bobX, y: this.distY(ponto.distancia), tipo: ponto.tipo, alfa: Math.max(0, alfa), fase: ponto.id * 0.37, vida });
      }
      const boias = this.ids.map((id) => {
        const p = this.session.players[id];
        return { id, x: this.L.side[id].bobX, y: this.distY(p.distance), esperando: p.state === S.WAITING };
      });
      const n = this.narrador;
      return { pontos: pts, boias, sirius: { estado: n.sirius.estado, falando: n.falandoAgora() === 'sirius' } };
    }

    update() {
      const now = performance.now();
      const pointers = this.input.manager.pointers;
      this.router.reconcile((key) => { const pt = pointers[key]; return !!(pt && pt.isDown); }, now);
      if (!this.bloqueado()) this.session.update(now);
      const dtBruto = this.ultimoAgora == null ? 0 : Math.min(HF.FishingPlayer.MAX_CATCH_UP_MS, now - this.ultimoAgora);
      this.ultimoAgora = now;
      this.dtBruto = dtBruto;
      this.dt = this.bloqueado() ? 0 : dtBruto;
      // narrativa: relógio de jogo (para na pausa) e sons do Sirius / vozes
      this.narrador.atualizar(this.dt, this.session.players);
      for (const som of this.narrador.tirarSons()) this.app.audio.narrativa(som);

      const snaps = {};
      for (const id of this.ids) snaps[id] = this.session.players[id].snapshot(now);
      this.gMundo.clear(); this.gEfeitos.clear(); this.gUi.clear();
      this.vida.atualizar(this.dt, now, this.contextoDoLago());
      if (this.camadas && this.camadas.ceuPor) this.camadas.ceuPor.setAlpha(this.vida.luz);
      this.desenharBordas(now, snaps);
      for (const id of this.ids) this.desenharJogador(id, snaps[id], now);
      this.desenharEfeitos(now);
      this.caixa.atualizar(this.narrador);
      this.dlgRect = this.caixa.rect;
      this.desenharPausa();
      if (!this.bloqueado()) for (const id of this.ids) if (snaps[id].zone) this.app.audio.warn(id, snaps[id].zone, now);
      this.app.aoQuadro && this.app.aoQuadro(this, snaps);
    }

    /** Brilho na borda da metade: mordida (pisca), perigo de arrebentar e linha frouxa (discreto). */
    desenharBordas(now, snaps) {
      const L = this.L, k = L.k;
      for (const id of this.ids) {
        const m = this.marcas[id], sd = L.side[id], s = snaps[id];
        const x0 = sd.x0 + 4 * k, w = sd.x1 - sd.x0 - 8 * k;
        if (m.flashAte && now < m.flashAte) {
          const blink = s.state === S.BITE ? (Math.floor(now / 120) % 2 ? 1 : 0.45) : 1;
          this.gUi.lineStyle(7 * k, m.flashCor, 0.85 * blink).strokeRect(x0, 4 * k, w, L.H - 8 * k);
        } else if (s.zone === 'critica') {
          this.gUi.lineStyle(7 * k, ZONAS.critica, 0.3 + 0.3 * Math.sin(now / 60)).strokeRect(x0, 4 * k, w, L.H - 8 * k);
        } else if (s.zone === 'frouxa') {
          this.gUi.lineStyle(5 * k, ZONAS.frouxa, 0.22 + 0.18 * Math.sin(now / 150)).strokeRect(x0, 4 * k, w, L.H - 8 * k);
        }
      }
      // divisória discreta entre as metades (cada um tem sua água)
      if (!this.solo) {
        const g = this.gUi, x = Math.round(L.W / 2);
        g.lineStyle(Math.max(1, k), 0xffffff, 0.16);
        for (let y = L.horizonte; y < L.bankTop; y += 14 * k) g.lineBetween(x, y, x, Math.min(L.bankTop, y + 6 * k));
      }
    }

    // ---------------------------------------------------------------- jogador
    desenharJogador(id, s, now) {
      const g = this.gMundo, L = this.L, sd = L.side[id], t = this.tx[id], pl = this.pl[id], cfg = this.session.config;
      const m = this.marcas[id], k = L.k, c = L.c;

      this.desenharPlaca(id, s);

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
      t.bang.setVisible(false); t.dist.setVisible(false); t.toque.setVisible(false);
      const bob = { x: sd.bobX, y: this.distY(s.distance) };
      const r = Math.max(7 * k, L.H * 0.022);
      switch (s.state) {
        case S.CHARGING: {
          const d = cfg.castMinDistance + (cfg.castMaxDistance - cfg.castMinDistance) * s.chargePower;
          const ty = this.distY(d);
          const zona = s.regioesAtivas ? D.zonaDaDistancia(d) : null;
          const cor = zona ? ZONA_COR[zona] : 0xffffff;
          g.lineStyle(2 * k, cor, 0.9).strokeCircle(sd.bobX, ty, 12 * k);
          g.lineStyle(2 * k, cor, 0.5).lineBetween(sd.bobX - 22 * k, ty, sd.bobX + 22 * k, ty);
          if (zona) t.regiao.setText(D.zonaPorId[zona].curta).setColor(css(cor)).setPosition(sd.bobX, ty + 14 * k).setVisible(true).setAlpha(1);
          this.desenharForca(id, s, zona);
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
          this.boia(g, bob.x, y, pl.cores, 1, r, s.ponto ? 'ponto' : null);
          t.dist.setText(Math.round(s.distance) + ' m').setPosition(bob.x, y + r + 3 * k).setAlpha(0.75).setVisible(true);
          break;
        }
        case S.BITE: {
          const y = bob.y + 7 * k + Math.sin(now / 40) * 2 * k;
          this.linha(g, tip, { x: bob.x, y }, 0.05, 0xffffff, 2 * k);
          this.boia(g, bob.x, y, pl.cores, 0.55, r, null);
          t.bang.setText('!').setPosition(bob.x, y - r - 6 * k).setVisible(true);
          t.toque.setText('TOQUE!').setColor(Math.floor(now / 120) % 2 ? '#ffffff' : pl.cores.css).setPosition(bob.x, y + r + 12 * k).setVisible(true);
          const u = s.biteLeftMs / s.biteWindowMs, ww = 60 * k;
          g.fillStyle(0xffffff, 0.9).fillRect(bob.x - ww / 2, y + r + 6 * k, ww * u, 4 * k);
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
        const noPonto = m.noPontoAte && now < m.noPontoAte && s.state === S.WAITING;
        const mostrar = m.tagAte && now < m.tagAte && s.state === S.WAITING && s.zona;
        if (noPonto) {
          t.regiao.setText('NO PONTO! ✦').setColor('#ffe08a').setPosition(bob.x, bob.y + r + 16 * k).setAlpha(Math.min(1, (m.noPontoAte - now) / 400)).setVisible(true);
        } else if (mostrar) {
          const cor = ZONA_COR[s.zona];
          t.regiao.setText(D.zonaPorId[s.zona].curta).setColor(css(cor)).setPosition(bob.x, bob.y + r + 16 * k).setAlpha(Math.min(1, (m.tagAte - now) / 400)).setVisible(true);
        } else t.regiao.setVisible(false);
      }

      if (m.avisoAte && now < m.avisoAte && !s.paused) t.aviso.setText(m.avisoTexto).setAlpha(Math.min(1, (m.avisoAte - now) / 300)).setVisible(true);
      else t.aviso.setVisible(false);

      this.desenharMedidor(s, id, now);
      this.desenharDica(id, s, now);
      this.desenharCartao(id, s);
    }

    /** Placa compacta no canto: nome, peixes, maior, peso total e a isca (ícone + nome). */
    desenharPlaca(id, s) {
      const t = this.tx[id], pl = this.pl[id], L = this.L, k = L.k, g = this.gUi;
      const st = s.stats, isca = D.iscaPorId[s.isca];
      t.hud.setText(this.session.players[id].label + '   ' + st.capturas + (st.capturas === 1 ? ' peixe' : ' peixes') + (st.capturas ? '   ★ ' + kg(st.maiorPesoKg) : ''))
        .setColor(pl.cores.css);
      t.hud2.setText(isca.curto + (st.capturas ? '    total ' + kg(st.pesoTotalKg) : ''));
      const tex = this.textures.get('isca_' + s.isca).getSourceImage();
      const ihs = Math.round(t.hud2.height * 1.25);
      if (pl.iscaHud.texture.key !== 'isca_' + s.isca) pl.iscaHud.setTexture('isca_' + s.isca);
      pl.iscaHud.setDisplaySize(ihs * Math.min(1, tex.width / tex.height), ihs * Math.min(1, tex.height / tex.width));
      const pad = 7 * k, larg = Math.max(t.hud.width, ihs + 5 * k + t.hud2.width) + pad * 2;
      const alt = t.hud.height + t.hud2.height + pad * 1.6;
      const x0 = id === 'P1' ? 8 * k : L.W - 8 * k - L.reservaPausa - larg;
      const y0 = 6 * k;
      g.fillStyle(0x0b1630, 0.62).fillRect(x0, y0, larg, alt);
      g.lineStyle(2 * k, pl.cores.main, 0.9).strokeRect(x0, y0, larg, alt);
      g.lineStyle(1 * k, 0x000000, 0.5).strokeRect(x0 + 3 * k, y0 + 3 * k, larg - 6 * k, alt - 6 * k);
      t.hud.setPosition(x0 + pad, y0 + pad * 0.6);
      pl.iscaHud.setPosition(x0 + pad + ihs / 2, y0 + pad * 0.6 + t.hud.height + t.hud2.height / 2 + 1 * k);
      t.hud2.setPosition(x0 + pad + ihs + 5 * k, y0 + pad * 0.6 + t.hud.height);
      this.placaRect = this.placaRect || {};
      this.placaRect[id] = { x: x0, y: y0, w: larg, h: alt };
    }

    /** Medidor de força acima da cabeça, com as cores dos lugares do lago. */
    desenharForca(id, s, zona) {
      const g = this.gMundo, L = this.L, sd = L.side[id], k = L.k, pl = this.pl[id];
      const bw = (sd.x1 - sd.x0) * (this.solo ? 0.2 : 0.34), bh = Math.max(9 * k, L.H * 0.028);
      const bx = Math.max(sd.x0 + 6 * k, Math.min(sd.x1 - bw - 6 * k, sd.charX - bw / 2)), by = L.pe - 74 * L.c - bh - 6 * k;
      g.fillStyle(0x0b1630, 0.75).fillRect(bx - 3 * k, by - 3 * k, bw + 6 * k, bh + 6 * k);
      if (s.regioesAtivas) {
        // faixas proporcionais às distâncias (6 → 30 m)
        const cfg = this.session.config, span = cfg.castMaxDistance - cfg.castMinDistance;
        let x = bx;
        for (const z of D.ZONAS) {
          const a = Math.max(cfg.castMinDistance, z.de), b = Math.min(cfg.castMaxDistance, z.ate);
          if (b <= a) continue;
          const w = bw * (b - a) / span;
          g.fillStyle(ZONA_COR[z.id], 0.28).fillRect(x, by, w, bh);
          x += w;
        }
      }
      g.fillStyle(zona ? ZONA_COR[zona] : pl.cores.light, 1).fillRect(bx, by, bw * s.chargePower, bh);
      g.lineStyle(2 * k, 0xfff1c9, 0.9).strokeRect(bx - 3 * k, by - 3 * k, bw + 6 * k, bh + 6 * k);
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

    /** Boia em pixel art (metade de cima na cor do jogador), com antena; 'ponto' = brilho dourado. */
    boia(g, x, y, cores, alpha, r, marca) {
      const P = this.L.P, k = this.L.k;
      const ra = Math.max(2, Math.round(r / P)), cx = Math.round(x / P) * P, cy = Math.round(y / P) * P;
      if (marca === 'ponto') g.lineStyle(2 * k, 0xffd23f, 0.85 * alpha).strokeCircle(cx, cy, r + 5 * k);
      for (let j = -ra; j <= ra; j++) {
        const meia = Math.floor(Math.sqrt(Math.max(0, ra * ra - j * j)));
        g.fillStyle(j < 0 ? cores.main : 0xffffff, alpha).fillRect(cx - meia * P, cy + j * P, (meia * 2 + 1) * P, P);
      }
      g.fillStyle(0x000000, 0.35 * alpha).fillRect(cx - ra * P, cy, (ra * 2 + 1) * P, Math.max(1, P / 2));
      g.fillStyle(0xffffff, 0.6 * alpha).fillRect(cx - Math.round(ra / 2) * P, cy - Math.round(ra * 0.6) * P, P, P);
      g.fillStyle(0xffffff, alpha).fillRect(cx, cy - (ra + 3) * P, P, 3 * P);
      g.fillStyle(cores.light, alpha).fillRect(cx, cy - (ra + 4) * P, P, P);
      g.lineStyle(Math.max(1, P / 2), 0xffffff, 0.25 * alpha).strokeEllipse(cx, cy + ra * P, (ra * 4) * P, ra * P);
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
      g.fillStyle(0x08131c, 0.85).fillEllipse(fx, fy + 4 * k, w, h);
      g.lineStyle(2 * k, 0xbfe3ff, 0.45).strokeEllipse(fx, fy + 4 * k, w, h);
      const td = Math.sin(now / (run ? 110 : 380)) > 0 ? -1 : 1;
      g.fillStyle(0x08131c, 0.85).fillTriangle(fx + td * w / 2, fy + 4 * k, fx + td * (w / 2 + h * 0.8), fy + 4 * k - h / 2, fx + td * (w / 2 + h * 0.8), fy + 4 * k + h / 2);
      if (run && Math.floor(now / 140) % 2 === 0) g.lineStyle(2 * k, 0xffffff, 0.6).strokeCircle(fx, fy, w * 0.6);
      if (run && Math.random() < 0.15) this.vida.onda(fx, fy, 0.5);
      this.tx[id].dist.setText(Math.max(0, Math.round(s.distance)) + ' m').setPosition(fx, fy + h + 3 * k).setAlpha(0.75).setVisible(true);
    }

    /**
     * Medidor de tensão compacto, ao lado do pescador, que aparece só na briga:
     * as quatro zonas, o ponteiro e os dois riscos (arrebentar em cima, escapar embaixo).
     */
    desenharMedidor(s, id, now) {
      const g = this.gUi, L = this.L, sd = L.side[id], cfg = this.session.config, k = L.k, m = this.marcas[id], t = this.tx[id];
      const ativo = s.state === S.FIGHTING;
      m.medAlfa = Math.max(0, Math.min(1, (m.medAlfa || 0) + (ativo ? 1 : -1) * (this.dtBruto || 16) / 180));
      const a = m.medAlfa;
      this.medidorRect = this.medidorRect || {};
      if (a <= 0.01) { t.alerta.setVisible(false); this.medidorRect[id] = null; return; }
      const w = L.medW, x = Math.round(sd.medX - w / 2), top = L.medTop, bottom = L.medBase, h = bottom - top;
      const yOf = (v) => bottom - v * h;
      g.fillStyle(0x0b1630, 0.78 * a).fillRect(x - 4 * k, top - 4 * k, w + 8 * k, h + 8 * k);
      const bands = [[0, cfg.slackMax, 'frouxa'], [cfg.slackMax, cfg.alertMin, 'segura'], [cfg.alertMin, cfg.criticalMin, 'alerta'], [cfg.criticalMin, 1, 'critica']];
      for (const [b0, b1, z] of bands) g.fillStyle(ZONAS[z], (ativo && s.zone === z ? 0.95 : 0.4) * a).fillRect(x, yOf(b1), w, yOf(b0) - yOf(b1));
      g.lineStyle(2 * k, 0xfff1c9, 0.85 * a).strokeRect(x - 4 * k, top - 4 * k, w + 8 * k, h + 8 * k);
      this.medidorRect[id] = { x: x - 4 * k, y: top - 4 * k, w: w + 8 * k, h: h + 8 * k };
      if (!ativo) { t.alerta.setVisible(false); return; }
      // ponteiro (aponta para dentro da tela) e riscos (do lado de fora)
      const dentro = sd.medX < sd.charX ? 1 : -1;
      const my = yOf(s.tension);
      g.fillStyle(0xffffff, a).fillRect(x - 4 * k, my - 2 * k, w + 8 * k, 4 * k);
      const px = dentro > 0 ? x + w + 4 * k : x - 4 * k;
      g.fillTriangle(px, my - 6 * k, px, my + 6 * k, px + dentro * 9 * k, my);
      const rx = dentro > 0 ? x - 10 * k : x + w + 6 * k, rw = 4 * k;
      const kc = Math.min(1, s.criticalMs / cfg.criticalBreakMs), ks = Math.min(1, s.slackMs / cfg.slackEscapeMs);
      g.fillStyle(0x000000, 0.45 * a).fillRect(rx, top, rw, h);
      if (kc > 0) g.fillStyle(ZONAS.critica, a).fillRect(rx, top, rw, h / 2 * kc);
      if (ks > 0) g.fillStyle(ZONAS.frouxa, a).fillRect(rx, bottom - h / 2 * ks, rw, h / 2 * ks);
      // aviso curto (sempre, também depois do tutorial)
      const avisos = { critica: ['SOLTE!', '#ff6b6b'], frouxa: ['SEGURE!', '#8cc8ff'], alerta: ['CUIDADO', '#ffc46b'] };
      const av = avisos[s.zone];
      if (av) t.alerta.setText(av[0]).setColor(av[1]).setPosition(sd.medX, top - 8 * k).setAlpha(a).setVisible(true);
      else t.alerta.setVisible(false);
    }

    /** Dicas do tutorial: curtas, na metade de cada jogador, somem depois de 3 acertos de cada etapa (GDD S8). */
    desenharDica(id, s, now) {
      const t = this.tx[id].tutorial, m = this.marcas[id], tut = this.tut, L = this.L, k = L.k, sd = L.side[id];
      const ligadas = this.app.opcoes.get('dicas') !== false;
      let texto = '';
      if (ligadas && !(s.state === S.CAUGHT || s.state === S.ESCAPED || s.state === S.LINE_BROKEN)) {
        switch (s.state) {
          case S.IDLE:
            if (tut.arremessos < DICAS_ATE || (m.idleDesde && now - m.idleDesde > 12000)) texto = 'SEGURE para carregar · SOLTE para arremessar';
            break;
          case S.CHARGING: if (tut.arremessos < DICAS_ATE) texto = 'Solte na força certa: a cor mostra o lugar'; break;
          case S.WAITING: if (tut.fisgadas < DICAS_ATE) texto = 'Espere a boia AFUNDAR… (segure para recolher)'; break;
          case S.REELING_EMPTY: if (tut.fisgadas < DICAS_ATE) texto = 'Recolhendo a linha… solte para parar'; break;
          case S.FIGHTING: if (tut.capturas < DICAS_ATE) texto = 'SEGURE puxa · SOLTE alivia'; break;
          default: break;
        }
      }
      if (texto) m.dicaTexto = texto;
      m.dicaAlfa = Math.max(0, Math.min(1, (m.dicaAlfa || 0) + (texto ? 1 : -1) * (this.dtBruto || 16) / 250));
      if (m.dicaAlfa <= 0.01 || !m.dicaTexto) { t.setVisible(false); this.dicaRect && (this.dicaRect[id] = null); return; }
      // logo abaixo da placa do canto (nunca por cima dela)
      const placa = this.placaRect && this.placaRect[id];
      t.setText(m.dicaTexto);
      const pw = t.width + 18 * k, ph = t.height + 8 * k;
      const y = Math.max(L.dicaY, (placa ? placa.y + placa.h : L.hudH) + 6 * k + ph / 2);
      const x = Math.max(sd.x0 + pw / 2 + 6 * k, Math.min(sd.x1 - pw / 2 - 6 * k, sd.cx));
      t.setPosition(x, y).setAlpha(m.dicaAlfa).setVisible(true);
      const g = this.gUi;
      g.fillStyle(0x0b1630, 0.6 * m.dicaAlfa).fillRect(x - pw / 2, y - ph / 2, pw, ph);
      g.lineStyle(1.5 * k, 0xfff1c9, 0.35 * m.dicaAlfa).strokeRect(x - pw / 2, y - ph / 2, pw, ph);
      this.dicaRect = this.dicaRect || {};
      this.dicaRect[id] = { x: x - pw / 2, y: y - ph / 2, w: pw, h: ph };
    }

    /** Cartão de resultado no alto da metade do jogador: nunca cobre o personagem nem a caixa de diálogo. */
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
      let titulo, sub, fita, corTitulo = '#ffffff';
      t.dica.setText(s.msInState >= cfg.resultSkipAfterMs ? 'toque e segure para arremessar de novo' : '').setPosition(cx, top + ch - 6 * k).setAlpha(pop);
      if (s.state === S.CAUGHT && m.cartao) {
        const c = m.cartao;
        titulo = c.objeto ? 'OBJETO ESTRANHO!' : (c.grande ? 'PEIXÃO!' : 'PEGOU!');
        fita = c.objeto ? 0x9a6534 : c.grande ? 0xc9962f : 0x2f9a58;
        const onde = c.zona ? D.zonaPorId[c.zona].nome + ' · ' : '';
        const curto = D.iscaPorId[c.isca].curto;                  // "Coração" em vez de "Coração de galinha"
        sub = c.nome + ' · ' + kg(c.kg) + '\n' + onde + curto.charAt(0) + curto.slice(1).toLowerCase();
        const selo = c.objeto ? '' : c.novo ? '★ NOVA ESPÉCIE ★' : c.recorde ? '★ RECORDE ★' : '';
        if (selo) t.selo.setText(selo).setPosition(cx, top + ch * 0.27).setAlpha(pop).setVisible(true);
        const chave = (c.objeto ? 'objeto_' : 'peixe_') + c.id;
        const img = pl.imgCartao;
        if (img.texture.key !== chave) img.setTexture(chave);
        const src = this.textures.get(chave).getSourceImage();
        const mw = cw * (c.objeto ? 0.3 : 0.38 + 0.22 * Math.min(1, c.kg / 7)), mh = ch * 0.27;
        const esc = Math.min(mw / src.width, mh / src.height);
        img.setDisplaySize(src.width * esc, src.height * esc).setPosition(cx, top + ch * 0.47).setAlpha(pop).setVisible(true).setFlipX(id === 'P2' && !this.solo);
      } else if (s.state === S.LINE_BROKEN) {
        titulo = 'LINHA ROMPEU!'; fita = 0xc8282e;
        sub = 'Ficou no vermelho tempo demais.\nSolte quando a tensão subir.';
      } else if (r.motivo === 'sem-reacao') {
        titulo = 'ESCAPOU!'; fita = 0x5b6b7c;
        sub = 'Não deu tempo de fisgar.\nToque logo que a boia afundar.';
      } else {
        titulo = 'ESCAPOU!'; fita = 0x2f6fb0;
        sub = 'A linha ficou frouxa demais.\nSegure para manter a linha esticada.';
      }
      // placa: corpo escuro com borda creme + fita colorida com o título (pontas recortadas)
      const fy = top, fh = Math.round(ch * 0.17), corpoY = top + fh * 0.5;
      g.fillStyle(0x000000, 0.3 * pop).fillRect(cx - cw / 2 + 4 * k, corpoY + 5 * k, cw, ch - fh * 0.5);
      g.fillStyle(0x0b1630, 0.92 * pop).fillRect(cx - cw / 2, corpoY, cw, ch - fh * 0.5);
      g.lineStyle(2 * k, 0xfff1c9, 0.9 * pop).strokeRect(cx - cw / 2, corpoY, cw, ch - fh * 0.5);
      g.lineStyle(1 * k, 0x000000, 0.6 * pop).strokeRect(cx - cw / 2 + 4 * k, corpoY + 4 * k, cw - 8 * k, ch - fh * 0.5 - 8 * k);
      const fw = cw * 0.9, fx0 = cx - fw / 2;
      g.fillStyle(Phaser.Display.Color.ValueToColor(fita).darken(25).color, pop).fillRect(fx0 - fh * 0.35, fy + fh * 0.18, fh * 0.6, fh * 0.82);
      g.fillStyle(Phaser.Display.Color.ValueToColor(fita).darken(25).color, pop).fillRect(fx0 + fw - fh * 0.25, fy + fh * 0.18, fh * 0.6, fh * 0.82);
      g.fillStyle(0x0b1630, pop).fillTriangle(fx0 - fh * 0.35, fy + fh * 0.18, fx0 - fh * 0.05, fy + fh * 0.59, fx0 - fh * 0.35, fy + fh);
      g.fillStyle(0x0b1630, pop).fillTriangle(fx0 + fw + fh * 0.35, fy + fh * 0.18, fx0 + fw + fh * 0.05, fy + fh * 0.59, fx0 + fw + fh * 0.35, fy + fh);
      g.fillStyle(fita, pop).fillRect(fx0, fy, fw, fh);
      g.lineStyle(1 * k, 0xffffff, 0.35 * pop).lineBetween(fx0, fy + 2 * k, fx0 + fw, fy + 2 * k);
      t.titulo.setScale(1).setText(titulo).setColor(corTitulo).setPosition(cx, fy + fh / 2).setAlpha(pop);
      if (t.titulo.height > fh * 1.05) t.titulo.setScale(fh * 1.05 / t.titulo.height);
      if (t.titulo.displayWidth > fw * 0.94) t.titulo.setScale(Math.min(t.titulo.scaleX, fw * 0.94 / t.titulo.width));
      const temImg = s.state === S.CAUGHT && m.cartao;
      t.sub.setScale(1).setText(sub).setPosition(cx, top + ch * (temImg ? 0.63 : 0.32)).setAlpha(pop);
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
  CenaPartida.ZONA_COR = ZONA_COR;
  root.HF.CenaPartida = CenaPartida;
})(window);
