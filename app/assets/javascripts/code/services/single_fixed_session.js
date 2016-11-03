angular.module("aircasting").factory('singleFixedSession',
       ['fixedSessions', 'map','sensors', 'storage', 'heat', 'utils', 'drawSession',
        function(fixedSessions, map, sensors, storage, heat, utils, drawSession) {
  var SingleFixedSession = function() {
  };
  SingleFixedSession.prototype = {
    isSingle : function() {
      return this.noOfSelectedSessions() == 1;
    },
    noOfSelectedSessions : function() {
      return fixedSessions.allSelected().length;
    },
    get: function() {
      return _(fixedSessions.allSelected()).first();
    },
    id: function(onlySingle) {
      if(onlySingle && !this.isSingle()){
        return;
      }
      var el = this.get();
      return el && el.id;
    },
    endTime: function() {
      return this.get().end_time_local;
    },
    startTime: function() {
      return this.get().start_time_local;
    },
    availSensors: function() {
      if(!this.get()){
        return [];
      }
      var ids = _(this.get().streams).map(function(sensor){
        return sensor.measurement_type + "-" + sensor.sensor_name + " (" + sensor.unit_symbol + ")";
      });
      return _(sensors.get()).select(function(sensor){
        return _(ids).include(sensor.id);
      });
    },
    withSelectedSensor: function(){
      return !!this.get().streams[sensors.anySelected().sensor_name];
    },
    selectedStream: function() {
      return this.get().streams[sensors.anySelected().sensor_name];
    },
    measurements: function(){
      return  drawSession.measurements(this.get());
    },
    measurementsToTime: function(measurements){
      var currentOffset = moment.duration(utils.timeOffset, "minutes").asMilliseconds();
      var x;
      var result = {};
      // 1 hour subtraction is a quick and dirty fix for the winter time - should be fixed properly
      var start_date = new Date(this.startTime()).getTime() - (60*60*1000);

      result[start_date + ""] = {x: start_date, y: null, latitude: null, longitude: null};

      _(measurements).each(function(measurement){
        x = moment(measurement.time, "YYYY-MM-DDTHH:mm:ss").valueOf() - currentOffset;
        result[x + ""] = {x: x,
                y: measurement.value,
                latitude: measurement.latitude,
                longitude: measurement.longitude};
      });
      return result;
    },
    updateHeat: function() {
      var data = heat.toSensoredList(this.get().streams[sensors.anySelected().sensor_name]);
      storage.updateDefaults({heat: heat.parse(data)});
      storage.reset("heat");
    },
    isFixed: function() {
      return true;
    }
  };
  return new SingleFixedSession();
}]);
