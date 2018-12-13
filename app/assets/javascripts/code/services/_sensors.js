export const sensors = (params, $http) => {
  var Sensors = function() {
    this.sensors = {};
    this.candidateSelectedSensorId = undefined;
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
      return this.sensors[params.get('tmp').selectedSensorId];
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
      params.update({tmp: {selectedSensorId: this.candidateSelectedSensorId}});
    },
    setAllSensors: function() {
      console.log('setAllSensors')
      params.update({data: {sensorId: ""}});
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
    onSelectedParameterChange: function(selectedParameter, oldValue) {
      console.log('onSelectedParameterChange() - ', selectedParameter)
      if (selectedParameter === oldValue) return; // first angular watch run
      params.update({selectedSessionIds: []});
      if (hasChangedToAll(selectedParameter)) {
        this.availableSensors = this.sensors;
        this.setAllSensors();
      } else {
        this.availableSensors = _(this.sensors).filter(function(sensor) { return sensor["measurement_type"] == selectedParameter["id"]})
        var sensor = max(function(sensor) { return sensor.session_count; }, this.availableSensors) || { id: null };
        params.update({data: {sensorId: sensor.id}});
      }
    },
    onSelectedSensorChange: function(newSensorId) {
      console.log('onSelectedSensorChange() - ', newSensorId);
      if(hasChangedToAll(newSensorId)){
        params.update({data: {sensorId: ""}});
      }
      var sensor = this.findSensorById(newSensorId);
      var parameterForSensor = this.findParameterForSensor(sensor);
      this.selectedParameter = parameterForSensor;
    },
    buildSensorId: function(sensor) {
      return sensor.measurement_type + "-" + sensor.sensor_name + " (" + sensor.unit_symbol + ")";
    },
    onSensorsSelectedIdChange: function(newValue, oldValue, callback) {
      console.log("onSensorsSelectedIdChange - ", newValue, " - ", oldValue);

      if(hasChangedToAll(newValue)) return;

      if (callback) {
        $http.get( '/api/thresholds/' + this.selected().sensor_name, {
          params: { unit_symbol: this.selected().unit_symbol },
          cache: true
        }).success(callback);
      }

      if (newValue === oldValue) return; // first angular watch run

      params.update({data: {sensorId: newValue}});
      params.update({selectedSessionIds: []});
    }
  };
  return new Sensors();
};

const hasChangedToAll = newValue => !newValue;

const max = (valueOf, xs) => {
  const reducer = (acc, x) => valueOf(x) > valueOf(acc) ? x : acc;
  return xs.reduce(reducer, xs[0]);
};
