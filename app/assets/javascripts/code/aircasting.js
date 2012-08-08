angular.module('google', []);
angular.module('aircasting', ['ngCookies', "google"], function($routeProvider, $locationProvider){
  $routeProvider.when('/map_crowd',
                      {templateUrl: 'partials/crowd_map.html', controller: CrowdMapCtrl, reloadOnSearch: false});
  $routeProvider.when('/map_sessions',
                      {templateUrl: 'partials/sessions_map.html', controller: SessionsMapCtrl, reloadOnSearch: false});
  $routeProvider.otherwise({redirectTo: '/map_crowd'});
});
