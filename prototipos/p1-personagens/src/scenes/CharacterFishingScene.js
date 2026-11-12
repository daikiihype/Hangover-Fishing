/*
 * Hangover Fishing — P1 com personagens
 * CharacterFishingScene: a cena do P1 (FishingScene, sem alterações) + os personagens animados.
 *
 * É uma SUBCLASSE da cena do P1. Tudo o que não é personagem continua sendo feito pelo
 * código do P1: toques, pausa, placar, água, boia, briga, medidor de tensão, cartões,
 * sons e diagnóstico. Esta classe só:
 *   - carrega os spritesheets e JSONs aprovados (preload);
 *   - cria um sprite e um CharacterAnimator por jogador (create);
 *   - troca o boneco cinza e a vara desenhada pelo sprite, e prende a linha na ponta
 *     da vara do quadro atual (drawPlayer).
 *
 * A camada visual só LÊ a pescaria. Nenhuma linha aqui chama press/release/update de um
 * jogador nem muda configuração, prazos ou estados.
 *
 * Parâmetros opcionais no endereço (além dos do P1: ?diag=1, ?seed=1234):
 *   ?escala=1|2|3   escala inteira dos personagens (padrão: a maior que cabe no espaço que o
 *                   layout do P1 reserva para o pescador; a escala final é a decisão D10, em aberto)
 */
