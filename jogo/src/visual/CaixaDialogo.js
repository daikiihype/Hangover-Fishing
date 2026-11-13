/*
 * Hangover Fishing — Operação Nova Identidade
 * CaixaDialogo: a apresentação das falas, na linguagem do Hangover Accident.
 *
 *   - UM retrato por vez, quadrado, com moldura na cor de quem fala; nome colorido; texto
 *     aparecendo letra a letra (relógio da narrativa: congela na pausa);
 *   - caixa escura translúcida com borda branca dupla, no centro de baixo (sobre a margem,
 *     entre os pescadores): não cobre a água, as boias nem os cartões;
 *   - entrada: sobe e aparece; saída: some suave; troca de quem fala: o retrato "pula";
 *   - fala gritada (toda em MAIÚSCULAS) faz a caixa tremer; o choro do Sirius treme sempre;
 *   - estilos próprios do Sirius: balbucio (azul-claro, letras grandes) e choro (rosado, lágrimas).
 *
 * Só desenha o que o Narrador decide: não toca na pescaria.
 */
(function (root) {
  'use strict';

  const HF = root.HF;
  const FONTE = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';
  const COR = {
    alemao: { nome: '#ff7b7b', moldura: 0xd23c3c, fundoRetrato: 0x3a1d24 },
    ale: { nome: '#ffd23f', moldura: 0xd8b21f, fundoRetrato: 0x3a3418 },
    maria: { nome: '#ff9fd0', moldura: 0xe56aa6, fundoRetrato: 0x3a1d33 },
    sirius: { nome: '#9fd0ff', moldura: 0x5aa0e6, fundoRetrato: 0xbfe3ff }
  };
  const ESTILO = {
    fala: { texto: '#ffffff', fundo: 0x070b16, borda: 0xffffff },
    balbucio: { texto: '#bfe3ff', fundo: 0x0b1a33, borda: 0xbfe3ff },
    choro: { texto: '#ffc0cc', fundo: 0x2a0f1a, borda: 0xffc0cc }
  };
  const ENTRADA_MS = 170, SAIDA_MS = 230, PULO_MS = 140, GRITO_MS = 320;

  function ehGrito(t) { return /[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{3}/.test(t) && t === t.toUpperCase(); }

  class CaixaDialogo {
    constructor(cena) {
      this.cena = cena;
      this.g = cena.add.graphics().setDepth(8);
      const txt = (estilo) => cena.add.text(0, 0, '', Object.assign({ fontFamily: FONTE, color: '#ffffff' }, estilo)).setDepth(9).setVisible(false);
      this.nome = txt({ fontStyle: 'bold' }).setOrigin(0, 0);
      this.texto = txt({}).setOrigin(0, 0);
      this.retrato = cena.add.image(0, 0, 'rosto_alemao_serio').setDepth(9).setVisible(false);
      this.linha = null;          // fala mostrada (continua na tela entre as falas da mesma cena)
      this.alfa = 0;
      this.entrouEm = -Infinity;
      this.mudouEm = -Infinity;
      this.saindoDesde = null;
      this.rect = null;
    }

    /** geo = { cx, w, base, k, fontes: { pequeno } } (pixels do aparelho). */
    layout(geo) {
      this.geo = geo;
      const k = geo.k, f = geo.fontes;
      this.ret = Math.round(Math.max(40 * k, Math.min(geo.H * 0.17, 66 * k)));
      this.pad = Math.round(8 * k);
      this.borda = Math.max(2, Math.round(2 * k));
      this.nome.setFontSize(Math.round(f.pequeno * 0.95)).setStroke('#000000', 3 * k);
      this.fonteTexto = Math.round(f.pequeno * 1.12);
      this.texto.setFontSize(this.fonteTexto).setWordWrapWidth(geo.w - this.ret - this.pad * 4).setLineSpacing(2 * k);
      this.linha = null;
    }

    _aplicarLinha(l, n) {
      const est = ESTILO[l.estilo] || ESTILO.fala, cor = COR[l.pessoa] || COR.alemao;
      const sufixo = l.estilo === 'choro' ? '  (chorando)' : l.estilo === 'balbucio' ? '  (balbuciando)' : '';
      this.nome.setText(l.nome + sufixo).setColor(cor.nome);
      this.retrato.setTexture(HF.Recortes.rosto(l.pessoa, l.emo));
      const balb = l.estilo !== 'fala';
      this.texto.setFontSize(Math.round(this.fonteTexto * (balb ? 1.45 : 1))).setFontStyle(balb ? 'bold' : 'normal').setColor(est.texto);
      this.texto.setText(l.texto);
      this.hTexto = this.texto.height;                 // altura final: a caixa não pula enquanto o texto aparece
      this.grito = l.estilo === 'fala' && ehGrito(l.texto);
      this.linha = l;
    }

    /** Desenha a fala atual do Narrador (chamar a cada quadro). */
    atualizar(n) {
      const g = this.g, geo = this.geo;
      g.clear();
      if (!geo) return;
      const linha = n.linha(), ativo = !!n.atual, t = n.t;
      if (linha && linha !== this.linha) {
        const vazia = this.alfa < 0.05 || this.saindoDesde != null || !this.linha;
        this._aplicarLinha(linha, n);
        if (vazia) this.entrouEm = t; else this.mudouEm = t;
        this.saindoDesde = null;
      }
      // entrada, saída
      if (ativo && this.linha) {
        this.saindoDesde = null;
        this.alfa = Math.min(1, (t - this.entrouEm) / ENTRADA_MS);
      } else if (this.linha) {
        if (this.saindoDesde == null) this.saindoDesde = t;
        this.alfa = Math.max(0, 1 - (t - this.saindoDesde) / SAIDA_MS);
        if (this.alfa <= 0) this.linha = null;
      }
      const vis = !!this.linha && this.alfa > 0.01;
      this.nome.setVisible(vis); this.texto.setVisible(vis); this.retrato.setVisible(vis);
      this.rect = null;
      if (!vis) return;
      const l = this.linha, est = ESTILO[l.estilo] || ESTILO.fala, cor = COR[l.pessoa] || COR.alemao;
      const k = geo.k, pad = this.pad, ret = this.ret, b = this.borda;
      // máquina de escrever (adultos); balbucio aparece de uma vez
      const mostra = l.estilo === 'fala' ? Math.min(l.texto.length, Math.ceil((t - l.inicio) / Math.max(1, l.revelarMs) * l.texto.length)) : l.texto.length;
      this.texto.setText(l.texto.slice(0, Math.max(1, mostra)));
      const w = geo.w, h = Math.round(Math.max(ret + pad * 2, this.nome.height + this.hTexto + pad * 2.6));
      const ease = 1 - Math.pow(1 - this.alfa, 3);
      const sobe = (1 - ease) * 12 * k;
      const pulo = Math.max(0, 1 - (t - this.mudouEm) / PULO_MS);
      let x = Math.round(geo.cx - w / 2);
      const y = Math.round(geo.base - h + sobe);
      if (this.grito) { const u = Math.min(1, (t - Math.max(this.entrouEm, this.mudouEm)) / GRITO_MS); if (u < 1) x += Math.round(Math.sin(t / 18) * 4 * k * (1 - u)); }
      if (l.estilo === 'choro') x += Math.round(Math.sin(t / 26) * 2 * k);
      const a = this.alfa;
      // sombra, fundo e borda dupla (branca por fora, preta por dentro)
      g.fillStyle(0x000000, 0.35 * a).fillRect(x + 3 * k, y + 4 * k, w, h);
      g.fillStyle(est.fundo, 0.88 * a).fillRect(x, y, w, h);
      g.lineStyle(b, est.borda, 0.95 * a).strokeRect(x + b / 2, y + b / 2, w - b, h - b);
      g.lineStyle(Math.max(1, b / 2), 0x000000, 0.9 * a).strokeRect(x + b * 1.5, y + b * 1.5, w - b * 3, h - b * 3);
      // indicador de quem fala: ponta no alto, para o lado do pescador (família e quem assiste: centro)
      const lado = geo.ladoDe ? geo.ladoDe(l.pessoa) : 0;
      const px = lado < 0 ? x + w * 0.14 : lado > 0 ? x + w * 0.86 : x + w / 2;
      g.fillStyle(est.borda, 0.95 * a).fillTriangle(px - 7 * k, y + 1, px + 7 * k, y + 1, px + lado * 4 * k, y - 8 * k);
      g.fillStyle(est.fundo, 0.95 * a).fillTriangle(px - 4 * k, y + b + 1, px + 4 * k, y + b + 1, px + lado * 2 * k, y - 4 * k);
      // retrato com moldura na cor do personagem
      const rs = ret * (1 + 0.08 * pulo);
      const rx = x + pad + ret / 2, ry = y + h / 2;
      g.fillStyle(cor.moldura, a).fillRect(rx - rs / 2 - b * 1.5, ry - rs / 2 - b * 1.5, rs + b * 3, rs + b * 3);
      g.fillStyle(cor.fundoRetrato, a).fillRect(rx - rs / 2, ry - rs / 2, rs, rs);
      const src = this.cena.textures.get(this.retrato.texture.key).getSourceImage();
      const esc = rs / Math.max(src.width, src.height);
      this.retrato.setDisplaySize(src.width * esc, src.height * esc)
        .setPosition(rx, ry + (l.estilo === 'balbucio' ? Math.sin(t / 90) * 1.5 * k : 0)).setAlpha(a);
      if (l.estilo === 'choro') {                                   // lágrimas em pixel
        for (let i = 0; i < 3; i++) {
          const u = ((t / 420) + i / 3) % 1;
          g.fillStyle(0x6ec1ff, a * (1 - u)).fillRect(rx - rs * 0.25 + i * rs * 0.22, ry - rs * 0.05 + u * rs * 0.5, 2 * k, 3 * k);
        }
      }
      const tx0 = x + pad * 2 + ret + b * 2;
      this.nome.setPosition(tx0, y + pad * 0.9).setAlpha(a);
      this.texto.setPosition(tx0, y + pad * 0.9 + this.nome.height + 2 * k + (l.estilo === 'balbucio' ? Math.sin(t / 110) * 2 * k : 0)).setAlpha(a);
      this.rect = { x, y: y - 8 * k, w, h: h + 8 * k };
    }

    /** Esconde na hora (recomeçar a partida). */
    limpar() { this.linha = null; this.alfa = 0; this.saindoDesde = null; this.g.clear(); this.nome.setVisible(false); this.texto.setVisible(false); this.retrato.setVisible(false); this.rect = null; }
  }

  CaixaDialogo.COR = COR;
  root.HF.CaixaDialogo = CaixaDialogo;
})(window);
