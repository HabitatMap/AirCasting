angular.module("aircasting").factory('expandables', function() {
  var Expandables = function() {
    this.allHidden = false;
    this.sections = {};
  };
  Expandables.prototype = {
    toggle: function(name) {
      this.sections[name] = this.sections[name] ? undefined : "expanded";
    },
    show: function(name) {
      this.sections[name] = "expanded";
    },
    css: function(name) {
      return this.sections[name];
    },
    visible: function(name){
      return !!this.sections[name];
    }
  };
  return new Expandables();
});

