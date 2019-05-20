angular.module("aircasting").factory("singleMobileSession", [
  "mobileSessions",
  "sensors",
  "drawSession",
  "heat",
  function(mobileSessions, sensors, drawSession, heat) {
    var SingleMobileSession = function() {};

    SingleMobileSession.prototype = {
      get: function() {
        return _(mobileSessions.allSelected()).first();
      },

      isFixed: function() {
        return false;
      }
    };
    return new SingleMobileSession();
  }
]);
