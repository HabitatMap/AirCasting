angular.module('google', []);
angular.module('aircasting', ['ngRoute', 'ngCookies', "google"], [ "$routeProvider", function($routeProvider){
  var v = $("body").data("version");
  $routeProvider.when('/map_crowd',
                      {templateUrl: 'partials/crowd_map.html?v=' + v,
                        controller: CrowdMapCtrl, reloadOnSearch: false});
  $routeProvider.when('/map_sessions',
                      {templateUrl: 'partials/sessions_map.html?v=' + v,
                        controller: SessionsMapCtrl, reloadOnSearch: false});
  $routeProvider.otherwise({redirectTo: '/map_crowd'});
}]);

angular.module('aircasting').config(['$httpProvider', function($httpProvider) {
  $httpProvider.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';
}]);
