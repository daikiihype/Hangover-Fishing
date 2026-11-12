/* Hangover Fishing — falas: FRACASSOS (fuga, linha rompida, mordida perdida, linha recolhida). [PROPOSTA] */
(function (root) {
  'use strict';
  const F = (root.HF && root.HF.Falas) || require('../Falas.js');
  const C = F.C.bind(F);
  const A = 'alemao', E = 'ale', M = 'maria', S = 'sirius';

  F.adicionar('fracasso', [
    // ---------------------------------------------------------------- fuga (linha frouxa) — Alemão
    C('fuga', { sujeito: A }, [[A, 'Volta aqui! A gente tava conversando!', 'bravo']]),
    C('fuga', { sujeito: A }, [[A, 'Ele cuspiu o anzol. Na minha cara.', 'frustrado'], [E, 'Educação de peixe, Alemão.', 'neutro']]),
    C('fuga', { sujeito: A }, [[E, 'Linha frouxa, Alemão. Ele agradeceu e foi embora.', 'neutro']]),
    C('fuga', { sujeito: A }, [[A, 'Foi o vento.', 'serio'], [M, 'Que vento, Lucas?', 'rindo'], [A, 'Um vento muito discreto.', 'serio']]),
    C('fuga', { sujeito: A }, [[M, 'Ih... foi embora, né?', 'preocupado'], [A, 'Foi buscar os amigos. Já volta.', 'feliz']]),
    C('fuga', { sujeito: A }, [[A, 'Eu deixei ele ir. Foi estratégia.', 'serio'], [E, 'Estratégia de quem?', 'rindo']]),
    C('fuga', { sujeito: A, sirius: 'acordado' }, [[S, '{balbucio:curioso}'], [A, 'Ele tá perguntando cadê meu peixe.', 'frustrado'], [E, 'Tá perguntando por que você soltou.', 'neutro'], [M, 'Vocês dois precisam de ajuda.', 'rindo']], { w: 0.8 }),
    C('fuga', { sujeito: A, grande: true }, [[A, 'Era ENORME. Vocês viram a sombra?', 'surpreso'], [E, 'Vi. Ela foi embora junto.', 'neutro']]),
    C('fuga', { sujeito: A, grande: true }, [[A, 'Era o maior da lagoa. E ele fugiu.', 'frustrado'], [M, 'Vai virar o maior da história, né, Lucas?', 'rindo'], [A, 'Já virou.', 'serio']]),
    C('fuga', { sujeito: A, repetido: true }, [[E, 'Alemão, você tá alimentando os peixes.', 'rindo'], [A, 'Tô fazendo amizade. Depois eu pesco.', 'serio']]),
    C('fuga', { sujeito: A, repetido: true }, [[M, 'Lucas, respira. O peixe sente o nervoso.', 'preocupado'], [A, 'Eu tô calmíssimo.', 'bravo']]),
    C('fuga', { sujeito: A, outroCapturou: true }, [[E, 'Um vai, outro vem. Hoje vem pra mim.', 'feliz']], { m: 2 }),
    // ---------------------------------------------------------------- fuga — ALE
    C('fuga', { sujeito: E }, [[E, 'Foi. Faz parte.', 'neutro']]),
    C('fuga', { sujeito: E }, [[E, 'Esse aprendeu a lição. Eu também.', 'frustrado']]),
    C('fuga', { sujeito: E }, [[A, 'Escapou? Acontece até com os experientes!', 'rindo'], [E, 'Principalmente com eles.', 'neutro']]),
    C('fuga', { sujeito: E }, [[M, 'Pai, cadê o peixe?', 'surpreso'], [E, 'Foi visitar a família dele.', 'neutro']]),
    C('fuga', { sujeito: E }, [[E, 'Deixei ir. Tava com cara de quem tinha compromisso.', 'neutro']]),
    C('fuga', { sujeito: E, sirius: 'acordado' }, [[S, '{balbucio:bobo}'], [A, 'Ele fez o barulho da pescaria de hoje.', 'rindo'], [E, 'Ele fez carinho, Alemão. Você que não entende bebê.', 'neutro']], { w: 0.8 }),
    C('fuga', { sujeito: E, grande: true }, [[E, 'Esse era bom. Vou lembrar dele.', 'frustrado'], [A, 'Eu vi! Era um monstro!', 'surpreso']]),
    C('fuga', { sujeito: E, repetido: true }, [[E, 'Hoje eles tão me testando.', 'frustrado'], [M, 'Pai, você tá distraído.', 'preocupado'], [E, 'Tô observando, Maria. É diferente.', 'neutro']]),
    C('fuga', { sujeito: E, outroCapturou: true }, [[A, 'Um pesca, o outro assiste o peixe ir embora.', 'rindo'], [E, 'Aproveita, Alemão. Hoje é seu dia.', 'neutro']], { m: 2 }),

    // ---------------------------------------------------------------- linha rompida — Alemão
    C('rompeu', { sujeito: A }, [[A, 'ARREBENTOU!', 'bravo'], [E, 'Força não é tudo, Alemão.', 'neutro']]),
    C('rompeu', { sujeito: A }, [[A, 'Era um monstro, eu juro!', 'bravo'], [M, 'Juro que acredito, Lucas.', 'rindo']]),
    C('rompeu', { sujeito: A, alePesca: true }, [[A, 'Essa linha era de que qualidade?', 'bravo'], [E, 'A mesma da minha. A minha tá inteira.', 'neutro']]),
    C('rompeu', { sujeito: A }, [[E, 'Puxou como quem tira carro do atoleiro.', 'rindo']]),
    C('rompeu', { sujeito: A }, [[A, 'A linha tava com defeito. Claramente.', 'serio'], [M, 'Claramente, Lucas.', 'rindo']]),
    C('rompeu', { sujeito: A }, [[A, 'Minha linha!', 'preocupado'], [E, 'Linha não é corda de varal, Alemão.', 'neutro']]),
    C('rompeu', { sujeito: A, sirius: 'acordado' }, [[S, '{balbucio:surpresa}'], [A, 'Viu, Sirius? Isso é força!', 'rindo'], [E, 'Isso é a linha pedindo socorro.', 'neutro']], { w: 0.8 }),
    C('rompeu', { sujeito: A, sirius: 'acordado' }, [[S, '{balbucio:feliz}'], [E, 'Pelo menos alguém achou graça, Alemão.', 'rindo']], { w: 0.6 }),
    C('rompeu', { sujeito: A, grande: true }, [[A, 'Logo O peixe. Arrebentou logo com O peixe.', 'frustrado'], [M, 'Ah, Lucas... era grande mesmo?', 'preocupado'], [A, 'Era do tamanho da minha tristeza.', 'preocupado']]),
    C('rompeu', { sujeito: A, repetido: true }, [[M, 'Lucas, a lagoa tá ficando cheia de linha sua.', 'rindo'], [A, 'É pra marcar território.', 'serio']]),
    C('rompeu', { sujeito: A, brigaLonga: true }, [[A, 'Tanto tempo brigando pra isso?!', 'bravo'], [E, 'O peixe também tá cansado, Alemão. Mas tá livre.', 'neutro']]),
    // ---------------------------------------------------------------- linha rompida — ALE
    C('rompeu', { sujeito: E }, [[E, 'Puxei demais. Acontece.', 'frustrado']]),
    C('rompeu', { sujeito: E }, [[E, 'A linha pediu arrego.', 'neutro']]),
    C('rompeu', { sujeito: E }, [[A, 'Até você?!', 'surpreso'], [E, 'Até eu, Alemão. Até eu.', 'frustrado']]),
    C('rompeu', { sujeito: E }, [[M, 'Pai! Calma com isso.', 'preocupado'], [E, 'Eu tava calmo. A linha que não tava.', 'neutro']]),
    C('rompeu', { sujeito: E }, [[E, 'Esse era mais forte que eu. Hoje.', 'frustrado']]),
    C('rompeu', { sujeito: E, sirius: 'acordado' }, [[S, '{balbucio:surpresa}'], [A, 'Até ele se assustou!', 'rindo'], [E, 'Ele se assustou com o barulho. Eu com o prejuízo.', 'frustrado']], { w: 0.8 }),
    C('rompeu', { sujeito: E, grande: true }, [[E, 'Esse era grande. Daqueles que viram história.', 'frustrado'], [A, 'E a história é que ele ganhou.', 'rindo']]),
    C('rompeu', { sujeito: E, repetido: true }, [[A, 'Quer uma linha emprestada?', 'rindo'], [E, 'Quero que você pare de rir, Alemão.', 'bravo']], { m: 2 }),

    // ---------------------------------------------------------------- mordida perdida — Alemão
    C('perdida', { sujeito: A }, [[E, 'Mordeu e foi embora, Alemão. Você tava onde?', 'neutro'], [A, 'Tava concentrado.', 'serio']]),
    C('perdida', { sujeito: A }, [[A, 'Eu vi! Eu só... não fui.', 'preocupado']]),
    C('perdida', { sujeito: A }, [[M, 'Lucas, a boia afundou e você ficou olhando.', 'rindo'], [A, 'Eu tava admirando.', 'serio']]),
    C('perdida', { sujeito: A }, [[A, 'Esse foi treino. O próximo é pra valer.', 'serio']]),
    C('perdida', { sujeito: A }, [[E, 'O peixe mordeu, esperou e cansou de você.', 'neutro']]),
    C('perdida', { sujeito: A, repetido: true }, [[A, 'Esses peixes são muito rápidos hoje.', 'frustrado'], [M, 'Ou alguém tá muito devagar.', 'rindo']]),
    // ---------------------------------------------------------------- mordida perdida — ALE
    C('perdida', { sujeito: E }, [[E, 'Hm. Esse foi rápido.', 'neutro']]),
    C('perdida', { sujeito: E }, [[A, 'Mordeu e você nem viu!', 'rindo'], [E, 'Vi. Deixei passar. Era pequeno.', 'neutro']]),
    C('perdida', { sujeito: E }, [[M, 'Pai, acorda!', 'rindo'], [E, 'Tô acordado. Só sem pressa.', 'neutro']]),
    C('perdida', { sujeito: E }, [[E, 'Os olhos viram. A mão ficou pensando.', 'frustrado']]),
    C('perdida', { sujeito: E, sirius: 'acordado' }, [[S, '{balbucio:feliz}'], [A, 'Ele riu! Ele riu de você!', 'rindo'], [E, 'Ele riu com carinho, Alemão. É outra coisa.', 'neutro']], { w: 0.8 }),

    // ---------------------------------------------------------------- linha recolhida (sem peixe)
    C('recolheu', { sujeito: A }, [[A, 'Recolhendo pra mudar de estratégia.', 'serio'], [E, 'De novo?', 'neutro']]),
    C('recolheu', { sujeito: A, vezes: { min: 2 } }, [[M, 'Lucas, você recolhe mais do que pesca.', 'rindo']]),
    C('recolheu', { sujeito: A }, [[A, 'A isca tá ótima. Os peixes que tão sem fome.', 'serio']]),
    C('recolheu', { sujeito: A, vezes: { min: 3 } }, [[E, 'Alemão, você tá pescando ou passeando com a isca?', 'rindo'], [A, 'A isca precisa ver a lagoa.', 'serio']]),
    C('recolheu', { sujeito: E }, [[E, 'Vou tentar outro lugar.', 'neutro']]),
    C('recolheu', { sujeito: E }, [[A, 'Desistiu da boia?', 'rindo'], [E, 'Mudei de ideia. É diferente.', 'neutro']]),
    C('recolheu', { sujeito: E, vezes: { min: 2 } }, [[M, 'Pai, essa boia já conhece a lagoa inteira.', 'rindo'], [E, 'É uma boia viajada, Maria.', 'neutro']])
  ]);
})(typeof window !== 'undefined' ? window : globalThis);
