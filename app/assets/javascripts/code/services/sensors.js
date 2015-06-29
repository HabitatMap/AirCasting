angular.module("aircasting").factory('sensors', ['params', '$http', 'spinner', function(params, $http, spinner) {
  var Sensors = function() {
    spinner.show();
    $http.get('/api/sensors', {cache: true}).success(_(this.onSensorsFetch).bind(this));
    this.sensors = {};
    this.tmpSensorId = undefined;
    this.shouldInitSelected = false;
    this.defaultSensor = "Particulate Matter-AirBeam-PM (µg/m³)"
  };
  Sensors.prototype = {
    onSensorsFetch : function(data, status, headers, config) {
      var sensors = {};
      _(data).each(function(sensor){
        sensor.id = sensor.measurement_type + "-" + sensor.sensor_name + " (" + sensor.unit_symbol + ")";
        sensor.label = sensor.measurement_type + "-" + sensor.sensor_name + " (" + sensor.unit_symbol + ")";
        if (sensor.label.length >= 42) {
          sensor.select_label = sensor.label.slice(0, 40) + "…";
        } else {
          sensor.select_label = sensor.label;
        }
        sensors[sensor.id] = sensor;
      });
      this.sensors = sensors;
      this.initSelected();
      spinner.hide();
    },
    initSelected: function() {
      var self = this;
      //this is called only for injectors who verified flag - like crowd map
      if(this.shouldInitSelected && !this.isEmpty() && !params.get('data').sensorId){
        if(this.defaultSensor) {
          params.update({data: {sensorId: this.defaultSensor }});
        } else {
          params.update({data: {
            sensorId: _(self.sensors).chain().keys().sortBy(function(sensorId) {
              return -1 * self.sensors[sensorId].session_count;
            }).first().value()
          }});
        }
      }
    },
    get : function() {
      return this.sensors;
    },
    isEmpty: function() {
      return _(this.sensors).size() === 0;
    },
    //selected in dropdown
    selected: function() {
      return this.sensors[params.get('data').sensorId];
    },
    selectedId: function() {
      if(!this.selected()){
        return;
      }
      return this.selected().id;
    },
    //used when "all" sensors are choosen
    tmpSelected: function() {
      return this.sensors[params.get('tmp').tmpSensorId];
    },
    tmpSelectedId: function() {
      if(!this.tmpSelected()){
        return;
      }
      return this.tmpSelected().id;
    },
    //pick tmp when "all option is selected
    anySelected: function() {
      return this.selected() || this.tmpSelected();
    },
    anySelectedId: function() {
      if(!this.anySelected()){
        return;
      }
      return this.anySelected().id;
    },
    proceedWithTmp: function() {
      params.update({tmp: {tmpSensorId: this.tmpSensorId}});
    }

  };
  return new Sensors();
}]);

