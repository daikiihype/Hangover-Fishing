/*
 * Hangover Fishing — Protótipo P1 (pesca)
 * DiagnosticsPanel: painel de diagnóstico em HTML, por cima do jogo.
 *
 * Mostra, para cada jogador, o estado da máquina, os tempos e a tensão,
 * além dos contadores e dos últimos eventos. Não captura toques
 * (pointer-events: none), então pode ficar ligado durante o jogo.
 */
(function (root) {
  'use strict';

  const STATE_LABELS = root.HF.FishingPlayer.STATE_LABELS;

  function s(ms) { return ms == null ? '—' : (ms / 1000).toFixed(2) + ' s'; }
  function pct(v) { return Math.round(v * 100) + '%'; }
  function n1(v) { return (Math.round(v * 10) / 10).toFixed(1); }

  /** Uma linha legível para cada evento do registro da sessão. */
  function formatEntry(e) {
    const head = '#' + String(e.seq).padStart(4, ' ') + ' ' + (e.t / 1000).toFixed(2).padStart(7, ' ') + 's ' + (e.jogador || '--') + ' ';
    switch (e.tipo) {
      case 'estado': return head + 'ESTADO     ' + e.de + ' → ' + e.para + (e.motivo ? '  (' + e.motivo + ')' : '');
      case 'arremesso': return head + 'ARREMESSO  força ' + pct(e.forca) + ' · ' + e.distancia + ' m';
      case 'arremesso-cancelado': return head + 'ARR.CANCEL ' + e.motivo + (e.codigo === 'toque-curto' ? ' · aviso "SEGURE PARA ARREMESSAR!"' : '');
      case 'boia-na-agua': return head + 'BOIA       na água a ' + e.distancia + ' m';
      case 'espera': return head + 'ESPERA     mordida em ' + s(e.mordidaEmMs) + ' · beliscadas ' + e.beliscadas;
      case 'beliscada': return head + 'BELISCADA  (sinal falso)';
      case 'toque-prematuro': return head + 'PREMATURO  toque ignorado (' + e.duracaoMs + ' ms; mordida em ' + s(e.mordidaEmMs) + ')';
      case 'recolhimento-concluido': return head + 'RECOLHIDA  linha toda recolhida, sem penalidade';
      case 'mordida': return head + 'MORDIDA    janela ' + e.janelaMs + ' ms' + (e.dedoApoiado ? ' · dedo já apoiado (não vale)' : '');
      case 'fisgada': return head + 'FISGADA    reação ' + e.reacaoMs + ' ms (janela ' + e.janelaMs + ') · ' + e.perfil + ' ' + e.pesoKg + ' kg';
      case 'toque-atrasado': return head + 'ATRASADO   +' + e.atrasoMs + ' ms depois da janela (' + e.janelaMs + ' ms)';
      case 'mordida-perdida': return head + 'PERDEU     sem reação na janela de ' + e.janelaMs + ' ms';
      case 'arrancada': return head + 'ARRANCADA  peixe puxando';
      case 'zona-tensao': return head + 'ZONA       ' + e.zona + ' (' + e.tensao + ')';
      case 'linha-rompida': return head + 'ROMPEU     ' + e.motivo;
      case 'fuga': return head + 'FUGA       ' + e.motivo;
      case 'captura': return head + 'CAPTURA    ' + e.peixe + ' ' + e.pesoKg + ' kg · briga ' + s(e.brigaMs) + ' · por ' + e.nome;
      case 'toque-ignorado': return head + 'IGNORADO   ' + e.motivo;
      case 'pausa': return head + 'TRAVADA    ' + s(e.ms) + ' não contados (página parada > 0,25 s)';
      case 'interrupcao-inicio': return head + 'PAUSA      ' + e.motivo + (e.aguardaToque ? ' · aguardando toque para continuar' : '');
      case 'interrupcao-extra': return head + 'PAUSA+     ' + e.motivo + ' (já estava pausado)';
      case 'interrupcao-fim': return head + 'RETOMADA   ' + e.motivo + ' · ' + s(e.ms) + ' congelados';
      case 'aviso-retomada': return head + 'AVISO      "ARREMESSO CANCELADO" (carregava quando o jogo pausou)';
      case 'espera-retomada': return head + 'ESPERA     retomada: mordida em ' + s(e.mordidaEmMs) + ' (tempo preservado)';
      case 'recolhimento-inicio': return head + 'RECOLHER   linha vazia a ' + e.distancia + ' m · espera restante ' + s(e.esperaRestanteMs);
      case 'config': return head + 'CONFIG     ' + e.chave + ' = ' + e.valor;
      default: return head + e.tipo;
    }
  }

  function playerText(snap) {
    const st = snap.stats;
    const lines = [];
    lines.push(snap.id + ' ' + snap.label.toUpperCase() + '  ·  ' + snap.state + ' (' + STATE_LABELS[snap.state] + ')  ' + s(snap.msInState));
    lines.push('dedo: ' + (snap.pressed ? 'PRESSIONADO' : 'solto') + '   distância: ' + n1(snap.distance) + ' m' +
      (snap.state === 'CHARGING' ? '   força: ' + pct(snap.chargePower) : ''));
    if (snap.biteInMs != null) {
      lines.push('mordida em: ' + s(snap.biteInMs) + (snap.state === 'REELING_EMPTY' ? ' (congelada enquanto recolhe)' : ''));
    }
    if (snap.biteLeftMs != null) lines.push('JANELA: resta ' + snap.biteLeftMs + ' de ' + snap.biteWindowMs + ' ms');
    if (snap.state === 'FIGHTING') {
      lines.push('tensão: ' + snap.tension.toFixed(2) + ' [' + snap.zone + ']   frouxa ' + s(snap.slackMs) + '   crítica ' + s(snap.criticalMs));
      if (snap.fish) {
        lines.push('peixe: ' + snap.fish.nome + ' ' + snap.fish.pesoKg + ' kg · energia ' + pct(snap.fish.energia) +
          ' · ' + snap.fish.fase + ' · puxão ' + snap.fish.puxao.toFixed(2) + ' · briga ' + s(snap.fish.brigaMs));
      }
    }
    lines.push('última reação: ' + (snap.lastReactionMs != null ? snap.lastReactionMs + ' ms' : '—') +
      (snap.lastResult ? '   último resultado: ' + snap.lastResult.tipo + (snap.lastResult.motivo ? ' (' + snap.lastResult.motivo + ')' : '') : ''));
    lines.push('arremessos ' + st.arremessos + ' · cancel. ' + st.arremessosCancelados + ' · recolh.vazios ' + st.recolhimentosVazios);
    lines.push('mordidas ' + st.mordidas + ' · fisgadas ' + st.fisgadas + ' · perdidas ' + st.mordidasPerdidas +
      ' · prematuros ' + st.toquesPrematuros + ' · atrasados ' + st.toquesAtrasados);
    lines.push('capturas ' + st.capturas + ' (' + st.pesoTotalKg + ' kg) · fugas ' + st.fugas + ' · rompidas ' + st.linhasRompidas);
    return lines.join('\n');
  }

  class DiagnosticsPanel {
    constructor(session) {
      this.session = session;
      this.root = document.getElementById('diag');
      this.p1 = document.getElementById('diag-p1');
      this.p2 = document.getElementById('diag-p2');
      this.footer = document.getElementById('diag-footer');
      this.visible = false;
    }

    setVisible(v) {
      this.visible = v;
      this.root.hidden = !v;
    }

    update(snaps, info) {
      if (!this.visible) return;
      this.p1.textContent = playerText(snaps.P1);
      this.p2.textContent = playerText(snaps.P2);
      const router = this.session.router;
      const last = this.session.log.filter((e) => e.tipo !== 'zona-tensao' && e.tipo !== 'estado').slice(-6);
      this.footer.textContent =
        'FPS ' + info.fps + ' · tela ' + info.width + '×' + info.height + ' · semente ' + this.session.seed +
        ' · erros de toque ' + router.errors.length + ' · pausas ' + this.session.pauseCount +
        (this.session.awaitingTap ? ' · PAUSADO (toque para continuar)' : info.paused ? ' · PAUSADO' : '') + '\n' +
        last.map(formatEntry).join('\n');
    }
  }

  DiagnosticsPanel.formatEntry = formatEntry;
  DiagnosticsPanel.playerText = playerText;
  root.HF = root.HF || {};
  root.HF.DiagnosticsPanel = DiagnosticsPanel;
})(window);
