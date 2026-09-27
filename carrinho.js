/* ============================================================================
   DILINO STUDIO — CARRINHO (módulo isolado, vanilla)
   ----------------------------------------------------------------------------
   NÃO depende do dc-runtime (support.js) nem do React. Injeta seu próprio DOM
   em document.body (fora da raiz React), para o framework não reconciliar/apagar.
   NÃO toca link_checkout, yampiToken, pixel, tags nem os listeners existentes.

   Fluxo do funil de Pixel que este arquivo cobre:
     - AddToCart        -> disparado no "Adicionar ao carrinho"
     - InitiateCheckout -> disparado UMA vez no "Finalizar compra"
   (ViewContent continua nas páginas; Purchase é na Yampi, fora daqui.)

   O botão "Finalizar" é um <button> (não um <a href="yampi...">), então os
   listeners delegados de index/Catálogo (que casam a[href] com yampi) NÃO o
   capturam — logo não há disparo duplicado de InitiateCheckout.
   ========================================================================== */
(function () {
  'use strict';
  if (window.DilinoCart) return;               // guarda contra dupla inclusão

  // -------------------------------------------------------------- configuração
  var CART_KEY = 'dilino_cart_v1';
  var TOKEN_OK = /^[A-Za-z0-9]{6,20}$/;
  var QTD_MAX = 20;
  var CHECKOUT_BASE = 'https://dilino-studio.pay.yampi.com.br/r/'; // domínio real confirmado

  // TODO: COLE AQUI o rótulo de conversão de CHECKOUT do Google Ads.
  // Enquanto estiver o placeholder, a linha do Google fica INERTE (não dispara)
  // e nada quebra. O Meta Pixel funciona 100% independente disto.
  var GOOGLE_CHECKOUT_SEND_TO = 'AW-18409994256/COLAR_ROTULO_AQUI';

  // -------------------------------------------------------------- storage
  function load() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) return [];
      // saneamento: só itens com token e qtd >= 1
      return arr.filter(function (i) { return i && TOKEN_OK.test(String(i.token)); })
                .map(function (i) {
                  return {
                    token: String(i.token),
                    codigo: i.codigo ? String(i.codigo) : '',
                    nome: i.nome ? String(i.nome) : 'Peça',
                    preco: Number(i.preco) || 0,
                    qtd: Math.min(QTD_MAX, Math.max(1, parseInt(i.qtd, 10) || 1))
                  };
                });
    } catch (e) { return []; }
  }
  function save(items) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch (e) {}
  }

  var items = load();

  // -------------------------------------------------------------- pixel helpers
  function fbTrack(evt, params) {
    try { if (window.fbq) window.fbq('track', evt, params || {}); } catch (e) {}
  }
  function googleCheckoutConversion() {
    // Inerte enquanto o rótulo for o placeholder — não inventa send_to.
    if (!GOOGLE_CHECKOUT_SEND_TO || /COLAR_ROTULO_AQUI/.test(GOOGLE_CHECKOUT_SEND_TO)) return;
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'conversion', { 'send_to': GOOGLE_CHECKOUT_SEND_TO });
      }
    } catch (e) {}
  }

  // -------------------------------------------------------------- util
  function brl(n) {
    return 'R$ ' + (Number(n) || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    });
  }
  function count() {
    return items.reduce(function (s, i) { return s + i.qtd; }, 0);
  }
  function total() {
    return items.reduce(function (s, i) { return s + i.preco * i.qtd; }, 0);
  }

  // -------------------------------------------------------------- API pública
  function add(prod) {
    if (!prod || !TOKEN_OK.test(String(prod.token))) return;
    var token = String(prod.token);
    var found = null;
    for (var k = 0; k < items.length; k++) { if (items[k].token === token) { found = items[k]; break; } }
    var addQty = Math.max(1, parseInt(prod.qtd, 10) || 1);
    if (found) {
      found.qtd = Math.min(QTD_MAX, found.qtd + addQty);
    } else {
      found = {
        token: token,
        codigo: prod.codigo ? String(prod.codigo) : '',
        nome: prod.nome ? String(prod.nome) : 'Peça',
        preco: Number(prod.preco) || 0,
        qtd: Math.min(QTD_MAX, addQty)
      };
      items.push(found);
    }
    save(items);
    // AddToCart — content_ids usa o código (DS-xxx), casando com feed/catálogo
    fbTrack('AddToCart', {
      content_ids: [found.codigo || found.token],
      content_type: 'product',
      content_name: found.nome,
      currency: 'BRL',
      value: found.preco,
      contents: [{ id: found.codigo || found.token, quantity: addQty }]
    });
    render();
    open();          // abre o drawer ao adicionar (feedback imediato no mobile)
  }
  function setQty(token, qtd) {
    for (var k = 0; k < items.length; k++) {
      if (items[k].token === token) {
        items[k].qtd = Math.min(QTD_MAX, Math.max(1, parseInt(qtd, 10) || 1));
        break;
      }
    }
    save(items); render();
  }
  function remove(token) {
    items = items.filter(function (i) { return i.token !== token; });
    save(items); render();
  }
  function clear() { items = []; save(items); render(); }

  function buildCheckoutUrl() {
    if (!items.length) return '';
    var parts = items.map(function (i) { return i.token + ':' + i.qtd; });
    var cupom = '';
    try { cupom = localStorage.getItem('dilino_cupom') || ''; } catch (e) {}
    return CHECKOUT_BASE + parts.join(',') + (/^[A-Z0-9]{3,20}$/.test(cupom) ? '?promocode=' + cupom : '');
  }

  function finalize() {
    if (!items.length) return;
    var url = buildCheckoutUrl();
    // InitiateCheckout — UMA vez, agregado. Disparado aqui (não por link yampi),
    // então os listeners delegados de index/Catálogo não o duplicam.
    fbTrack('InitiateCheckout', {
      content_ids: items.map(function (i) { return i.codigo || i.token; }),
      content_type: 'product',
      currency: 'BRL',
      value: total(),
      num_items: count(),
      contents: items.map(function (i) { return { id: i.codigo || i.token, quantity: i.qtd }; })
    });
    googleCheckoutConversion();   // inerte até colar o rótulo
    window.location.href = url;   // redireciona para o checkout da Yampi (mesma aba)
  }

  // -------------------------------------------------------------- estilos
  function injectStyles() {
    if (document.getElementById('dlc-styles')) return;
    var css = ''
      + '.dlc-launcher{position:fixed;right:16px;z-index:2147483000;width:56px;height:56px;'
      + 'border-radius:999px;border:0;cursor:pointer;background:#1C1917;color:#F4F1EC;'
      + 'display:none;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(28,25,23,.28);}'
      + '.dlc-launcher.dlc-show{display:inline-flex;}'
      + '.dlc-badge{position:absolute;top:-4px;right:-4px;min-width:20px;height:20px;padding:0 5px;'
      + 'border-radius:999px;background:#B8874A;color:#F4F1EC;font:700 11px/20px Montserrat,sans-serif;'
      + 'text-align:center;}'
      + '.dlc-overlay{position:fixed;inset:0;z-index:2147483001;background:rgba(20,18,16,.5);'
      + 'opacity:0;visibility:hidden;transition:opacity .25s ease,visibility .25s ease;}'
      + '.dlc-overlay.dlc-open{opacity:1;visibility:visible;}'
      + '.dlc-panel{position:absolute;top:0;right:0;height:100%;width:min(88vw,380px);background:#F4F1EC;'
      + 'color:#3d3833;display:flex;flex-direction:column;transform:translateX(100%);'
      + 'transition:transform .3s ease;box-shadow:-24px 0 60px rgba(28,25,23,.25);font-family:Montserrat,sans-serif;}'
      + '.dlc-overlay.dlc-open .dlc-panel{transform:translateX(0);}'
      + '.dlc-head{display:flex;align-items:center;justify-content:space-between;padding:20px 20px 14px;'
      + 'border-bottom:1px solid #e0dacd;}'
      + '.dlc-head h2{margin:0;font-size:17px;font-weight:800;letter-spacing:-.3px;color:#1C1917;}'
      + '.dlc-close{appearance:none;background:transparent;border:0;cursor:pointer;width:40px;height:40px;'
      + 'font-size:24px;line-height:1;color:#1C1917;}'
      + '.dlc-body{flex:1 1 auto;overflow-y:auto;padding:8px 20px;-webkit-overflow-scrolling:touch;}'
      + '.dlc-empty{padding:48px 8px;text-align:center;color:#8b857b;font-size:15px;}'
      + '.dlc-empty a{color:#B8874A;font-weight:600;}'
      + '.dlc-item{display:flex;gap:12px;align-items:flex-start;padding:16px 0;border-bottom:1px solid #ebe5d8;}'
      + '.dlc-item-main{flex:1 1 auto;min-width:0;}'
      + '.dlc-item-name{font-size:15px;font-weight:600;color:#1C1917;line-height:1.3;}'
      + '.dlc-item-price{font-size:13px;color:#8b857b;margin-top:2px;}'
      + '.dlc-qty{display:inline-flex;align-items:center;gap:0;margin-top:10px;border:1px solid #e0dacd;'
      + 'border-radius:999px;overflow:hidden;}'
      + '.dlc-qty button{appearance:none;background:transparent;border:0;cursor:pointer;width:34px;height:34px;'
      + 'font-size:18px;line-height:1;color:#1C1917;}'
      + '.dlc-qty span{min-width:28px;text-align:center;font-size:14px;font-weight:600;color:#1C1917;}'
      + '.dlc-rm{appearance:none;background:transparent;border:0;cursor:pointer;color:#8b857b;'
      + 'font-size:12px;text-decoration:underline;padding:6px 0 0;}'
      + '.dlc-foot{border-top:1px solid #e0dacd;padding:16px 20px calc(16px + env(safe-area-inset-bottom,0px));}'
      + '.dlc-total{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:12px;}'
      + '.dlc-total b{font-size:19px;font-weight:800;color:#1C1917;}'
      + '.dlc-total span{font-size:12px;color:#8b857b;}'
      + '.dlc-finalize{display:block;width:100%;min-height:54px;border:0;border-radius:999px;cursor:pointer;'
      + 'background:#1C1917;color:#F4F1EC;font:600 16px Montserrat,sans-serif;}'
      + '.dlc-finalize:disabled{opacity:.4;cursor:not-allowed;}'
      + '.dlc-finalize,.dlc-launcher,.dlc-close,.dlc-qty button,.dlc-rm{transition:background .3s ease,color .3s ease,transform .3s cubic-bezier(.22,.8,.24,1),box-shadow .4s ease;}'
      + '.dlc-finalize:active:not(:disabled),.dlc-launcher:active,.dlc-qty button:active{transform:scale(.96);}'
      + '@media (hover:hover) and (pointer:fine){'
      + '.dlc-finalize:hover:not(:disabled){background:#2c2825;box-shadow:0 14px 28px -12px rgba(28,25,23,.55);}'
      + '.dlc-launcher:hover{transform:translateY(-2px);}'
      + '.dlc-close:hover{color:#B8874A;}'
      + '.dlc-qty button:hover{background:rgba(28,25,23,.06);}'
      + '.dlc-rm:hover{color:#1C1917;}}'
      + '.dlc-safe{list-style:none;margin:12px 0 0;padding:0;display:grid;gap:6px;}'
      + '.dlc-safe li{display:flex;align-items:center;gap:8px;font-size:12px;line-height:1.35;color:#6b655c;}'
      + '.dlc-safe svg{flex:none;color:#B8874A;}'
      + '@media (prefers-reduced-motion:reduce){.dlc-overlay,.dlc-panel{transition:none;}}';
    var st = document.createElement('style');
    st.id = 'dlc-styles';
    st.textContent = css;
    document.head.appendChild(st);
  }

  // -------------------------------------------------------------- DOM
  var launcherEl, badgeEl, overlayEl, bodyEl, totalEl, finalizeEl;

  function buildDom() {
    injectStyles();

    // launcher flutuante (só aparece quando há itens)
    launcherEl = document.createElement('button');
    launcherEl.type = 'button';
    launcherEl.className = 'dlc-launcher';
    launcherEl.setAttribute('aria-label', 'Abrir carrinho');
    launcherEl.innerHTML =
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
      + 'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'
      + '<circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>'
      + '<path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"></path></svg>'
      + '<span class="dlc-badge" id="dlc-badge">0</span>';
    // se a página tem buybar fixa (páginas de produto), sobe o launcher p/ não cobrir.
    // mede a altura real da barra (varia: 3 linhas no celular, 1 no desktop)
    var buybarEl = document.querySelector('.buybar');
    function posLauncher() {
      launcherEl.style.bottom = buybarEl ? (buybarEl.offsetHeight + 16) + 'px' : '20px';
    }
    posLauncher();
    if (buybarEl) window.addEventListener('resize', posLauncher, { passive: true });
    launcherEl.addEventListener('click', open);
    document.body.appendChild(launcherEl);
    badgeEl = launcherEl.querySelector('#dlc-badge');

    // overlay + painel
    overlayEl = document.createElement('div');
    overlayEl.className = 'dlc-overlay';
    overlayEl.innerHTML =
      '<div class="dlc-panel" role="dialog" aria-label="Carrinho" aria-modal="true">'
      + '<div class="dlc-head"><h2>Seu carrinho</h2>'
      + '<button class="dlc-close" type="button" aria-label="Fechar">&times;</button></div>'
      + '<div class="dlc-body" id="dlc-body"></div>'
      + '<div class="dlc-foot">'
      + '<div class="dlc-total"><span>Total</span><b id="dlc-total">R$ 0,00</b></div>'
      + '<button class="dlc-finalize" id="dlc-finalize" type="button">Finalizar compra</button>'
      + '<ul class="dlc-safe">'
      + '<li>' + '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="10" rx="2.2"></rect><path d="M8 10.5V7.6a4 4 0 0 1 8 0v2.9"></path></svg>' + 'Pagamento seguro via Yampi</li>'
      + '<li>' + '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2.5"></rect><path d="M2 9.6h20"></path></svg>' + 'Pix ou até 10x sem juros</li>'
      + '<li>' + '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.8 20 5.6v6.1c0 4.4-3.3 7.7-8 9.5-4.7-1.8-8-5.1-8-9.5V5.6z"></path><path d="M8.9 11.9l2.2 2.2 4.3-4.3"></path></svg>' + 'Garantia de 1 ano na estrutura</li>'
      + '</ul>'
      + '</div></div>';
    document.body.appendChild(overlayEl);
    bodyEl = overlayEl.querySelector('#dlc-body');
    totalEl = overlayEl.querySelector('#dlc-total');
    finalizeEl = overlayEl.querySelector('#dlc-finalize');

    overlayEl.addEventListener('click', function (e) { if (e.target === overlayEl) close(); });
    overlayEl.querySelector('.dlc-close').addEventListener('click', close);
    finalizeEl.addEventListener('click', finalize);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlayEl.classList.contains('dlc-open')) close();
    });
  }

  function render() {
    if (!launcherEl) return;
    var c = count();
    badgeEl.textContent = c;
    // contador no cabeçalho (home): sincroniza qualquer [data-dlc-cart-count]
    var heads = document.querySelectorAll('[data-dlc-cart-count]');
    for (var hi = 0; hi < heads.length; hi++) heads[hi].textContent = c > 0 ? c : '';
    // se a página tem carrinho no cabeçalho, o launcher flutuante fica suprimido
    var hasHeaderCart = !!document.querySelector('[data-dlc-cart]');
    launcherEl.classList.toggle('dlc-show', c > 0 && !hasHeaderCart);

    if (!items.length) {
      bodyEl.innerHTML = '<div class="dlc-empty">Seu carrinho está vazio.<br>'
        + '<a href="/Cat%C3%A1logo.dc.html">Ver o catálogo</a></div>';
    } else {
      var html = '';
      for (var k = 0; k < items.length; k++) {
        var i = items[k];
        var t = escapeHtml(i.token);
        html += '<div class="dlc-item" data-token="' + t + '">'
          + '<div class="dlc-item-main">'
          + '<div class="dlc-item-name">' + escapeHtml(i.nome) + '</div>'
          + '<div class="dlc-item-price">' + brl(i.preco) + ' · un.</div>'
          + '<div class="dlc-qty">'
          + '<button type="button" data-dlc-dec="' + t + '" aria-label="Menos um">&minus;</button>'
          + '<span>' + i.qtd + '</span>'
          + '<button type="button" data-dlc-inc="' + t + '" aria-label="Mais um">+</button>'
          + '</div>'
          + '<button class="dlc-rm" type="button" data-dlc-rm="' + t + '">remover</button>'
          + '</div></div>';
      }
      bodyEl.innerHTML = html;
    }
    totalEl.textContent = brl(total());
    finalizeEl.disabled = !items.length;
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function open() {
    if (!overlayEl) return;
    render();
    overlayEl.classList.add('dlc-open');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    if (!overlayEl) return;
    overlayEl.classList.remove('dlc-open');
    document.body.style.overflow = '';
  }

  // -------------------------------------------------------------- delegação
  // Botões "Adicionar ao carrinho" das páginas de produto ([data-dlc-add]) e
  // os controles internos do drawer, tudo por um listener só (bubbling normal).
  function wireDelegation() {
    document.addEventListener('click', function (e) {
      // carrinho no cabeçalho (home) abre o painel
      var cartBtn = e.target.closest && e.target.closest('[data-dlc-cart]');
      if (cartBtn) { e.preventDefault(); open(); return; }
      var addBtn = e.target.closest && e.target.closest('[data-dlc-add]');
      if (addBtn) {
        e.preventDefault();
        add({
          token: addBtn.getAttribute('data-token'),
          codigo: addBtn.getAttribute('data-codigo'),
          nome: addBtn.getAttribute('data-nome'),
          preco: addBtn.getAttribute('data-preco')
        });
        return;
      }
      var dec = e.target.closest && e.target.closest('[data-dlc-dec]');
      if (dec) { var td = dec.getAttribute('data-dlc-dec'); var it = byToken(td); if (it) setQty(td, it.qtd - 1); return; }
      var inc = e.target.closest && e.target.closest('[data-dlc-inc]');
      if (inc) { var ti = inc.getAttribute('data-dlc-inc'); var it2 = byToken(ti); if (it2) setQty(ti, it2.qtd + 1); return; }
      var rm = e.target.closest && e.target.closest('[data-dlc-rm]');
      if (rm) { remove(rm.getAttribute('data-dlc-rm')); return; }
    }, false);
  }
  function byToken(t) { for (var k = 0; k < items.length; k++) if (items[k].token === t) return items[k]; return null; }

  // -------------------------------------------------------------- init
  function init() {
    buildDom();
    wireDelegation();
    render();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // exposição pública mínima
  window.DilinoCart = {
    add: add, remove: remove, setQty: setQty, clear: clear,
    open: open, close: close,
    items: function () { return items.slice(); },
    count: count, total: total,
    buildCheckoutUrl: buildCheckoutUrl
  };
})();
