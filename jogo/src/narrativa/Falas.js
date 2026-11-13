/*
 * Hangover Fishing — narrativa
 * Falas: registro das cenas de diálogo. O CONTEÚDO fica em src/narrativa/falas/*.js;
 * este arquivo só guarda e normaliza. Para acrescentar falas, basta criar ou editar um
 * arquivo de dados — o motor (Narrador.js) não muda.
 *
 * Formato de uma cena (atalho C(g, q, f, extra)):
 *   g  gatilho — o acontecimento real que pode disparar a cena (ver Narrador.CATEGORIA)
 *   q  condições sobre o contexto, ex.: { sujeito: 'alemao', tamanho: ['grande', 'excepcional'] }
 *        sujeito/outro/protagonista: 'alemao' | 'ale' · sirius: 'acordado' | 'dormindo' ...
 *        valores: igual, lista (um deles), booleano, { min, max }
 *   f  falas: [quem, texto, emoção?] — quem: 'alemao' | 'ale' | 'maria' | 'sirius'
 *        | 'S' (o pescador do evento) | 'O' (o outro adulto; no modo 1 jogador, quem assiste)
 *   extra: p (prioridade 1–6), m (modo 1 ou 2), w (peso), e (estado que a cena exige do
 *        pescador, ex.: 'FIGHTING'), c (true = cena do choro: a Maria pode falar)
 *
 * Marcadores no texto: {peixe} {Peixe} {um} {o} {kg} {m} {isca} {regiao} {placar}
 *   {zona} (o lugar do lago: "Margem Rasa", "Baía dos Lírios", "Curva das Pedras", "Poço Profundo")
 *   {vocS}/{vocO} (como a Maria chama o pescador: "Lucas" ou "pai")
 *   {balbucio:humor} — balbucio do Sirius (feliz, curioso, protesto, surpresa, bobo, sono, choro)
 *
 * Cânone (GDD 2.4, missão "A alma do jogo" e Operação Nova Identidade): ALE chama Lucas de
 * "Alemão" e Maria de "Maria"; Maria chama Lucas de "Lucas" e ALE de "pai" (ou "ALE", quando
 * soa natural); Lucas chama Maria de "Maria"; todos chamam Sirius de "Sirius".
 * Como o Lucas chama o ALE ainda não está definido: ele não usa vocativo para o ALE.
 */
(function (root) {
  'use strict';

  const PRIORIDADE_PADRAO = {
    'sirius-inquieto': 1, 'sirius-chorando': 1, 'sirius-acalmando': 1, 'sirius-acalmou': 2,
    fuga: 3, rompeu: 3, perdida: 3, objeto: 4, silencio: 6,
    // Operação Nova Identidade
    'ponto-acerto': 4, 'chuva-inicio': 4, entardecer: 4
  };

  const Falas = {
    cenas: [],
    grupos: {},
    adicionar(grupo, lista) {
      lista.forEach((c, i) => {
        c.id = grupo + '.' + (i + 1);
        if (c.p == null) c.p = PRIORIDADE_PADRAO[c.g] || 5;
        this.cenas.push(c);
      });
      this.grupos[grupo] = (this.grupos[grupo] || 0) + lista.length;
    },
    /** Atalho de escrita para os arquivos de dados. */
    C(g, q, f, extra) { return Object.assign({ g, q: q || null, f }, extra || {}); }
  };

  root.HF = root.HF || {};
  root.HF.Falas = Falas;
  if (typeof module !== 'undefined' && module.exports) module.exports = Falas;
})(typeof window !== 'undefined' ? window : globalThis);
