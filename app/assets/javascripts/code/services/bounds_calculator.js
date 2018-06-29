angular.module('aircasting').factory('boundsCalculator',
       ['sensors', function(sensors) {
  var calculate = function(sessions) {
    var maxLat = [], minLat = [], maxLong = [], minLong = [];
    var sensor = sensors.anySelected();
    if(!sensor) return;

    sessions.forEach(function(session){
      var stream = session.streams[sensor.sensor_name];
      if(!stream) return;

      maxLat.push(stream.max_latitude);
      minLat.push(stream.min_latitude);
      maxLong.push(stream.max_longitude);
      minLong.push(stream.min_longitude);
    });

    var north = Math.max.apply(null, maxLat);
    var south = Math.min.apply(null, minLat);
    var west = Math.min.apply(null, minLong);
    var east = Math.max.apply(null, maxLong);

    if(!north){ return; }
    return {north: north, east: east, south : south, west: west};
  };

  return calculate;
}]);

