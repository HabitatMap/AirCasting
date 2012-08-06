angular.module("aircasting").factory('params', ['$location', '$rootScope', function($location, $rootScope) {
  var self = this;
  self.params = {data: {}};
  var scope = $rootScope.$new();
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

