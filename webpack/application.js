require('../app/assets/javascripts/libs/jquery');
window.moment = require('moment');
require('../app/assets/javascripts/libs/jquery_ui/jquery.ui.core');
require('../app/assets/javascripts/libs/jquery_ui/jquery.ui.widget');
require('../app/assets/javascripts/libs/jquery_ui/jquery.ui.mouse');
require('../app/assets/javascripts/libs/jquery_ui/jquery.ui.position');
require('../app/assets/javascripts/libs/jquery_ui/jquery.ui.slider');
require('../app/assets/javascripts/libs/jquery_ui/jquery.ui.datepicker');
require('../app/assets/javascripts/libs/jquery_ui/jquery.ui.autocomplete');
require('../app/assets/javascripts/libs/jquery_ui/jquery.ui.dialog');
require('../app/assets/javascripts/libs/jquery_ui/jquery.ui.timepicker');
require('angular');
require('angular-route');
require('angular-cookies');
window._ = require('underscore');
window._.str = require('underscore.string');
window.Spinner = require('spin.js');
window.Highcharts = require('highcharts/highstock');
require('../app/assets/javascripts/libs/jquery.lightbox-0.5');
require('../app/assets/javascripts/code/aircasting');

var req = require.context("../app/assets/javascripts/code/services", true, /\.js$/);
req.keys().forEach(function(key){
  req(key);
});

var req = require.context("../app/assets/javascripts/code/directives", true, /\.js$/);
req.keys().forEach(function(key){
  req(key);
});

var req = require.context("../app/assets/javascripts/code/controllers", true, /\.js$/);
req.keys().forEach(function(key){
  req(key);
});
