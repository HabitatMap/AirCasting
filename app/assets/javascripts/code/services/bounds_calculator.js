angular.module('aircasting').factory('boundsCalculator',
       ['sensors', function(sensors) {
  var calculate = function(sessions) {
    var north,  east, south, west;
    var maxLat = [], minLat = [], maxLong = [], minLong = [];
    var sensor = sensors.anySelected();
    if(!sensor) {
     return;
    }
    var streams = allStreams(sessions, sensor.sensor_name);

    if(!_.isEmpty(streams)){
      _(streams).each(function(s){
        maxLat.push(s.max_latitude);
        minLat.push(s.min_latitude);
        maxLong.push(s.max_longitude);
        minLong.push(s.min_longitude);
      });

      north = Math.max.apply(null, maxLat);
      south = Math.min.apply(null, minLat);
      west = Math.min.apply(null, minLong);
      east = Math.max.apply(null, maxLong);
    }

    if(!north){
      return;
    }
    return {north: north, east: east, south : south, west: west};
  };

  var allStreams = function(sessions, sensor_name){
    return _(sessions).map(function(session){
      return session.streams[sensor_name];
    });
  };

  return calculate;
}]);

