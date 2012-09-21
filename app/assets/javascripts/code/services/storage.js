angular.module("aircasting").factory('storage', ['params', '$rootScope', 'utils',  function(params, $rootScope, utils) {
  var Storage = function() {
    this.data = {heat: {}};
    self = this;
    this.counter = 0;
    var scope = $rootScope.$new();
    //TODO change to emitter and broadcasters
    scope.params = params;
    this.defaults = {};
    scope.$watch("params.get('data')", function(newValue, oldValue) {
      self.extend(newValue);
    }, true);
  };
  Storage.prototype = {
    get: function(name) {
      return this.data[name];
    },
    refreshCounter: function(){
      this.set("counter", parseInt(this.get("counter") || 0, 10) + 1);
    },
    set : function(name, value) {
      this.data[name] = angular.copy(value);
    },
    setInHash: function(hashName, name, value) {
      this.data[hashName][name] = angular.copy(value);
    },
    extend: function(data) {
      _.extend(this.data, angular.copy(data));
    },
    update: function(name) {
      var obj = {};
      if(name == 'time') {
        var timeObject = this.get('time');
        _(timeObject).each(function(value, key){
          timeObject[key] = parseInt(value, 10);
        });
        obj[name] = timeObject;
      } else {
        obj[name] = this.get(name);
      }
      params.update({data: obj});
    },
    updateWithRefresh: function(name) {
      //be carefull when using this - currently it is only for location data
      this.refreshCounter();
      var obj = {};
      obj[name] = this.get(name);
      obj.counter = this.get("counter");
      params.update({data: obj});
    },
    reset: function(name) {
      if(_(this.defaults).has(name)){
        this.data[name] = angular.copy(this.defaults[name]);
        this.update(name);
      }
    },
    updateDefaults :  function(newData) {
      this.defaults = utils.merge(this.defaults, newData);
    },
    updateFromDefaults: function() {
      var notUsedDefaults = {};
      _(this.defaults).each(function(value, key){
        if(!params.get("data")[key]){
          notUsedDefaults[key] = value;
        }
      });
      params.update({data: notUsedDefaults});
    }
  };
  return new Storage();
}]);


