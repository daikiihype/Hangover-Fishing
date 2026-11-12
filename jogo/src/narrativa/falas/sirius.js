/* Hangover Fishing — falas: SIRIUS (inquieto, choro, acalmando, sono, despertar). [PROPOSTA]
 * O choro é só narrativo (GDD 3.8, opção A): não muda nada na pescaria.
 * c: true = cena do choro (a Maria pode falar enquanto cuida dele). */
(function (root) {
  'use strict';
  const F = (root.HF && root.HF.Falas) || require('../Falas.js');
  const C = F.C.bind(F);
  const A = 'alemao', E = 'ale', M = 'maria', S = 'sirius';
  const CH = { c: true };
  const ch = (extra) => Object.assign({}, CH, extra || {});

  F.adicionar('sirius', [
    // ---------------------------------------------------------------- inquieto (aviso antes do choro)
    C('sirius-inquieto', null, [[S, '{balbucio:protesto}'], [M, 'Ih... conheço esse som.', 'preocupado']], ch()),
    C('sirius-inquieto', null, [[S, '{balbucio:protesto}'], [E, 'Xi. Alguém não gostou do placar.', 'neutro']], ch({ m: 2 })),
    C('sirius-inquieto', null, [[S, '{balbucio:protesto}'], [A, 'Não fui eu! Eu tava quietinho!', 'surpreso']], ch()),
    C('sirius-inquieto', null, [[S, '{balbucio:protesto}'], [E, 'Lá vem.', 'neutro']], ch()),
    // ---------------------------------------------------------------- chorando (Maria cuida; a pescaria continua)
    C('sirius-chorando', null, [[S, '{balbucio:choro}'], [M, 'Opa, opa... vem cá, Sirius.', 'preocupado'], [A, 'Quer ajuda?', 'preocupado'], [M, 'Pode deixar. Pesca aí.', 'feliz']], ch()),
    C('sirius-chorando', null, [[S, '{balbucio:choro}'], [M, 'Tá com fome, né? Já sei.', 'preocupado'], [E, 'Puxou o apetite de alguém.', 'rindo'], [A, 'E a voz de alguém também.', 'rindo']], ch()),
    C('sirius-chorando', null, [[S, '{balbucio:choro}'], [M, 'Pronto, pronto. A mamãe tá aqui.', 'preocupado'], [E, 'Deixa com ela, Alemão. Ela resolve.', 'neutro']], ch()),
    C('sirius-chorando', null, [[S, '{balbucio:choro}'], [A, 'Calma, Sirius! Já já tem peixe pra você ver!', 'preocupado'], [M, 'Ele não quer peixe, Lucas. Quer colo.', 'feliz']], ch()),
    C('sirius-chorando', null, [[S, '{balbucio:choro}'], [E, 'Esse choro é de sono.', 'neutro'], [M, 'É de fome, pai.', 'serio'], [E, 'É de sono com fome.', 'neutro']], ch()),
    C('sirius-chorando', null, [[S, '{balbucio:choro}'], [A, 'Foi o peixe que eu perdi? Também chorei por dentro.', 'preocupado'], [M, 'Lucas...', 'rindo']], ch()),
    C('sirius-chorando', null, [[S, '{balbucio:choro}'], [E, 'Ele chora igual a linha do Alemão arrebentando.', 'rindo'], [M, 'Pai!', 'serio']], ch({ m: 2 })),
    C('sirius-chorando', null, [[S, '{balbucio:choro}'], [M, 'Ei, ei... olha a mamãe. Olha.', 'preocupado'], [A, 'Ninguém faz barulho. Ninguém pesca alto.', 'preocupado']], ch()),
    // ---------------------------------------------------------------- acalmando
    C('sirius-acalmando', null, [[M, 'Shhh... pronto. Passou.', 'feliz']], ch()),
    C('sirius-acalmando', null, [[M, 'Isso... respira. Assim.', 'feliz'], [S, '{balbucio:sono}']], ch()),
    C('sirius-acalmando', null, [[M, 'Pronto, pronto. Já passou.', 'feliz']], ch()),
    C('sirius-acalmando', null, [[S, '{balbucio:sono}'], [M, 'Tá vendo? Era só colo.', 'feliz']], ch()),
    // ---------------------------------------------------------------- acalmou (Maria volta aos comentários)
    C('sirius-acalmou', { dormiu: true }, [[M, 'Dormiu. Agora falem baixo, vocês dois.', 'feliz'], [A, '(tá bom...)', 'feliz']], ch({ m: 2 })),
    C('sirius-acalmou', { dormiu: true }, [[M, 'Dormiu no meu colo. Voltei pra torcida.', 'feliz']], ch()),
    C('sirius-acalmou', { dormiu: true }, [[M, 'Pegou no sono.', 'feliz'], [E, 'Agora a gente pode errar em silêncio.', 'neutro']], ch()),
    C('sirius-acalmou', { dormiu: false }, [[M, 'Voltei. O que eu perdi?', 'feliz'], [E, 'Nada, Maria. O Alemão continua tentando.', 'neutro']], ch({ m: 2 })),
    C('sirius-acalmou', { dormiu: false }, [[M, 'Voltei. Perdi alguma coisa?', 'feliz'], [A, 'Só a calma. Mas ela também voltou.', 'feliz']], ch()),
    C('sirius-acalmou', { dormiu: false }, [[M, 'Pronto, passou. Ele só queria atenção.', 'feliz'], [A, 'Puxou o pai.', 'rindo']], ch()),
    C('sirius-acalmou', { dormiu: false }, [[S, '{balbucio:feliz}'], [M, 'Olha esse sorriso. Já esqueceu tudo.', 'feliz']], ch()),
    C('sirius-acalmou', { dormiu: false }, [[M, 'Prontinho. E aí, cadê os peixes?', 'feliz'], [A, 'Estavam esperando você voltar.', 'feliz']], ch()),
    // ---------------------------------------------------------------- cochilo e despertar (sem choro)
    C('sirius-dormiu', null, [[M, 'Shh... o Sirius dormiu.', 'feliz']]),
    C('sirius-dormiu', null, [[M, 'Olha, pegou no sono. Pescaria é calmante.', 'feliz']]),
    C('sirius-dormiu', null, [[E, 'Dormiu. A lagoa tem esse efeito.', 'neutro']]),
    C('sirius-dormiu', null, [[A, 'Ele dormiu? Vou pescar na ponta dos pés.', 'feliz']]),
    C('sirius-acordou', null, [[S, '{balbucio:feliz}'], [M, 'Olha quem acordou!', 'feliz']]),
    C('sirius-acordou', null, [[S, '{balbucio:curioso}'], [A, 'Acordou querendo saber o placar.', 'rindo']], { m: 2 }),
    C('sirius-acordou', null, [[S, '{balbucio:feliz}'], [E, 'Bom dia, Sirius. Perdeu pouca coisa.', 'feliz']]),
    C('sirius-acordou', null, [[S, '{balbucio:curioso}'], [M, 'Acordou com o barulho, né? Eu sei quem foi.', 'serio'], [A, 'Não fui eu.', 'serio']])
  ]);
})(typeof window !== 'undefined' ? window : globalThis);