(function (root) {
  'use strict';

  const Base = root.HF.FishingScene;               // a cena do P1, carregada antes deste arquivo
  const S = root.HF.FishingPlayer.STATES;
  const IDS = ['P1', 'P2'];
  const ART = '../../arte/personagens-animacoes/';
  const ANIMS = {
    idle: { dir: 'idle', file: 'idle', json: 'idle.json' },
    charge: { dir: 'charge', file: 'charge', json: 'charge.json' },
    cast: { dir: 'cast', file: 'cast', json: 'cast.json' },
    reel: { dir: 'reel-fight', file: 'reel_fight', json: 'reel_fight.json' },
    catch: { dir: 'catch', file: 'catch', json: 'catch.json' },
    frustration: { dir: 'frustration', file: 'frustration', json: 'frustration.json' }
  };
  // Identidade oficial: P1 = Alemão (vara e molinete vermelhos), P2 = ALE (pretos e amarelos).
  const CHARACTERS = {
    P1: { key: 'alemao', flip: false },             // metade esquerda, olhando para a direita (água)
    P2: { key: 'ale', flip: true }                  // metade direita: espelhado (plano, seção 2.5)
  };
  const FRAME = 96;
  const CHARACTER_HEIGHT = 64;                       // do topo da cabeça (y ≈ 32) até a base do quadro
  // Cores provisórias do peixe na mão (as mesmas do cartão de captura do P1, por perfil).
  const FISH_COLORS = { rapido: 0x9ad3ff, pesado: 0xa08a62, arisco: 0xc79cff };

  function lerp(a, b, t) { return a + (b - a) * t; }

  class CharacterFishingScene extends Base {
    preload() {
      for (const name of Object.keys(ANIMS)) {
        const a = ANIMS[name];
        this.load.json('anim_' + name, ART + a.dir + '/' + a.json);
        for (const id of IDS) {
          const c = CHARACTERS[id].key;
          this.load.spritesheet(c + '_' + name, ART + a.dir + '/' + c + '_' + a.file + '_spritesheet.png',
            { frameWidth: FRAME, frameHeight: FRAME });
        }
      }
    }

    create() {
      // Dados aprovados (tempos, índices, pontos da vara e da mão)
      this.animData = {};
      for (const name of Object.keys(ANIMS)) this.animData[name] = this.cache.json.get('anim_' + name);

      // Pixel art nítido: sem suavização ao ampliar (escala inteira).
      for (const id of IDS) {
        for (const name of Object.keys(ANIMS)) {
          this.textures.get(CHARACTERS[id].key + '_' + name).setFilter(Phaser.Textures.FilterMode.NEAREST);
        }
      }

      this.chars = {};
      for (const id of IDS) {
        const c = CHARACTERS[id];
        this.chars[id] = {
          key: c.key,
          flip: c.flip,
          anim: new root.HF.CharacterAnimator({ character: c.key, data: this.animData, random: Math.random }),
          sprite: null,
          shown: null,
          x: 0, y: 0, scale: 1,
          idleHand: this.animData.reel.pontos[c.key][0].maoDaFrente
        };
      }

      super.create();                               // cena do P1: gráficos, textos, toques, eventos, layout

      // Ordem de desenho: fundo < personagens < peixe na mão < linha, boia, efeitos e cartões (P1)
      this.bg.setDepth(-3);
      this.charFx = this.add.graphics().setDepth(-1);
      for (const id of IDS) {
        const ch = this.chars[id];
        ch.sprite = this.add.sprite(0, 0, ch.key + '_idle', 0).setOrigin(0.5, 1).setFlipX(ch.flip).setDepth(-2);
      }
      this.layoutCharacters();

      // Transições do P1 → animador de CADA jogador (um nunca recebe as do outro).
      this.session.onEvent((e) => {
        if (e.tipo !== 'estado' || !this.chars[e.jogador]) return;
        const p = this.session.players[e.jogador];
        // time: instante da transição; o quadro de tela seguinte só conta o tempo depois dela
        this.chars[e.jogador].anim.onState(e.de, e.para, { castPower: p.castPower, pressed: p.pressed, time: e.time });
      });
      this.lastVisualNow = null;
      this.app.characters = this.chars;             // para o diagnóstico e os testes
    }

    onResize(size) {
      super.onResize(size);
      if (this.chars && this.chars.P1.sprite) this.layoutCharacters();
    }

    layoutCharacters() {
      const L = this.L;
      const param = Number(new URLSearchParams(root.location.search).get('escala'));
      // Padrão: a maior escala inteira em que o personagem (64 px do topo da cabeça à base do
      // quadro) cabe na altura que o layout do P1 reserva para o pescador (corpo 0,13 H + cabeça
      // 0,0546 H). Assim nada cobre os cartões de resultado, e o layout do P1 não muda.
      const reserved = L.H * (0.13 + 0.07 * 0.78);
      const auto = Math.max(1, Math.min(3, Math.floor(reserved / CHARACTER_HEIGHT)));
      const scale = [1, 2, 3].includes(param) ? param : auto;
      for (const id of IDS) {
        const ch = this.chars[id], t = this.texts[id];
        ch.scale = scale;
        ch.x = Math.round(L.side[id].playerX);
        ch.y = Math.round(L.H - (t.name.height + 12));   // mesma linha do chão do boneco cinza do P1
        ch.sprite.setScale(scale).setPosition(ch.x, ch.y);
      }
    }

    /** Ponto do quadro de 96 × 96 → tela (considera escala e espelhamento). */
    toScreen(id, pt) {
      const ch = this.chars[id], sc = ch.scale;
      const fx = ch.flip ? (FRAME - 1 - pt[0]) : pt[0];
      return { x: ch.x - (FRAME / 2) * sc + (fx + 0.5) * sc, y: ch.y - FRAME * sc + (pt[1] + 0.5) * sc };
    }

    update() {
      // Relógio da camada visual: tempo de jogo. Parado durante qualquer pausa (menu,
      // retrato, interrupção) e limitado como a simulação do P1 (250 ms) depois de travadas.
      const now = performance.now();
      const dt = this.lastVisualNow == null ? 0 : Math.min(root.HF.FishingPlayer.MAX_CATCH_UP_MS, now - this.lastVisualNow);
      this.lastVisualNow = now;
      this.visualNow = now;
      this.visualDt = this.isBlocked() ? 0 : dt;
      this.charFx.clear();
      super.update();
    }

    /** Atualiza o animador e o sprite de um jogador; devolve o quadro mostrado. */
    updateCharacter(id, s) {
      const ch = this.chars[id];
      ch.anim.update(s.paused ? 0 : this.visualDt, s, this.visualNow);
      const f = ch.anim.frame();
      const key = ch.key + '_' + f.anim;
      if (!ch.shown || ch.shown.key !== key || ch.shown.index !== f.index) {   // só troca quando muda
        ch.sprite.setTexture(key, f.index);
        ch.shown = { key, index: f.index };
      }
      return f;
    }

    // Cópia do drawPlayer do P1. Só mudam: o pescador (sprite em vez do boneco cinza), a vara
    // (ponta do quadro atual), a posição do medidor de força, o anel de "pressionando", a boia
    // do arremesso (sai da ponta da vara no quadro de soltura, cast.json) e o peixe na mão (CATCH).
    drawPlayer(id, s, now) {
      const g = this.world, L = this.L, sd = L.side[id], t = this.texts[id], cfg = this.session.config;
      const m = this.marks[id];
      const ch = this.chars[id], sc = ch.scale;
      const colors = this.colorOf(id);

      // ---- placar (igual ao P1) ----
      const st = s.stats;
      t.hud.setText((id === 'P1' ? 'ALEMÃO' : 'ALE') + '   🐟 ' + st.capturas +
        (st.capturas ? '  ·  maior ' + st.maiorPesoKg.toFixed(2).replace('.', ',') + ' kg' : '')).setColor(colors.css);

      // ---- personagem animado ----
      const f = this.updateCharacter(id, s);
      const tip = this.toScreen(id, f.rodTip);
      const hand = this.toScreen(id, f.frontHand || ch.idleHand);
      if (s.pressed) g.lineStyle(3, 0xffffff, 0.8).strokeCircle(hand.x, hand.y, 6 * sc);   // "estou pressionando"
      if (f.fish && s.state === S.CAUGHT) this.drawFishInHand(id, hand, s);

      // ---- linha, boia, peixe (igual ao P1, com a linha saindo da ponta da vara do quadro) ----
      t.bang.setVisible(false);
      t.dist.setVisible(false);
      const bob = { x: sd.bobX, y: this.distToY(s.distance) };
      switch (s.state) {
        case S.CHARGING: {
          const d = cfg.castMinDistance + (cfg.castMaxDistance - cfg.castMinDistance) * s.chargePower;
          const ty = this.distToY(d);
          g.lineStyle(2, 0xffffff, 0.7).strokeCircle(sd.bobX, ty, 12);
          g.lineStyle(2, 0xffffff, 0.35).lineBetween(sd.bobX - 20, ty, sd.bobX + 20, ty);
          // medidor de força: logo acima da cabeça do personagem
          const bw = L.halfW * 0.34, bh = Math.max(10, L.H * 0.03);
          const bx = ch.x - bw / 2, by = ch.y - (FRAME - 22) * sc - bh - 6;
          g.fillStyle(0x000000, 0.6).fillRect(bx - 2, by - 2, bw + 4, bh + 4);
          g.fillStyle(colors.light, 1).fillRect(bx, by, bw * s.chargePower, bh);
          g.lineStyle(2, 0xffffff, 0.8).strokeRect(bx - 2, by - 2, bw + 4, bh + 4);
          break;
        }
        case S.CASTING: {
          // A boia aparece na ponta da vara do quadro de soltura, X ms depois do comando
          // (cast.json → soltura) e chega à água no MESMO instante da lógica do P1.
          const spec = ch.anim.spec.cast;
          const band = root.HF.CharacterAnimator.castBand(ch.anim.spec, s.castPower);
          const rel = spec.releaseMs[band];
          const dur = cfg.castFlightBaseMs + cfg.castFlightPerPowerMs * s.castPower;
          if (s.msInState >= rel) {
            const from = this.toScreen(id, spec.points[spec.releaseIndex].pontaDaVara);
            const k = Math.min(1, (s.msInState - rel) / Math.max(1, dur - rel));
            const x = lerp(from.x, bob.x, k), y = lerp(from.y, bob.y, k) - Math.sin(Math.PI * k) * L.H * 0.18;
            this.drawLine(g, tip, { x, y }, 0.2, 0xffffff, 1.5);
            this.drawBobber(g, x, y, colors, 1);
          }
          break;
        }
        case S.WAITING:
        case S.REELING_EMPTY: {
          const dip = m.nibbleUntil && now < m.nibbleUntil ? 5 : 0;
          const y = bob.y + Math.sin(now / 350) * 2 + dip;
          this.drawLine(g, tip, { x: bob.x, y }, 0.35, 0xffffff, 1.5);
          this.drawBobber(g, bob.x, y, colors, 1);
          t.dist.setText(Math.round(s.distance) + ' m').setPosition(bob.x, y + 12).setVisible(true);
          break;
        }
        case S.BITE: {
          const y = bob.y + 7 + Math.sin(now / 40) * 2;
          this.drawLine(g, tip, { x: bob.x, y }, 0.05, 0xffffff, 2);
          this.drawBobber(g, bob.x, y, colors, 0.55);
          g.fillStyle(0x215f88, 1).fillRect(bob.x - 14, y + 1, 28, 12);
          t.bang.setText('!').setPosition(bob.x, y - 16).setVisible(true);
          const k = s.biteLeftMs / s.biteWindowMs, ww = 60;
          g.fillStyle(0xffffff, 0.9).fillRect(bob.x - ww / 2, y + 18, ww * k, 5);
          break;
        }
        case S.FIGHTING:
          this.drawFight(g, s, tip, bob, now, sd);
          break;
        case S.LINE_BROKEN:
          if (m.snapAt && now - m.snapAt < 600) {
            const k = (now - m.snapAt) / 600;
            g.lineStyle(2, 0xff3b3b, 1 - k).lineBetween(tip.x, tip.y, lerp(tip.x, m.snapFrom.x, 0.4), lerp(tip.y, m.snapFrom.y, 0.4) + k * 40);
          }
          break;
        default:
          break;
      }

      if (m.toastUntil && now < m.toastUntil && !s.paused) {
        const left = m.toastUntil - now;
        t.toast.setText(m.toastText).setAlpha(Math.min(1, left / 300)).setVisible(true);
      } else {
        t.toast.setVisible(false);
      }

      this.drawMeter(s, sd, now);
      this.drawPrompt(id, s, now);
      this.drawResult(id, s, now);
    }

    /** Cores de cada jogador (mesmos valores do P1: vermelho do Alemão, amarelo do ALE). */
    colorOf(id) {
      return id === 'P1'
        ? { main: 0xd23c3c, light: 0xff6b6b, css: '#ff7b7b' }
        : { main: 0xd8b21f, light: 0xffd23f, css: '#ffd23f' };
    }

    /**
     * CATCH: o peixe não faz parte do sprite (plano 5.5). Silhueta provisória (greybox, como o
     * peixe do cartão do P1), pendurada da mão da frente para baixo e para fora (catch.json →
     * peixe.recomendacao), com o tamanho pelo peso.
     */
    drawFishInHand(id, hand, s) {
      const g = this.charFx, ch = this.chars[id], sc = ch.scale;
      const r = s.lastResult || {};
      const out = ch.flip ? -1 : 1;
      const len = (8 + 10 * Math.min(1, (r.pesoKg || 1) / 6)) * sc;   // 8–18 px do quadro
      const w = len * 0.42;
      const cx = hand.x + out * 2 * sc, top = hand.y + 1 * sc;
      const color = FISH_COLORS[r.perfil] || 0xcccccc;
      g.fillStyle(color, 1).fillEllipse(cx, top + len / 2, w, len);
      g.fillTriangle(cx, top + len - 2 * sc, cx - w * 0.6, top + len + w * 0.7, cx + w * 0.6, top + len + w * 0.7);
      g.fillStyle(0x000000, 1).fillRect(Math.round(cx + out * w * 0.15 - sc / 2), Math.round(top + len * 0.18), sc, sc);
    }
  }

  CharacterFishingScene.CHARACTERS = CHARACTERS;
  CharacterFishingScene.ANIMS = ANIMS;
  root.HF.P1FishingScene = Base;
  // O main.js do P1 cria o jogo com HF.FishingScene: aqui ela passa a ser a cena com personagens.
  root.HF.FishingScene = CharacterFishingScene;
})(window);
