angular.module("aircasting").factory('params', ['$location', '$rootScope', 'utils',
                                     function($location, $rootScope, utils) {
  var Params = function() {
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
  Params.prototype = {
    get: function(name, defaultValue){
      return this.paramsData[name] || defaultValue || {};
    },
    update: function(newParams) {
      var self = this;
      var newData = utils.merge(this.paramsData || {}, newParams);
      this.paramsData = angular.copy(newData);
      _(newData).each(function(value, key){
        newData[key] =  angular.toJson(value);
      });
      $location.search(newData);
    }
  };
  return new Params();
}]);

