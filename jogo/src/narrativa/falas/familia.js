/* Hangover Fishing — falas: CONVERSAS DA ESPERA e da família (Operação Nova Identidade). [PROPOSTA]
 * Conversas com começo e fim para os períodos de espera: os três adultos, a família e o Sirius
 * (os adultos "traduzem" os balbucios). Uma mordida pode cortar a conversa; às vezes ela volta.
 * Cânone: Maria → "Lucas" e "pai"; ALE → "Alemão" e "Maria"; Lucas → "Maria" (definido nesta
 * missão); o Lucas não usa vocativo para o ALE (ainda não definido). Maria não pesca.
 * ALE: calmo, sábio, brincalhão — provoca com carinho, nunca com agressividade. */
(function (root) {
  'use strict';
  const F = (root.HF && root.HF.Falas) || require('../Falas.js');
  const C = F.C.bind(F);
  const A = 'alemao', E = 'ale', M = 'maria', S = 'sirius';
  const G = 'silencio';

  F.adicionar('familia', [
    // ---------------------------------------------------------------- os três adultos
    C(G, { alemaoPesca: true }, [[A, 'Maria, se eu pegar um dourado hoje, a gente janta fora.', 'feliz'], [M, 'Combinado. Então hoje a gente janta em casa.', 'rindo']]),
    C(G, null, [[A, 'Maria, você trouxe o lanche?', 'neutro'], [M, 'Trouxe. É pra depois do primeiro peixe.', 'rindo'], [E, 'Então vai ser um jantar.', 'rindo']]),
    C(G, null, [[M, 'Pai, conta pro Lucas da vez do bagre gigante.', 'feliz'], [E, 'Foi bem aqui. Vinte anos atrás.', 'neutro'], [A, 'E aí?', 'surpreso'], [E, 'E aí ele ainda tá aqui. Esperando.', 'rindo']]),
    C(G, null, [[E, 'O segredo da pescaria é saber esperar.', 'neutro'], [A, 'E o segundo segredo?', 'serio'], [E, 'Saber esperar mais um pouco.', 'rindo']]),
    C(G, { alemaoPesca: true }, [[M, 'Tá tão calmo que dá até sono.', 'feliz'], [E, 'Peixe gosta de gente calma.', 'neutro'], [A, 'Então eu tô perdido.', 'frustrado']]),
    C(G, null, [[A, 'Maria, olha que bonita essa luz na água.', 'feliz'], [M, 'Tá romântico hoje, Lucas?', 'rindo'], [A, 'Tô pescando. É diferente.', 'serio']]),
    C(G, null, [[E, 'Maria, você vinha aqui comigo quando era pequena.', 'feliz'], [M, 'E dormia no meio da pescaria.', 'rindo'], [E, 'Igualzinho o Sirius.', 'feliz']]),
    C(G, null, [[M, 'Vocês dois juntos são mais quietos que o lago.', 'rindo'], [E, 'É respeito pelo peixe.', 'neutro'], [A, 'É estratégia.', 'serio']]),
    C(G, { alemaoPesca: true }, [[A, 'Se eu pegar um recorde, vou pendurar na parede.', 'feliz'], [M, 'Na nossa parede não, Lucas.', 'serio'], [E, 'Pode pendurar na minha.', 'rindo']]),
    C(G, null, [[A, 'Já pensou se o peixe pesca a gente?', 'serio'], [M, 'Lucas, que pergunta é essa?', 'rindo'], [E, 'Pensa bem. Quem tá preso na beira há horas?', 'neutro']]),
    C(G, { modo: 2 }, [[A, 'Vamos apostar quem pega o maior?', 'feliz'], [E, 'Quem perder lava a louça.', 'neutro'], [M, 'Eu vou cobrar, hein.', 'rindo']]),
    C(G, null, [[M, 'Sabe o que eu mais gosto daqui?', 'feliz'], [E, 'Do silêncio?', 'neutro'], [M, 'De ver vocês dois tentando.', 'rindo']]),
    C(G, null, [[E, 'Ouviu isso?', 'neutro'], [A, 'O quê?', 'surpreso'], [E, 'Nada. É isso que eu gosto daqui.', 'feliz']]),
    C(G, null, [[A, 'Maria, quando o Sirius crescer, eu ensino ele a pescar.', 'feliz'], [M, 'Deixa o meu pai ensinar, Lucas.', 'rindo'], [A, 'Justo.', 'neutro']]),
    C(G, null, [[M, 'Pai, você pescava assim com o seu pai?', 'neutro'], [E, 'Pescava. E ele dormia na cadeira.', 'feliz'], [M, 'Tradição de família, então.', 'rindo']]),

    // ---------------------------------------------------------------- enquanto a boia espera
    C(G, { esperando: true }, [[M, 'Tá demorando, né?', 'neutro'], [E, 'O peixe tá decidindo. Deixa ele pensar.', 'neutro']]),
    C(G, { esperando: true, alemaoPesca: true }, [[A, 'Maria, fala alguma coisa pra boia afundar.', 'feliz'], [M, 'Afunda, boia.', 'rindo'], [A, 'Nada. Ela não respeita ninguém.', 'frustrado']]),
    C(G, { esperando: true, alePesca: true }, [[M, 'Pai, como você sabe que vai morder?', 'neutro'], [E, 'Não sei. Eu só não tenho pressa.', 'neutro']]),
    C(G, { esperando: true, alemaoPesca: true }, [[A, 'Acho que o meu peixe foi almoçar.', 'frustrado'], [E, 'Volta. Peixe sempre volta pra janta.', 'neutro']]),
    C(G, { esperando: true }, [[E, 'Pescar é a única coisa que fica boa quanto mais demora.', 'feliz'], [M, 'O churrasco também, pai.', 'rindo']]),

    // ---------------------------------------------------------------- com o Sirius (só balbucios; os adultos interpretam)
    C(G, { sirius: 'acordado' }, [[S, '{balbucio:curioso}'], [A, 'Ele perguntou quando é a vez dele de pescar.', 'feliz'], [M, 'Daqui a uns quinze anos, Lucas.', 'rindo']]),
    C(G, { sirius: 'acordado' }, [[S, '{balbucio:feliz}'], [E, 'Ele disse que o avô dele pesca melhor.', 'rindo'], [A, 'Ele disse que o pai pesca melhor.', 'serio'], [M, 'Ele disse que tá com fome.', 'rindo']]),
    C(G, { sirius: 'acordado', alemaoPesca: true }, [[M, 'Sirius, olha o pai pescando.', 'feliz'], [S, '{balbucio:feliz}'], [A, 'Ele tá torcendo por mim, viu?', 'feliz']]),
    C(G, { sirius: 'acordado', alePesca: true }, [[M, 'Sirius, olha o seu avô pescando.', 'feliz'], [S, '{balbucio:curioso}'], [E, 'Ele quer saber se vai sair peixe hoje.', 'rindo']]),
    C(G, { sirius: 'acordado' }, [[S, '{balbucio:bobo}'], [E, 'Essa foi a opinião dele sobre a pescaria.', 'rindo'], [M, 'Pai! Ele só tá brincando.', 'rindo']]),
    C(G, { sirius: 'acordado' }, [[S, '{balbucio:feliz}'], [A, 'Maria, ele riu pra mim!', 'surpreso'], [M, 'Ele ri pra todo mundo, Lucas.', 'feliz'], [A, 'Mas pra mim foi diferente.', 'feliz']]),
    C(G, { sirius: 'acordado' }, [[S, '{balbucio:curioso}'], [M, 'Tá olhando a água, Sirius?', 'feliz'], [S, '{balbucio:feliz}'], [E, 'Ele gostou do lago. Bom sinal.', 'feliz']]),
    C(G, { sirius: 'dormindo' }, [[M, 'Ele dormiu. Falem baixinho.', 'feliz'], [A, '(tá bom...)', 'neutro'], [E, '(peixe também gosta de silêncio)', 'neutro']]),
    C(G, { sirius: 'dormindo' }, [[E, 'Olha o Sirius dormindo. Nem o lago é tão calmo.', 'feliz'], [M, 'Aproveita, pai. Dura pouco.', 'rindo']]),

    // ---------------------------------------------------------------- 1 jogador: quem assiste puxa conversa
    C(G, { protagonista: E }, [[A, 'Maria, quer que eu segure o Sirius?', 'neutro'], [M, 'Quero. Mas sem pescar com ele no colo.', 'rindo']], { m: 1 }),
    C(G, { protagonista: A }, [[E, 'Maria, o Alemão tá concentrado hoje.', 'neutro'], [M, 'Ele fica assim quando quer impressionar o senhor.', 'rindo']], { m: 1 })
  ]);
})(typeof window !== 'undefined' ? window : globalThis);
