/* =========================================================================
   DILINO STUDIO — TRILHO DE CARDS (.rail)
   Home ("Destaques") e "Mais peças" das 51 páginas de produto.
   - Setas ‹ › nas laterais, centradas na foto (celular: por dentro; PC: na
     borda do card). Somem no começo/fim. Barrinha curta e centrada embaixo.
   - Celular: deslize nativo com snap. PC: também arrastar com o mouse
     (clique não dispara se arrastou).
   Sem dependências. Não mexe em tracking.
   ========================================================================= */
(function () {
  'use strict';
  var reduz = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var seta = function (d) {
    return '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="' + d + '"></path></svg>';
  };

  function montar(rail) {
    if (rail.getAttribute('data-rail-ok')) return;
    rail.setAttribute('data-rail-ok', '1');

    // invólucro: as setas se posicionam em relação a ele, ao lado do trilho
    var shell = document.createElement('div');
    shell.className = 'rail-shell';
    rail.parentNode.insertBefore(shell, rail);
    shell.appendChild(rail);
    shell.insertAdjacentHTML('beforeend',
      '<button type="button" class="rail-btn" data-dir="-1" aria-label="Peças anteriores">' + seta('M15 5l-7 7 7 7') + '</button>'
      + '<button type="button" class="rail-btn" data-dir="1" aria-label="Próximas peças">' + seta('M9 5l7 7-7 7') + '</button>');

    var ctrl = document.createElement('div');
    ctrl.className = 'rail-ctrl';
    ctrl.innerHTML = '<div class="rail-prog" aria-hidden="true"><span class="rail-prog-bar"></span></div>';
    shell.parentNode.insertBefore(ctrl, shell.nextSibling);

    var bar = ctrl.querySelector('.rail-prog-bar');
    var prev = shell.querySelector('[data-dir="-1"]');
    var next = shell.querySelector('[data-dir="1"]');

    // onde ficam as setas: borda dos cards (padding do trilho) e meio da foto
    function medir() {
      var cs = getComputedStyle(rail);
      var sb = shell.getBoundingClientRect(), rb = rail.getBoundingClientRect();
      shell.style.setProperty('--rail-l', (rb.left - sb.left + (parseFloat(cs.paddingLeft) || 0)) + 'px');
      shell.style.setProperty('--rail-r', (sb.right - rb.right + (parseFloat(cs.paddingRight) || 0)) + 'px');
      var foto = rail.querySelector('.pcard-media');
      if (foto) {
        var fb = foto.getBoundingClientRect();
        if (fb.height) shell.style.setProperty('--rail-mid', (fb.top - sb.top + fb.height / 2) + 'px');
      }
    }

    function atualizar() {
      var max = rail.scrollWidth - rail.clientWidth;
      var tem = max > 4;
      ctrl.hidden = !tem;
      prev.hidden = next.hidden = !tem;
      if (!tem) return;
      var vis = rail.clientWidth / rail.scrollWidth;          // fração visível
      var pos = Math.min(1, Math.max(0, rail.scrollLeft / max));
      bar.style.width = (vis * 100) + '%';
      bar.style.transform = 'translateX(' + (pos * (1 / vis - 1) * 100) + '%)';
      prev.disabled = rail.scrollLeft <= 4;
      next.disabled = rail.scrollLeft >= max - 4;
    }

    function passo() {
      var c = rail.querySelector('.pcard');
      if (!c) return rail.clientWidth * 0.8;
      var gap = parseFloat(getComputedStyle(rail).columnGap) || 0;
      var n = Math.max(1, Math.floor((rail.clientWidth + gap) / (c.getBoundingClientRect().width + gap)));
      return n * (c.getBoundingClientRect().width + gap);
    }
    [prev, next].forEach(function (b) {
      b.addEventListener('click', function () {
        rail.scrollBy({ left: passo() * +b.getAttribute('data-dir'), behavior: reduz ? 'auto' : 'smooth' });
      });
    });

    /* arrastar com o mouse (só mouse; toque usa o deslize nativo) */
    var arrastando = false, moveu = false, x0 = 0, s0 = 0;
    rail.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      arrastando = true; moveu = false; x0 = e.clientX; s0 = rail.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
      if (!arrastando) return;
      var dx = e.clientX - x0;
      if (!moveu && Math.abs(dx) > 5) { moveu = true; rail.classList.add('is-drag'); }
      if (moveu) { rail.scrollLeft = s0 - dx; e.preventDefault(); }
    });
    window.addEventListener('pointerup', function () {
      if (!arrastando) return;
      arrastando = false;
      if (moveu) {
        // devolve o snap e deixa o navegador assentar no card mais próximo
        var alvo = rail.scrollLeft;
        rail.classList.remove('is-drag');
        rail.scrollLeft = alvo;
      }
    });
    // se arrastou, o soltar não pode abrir o produto
    rail.addEventListener('click', function (e) {
      if (moveu) { e.preventDefault(); e.stopPropagation(); moveu = false; }
    }, true);
    rail.addEventListener('dragstart', function (e) { e.preventDefault(); });

    // no máximo 1 atualização por quadro
    var pendente = false;
    function agendar() {
      if (pendente) return;
      pendente = true;
      requestAnimationFrame(function () { pendente = false; atualizar(); });
    }
    function tudo() { medir(); atualizar(); }
    rail.addEventListener('scroll', agendar, { passive: true });
    window.addEventListener('resize', tudo, { passive: true });
    window.addEventListener('load', tudo);
    // cards da home chegam por JS e fotos carregam depois: remede quando o trilho muda
    if ('ResizeObserver' in window) new ResizeObserver(tudo).observe(rail);
    tudo();
  }

  function iniciar() { [].forEach.call(document.querySelectorAll('.rail'), montar); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
