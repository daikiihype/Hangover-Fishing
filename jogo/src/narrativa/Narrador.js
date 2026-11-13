/*
 * Hangover Fishing — narrativa
 * Narrador: decide QUEM fala, O QUÊ e QUANDO, a partir dos eventos REAIS da pescaria.
 *
 * É uma camada independente: só LÊ o estado dos pescadores e os eventos da sessão.
 * Não altera espera, tensão, força, fisgada, capturas, pesos, resultados nem os toques.
 *
 * Conceitos
 *   - Cena: uma fala ou uma conversa curta (até 4 falas), com gatilho, condições,
 *     prioridade e peso. O conteúdo fica nos arquivos de dados (src/narrativa/falas/*.js).
 *   - Prioridade (1 = mais importante): 1 Sirius (choro), 2 capturas excepcionais e
 *     acontecimentos importantes, 3 fracassos, 4 disputa, 5 comentários do momento,
 *     6 conversas espontâneas.
 *   - Só uma fala por vez. Uma cena importante (≤ 3) interrompe outra menos importante;
 *     se não puder começar agora, fica no máximo UMA cena pendente, que expira em 2,5 s.
 *     Nada de fila de comentários atrasados.
 *   - Tempos mínimos: entre cenas (conforme a prioridade), por personagem, por categoria,
 *     reuso da mesma cena e da mesma frase, e no máximo 7 falas por minuto (cenas comuns).
 *
 * Operação Nova Identidade:
 *   - a MORDIDA interrompe a conversa em andamento; a fisgada tem reação curta e imediata;
 *     capturas, mordidas e acontecimentos perto da boia podem cortar uma conversa solta;
 *   - uma conversa solta interrompida pode ser RETOMADA depois ("Como eu ia dizendo..."),
 *     se a calma voltar logo (até 60 s); senão, fica para trás;
 *   - mais conversa enquanto alguém espera a mordida (o silêncio continua existindo);
 *   - gatilhos do mundo (peixe saltando, cardume, objeto boiando, pássaros, chuva,
 *     entardecer), dos pontos de interesse e dos quatro lugares do lago.
 */
