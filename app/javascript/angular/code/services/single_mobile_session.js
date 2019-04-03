angular.module("aircasting").factory('singleMobileSession', [
  'mobileSessions',
  'sensors',
  'storage',
  'drawSession',
  'heat',
  function(
    mobileSessions,
    sensors,
    storage,
    drawSession,
    heat
  ) {
    var SingleMobileSession = function() {
    };

    SingleMobileSession.prototype = {
      isSingle: function() {
        return this.noOfSelectedSessions() == 1;
      },

      noOfSelectedSessions : function() {
        return mobileSessions.allSelected().length;
      },

      get: function() {
        return _(mobileSessions.allSelected()).first();
      },

      withSelectedSensor: function(){
        return !!this.get().streams[sensors.anySelected().sensor_name];
      },

      measurements: function(){
        return  drawSession.measurements(this.get());
      },

      measurementsToTime: function(){
        var x;
        var result = {};
        _(this.measurements()).each(function(measurement){
          x = moment(measurement.time,"YYYY-MM-DDTHH:mm:ss").utcOffset(0, true).valueOf();
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
        return false;
      }
    };
    return new SingleMobileSession();
  }]);
