(function (root) {
  'use strict';
  var VALOR = { 1: 0, 2: 69, 3: 119 };
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
      if (n >= t[0] && n <= t[1]) return { zona: t[2], valor: VALOR[t[2]], faixa: FAIXA[t[2]], cidade: t[3], grandeSP: n < 10000000 };
    }
    return { zona: 0, valor: null, faixa: 'acima de 80 km', cidade: '', grandeSP: n < 10000000 };
  }
  root.DilinoFrete = { consultar: consultar, VALOR: VALOR, FAIXA: FAIXA };
})(typeof self !== 'undefined' ? self : this);
