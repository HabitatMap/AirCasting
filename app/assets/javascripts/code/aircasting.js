window.aircasting = angular.module('aircasting', [], function($routeProvider, $locationProvider){
  $routeProvider.when('/map_crowd',
                      {templateUrl: 'partials/maps/crowd_map.html', controller: CrowdMapCtrl});
  $routeProvider.when('/map_sessions',
                      {templateUrl: 'partials/maps/sessions_map.html', controller: SessionsMapCtrl});
  $routeProvider.otherwise({redirectTo: '/map_crowd'});
})
