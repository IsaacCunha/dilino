/* =========================================================================
   DILINO STUDIO — COMPONENTE: CARD DE PRODUTO (markup)
   Fonte única do card: a home usa no navegador (window.DilinoCard) e o gerador
   usa no Node (require) para o trilho "Mais peças" das 51 páginas. Estilo em
   assets/card.css (inline nas páginas pelo gerador — ver gerar.js).
   ========================================================================= */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DilinoCard = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* Slot da direita do card.
     false (padrão): microtag "Até 10x".
     true: estrelas + número de avaliações — SÓ para produto com dado real em
           p.avaliacoes = { media: 0–5, total: n }. Sem dado, cai no "Até 10x".
     Nunca gere aggregateRating no JSON-LD a partir disto. */
  var MOSTRAR_AVALIACOES = false;
  var PIX_DESCONTO = 0.10;

  /* EXCEÇÃO TEMPORÁRIA — object-position para as 2 fotos fora de 4:5, até
     chegarem as versões 4:5 nativas (o usuário vai enviar). O valor centra o
     quadro visível no centro da peça, preservando o máximo dela.
     Remover a entrada assim que a foto 4:5 do produto entrar. */
  var POSICAO_FOTO = {
    'DS-024': '62% 50%', // Banco Aurora (3:2) — bench largo; centra no meio da peça
    'DS-031': '38% 50%'  // Cabideiro Bruma (1:1) — mantém as camisetas penduradas
  };

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function brlPadrao(n) {
    return 'R$ ' + (Number(n) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  var ESTRELA = 'M6 .8l1.55 3.3 3.6.45-2.65 2.5.7 3.55L6 8.85 2.8 10.6l.7-3.55L.85 4.55l3.6-.45z';
  function estrelas(av) {
    var media = Math.max(0, Math.min(5, Number(av.media) || 0));
    var cheias = Math.round(media);
    var svg = '';
    for (var i = 1; i <= 5; i++) {
      svg += '<svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path class="' + (i <= cheias ? 's-on' : 's-off') + '" d="' + ESTRELA + '"/></svg>';
    }
    var total = Math.max(0, Math.floor(Number(av.total) || 0));
    return '<span class="pcard-stars" aria-label="Nota ' + media.toFixed(1).replace('.', ',') + ' de 5, ' + total + ' avaliações">'
         + svg + '<span>(' + total + ')</span></span>';
  }
  function temAvaliacaoReal(p) {
    return !!(p && p.avaliacoes && Number(p.avaliacoes.total) > 0 && Number(p.avaliacoes.media) > 0);
  }
  function slot(p, mostrar) {
    if (mostrar && temAvaliacaoReal(p)) return estrelas(p.avaliacoes);
    return 'Até 10x';
  }

  /* p: produto de produtos.js
     o: { href, img:{src, srcset, sizes, width, height}, alt, brl?, mostrarAvaliacoes? } */
  function render(p, o) {
    var brl = o.brl || brlPadrao;
    var promo = p.preco_riscado != null && Number(p.preco_riscado) > Number(p.preco);
    var selo = (promo && p.badge) ? '<span class="pcard-badge">' + esc(p.badge) + '</span>' : '';
    /* preço: riscado (se houver) ANTES do atual, como no catálogo */
    var preco = (promo ? '<s>' + brl(p.preco_riscado) + '</s>' : '') + brl(p.preco);
    /* linha de parcela idêntica ao catálogo: "10x de R$ X sem juros" (omite se sem preço) */
    var parcela = (Number(p.preco) > 0) ? '10x de ' + brl(Number(p.preco) / 10) + ' sem juros' : '';
    var pix = (Number(p.preco) > 0) ? brl(Math.round(Number(p.preco) * (1 - PIX_DESCONTO) * 100) / 100) + ' no Pix' : '';
    var im = o.img;
    var pos = POSICAO_FOTO[p.codigo];
    var posAttr = pos ? ' style="object-position:' + pos + '"' : '';
    return '<a class="pcard" href="' + esc(o.href) + '">'
      + '<span class="pcard-media">'
      +   '<img class="pcard-img" src="' + esc(im.src) + '" srcset="' + esc(im.srcset) + '" sizes="' + esc(im.sizes) + '"'
      +   ' alt="' + esc(o.alt) + '" width="' + im.width + '" height="' + im.height + '" loading="lazy" decoding="async"' + posAttr + '>'
      +   selo
      + '</span>'
      + '<span class="pcard-body">'
      +   '<span class="pcard-row">'
      +     '<span class="pcard-name">' + esc(p.nome) + '</span>'
      +     '<span class="pcard-dots" aria-hidden="true"></span>'
      +     '<span class="pcard-price">' + preco + '</span>'
      +   '</span>'
      +   (pix ? '<span class="pcard-pix">' + pix + '</span>' : '')
      +   (parcela ? '<span class="pcard-parcela">' + parcela + '</span>' : '')
      + '</span>'
      + '</a>';
  }

  return { MOSTRAR_AVALIACOES: MOSTRAR_AVALIACOES, render: render, _estrelas: estrelas, _slot: slot };
});
