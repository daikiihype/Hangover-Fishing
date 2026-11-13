/* Hangover Fishing — falas: CAPTURAS (peixes e objetos estranhos). Conteúdo [PROPOSTA]. */
(function (root) {
  'use strict';
  const F = (root.HF && root.HF.Falas) || require('../Falas.js');
  const C = F.C.bind(F);
  const A = 'alemao', E = 'ale', M = 'maria', S = 'sirius';

  F.adicionar('captura', [
    // ---------------------------------------------------------------- Alemão: pequeno
    C('captura', { sujeito: A, tamanho: 'pequeno' }, [[A, 'Pequeno, mas veio com vontade!', 'feliz']]),
    C('captura', { sujeito: A, tamanho: 'pequeno' }, [[A, 'Não é pequeno. É econômico.', 'rindo'], [M, 'Econômico, Lucas?', 'rindo']]),
    C('captura', { sujeito: A, tamanho: 'pequeno' }, [[E, 'Dá pra usar de isca, Alemão.', 'rindo'], [A, 'Dá pra usar de troféu, isso sim.', 'feliz']]),
    C('captura', { sujeito: A, tamanho: 'pequeno' }, [[A, 'Olha que peixe bonito... de perto.', 'rindo']]),
    C('captura', { sujeito: A, tamanho: 'pequeno' }, [[M, 'Que fofo, Lucas. Devolve pra mãe dele.', 'feliz']]),
    C('captura', { sujeito: A, tamanho: 'pequeno' }, [[A, 'Tá vendo? Técnica.', 'feliz'], [E, 'Técnica de pegar peixe miúdo.', 'neutro']]),
    C('captura', { sujeito: A, tamanho: 'pequeno' }, [[E, 'Esse cabe no bolso, Alemão.', 'neutro'], [A, 'Cabe no coração também.', 'feliz']]),
    C('captura', { sujeito: A, tamanho: 'pequeno' }, [[A, '{Peixe} de bolso. Edição de colecionador.', 'rindo']]),
    C('captura', { sujeito: A, tamanho: 'pequeno', sirius: 'acordado' }, [[S, '{balbucio:curioso}'], [E, 'Ele perguntou se é só isso.', 'rindo'], [A, 'É só o começo, Sirius.', 'feliz']], { w: 0.6 }),
    // ---------------------------------------------------------------- Alemão: médio
    C('captura', { sujeito: A, tamanho: 'medio' }, [[A, 'Agora sim, {um} {peixe} de respeito!', 'feliz']]),
    C('captura', { sujeito: A, tamanho: 'medio' }, [[A, '{kg}! Anota aí.', 'feliz'], [E, 'Anotado. A lápis.', 'neutro']]),
    C('captura', { sujeito: A, tamanho: 'medio' }, [[E, 'Bonito, Alemão. Sem exagero dessa vez?', 'neutro'], [A, 'Esse dá pra exagerar um pouquinho.', 'rindo']]),
    C('captura', { sujeito: A, tamanho: 'medio' }, [[M, 'Esse foi bonito, Lucas.', 'feliz'], [A, 'Viu? Viu?!', 'rindo']]),
    C('captura', { sujeito: A, tamanho: 'medio' }, [[A, 'Eu disse que ia sair peixe daqui.', 'feliz']]),
    C('captura', { sujeito: A, tamanho: 'medio' }, [[E, 'Tá aprendendo, Alemão.', 'neutro'], [A, 'Tô ensinando, isso sim.', 'rindo']]),
    // ---------------------------------------------------------------- Alemão: grande
    C('captura', { sujeito: A, tamanho: 'grande' }, [[A, 'OLHA O TAMANHO DISSO!', 'rindo'], [M, 'Respira, Lucas. É só um peixe.', 'feliz'], [A, 'SÓ UM PEIXE?!', 'surpreso']], { p: 3 }),
    C('captura', { sujeito: A, tamanho: 'grande' }, [[A, '{kg}! Alguém tira uma foto!', 'rindo'], [E, 'Tira você. Eu tô ocupado rindo.', 'rindo']], { p: 3 }),
    C('captura', { sujeito: A, tamanho: 'grande' }, [[E, 'Eita. Esse aí não foi sorte, não.', 'surpreso'], [A, 'Repete isso. Mais alto.', 'rindo']], { p: 3 }),
    C('captura', { sujeito: A, tamanho: 'grande' }, [[A, 'Eu falei que tinha peixe grande aqui!', 'feliz'], [M, 'Falou umas vinte vezes, Lucas.', 'rindo']], { p: 3 }),
    C('captura', { sujeito: A, tamanho: 'grande' }, [[M, 'Esse é dos grandes, hein?', 'surpreso'], [A, 'Dos grandes? Esse é O grande.', 'rindo']], { p: 3 }),
    C('captura', { sujeito: A, tamanho: 'grande', sirius: 'acordado' }, [[A, 'Sirius, olha o que eu peguei!', 'feliz'], [S, '{balbucio:feliz}'], [E, 'Ele disse que já viu maior.', 'rindo']], { p: 3, w: 0.8 }),
    C('captura', { sujeito: A, tamanho: 'grande', sirius: 'acordado' }, [[S, '{balbucio:feliz}'], [A, 'Ele tá torcendo por mim!', 'rindo'], [E, 'Ele tá torcendo pelo peixe.', 'neutro'], [M, 'Ele tá com soluço, gente.', 'rindo']], { p: 3, w: 0.7 }),
    C('captura', { sujeito: A, tamanho: ['grande', 'excepcional'], sirius: 'dormindo' }, [[A, 'OLHA ISSO!', 'rindo'], [M, 'Lucas! Baixinho! O Sirius tá dormindo.', 'serio'], [A, '(olha isso...)', 'feliz']], { p: 3 }),
    // ---------------------------------------------------------------- Alemão: excepcional
    C('captura', { sujeito: A, tamanho: 'excepcional' }, [[A, 'Isso é peixe ou é submarino?!', 'surpreso'], [E, '{kg}. Respeito, Alemão. Respeito.', 'surpreso']], { p: 2 }),
    C('captura', { sujeito: A, tamanho: 'excepcional' }, [[A, 'Eu nunca mais vou ser humilde.', 'rindo'], [M, 'Você nunca foi, Lucas.', 'rindo']], { p: 2 }),
    C('captura', { sujeito: A, tamanho: 'excepcional' }, [[E, 'Esse vai virar história de família.', 'surpreso'], [A, 'E eu vou contar em todo almoço.', 'rindo'], [M, 'Ninguém aguenta mais e ainda nem começou.', 'rindo']], { p: 2 }),
    C('captura', { sujeito: A, tamanho: 'excepcional' }, [[A, '{kg}! Alguém segura meu coração!', 'surpreso'], [M, 'Segura o peixe primeiro, Lucas.', 'rindo']], { p: 2 }),
    C('captura', { sujeito: A, tamanho: 'excepcional', sirius: 'acordado' }, [[A, 'Sirius! Olha isso!', 'surpreso'], [S, '{balbucio:surpresa}'], [E, 'Ele ficou sem palavras.', 'rindo'], [M, 'Ele sempre fica sem palavras, pai.', 'rindo']], { p: 2, w: 0.8 }),
    // ---------------------------------------------------------------- ALE: pequeno
    C('captura', { sujeito: E, tamanho: 'pequeno' }, [[E, 'Pequeno. Mas educado.', 'neutro'], [A, 'Educado?', 'surpreso'], [E, 'Veio sem brigar.', 'neutro']]),
    C('captura', { sujeito: E, tamanho: 'pequeno' }, [[E, 'Esse vai crescer e voltar pra me procurar.', 'neutro']]),
    C('captura', { sujeito: E, tamanho: 'pequeno' }, [[A, 'Que peixão, hein?', 'rindo'], [E, 'Pelo menos eu pesquei, Alemão.', 'neutro']]),
    C('captura', { sujeito: E, tamanho: 'pequeno' }, [[M, 'Pai, esse aí é do tamanho da minha mão.', 'rindo'], [E, 'Por isso eu gostei dele.', 'neutro']]),
    C('captura', { sujeito: E, tamanho: 'pequeno' }, [[E, 'Não tem peixe pequeno. Tem pescador apressado.', 'neutro']]),
    C('captura', { sujeito: E, tamanho: 'pequeno' }, [[E, 'Pra começar tá bom. Pra terminar, não.', 'neutro']]),
    C('captura', { sujeito: E, tamanho: 'pequeno', sirius: 'acordado' }, [[S, '{balbucio:curioso}'], [A, 'Ele perguntou se é isso mesmo.', 'rindo'], [E, 'É isso mesmo, Sirius. Com orgulho.', 'neutro']], { w: 0.6 }),
    // ---------------------------------------------------------------- ALE: médio
    C('captura', { sujeito: E, tamanho: 'medio' }, [[E, 'Hm. Esse serve.', 'neutro']]),
    C('captura', { sujeito: E, tamanho: 'medio' }, [[E, '{kg}. Nada mal pra quem tava cochilando.', 'neutro']]),
    C('captura', { sujeito: E, tamanho: 'medio' }, [[A, 'Esse foi sorte.', 'serio'], [E, 'Sorte é o nome que dão pra experiência dos outros.', 'neutro']]),
    C('captura', { sujeito: E, tamanho: 'medio' }, [[M, 'Boa, pai!', 'feliz'], [E, 'Boa nada. Ótima.', 'rindo']]),
    C('captura', { sujeito: E, tamanho: 'medio' }, [[E, 'Viu, Alemão? Sem pressa e sem grito.', 'neutro'], [A, 'Sem grito não tem graça.', 'rindo']]),
    // ---------------------------------------------------------------- ALE: grande
    C('captura', { sujeito: E, tamanho: 'grande', sirius: 'acordado' }, [[E, 'Opa. Esse eu vou mostrar pro Sirius.', 'feliz'], [S, '{balbucio:feliz}'], [E, 'Ele aprovou.', 'rindo']], { p: 3 }),
    C('captura', { sujeito: E, tamanho: 'grande' }, [[A, 'Não acredito. {kg}?!', 'surpreso'], [E, 'Acredita, Alemão. Tá na minha mão.', 'neutro']], { p: 3 }),
    C('captura', { sujeito: E, tamanho: 'grande' }, [[E, 'Esse aqui eu nem conto. Deixo o peixe falar.', 'neutro']], { p: 3 }),
    C('captura', { sujeito: E, tamanho: 'grande' }, [[M, 'Pai! Que peixe!', 'surpreso'], [E, 'Calma, Maria. Finge que é normal.', 'rindo']], { p: 3 }),
    C('captura', { sujeito: E, tamanho: 'grande' }, [[E, 'Hoje a lagoa resolveu colaborar.', 'feliz'], [A, 'Comigo ela tá fazendo greve.', 'serio']], { p: 3, m: 2 }),
    C('captura', { sujeito: E, tamanho: ['grande', 'excepcional'], sirius: 'dormindo' }, [[A, 'QUE PEIXE É ESSE?!', 'surpreso'], [M, 'Lucas! O Sirius dormiu agora!', 'serio'], [E, 'Comemora por dentro, Alemão.', 'neutro']], { p: 3 }),
    // ---------------------------------------------------------------- ALE: excepcional
    C('captura', { sujeito: E, tamanho: 'excepcional' }, [[E, 'Alemão. Vem cá. Olha isso com calma.', 'surpreso'], [A, 'Isso não é justo. Isso NÃO é justo!', 'bravo']], { p: 2 }),
    C('captura', { sujeito: E, tamanho: 'excepcional' }, [[E, '{kg}.', 'surpreso'], [M, 'Pai, você tá sorrindo. Isso é raro.', 'rindo'], [E, 'O peixe também é.', 'rindo']], { p: 2 }),
    C('captura', { sujeito: E, tamanho: 'excepcional' }, [[A, 'Que monstro é esse?!', 'surpreso'], [E, 'Peixe de gente grande, Alemão.', 'neutro']], { p: 2 }),
    C('captura', { sujeito: E, tamanho: 'excepcional', sirius: 'acordado' }, [[E, 'Sirius, olha. Esse é maior que você.', 'feliz'], [S, '{balbucio:surpresa}'], [M, 'Ele ficou impressionado, pai.', 'feliz']], { p: 2, w: 0.8 }),
    // ---------------------------------------------------------------- espécie nova no catálogo
    C('captura', { sujeito: A, novo: true }, [[A, 'Peixe novo pro catálogo! {Peixe}!', 'surpreso']], { p: 2 }),
    C('captura', { sujeito: A, novo: true }, [[A, 'Que peixe é esse? ... É {um} {peixe}! É novo!', 'surpreso'], [E, 'Olha só. Esse eu não esperava.', 'surpreso']], { p: 2 }),
    C('captura', { sujeito: A, novo: true }, [[M, 'Esse é novo, né? Nunca vi vocês pegarem um desses.', 'surpreso'], [A, 'Primeira vez na história!', 'rindo']], { p: 2 }),
    C('captura', { sujeito: E, novo: true }, [[E, '{Peixe}. Primeira vez que eu vejo de perto.', 'surpreso']], { p: 2 }),
    C('captura', { sujeito: E, novo: true }, [[M, 'Pai, esse é novo?', 'surpreso'], [E, 'Novo pra mim. O peixe já existia.', 'neutro']], { p: 2 }),
    C('captura', { sujeito: E, novo: true }, [[A, 'Que peixe é esse?', 'surpreso'], [E, 'É {um} {peixe}, Alemão. Agora é conhecido nosso.', 'feliz']], { p: 2 }),
    // ---------------------------------------------------------------- peixe raro (tucunaré, dourado)
    C('captura', { sujeito: A, raro: true }, [[A, '{Um} {peixe}?! AQUI?!', 'surpreso'], [E, 'A isca artificial pagou a conta, Alemão.', 'surpreso']], { p: 2 }),
    C('captura', { sujeito: A, raro: true }, [[E, 'Isso é {um} {peixe}, Alemão. Guarda esse dia.', 'surpreso'], [A, 'Já guardei. Vou emoldurar.', 'rindo']], { p: 2 }),
    C('captura', { sujeito: A, raro: true }, [[M, 'Lucas, até eu sei que esse é raro.', 'surpreso'], [A, 'Isso aqui é lenda!', 'rindo']], { p: 2 }),
    C('captura', { sujeito: E, raro: true }, [[E, '{Um} {peixe}. Isso não acontece duas vezes.', 'surpreso']], { p: 2 }),
    C('captura', { sujeito: E, raro: true }, [[A, '{Um} {peixe}?! Como?!', 'surpreso'], [E, 'Paciência e isca certa, Alemão.', 'neutro']], { p: 2 }),
    C('captura', { sujeito: E, raro: true }, [[M, 'Pai, que peixe colorido!', 'surpreso'], [E, 'É {um} {peixe}, Maria. Hoje eu janto contando história.', 'feliz']], { p: 2 }),
    // ---------------------------------------------------------------- recordes
    C('captura', { sujeito: A, recorde: true }, [[A, 'Recorde! Maior {peixe} que já passou por aqui!', 'rindo']], { p: 2 }),
    C('captura', { sujeito: A, recorde: true }, [[M, 'Recorde, Lucas! Vou fingir que entendo o que isso significa.', 'feliz']], { p: 2 }),
    C('captura', { sujeito: A, recorde: true }, [[E, 'Novo recorde de {peixe}. Vou ter que me esforçar.', 'surpreso'], [A, 'Vai mesmo.', 'rindo']], { p: 2, m: 2 }),
    C('captura', { sujeito: E, recorde: true }, [[E, 'Recorde de {peixe}. Pode anotar, Maria.', 'feliz'], [M, 'Já anotei, pai.', 'feliz']], { p: 2 }),
    C('captura', { sujeito: E, recorde: true }, [[A, 'Recorde?! Era pra ser meu!', 'bravo'], [E, 'Era. Agora é história.', 'neutro']], { p: 2 }),
    C('captura', { sujeito: A, recordePessoal: true }, [[A, 'Meu maior peixe hoje! O dia tá melhorando.', 'feliz'], [E, 'A régua tava baixa, mas tá subindo.', 'neutro']], { p: 4 }),
    C('captura', { sujeito: E, recordePessoal: true }, [[E, 'Esse é o maior de hoje. Por enquanto.', 'neutro']], { p: 4 }),
    // ---------------------------------------------------------------- sequências
    C('captura', { sujeito: A, sequencia: 3 }, [[A, 'Três seguidos! Alguém me para!', 'rindo'], [M, 'Ninguém quer te parar, Lucas. Só baixar o volume.', 'rindo']], { p: 4 }),
    C('captura', { sujeito: A, sequencia: { min: 4 } }, [[A, 'Não para, não para!', 'rindo'], [E, 'Deixa ele, Maria. Isso passa.', 'neutro']], { p: 4 }),
    C('captura', { sujeito: A, sequencia: { min: 4 }, sirius: 'acordado' }, [[S, '{balbucio:feliz}'], [A, 'Até o Sirius tá contando!', 'rindo'], [M, 'Ele não sabe contar, Lucas.', 'rindo'], [A, 'Ainda.', 'feliz']], { p: 4 }),
    C('captura', { sujeito: E, sequencia: 3 }, [[E, 'Três. E eu nem tô me esforçando.', 'neutro']], { p: 4 }),
    C('captura', { sujeito: E, sequencia: { min: 4 } }, [[E, 'Hoje eles tão fazendo fila.', 'feliz'], [A, 'Fila pra você. Pra mim é greve.', 'serio']], { p: 4, m: 2 }),
    C('captura', { sujeito: E, sequencia: { min: 4 } }, [[M, 'Pai, deixa um pouco pros outros peixes.', 'rindo'], [E, 'Eles que venham.', 'neutro']], { p: 4 }),
    // ---------------------------------------------------------------- comentários da Maria (os dois)
    C('captura', { sujeito: A, tamanho: ['medio', 'grande'] }, [[M, 'Essa eu vi! Bonita, Lucas.', 'feliz']], { w: 0.7 }),
    C('captura', { sujeito: E, tamanho: ['medio', 'grande'] }, [[M, 'Essa foi limpa, pai.', 'feliz'], [E, 'Limpa e sem barulho. Do jeito que eu gosto.', 'feliz']], { w: 0.7 }),
    C('captura', { sujeito: A, tamanho: ['pequeno', 'medio'] }, [[M, 'Lucas pescando é mais bonito que o peixe.', 'feliz'], [A, 'Ouviu isso? Ela disse que eu sou bonito.', 'rindo']], { w: 0.5 }),

    // ================================================================ DISPUTA (2 jogadores)
    C('captura', { sujeito: A, virou: true }, [[A, 'Passei! Agora sou eu na frente!', 'rindo'], [E, 'Aproveita. Placar de pescaria muda com o vento.', 'neutro']], { p: 4, m: 2 }),
    C('captura', { sujeito: A, virou: true }, [[A, 'Virou o jogo! Virou!', 'rindo'], [M, 'Pai, o Lucas passou você.', 'rindo'], [E, 'Ouvi. A lagoa inteira ouviu.', 'neutro']], { p: 4, m: 2 }),
    C('captura', { sujeito: E, virou: true }, [[E, 'Agora eu passei, Alemão. Sem pressa.', 'neutro'], [A, 'Volto já. Volto já.', 'bravo']], { p: 4, m: 2 }),
    C('captura', { sujeito: E, virou: true }, [[E, 'Placar arrumado.', 'neutro'], [A, 'Arrumado pra quem?', 'bravo']], { p: 4, m: 2 }),
    C('captura', { gangorra: true }, [[M, 'Essa liderança muda mais que o vento.', 'rindo'], [E, 'Igual gangorra. Alguém vai cair.', 'neutro']], { p: 4, m: 2, w: 2 }),
    C('captura', { gangorra: true, sirius: 'acordado' }, [[S, '{balbucio:feliz}'], [A, 'É voto! Ele votou em mim!', 'rindo'], [E, 'Voto não vale. Ele nem tem título.', 'neutro'], [M, 'Ninguém vai usar o Sirius de juiz.', 'serio']], { p: 4, m: 2, w: 2 }),
    C('captura', { empatou: true }, [[M, 'Empatou! Agora ficou interessante.', 'feliz'], [A, 'Interessante pra mim.', 'rindo'], [E, 'Pra mim também.', 'neutro']], { p: 4, m: 2 }),
    C('captura', { empatou: true, sujeito: A }, [[A, 'Empatei! Ninguém respira!', 'rindo'], [E, 'Eu respiro, Alemão. Devagar.', 'neutro']], { p: 4, m: 2 }),
    C('captura', { empatou: true, sujeito: E }, [[E, 'Empate. Agora começa de verdade.', 'neutro']], { p: 4, m: 2 }),
    C('captura', { disparou: true, sujeito: A }, [[A, 'Abri vantagem! {placar}!', 'rindo'], [M, 'Pai, você vai deixar?', 'rindo'], [E, 'Tô deixando. Por enquanto.', 'neutro']], { p: 4, m: 2 }),
    C('captura', { disparou: true, sujeito: E }, [[M, 'Pai, deixa um pouco pro Lucas.', 'rindo'], [E, 'Deixo. O que sobrar.', 'neutro']], { p: 4, m: 2 }),
    C('captura', { disparou: true, sujeito: E }, [[A, '{placar}... isso é placar de quem?', 'preocupado'], [E, 'De quem tá pescando, Alemão.', 'neutro']], { p: 4, m: 2 }),
    C('captura', { muitoMaior: true, sujeito: A }, [[A, 'O meu é o dobro do seu! Sem querer comparar.', 'rindo'], [E, 'Comparou, Alemão.', 'neutro']], { p: 4, m: 2 }),
    C('captura', { muitoMaior: true, sujeito: E }, [[E, 'O meu é maior. Mas o seu também é peixe, Alemão.', 'neutro']], { p: 4, m: 2 }),
    C('captura', { outroFalhou: true, sujeito: E }, [[E, 'Enquanto você perdia, eu pescava. Divisão de tarefas.', 'neutro']], { p: 4, m: 2 }),
    C('captura', { outroFalhou: true, sujeito: A }, [[A, 'Um perde, outro pesca. A lagoa é justa!', 'rindo'], [M, 'Que timing, hein.', 'rindo']], { p: 4, m: 2 }),
    C('captura', { quaseJunto: true }, [[M, 'Os dois juntos! Parece ensaiado.', 'surpreso'], [A, 'Sincronia de família!', 'rindo']], { p: 4, m: 2 }),
    C('captura', { quaseJunto: true }, [[E, 'Ao mesmo tempo, Alemão. Até nisso você me copia.', 'rindo']], { p: 4, m: 2 }),

    // ================================================================ 1 JOGADOR: quem assiste comenta
    C('captura', { protagonista: A, tamanho: ['medio', 'grande'] }, [[E, 'Boa, Alemão. Daqui de fora parece fácil.', 'neutro'], [A, 'E é fácil. Pra mim.', 'rindo']], { m: 1 }),
    C('captura', { protagonista: A, tamanho: 'pequeno' }, [[E, 'Tô aqui torcendo. Pelo peixe.', 'rindo']], { m: 1 }),
    C('captura', { protagonista: E, tamanho: ['medio', 'grande'] }, [[A, 'Mestre é mestre.', 'feliz'], [E, 'Elogio aceito. Agora anota a técnica.', 'rindo']], { m: 1 }),
    C('captura', { protagonista: E, tamanho: 'pequeno' }, [[A, 'Esse aí eu pegava de olho fechado.', 'rindo'], [E, 'Então pega, Alemão. A vara tá aqui.', 'neutro']], { m: 1 })
  ]);

  F.adicionar('objeto', [
    C('objeto', { sujeito: A }, [[A, '{Peixe}?! Quem joga {peixe} na lagoa?!', 'surpreso']]),
    C('objeto', { sujeito: A, objeto: 'pneu' }, [[E, 'Pescou um pneu, Alemão. Agora falta o resto do carro.', 'rindo']]),
    C('objeto', { sujeito: A }, [[E, 'Pelo menos você limpou a lagoa.', 'neutro'], [A, 'Pescador e ambientalista.', 'feliz']]),
    C('objeto', { sujeito: A }, [[M, 'Lucas, isso não entra no catálogo de peixes.', 'rindo'], [A, 'Entra no catálogo da vergonha.', 'frustrado']]),
    C('objeto', { sujeito: A }, [[A, 'Briguei com {um} {peixe}. E quase perdi.', 'frustrado']]),
    C('objeto', { sujeito: A, objeto: 'bota', sirius: 'acordado' }, [[S, '{balbucio:curioso}'], [A, 'Ele quer a bota.', 'rindo'], [M, 'Ninguém dá bota velha pro Sirius.', 'serio']]),
    C('objeto', { sujeito: E }, [[E, '{Um} {peixe}. Sempre quis {um}.', 'neutro'], [M, 'Pai...', 'rindo']]),
    C('objeto', { sujeito: E }, [[A, 'Que troféu, hein!', 'rindo'], [E, 'Pode ficar pra você, Alemão.', 'neutro']]),
    C('objeto', { sujeito: E }, [[E, 'Até que veio sem brigar.', 'neutro']]),
    C('objeto', { sujeito: E, objeto: 'lata' }, [[E, 'Uma lata. Alguém fez piquenique aqui antes da gente.', 'neutro']]),
    C('objeto', { sujeito: E }, [[M, 'Pai, joga isso no lixo, por favor.', 'serio'], [E, 'Vai pro lixo, Maria. Depois da foto.', 'rindo']])
  ]);
})(typeof window !== 'undefined' ? window : globalThis);
