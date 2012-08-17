angular.module("aircasting").factory('singleSession', ['sessions', 'map','sensors',
                                     function(sessions, map, sensors) {
  var SingleSession = function() {
  };
  SingleSession.prototype = {
    isSingle : function() {
      return this.noOfSelectedSessions() == 1;
    },
    noOfSelectedSessions : function() {
      return sessions.allSelected().length;
    },
    get: function() {
      return _(sessions.allSelected()).first();
    },
    availSensors: function() {
      if(!this.get()){
        return [];
      }
      var ids = _(this.get().streams).map(function(sensor){
        return sensor.measurement_type + "-" + sensor.sensor_name;
      });
      return _(sensors.get()).select(function(sensor){
        return _(ids).include(sensor.id);
      });
    },
    withSelectedSensor: function(){
      return !!this.get().details.streams[sensors.anySelected().sensor_name];
    },
    measurements: function(){
      return  _(sessions.measurementsForSensor(this.get(), sensors.anySelected().sensor_name));
    },
    measurementsToTime: function(){
      return  _(this.measurements()).map(function(measurement){
        return [moment(measurement.time).valueOf(), measurement.value];
      });
    }
  };
  return new SingleSession();
}]);

