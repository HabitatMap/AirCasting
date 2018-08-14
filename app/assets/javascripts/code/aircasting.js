angular.module('google', []);
angular.module('aircasting', ['ngRoute', 'ngCookies', "google"], [ "$routeProvider", function($routeProvider){
  var v = $("body").data("version");
  var sensorsList = fetch('/api/sensors').then(function(r) { return r.json() });

  $routeProvider.when('/map_crowd',
                      {templateUrl: 'partials/crowd_map.html?v=' + v,
                        controller: 'CrowdMapCtrl', reloadOnSearch: false,
                        resolve: {
                          sensorsList: ['$http', function($http) {return $http.get('/api/sensors', {cache: true}).then(function(response){ return response.data}) }]
                        }
                      });
  $routeProvider.when('/map_sessions',
                      {templateUrl: 'partials/mobile_sessions_map.html?v=' + v,
                        controller: 'MobileSessionsMapCtrl', reloadOnSearch: false,
                        resolve: {
                          sensorsList: ['$http', function($http) {return $http.get('/api/sensors', {cache: true}).then(function(response){ return response.data}) }]
                        }
                      });
  $routeProvider.when('/map_fixed_sessions',
                      {templateUrl: 'partials/fixed_sessions_map.html?v=' + v,
                        controller: 'FixedSessionsMapCtrl', reloadOnSearch: false,
                        resolve: {
                          sensorsList: ['$http', function($http) {return $http.get('/api/sensors', {cache: true}).then(function(response){ return response.data}) }]
                        }
                      });
  $routeProvider.otherwise({redirectTo: '/map_fixed_sessions'});
}]);

angular.module('aircasting').config(['$httpProvider', function($httpProvider) {
  $httpProvider.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';
  $httpProvider.interceptors.push('http_spinner_interceptor');
}]);
