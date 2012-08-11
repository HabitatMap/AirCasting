angular.module("aircasting").factory('sessions', ['params', '$http', 'map','sensors',
                                     function(params, $http, map, sensors) {
  var Sessions = function() {
    this.sessions = [];
  };
  Sessions.prototype = {
    fetch: function(callback) {
      var viewport = map.viewport();
      var data = params.get('data');
      if(!data.time) {
        return;
      }
      var reqData = {
        west: viewport.west,
        east: viewport.east,
        south: viewport.south,
        north: viewport.north,
        time_from: data.time.timeFrom,
        time_to:  data.time.timeTo,
        day_from:  data.time.dayFrom,
        day_to:  data.time.dayTo,
        year_from: 2011,
        year_to: 2020,
        tags:  data.tags,
        usernames:  data.usernames
      };
      if(sensors.selected()){
        _(reqData).extend({
          sensor_name:  sensors.selected().sensor_name,
          measurement_type:  sensors.selected().measurement_type
        });
      }
      $http.get('/api/sessions.json', {params : {q: reqData}}).success(callback);
    }
  };
  return new Sessions();
}]);

