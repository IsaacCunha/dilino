/* ============================================================================
   DILINO STUDIO — BANNER DE COOKIES + GOOGLE CONSENT MODE v2 (update)
   ----------------------------------------------------------------------------
   Módulo isolado (vanilla). NÃO toca support.js/React, gtag, Pixel nem listeners.
   O DEFAULT consent ('denied') é definido INLINE no <head>, ANTES do gtag —
   este arquivo só trata o UPDATE (Aceitar), a persistência e o banner.

   - Aceitar  -> gtag('consent','update', tudo 'granted') + localStorage 'granted'
   - Recusar  -> mantém 'denied' (NÃO desativa gtag) + localStorage 'denied'
   - Persiste em localStorage.dilino_consent; banner não reaparece após decidir.
   - Não bloqueia navegação, não cobre a tela; fixo no rodapé, mobile-first.
   ========================================================================== */
(function () {
  'use strict';
  if (window.DilinoCookies) return;

  var KEY = 'dilino_consent';               // 'granted' | 'denied'
  var PRIVACY_URL = '/privacidade.html';    // root-relative: vale em / , /produto/ etc.

  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  function grantAll() {
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('consent', 'update', {
          'ad_storage': 'granted',
          'analytics_storage': 'granted',
          'ad_user_data': 'granted',
          'ad_personalization': 'granted'
        });
      }
    } catch (e) {}
  }

  function avisar() { try { document.dispatchEvent(new Event('dilino:consent')); } catch (e) {} }
  function pixel(v) { try { if (typeof window.fbq === 'function') window.fbq('consent', v); } catch (e) {} }
  function accept() { set('granted'); grantAll(); pixel('grant'); removeBanner(); avisar(); }
  function reject() { set('denied'); pixel('revoke'); removeBanner(); avisar(); }   // segue 'denied' (default do <head>)

  var bannerEl = null;
  function removeBanner() {
    if (bannerEl && bannerEl.parentNode) bannerEl.parentNode.removeChild(bannerEl);
    bannerEl = null;
  }

  function injectStyles() {
    if (document.getElementById('dcc-styles')) return;
    var css = ''
      + '.dcc-bar{position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));transition:none!important;z-index:2147483200;'
      + 'max-width:560px;margin:0 auto;border-radius:14px;'
      + 'background:#1C1917;color:#F4F1EC;border:1px solid #2a2724;'
      + 'box-shadow:0 10px 30px rgba(28,25,23,.35);'
      + 'font-family:Montserrat,system-ui,sans-serif;'
      + 'padding:10px 10px 10px 14px;'
      + 'display:flex;align-items:center;gap:10px;}'
      + '.dcc-text{flex:1 1 auto;min-width:0;font-size:11.5px;line-height:1.4;color:#d9d3c8;margin:0;}'
      + '.dcc-text a{color:#B8874A;text-decoration:underline;}'
      + '.dcc-actions{flex:0 0 auto;display:flex;gap:6px;}'
      + '.dcc-btn{min-height:34px;border-radius:999px;cursor:pointer;'
      + 'font:600 12px Montserrat,sans-serif;padding:6px 13px;text-align:center;'
      + 'transition:background .2s ease,color .2s ease,border-color .2s ease;}'
      + '.dcc-accept{background:#F4F1EC;color:#1C1917;border:1px solid #F4F1EC;}'
      + '.dcc-accept:hover{background:#fff;}'
      + '.dcc-reject{background:transparent;color:#F4F1EC;border:1px solid rgba(244,241,236,.45);}'
      + '.dcc-reject:hover{border-color:#F4F1EC;background:rgba(244,241,236,.06);}'
      + '@media (min-width:680px){.dcc-bar{padding:12px 12px 12px 18px;}.dcc-text{font-size:12.5px;}}'
      + '@media (prefers-reduced-motion:reduce){.dcc-btn{transition:none;}}';
    var st = document.createElement('style');
    st.id = 'dcc-styles';
    st.textContent = css;
    document.head.appendChild(st);
  }

  function showBanner() {
    injectStyles();
    bannerEl = document.createElement('div');
    bannerEl.className = 'dcc-bar';
    bannerEl.setAttribute('role', 'region');
    bannerEl.setAttribute('aria-label', 'Aviso de cookies');
    bannerEl.innerHTML =
      '<p class="dcc-text">Usamos cookies para melhorar o site e os anúncios. '
      + '<a href="' + PRIVACY_URL + '">Saiba mais</a></p>'
      + '<div class="dcc-actions">'
      + '<button type="button" class="dcc-btn dcc-reject">Recusar</button>'
      + '<button type="button" class="dcc-btn dcc-accept">Aceitar</button>'
      + '</div>';
    bannerEl.querySelector('.dcc-accept').addEventListener('click', accept);
    bannerEl.querySelector('.dcc-reject').addEventListener('click', reject);
    document.body.appendChild(bannerEl);
    acimaDaBarra();
  }

  /* Nas páginas de produto a barra de compra é fixa no rodapé: o aviso flutua logo acima dela. */
  function acimaDaBarra() {
    if (!bannerEl) return;
    var bar = document.getElementById('buyBar'), h = 0;
    if (bar && getComputedStyle(bar).position === 'fixed') h = bar.offsetHeight;
    bannerEl.style.bottom = h ? Math.round(h + 10) + 'px' : '';
  }
  window.addEventListener('resize', acimaDaBarra, { passive: true });
  window.addEventListener('load', acimaDaBarra);
  if (window.ResizeObserver) {
    var barObs = document.getElementById('buyBar');
    if (barObs) new ResizeObserver(acimaDaBarra).observe(barObs);
  }

  function init() {
    var choice = get();
    if (choice === 'granted') { grantAll(); return; }   // re-aplica (default nasce denied a cada load)
    if (choice === 'denied') { return; }                // segue denied, sem banner
    showBanner();                                       // sem decisão -> mostra o banner
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // API pública mínima (permite reabrir/rever no futuro, se quiser)
  window.DilinoCookies = {
    accept: accept, reject: reject,
    state: function () { return get(); },
    reopen: function () { removeBanner(); showBanner(); }
  };
})();
