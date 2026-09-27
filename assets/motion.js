/* =========================================================================
   DILINO STUDIO — MOVIMENTO AO ROLAR (par de assets/motion.css)
   - PC (≥1025px + mouse): títulos com máscara, cards em cascata, banner que
     abre + parallax, barra de progresso de leitura.
   - Celular: só fade curto dos blocos (o que é comum e funciona).
   - Só marca elementos que estão ABAIXO da dobra no carregamento: o que já
     está na tela nunca some e reaparece (sem piscar).
   - Nunca anima quem contém elemento fixo/sticky (barra de compra, carrinho,
     cabeçalho, coluna da foto) — transform quebraria o position:fixed.
   - Revelado, tira o [data-mo] e o elemento volta ao estilo original.
   Sem dependências. Não mexe em tracking.
   ========================================================================= */
(function () {
  'use strict';
  var html = document.documentElement;
  var mm = window.matchMedia ? function (q) { return window.matchMedia(q).matches; } : function () { return false; };
  if (mm('(prefers-reduced-motion: reduce)')) return;
  var PC = mm('(min-width:1025px) and (hover:hover) and (pointer:fine)');

  /* cabeçalho da home: sombra ao rolar (celular e PC) */
  var hd = document.querySelector('.hd');
  if (hd) {
    var sombra = function () { hd.classList.toggle('mo-scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', sombra, { passive: true });
    sombra();
  }

  if (!('IntersectionObserver' in window)) return;
  html.classList.add('mo', PC ? 'mo-pc' : 'mo-m');

  /* ------------------------------------------------------------ alvos
     [seletor, tipo, grupo?]. grupo = revela todos juntos, em cascata, quando o
     primeiro entra (ex.: cards de um trilho horizontal). */
  var ALVOS_PC = [
    // home
    ['.sec-h h2', 'title'],
    ['#cats > *', 'up'],
    ['.pgrid > .pcard', 'card'],
    ['.more', 'up'],
    ['.enc .tag, .enc h2, .enc > p', 'up'],
    ['.enc-steps li', 'up'],
    ['.banner-meio', 'img'],
    ['.rail', 'card', true],
    ['.transp-head > *', 'up'],
    ['.transp-list li', 'up'],
    ['.lead', 'up'],
    ['.foot-in > *', 'up'],
    // produto
    ['.col-b > :not(.safe)', 'up'],
    ['.safe li', 'up'],
    ['.sec-title', 'title'],
    // institucionais
    ['.doc-wrap > h2', 'title'],
    ['.doc-wrap > :not(h2):not(.ct-grid)', 'up'],
    ['.ct-grid > *', 'card']
  ];
  var ALVOS_M = [
    // home já tem o próprio .reveal por seção; aqui só produto
    ['.col-b > *', 'up'],
    ['.rail-wrap .sec', 'up']
  ];

  var PROIBIDO = '.buybar, .cart-fab, .hd, .col-media, [data-dlc-cart], .dlc-launcher';
  var fold = window.innerHeight;
  var marcados = [];

  function podeAnimar(el) {
    if (el.hasAttribute('data-mo')) return false;
    if (el.matches(PROIBIDO) || el.querySelector(PROIBIDO)) return false;
    var cs = getComputedStyle(el);
    if (cs.position === 'fixed' || cs.position === 'sticky') return false;
    if (cs.animationName && cs.animationName !== 'none') return false;   // já tem chegada em CSS
    if (cs.display === 'none') return false;
    var r = el.getBoundingClientRect();
    return r.top >= fold - 1;                                            // só abaixo da dobra
  }

  function marcar(el, tipo) {
    el.setAttribute('data-mo', tipo);
    marcados.push(el);
  }

  (PC ? ALVOS_PC : ALVOS_M).forEach(function (a) {
    [].forEach.call(document.querySelectorAll(a[0]), function (el) {
      if (a[2]) {                        // grupo: marca os filhos, observa o pai
        if (!podeAnimar(el)) return;
        el.setAttribute('data-mo-grupo', '');
        [].forEach.call(el.children, function (c) { c.setAttribute('data-mo', a[1]); });
        marcados.push(el);
      } else if (podeAnimar(el)) {
        marcar(el, a[1]);
      }
    });
  });

  /* ------------------------------------------------------------ revelar */
  var PASSO = PC ? 85 : 0, MAX_PASSOS = 6, CASCATA_MAX = 520;   // ms: a cascata inteira cabe em ~0,5s

  function limpar(el) {
    var feito = false;
    function fim() {
      if (feito) return; feito = true;
      el.removeAttribute('data-mo');
      el.classList.remove('is-in');
      el.style.transitionDelay = '';
    }
    el.addEventListener('transitionend', function (e) { if (e.target === el) setTimeout(fim, 400); });
    setTimeout(fim, 2600);                 // rede: mesmo sem transitionend
  }
  function mostrar(el, atraso) {
    if (atraso) el.style.transitionDelay = atraso + 'ms';
    el.classList.add('is-in');
    limpar(el);
  }
  function revelar(el, i, passo) {
    var atraso = Math.round(i * (passo == null ? PASSO : passo));
    if (el.hasAttribute('data-mo-grupo')) {
      el.removeAttribute('data-mo-grupo');
      var n = 0;
      [].forEach.call(el.children, function (c) {
        if (!c.hasAttribute('data-mo')) return;
        // só os visíveis no trilho entram em cascata; o resto aparece sem atraso
        var visivel = c.getBoundingClientRect().left < window.innerWidth;
        mostrar(c, visivel ? atraso + Math.min(n++, MAX_PASSOS) * 70 : 0);
      });
    } else {
      mostrar(el, atraso);
    }
  }

  var funcionou = false;
  var io = new IntersectionObserver(function (entradas) {
    funcionou = true;
    var entrando = [];
    entradas.forEach(function (e) {
      if (e.isIntersecting) { entrando.push(e); io.unobserve(e.target); }
      else if (e.boundingClientRect.bottom < 0) {       // passou por cima (âncora, volta de página)
        io.unobserve(e.target); revelar(e.target, 0);
      }
    });
    // cascata na ordem de leitura: de cima pra baixo, da esquerda pra direita
    entrando.sort(function (a, b) {
      var dy = a.boundingClientRect.top - b.boundingClientRect.top;
      return Math.abs(dy) > 8 ? dy : a.boundingClientRect.left - b.boundingClientRect.left;
    });
    // lote grande (rolagem rápida, âncora): passo encolhe e a cascata continua visível
    var passo = entrando.length > 1 ? Math.min(PASSO, CASCATA_MAX / (entrando.length - 1)) : 0;
    entrando.forEach(function (e, i) { revelar(e.target, i, passo); });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
  marcados.forEach(function (el) { io.observe(el); });

  /* rede de segurança: se o observador nunca respondeu (aba oculta, bug do
     navegador), nada pode ficar escondido. Impressão também revela tudo. */
  function tudo() {
    marcados.forEach(function (el) {
      if (el.hasAttribute('data-mo-grupo')) revelar(el, 0);
      else if (el.hasAttribute('data-mo')) mostrar(el, 0);
    });
  }
  function checar() { if (!funcionou) tudo(); }
  if (document.visibilityState === 'visible') setTimeout(checar, 3000);
  else document.addEventListener('visibilitychange', function v() {
    if (document.visibilityState !== 'visible') return;
    document.removeEventListener('visibilitychange', v);
    setTimeout(checar, 3000);
  });
  window.addEventListener('beforeprint', tudo);

  if (!PC) return;

  /* ------------------------------------------------------------ só PC */
  var raf = 0, pxs = [];

  // parallax: a foto do banner do meio desliza contra a rolagem (±2,5% da altura)
  [].forEach.call(document.querySelectorAll('.banner-meio img'), function (img) {
    img.setAttribute('data-mo-px', '');
    pxs.push(img);
  });

  // barra de progresso de leitura: só em página longa
  var prog = null;
  if (document.documentElement.scrollHeight > window.innerHeight * 2.2) {
    prog = document.createElement('div');
    prog.className = 'mo-prog';
    prog.setAttribute('aria-hidden', 'true');
    document.body.appendChild(prog);
  }

  function quadro() {
    raf = 0;
    var vh = window.innerHeight;
    for (var i = 0; i < pxs.length; i++) {
      var box = pxs[i].parentNode.getBoundingClientRect();
      if (box.bottom < 0 || box.top > vh) continue;
      // -1 (entrando por baixo) … +1 (saindo por cima)
      var p = ((box.top + box.height / 2) - vh / 2) / (vh / 2 + box.height / 2);
      pxs[i].style.setProperty('--mo-py', (p * box.height * 0.025).toFixed(2) + 'px');
    }
    if (prog) {
      var max = document.documentElement.scrollHeight - vh;
      prog.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
    }
  }
  function agendar() { if (!raf) raf = requestAnimationFrame(quadro); }
  window.addEventListener('scroll', agendar, { passive: true });
  window.addEventListener('resize', agendar, { passive: true });
  quadro();
})();
