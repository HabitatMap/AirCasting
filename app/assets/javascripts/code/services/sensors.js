angular.module("aircasting").factory('sensors', ['params', '$http', function(params, $http) {
  var Sensors = function() {
    $http.get('/api/sensors').success(_(this.onSensorsFetch).bind(this));
    this.sensors = {};
    this.tmpSensorId = undefined;
    this.shouldInitSelected = false;
  };
  Sensors.prototype = {
    onSensorsFetch : function(data, status, headers, config) {
      var sensors = {};
      _(data).each(function(sensor){
        sensor.id = sensor.measurement_type + "-" + sensor.sensor_name;
        sensor.label = sensor.measurement_type + " - " + sensor.sensor_name;
        sensors[sensor.id] = sensor;
      });
      this.sensors = sensors;
      this.initSelected();
    },
    initSelected: function() {
      var self = this;
      //this is called only for injectors who verified flag - like crowd map
      if(this.shouldInitSelected && !this.isEmpty() && !params.get('data').sensorId){
        params.update({data: {
          sensorId: _(self.sensors).chain().keys().sortBy(function(sensorId){
            return -1 * self.sensors[sensorId].session_count;
          }).first().value()
        }});
      }
    },
    get : function() {
      return this.sensors;
    },
    isEmpty: function() {
      return _(this.sensors).size() === 0;
    },
    selected: function() {
      return this.sensors[params.get('data').sensorId];
    },
    selectedId: function() {
      if(!this.selected()){
        return;
      }
      return this.selected().id;
    },
    tmpSelected: function() {
      return this.sensors[params.paramsData.tmpSensorId];
    },
    tmpSelectedId: function() {
      if(!this.tmpSelected()){
        return;
      }
      return this.tmpSelected().id;
    },
    proceedWithTmp: function() {
      params.update({tmpSensorId: this.tmpSensorId});
    }
  };
  return new Sensors();
}]);

