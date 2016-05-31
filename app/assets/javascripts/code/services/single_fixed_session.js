angular.module("aircasting").factory('singleFixedSession', ['fixedSessions', 'map','sensors', 'storage', 'heat', 'utils',
                                     function(fixedSessions, map, sensors, storage, heat, utils) {
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
    availSensors: function() {
      if(!this.get()){
        return [];
      }
      var ids = _(this.get().availableStreams).map(function(sensor){
        return sensor.measurement_type + "-" + sensor.sensor_name + " (" + sensor.unit_symbol + ")";
      });
      return _(sensors.get()).select(function(sensor){
        return _(ids).include(sensor.id);
      });
    },
    withSelectedSensor: function(){
      return !!this.get().streams[sensors.anySelected().sensor_name];
    },
    measurements: function(){
      return  fixedSessions.measurements(this.get());
    },
    measurementsToTime: function(){
      var currentOffset = moment.duration(utils.timeOffset, "minutes").asMilliseconds();
      var x;
      var result = {};
      _(this.measurements()).each(function(measurement){
        x = moment(measurement.time,"YYYY-MM-DDTHH:mm:ss").valueOf() - currentOffset;
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
