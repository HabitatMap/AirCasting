angular.module("aircasting").factory('params', ['$location', '$rootScope', function($location, $rootScope) {
  var ParamsService = function() {
    var self = this;
    var scope = $rootScope.$new();
    //set init params
    self.paramsData = angular.fromJson($location.search()) || {};
    scope.$location = $location;
    scope.$watch("$location.search()", function(searchData) {
      _(searchData || {}).each(function(value, key){
        searchData[key] = angular.fromJson(value);
      });
      if(angular.equals(self.paramsData, searchData)){
        return;
      }
      self.paramsData = searchData;
    });
  };
  ParamsService.prototype = {
    get: function(name, defaultValue){
      return this.paramsData[name] || defaultValue || {};
    },
    update: function(name, newParams, defaultValue) {
      var defaultValue = defaultValue || {};
      var self = this;
      var obj = {};
      obj[name] = newParams;
      var newData = {};
      if(!this.paramsData[name]) {
        this.paramsData[name] = defaultValue;
      }
      _(this.paramsData).each(function(value, key){
        newData[key] =  _(angular.copy(value)).extend(obj[key] || defaultValue);
      });
      _(newData).each(function(value, key){
        self.paramsData[key] = value;
        newData[key] =  angular.toJson(value);
      });
      $location.search(newData);
    }
  };
  return new ParamsService();
}]);

