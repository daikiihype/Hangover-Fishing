/* Hangover Fishing — falas: o MUNDO do lago (Operação Nova Identidade). [PROPOSTA]
 * Peixe saltando, cardume, objeto boiando, pássaros, chuva, entardecer, pontos de interesse
 * e a primeira vez em cada lugar. A narrativa nasce do acontecimento; nada disso mexe na pesca.
 * Cânone: Maria → "Lucas" e "pai"; ALE → "Alemão" e "Maria"; Lucas → "Maria"; todos → "Sirius".
 * Falas sobre a pescaria de alguém exigem que essa pessoa esteja pescando (modo 1 jogador). */
(function (root) {
  'use strict';
  const F = (root.HF && root.HF.Falas) || require('../Falas.js');
  const C = F.C.bind(F);
  const A = 'alemao', E = 'ale', M = 'maria', S = 'sirius';

  F.adicionar('mundo', [
    // ---------------------------------------------------------------- peixe saltando
    C('salto', { perto: true, sujeito: A }, [[A, 'ELE PULOU DO LADO DA MINHA BOIA!', 'surpreso'], [E, 'Tá te mostrando onde ele mora.', 'rindo']]),
    C('salto', { perto: true, sujeito: A }, [[A, 'Pulou pra me provocar. Eu vi.', 'bravo'], [M, 'Lucas, ele só pulou.', 'rindo']]),
    C('salto', { perto: true, sujeito: E }, [[E, 'Opa. Tem vida perto da boia.', 'surpreso'], [M, 'Ou ele tá fugindo de você, pai.', 'rindo']]),
    C('salto', { perto: true, sujeito: E, alemaoPesca: true }, [[E, 'Peixe pulando perto é bom sinal.', 'feliz'], [A, 'No meu lado eles só pulam de longe.', 'frustrado']]),
    C('salto', { perto: true }, [[M, 'Olha o peixe pulando! Que lindo.', 'feliz']]),
    C('salto', { perto: true, sirius: 'acordado' }, [[S, '{balbucio:surpresa}'], [M, 'Ele viu o peixe pular!', 'feliz'], [E, 'Já é pescador. Tá de olho na água.', 'rindo']]),
    C('salto', { perto: false }, [[M, 'Um peixe pulou lá longe!', 'surpreso'], [A, 'Era enorme. Eu vi.', 'surpreso'], [E, 'Você vê enorme em tudo, Alemão.', 'rindo']]),
    C('salto', { perto: false }, [[E, 'Peixe pulando assim é sinal de fome.', 'neutro']]),
    C('salto', { perto: false, alemaoPesca: true }, [[A, 'Aquele ali é meu. Já reservei.', 'feliz']]),
    C('salto', { perto: false, sirius: 'acordado' }, [[S, '{balbucio:curioso}'], [M, 'É peixe, Sirius. Peixe pulando.', 'feliz']]),
    C('salto', { perto: false, sirius: 'dormindo' }, [[M, 'Pulou um peixe... e o Sirius nem acordou.', 'rindo']]),

    // ---------------------------------------------------------------- cardume
    C('cardume', null, [[M, 'Olha o cardume passando! Um monte de peixinho.', 'feliz']]),
    C('cardume', null, [[A, 'Um cardume inteiro! Cadê a rede?', 'surpreso'], [E, 'Aqui é de vara, Alemão. Um de cada vez.', 'rindo']]),
    C('cardume', null, [[E, 'Cardume na rasa. Peixe pequeno anda em turma.', 'neutro']]),
    C('cardume', { sirius: 'acordado' }, [[S, '{balbucio:feliz}'], [A, 'Ele tá contando os peixinhos.', 'feliz'], [M, 'Contando até um, né?', 'rindo']]),
    C('cardume', { alemaoPesca: true }, [[A, 'Passaram todos longe da minha isca.', 'frustrado'], [M, 'Eles marcaram outro encontro, Lucas.', 'rindo']]),

    // ---------------------------------------------------------------- objeto boiando
    C('objeto-boiando', { objeto: 'garrafa' }, [[A, 'Uma garrafa boiando. Será que tem mensagem?', 'surpreso'], [E, 'Deve ter: "recicle".', 'rindo']]),
    C('objeto-boiando', { objeto: 'garrafa' }, [[M, 'Quem joga garrafa no lago, gente?', 'serio'], [E, 'Gente que nunca pescou na vida.', 'neutro']]),
    C('objeto-boiando', { objeto: 'galho' }, [[A, 'Olha aquele galho! Parece um jacaré.', 'surpreso'], [M, 'Parece um galho, Lucas.', 'rindo']]),
    C('objeto-boiando', { objeto: 'galho' }, [[E, 'Galho descendo. A correnteza do rio traz.', 'neutro']]),
    C('objeto-boiando', { objeto: 'folha' }, [[M, 'Uma folhinha passeando no lago.', 'feliz']]),
    C('objeto-boiando', { objeto: 'folha', sirius: 'acordado' }, [[S, '{balbucio:curioso}'], [E, 'É uma folha, Sirius. Ela também tá passeando.', 'rindo']]),

    // ---------------------------------------------------------------- pássaros
    C('passaro', null, [[M, 'Olha os passarinhos indo embora.', 'feliz']]),
    C('passaro', null, [[E, 'Passarinho voando baixo: vem chuva ou vem peixe.', 'neutro']]),
    C('passaro', { alemaoPesca: true }, [[A, 'Até o passarinho pega mais peixe que eu.', 'frustrado']]),
    C('passaro', { sirius: 'acordado' }, [[S, '{balbucio:surpresa}'], [M, 'Passarinho, Sirius! Lá em cima!', 'feliz']]),

    // ---------------------------------------------------------------- chuva leve
    C('chuva-inicio', null, [[M, 'Ih, começou a chover.', 'surpreso'], [E, 'Chuvinha boa. Peixe gosta.', 'neutro'], [A, 'E pescador?', 'preocupado'], [E, 'Pescador se acostuma.', 'rindo']]),
    C('chuva-inicio', null, [[A, 'CHUVA! Salvem as minhocas!', 'surpreso'], [M, 'As minhocas adoram chuva, Lucas.', 'rindo']]),
    C('chuva-inicio', { sirius: 'acordado' }, [[S, '{balbucio:surpresa}'], [M, 'É chuva, Sirius. Vem, vou te cobrir.', 'preocupado']]),
    C('chuva-inicio', { sirius: 'dormindo' }, [[M, 'Chuvinha... vou cobrir o Sirius.', 'preocupado'], [E, 'Chuva fina não acorda ninguém.', 'neutro']]),
    C('chuva-inicio', null, [[E, 'Chuva leve. Ninguém sai daqui por causa disso.', 'neutro'], [A, 'Ninguém. Nem o peixe, espero.', 'serio']]),
    C('chuva-fim', null, [[M, 'Parou. Que cheiro bom de chuva.', 'feliz']]),
    C('chuva-fim', null, [[A, 'Parou! Agora os peixes vão sair da toca.', 'feliz'], [E, 'Peixe não tem toca, Alemão. Tem lago.', 'rindo']]),
    C('chuva-fim', null, [[E, 'Passou. Agora a água fica boa.', 'neutro']]),

    // ---------------------------------------------------------------- entardecer
    C('entardecer', null, [[M, 'Olha esse pôr do sol...', 'feliz'], [E, 'É por isso que a gente vem.', 'neutro'], [A, 'Eu venho pelos peixes.', 'serio'], [M, 'Mentira, Lucas.', 'rindo']]),
    C('entardecer', null, [[E, 'Fim de tarde. Hora em que os grandes saem.', 'neutro'], [A, 'Ouviu isso? Os grandes!', 'surpreso']]),
    C('entardecer', { alemaoPesca: true }, [[A, 'O céu tá laranja igual o peixe que eu não peguei.', 'frustrado'], [M, 'Poeta e pescador, Lucas?', 'rindo']]),
    C('entardecer', { sirius: 'acordado' }, [[M, 'Primeiro pôr do sol na beira do lago, Sirius.', 'feliz'], [S, '{balbucio:feliz}'], [E, 'Ele gostou. Puxou o avô.', 'rindo']]),
    C('entardecer', null, [[M, 'Vagalumes! Olha lá na beira.', 'surpreso'], [E, 'Agora sim. O lago acendeu.', 'feliz']]),

    // ---------------------------------------------------------------- pontos de interesse: surgiu
    C('ponto-surgiu', { ponto: 'bolhas' }, [[E, 'Tá vendo as bolhas? Tem peixe mexendo ali.', 'neutro']]),
    C('ponto-surgiu', { ponto: 'bolhas' }, [[M, 'Olha as bolhinhas subindo ali!', 'surpreso']]),
    C('ponto-surgiu', { ponto: 'cardume' }, [[A, 'Cardume ali na rasa! Joga lá!', 'surpreso']]),
    C('ponto-surgiu', { ponto: 'lirios' }, [[M, 'As folhas tão mexendo. Tem alguém escondido ali.', 'surpreso']]),
    C('ponto-surgiu', { ponto: 'correnteza' }, [[E, 'Redemoinho nas pedras. Predador gosta disso.', 'neutro']]),
    C('ponto-surgiu', { ponto: 'sombra' }, [[A, 'Gente. Uma sombra ENORME passou ali.', 'surpreso'], [E, 'Eu vi. Fica calmo, Alemão.', 'neutro']]),
    C('ponto-surgiu', { ponto: 'sombra', sirius: 'acordado' }, [[S, '{balbucio:surpresa}'], [M, 'Até o Sirius viu a sombra!', 'surpreso']]),
    C('ponto-surgiu', { ponto: 'tronco' }, [[E, 'Ali no fundo tem tronco. Bagre adora.', 'neutro']]),

    // ---------------------------------------------------------------- pontos de interesse: a boia pousou no ponto
    C('ponto-acerto', { sujeito: A }, [[A, 'Na mosca! Bem em cima!', 'feliz'], [E, 'Agora é esperar ele aceitar o convite.', 'neutro']]),
    C('ponto-acerto', { sujeito: A, ponto: 'sombra' }, [[A, 'Joguei em cima da sombra. Agora vai.', 'serio'], [M, 'Cuidado com o que você deseja, Lucas.', 'rindo']]),
    C('ponto-acerto', { sujeito: A, ponto: 'cardume' }, [[A, 'No meio do cardume! Um deles vai querer.', 'feliz']]),
    C('ponto-acerto', { sujeito: E }, [[E, 'Bem no ponto. Agora é paciência.', 'neutro'], [M, 'Arremesso de mestre, pai.', 'feliz']]),
    C('ponto-acerto', { sujeito: E, ponto: 'correnteza' }, [[E, 'Isca na correnteza. É ali que eles caçam.', 'neutro']]),
    C('ponto-acerto', { sujeito: E, ponto: 'tronco' }, [[E, 'Perto do tronco. Ou é bagre ou é enrosco.', 'neutro']]),
    C('ponto-acerto', { ponto: 'bolhas' }, [[M, 'Caiu bem nas bolhas!', 'surpreso']]),
    C('ponto-acerto', { ponto: 'lirios' }, [[M, 'Pertinho dos lírios. Boa!', 'feliz']]),
    C('ponto-acerto', null, [['O', 'Jogou bem no ponto que eu tinha visto.', 'frustrado']], { m: 2 }),

    // ---------------------------------------------------------------- primeira vez em cada lugar (preferidas às genéricas)
    C('regiao', { zona: 'rasa' }, [[M, 'Margem Rasa. Dá pra ver o fundo daqui.', 'feliz']], { w: 3 }),
    C('regiao', { zona: 'rasa', sujeito: A }, [[A, 'Margem Rasa: aqui é peixe atrás de peixe.', 'feliz']], { w: 3 }),
    C('regiao', { zona: 'lirios' }, [[M, 'Baía dos Lírios... que lugar bonito.', 'feliz']], { w: 3 }),
    C('regiao', { zona: 'lirios', sujeito: E }, [[E, 'Nos lírios. Peixe gosta de sombra.', 'neutro']], { w: 3 }),
    C('regiao', { zona: 'lirios', sujeito: A }, [[A, 'Caiu perto dos lírios. Romântico.', 'feliz'], [M, 'Lucas, é pescaria.', 'rindo']], { w: 3 }),
    C('regiao', { zona: 'pedras' }, [[E, 'Curva das Pedras. Cuidado com a correnteza.', 'neutro']], { w: 3 }),
    C('regiao', { zona: 'pedras', sujeito: A }, [[A, 'Nas pedras! Aqui é tudo ou nada.', 'serio']], { w: 3 }),
    C('regiao', { zona: 'poco' }, [[M, 'Lá no Poço Profundo? Coragem.', 'surpreso']], { w: 3 }),
    C('regiao', { zona: 'poco', sujeito: E }, [[E, 'Poço Profundo. Peixe grande e sem pressa.', 'neutro']], { w: 3 }),
    C('regiao', { zona: 'poco', sujeito: A }, [[A, 'Poço Profundo! Lá moram os monstros.', 'surpreso'], [E, 'Monstro não. Peixe grande e esperto.', 'neutro']], { w: 3 })
  ]);
})(typeof window !== 'undefined' ? window : globalThis);
