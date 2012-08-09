angular.module("aircasting").factory('params', ['$location', '$rootScope', function($location, $rootScope) {
  var ParamsService = function() {
    var self = this;
    var scope = $rootScope.$new();
    //set init params
    self.paramsData = {data :angular.fromJson($location.search().data || '{}')};
    //add watch
    scope.$location = $location;
    scope.$watch("$location.search()", function(searchData) {
      var searchResult = angular.fromJson(searchData.data || '{}');
      if(angular.equals(self.paramsData.data, searchResult)){
        return;
      }
      self.paramsData.data = searchResult;
    });
  };
  ParamsService.prototype = {
    get: function() {
      return this.paramsData;
    },
    getData: function(){
      return  this.paramsData.data;
    },
    update: function(newParams) {
      $location.search({data: angular.toJson(_(this.paramsData.data).chain().clone().extend(newParams).value())});
    },
    replace: function(newParams) {
      $location.search({data: angular.toJson(newParams)});
    }
  };
  return new ParamsService();
}]);

