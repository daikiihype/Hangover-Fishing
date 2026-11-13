/*
 * Hangover Fishing — versão jogável (Operação Madrugada)
 * DadosPesca: espécies, objetos, iscas e regiões. Só dados e funções puras (sem Phaser).
 *
 * Status do conteúdo: [PROPOSTA]. Os nomes das espécies vêm das folhas do criador
 * (`arte 3.jpg`, `peixes.jpg`) e do GDD (espécies provisórias). Pesos, chances e
 * comportamentos são valores de JOGO, não afirmações sobre a biologia real.
 *
 * Regra de preservação (missão, D3): nas ÁGUAS ABERTAS, com a isca MINHOCA, as tabelas
 * reproduzem exatamente o P1 (perfis rápido 45 % · pesado 25 % · arisco 30 %, mesmos
 * pesos e comportamentos). Tilápia = perfil "rápido", Carpa = "pesado", Traíra = "arisco".
 * A ORDEM da lista de espécies preserva a ordem do sorteio do P1 (rápido, pesado, arisco).
 */
(function (root) {
  'use strict';

  const P1 = (root.HF && root.HF.DEFAULT_CONFIG) ||
    (typeof require === 'function' ? require('../../../prototipos/p1-pesca/src/logic/config.js').DEFAULT_CONFIG : null);
  const perfilP1 = (id) => {
    const p = P1.fishProfiles.find((x) => x.id === id);
    return { restPull: p.restPull, runPull: p.runPull, runMs: p.runMs.slice(), restMs: p.restMs.slice(), tireRate: p.tireRate };
  };

  // ---------------------------------------------------------------- espécies
  // ordem = ordem do sorteio. Tilápia, Carpa e Traíra mantêm a ordem rápido → pesado → arisco do P1.
  const ESPECIES = [
    { id: 'lambari', nome: 'Lambari', genero: 'm', pesoKg: [0.05, 0.3], raridade: 'comum', dificuldade: 1,
      comportamento: { restPull: 0.15, runPull: 0.6, runMs: [400, 800], restMs: [600, 1300], tireRate: 0.16 },
      descricao: 'Pequeno, prateado e sempre com fome. Briga curta e nervosa.',
      dica: 'Fica perto da margem. Massa ou minhoca, arremesso curto.' },
    { id: 'tilapia', nome: 'Tilápia', genero: 'f', pesoKg: [0.3, 1.2], raridade: 'comum', dificuldade: 2, perfilP1: 'rapido',
      descricao: 'O peixe mais comum do lago. Puxões curtos e frequentes.',
      dica: 'Aparece em todo lugar. Com massa, morde muito mais.' },
    { id: 'carpa', nome: 'Carpa', genero: 'f', pesoKg: [2, 6], raridade: 'incomum', dificuldade: 3, perfilP1: 'pesado',
      descricao: 'Pesada e teimosa: puxões longos e fortes. Cansa devagar.',
      dica: 'Águas abertas e fundo. Gosta de massa e de coração.' },
    { id: 'bagre', nome: 'Bagre', genero: 'm', pesoKg: [2, 6.5], raridade: 'incomum', dificuldade: 4,
      // mais forte que a carpa (puxão), com corridas mais curtas (balanceamento de 12/11/2026)
      comportamento: { restPull: 0.45, runPull: 0.9, runMs: [1000, 2200], restMs: [1400, 2400], tireRate: 0.075 },
      descricao: 'Mora no fundo. Bigodes, cabeça grande e muita força.',
      dica: 'Águas profundas. Coração de galinha é a isca dele.' },
    { id: 'traira', nome: 'Traíra', genero: 'f', pesoKg: [0.8, 3], raridade: 'comum', dificuldade: 3, perfilP1: 'arisco',
      descricao: 'Predadora imprevisível: alterna pausas e arrancadas sem ritmo.',
      dica: 'Em qualquer região. A isca artificial atrai muito mais.' },
    { id: 'tucunare', nome: 'Tucunaré', genero: 'm', pesoKg: [1, 4], raridade: 'rara', dificuldade: 4,
      comportamento: { restPull: 0.3, runPull: 0.9, runMs: [600, 1400], restMs: [600, 1600], tireRate: 0.1 },
      descricao: 'Caçador valente das águas abertas. Arrancadas fortes e frequentes.',
      dica: 'Só ataca isca artificial. Melhor nas águas abertas.' },
    { id: 'dourado', nome: 'Dourado', genero: 'm', pesoKg: [3, 9], raridade: 'muito rara', dificuldade: 5,
      comportamento: { restPull: 0.35, runPull: 1.0, runMs: [800, 1800], restMs: [500, 1400], tireRate: 0.08 },
      descricao: 'O troféu do lago. Forte, rápido e quase nunca desiste.',
      dica: 'Isca artificial nas águas profundas. Paciência e tensão sob controle.' }
  ];
  for (const e of ESPECIES) if (e.perfilP1) e.comportamento = perfilP1(e.perfilP1);

  // Capturas inusitadas (GDD S6 [PROPOSTA]): nunca punitivas, não contam como peixe.
  const OBJETOS = [
    { id: 'bota', nome: 'Bota velha', genero: 'f', pesoKg: [0.6, 1.4], chance: 40, descricao: 'Sem o pé esquerdo. E sem o dono.' },
    { id: 'lata', nome: 'Lata amassada', genero: 'f', pesoKg: [0.05, 0.2], chance: 40, descricao: 'Alguém esqueceu de levar o lixo.' },
    { id: 'pneu', nome: 'Pneu velho', genero: 'm', pesoKg: [3, 6], chance: 20, descricao: 'Pesado, sujo e totalmente inútil.' }
  ];
  const COMPORTAMENTO_OBJETO = { restPull: 0.12, runPull: 0.12, runMs: [1000, 2000], restMs: [1000, 2000], tireRate: 0.3 };

  // ---------------------------------------------------------------- regiões
  // Plano de regiões (docs/PLANO_REGIOES_DE_PESCA.md, tabela 4), com as espécies no lugar dos perfis.
  // faixaPeso: fração da faixa de peso de cada espécie (0–1 = a faixa inteira; 1,2 = passa do máximo).
  // Nomes de lugar (Operação Nova Identidade): só a apresentação mudou; tabelas e limites são os mesmos.
  const REGIOES = {
    margem: {
      id: 'margem', nome: 'Margem Rasa', curta: 'MARGEM RASA', ate: 14, espera: [2000, 5000], faixaPeso: [0, 0.6], forca: 1, cansaco: 1,
      chances: { lambari: 30, tilapia: 30, carpa: 10, traira: 30, objeto: 3 },
      resumo: 'Mais mordidas, peixes menores, brigas curtas.'
    },
    aberta: {
      id: 'aberta', nome: 'Águas abertas', curta: 'ÁGUAS ABERTAS', ate: 22, espera: null /* = P1 */, faixaPeso: [0, 1], forca: 1, cansaco: 1,
      chances: { tilapia: 45, carpa: 25, traira: 30 },
      resumo: 'O lago de sempre: mistura equilibrada. Inclui a Baía dos Lírios e a Curva das Pedras.'
    },
    fundo: {
      id: 'fundo', nome: 'Poço Profundo', curta: 'POÇO PROFUNDO', ate: Infinity, espera: [6500, 12000], faixaPeso: [0.4, 1.1], forca: 1.15, cansaco: 1,
      chances: { tilapia: 10, carpa: 15, bagre: 45, traira: 30, objeto: 2 },
      resumo: 'Espera longa, peixes pesados e fortes.'
    }
  };
  const ORDEM_REGIOES = ['margem', 'aberta', 'fundo'];

  // Zonas visuais do lago (Operação Nova Identidade): 4 lugares com identidade própria sobre as
  // 3 regiões mecânicas. Lírios e Pedras usam a tabela das águas abertas (referência do P1);
  // a diferença de jogo entre elas vem dos pontos de interesse típicos de cada uma.
  const ZONAS = [
    { id: 'rasa', nome: 'Margem Rasa', curta: 'MARGEM RASA', de: 0, ate: 14, regiao: 'margem',
      resumo: 'Água clara, fundo de areia, cardumes pequenos. Mordidas frequentes.' },
    { id: 'lirios', nome: 'Baía dos Lírios', curta: 'BAÍA DOS LÍRIOS', de: 14, ate: 18, regiao: 'aberta',
      resumo: 'Vitórias-régias e sombra. Peixes se escondem perto das plantas.' },
    { id: 'pedras', nome: 'Curva das Pedras', curta: 'CURVA DAS PEDRAS', de: 18, ate: 22, regiao: 'aberta',
      resumo: 'Pedras e correnteza da entrada do rio. Predadores rondam; a isca artificial brilha aqui.' },
    { id: 'poco', nome: 'Poço Profundo', curta: 'POÇO PROFUNDO', de: 22, ate: Infinity, regiao: 'fundo',
      resumo: 'Água escura, troncos submersos. Risco maior, recompensa maior.' }
  ];
  const zonaPorId = Object.fromEntries(ZONAS.map((z) => [z.id, z]));
  /** Zona visual pela distância de POUSO da boia. */
  function zonaDaDistancia(m) {
    for (const z of ZONAS) if (m < z.ate) return z.id;
    return 'poco';
  }

  /** Região pela distância de POUSO da boia (D1/D2 da missão): < 14 m · 14–22 m · ≥ 22 m. */
  function regiaoDaDistancia(m) {
    if (m < REGIOES.margem.ate) return 'margem';
    if (m < REGIOES.aberta.ate) return 'aberta';
    return 'fundo';
  }

  // ---------------------------------------------------------------- iscas
  // mult: multiplica a chance da espécie; extra: chance somada por região (espécies que só aparecem com a isca).
  const ISCAS = [
    { id: 'minhoca', nome: 'Minhoca', curto: 'MINHOCA', tipo: 'versátil', espera: 1, mult: {}, extra: {},
      resumo: 'Funciona em qualquer lugar. A escolha segura.' },
    { id: 'massa', nome: 'Massa', curto: 'MASSA', tipo: 'especializada', espera: 0.85,
      mult: { lambari: 1.8, tilapia: 1.8, carpa: 1.6, bagre: 0.7, traira: 0.25, objeto: 1 }, extra: {},
      resumo: 'Peixes pequenos e carpas mordem mais rápido. Predadores ignoram.' },
    { id: 'artificial', nome: 'Isca artificial', curto: 'ARTIFICIAL', tipo: 'especializada', espera: 1.1,
      mult: { lambari: 0, tilapia: 0.3, carpa: 0.1, bagre: 0.3, traira: 2.2, objeto: 1 },
      extra: { margem: { tucunare: 6 }, aberta: { tucunare: 14, dourado: 1.5 }, fundo: { tucunare: 3, dourado: 5 } },
      resumo: 'Só predadores atacam. Menos mordidas, peixes valentes.' },
    { id: 'coracao', nome: 'Coração de galinha', curto: 'CORAÇÃO', tipo: 'especializada', espera: 1.15,
      mult: { lambari: 0.3, tilapia: 0.4, carpa: 1.2, bagre: 2.0, traira: 0.8, objeto: 1 },
      extra: { margem: { bagre: 1 }, aberta: { bagre: 4 } },
      resumo: 'Cheiro forte: atrai bagres e carpas. Mordidas mais demoradas.' }
  ];

  const especiePorId = Object.fromEntries(ESPECIES.map((e) => [e.id, e]));
  const objetoPorId = Object.fromEntries(OBJETOS.map((o) => [o.id, o]));
  const iscaPorId = Object.fromEntries(ISCAS.map((i) => [i.id, i]));

  /**
   * Tabela de sorteio para uma região e uma isca: [{ id, chance }] na ordem de ESPECIES,
   * com 'objeto' no fim (as chances 0 nunca são sorteadas e não mudam o sorteio das outras).
   */
  function tabela(regiaoId, iscaId) {
    const r = REGIOES[regiaoId], isca = iscaPorId[iscaId] || iscaPorId.minhoca;
    const extra = (isca.extra && isca.extra[regiaoId]) || {};
    const out = [];
    for (const e of ESPECIES) {
      const base = r.chances[e.id] || 0;
      const m = isca.mult[e.id] != null ? isca.mult[e.id] : 1;
      out.push({ id: e.id, chance: base * m + (extra[e.id] || 0) });
    }
    const mo = isca.mult.objeto != null ? isca.mult.objeto : 1;
    out.push({ id: 'objeto', chance: (r.chances.objeto || 0) * mo });
    return out;
  }

  /** Probabilidade (0–1) de cada espécie numa região com uma isca (para o guia do catálogo e os testes). */
  function probabilidades(regiaoId, iscaId) {
    const t = tabela(regiaoId, iscaId);
    const total = t.reduce((s, x) => s + x.chance, 0);
    return Object.fromEntries(t.map((x) => [x.id, total > 0 ? x.chance / total : 0]));
  }

  /** Onde e com o quê cada espécie aparece (melhores combinações), calculado das tabelas. */
  function guiaDaEspecie(id) {
    const combos = [];
    for (const r of ORDEM_REGIOES) for (const i of ISCAS) combos.push({ regiao: r, isca: i.id, p: probabilidades(r, i.id)[id] || 0 });
    const regioes = ORDEM_REGIOES.filter((r) => combos.some((c) => c.regiao === r && c.p > 0));
    const iscas = ISCAS.map((i) => ({ id: i.id, melhor: Math.max(...combos.filter((c) => c.isca === i.id).map((c) => c.p)) }))
      .filter((x) => x.melhor > 0).sort((a, b) => b.melhor - a.melhor);
    const melhor = combos.slice().sort((a, b) => b.p - a.p)[0];
    return { regioes, iscas, melhor };
  }

  const api = { ESPECIES, OBJETOS, COMPORTAMENTO_OBJETO, REGIOES, ORDEM_REGIOES, ISCAS, ZONAS, zonaPorId,
    especiePorId, objetoPorId, iscaPorId, regiaoDaDistancia, zonaDaDistancia, tabela, probabilidades, guiaDaEspecie };
  root.HF = root.HF || {};
  root.HF.DadosPesca = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
