/*
 * Hangover Fishing — Protótipo 0 (multitouch)
 * TestMenu: menu HTML com o roteiro de testes e ferramentas de diagnóstico.
 *
 * É HTML comum (não Phaser) porque precisa de rolagem, texto selecionável e
 * botões fáceis de tocar. Fica fora do canvas: tocar nele não conta para
 * nenhum jogador.
 */
(function (root) {
  'use strict';

  // Roteiro: os 10 testes pedidos na missão + teste livre.
  const TESTS = [
    { id: 'livre', titulo: 'Teste livre', instrucao: 'Uso livre, sem roteiro.' },
    { id: 'T01', titulo: '1. Jogador 1 sozinho',
      instrucao: 'Só o Jogador 1 toca e segura na metade ESQUERDA. A metade direita não pode reagir.' },
    { id: 'T02', titulo: '2. Jogador 2 sozinho',
      instrucao: 'Só o Jogador 2 toca e segura na metade DIREITA. A metade esquerda não pode reagir.' },
    { id: 'T03', titulo: '3. Toques simultâneos',
      instrucao: 'Contem "3, 2, 1, já" e toquem juntos, 20 vezes. Os contadores de toques dos dois devem subir igual.' },
    { id: 'T04', titulo: '4. Um segura, o outro toca repetidamente',
      instrucao: 'P1 segura sem soltar; P2 toca 20 vezes rápido. O estado de P1 deve ficar "SEGURANDO" o tempo todo. Depois invertam.' },
    { id: 'T05', titulo: '5. Os dois segurando',
      instrucao: 'Os dois seguram por 10 segundos, 10 vezes. As duas zonas devem ficar acesas o tempo todo.' },
    { id: 'T06', titulo: '6. Arrastar para a outra zona',
      instrucao: 'Pressione em um lado, arraste até o outro e solte. O dedo deve continuar com a cor de quem começou (anel tracejado) e a outra zona não pode acender.' },
    { id: 'T07', titulo: '7. Soltar um dedo enquanto outro segura',
      instrucao: 'Os dois seguram; um solta. O outro continua "SEGURANDO". Repita com 2 dedos na mesma zona: ela só fica livre quando o último dedo sair.' },
    { id: 'T08', titulo: '8. Interromper a página e voltar',
      instrucao: 'Com as zonas pressionadas: puxe as notificações, troque de aplicativo, bloqueie a tela. Ao voltar, as duas zonas devem estar LIVRES e o registro deve mostrar "reset".' },
    { id: 'T09', titulo: '9. Cancelar toques',
      instrucao: 'Segurando uma zona, faça um gesto do sistema (deslizar da borda, central de controle) ou gire o celular para retrato. Deve aparecer "cancelado" e nenhuma zona pode ficar presa.' },
    { id: 'T10', titulo: '10. Toques rápidos e sustentados',
      instrucao: 'Alternem toques rápidos e seguradas (anote a sequência que vocês fizeram). Confira no registro se cada um foi classificado como "toque" ou "segurar".' }
  ];

  class TestMenu {
    constructor(handlers) {
      this.handlers = handlers;
      this.currentTest = 'livre';
      this.button = document.getElementById('menu-button');
      this.menu = document.getElementById('menu');
      this.list = document.getElementById('test-list');
      this.thresholdLabel = document.getElementById('threshold-value');
      this.report = document.getElementById('report');
      this.reportText = document.getElementById('report-text');

      this._buildList();
      this.button.addEventListener('click', () => this.open());
      this.menu.addEventListener('click', (event) => this._onClick(event));
    }

    get tests() {
      return TESTS;
    }

    getTest(id) {
      return TESTS.find((t) => t.id === id) || TESTS[0];
    }

    isOpen() {
      return !this.menu.hidden;
    }

    open() {
      this.menu.hidden = false;
      this.report.hidden = true;
      this.handlers.onOpen();
    }

    close() {
      this.menu.hidden = true;
      this.handlers.onClose();
    }

    setThresholdLabel(ms) {
      this.thresholdLabel.textContent = ms + ' ms';
    }

    _buildList() {
      this.list.innerHTML = '';
      for (const test of TESTS) {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'test-item';
        item.dataset.test = test.id;
        item.setAttribute('aria-pressed', String(test.id === this.currentTest));
        item.innerHTML = '<strong></strong><small></small>';
        item.querySelector('strong').textContent = test.titulo;
        item.querySelector('small').textContent = test.instrucao;
        this.list.appendChild(item);
      }
    }

    _onClick(event) {
      if (event.target === this.menu) {    // toque fora do painel fecha o menu
        this.close();
        return;
      }
      const testButton = event.target.closest('[data-test]');
      if (testButton) {
        this.currentTest = testButton.dataset.test;
        for (const el of this.list.querySelectorAll('[data-test]')) {
          el.setAttribute('aria-pressed', String(el.dataset.test === this.currentTest));
        }
        this.handlers.onSelectTest(this.getTest(this.currentTest));
        this.close();
        return;
      }
      const actionButton = event.target.closest('[data-action]');
      if (!actionButton) return;
      switch (actionButton.dataset.action) {
        case 'close':
          this.close();
          break;
        case 'threshold-down':
          this.setThresholdLabel(this.handlers.onThreshold(-25));
          break;
        case 'threshold-up':
          this.setThresholdLabel(this.handlers.onThreshold(25));
          break;
        case 'reset':
          this.handlers.onReset();
          this.close();
          break;
        case 'fullscreen':
          this.handlers.onFullscreen();
          break;
        case 'report':
          this.reportText.value = this.handlers.onReport();
          this.report.hidden = false;
          break;
      }
    }
  }

  root.HF = root.HF || {};
  root.HF.TestMenu = TestMenu;
})(window);
