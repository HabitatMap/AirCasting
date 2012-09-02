angular.module("aircasting").factory('singleSession', ['sessions', 'map','sensors', 'storage', 'heat',
                                     function(sessions, map, sensors, storage, heat) {
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
    id: function() {
      var el = this.get();
      return el && el.id;
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
      return !!this.get().streams[sensors.anySelected().sensor_name];
    },
    measurements: function(){
      return  sessions.measurements(this.get());
    },
    measurementsToTime: function(){
      var result = _(this.measurements()).map(function(measurement){
        return {x: moment(measurement.time).valueOf(), y: measurement.value,
          latitude: measurement.latitude, longitude: measurement.longitude};
      });
      return _(result).uniq(true, function(item) {
        return item.x;
      });
    },
    updateHeat: function() {
      var data = heat.toSensoredList(this.get().streams[sensors.anySelected().sensor_name]);
      storage.updateDefaults({heat: heat.parse(data)});
      storage.reset("heat");
    }
  };
  return new SingleSession();
}]);

