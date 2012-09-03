angular.module("aircasting").factory('params', ['$location', '$rootScope', 'utils',
                                     function($location, $rootScope, utils) {
  var Params = function() {
    var self = this;
    this.scope = $rootScope.$new();
    //set init params
    this.init($location.search());
    this.startupData = angular.copy(this.paramsData);
    this.scope.$location = $location;
    this.scope.$watch("$location.search()", _(this.init).bind(this));
  };
  Params.prototype = {
    init: function(searchData) {
      _(searchData || {}).each(function(value, key){
        searchData[key] = angular.fromJson(value);
      });
      if(angular.equals(this.paramsData, searchData)){
        return;
      }
      this.paramsData = searchData || {};
    },
    get: function(name, defaultValue){
      return this.paramsData[name] || defaultValue || {};
    },
    getWithout: function(name, exception){
      var result = angular.copy(this.get(name));
      delete result[exception];
      return result;
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

