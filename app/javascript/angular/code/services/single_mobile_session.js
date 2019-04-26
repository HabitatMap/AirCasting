angular.module("aircasting").factory("singleMobileSession", [
  "mobileSessions",
  "sensors",
  "storage",
  "drawSession",
  "heat",
  function(mobileSessions, sensors, storage, drawSession, heat) {
    var SingleMobileSession = function() {};

    SingleMobileSession.prototype = {
      noOfSelectedSessions: function() {
        return mobileSessions.allSelected().length;
      },

      get: function() {
        return _(mobileSessions.allSelected()).first();
      },

      updateHeat: function() {
        var data = heat.toSensoredList(
          this.get().streams[sensors.anySelected().sensor_name]
        );
        storage.updateDefaults({ heat: heat.parse(data) });
        storage.reset("heat");
      },

      isFixed: function() {
        return false;
      }
    };
    return new SingleMobileSession();
  }
]);
