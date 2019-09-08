/*
Пример работы с jQuery из проекта по расчету доставки CDEK
скрываем разные виды доставок.
https://senzaria.ru/cart/order
*/
//доставка
var cdekStatus = $('#cdek_status');
var cdekMap = $('#map_ajax');
var idCDEKDelivery = 'shippingmethod_1012'
var idCDEKCoureir = 'shippingmethod_1011'
var delivMore = 'shippingmethod_1013'
var _error = []
var flagCDEK = false
var flagMAP = false
var noneDelive = false

function checkDelivery(){
  $("#useConditions").prop('checked', false);
  $(":radio[name=ShippingMethod]", "#js_form-order").prop('disabled', true) // блокируем все выборы доставки
  $('.load-layer').show();
  deliv_id = $(":radio[name=ShippingMethod]", "#js_form-order").filter(":checked").attr("id");
  deliv_name = $(":radio[name=ShippingMethod]", "#js_form-order").filter(":checked").val();

  if (deliv_id == idCDEKDelivery || deliv_id == idCDEKCoureir) {
     flagCDEK = true
     /* непомню что хотел этим сделать
     if ($('#'+idCDEKCoureir).is(':hidden') && $('#'+idCDEKDelivery).is(':hidden')){
        flagCDEK = false
     }
     */
    if (deliv_id == idCDEKDelivery) {
          flagMAP = true
          $('#adr_more').hide();
          $('.cdek_hide').show();
          $('#cdek_street').hide();
          $('#cdek_build').hide();
          sCDEK.addData('mode',4);
          $('.errorCDEK').remove();
    }
    else{
        flagMAP = false
        $('#adr_more').hide();
        $('.cdek_hide').show();
        $('#cdek_street').show();
        $('#cdek_build').show();
        $('.errorCDEK').remove();
        cdekMap.empty();
        sCDEK.addData('mode',3);
    }
// Проверяем на скрытые доставки, цифровой товар
        if ($("#delivery_steps").is(":visible")){
            sCDEK.config.delivery.misc = 0;
            sCDEK.config.delivery.name = deliv_name;
            sCDEK.sendData();
            SHK.selectDelivery(sCDEK.config.delivery.name);
        }else {
            noneDelive = true
            sCDEK.config.delivery.name = deliv_name;
            sCDEK.config.delivery.misc = 1;
            sCDEK.request('reset');

            SHK.selectDelivery(sCDEK.config.delivery.name,666);
        }
  }else {
    flagCDEK = false
    $('.cdek_hide').hide();
    $('#adr_more').show();
    cdekMap.empty();

    sCDEK.config.delivery.name = deliv_name;
    sCDEK.config.delivery.misc = 1;
    sCDEK.request('reset');

    SHK.selectDelivery(sCDEK.config.delivery.name,1);
  }

    cdekStatus.fadeOut();
    setTimeout(function(){
          $(":radio[name=ShippingMethod]", "#js_form-order").prop('disabled', false) // разблокируем все выборы доставки через 1 секунд
          $('.load-layer').hide();
    }, 1000);
}

$(document).ready(function() {
   checkDelivery();

  $(":radio[name=ShippingMethod]", "#js_form-order").on("change", function(){
      checkDelivery();
  })

  $('#js_form-order').on('change' , ":radio[name='delivery_cdek']",function() {
    t = $(":radio[name=delivery_cdek]", "#js_form-order").filter(":checked").val() || '0'
    p = $(":radio[name=delivery_cdek]", "#js_form-order").filter(":checked").data("price") || '0'
    sCDEK.addData('tarif',parseInt(t));
    sCDEK.addData('price',parseInt(p));
    sCDEK.setTarif();

  })

  $("#useConditions").on('change', function(){
      $('.errorCDEK').remove();
      sCDEK.setAdress2Courer();
    if (flagCDEK === true) {
        sCDEK.getAdressUser();
        if (sCDEK.config.tmp.code === "Null"){
            sCDEK.config.tmp.code = ''
        }
        if($(this).prop('checked')){
           _error = []
            for (key in sCDEK.config.tmp) {
                if (sCDEK.config.tmp[key] === ''){
                    if (flagMAP === false && key === 'code'){
                        continue;
                    }
                    if (flagMAP === true && (key === 'building' || key === 'street')){
                        continue;
                    }
                    _error.push(key)
                }
            }

            if (_error.length > 0){
                $(this).prop('checked', false);
                $(this).removeAttr('checked');
                str = "";
                for (key in sCDEK.config.tmp_error) {
                    if (_error.indexOf(key) != -1){
                        str += "<span id='cdek_"+key+"' class='errorCDEK' style='display:block;color: #d20523;'>" + sCDEK.config.tmp_error[key] + "</span>"
                    }
                }
                $(this).before(str);
            }
        }
    }
  });
})


