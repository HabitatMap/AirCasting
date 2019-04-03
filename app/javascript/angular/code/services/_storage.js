import _ from 'underscore';

export const storage = (params, $rootScope, utils) => {
  var Storage = function() {
    this.data = {heat: {}};
    const self = this;
    this.counter = 0;
    var scope = $rootScope.$new();
    //TODO change to emitter and broadcasters
    scope.params = params;
    this.defaults = {};
    scope.$watch("params.get('data')", function(newValue, oldValue) {
      console.log("watch - params.get('data')");
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
    set: function(name, value) {
      this.data[name] = JSON.parse(JSON.stringify(value));
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
    resetAddress: function() {
      this.data.location = { ...this.data.location, address: '' };
      this.update('location');
    },
    updateDefaults: function(newData) {
      //only used for updating heat; todo - delete when new heat legend implemented
      this.defaults = utils.merge(this.defaults, newData);
    },
  };
  return new Storage();
}
