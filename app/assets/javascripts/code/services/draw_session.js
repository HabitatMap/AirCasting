angular.module('aircasting').factory('drawSession',
       ['sensors', 'map', 'heat', 'note', 'empty',
        function(sensors, map, heat, note, empty) {
  var DrawSession = function() {
  };

  DrawSession.prototype = {
    drawMobileSession: function(session, bounds) {
      if(!session || !session.loaded || !sensors.anySelected()){
        return;
      }
      this.undoDraw(session, true);

      var suffix = ' ' + sensors.anySelected().unit_symbol;
      session.markers = [];
      session.noteDrawings = [];
      session.lines = [];
      var points = [];
      _(this.measurements(session)).each(function(measurement, idx){
        var value = Math.round(measurement.value);
        var level = heat.getLevel(value);
        if (level){
          session.markers.push(map.drawMarker(measurement, {
            title: parseInt(measurement.value, 10).toString() + suffix,
            zIndex: idx,
            icon: "/assets/marker"+ level + ".png"
          }));
          points.push(measurement);
        }
      });
      _(session.notes || []).each(function(noteItem, idx){
        session.noteDrawings.push(note.drawNote(noteItem, idx));
      });
      session.lines.push(map.drawLine(points));

      session.drawed = true;
      map.appendViewport(bounds);
    },

    drawFixedSession: function(session, bounds) {
      session.markers = [];
      session.noteDrawings = [];
      session.lines = [];

      session.markers.push(map.drawMarker(session, {
        title: session.title,
        zIndex: 0,
        icon: "/assets/location_marker.png"
      }));
      session.drawed = true;
      map.appendViewport(bounds);
      return session.markers;
    },

    undoDraw: function(session, bounds, noMove) {
      if(!session.drawed){
        return;
      }
      _(session.markers || []).each(function(marker){
        map.removeMarker(marker);
      });
      _(session.lines || []).each(function(line){
        map.removeMarker(line);
      });
      _(session.noteDrawings || []).each(function(noteItem){
        map.removeMarker(noteItem);
      });
      session.drawed = false;
      if(!noMove){
        map.appendViewport(bounds);
      }
    },

    redraw: function(sessions) {
      this.clear();
      _(sessions).each(function(session) {
        if (session.type == 'MobileSession') {
          _(this.drawMobileSession);
        } else if (session.type == 'FixedSession') {
          _(this.drawFixedSession);
        } else return;
      }.bind(this));
    },

    clear: function(sessions) {
      _(sessions).each(_(this.undoDraw).bind(this));
    },

    measurementsForSensor: function(session, sensor_name){
      if (!session.streams[sensor_name]) { return empty.array; }
      return session.streams[sensor_name].measurements;
    },

    measurements: function(session){
      if (!session) { return empty.array; }
      if (!sensors.anySelected()) { return empty.array; }
      return this.measurementsForSensor(session, sensors.anySelected().sensor_name);
    }
  };
  return new DrawSession();
}]);
