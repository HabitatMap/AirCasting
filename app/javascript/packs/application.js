/* eslint no-console:0 */
// This file is automatically compiled by Webpack, along with any other files
// present in this directory. You're encouraged to place your actual application logic in
// a relevant structure within app/javascript and only use these pack files to reference
// that code so it'll be compiled.
//
// To reference this file, add <%= javascript_pack_tag 'application' %> to the appropriate
// layout file, like app/views/layouts/application.html.erb

const initAngular = () => {
  if (!document.getElementById("elm-app")) return setTimeout(initAngular, 100);

  window.jQuery = window.$ = require("jquery");
  require("jquery-migrate");
  window.moment = require("moment");
  require("../angular/libs/jquery_ui/jquery.ui.core");
  require("../angular/libs/jquery_ui/jquery.ui.widget");
  require("../angular/libs/jquery_ui/jquery.ui.mouse");
  require("../angular/libs/jquery_ui/jquery.ui.position");
  require("../angular/libs/jquery_ui/jquery.ui.slider");
  require("../angular/libs/jquery_ui/jquery.ui.autocomplete");
  require("../angular/libs/jquery_ui/jquery.ui.dialog");
  require("../angular/libs/jquery_ui/jquery.ui.daterangepicker");
  require("angular");
  require("angular-cookies");
  window._ = require("underscore");
  window._.str = require("underscore.string");
  require("../angular/code/aircasting");

  var req = require.context("../angular/code/services", true, /\.js$/);
  req.keys().forEach(function(key) {
    req(key);
  });

  var req = require.context("../angular/code/directives", true, /\.js$/);
  req.keys().forEach(function(key) {
    req(key);
  });

  var req = require.context("../angular/code/controllers", true, /\.js$/);
  req.keys().forEach(function(key) {
    req(key);
  });
};

initAngular();