sCDEK = {
	config: {
        delivery:{
          tarif: 0,
          mode: 0,
          city_id: 0,
          city_index: '',
          city_name: '',
          name:'',
          price:0,
        },
     tmp: {
         city:'',
         street:'',
         building:'',
         code:'',
         phone:'',
     },
     tmp_error: {
        city: 'Заполните поле Город и выберите из выпадающего списка необходимый',
        street:'Заполните поле Улица',
        building:'Заполните поле Дом',
        code:'Выберите на карте пункт выдачи',
        phone:'Заполните поле Телефон',
     },
	},
	initialize: function() {
	},
	request: function(action, data){
		if(!action) return;
		data = data || {};
		data.scdek_action = action;
		data.ctx = sCDEKConfig.ctx;
		$.ajax({
			 type: 'POST',
			 dataType: 'json',
			 url: sCDEKConfig.webconnector,
		     data: data,
			 success: function(response){
//                 SHK.selectDelivery(sCDEK.config.delivery.name);
                if (response.shkCDEK.delivery == 1){
                    cdekStatus.fadeOut();
                    cdekStatus.html(response.shkCDEK.status).fadeIn();
                }
                if (response.shkCDEK.tariff == 1){
                    SHK.selectDelivery(sCDEK.config.delivery.name);
                }
                if (typeof response.shkCDEK.pvzlist !== 'undefined'){
                    if (sCDEK.config.delivery.mode == 4){
                         setTimeout(function(){
                             document.getElementById('map_ajax').innerHTML = response.shkCDEK.pvzlist;
                             setTimeout(function(){
                                 ymaps.ready(init_map);
                             },1);
                         },1)
                    }
                }
                if (response.shkCDEK.adress == 1){
                }
                else{
                    sCDEK.getAdressUser('Null');
                }


			},
			error: function(response){
                console.log(response);
			}
		});
	},
    addData: function(key, value){
        sCDEK.config.delivery[key] = value
    },
    sendData: function(){
        if (sCDEK.config.delivery.mode > 0 && sCDEK.config.delivery.city_id > 0){
            sCDEK.request('getCostDelivery', sCDEK.config.delivery);

            setTimeout(function(){
                sCDEK.request('getPVZ');
            },500);
             if (sCDEK.config.tmp.code === '' && flagMAP === true){
                 sCDEK.getAdressUser($('.delivery_cdek_map-point').first().data('code'));
             }
        }
    },
    setTarif: function(value=0){
        sCDEK.request('setCostDelivery', sCDEK.config.delivery);
    },
    getAdressUser: function(value=0){
            sCDEK.config.tmp.city = $('#city').val();
            sCDEK.config.tmp.street = $('#street').val();
            sCDEK.config.tmp.building = $('#building').val();
            if (value != 0){
              sCDEK.config.tmp.code = value;
            }
            sCDEK.config.tmp.phone = $('#orderPhone').val()
            sCDEK.request('setAdress', sCDEK.config.tmp);
    },
    setAdress2Courer: function(){
        _name = $('#city').val() + " " + $('#street').val() + " " + $('#building').val() + " " + $('#room').val()
        if (flagMAP && $(".delivery_cdek_map-point").hasClass("is-active")){
            _name = $(".delivery_cdek_map-point").filter(".is-active").data("name");
        }
        if (!flagCDEK){
            _name = $('#orderAdress').val()
        }

        $('#cdek_point_set').val(_name);
    }
};

sCDEK.initialize();

function SHKloadCartCallback(){
    if (noneDelive){
        $(".total-shipping").hide();
        noneDelive = false
    }
}

$(document).bind('ready',SHKloadCartCallback);
