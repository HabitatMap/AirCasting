angular.module("aircasting").factory('sensors', ['params', '$http', function(params, $http) {
  var Sensors = function() {
    $http.get('/api/sensors').success(_(this.onSensorsFetch).bind(this));
    this.sensors = {};
  };
  Sensors.prototype = {
    onSensorsFetch : function(data, status, headers, config) {
      var self = this;
      var sensors = {};
      _(data).each(function(sensor){
        sensor.id = sensor.measurement_type + "-" + sensor.sensor_name;
        sensor.label = sensor.measurement_type + " - " + sensor.sensor_name;
        sensors[sensor.id] = sensor;
      });
      self.sensors = sensors;
      if(!params.getData().sensorId){
        params.update({sensorId: _(self.sensors).chain().keys().sortBy(function(sensorId){
          return -1 * self.sensors[sensorId].session_count;
        }).first().value()});
      }
    },
    get : function() {
      return this.sensors;
    },
    isEmpty: function() {
      return _(this.sensors).size() === 0;
    },
    selected: function() {
      return this.sensors[params.getData().sensorId];
    },
    selectedId: function() {
      if(!this.sensors[params.getData().sensorId]){
        return;
      }
      return this.sensors[params.getData().sensorId].id;
    }
  };
  return new Sensors();
}]);

