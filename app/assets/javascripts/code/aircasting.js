import constants from './constants';

angular.module('google', []);
angular.module('aircasting', ['ngRoute', 'ngCookies', "google"], [ "$routeProvider", function($routeProvider){
  const v = $("body").data("version");

  $routeProvider.when(constants.mobileMapRoute,
                      {templateUrl: 'partials/mobile_sessions_map.html?v=' + v,
                        controller: 'MobileSessionsMapCtrl', reloadOnSearch: false,
                        resolve: {
                          sensorsList: ['$http', function($http) {return $http.get('/api/sensors', {cache: true}).then(function(response){ return response.data}) }]
                        }
                      });
  $routeProvider.when(constants.fixedMapRoute,
                      {templateUrl: 'partials/fixed_sessions_map.html?v=' + v,
                        controller: 'FixedSessionsMapCtrl', reloadOnSearch: false,
                        resolve: {
                          sensorsList: ['$http', function($http) {return $http.get('/api/sensors', {cache: true}).then(function(response){ return response.data}) }]
                        }
                      });
  $routeProvider.otherwise({redirectTo: '/map_sessions'});
}]);

angular.module('aircasting').config(['$httpProvider', function($httpProvider) {
  $httpProvider.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';
  $httpProvider.interceptors.push('http_spinner_interceptor');
}]);
