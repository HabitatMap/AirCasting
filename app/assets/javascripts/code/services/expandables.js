angular.module("aircasting").factory('expandables', function() {
  var Expandables = function() {
    this.prev = {}
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
    },
    justHeat: function() {
      this.prev = this.sections
      this.sections = { heat: "expanded" };
   },
   isJustHeat: function() {
     return Object.keys(this.sections).length === 1 &&
       Object.keys(this.sections)[0] === "heat";
   },
   unjustHeat: function() {
     this.sections = this.prev;
   }
  };
  return new Expandables();
});

