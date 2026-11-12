/* Hangover Fishing — falas: CONVERSAS ESPONTÂNEAS (momentos de silêncio). [PROPOSTA]
 * Só disparam depois de um silêncio e quando ninguém está numa mordida ou numa briga. */
(function (root) {
  'use strict';
  const F = (root.HF && root.HF.Falas) || require('../Falas.js');
  const C = F.C.bind(F);
  const A = 'alemao', E = 'ale', M = 'maria', S = 'sirius';
  const G = 'silencio';

  F.adicionar('conversas', [
    // ---------------------------------------------------------------- os quatro, nos dois modos
    C(G, null, [[E, 'Sabe o que eu gosto da pescaria, Alemão?', 'neutro'], [A, 'O quê?', 'neutro'], [E, 'Ninguém liga pra gente.', 'neutro'], [M, 'Eu ligo, pai.', 'feliz']]),
    C(G, { alemaoPesca: true }, [[A, 'Hoje eu sinto que vai ser o dia.', 'feliz'], [E, 'Você diz isso toda vez.', 'neutro'], [A, 'E toda vez é quase.', 'feliz']]),
    C(G, { modo: 2 }, [[M, 'Vocês ficam iguaizinhos olhando pra boia.', 'rindo'], [A, 'Iguais?', 'surpreso'], [E, 'Ela quer dizer que você tá ficando sábio.', 'neutro'], [M, 'Não foi isso que eu quis dizer.', 'rindo']]),
    C(G, null, [[A, 'Dois meses pescando e já me sinto profissional.', 'feliz'], [E, 'O Sirius tem a mesma experiência que você.', 'neutro'], [M, 'E ele não perde peixe.', 'rindo']]),
    C(G, null, [[M, 'Que dia bonito pra não pegar peixe.', 'feliz']]),
    C(G, { alemaoPesca: true }, [[E, 'Pescar é esperar sem parecer que tá esperando.', 'neutro'], [A, 'E eu pareço que tô esperando?', 'serio'], [E, 'Parece que tá na fila do banco.', 'rindo']]),
    C(G, { alemaoPesca: true }, [[A, 'Se eu pegar um grande hoje, vou dar o nome de Sirius.', 'feliz'], [M, 'Não vai dar nome de filho pra peixe, Lucas.', 'serio']]),
    C(G, null, [[E, 'Maria, passou protetor?', 'neutro'], [M, 'Passei, pai.', 'feliz'], [E, 'Passa no Alemão. Ele tá ficando vermelho.', 'rindo'], [A, 'É estilo. Combina com a vara.', 'serio']]),
    C(G, { alemaoPesca: true }, [[A, 'Você acha que peixe ouve?', 'serio'], [E, 'Ouve. Por isso você não pega nada.', 'neutro']]),
    C(G, null, [[M, 'Silêncio total. Até parece que vocês sabem o que tão fazendo.', 'rindo']]),
    C(G, null, [[A, 'Essa lagoa tem segredo.', 'serio'], [E, 'Tem. O segredo é ficar quieto.', 'neutro']]),
    C(G, null, [[E, 'Uma brisa boa dessas, nem precisava de peixe.', 'feliz'], [A, 'Precisava sim.', 'serio']]),
    C(G, null, [[A, 'Quando o Sirius crescer, eu ensino ele a pescar.', 'feliz'], [E, 'Ensina. Aí depois ele ensina você.', 'neutro'], [M, 'Ele vai ensinar os dois, isso sim.', 'rindo']]),
    C(G, null, [[E, 'O segredo da pescaria é a companhia, Alemão.', 'neutro'], [A, 'Que bonito.', 'feliz'], [E, 'E o peixe. O peixe também ajuda.', 'neutro']]),
    C(G, { alemaoPesca: true }, [[M, 'Sabia que a água tá mais parada hoje?', 'neutro'], [A, 'Igual meu placar.', 'frustrado']]),
    C(G, null, [[A, 'Imagina um peixe de dez quilos aqui.', 'feliz'], [E, 'Imagina, Alemão. Imaginar é de graça.', 'neutro']]),
    C(G, null, [[M, 'O que vocês tanto conversam com a água?', 'rindo'], [E, 'A água escuta, Maria. Não responde, mas escuta.', 'neutro']]),
    C(G, null, [[E, 'Tá vendo aquela ondinha ali?', 'neutro'], [A, 'Tô.', 'surpreso'], [E, 'Nada. Só achei bonita.', 'feliz']]),
    C(G, null, [[A, 'Tô com uma sensação boa.', 'feliz'], [M, 'É fome, Lucas.', 'rindo']]),
    C(G, { alemaoPesca: true }, [[M, 'Se alguém pegar um peixe agora, eu bato palma.', 'feliz'], [E, 'Sem pressão, Alemão.', 'neutro'], [A, 'Pressão nenhuma.', 'preocupado']]),
    C(G, null, [[E, 'Pescaria boa é a que a gente lembra depois.', 'neutro'], [A, 'Então hoje vai ser lembrada.', 'feliz'], [E, 'Por qual motivo, é o que eu quero saber.', 'rindo']]),
    // ---------------------------------------------------------------- com o Sirius acordado
    C(G, { sirius: 'acordado', alemaoPesca: true }, [[S, '{balbucio:feliz}'], [A, 'Ele tá narrando a pescaria!', 'rindo'], [E, 'E tá narrando melhor que você pesca.', 'rindo']]),
    C(G, { sirius: 'acordado' }, [[S, '{balbucio:curioso}'], [E, 'Ele perguntou se a gente vai pegar alguma coisa hoje.', 'neutro'], [A, 'Fala pra ele que sim.', 'feliz'], [M, 'Ninguém aqui mente pro Sirius.', 'serio']]),
    C(G, { sirius: 'acordado' }, [[S, '{balbucio:bobo}'], [M, 'Sirius! Isso é jeito de comentar a pescaria?', 'rindo'], [A, 'Ele tá certo, sinceramente.', 'frustrado']]),
    C(G, { sirius: 'acordado' }, [[S, '{balbucio:curioso}'], [A, 'Ele quer isca artificial.', 'serio'], [E, 'Ele quer leite.', 'neutro'], [M, 'Ele quer que vocês parem de traduzir.', 'rindo']]),
    C(G, { sirius: 'acordado' }, [[S, 'MA... MA!', 'feliz'], [M, 'Ele disse mamãe!', 'surpreso'], [A, 'Ele disse "mais peixe".', 'rindo'], [E, 'Ele disse "mais paciência".', 'neutro']], { w: 0.7 }),
    C(G, { sirius: 'acordado' }, [[S, '{balbucio:feliz}'], [M, 'Ele disse que vocês dois tão indo muito bem.', 'feliz'], [A, 'Ele disse isso?', 'surpreso'], [M, 'Não. Mas eu sou boazinha.', 'rindo']]),
    C(G, { sirius: 'acordado' }, [[S, '{balbucio:surpresa}'], [E, 'Viu um passarinho.', 'neutro'], [A, 'Viu um peixe.', 'feliz'], [M, 'Viu o próprio pé.', 'rindo']]),
    C(G, { sirius: 'acordado' }, [[S, '{balbucio:curioso}'], [M, 'Ele quer saber por que tá todo mundo quieto.', 'feliz'], [E, 'Tá todo mundo pensando, Sirius.', 'neutro'], [A, 'Eu tô pensando no almoço.', 'serio']]),
    C(G, { sirius: 'acordado' }, [[E, 'Sirius, quando você crescer, a gente vem junto.', 'feliz'], [S, '{balbucio:feliz}'], [E, 'Combinado, então.', 'feliz']]),
    C(G, { sirius: 'acordado', alemaoPesca: true }, [[S, '{balbucio:bobo}'], [E, 'Esse som eu conheço, Alemão. É o seu na hora da briga.', 'rindo']]),
    // ---------------------------------------------------------------- com o Sirius dormindo (discreto)
    C(G, { sirius: 'dormindo' }, [[A, 'Tá muito quieto. Até o Sirius tá quieto.', 'neutro'], [M, 'Ele tá dormindo, Lucas. Fala baixo.', 'serio']], { w: 0.6 }),
    C(G, { sirius: 'dormindo' }, [[M, 'Olha ele dormindo... nem liga pra peixe.', 'feliz'], [E, 'Sábio. Igual o avô.', 'neutro']], { w: 0.6 }),
    C(G, { sirius: 'dormindo' }, [[E, 'Ninguém comemora alto agora, Alemão.', 'neutro'], [A, 'Vou comemorar por mímica.', 'feliz']], { w: 0.5 }),
    // ---------------------------------------------------------------- 2 jogadores
    C(G, null, [[A, 'Aposto que eu pego o próximo.', 'feliz'], [E, 'Aposta o quê?', 'neutro'], [A, 'O orgulho.', 'serio'], [E, 'O seu já tá em jogo há tempo.', 'rindo']], { m: 2 }),
    C(G, null, [[M, 'Quem tá ganhando?', 'neutro'], [A, 'Depende do critério.', 'serio'], [E, 'Quer dizer que eu tô ganhando.', 'neutro']], { m: 2 }),
    C(G, null, [[E, 'Alemão, para de olhar pra minha boia.', 'neutro'], [A, 'Tô olhando a paisagem.', 'serio'], [E, 'A paisagem é minha boia.', 'neutro']], { m: 2 }),
    C(G, null, [[A, 'Seu lado tem mais peixe.', 'bravo'], [E, 'Meu lado tem mais paciência.', 'neutro']], { m: 2 }),
    C(G, null, [[M, 'Vocês dois juntos parecem dupla de comercial de pescaria.', 'rindo'], [A, 'Dos bons?', 'feliz'], [M, 'Dos que passam de madrugada.', 'rindo']], { m: 2 }),
    C(G, { esperando: true }, [[A, 'Vem, peixinho... vem...', 'feliz'], [E, 'Ninguém fala. Ninguém respira.', 'neutro']], { m: 2 }),
    C(G, { esperando: true }, [[M, 'Lucas, você tá conversando com a boia?', 'rindo'], [A, 'Tô negociando.', 'serio']]),
    // ---------------------------------------------------------------- 1 jogador: quem assiste participa
    C(G, { protagonista: A }, [[E, 'Hoje eu só observo, Alemão. Me surpreende.', 'neutro'], [A, 'Prepara o coração.', 'feliz']], { m: 1 }),
    C(G, { protagonista: A }, [[M, 'Pai, não vai pescar hoje?', 'neutro'], [E, 'Hoje eu sou o técnico, Maria.', 'neutro'], [A, 'Técnico que só critica.', 'rindo']], { m: 1 }),
    C(G, { protagonista: A }, [[E, 'Daqui de fora a pescaria parece mais fácil.', 'neutro'], [A, 'Então vem pra cá!', 'bravo'], [E, 'Não. Daqui tá ótimo.', 'feliz']], { m: 1 }),
    C(G, { protagonista: A }, [[A, 'Tá vendo? Concentração total.', 'serio'], [E, 'Tô vendo, Alemão. Tô vendo você bocejar.', 'rindo']], { m: 1 }),
    C(G, { protagonista: E }, [[A, 'Hoje eu tô só de torcida.', 'feliz'], [E, 'Torcida silenciosa, de preferência.', 'neutro']], { m: 1 }),
    C(G, { protagonista: E }, [[M, 'Lucas, não vai pescar?', 'neutro'], [A, 'Tô estudando o mestre.', 'serio'], [E, 'Estuda calado.', 'rindo']], { m: 1 }),
    C(G, { protagonista: E }, [[A, 'Qual é o segredo, afinal?', 'serio'], [E, 'Se eu contar, não é segredo, Alemão.', 'neutro']], { m: 1 }),
    C(G, { protagonista: E }, [[E, 'Alemão, segura o Sirius um pouco pra Maria descansar.', 'neutro'], [A, 'Com prazer.', 'feliz'], [M, 'Obrigada, pai.', 'feliz']], { m: 1 }),
    C(G, { esperando: true, protagonista: A }, [[A, 'Vem, peixinho... vem...', 'feliz'], [E, 'Ele não vem chamando, Alemão. Ele vem quando quer.', 'neutro']], { m: 1 }),
    C(G, { esperando: true, protagonista: E }, [[A, 'Já mordeu?', 'surpreso'], [E, 'Se tivesse mordido, você ia saber.', 'neutro']], { m: 1 })
  ]);
})(typeof window !== 'undefined' ? window : globalThis);
