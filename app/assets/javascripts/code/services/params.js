angular.module("aircasting").factory('params', ['$location', '$rootScope', function($location, $rootScope) {
  var self = this;
  var scope = $rootScope.$new();
  //set init params
  self.params = {data :angular.fromJson($location.search().data || '{}')};
  //add watch
  scope.$location = $location;
  scope.$watch("$location.search()", function(searchData) {
    var searchResult = angular.fromJson(searchData.data || '{}');
    if(angular.equals(self.params.data, searchResult)){
      return;
    }
    self.params.data = searchResult;
  })
  return {
    get: function() {
      return self.params;
    },
    update: function(newParams) {
      $location.search({data: angular.toJson(_(self.params.data).chain().clone().extend(newParams).value())});
    },
    replace: function(newParams) {
      $location.search({data: angular.toJson(newParams)});
    }
  };
}]);

