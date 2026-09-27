(function () {
  'use strict';
  if (window.DilinoBoasVindas) return;

  var CUPOM = 'BEMVINDO5';
  var DESCONTO = '5%';
  var ENDPOINT = '/salvar-email.php';
  var CHAVE_INSCRITO = 'dilino_lead';
  var CHAVE_PAUSA = 'dilino_popup_ate';
  var ESPERA_MS = 25000;
  var PAUSA_DIAS = 7;

  function ler(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function gravar(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function inscrito() { return ler(CHAVE_INSCRITO) === '1'; }
  function pausado() { return Number(ler(CHAVE_PAUSA) || 0) > Date.now(); }
  function marcarInscrito() { gravar(CHAVE_INSCRITO, '1'); gravar('dilino_cupom', CUPOM); }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="pay.yampi.com.br/r/"]');
    var cupom = ler('dilino_cupom');
    if (!a || !/^[A-Z0-9]{3,20}$/.test(cupom || '') || /promocode=/.test(a.href)) return;
    a.href = a.href + (a.href.indexOf('?') < 0 ? '?' : '&') + 'promocode=' + cupom;
  }, true);

  function enviar(email, origem) {
    return fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email: email, origem: origem })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok || String(d.success) !== 'true') throw new Error('falhou');
      });
    });
  }

  window.DilinoBoasVindas = { cupom: CUPOM, desconto: DESCONTO, enviar: enviar, marcarInscrito: marcarInscrito };

  if (inscrito() || pausado()) return;

  var CSS = ''
    + '.dbv{position:fixed;left:0;right:0;bottom:0;z-index:2147483100;background:#F4F1EC;color:#1C1917;'
    + 'border-radius:20px 20px 0 0;box-shadow:0 -12px 40px rgba(28,25,23,.28);'
    + 'padding:22px 20px calc(20px + env(safe-area-inset-bottom,0px));font-family:Montserrat,system-ui,sans-serif;'
    + 'transform:translateY(105%);transition:transform .45s cubic-bezier(.22,.8,.24,1);}'
    + '.dbv.dbv-on{transform:none;}'
    + '.dbv-x{position:absolute;top:10px;right:10px;width:40px;height:40px;border:0;border-radius:999px;background:transparent;color:#7a736a;cursor:pointer;font-size:22px;line-height:1;}'
    + '.dbv-x:hover{background:rgba(28,25,23,.06);color:#1C1917;}'
    + '.dbv-k{margin:0 0 6px;font-size:10px;font-weight:600;letter-spacing:2.2px;text-transform:uppercase;color:#B8874A;}'
    + '.dbv-t{margin:0;font-size:21px;font-weight:800;line-height:1.2;letter-spacing:-.3px;padding-right:36px;}'
    + '.dbv-p{margin:8px 0 14px;font-size:13.5px;line-height:1.55;color:#5d5850;}'
    + '.dbv-f{display:flex;gap:8px;}'
    + '.dbv-in{flex:1 1 auto;min-width:0;height:48px;padding:0 16px;border:1px solid #d8d1c3;border-radius:999px;background:#fff;color:#1C1917;font:500 15px Montserrat,system-ui,sans-serif;}'
    + '.dbv-in:focus{outline:none;border-color:#B8874A;}'
    + '.dbv-b{flex:0 0 auto;height:48px;padding:0 20px;border:0;border-radius:999px;background:#1C1917;color:#F4F1EC;font:600 14px Montserrat,system-ui,sans-serif;cursor:pointer;}'
    + '.dbv-b:disabled{opacity:.6;cursor:default;}'
    + '.dbv-s{margin:10px 0 0;font-size:11px;color:#8b857b;}'
    + '.dbv-err{margin:10px 0 0;font-size:12.5px;color:#9b3b2a;}'
    + '.dbv-cupom{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:14px 0 0;padding:12px 12px 12px 18px;border:1.5px dashed #B8874A;border-radius:14px;background:#fff;}'
    + '.dbv-cod{font-size:20px;font-weight:800;letter-spacing:2px;}'
    + '.dbv-copiar{height:40px;padding:0 16px;border:1px solid #1C1917;border-radius:999px;background:transparent;color:#1C1917;font:600 13px Montserrat,system-ui,sans-serif;cursor:pointer;}'
    + '@media (min-width:640px){.dbv{left:24px;right:auto;bottom:24px;width:400px;border-radius:20px;padding:24px 24px 22px;}}'
    + '@media (prefers-reduced-motion:reduce){.dbv{transition:none;}}';

  var el = null, timer = null, aberto = false;

  function fechar() {
    if (!el) return;
    el.classList.remove('dbv-on');
    aberto = false;
    if (!inscrito()) gravar(CHAVE_PAUSA, String(Date.now() + PAUSA_DIAS * 864e5));
    var alvo = el; el = null;
    setTimeout(function () { if (alvo.parentNode) alvo.parentNode.removeChild(alvo); }, 500);
    document.removeEventListener('keydown', aoTeclar);
    document.removeEventListener('mouseout', aoSair);
  }
  function aoTeclar(e) { if (e.key === 'Escape') fechar(); }

  function mostrarCupom() {
    var corpo = el.querySelector('.dbv-corpo');
    corpo.innerHTML = '<p class="dbv-k">Cupom liberado</p>'
      + '<p class="dbv-t">Seus ' + DESCONTO + ' estão garantidos</p>'
      + '<p class="dbv-p">Já vai aplicado no checkout deste aparelho. Se comprar em outro, digite o código.</p>'
      + '<div class="dbv-cupom"><span class="dbv-cod">' + CUPOM + '</span><button type="button" class="dbv-copiar">Copiar</button></div>';
    corpo.querySelector('.dbv-copiar').addEventListener('click', function (e) {
      var b = e.currentTarget;
      var ok = function () { b.textContent = 'Copiado'; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(CUPOM).then(ok, ok); else ok();
    });
  }

  function abrir() {
    if (aberto || inscrito() || pausado()) return;
    if (document.querySelector('.dcc-bar, .dlc-open')) { agendar(8000); return; }
    if (!document.getElementById('dbv-styles')) {
      var st = document.createElement('style'); st.id = 'dbv-styles'; st.textContent = CSS; document.head.appendChild(st);
    }
    el = document.createElement('div');
    el.className = 'dbv';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-labelledby', 'dbvTitulo');
    el.innerHTML = '<button type="button" class="dbv-x" aria-label="Fechar">×</button>'
      + '<div class="dbv-corpo">'
      + '<p class="dbv-k">Primeira compra</p>'
      + '<p class="dbv-t" id="dbvTitulo">Ganhe ' + DESCONTO + ' de desconto</p>'
      + '<p class="dbv-p">Deixe seu e-mail e receba o cupom na hora. Vale para qualquer peça do site.</p>'
      + '<form class="dbv-f" novalidate>'
      + '<input class="dbv-in" type="email" name="email" placeholder="seu@email.com" autocomplete="email" aria-label="Seu e-mail" required>'
      + '<button class="dbv-b" type="submit">Quero o cupom</button>'
      + '</form>'
      + '<p class="dbv-s">Sem spam. Você sai da lista quando quiser. <a href="/privacidade.html" style="color:inherit;text-decoration:underline;">Privacidade</a></p>'
      + '</div>';
    document.body.appendChild(el);
    el.querySelector('.dbv-x').addEventListener('click', fechar);
    var form = el.querySelector('form');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('input'), btn = form.querySelector('button');
      var email = (input.value || '').trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { input.focus(); return; }
      btn.disabled = true; btn.textContent = 'Enviando…';
      var velho = el.querySelector('.dbv-err'); if (velho) velho.remove();
      enviar(email, 'Pop-up cupom').then(function () {
        marcarInscrito(); mostrarCupom();
      }).catch(function () {
        btn.disabled = false; btn.textContent = 'Quero o cupom';
        var p = document.createElement('p'); p.className = 'dbv-err'; p.setAttribute('role', 'alert');
        p.textContent = 'Não conseguimos agora. Tente de novo em instantes.';
        form.insertAdjacentElement('afterend', p);
      });
    });
    document.addEventListener('keydown', aoTeclar);
    requestAnimationFrame(function () { requestAnimationFrame(function () { if (el) el.classList.add('dbv-on'); }); });
    aberto = true;
    clearTimeout(timer);
  }

  function aoSair(e) { if (!e.relatedTarget && e.clientY <= 0) abrir(); }
  function agendar(ms) { clearTimeout(timer); timer = setTimeout(abrir, ms); }

  function iniciar() {
    agendar(ESPERA_MS);
    if (window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
      setTimeout(function () { document.addEventListener('mouseout', aoSair); }, 8000);
    }
  }

  function quandoPronto() {
    if (ler('dilino_consent')) iniciar();
    else document.addEventListener('dilino:consent', iniciar, { once: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', quandoPronto);
  else quandoPronto();
})();
