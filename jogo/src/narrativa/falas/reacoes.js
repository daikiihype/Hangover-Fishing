/* Hangover Fishing — falas: mais REAÇÕES na espera, na mordida e na briga (com a Maria presente). [PROPOSTA] */
(function (root) {
  'use strict';
  const F = (root.HF && root.HF.Falas) || require('../Falas.js');
  const C = F.C.bind(F);
  const A = 'alemao', E = 'ale', M = 'maria';
  const b = (extra) => Object.assign({ e: 'FIGHTING' }, extra || {});

  F.adicionar('reacoes', [
    // ---------------------------------------------------------------- espera
    C('espera-longa', { sujeito: A }, [[M, 'Lucas, a boia não vai afundar só porque você encarou.', 'rindo']]),
    C('espera-longa', { sujeito: E }, [[M, 'Pai, você tá tão parado que um passarinho vai pousar.', 'rindo'], [E, 'Que pouse. Desde que não espante o peixe.', 'neutro']]),
    C('beliscada', { sujeito: A }, [[M, 'Mexeu! Ou foi impressão minha?', 'surpreso'], [A, 'Foi o peixe pensando.', 'serio']]),
    C('beliscada', { sujeito: E }, [[E, 'Tá cheirando. Deixa cheirar.', 'neutro']]),
    C('ansioso', { sujeito: A }, [[M, 'Cada toque desses é um peixe dando risada, Lucas.', 'rindo']]),
    C('ansioso', { sujeito: E }, [[E, 'Tô só lembrando o peixe que eu tô aqui.', 'neutro']]),
    C('demorando', { sujeito: E }, [[M, 'Pai, quer que eu torça mais alto?', 'rindo'], [E, 'Torce baixinho, Maria. O peixe é tímido.', 'neutro']], { m: 2 }),
    C('seca', null, [[M, 'Se ninguém pegar nada, eu vou dizer que foi empate.', 'rindo'], [A, 'Empate de zero não vale!', 'bravo']], { m: 2 }),
    C('seca', { protagonista: E }, [[M, 'Pai, quer um café?', 'feliz'], [E, 'Quero um peixe. Mas café também serve.', 'neutro']], { m: 1 }),
    C('seca', { protagonista: A }, [[E, 'A lagoa tá fazendo charme, Alemão.', 'neutro'], [A, 'Charme demais.', 'frustrado']], { m: 1 }),
    // ---------------------------------------------------------------- mordida e fisgada
    C('mordida', { sujeito: A }, [[M, 'Lucas, a sua!', 'surpreso']]),
    C('mordida', { sujeito: E }, [[M, 'Pai, a boia!', 'surpreso']]),
    C('fisgada', { sujeito: A, reacao: 'rapida' }, [[M, 'Que rápido, Lucas!', 'surpreso']]),
    C('fisgada', { sujeito: A, reacao: 'lenta' }, [[A, 'Peguei! Demorei, mas peguei!', 'feliz']]),
    C('fisgada', { sujeito: E, reacao: 'normal' }, [[M, 'Fisgou, pai!', 'feliz'], [E, 'Fisguei. Agora não grita.', 'neutro']]),
    // ---------------------------------------------------------------- briga (curtas; só enquanto a briga continua)
    C('briga-tensa', { sujeito: E }, [[M, 'Pai, a linha tá gritando!', 'preocupado']], b()),
    C('briga-longa', { sujeito: A }, [[M, 'Lucas, quer que eu chame reforço?', 'rindo'], [A, 'Ninguém! Esse é meu!', 'bravo']], b()),
    C('briga-grande', { sujeito: E }, [[M, 'Pai, esse tá puxando você!', 'surpreso'], [E, 'Tá. Mas eu puxo de volta.', 'neutro']], b()),
    C('briga-grande', { sujeito: A }, [[A, 'Esse é dos pesados! Segura o Sirius longe!', 'surpreso'], [M, 'Ele tá longe, Lucas. Seguro.', 'neutro']], b()),
    C('arrancada', { sujeito: A }, [[A, 'Ele tá fugindo pro meio da lagoa!', 'surpreso']], b()),
    C('arrancada', { sujeito: E }, [[M, 'Pai, ele tá levando a linha toda!', 'surpreso']], b()),
    C('briga-frouxa', { sujeito: A }, [[A, 'Vem, vem, vem!', 'preocupado']], b()),
    C('briga-frouxa', { sujeito: E }, [[M, 'Pai, ele tá folgado demais!', 'preocupado']], b()),
    C('briga-tensa', { sujeito: A }, [[A, 'Segura, linha! Segura!', 'preocupado']], b()),
    C('briga-longa', { sujeito: E }, [[M, 'Pai, quer água?', 'preocupado'], [E, 'Depois, Maria. Ele primeiro.', 'neutro']], b())
  ]);
})(typeof window !== 'undefined' ? window : globalThis);
