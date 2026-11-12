/*
 * Hangover Fishing — versão jogável
 * CenaCarga: carrega os spritesheets e JSONs APROVADOS (sem copiar nem alterar) e as folhas
 * do criador; gera os recortes (Recortes.js) e avisa o aplicativo.
 */
(function (root) {
  'use strict';

  const ART = '../arte/personagens-animacoes/';
  const ANIMS = {
    idle: { dir: 'idle', file: 'idle', json: 'idle.json' },
    charge: { dir: 'charge', file: 'charge', json: 'charge.json' },
    cast: { dir: 'cast', file: 'cast', json: 'cast.json' },
    reel: { dir: 'reel-fight', file: 'reel_fight', json: 'reel_fight.json' },
    catch: { dir: 'catch', file: 'catch', json: 'catch.json' },
    frustration: { dir: 'frustration', file: 'frustration', json: 'frustration.json' }
  };
  const PERSONAGENS = ['alemao', 'ale'];
  const FOLHAS = {
    logo: '../logo.jpg', arte2: '../arte%202.jpg', arte3: '../arte%203.jpg',
    // folhas de expressões (retratos dos diálogos)
    alemao_rosto: '../alemao%20rosto.jpg', ale_rosto: '../Pai%20rosto.jpg', maria_sirius: '../Maria%20e%20Sirius.jpg'
  };

  class CenaCarga extends Phaser.Scene {
    constructor() { super({ key: 'Carga' }); }

    preload() {
      this.load.on('loaderror', (file) => root.HF.app.erroDeCarga('Não foi possível carregar: ' + file.src));
      for (const name of Object.keys(ANIMS)) {
        const a = ANIMS[name];
        this.load.json('anim_' + name, ART + a.dir + '/' + a.json);
        for (const c of PERSONAGENS) {
          this.load.spritesheet(c + '_' + name, ART + a.dir + '/' + c + '_' + a.file + '_spritesheet.png', { frameWidth: 96, frameHeight: 96 });
        }
      }
      for (const [k, url] of Object.entries(FOLHAS)) this.load.image('folha_' + k, url);
    }

    create() {
      const app = root.HF.app;
      const dados = {};
      for (const name of Object.keys(ANIMS)) dados[name] = this.cache.json.get('anim_' + name);
      for (const c of PERSONAGENS) {
        for (const name of Object.keys(ANIMS)) this.textures.get(c + '_' + name).setFilter(Phaser.Textures.FilterMode.NEAREST);
      }
      const folhas = {};
      for (const k of Object.keys(FOLHAS)) folhas[k] = this.textures.get('folha_' + k).getSourceImage();
      let urls = {};
      try {
        urls = root.HF.Recortes.criar(this, folhas, PERSONAGENS);
      } catch (e) {
        console.error(e);
        app.erroDeCarga('Falha ao preparar a arte: ' + e.message);
        return;
      }
      // as folhas inteiras não são mais necessárias na memória de vídeo
      for (const k of Object.keys(FOLHAS)) this.textures.remove('folha_' + k);
      app.carregado({ animData: dados, urls });
    }
  }

  CenaCarga.ANIMS = ANIMS;
  CenaCarga.PERSONAGENS = PERSONAGENS;
  root.HF.CenaCarga = CenaCarga;
})(window);
