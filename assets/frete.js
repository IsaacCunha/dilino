(function (root) {
  'use strict';
  var VALOR = { 1: 0, 2: 99, 3: 139 };
  var CHAVE = 'dilino_cep';
  var FAIXA = { 1: 'até 40 km', 2: 'de 40 a 60 km', 3: 'de 60 a 80 km' };
  var TABELA = [
    [1000000,4299999,1,"São Paulo (centro, norte e leste)"],
    [4300000,5999999,2,"São Paulo (zona sul e oeste)"],
    [6000000,6299999,2,"Osasco"],
    [6300000,6399999,2,"Carapicuíba"],
    [6400000,6499999,2,"Barueri"],
    [6500000,6549999,3,"Santana de Parnaíba"],
    [6550000,6599999,3,"Pirapora do Bom Jesus"],
    [6600000,6649999,3,"Jandira"],
    [6650000,6699999,3,"Itapevi"],
    [6700000,6729999,3,"Cotia"],
    [6730000,6749999,3,"Vargem Grande Paulista"],
    [6750000,6799999,2,"Taboão da Serra"],
    [6800000,6849999,3,"Embu das Artes"],
    [6850000,6889999,3,"Itapecerica da Serra"],
    [6900000,6949999,3,"Embu-Guaçu"],
    [7000000,7399999,1,"Guarulhos"],
    [7400000,7499999,1,"Arujá"],
    [7500000,7599999,1,"Santa Isabel"],
    [7600000,7699999,1,"Mairiporã"],
    [7700000,7749999,2,"Caieiras"],
    [7750000,7799999,2,"Cajamar"],
    [7800000,7899999,2,"Franco da Rocha"],
    [7900000,7999999,2,"Francisco Morato"],
    [8000000,8499999,1,"São Paulo (zona leste)"],
    [8500000,8549999,1,"Ferraz de Vasconcelos"],
    [8550000,8569999,1,"Poá"],
    [8570000,8599999,1,"Itaquaquecetuba"],
    [8600000,8699999,1,"Suzano"],
    [8700000,8899999,1,"Mogi das Cruzes"],
    [8900000,8939999,1,"Guararema"],
    [8940000,8969999,1,"Biritiba-Mirim"],
    [8970000,8999999,2,"Salesópolis"],
    [9000000,9299999,1,"Santo André"],
    [9300000,9399999,1,"Mauá"],
    [9400000,9449999,1,"Ribeirão Pires"],
    [9450000,9499999,1,"Rio Grande da Serra"],
    [9500000,9599999,1,"São Caetano do Sul"],
    [9600000,9899999,2,"São Bernardo do Campo"],
    [9900000,9999999,2,"Diadema"],
    [12200000,12249999,2,"São José dos Campos"],
    [12250000,12259999,3,"Monteiro Lobato"],
    [12260000,12269999,3,"Paraibuna"],
    [12270000,12279999,3,"Jambeiro"],
    [12280000,12299999,3,"Caçapava"],
    [12300000,12349999,1,"Jacareí"],
    [12350000,12379999,1,"Igaratá"],
    [12380000,12399999,2,"Santa Branca"],
    [12900000,12929999,2,"Bragança Paulista"],
    [12930000,12934999,3,"Tuiuti"],
    [12935000,12939999,2,"Vargem"],
    [12940000,12954999,1,"Atibaia"],
    [12955000,12959999,1,"Bom Jesus dos Perdões"],
    [12960000,12969999,1,"Nazaré Paulista"],
    [12970000,12979999,1,"Piracaia"],
    [12980000,12989999,2,"Joanópolis"],
    [12990000,12994999,3,"Pedra Bela"],
    [12995000,12999999,3,"Pinhalzinho"],
    [13200000,13219999,3,"Jundiaí"],
    [13220000,13229999,2,"Várzea Paulista"],
    [13230000,13239999,2,"Campo Limpo Paulista"],
    [13240000,13249999,2,"Jarinu"],
    [13250000,13259999,3,"Itatiba"],
    [13260000,13269999,3,"Morungaba"],
    [13280000,13289999,3,"Vinhedo"],
    [13290000,13294999,3,"Louveira"],
    [18147000,18149999,3,"Araçariguama"]
  ];
  function consultar(cep) {
    var n = parseInt(String(cep).replace(/\D/g, ''), 10);
    if (!(n > 0)) return null;
    for (var i = 0; i < TABELA.length; i++) {
      var t = TABELA[i];
      if (n >= t[0] && n <= t[1]) return { zona: t[2], valor: VALOR[t[2]], faixa: FAIXA[t[2]], cidade: t[3], montagem: t[2] === 1, grandeSP: n < 10000000 };
    }
    return { zona: 0, valor: null, faixa: 'acima de 80 km', cidade: '', montagem: false, grandeSP: n < 10000000 };
  }
  function cepSalvo() {
    try { return localStorage.getItem(CHAVE) || ''; } catch (e) { return ''; }
  }
  function salvar(cep) {
    var d = String(cep).replace(/\D/g, '');
    if (d.length !== 8) return null;
    try { localStorage.setItem(CHAVE, d); } catch (e) {}
    var r = consultar(d);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dlf-fora', !atende(r));
      try { document.dispatchEvent(new CustomEvent('dilino:cep', { detail: { cep: d, frete: r } })); } catch (e) {}
    }
    return r;
  }
  function atual() {
    var d = cepSalvo();
    return d.length === 8 ? consultar(d) : null;
  }
  function atende(r) { return !!(r && r.zona > 0); }
  function brl(v) { return 'R$ ' + v.toFixed(2).replace('.', ','); }

  root.DilinoFrete = { consultar: consultar, salvar: salvar, atual: atual, cepSalvo: cepSalvo, atende: atende, VALOR: VALOR, FAIXA: FAIXA };
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  /* Trava de compra: Comprar agora, Adicionar ao carrinho e Finalizar só seguem com um CEP
     atendido. Escuta no window em captura, antes dos listeners do pixel e do carrinho,
     para que nada dispare quando a compra é barrada. */
  var ALVO = 'a[href*="pay.yampi.com.br/r/"], [data-dlc-add], #dlc-finalize';
  var liberado = false, modal = null;

  function estilos() {
    if (document.getElementById('dlf-styles')) return;
    var s = document.createElement('style');
    s.id = 'dlf-styles';
    s.textContent = ''
      + '.dlf-fora .btn-add,.dlf-fora .btn-primary{opacity:.45;}'
      + '.dlf-ov{position:fixed;inset:0;z-index:2147483300;background:rgba(15,17,21,.55);display:flex;align-items:flex-end;justify-content:center;}'
      + '@media (min-width:641px){.dlf-ov{align-items:center;}}'
      + '.dlf-box{position:relative;width:100%;max-width:420px;background:#F4F1EC;color:#1C1917;border-radius:16px 16px 0 0;padding:22px 20px calc(22px + env(safe-area-inset-bottom));font:400 15px/1.5 Inter,system-ui,sans-serif;box-shadow:0 -8px 30px rgba(0,0,0,.18);}'
      + '@media (min-width:641px){.dlf-box{border-radius:16px;}}'
      + '.dlf-box h2{margin:0 0 6px;font:700 18px/1.3 Montserrat,Inter,sans-serif;}'
      + '.dlf-box p{margin:0 0 14px;color:#57534E;font-size:14px;}'
      + '.dlf-row{display:flex;gap:8px;}'
      + '.dlf-in{flex:1;min-width:0;height:46px;border:1px solid #CFC8BD;border-radius:10px;padding:0 12px;font:500 16px Inter,system-ui,sans-serif;background:#fff;color:#1C1917;}'
      + '.dlf-btn{height:46px;padding:0 18px;border:0;border-radius:10px;background:#1C1917;color:#F4F1EC;font:600 14px Inter,system-ui,sans-serif;cursor:pointer;}'
      + '.dlf-res{min-height:20px;margin:12px 0 0;font-size:14px;color:#1C1917;}'
      + '.dlf-res.dlf-no{color:#9F2A2A;}'
      + '.dlf-x{position:absolute;top:10px;right:10px;width:36px;height:36px;border:0;background:none;font-size:24px;line-height:1;color:#57534E;cursor:pointer;}';
    document.head.appendChild(s);
  }

  function msgFora() {
    return '<b>Não entregamos nesse CEP.</b> Pelo site, atendemos até 80 km da oficina em Arujá (SP), fora do litoral e de outros estados.';
  }

  function fechar() {
    if (modal) { modal.remove(); modal = null; }
  }

  function pedirCep(el) {
    estilos(); fechar();
    var salvo = cepSalvo(), r0 = atual();
    modal = document.createElement('div');
    modal.className = 'dlf-ov';
    modal.innerHTML = ''
      + '<form class="dlf-box" role="dialog" aria-modal="true" aria-labelledby="dlf-t" novalidate>'
      + '<button class="dlf-x" type="button" aria-label="Fechar">&times;</button>'
      + '<h2 id="dlf-t">Qual é o seu CEP?</h2>'
      + '<p>Entregamos até 80 km da oficina em Arujá (SP). Confira antes de comprar.</p>'
      + '<div class="dlf-row"><input class="dlf-in" inputmode="numeric" autocomplete="postal-code" placeholder="00000-000" maxlength="9" aria-label="CEP">'
      + '<button class="dlf-btn" type="submit">Continuar</button></div>'
      + '<p class="dlf-res" aria-live="polite"></p>'
      + '</form>';
    document.body.appendChild(modal);
    var form = modal.querySelector('form'), input = modal.querySelector('.dlf-in'), res = modal.querySelector('.dlf-res');
    function mascara(d) { return d.length > 5 ? d.slice(0, 5) + '-' + d.slice(5) : d; }
    if (salvo) input.value = mascara(salvo);
    if (r0 && !atende(r0)) { res.className = 'dlf-res dlf-no'; res.innerHTML = msgFora(); }
    input.addEventListener('input', function () { input.value = mascara(input.value.replace(/\D/g, '').slice(0, 8)); });
    modal.querySelector('.dlf-x').addEventListener('click', fechar);
    modal.addEventListener('click', function (e) { if (e.target === modal) fechar(); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = input.value.replace(/\D/g, '');
      if (d.length !== 8) { res.className = 'dlf-res dlf-no'; res.textContent = 'Digite os 8 números do CEP.'; input.focus(); return; }
      var r = salvar(d);
      if (!atende(r)) { res.className = 'dlf-res dlf-no'; res.innerHTML = msgFora(); return; }
      fechar();
      liberado = true;
      try { el.click(); } finally { liberado = false; }
    });
    setTimeout(function () { input.focus(); }, 30);
  }

  window.addEventListener('click', function (e) {
    if (liberado || !e.target || !e.target.closest) return;
    var el = e.target.closest(ALVO);
    if (!el || atende(atual())) return;
    e.preventDefault();
    e.stopPropagation();
    pedirCep(el);
  }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fechar(); });

  estilos();
  var r = atual();
  if (r && !atende(r)) document.documentElement.classList.add('dlf-fora');

  root.DilinoFrete.brl = brl;
  root.DilinoFrete.pedirCep = pedirCep;
})(typeof self !== 'undefined' ? self : this);
