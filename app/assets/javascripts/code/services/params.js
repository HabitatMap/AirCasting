angular.module("aircasting").factory('params', ['$location', '$rootScope', function($location, $rootScope) {
  var ParamsService = function() {
    var self = this;
    var scope = $rootScope.$new();
    //set init params
    self.paramsData = angular.fromJson($location.search()) || {};
      console.log("paramsData", this.paramsData)
    //add watch
    scope.$location = $location;
    scope.$watch("$location.search()", function(searchData) {
      _(searchData || {}).each(function(value, key){
        searchData[key] = angular.fromJson(value);
      });
      if(angular.equals(self.paramsData, searchData)){
        return;
      }
      self.paramsData = searchResult;
    });
  };
  ParamsService.prototype = {
    get: function(name){
      return this.paramsData[name] || {};
    },
    update: function(name, newParams) {
      var self = this;
      var obj = {};
      obj[name] = newParams;
      var newData = {};
      if(!this.paramsData[name]) {
        this.paramsData[name] = {};
      }
      _(this.paramsData).each(function(value, key){
        newData[key] = _(value).chain().clone().extend(obj[key] || {}).value();
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

