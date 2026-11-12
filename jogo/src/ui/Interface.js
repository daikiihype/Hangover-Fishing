/*
 * Hangover Fishing — versão jogável
 * Interface: as telas verticais (DOM) — menu, preparação, catálogo e guia, opções,
 * "gire o aparelho", pausa e resumo. Cada botão chama o aplicativo (main.js).
 */
(function (root) {
  'use strict';

  const HF = root.HF;
  const D = HF.DadosPesca;
  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));
  const NOMES = { alemao: 'ALEMÃO', ale: 'ALE' };
  const ESTRELAS_RARIDADE = { comum: 1, incomum: 2, rara: 3, 'muito rara': 4 };
  const pct = (v) => Math.round(v * 100) + '%';
  const kg = (v) => v.toFixed(2).replace('.', ',') + ' kg';
  const estrelas = (n, max) => '★'.repeat(n) + '☆'.repeat(Math.max(0, max - n));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  class Interface {
    constructor(app) {
      this.app = app;
      this.preparo = app.arm.ler('hf.preparo.v1', null) || { personagem1p: 'alemao', iscas: { alemao: 'minhoca', ale: 'minhoca' } };
      this.abaCatalogo = 'peixes';
      this.ligar();
    }

    url(chave) { return this.app.urls[chave] || ''; }

    mostrar(id) {
      $$('#ui .tela').forEach((t) => t.classList.toggle('ativa', t.id === 'tela-' + id));
      this.atual = id;
      const ativa = $('#tela-' + id);
      if (ativa) { const foco = $('button', ativa); if (foco && !('ontouchstart' in root)) foco.focus({ preventScroll: true }); }
      this.app.aoTrocarTela(id);
    }
    esconderTudo() { $$('#ui .tela').forEach((t) => t.classList.remove('ativa')); this.atual = null; }

    ligar() {
      const app = this.app;
      const clique = (fn) => (ev) => { app.audio.clique(); fn(ev); };
      $$('#tela-menu [data-acao]').forEach((b) => b.addEventListener('click', clique(() => {
        const a = b.dataset.acao;
        if (a === '1p' || a === '2p') this.abrirPreparo(a === '1p' ? 1 : 2);
        else if (a === 'catalogo') this.abrirCatalogo();
        else if (a === 'opcoes') this.abrirOpcoes();
      })));
      $('#tela-preparo [data-acao="voltar"]').addEventListener('click', clique(() => this.mostrar('menu')));
      $('#tela-preparo [data-acao="comecar"]').addEventListener('click', clique(() => this.comecar()));
      $('#tela-catalogo [data-acao="voltar"]').addEventListener('click', clique(() => this.mostrar('menu')));
      $('#tela-opcoes [data-acao="voltar"]').addEventListener('click', clique(() => this.mostrar('menu')));
      $$('#tela-catalogo .aba').forEach((b) => b.addEventListener('click', clique(() => { this.abaCatalogo = b.dataset.aba; this.desenharCatalogo(); })));
      $('#tela-girar [data-acao="girar-menu"]').addEventListener('click', clique(() => app.cancelarOuSair()));
      $('#tela-pausa [data-acao="continuar"]').addEventListener('click', clique(() => app.continuarPartida()));
      $('#tela-pausa [data-acao="reiniciar"]').addEventListener('click', clique(() => app.recomecarPartida()));
      $('#tela-pausa [data-acao="sair"]').addEventListener('click', clique(() => app.sairDaPartida()));
      $('#tela-resumo [data-acao="menu"]').addEventListener('click', clique(() => this.mostrar('menu')));
      $('#botao-pausa').addEventListener('click', clique(() => app.pausarPartida()));
      $('#ficha').addEventListener('click', (ev) => { if (ev.target.id === 'ficha' || ev.target.dataset.acao === 'fechar-ficha') { app.audio.clique(); this.fecharFicha(); } });
    }

    prepararMenu() {
      $('#menu-logo').src = this.url('logo');
    }

    // ================================================================= preparação
    abrirPreparo(modo) {
      this.modo = modo;
      $('#preparo-titulo').textContent = modo === 1 ? '1 JOGADOR' : '2 JOGADORES';
      this.desenharPreparo();
      this.mostrar('preparo');
    }

    blocoIsca(pers) {
      const atual = this.preparo.iscas[pers] || 'minhoca';
      const isca = D.iscaPorId[atual];
      return '<div class="escolhas" role="group" aria-label="Isca de ' + NOMES[pers] + '">' +
        D.ISCAS.map((i) => '<button type="button" class="escolha" data-isca="' + i.id + '" data-pers="' + pers + '" aria-pressed="' + (i.id === atual) + '">' +
          '<img src="' + this.url('isca_' + i.id) + '" alt=""><span>' + esc(i.nome) + '<small>' + esc(i.tipo) + '</small></span></button>').join('') +
        '</div><p class="descricao-isca">' + esc(isca.resumo) + '</p>';
    }

    desenharPreparo() {
      const c = $('#preparo-conteudo');
      const regioes = this.app.opcoes.get('regioes');
      let html = '';
      if (this.modo === 1) {
        const p = this.preparo.personagem1p;
        html += '<div class="painel"><h2>Quem vai pescar?</h2><div class="escolhas">' +
          ['alemao', 'ale'].map((x) => '<button type="button" class="escolha" data-pers1p="' + x + '" aria-pressed="' + (x === p) + '"><img src="' + this.url('retrato_' + x) + '" alt="" style="image-rendering:pixelated"><span>' + NOMES[x] + '<small>' + (x === 'alemao' ? 'vara vermelha' : 'vara preta e amarela') + '</small></span></button>').join('') +
          '</div></div>';
        html += '<div class="painel ' + p + '"><h2>Isca</h2>' + this.blocoIsca(p) + '</div>';
      } else {
        html += '<div class="duas-colunas">';
        for (const x of ['alemao', 'ale']) {
          html += '<div class="painel ' + x + '"><div class="cabeca-jogador"><img src="' + this.url('retrato_' + x) + '" alt=""><div><strong class="nome">' + NOMES[x] + '</strong><br><small>' +
            (x === 'alemao' ? 'lado esquerdo' : 'lado direito') + '</small></div></div>' + this.blocoIsca(x) + '</div>';
        }
        html += '</div>';
      }
      html += '<div class="painel"><div class="linha-opcao"><label for="prep-regioes">Regiões de pesca</label>' +
        '<button type="button" id="prep-regioes" class="botao alternar" aria-pressed="' + regioes + '">' + (regioes ? 'LIGADAS' : 'DESLIGADAS') + '</button></div>' +
        '<p class="nota">' + (regioes ? 'Arremesso curto = margem · médio = águas abertas · longo = águas profundas. Cada região tem peixes diferentes.'
          : 'Modo tradicional: o lago inteiro funciona como as águas abertas (o jogo de antes).') + '</p></div>';
      c.innerHTML = html;
      $$('[data-isca]', c).forEach((b) => b.addEventListener('click', () => {
        this.app.audio.clique(true);
        this.preparo.iscas[b.dataset.pers] = b.dataset.isca;
        this.salvarPreparo(); this.desenharPreparo();
      }));
      $$('[data-pers1p]', c).forEach((b) => b.addEventListener('click', () => {
        this.app.audio.clique(true);
        this.preparo.personagem1p = b.dataset.pers1p;
        this.salvarPreparo(); this.desenharPreparo();
      }));
      $('#prep-regioes', c).addEventListener('click', () => {
        this.app.audio.clique(true);
        this.app.opcoes.set('regioes', !this.app.opcoes.get('regioes'));
        this.desenharPreparo();
      });
    }

    salvarPreparo() { this.app.arm.gravar('hf.preparo.v1', this.preparo); }

    comecar() {
      const p = this.preparo;
      let cfg;
      if (this.modo === 1) cfg = { modo: 1, personagens: { P1: p.personagem1p }, iscas: { P1: p.iscas[p.personagem1p] || 'minhoca' } };
      else cfg = { modo: 2, personagens: { P1: 'alemao', P2: 'ale' }, iscas: { P1: p.iscas.alemao || 'minhoca', P2: p.iscas.ale || 'minhoca' } };
      cfg.regioes = this.app.opcoes.get('regioes');
      this.app.iniciarPartida(cfg);
    }

    // ================================================================= catálogo
    abrirCatalogo() {
      this.abaCatalogo = 'peixes';
      this.desenharCatalogo();
      this.mostrar('catalogo');
    }

    desenharCatalogo() {
      const cat = this.app.catalogo;
      $('#catalogo-progresso').textContent = cat.descobertos() + ' de ' + D.ESPECIES.length + ' peixes descobertos · ' + (cat.dados.totalCapturas || 0) + ' capturas registradas';
      $$('#tela-catalogo .aba').forEach((b) => b.classList.toggle('ativa', b.dataset.aba === this.abaCatalogo));
      const c = $('#catalogo-conteudo');
      if (this.abaCatalogo === 'peixes') {
        c.innerHTML = '<div class="grade">' + D.ESPECIES.map((e) => {
          const st = cat.estado(e.id);
          return '<button type="button" class="carta' + (st ? '' : ' oculto') + '" data-especie="' + e.id + '">' +
            '<img src="' + this.url('peixe_' + e.id) + '" alt="">' +
            '<span class="nome">' + (st ? esc(e.nome) : '???') + '</span>' +
            '<span class="raridade">' + estrelas(ESTRELAS_RARIDADE[e.raridade], 4) + ' ' + e.raridade + '</span>' +
            '<span class="situacao">' + (st ? 'capturado ' + st.quantidade + '× · maior ' + kg(st.maiorKg) : 'não descoberto') + '</span></button>';
        }).join('') + '</div>';
        $$('[data-especie]', c).forEach((b) => b.addEventListener('click', () => { this.app.audio.clique(true); this.abrirFicha(b.dataset.especie); }));
      } else if (this.abaCatalogo === 'objetos') {
        c.innerHTML = '<p class="subtitulo">Capturas inusitadas. Não contam como peixe, mas ficam registradas.</p><div class="grade">' + D.OBJETOS.map((o) => {
          const st = cat.objeto(o.id);
          return '<div class="carta' + (st ? '' : ' oculto') + '"><img src="' + this.url('objeto_' + o.id) + '" alt="">' +
            '<span class="nome">' + (st ? esc(o.nome) : '???') + '</span><span class="situacao">' + (st ? 'pescado ' + st.quantidade + '× · ' + esc(o.descricao) : 'ainda não pescado') + '</span></div>';
        }).join('') + '</div>';
      } else {
        c.innerHTML = this.htmlGuia();
      }
    }

    htmlGuia() {
      let h = '<div class="painel"><h2>Como funciona</h2><p>A <b>força do arremesso</b> decide onde a boia cai: curto = <span class="chip margem">MARGEM</span>, médio = <span class="chip aberta">ÁGUAS ABERTAS</span>, longo = <span class="chip fundo">ÁGUAS PROFUNDAS</span>. A cor do alvo e da barra de força mostra a região enquanto você carrega.</p>' +
        '<p>A <b>isca</b> muda quais peixes mordem e quão rápido. Nenhuma isca garante peixe: a briga continua sendo sua.</p></div>';
      for (const r of D.ORDEM_REGIOES) {
        const reg = D.REGIOES[r], prob = D.probabilidades(r, 'minhoca');
        const faixa = r === 'margem' ? 'menos de 14 m' : r === 'aberta' ? 'de 14 a 22 m' : '22 m ou mais';
        const seg = (ms) => (ms / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
        const esp = reg.espera ? seg(reg.espera[0]) + '–' + seg(reg.espera[1]) + ' s' : '2,5–8 s';
        h += '<div class="painel"><h2><span class="chip ' + r + '">' + reg.curta + '</span> ' + faixa + '</h2><p>' + esc(reg.resumo) + '</p>' +
          '<p>Espera até a mordida: ' + esp + (reg.forca > 1 ? ' · peixes ' + Math.round((reg.forca - 1) * 100) + '% mais fortes, pesos acima do normal' : '') + '</p>' +
          '<p>Com minhoca: ' + Object.entries(prob).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([id, v]) => this.nomeSeDescoberto(id) + ' ' + pct(v)).join(' · ') + '</p></div>';
      }
      for (const i of D.ISCAS) {
        const atrai = D.ESPECIES.filter((e) => {
          const g = D.guiaDaEspecie(e.id);
          const meu = Math.max(...D.ORDEM_REGIOES.map((r) => D.probabilidades(r, i.id)[e.id] || 0));
          const minhoca = Math.max(...D.ORDEM_REGIOES.map((r) => D.probabilidades(r, 'minhoca')[e.id] || 0));
          return g.iscas.length && meu > 0 && (meu > minhoca * 1.15 || (minhoca === 0 && meu > 0));
        }).map((e) => this.nomeSeDescoberto(e.id));
        h += '<div class="painel"><h2><img class="icone-isca" src="' + this.url('isca_' + i.id) + '" alt="">' + esc(i.nome) + ' <small>(' + i.tipo + ')</small></h2><p>' + esc(i.resumo) + '</p>' +
          '<p>Mordidas: ' + (i.espera < 1 ? 'mais rápidas' : i.espera > 1 ? 'mais demoradas' : 'normais') + (atrai.length ? ' · atrai mais: ' + atrai.join(', ') : ' · equilibrada para todos') + '</p></div>';
      }
      return h;
    }

    nomeSeDescoberto(id) {
      if (id === 'objeto') return 'objetos';
      const e = D.especiePorId[id];
      return this.app.catalogo.estado(id) ? e.nome : '???';
    }

    abrirFicha(id) {
      const e = D.especiePorId[id], st = this.app.catalogo.estado(id), g = D.guiaDaEspecie(id);
      const regioes = g.regioes.map((r) => '<span class="chip ' + r + '">' + D.REGIOES[r].curta + '</span>').join(' ');
      const iscas = g.iscas.slice(0, 3).map((x) => '<span class="chip"><img class="icone-isca" src="' + this.url('isca_' + x.id) + '" alt="">' + esc(D.iscaPorId[x.id].nome) + ' (até ' + pct(x.melhor) + ')</span>').join(' ');
      const melhor = D.REGIOES[g.melhor.regiao].nome + ' com ' + D.iscaPorId[g.melhor.isca].nome.toLowerCase() + ' (' + pct(g.melhor.p) + ' das mordidas)';
      const peso = kg(e.pesoKg[0]) + ' a ' + kg(e.pesoKg[1]) + (g.regioes.includes('fundo') ? ' · no fundo pode passar de ' + kg(e.pesoKg[1]) : '');
      const linhas = [
        ['Raridade', '<span class="estrelas">' + estrelas(ESTRELAS_RARIDADE[e.raridade], 4) + '</span> ' + e.raridade],
        ['Regiões', regioes],
        ['Iscas', iscas],
        ['Melhor chance', esc(melhor)],
        ['Dificuldade', '<span class="estrelas">' + estrelas(e.dificuldade, 5) + '</span>'],
        ['Peso', st ? peso : '<i>descubra pescando</i>'],
        ['Comportamento', st ? esc(e.descricao) : '<i>descubra pescando</i>'],
        ['Dica', esc(e.dica)],
        ['Situação', st ? 'Capturado ' + st.quantidade + '× · maior: ' + kg(st.maiorKg) + (st.quem ? ' (' + esc(st.quem) + ')' : '') : 'Ainda não descoberto']
      ];
      const f = $('#ficha');
      f.innerHTML = '<div class="painel"><h2>' + (st ? esc(e.nome) : '??? <small>(não descoberto)</small>') + '</h2>' +
        '<img class="ilustracao' + (st ? '' : ' oculto') + '" src="' + this.url('peixe_' + e.id) + '" alt="' + (st ? esc(e.nome) : 'peixe não descoberto') + '">' +
        '<table class="tabela-ficha">' + linhas.map(([k, v]) => '<tr><th>' + k + '</th><td>' + v + '</td></tr>').join('') + '</table>' +
        '<div class="linha-botoes"><button type="button" class="botao" data-acao="fechar-ficha">FECHAR</button></div></div>';
      f.hidden = false;
    }
    fecharFicha() { $('#ficha').hidden = true; }

    // ================================================================= opções
    abrirOpcoes() { this.desenharOpcoes(); this.mostrar('opcoes'); }

    desenharOpcoes() {
      const o = this.app.opcoes;
      const faixa = (k, rot) => '<div class="linha-opcao"><label for="op-' + k + '">' + rot + '</label><input type="range" id="op-' + k + '" min="0" max="100" step="5" value="' + Math.round(o.get(k) * 100) + '"><output>' + Math.round(o.get(k) * 100) + '%</output></div>';
      const alt = (k, rot, on, off) => '<div class="linha-opcao"><label for="op-' + k + '">' + rot + '</label><button type="button" id="op-' + k + '" class="botao alternar" data-alt="' + k + '" aria-pressed="' + o.get(k) + '">' + (o.get(k) ? on : off) + '</button></div>';
      $('#opcoes-conteudo').innerHTML =
        '<div class="painel"><h2>Som</h2>' + faixa('volumeGeral', 'Volume geral') + faixa('volumeEfeitos', 'Efeitos sonoros') + faixa('volumeMusica', 'Música') +
        faixa('volumeVozes', 'Vozes') +
        alt('efeitos', 'Efeitos sonoros', 'LIGADOS', 'DESLIGADOS') + alt('musica', 'Música', 'LIGADA', 'DESLIGADA') + alt('vozes', 'Vozes', 'LIGADAS', 'DESLIGADAS') +
        '<p class="nota">Vozes: balbucios e choro do Sirius (8-bit) e os bipes dos diálogos. Trilha, efeitos e vozes são sintetizados na hora (provisórios, sem arquivos de áudio).</p></div>' +
        '<div class="painel"><h2>Jogo</h2>' + alt('regioes', 'Regiões de pesca', 'LIGADAS', 'DESLIGADAS') +
        '<p class="nota">Desligadas: o lago inteiro funciona como as águas abertas (o jogo tradicional), para comparar.</p>' +
        alt('vibracao', 'Vibração', 'LIGADA', 'DESLIGADA') + '<p class="nota">A vibração é do aparelho inteiro (chega às mãos dos dois). No iPhone o navegador não permite.</p></div>' +
        '<div class="painel"><h2>Catálogo</h2><p>' + this.app.catalogo.descobertos() + ' de ' + D.ESPECIES.length + ' peixes descobertos.</p>' +
        '<div class="linha-botoes"><button type="button" class="botao" id="op-apagar">APAGAR CATÁLOGO</button></div></div>';
      $$('#opcoes-conteudo input[type="range"]').forEach((inp) => inp.addEventListener('input', () => {
        const k = inp.id.slice(3);
        o.set(k, Number(inp.value) / 100);
        inp.nextElementSibling.textContent = inp.value + '%';
      }));
      $$('#opcoes-conteudo input[type="range"]').forEach((inp) => inp.addEventListener('change', () => this.app.audio.clique()));
      $$('#opcoes-conteudo [data-alt]').forEach((b) => b.addEventListener('click', () => {
        o.set(b.dataset.alt, !o.get(b.dataset.alt));
        this.app.audio.clique(true);
        this.desenharOpcoes();
      }));
      const apagar = $('#op-apagar');
      apagar.addEventListener('click', () => {
        this.app.audio.clique();
        if (apagar.dataset.confirmar) { this.app.catalogo.apagarTudo(); this.desenharOpcoes(); return; }
        apagar.dataset.confirmar = '1';
        apagar.textContent = 'TOQUE DE NOVO PARA APAGAR';
        apagar.classList.add('destaque');
      });
    }

    // ================================================================= partida: girar, pausa, resumo
    mostrarGirar(durantePartida) {
      $('#girar-texto').textContent = 'Gire o celular para a horizontal';
      $('#girar-sub').textContent = durantePartida ? 'A pescaria está pausada e continua quando a tela ficar deitada.' : 'A pescaria começa assim que a tela ficar deitada.';
      $('#tela-girar [data-acao="girar-menu"]').textContent = durantePartida ? 'SAIR PARA O MENU' : 'VOLTAR AO MENU';
      this.mostrar('girar');
    }

    mostrarPausa(partida) {
      const o = this.app.opcoes;
      let h = '<div class="pausa-grade">';
      for (const id of partida.ids) {
        const pers = partida.pl[id].pers, atual = partida.session.players[id].isca;
        h += '<div class="painel ' + pers + '"><h2><span class="nome" style="color:var(--' + pers + ')">' + NOMES[pers] + '</span> · isca</h2><div class="escolhas compacta">' +
          D.ISCAS.map((i) => '<button type="button" class="escolha" data-pisca="' + i.id + '" data-pid="' + id + '" aria-pressed="' + (i.id === atual) + '"><img src="' + this.url('isca_' + i.id) + '" alt=""><span>' + esc(i.nome) + '</span></button>').join('') +
          '</div></div>';
      }
      h += '</div><p class="nota">A isca e as regiões valem a partir do próximo arremesso.</p>' +
        '<div class="painel opcoes-rapidas"><div class="linha-opcao"><label>Regiões de pesca</label><button type="button" class="botao alternar" data-palt="regioes" aria-pressed="' + o.get('regioes') + '">' + (o.get('regioes') ? 'LIGADAS' : 'DESLIGADAS') + '</button></div>' +
        '<div class="linha-opcao"><label>Música</label><button type="button" class="botao alternar" data-palt="musica" aria-pressed="' + o.get('musica') + '">' + (o.get('musica') ? 'LIGADA' : 'DESLIGADA') + '</button></div>' +
        '<div class="linha-opcao"><label>Efeitos sonoros</label><button type="button" class="botao alternar" data-palt="efeitos" aria-pressed="' + o.get('efeitos') + '">' + (o.get('efeitos') ? 'LIGADOS' : 'DESLIGADOS') + '</button></div>' +
        '<div class="linha-opcao"><label>Vozes</label><button type="button" class="botao alternar" data-palt="vozes" aria-pressed="' + o.get('vozes') + '">' + (o.get('vozes') ? 'LIGADAS' : 'DESLIGADAS') + '</button></div></div>';
      const c = $('#pausa-conteudo');
      c.innerHTML = h;
      $$('[data-pisca]', c).forEach((b) => b.addEventListener('click', () => {
        this.app.audio.clique(true);
        partida.setIsca(b.dataset.pid, b.dataset.pisca);
        const pers = partida.pl[b.dataset.pid].pers;
        this.preparo.iscas[pers] = b.dataset.pisca; this.salvarPreparo();
        this.mostrarPausa(partida);
      }));
      $$('[data-palt]', c).forEach((b) => b.addEventListener('click', () => {
        this.app.audio.clique(true);
        const k = b.dataset.palt;
        o.set(k, !o.get(k));
        if (k === 'regioes') partida.setRegioes(o.get('regioes'));
        this.mostrarPausa(partida);
      }));
      this.mostrar('pausa');
    }

    mostrarResumo(r) {
      let h = '';
      const min = Math.max(0, Math.round(r.minutos));
      h += '<p class="subtitulo">' + (min < 1 ? 'Menos de 1 minuto' : min + ' min') + ' de pescaria</p>';
      for (const j of r.jogadores) {
        h += '<div class="painel ' + j.pers + ' resumo-jogador"><h2><img src="' + this.url('retrato_' + j.pers) + '" alt=""><span style="color:var(--' + j.pers + ')">' + NOMES[j.pers] + '</span></h2>' +
          '<p>Peixes: <b>' + j.capturas + '</b> · peso total: <b>' + kg(j.kg) + '</b></p>' +
          '<p>Maior peixe: <b>' + (j.maior ? esc(j.maior.nome) + ' · ' + kg(j.maior.kg) : '—') + '</b></p>' +
          '<p>Objetos estranhos: ' + j.objetos + ' · peixes perdidos: ' + j.perdas + '</p></div>';
      }
      if (r.jogadores.length === 2) {
        const [a, b] = r.jogadores;
        const vence = a.capturas === b.capturas ? (a.kg === b.kg ? null : (a.kg > b.kg ? a : b)) : (a.capturas > b.capturas ? a : b);
        h += '<p class="subtitulo">' + (vence ? NOMES[vence.pers] + ' levou a melhor hoje!' : 'Empate! Pescaria equilibrada.') + '</p>';
      }
      if (r.novas.length) h += '<div class="painel"><h2>Novas no catálogo</h2><div class="novas">' + r.novas.map((n) => '<span>' + esc(n) + '</span>').join('') + '</div></div>';
      $('#resumo-conteudo').innerHTML = h;
      this.mostrar('resumo');
    }
  }

  HF.Interface = Interface;
})(window);
