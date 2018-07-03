angular.module("aircasting").factory('sensors', ['params', '$http', 'spinner', function(params, $http, spinner) {
  var Sensors = function() {
    spinner.show();

    this.sensors = {};
    this.tmpSensorId = undefined;
    this.shouldInitSelected = false;
    this.defaultSensor = this.buildSensorId({
      measurement_type: "Particulate Matter",
      sensor_name:      "AirBeam2-PM2.5",
      unit_symbol:      "µg/m³"
    });

    this.availableSensors = {};
    this.defaultParameter = {id: "Particulate Matter", label: "Particulate Matter"};
    this.selectedParameter = {};
    this.availableParameters = {};
  };
  Sensors.prototype = {
    setSensors : function(data, status, headers, config) {
      // Sensors
      var sensors = {};
      var self = this;
      _(data).each(function(sensor){
        sensor.id =  self.buildSensorId(sensor);
        sensor.label = sensor.sensor_name + " (" + sensor.unit_symbol + ")";
        if (sensor.label.length >= 42) {
          sensor.select_label = sensor.label.slice(0, 40) + "…";
        } else {
          sensor.select_label = sensor.label;
        }
        sensors[sensor.id] = sensor;
      });
      this.sensors = sensors;

      // Parameters
      var availableParameters = _.uniq(_(this.sensors).map(function(sensor) {
        return sensor.measurement_type
      }));
      availableParameters = _.sortBy(availableParameters)
      availableParameters = _.map(availableParameters, function(availableParameter) {
        return ({
          label: availableParameter,
          id: availableParameter
        });
      })
      this.availableParameters = availableParameters;

      // Initialize UI
      this.initSelected();
      spinner.hide();
    },
    initSelected: function() {
      console.log('initSelected()')
      var self = this;

      if(_(params.get('data').sensorId).isNull()) {
        console.log('initSelected() - sensorId is null')
        params.update({data: {sensorId: this.defaultSensor }});
      } else {
        console.log('initSelected() - sensorId is NOT null')
      }
      this.selectedParameter = self.findParameterForSensor(self.selected());
      this.availableSensors = self.findAvailableSensorsForParameter(self.selectedParameter);
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
    },
    setAllSensors: function() {
      console.log('setAllSensors')
      params.update({data: {sensorId: ""}});
    },
    sensorChangedToAll: function(newValue) {
      return !newValue;
    },
    findSensorById: function(id) {
      return this.sensors[id]
    },
    findParameterForSensor: function(sensor) {
      if (sensor) {
        return _(this.availableParameters).find(function(parameter) { return (parameter.id == sensor["measurement_type"]) });
      } else {
        return null;
      }
    },
    findAvailableSensorsForParameter: function(parameter) {
      if (parameter) {
        return _(this.sensors).filter(function(sensor) { return sensor["measurement_type"] == parameter["id"]})
      } else {
        return this.sensors;
      }
    },
    onSelectedParameterChange: function(selectedParameter) {
      console.log('onSelectedParameterChange() - ', selectedParameter)
      if (selectedParameter) {
        this.availableSensors = _(this.sensors).filter(function(sensor) { return sensor["measurement_type"] == selectedParameter["id"]})
      } else {
        this.availableSensors = this.sensors;
        this.setAllSensors();
      }
    },
    onSelectedSensorChange: function(newSensorId) {
      console.log('onSelectedSensorChange() - ', newSensorId)
      var sensor = this.findSensorById(newSensorId);
      var parameterForSensor = this.findParameterForSensor(sensor);
      this.selectedParameter = parameterForSensor;
    },
    buildSensorId: function(sensor) {
      return sensor.measurement_type + "-" + sensor.sensor_name + " (" + sensor.unit_symbol + ")";
    },
    // setDefault: function() {
    //  params.update({data: {sensorId: this.defaultSensor }});
    // }
  };
  return new Sensors();
}]);

