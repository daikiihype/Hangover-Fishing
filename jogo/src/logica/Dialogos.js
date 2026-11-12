/*
 * Hangover Fishing — versão jogável
 * Dialogos: decide QUANDO um personagem fala e O QUÊ. Sem Phaser (testável no Node).
 *
 * Princípios (missão, seção 5):
 *   - falas ocasionais: intervalo mínimo global, espera própria de cada situação e
 *     sorteio de probabilidade. Nunca uma conversa constante;
 *   - personalidade: Alemão expressivo e espontâneo; ALE tranquilo, divertido e observador;
 *   - nada de informações pessoais inventadas: as falas só comentam a pescaria;
 *   - só visual: o diretor nunca mexe na pescaria.
 *
 * Situações: peixe grande, peixe perdido, linha rompida, seca (os dois sem pegar nada),
 * objeto estranho, virada no placar, capturas em sequência, espécie nova no catálogo.
 * Conteúdo: [PROPOSTA].
 */
(function (root) {
  'use strict';

  // {quem} = quem falou; {outro} = o outro personagem; {peixe} = nome do peixe; {kg} = peso
  const FALAS = {
    grande: {
      alemao: { proprio: ['OLHA O TAMANHO DISSO!', 'Esse vai pra parede!', 'Segura essa, {outro}!', 'Que monstro! {kg} de {peixe}!'],
        outro: ['Tá de brincadeira! {kg} de {peixe}?!', 'Ah, não... {kg}?!', 'Isso foi sorte, {outro}!'] },
      ale: { proprio: ['Esse aqui tem história.', 'Paciência paga, {outro}.', '{peixe} assim não é todo dia.'],
        outro: ['Bonito. Agora tira a foto.', 'Até que enfim um decente, {outro}.', '{peixe} desse tamanho vai render conversa.'] },
      solo: { alemao: ['OLHA O TAMANHO DISSO!', 'Esse vai pra parede!', 'Que {peixe}! {kg}!'],
        ale: ['Esse aqui tem história.', '{peixe} assim não é todo dia.', 'Paciência paga.'] }
    },
    fuga: {
      alemao: { proprio: ['Volta aqui!', 'Ele cuspiu o anzol!', 'Não acredito...'],
        outro: ['Escapou, {outro}? Acontece até com os melhores!', 'Esse aí riu da sua cara, {outro}.'] },
      ale: { proprio: ['Faz parte.', 'Esse aprendeu a lição. Eu também.', 'Linha frouxa não perdoa.'],
        outro: ['Linha frouxa, {outro}. Linha frouxa.', 'Segura firme da próxima vez.'] },
      solo: { alemao: ['Volta aqui!', 'Ele cuspiu o anzol!'], ale: ['Faz parte.', 'Linha frouxa não perdoa.'] }
    },
    rompeu: {
      alemao: { proprio: ['ARREBENTOU!', 'Era um monstro, eu juro!', 'Minha linha!'],
        outro: ['Até você, {outro}?!', 'Puxou com vontade, hein!'] },
      ale: { proprio: ['Puxei demais. Acontece.', 'A linha pediu arrego.', 'Esse era forte.'],
        outro: ['Força não é tudo, {outro}.', 'Solta um pouco quando ficar vermelho.'] },
      solo: { alemao: ['ARREBENTOU!', 'Era um monstro, eu juro!'], ale: ['Puxei demais. Acontece.', 'A linha pediu arrego.'] }
    },
    seca: {
      alemao: { proprio: ['Será que os peixes tiraram folga hoje?', 'Cadê todo mundo?', 'Bora mudar de lugar?'] },
      ale: { proprio: ['Peixe também tem hora.', 'Muda a isca. Ou o lugar.', 'Lá no fundo deve ter coisa grande.'] },
      solo: { alemao: ['Cadê todo mundo?', 'Bora mudar de lugar?'], ale: ['Muda a isca. Ou o lugar.', 'Peixe também tem hora.'] }
    },
    objeto: {
      alemao: { proprio: ['{peixe}?! Cadê o resto do pescador?', 'Pesquei lixo... e briguei com ele!', 'Isso conta ponto?'],
        outro: ['Bela pescaria, {outro}!', 'Guarda pra coleção, {outro}!'] },
      ale: { proprio: ['Pelo menos o rio ficou mais limpo.', 'Isso não vai pro catálogo de peixes.', 'Já pesquei coisa pior.'],
        outro: ['Que troféu, {outro}.', 'O rio agradece, {outro}.'] },
      solo: { alemao: ['{peixe}?! Sério?', 'Pesquei lixo... e briguei com ele!'], ale: ['Pelo menos o rio ficou mais limpo.', 'Já pesquei coisa pior.'] }
    },
    virada: {
      alemao: { proprio: ['Passei você, {outro}!', 'Agora sou eu na frente!'], outro: ['Calma que eu viro!', 'Ainda tem muito peixe nesse lago!'] },
      ale: { proprio: ['Placar arrumado.', 'Devagar e sempre, {outro}.'], outro: ['Deixa ele se animar.', 'Ainda é cedo, {outro}.'] }
    },
    sequencia: {
      alemao: { proprio: ['Tá dando peixe pros dois!', 'Que fase boa!'] },
      ale: { proprio: ['Hoje o rio tá generoso.', 'Assim que eu gosto.'] }
    },
    novo: {
      alemao: { proprio: ['Peixe novo! Nunca tinha pegado {peixe}!', 'Pro catálogo! {peixe}!'], outro: ['Que peixe é esse, {outro}?'] },
      ale: { proprio: ['{peixe}! Ainda não tinha no caderno.', '{peixe}. Vai pro caderno.'], outro: ['Olha só: {peixe}.'] },
      solo: { alemao: ['Peixe novo: {peixe}!', 'Pro catálogo! {peixe}!'], ale: ['{peixe}! Ainda não tinha no caderno.', '{peixe}. Vai pro caderno.'] }
    }
  };

  // probabilidade de falar quando a situação acontece + espera própria da situação (ms)
  const REGRAS = {
    novo: { p: 0.9, espera: 20000, prioridade: 5 },
    grande: { p: 0.75, espera: 30000, prioridade: 4 },
    objeto: { p: 0.85, espera: 25000, prioridade: 4 },
    rompeu: { p: 0.6, espera: 35000, prioridade: 3 },
    virada: { p: 0.6, espera: 60000, prioridade: 3 },
    fuga: { p: 0.45, espera: 35000, prioridade: 2 },
    sequencia: { p: 0.5, espera: 60000, prioridade: 2 },
    seca: { p: 1, espera: 120000, prioridade: 1 }
  };
  const INTERVALO_MINIMO_MS = 15000;     // entre duas falas quaisquer
  const SECA_MS = 75000;                 // os dois sem capturar nada por 75 s
  const SEQUENCIA_MS = 8000;             // capturas dos dois com até 8 s de diferença
  const NOMES = { alemao: 'ALEMÃO', ale: 'ALE' };

  class Dialogos {
    /**
     * opts.modo 1 | 2; opts.personagens { P1: 'alemao', P2: 'ale' }; opts.random () → [0, 1)
     */
    constructor(opts) {
      this.modo = opts.modo || 2;
      this.personagens = opts.personagens || { P1: 'alemao', P2: 'ale' };
      this.random = opts.random || Math.random;
      this.t = 0;                          // relógio de jogo (ms), avançado por update(dt)
      this.ultimaFala = -Infinity;
      this.ultimaPor = {};                 // situação → instante
      this.ultimaCaptura = 0;              // para a seca
      this.capturas = { P1: 0, P2: 0 };
      this.lider = null;
      this.ultimaCapturaDe = { P1: -Infinity, P2: -Infinity };
      this.atual = null;                   // { quem, nome, texto, ate, desde }
      this.historico = [];
      this.ultimoTexto = {};
    }

    update(dt) {
      this.t += Math.max(0, dt || 0);
      if (this.atual && this.t >= this.atual.ate) this.atual = null;
      if (this.t - this.ultimaCaptura >= SECA_MS) {
        // os dois (ou o único jogador) sem nada: um deles comenta, com dica de estratégia.
        // Se não puder falar agora (outra fala recente), tenta de novo em 10 s.
        const quem = this._ids()[Math.floor(this.random() * this._ids().length)];
        this.ultimaCaptura = this._tenta('seca', quem, 'proprio', {}) ? this.t : this.t - SECA_MS + 10000;
      }
      return this.atual;
    }

    /** Uma captura (peixe ou objeto). info = { id, nome, pesoKg, objeto, grande, novo } */
    captura(jogador, info) {
      this.ultimaCaptura = this.t;
      if (info.objeto) return this._fala('objeto', jogador, info);
      this.capturas[jogador]++;
      const outro = jogador === 'P1' ? 'P2' : 'P1';
      const antes = this.ultimaCapturaDe[outro];
      this.ultimaCapturaDe[jogador] = this.t;
      if (info.novo && this._fala('novo', jogador, info)) return true;
      if (info.grande && this._fala('grande', jogador, info)) return true;
      if (this.modo === 2) {
        const lider = this.capturas.P1 === this.capturas.P2 ? this.lider : (this.capturas.P1 > this.capturas.P2 ? 'P1' : 'P2');
        const virou = lider && this.lider && lider !== this.lider;
        this.lider = lider;
        if (virou && this._fala('virada', jogador, info)) return true;
        if (this.t - antes <= SEQUENCIA_MS && this._fala('sequencia', jogador, info)) return true;
      }
      return false;
    }

    perdeu(jogador, motivo) {
      return this._fala(motivo === 'linha-rompida' ? 'rompeu' : 'fuga', jogador, {});
    }

    _ids() { return this.modo === 1 ? ['P1'] : ['P1', 'P2']; }

    /** Escolhe quem comenta: o próprio jogador ou (no modo 2) às vezes o outro. */
    _fala(situacao, jogador, info) {
      const conj = FALAS[situacao];
      if (this.modo === 2 && conj[this.personagens[jogador === 'P1' ? 'P2' : 'P1']].outro && this.random() < 0.4) {
        const outro = jogador === 'P1' ? 'P2' : 'P1';
        return this._tenta(situacao, outro, 'outro', info, jogador);
      }
      return this._tenta(situacao, jogador, 'proprio', info, jogador);
    }

    _tenta(situacao, quem, papel, info, sobre) {
      const regra = REGRAS[situacao];
      if (this.t - this.ultimaFala < INTERVALO_MINIMO_MS && !(this.atual === null && regra.prioridade >= 5 && this.t - this.ultimaFala > 6000)) return false;
      if (this.t - (this.ultimaPor[situacao] || -Infinity) < regra.espera) return false;
      if (this.random() >= regra.p) return false;
      const pers = this.personagens[quem];
      const conj = FALAS[situacao];
      let lista = this.modo === 1 && conj.solo ? conj.solo[pers] : (conj[pers] && conj[pers][papel]);
      if (!lista || !lista.length) return false;
      // não repete a mesma fala duas vezes seguidas
      const ult = this.ultimoTexto[situacao + pers];
      const opcoes = lista.length > 1 ? lista.filter((x) => x !== ult) : lista;
      const modelo = opcoes[Math.floor(this.random() * opcoes.length)];
      this.ultimoTexto[situacao + pers] = modelo;
      const outroId = quem === 'P1' ? 'P2' : 'P1';
      const texto = modelo
        .replace(/\{outro\}/g, NOMES[this.personagens[outroId]] || '')
        .replace(/\{peixe\}/g, info.nome || 'peixe')
        .replace(/\{kg\}/g, info.pesoKg != null ? info.pesoKg.toFixed(2).replace('.', ',') + ' kg' : '');
      const dur = Math.min(4200, 2200 + texto.length * 45);
      this.atual = { quem, personagem: pers, nome: NOMES[pers], texto, situacao, desde: this.t, ate: this.t + dur, sobre: sobre || quem };
      this.ultimaFala = this.t;
      this.ultimaPor[situacao] = this.t;
      this.historico.push(this.atual);
      if (this.historico.length > 50) this.historico.shift();
      return true;
    }
  }

  Dialogos.FALAS = FALAS;
  Dialogos.REGRAS = REGRAS;
  Dialogos.INTERVALO_MINIMO_MS = INTERVALO_MINIMO_MS;
  Dialogos.SECA_MS = SECA_MS;
  root.HF = root.HF || {};
  root.HF.Dialogos = Dialogos;
  if (typeof module !== 'undefined' && module.exports) module.exports = Dialogos;
})(typeof window !== 'undefined' ? window : globalThis);
