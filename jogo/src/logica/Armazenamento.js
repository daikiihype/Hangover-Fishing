/*
 * Hangover Fishing — versão jogável
 * Armazenamento local (navegador) para as opções e o catálogo. Sem servidor.
 * Se o navegador bloquear o armazenamento (modo privado, etc.), o jogo funciona
 * normalmente e só não lembra entre sessões.
 */
(function (root) {
  'use strict';

  class Armazenamento {
    constructor(store) {
      this.store = store !== undefined ? store : (() => { try { return root.localStorage; } catch (e) { return null; } })();
      this.memoria = {};
    }
    ler(chave, padrao) {
      try {
        const txt = this.store ? this.store.getItem(chave) : this.memoria[chave];
        if (txt == null) return padrao;
        return JSON.parse(txt);
      } catch (e) { return padrao; }
    }
    gravar(chave, valor) {
      const txt = JSON.stringify(valor);
      this.memoria[chave] = txt;
      try { if (this.store) this.store.setItem(chave, txt); return true; } catch (e) { return false; }
    }
    apagar(chave) {
      delete this.memoria[chave];
      try { if (this.store) this.store.removeItem(chave); } catch (e) { /* ignorar */ }
    }
  }

  // ---------------------------------------------------------------- opções
  const OPCOES_PADRAO = {
    volumeGeral: 0.8, volumeEfeitos: 0.8, volumeMusica: 0.5, volumeVozes: 0.7,
    efeitos: true, musica: true, vozes: true, regioes: true, vibracao: false, dicas: true
  };

  class Opcoes {
    constructor(armazenamento) {
      this.arm = armazenamento;
      this.valores = Object.assign({}, OPCOES_PADRAO, this._valida(this.arm.ler('hf.opcoes.v1', {})));
      this.ouvintes = [];
    }
    _valida(v) {
      const out = {};
      if (!v || typeof v !== 'object') return out;
      for (const k of Object.keys(OPCOES_PADRAO)) {
        if (typeof OPCOES_PADRAO[k] === 'number' && typeof v[k] === 'number' && isFinite(v[k])) out[k] = Math.max(0, Math.min(1, v[k]));
        if (typeof OPCOES_PADRAO[k] === 'boolean' && typeof v[k] === 'boolean') out[k] = v[k];
      }
      return out;
    }
    get(k) { return this.valores[k]; }
    set(k, v) {
      const ok = this._valida({ [k]: v });
      if (!(k in ok)) return;
      this.valores[k] = ok[k];
      this.arm.gravar('hf.opcoes.v1', this.valores);
      for (const fn of this.ouvintes) fn(k, ok[k]);
    }
    onChange(fn) { this.ouvintes.push(fn); }
    restaurar() { for (const k of Object.keys(OPCOES_PADRAO)) this.set(k, OPCOES_PADRAO[k]); }
  }

  // ---------------------------------------------------------------- catálogo
  class Catalogo {
    constructor(armazenamento) {
      this.arm = armazenamento;
      const d = this.arm.ler('hf.catalogo.v1', null);
      this.dados = d && d.especies ? d : { especies: {}, objetos: {}, totalCapturas: 0 };
    }
    estado(id) { return this.dados.especies[id] || null; }
    objeto(id) { return this.dados.objetos[id] || null; }
    descobertos() { return Object.keys(this.dados.especies).length; }
    /** Registra uma captura. Devolve { novo, recorde } para a tela e os diálogos. */
    registrar(c) {
      const grupo = c.objeto ? this.dados.objetos : this.dados.especies;
      const atual = grupo[c.id];
      const agora = new Date().toISOString();
      const recorde = !!atual && c.pesoKg > atual.maiorKg;     // maior que o maior exemplar anterior
      if (!atual) {
        grupo[c.id] = { quantidade: 1, maiorKg: c.pesoKg, primeiraVez: agora, quem: c.quem || null, regiao: c.regiao || null, isca: c.isca || null };
      } else {
        atual.quantidade++;
        if (c.pesoKg > atual.maiorKg) Object.assign(atual, { maiorKg: c.pesoKg, quem: c.quem || null, regiao: c.regiao || null, isca: c.isca || null });
      }
      if (!c.objeto) this.dados.totalCapturas = (this.dados.totalCapturas || 0) + 1;
      this.arm.gravar('hf.catalogo.v1', this.dados);
      return { novo: !atual, recorde };
    }
    apagarTudo() {
      this.dados = { especies: {}, objetos: {}, totalCapturas: 0 };
      this.arm.apagar('hf.catalogo.v1');
    }
  }

  const api = { Armazenamento, Opcoes, Catalogo, OPCOES_PADRAO };
  root.HF = root.HF || {};
  Object.assign(root.HF, api);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