(function (root) {
  'use strict';

  const NOMES = { alemao: 'ALEMÃO', ale: 'ALE', maria: 'MARIA', sirius: 'SIRIUS' };
  const VOCATIVO_MARIA = { alemao: 'Lucas', ale: 'pai' };       // como a Maria chama cada pescador
  // intervalo mínimo desde o fim da última cena, por prioridade
  const INTERVALO = { 1: 0, 2: 400, 3: 2000, 4: 4000, 5: 9000, 6: 8000 };
  // tempo mínimo entre duas cenas iniciadas pelo mesmo personagem (prioridade > 2)
  const POR_PESSOA = { alemao: 5000, ale: 7000, maria: 12000, sirius: 25000 };
  const CATEGORIA = {
    arremesso: 'arremesso', 'arremesso-ruim': 'arremesso', regiao: 'regiao', isca: 'isca',
    beliscada: 'espera', ansioso: 'espera', 'espera-longa': 'espera', demorando: 'espera', seca: 'espera',
    mordida: 'mordida', fisgada: 'mordida',
    arrancada: 'briga', 'briga-tensa': 'briga', 'briga-frouxa': 'briga', 'briga-longa': 'briga', 'briga-grande': 'briga',
    captura: 'captura', objeto: 'captura',
    fuga: 'fracasso', rompeu: 'fracasso', perdida: 'fracasso', recolheu: 'fracasso',
    silencio: 'espontanea', retomada: 'retomada',
    'sirius-inquieto': 'sirius', 'sirius-chorando': 'sirius', 'sirius-acalmando': 'sirius', 'sirius-acalmou': 'sirius',
    'sirius-dormiu': 'sirius-sono', 'sirius-acordou': 'sirius-sono',
    // Operação Nova Identidade: o mundo e os pontos de interesse
    salto: 'mundo', cardume: 'mundo', 'objeto-boiando': 'mundo', passaro: 'mundo',
    'chuva-inicio': 'clima', 'chuva-fim': 'clima', entardecer: 'clima',
    'ponto-surgiu': 'ponto', 'ponto-acerto': 'ponto'
  };
  const POR_CATEGORIA = { arremesso: 20000, regiao: 40000, isca: 60000, espera: 25000, mordida: 12000, briga: 14000,
    captura: 0, fracasso: 3000, espontanea: 30000, retomada: 0, sirius: 0, 'sirius-sono': 60000, mundo: 40000, clima: 20000, ponto: 20000 };
  // categorias de reação imediata: podem falar logo depois da fala anterior (a mordida acabou de cortar a conversa)
  const INTERVALO_RAPIDO = { mordida: 700 };
  // chance de alguém comentar quando o gatilho acontece (antes das demais regras)
  const CHANCE = { arremesso: 0.45, 'arremesso-ruim': 0.6, regiao: 0.6, isca: 0.5, beliscada: 0.2, ansioso: 0.85, 'espera-longa': 0.5,
    demorando: 0.75, seca: 1, mordida: 0.25, fisgada: 0.3, arrancada: 0.2, 'briga-tensa': 0.5, 'briga-frouxa': 0.4, 'briga-longa': 0.5,
    'briga-grande': 0.7, objeto: 0.95, fuga: 0.7, rompeu: 0.8, perdida: 0.55, recolheu: 0.35, silencio: 1, retomada: 1,
    'sirius-inquieto': 1, 'sirius-chorando': 1, 'sirius-acalmando': 1, 'sirius-acalmou': 1, 'sirius-dormiu': 0.5, 'sirius-acordou': 0.6,
    salto: 0.5, cardume: 0.35, 'objeto-boiando': 0.6, passaro: 0.12, 'chuva-inicio': 1, 'chuva-fim': 0.7, entardecer: 1,
    'ponto-surgiu': 0.3, 'ponto-acerto': 0.6 };
  // frases para retomar uma conversa interrompida (quem retoma é quem falaria em seguida)
  const RETOMADAS = {
    alemao: ['Mas então, como eu tava falando...', 'Voltando ao assunto...', 'Onde é que eu tava? Ah, sim.'],
    ale: ['Como eu ia dizendo...', 'Bom. Onde a gente parou?', 'Voltando ao que interessa...'],
    maria: ['Então... como eu tava dizendo.', 'Voltando ao assunto...', 'Enfim. Onde a gente tava?']
  };
  const CHANCE_CAPTURA = { pequeno: 0.25, medio: 0.3, grande: 0.9, excepcional: 1 };
  const REUSO_CENA_MS = 300000;      // a mesma cena não volta antes de 5 min (se houver alternativa)
  const MEMORIA_FRASES = 40;         // frases recentes que não podem se repetir
  const MAX_FALAS_MINUTO = 7;
  const PENDENTE_MS = 2500;
  const SIRIUS_CD = 25000;

  // ------------------------------------------------------------------ balbucios do Sirius
  // Bebê de ~2 meses: mais arrulhos e vogais ("AGU", "AAA", "OOO") do que sílabas repetidas.
  const BALBUCIOS = {
    feliz: ['AGU!', 'AGUU!', 'AAA!', 'BU BU!', 'GUGU!', 'AAAH!', 'EEE!', 'AGU AGU!', 'OOO!', 'GU GU!', 'HIII!', 'AH-GU!', 'ÃÃÃ!', 'UUH!', 'AGÚ!', 'OH-GU!'],
    curioso: ['GUH?', 'AH?', 'UH?', 'EH?', 'BU?', 'GU-GU?', 'NGÁ?', 'HMM?', 'OH?', 'GUÁ?', 'AGU?', 'ÃH?'],
    protesto: ['AAAA!', 'NHÉÉ!', 'ÉÉÉ!', 'MNHÁ!', 'HNNN!', 'AAAH!!', 'NHÁÁ!', 'ÁÁÁ!'],
    surpresa: ['OOO!', 'AH!', 'UUU!', 'OH!', 'BOH!', 'OOH!'],
    sono: ['MMM...', 'AAH...', 'HUUM...', 'NHÁ...'],
    bobo: ['PFFFT!', 'BRRR!', 'BLBLBL!', 'PRRR!', 'BLÉ!'],
    choro: ['BUÁÁÁ!', 'UÁÁÁÁ!', 'BUÁÁ... ÁÁÁ!', 'UÁÁ! UÁÁ!', 'BUÁÁÁÁÁ!']
  };
  const SILABAS = ['A', 'AH', 'GU', 'BU', 'U', 'O', 'É', 'NGÁ', 'HU', 'Ã', 'GUH', 'OH'];

  function kgTxt(v) { return v.toFixed(2).replace('.', ',') + ' kg'; }
  const ARTIGO = { m: { um: 'um', o: 'o' }, f: { um: 'uma', o: 'a' } };

  class Narrador {
    /**
     * opts.modo 1 | 2 · opts.personagens { P1, P2 } · opts.random () → [0,1)
     * opts.cenas (padrão: HF.Falas.cenas) · opts.sirius (padrão: novo HF.Sirius)
     * opts.dados (HF.DadosPesca) · opts.regioesAtivas () → bool
     */
    constructor(opts) {
      opts = opts || {};
      const HF = root.HF || {};
      const req = (p) => (typeof require === 'function' ? require(p) : null);
      if (!HF.Sirius) HF.Sirius = req('./Sirius.js');
      if (!HF.DadosPesca) HF.DadosPesca = req('../logica/DadosPesca.js');
      this.modo = opts.modo || 2;
      this.personagens = Object.assign({}, opts.personagens || { P1: 'alemao', P2: 'ale' });
      this.random = opts.random || Math.random;
      this.dados = opts.dados || HF.DadosPesca;
      this.sirius = opts.sirius || new HF.Sirius({ random: this.random });
      this.ids = this.modo === 1 ? ['P1'] : ['P1', 'P2'];
      this.protagonista = this.personagens.P1;
      this.observador = this.modo === 1 ? (this.protagonista === 'alemao' ? 'ale' : 'alemao') : null;
      const cenas = opts.cenas || (HF.Falas && HF.Falas.cenas) || [];
      this.cenas = cenas;
      this.porGatilho = {};
      for (const c of cenas) (this.porGatilho[c.g] = this.porGatilho[c.g] || []).push(c);
      this.t = 0;
      this.atual = null;
      this.pendente = null;
      this.fimUltima = 0;
      this.ultimaPessoa = {};
      this.ultimaCategoria = {};
      this.usoCena = new Map();
      this.frasesRecentes = [];
      this.inicios = [];
      this.sons = [];
      this.registro = [];
      this.jog = {};
      for (const id of ['P1', 'P2']) this.jog[id] = this._novoJogador(this.personagens[id]);
      this.lider = null;
      this.viradas = 0;
      this.ultimaCapturaGeral = 0;
      this.secaAvisada = false;
      this.silencioAlvo = this._entre(30000, 50000);
      // "conversa devida": de tempos em tempos a família puxa assunto, mesmo com a pescaria agitada
      this.ultimaEspontanea = 0;
      this.conversaDevida = this._entre(50000, 80000);
      this.proximoChoroSom = 0;
      this.choroSons = 0;
      this.retomar = null;           // conversa solta interrompida que pode voltar depois
      this.chovendo = false;
    }

    _novoJogador(pessoa) {
      return { pessoa, capturas: 0, kg: 0, maior: 0, falhasSeguidas: 0, sequencia: 0, ultimaCapturaT: 0, ultimaFalhaT: -Infinity,
        capturasDesdeOutro: 0, demorandoAvisado: false, ultimoArremesso: null, regioesSeguidas: [], regioesVisitadas: new Set(), zonasVisitadas: new Set(),
        iscasUsadas: new Set(), prematuros: 0, estado: 'IDLE', desde: 0, briga: {}, recolhidas: 0, objetos: 0 };
    }

    _entre(a, b) { return a + this.random() * (b - a); }

    // ================================================================= entradas
    /** Cada evento da sessão (FishingSession.onEvent). players = session.players (só leitura). */
    evento(e, players, extra) {
      const id = e.jogador;
      if (!id || !this.ids.includes(id)) return;
      const j = this.jog[id], p = players && players[id];
      const outroId = id === 'P1' ? 'P2' : 'P1';
      const base = { sujeitoId: id, outroId };
      switch (e.tipo) {
        case 'estado':
          j.estado = e.para; j.desde = this.t;
          if (e.para === 'WAITING') { j.prematuros = 0; j.esperaAvisada = false; }
          if (e.para === 'FIGHTING') j.briga = { inicio: this.t };
          break;
        case 'arremesso': this._arremesso(id, e, p, base); break;
        case 'boia-na-agua': this._pouso(id, p, base); break;
        case 'arremesso-cancelado':
          if (e.codigo === 'toque-curto') this._disparar('arremesso-ruim', base);
          break;
        case 'toque-prematuro':
          j.prematuros++;
          if (j.prematuros === 3) this._disparar('ansioso', base);
          break;
        case 'beliscada': this._disparar('beliscada', base); break;
        case 'mordida':
          // a mordida corta a conversa do momento (a pescaria vem primeiro); dá para retomar depois
          if (this.atual && this.atual.cena.p >= 5 && this.atual.i < this.atual.cena.f.length - 1) this._interromperConversa();
          this._disparar('mordida', base);
          break;
        case 'fisgada':
          this._disparar('fisgada', Object.assign(base, { reacao: e.reacaoMs < 320 ? 'rapida' : e.reacaoMs > 750 ? 'lenta' : 'normal' }));
          break;
        case 'arrancada':
          if (!j.briga.arrancada) { j.briga.arrancada = true; this._disparar('arrancada', base); }
          break;
        case 'zona-tensao':
          if (e.zona === 'critica' && !j.briga.tensa && j.estado === 'FIGHTING') { j.briga.tensa = true; this._disparar('briga-tensa', base); }
          if (e.zona === 'frouxa') j.briga.frouxaDesde = this.t; else j.briga.frouxaDesde = null;
          break;
        case 'captura': this._captura(id, e, p, players, extra || {}, base); break;
        case 'fuga': this._falha(id, 'fuga', e, p, players, base); break;
        case 'linha-rompida': this._falha(id, 'rompeu', e, p, players, base); break;
        case 'mordida-perdida': this._falha(id, 'perdida', e, p, players, base); break;
        case 'recolhimento-concluido':
          j.recolhidas++;
          this._disparar('recolheu', Object.assign(base, { vezes: j.recolhidas }));
          break;
        default: break;
      }
    }

    /** A cada quadro. dt = ms de JOGO (0 em pausa). */
    atualizar(dt, players) {
      dt = Math.max(0, dt || 0);
      if (dt === 0) return;
      this.t += dt;
      for (const ev of this.sirius.update(dt)) this._eventoSirius(ev);
      if (this.sirius.estado === 'chorando' && this.t >= this.proximoChoroSom && this.choroSons < 3) {
        this.sons.push({ tipo: 'choro' });
        this.choroSons++;
        this.proximoChoroSom = this.t + 2600;
      }
      this._temporizados(players);
      this._avancarCena(players);
    }

    // ================================================================= gatilhos
    _arremesso(id, e, p, base) {
      const j = this.jog[id];
      const m = e.distancia, regiao = p && p.regiao;
      const outro = this.jog[base.outroId];
      const superou = this.modo === 2 && outro.ultimoArremesso && this.t - outro.ultimoArremesso.t < 25000 && m >= outro.ultimoArremesso.m + 6;
      j.regioesSeguidas.push(regiao || 'x');
      if (j.regioesSeguidas.length > 3) j.regioesSeguidas.shift();
      const mesmoLugar = !!regiao && j.regioesSeguidas.length === 3 && j.regioesSeguidas.every((r) => r === regiao);
      j.ultimoArremesso = { m, t: this.t, regiao };
      const ctx = Object.assign(base, { m, regiao, curto: m < 9, longo: m >= 26.5, perfeito: e.forca >= 0.97, superou, mesmoLugar });
      if (ctx.curto || ctx.longo || ctx.superou || ctx.mesmoLugar) this._disparar('arremesso', ctx);
    }

    _pouso(id, p, base) {
      const j = this.jog[id];
      if (!p) return;
      const regiao = p.regiao, zona = p.zona || null, isca = p.iscaNaAgua;
      // a boia pousou num ponto de interesse: o comentário da hora é esse
      if (p.pontoNaAgua && this._disparar('ponto-acerto', Object.assign({}, base, { ponto: p.pontoNaAgua.tipo, zona, regiao, isca }))) return;
      // primeira vez em cada lugar do lago (Margem Rasa, Baía dos Lírios, Curva das Pedras, Poço Profundo)
      const lugar = zona || regiao;
      if (lugar && !j.zonasVisitadas.has(lugar)) {
        j.zonasVisitadas.add(lugar);
        if (regiao) j.regioesVisitadas.add(regiao);
        if (this._disparar('regiao', Object.assign({}, base, { regiao, zona, isca, primeira: j.zonasVisitadas.size === 1 }))) return;
      }
      if (isca && !j.iscasUsadas.has(isca)) {
        j.iscasUsadas.add(isca);
        if (isca !== 'minhoca') this._disparar('isca', Object.assign({}, base, { isca, regiao }));
      }
    }

    _tamanho(def, kg) {
      const [a, b] = def.pesoKg;
      const r = (kg - a) / Math.max(0.01, b - a);
      if (kg >= 6 || (kg > b + 0.005 && kg >= 1.5)) return 'excepcional';
      if (kg >= 3 || (r >= 0.75 && kg >= 1)) return 'grande';
      if (kg < 0.5 || r < 0.3) return 'pequeno';
      return 'medio';
    }

    _captura(id, e, p, players, extra, base) {
      const j = this.jog[id], o = this.jog[base.outroId];
      const D = this.dados;
      if (e.objeto) {
        j.objetos++;
        const def = D.objetoPorId[e.perfil];
        this._disparar('objeto', Object.assign(base, { objeto: e.perfil, peixe: def ? def.nome.toLowerCase() : 'coisa', genero: def && def.genero, kg: e.pesoKg }));
        return;
      }
      const def = D.especiePorId[e.perfil];
      const kg = e.pesoKg;
      const tamanho = this._tamanho(def, kg);
      const recordePessoal = j.capturas >= 2 && kg > j.maior;
      j.capturas++; j.kg += kg; j.sequencia++; j.falhasSeguidas = 0;
      j.maior = Math.max(j.maior, kg);
      j.ultimaCapturaT = this.t; j.demorandoAvisado = false;
      o.capturasDesdeOutro++; j.capturasDesdeOutro = 0;
      const ctx = Object.assign(base, {
        especie: e.perfil, peixe: def.nome.toLowerCase(), genero: def.genero || 'm', kg, tamanho,
        raro: def.raridade === 'rara' || def.raridade === 'muito rara', novo: !!extra.novo, recorde: !!extra.recorde,
        recordePessoal, sequencia: j.sequencia, regiao: p && p.regiao, isca: p && p.iscaNaAgua
      });
      if (this.modo === 2) {
        const antes = this.lider;
        const a = this.jog.P1.capturas, b = this.jog.P2.capturas;
        this.lider = a === b ? this.lider : (a > b ? 'P1' : 'P2');
        ctx.virou = !!antes && this.lider !== antes && this.lider === id;
        if (ctx.virou) this.viradas++;
        ctx.gangorra = ctx.virou && this.viradas >= 3;
        ctx.empatou = a === b && a >= 1;
        ctx.disparou = j.capturas - o.capturas >= 3;
        ctx.muitoMaior = o.maior > 0 && kg >= 2 * o.maior && kg >= 2;
        ctx.outroFalhou = this.t - o.ultimaFalhaT < 8000;
        ctx.quaseJunto = o.ultimaCapturaT > 0 && this.t - o.ultimaCapturaT < 6000;
        ctx.placar = j.capturas + ' a ' + o.capturas;
      }
      this.ultimaCapturaGeral = this.t;
      this.secaAvisada = false;
      // comemoração alta pode acordar ou inquietar o Sirius
      if (tamanho === 'excepcional' || ctx.raro) this._eventosSirius(this.sirius.barulho(1));
      else if (tamanho === 'grande') this._eventosSirius(this.sirius.barulho(0.5));
      this._disparar('captura', ctx);
    }

    _falha(id, tipo, e, p, players, base) {
      const j = this.jog[id], o = this.jog[base.outroId];
      j.falhasSeguidas++; j.sequencia = 0; j.ultimaFalhaT = this.t;
      const kg = p && p.lastResult && p.lastResult.pesoKg;
      const ctx = Object.assign(base, { grande: tipo !== 'perdida' && kg >= 3, repetido: j.falhasSeguidas >= 3,
        outroCapturou: this.modo === 2 && o.ultimaCapturaT > 0 && this.t - o.ultimaCapturaT < 8000,
        brigaLonga: tipo !== 'perdida' && j.briga.inicio != null && this.t - j.briga.inicio > 20000 });
      if (tipo === 'rompeu') this._eventosSirius(this.sirius.barulho(0.4));
      this._disparar(tipo, ctx);
    }

    _temporizados(players) {
      if (!players) return;
      for (const id of this.ids) {
        const j = this.jog[id], p = players[id];
        if (!p) continue;
        const base = { sujeitoId: id, outroId: id === 'P1' ? 'P2' : 'P1' };
        if (p.state === 'WAITING' && !j.esperaAvisada && this.t - j.desde >= 9000) { j.esperaAvisada = true; this._disparar('espera-longa', base); }
        if (p.state === 'FIGHTING' && j.briga.inicio != null) {
          const b = j.briga, dur = this.t - b.inicio;
          if (!b.grande && dur >= 2500 && p.fish && p.fish.weightKg >= 3.5 && !p.fish.profile.objeto) { b.grande = true; this._disparar('briga-grande', Object.assign({}, base, { kg: p.fish.weightKg })); }
          if (!b.longa && dur >= 25000) { b.longa = true; this._disparar('briga-longa', base); }
          if (!b.frouxa && b.frouxaDesde != null && this.t - b.frouxaDesde >= 1200) { b.frouxa = true; this._disparar('briga-frouxa', base); }
        }
        if (this.modo === 2 && !j.demorandoAvisado && this.t - j.ultimaCapturaT >= 90000 && this._capturasDoOutroDesde(id) >= 2) {
          j.demorandoAvisado = true;
          this._disparar('demorando', base);
        }
      }
      if (!this.secaAvisada && this.t - this.ultimaCapturaGeral >= 100000) {
        this.secaAvisada = true;
        this._disparar('seca', { sujeitoId: 'P1', outroId: 'P2' });
      }
      // retomada da conversa interrompida: só se a calma voltar logo (até 60 s), e às vezes nem assim
      const agitado = this.ids.some((id) => players[id] && (players[id].state === 'BITE' || players[id].state === 'FIGHTING'));
      if (this.retomar) {
        const r = this.retomar, idade = this.t - r.t;
        if (idade > 60000) this.retomar = null;
        else if (!this.atual && !agitado && idade > 6000 && this.t - this.fimUltima >= INTERVALO[6]) {
          this.retomar = null;
          if (this.random() < 0.6) this._retomar(r);
        }
      }
      // silêncio: ninguém falou por um tempo. Enquanto alguém ESPERA a mordida, a conversa vem mais cedo.
      // Numa mordida, adia um pouco; durante uma briga, só conversas curtas (até 2 falas) (GDD 11.2).
      const esperando = !agitado && this.ids.some((id) => players[id] && players[id].state === 'WAITING');
      if (!this.atual && this.t - this.fimUltima >= this.silencioAlvo * (esperando ? 0.7 : 1)) {
        const mordida = this.ids.some((id) => players[id] && players[id].state === 'BITE');
        if (mordida) {
          this.silencioAlvo = this.t - this.fimUltima + this._entre(4000, 8000);
        } else {
          const brigando = this.ids.some((id) => players[id] && players[id].state === 'FIGHTING');
          const sujeitoId = this.ids[Math.floor(this.random() * this.ids.length)];
          const p = players[sujeitoId];
          this._disparar('silencio', { sujeitoId, outroId: sujeitoId === 'P1' ? 'P2' : 'P1', esperando: !!p && p.state === 'WAITING', brigando });
          this.silencioAlvo = this.t - this.fimUltima + this._entre(40000, 70000);
        }
      }
      if (!this.atual && this.t - this.ultimaEspontanea >= this.conversaDevida && this.t - this.fimUltima >= INTERVALO[6]) {
        const mordida = this.ids.some((id) => players[id] && players[id].state === 'BITE');
        if (!mordida) {
          const brigando = this.ids.some((id) => players[id] && players[id].state === 'FIGHTING');
          const sujeitoId = this.ids[Math.floor(this.random() * this.ids.length)];
          const p = players[sujeitoId];
          const comecou = this._disparar('silencio', { sujeitoId, outroId: sujeitoId === 'P1' ? 'P2' : 'P1', esperando: !!p && p.state === 'WAITING', brigando });
          if (!comecou) this.conversaDevida = this.t - this.ultimaEspontanea + this._entre(15000, 30000);   // não deu agora: tenta logo
        }
      }
    }

    /** Quantos peixes o OUTRO pescou desde a última captura deste jogador. */
    _capturasDoOutroDesde(id) {
      return this.jog[id].capturasDesdeOutro;
    }

    _eventosSirius(lista) { for (const ev of lista) this._eventoSirius(ev); }

    _eventoSirius(ev) {
      const base = { sujeitoId: 'P1', outroId: 'P2' };
      switch (ev.tipo) {
        case 'inquieto': this._disparar('sirius-inquieto', base); break;
        case 'chorando': this.proximoChoroSom = this.t; this.choroSons = 0; this._disparar('sirius-chorando', base); break;
        case 'acalmando': this._disparar('sirius-acalmando', base); break;
        case 'dormindo':
          this._disparar(this.sirius.historico.length && this.sirius.historico[this.sirius.historico.length - 1].de === 'acalmando' ? 'sirius-acalmou' : 'sirius-dormiu', Object.assign({}, base, { dormiu: true }));
          break;
        case 'acordado':
          if (this.sirius.historico.length && this.sirius.historico[this.sirius.historico.length - 1].de === 'acalmando') this._disparar('sirius-acalmou', Object.assign({}, base, { dormiu: false }));
          else this._disparar('sirius-acordou', base);
          break;
        default: break;
      }
    }

    // ================================================================= o mundo (VidaDoLago) e os pontos de interesse
    /** Eventos do lago: só comentários e balbucios (nada disso mexe na pescaria). */
    eventoMundo(ev) {
      const base = { sujeitoId: 'P1', outroId: 'P2' };
      switch (ev.tipo) {
        case 'salto': {
          const ctx = Object.assign({}, base, { perto: !!ev.perto });
          if (ev.perto && this.ids.includes(ev.perto)) { ctx.sujeitoId = ev.perto; ctx.outroId = ev.perto === 'P1' ? 'P2' : 'P1'; }
          this._disparar('salto', ctx);
          this._eventosSirius(this.sirius.barulho(0.2));
          break;
        }
        case 'cardume': this._disparar('cardume', base); break;
        case 'objeto-boiando': this._disparar('objeto-boiando', Object.assign({}, base, { objeto: ev.objeto })); break;
        case 'passaro': this._disparar('passaro', base); break;
        case 'chuva-inicio': this.chovendo = true; this._disparar('chuva-inicio', base); break;
        case 'chuva-fim': this.chovendo = false; this._disparar('chuva-fim', base); break;
        case 'entardecer': this._disparar('entardecer', base); break;
        case 'ponto-surgiu': this._disparar('ponto-surgiu', Object.assign({}, base, { ponto: ev.ponto, zona: ev.zona })); break;
        default: break;
      }
    }

    /** Corta a conversa em andamento; se for uma conversa solta, guarda o resto para talvez retomar. */
    _interromperConversa() {
      const a = this.atual;
      if (!a) return;
      const cena = a.cena;
      if (cena.p >= 6 && !cena.c && cena.g !== 'retomada') {
        // a fala cortada no começo volta inteira; a que já tinha sido quase toda dita, não
        const quaseToda = a.linha && (this.t - a.linha.inicio) >= a.linha.durMs * 0.6;
        const proxima = a.linha ? (quaseToda ? a.i + 1 : a.i) : a.i + 1;
        if (proxima < cena.f.length) this.retomar = { cena, ctx: a.ctx, proxima, t: this.t };
      }
      this._encerrar(true);
    }

    /** Retoma a conversa interrompida: "Como eu ia dizendo..." + o que faltava. */
    _retomar(r) {
      const resto = r.cena.f.slice(r.proxima);
      if (!resto.length) return false;
      let quem = this._pessoaDe(resto[0][0], r.ctx);
      if (!RETOMADAS[quem]) quem = r.cena.f.map((l) => this._pessoaDe(l[0], r.ctx)).find((p) => RETOMADAS[p] && p !== undefined) || null;
      if (!quem) return false;
      const opcoes = RETOMADAS[quem].filter((f) => !this.frasesRecentes.slice(-12).includes(f));
      if (!opcoes.length) return false;
      const frase = opcoes[Math.floor(this.random() * opcoes.length)];
      const f = [[quem, frase, 'neutro']].concat(resto).slice(0, 4);
      const cena = { id: 'retomada.' + r.cena.id, g: 'retomada', p: 6, f, c: false, m: r.cena.m, q: null, w: 1 };
      const ctx = Object.assign({}, r.ctx, { _disparo: this.t });
      if (!this._disponivel(cena, ctx) || !this._liberado(cena, ctx)) return false;
      this._iniciar(cena, ctx);
      return true;
    }

    // ================================================================= escolha da cena
    _ctx(ctx) {
      const c = Object.assign({ modo: this.modo, sirius: this.sirius.estado, chovendo: this.chovendo }, ctx);
      c.sujeito = this.personagens[c.sujeitoId] || this.protagonista;
      c.outro = this.modo === 1 ? this.observador : this.personagens[c.outroId];
      c.protagonista = this.protagonista;
      // quem está pescando de fato (no modo 1 jogador, o outro só assiste)
      c.alemaoPesca = this.modo === 2 || this.protagonista === 'alemao';
      c.alePesca = this.modo === 2 || this.protagonista === 'ale';
      return c;
    }

    _disparar(g, ctx0) {
      const ctx = this._ctx(ctx0);
      ctx._disparo = this.t;                                    // quando o acontecimento real ocorreu
      let chance = CHANCE[g] != null ? CHANCE[g] : 0.5;
      if (g === 'captura') {
        chance = CHANCE_CAPTURA[ctx.tamanho] || 0.5;
        if (ctx.novo || ctx.recorde || ctx.raro || ctx.virou || ctx.muitoMaior || ctx.gangorra || ctx.sequencia >= 3) chance = 1;
        if (ctx.empatou || ctx.outroFalhou || ctx.quaseJunto || ctx.disparou) chance = Math.max(chance, 0.8);
      }
      if ((g === 'fuga' || g === 'rompeu') && (ctx.grande || ctx.repetido)) chance = 1;
      if (this.random() >= chance) return false;
      const cands = this._candidatas(g, ctx);
      if (!cands.length) return false;
      const pmin = Math.min(...cands.map((c) => c.p));
      const cena = this._sortear(cands.filter((c) => c.p === pmin));
      return this._tentar(cena, ctx);
    }

    _confere(valor, cond) {
      if (Array.isArray(cond)) return cond.includes(valor);
      if (cond && typeof cond === 'object') return typeof valor === 'number' && (cond.min == null || valor >= cond.min) && (cond.max == null || valor <= cond.max);
      if (typeof cond === 'boolean') return !!valor === cond;
      return valor === cond;
    }

    _pessoaDe(quem, ctx) {
      if (quem === 'S') return ctx.sujeito;
      if (quem === 'O') return ctx.outro;
      return quem;
    }

    _disponivel(cena, ctx) {
      const temSirius = cena.f.some((l) => l[0] === 'sirius');
      if (temSirius && !cena.c) {
        if (!this.sirius.acordado) return false;
        if (this.t - (this.ultimaPessoa.sirius != null ? this.ultimaPessoa.sirius : -Infinity) < SIRIUS_CD) return false;
      }
      if (this.sirius.chorando && !cena.c && cena.f.some((l) => l[0] === 'maria')) return false;   // Maria está cuidando dele
      for (const l of cena.f) if (!this._pessoaDe(l[0], ctx)) return false;
      return true;
    }

    _candidatas(g, ctx) {
      const lista = this.porGatilho[g] || [];
      const out = [];
      let reserva = null;
      for (const c of lista) {
        if (c.m != null && c.m !== this.modo) continue;
        if (ctx.brigando && c.g === 'silencio' && c.f.length > 2) continue;   // durante a briga, só conversa curta
        let ok = true;
        if (c.q) for (const k of Object.keys(c.q)) { if (!this._confere(ctx[k], c.q[k])) { ok = false; break; } }
        if (!ok || !this._disponivel(c, ctx)) continue;
        const usada = this.usoCena.get(c.id);
        const recente = usada != null && this.t - usada < REUSO_CENA_MS;
        const repete = c.f.some((l) => this.frasesRecentes.includes(l[1]));
        if (recente || repete) { if (!reserva || (usada || 0) < (this.usoCena.get(reserva.id) || 0)) reserva = c; continue; }
        out.push(c);
      }
      // se tudo foi usado recentemente, aceita a cena mais antiga (nunca a mesma da última vez)
      if (!out.length && reserva && (!this.registro.length || this.registro[this.registro.length - 1].cena !== reserva.id) && !reserva.f.some((l) => this.frasesRecentes.slice(-12).includes(l[1]))) out.push(reserva);
      return out;
    }

    _sortear(lista) {
      const total = lista.reduce((s, c) => s + (c.w || 1), 0);
      let r = this.random() * total;
      for (const c of lista) { r -= (c.w || 1); if (r < 0) return c; }
      return lista[lista.length - 1];
    }

    /** O personagem que abre a cena já pode falar de novo? (cenas comuns: intervalo por personagem) */
    _pessoaLivre(cena, ctx) {
      if (cena.p <= 2) return true;
      const primeiro = this._pessoaDe(cena.f[0][0], ctx);
      return this.t - (this.ultimaPessoa[primeiro] != null ? this.ultimaPessoa[primeiro] : -Infinity) >= (POR_PESSOA[primeiro] || 0);
    }

    _liberado(cena, ctx) {
      const cat = CATEGORIA[cena.g] || 'outros';
      const intervalo = INTERVALO_RAPIDO[cat] != null ? INTERVALO_RAPIDO[cat] : (INTERVALO[cena.p] != null ? INTERVALO[cena.p] : 6000);
      if (this.t - this.fimUltima < intervalo) return false;
      if (cena.p > 2 && this.t - (this.ultimaCategoria[cat] != null ? this.ultimaCategoria[cat] : -Infinity) < (POR_CATEGORIA[cat] || 0)) return false;
      if (!this._pessoaLivre(cena, ctx)) return false;
      if (cena.p > 2) {
        this.inicios = this.inicios.filter((x) => this.t - x < 60000);
        if (this.inicios.length + cena.f.length > MAX_FALAS_MINUTO) return false;
      }
      return true;
    }

    _tentar(cena, ctx) {
      if (this.atual) {
        const cur = this.atual.cena;
        // um acontecimento importante corta a fala menos importante e começa NA HORA;
        // uma conversa solta (6) também cede a capturas, mordidas, pontos e acontecimentos perto da boia
        const cat = CATEGORIA[cena.g];
        const cortaConversa = cur.p >= 6 && cena.p <= 5 &&
          (['captura', 'mordida', 'fracasso', 'ponto', 'clima'].includes(cat) || (cat === 'mundo' && ctx.perto));
        if (((cena.p <= 3 && cena.p < cur.p) || cortaConversa) && cur.p !== 1 && this._pessoaLivre(cena, ctx)) {
          if (cur.p >= 6) this._interromperConversa(); else this._encerrar(true);
          this._iniciar(cena, ctx);
          return true;
        }
        this._guardar(cena, ctx);
        return false;
      }
      if (!this._liberado(cena, ctx)) { this._guardar(cena, ctx); return false; }
      this._iniciar(cena, ctx);
      return true;
    }

    _guardar(cena, ctx) {
      if (cena.p > 3) return;                                   // comentários comuns não esperam: somem
      if (!this.pendente || cena.p < this.pendente.cena.p || (cena.p === this.pendente.cena.p)) this.pendente = { cena, ctx, ate: this.t + PENDENTE_MS };
    }

    // ================================================================= reprodução
    _iniciar(cena, ctx) {
      this.atual = { cena, ctx, i: -1, linha: null, fimLinha: 0 };
      if (cena.g === 'silencio') { this.ultimaEspontanea = this.t; this.conversaDevida = this._entre(90000, 140000); }
      this.pendente = null;
      const cat = CATEGORIA[cena.g] || 'outros';
      this.ultimaCategoria[cat] = this.t;
      this.usoCena.set(cena.id, this.t);
      this._proximaLinha(null);
    }

    _encerrar(interrompida) {
      if (!this.atual) return;
      this.fimUltima = this.t;
      if (interrompida && this.atual.linha) this.atual.linha.interrompida = true;
      const ult = this.registro[this.registro.length - 1];
      if (interrompida && ult && ult.cena === this.atual.cena.id && ult.fim > this.t) { ult.fim = this.t; ult.cortada = true; }
      this.atual = null;
      this.silencioAlvo = this._entre(30000, 60000);
    }

    _proximaLinha(players) {
      const a = this.atual;
      a.i++;
      if (a.i >= a.cena.f.length) { this._encerrar(false); return; }
      const [quem, modelo, emo] = a.cena.f[a.i];
      const pessoa = this._pessoaDe(quem, a.ctx);
      // a cena só continua se ainda fizer sentido (ex.: briga terminou)
      if (a.cena.e && players) {
        const p = players[a.ctx.sujeitoId];
        if (!p || p.state !== a.cena.e) { this._encerrar(true); return; }
      }
      if (pessoa === 'maria' && this.sirius.chorando && !a.cena.c) { this._encerrar(true); return; }
      const texto = this._montar(modelo, a.ctx, pessoa);
      const estilo = pessoa === 'sirius' ? (a.cena.c && /BUÁ|UÁÁ/.test(texto) ? 'choro' : 'balbucio') : 'fala';
      const revelar = estilo === 'fala' ? Math.round(texto.length * 30) : 120;
      const dur = estilo === 'fala' ? Math.max(1900, Math.min(4600, 1000 + texto.length * 62)) : (estilo === 'choro' ? 1900 : 1500);
      a.linha = { quem, pessoa, nome: NOMES[pessoa], texto, emo: emo || (estilo === 'choro' ? 'choro' : (pessoa === 'sirius' ? this._humorBalbucio(modelo) : 'neutro')),
        estilo, inicio: this.t, revelarMs: revelar, durMs: dur, cena: a.cena.id, prioridade: a.cena.p };
      a.fimLinha = this.t + dur;
      this.ultimaPessoa[pessoa] = this.t;
      this.inicios.push(this.t);
      this.frasesRecentes.push(modelo);
      if (this.frasesRecentes.length > MEMORIA_FRASES) this.frasesRecentes.shift();
      this.registro.push({ t: this.t, cena: a.cena.id, g: a.cena.g, p: a.cena.p, pessoa, texto, modelo, estilo, fim: this.t + dur,
        disparo: a.ctx._disparo, sirius: this.sirius.estado, c: !!a.cena.c, primeira: a.i === 0, m: a.cena.m || null });
      if (this.registro.length > 400) this.registro.shift();
      if (estilo === 'balbucio') this.sons.push({ tipo: 'balbucio', texto });
      else if (estilo === 'fala') this.sons.push({ tipo: 'fala', pessoa, texto, revelarMs: revelar });
    }

    _avancarCena(players) {
      if (this.atual) {
        if (this.t >= this.atual.fimLinha) {
          // pequena pausa entre falas da mesma cena
          if (!this.atual.pausa) { this.atual.pausa = this.t + 220; this.atual.linhaAnterior = this.atual.linha; this.atual.linha = null; }
          if (this.t >= this.atual.pausa) { this.atual.pausa = null; this._proximaLinha(players); }
        }
      }
      if (!this.atual && this.pendente) {
        const pd = this.pendente;
        if (this.t > pd.ate) this.pendente = null;
        else if (this._liberado(pd.cena, pd.ctx) && this._disponivel(pd.cena, pd.ctx)) { this.pendente = null; this._iniciar(pd.cena, pd.ctx); }
      }
    }

    // ================================================================= texto
    _humorBalbucio(modelo) {
      const m = /\{balbucio:(\w+)\}/.exec(modelo);
      return m ? m[1] : 'feliz';
    }

    balbucio(humor) {
      const lista = BALBUCIOS[humor] || BALBUCIOS.feliz;
      if ((humor === 'feliz' || humor === 'curioso') && this.random() < 0.3) {
        // variação montada com sílabas de bebê
        const n = 1 + Math.floor(this.random() * 3);
        const partes = [];
        for (let i = 0; i < n; i++) partes.push(SILABAS[Math.floor(this.random() * SILABAS.length)]);
        const fim = humor === 'curioso' ? '?' : '!';
        return partes.join(this.random() < 0.5 ? ' ' : '') + fim;
      }
      return lista[Math.floor(this.random() * lista.length)];
    }

    _montar(modelo, ctx, pessoa) {
      const D = this.dados;
      const gen = ARTIGO[ctx.genero === 'f' ? 'f' : 'm'];
      const isca = ctx.isca && D.iscaPorId[ctx.isca] ? D.iscaPorId[ctx.isca].nome.toLowerCase() : 'isca';
      const regiao = ctx.regiao && D.REGIOES[ctx.regiao] ? D.REGIOES[ctx.regiao].nome.toLowerCase() : 'lagoa';
      return modelo
        .replace(/\{balbucio(?::(\w+))?\}/g, (m0, h) => this.balbucio(h || 'feliz'))
        .replace(/\{peixe\}/g, ctx.peixe || 'peixe')
        .replace(/\{Peixe\}/g, ctx.peixe ? ctx.peixe.charAt(0).toUpperCase() + ctx.peixe.slice(1) : 'Peixe')
        .replace(/\{um\}/g, gen.um).replace(/\{o\}/g, gen.o)
        .replace(/\{Um\}/g, gen.um.charAt(0).toUpperCase() + gen.um.slice(1)).replace(/\{O\}/g, gen.o.toUpperCase())
        .replace(/\{kg\}/g, ctx.kg != null ? kgTxt(ctx.kg) : '')
        .replace(/\{m\}/g, ctx.m != null ? Math.round(ctx.m) + ' metros' : '')
        .replace(/\{isca\}/g, isca).replace(/\{regiao\}/g, regiao)
        .replace(/\{placar\}/g, ctx.placar || '')
        .replace(/\{zona\}/g, ctx.zona && D.zonaPorId && D.zonaPorId[ctx.zona] ? D.zonaPorId[ctx.zona].nome : 'lagoa')
        .replace(/\{vocS\}/g, VOCATIVO_MARIA[ctx.sujeito] || '')
        .replace(/\{vocO\}/g, VOCATIVO_MARIA[ctx.outro] || '');
    }

    // ================================================================= saída para a tela
    linha() { return this.atual && this.atual.linha ? this.atual.linha : null; }
    falandoAgora() { const l = this.linha(); return l ? l.pessoa : null; }
    familia() {
      return { sirius: this.sirius.estado, mariaOcupada: this.sirius.chorando, falando: this.falandoAgora() };
    }
    tirarSons() { const s = this.sons; this.sons = []; return s; }

    /** Só para testes e demonstração: força o Sirius a chorar, dormir ou acordar. */
    forcarSirius(estado) { this._eventosSirius(this.sirius.forcar(estado)); }

    /** Só para testes e demonstração: começa uma cena pelo id (ignora sorteio e intervalos). */
    forcarCena(id, sujeitoId, extra) {
      const cena = this.cenas.find((c) => c.id === id);
      if (!cena) return false;
      if (this.atual) this._encerrar(true);
      const s = sujeitoId || 'P1';
      const ctx = this._ctx(Object.assign({ sujeitoId: s, outroId: s === 'P1' ? 'P2' : 'P1', peixe: 'tilápia', genero: 'f', kg: 1.2, placar: '2 a 1' }, extra || {}));
      ctx._disparo = this.t;
      this._iniciar(cena, ctx);
      return true;
    }
  }

  Narrador.NOMES = NOMES;
  Narrador.BALBUCIOS = BALBUCIOS;
  Narrador.SILABAS = SILABAS;
  Narrador.CATEGORIA = CATEGORIA;
  Narrador.INTERVALO = INTERVALO;
  Narrador.POR_PESSOA = POR_PESSOA;
  Narrador.POR_CATEGORIA = POR_CATEGORIA;
  Narrador.MAX_FALAS_MINUTO = MAX_FALAS_MINUTO;
  Narrador.PENDENTE_MS = PENDENTE_MS;
  root.HF = root.HF || {};
  root.HF.Narrador = Narrador;
  if (typeof module !== 'undefined' && module.exports) module.exports = Narrador;
})(typeof window !== 'undefined' ? window : globalThis);
