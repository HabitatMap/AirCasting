angular.module("aircasting").factory('mobileSessions',
       ['params', '$http', 'map', 'note', 'sensors', '$rootScope', 'heat',
       'spinner',  'utils', "$timeout", 'flash', 'sessionsDownloader',
       'sessionsExporter', 'empty',
        function(params, $http, map, note, sensors, $rootScope, heat, spinner,
          utils, $timeout, flash, sessionsDownloader, sessionsExporter, empty) {
  var MobileSessions = function() {
    this.sessions = [];
    this.maxPoints = 30000;
    var self = this;
    this.scope = $rootScope.$new();
    this.scope.params = params;
    this.scope.canNotSelectSessionWithSensorSelected = "You are trying to select too many sessions";
    this.scope.canNotSelectSessionWithoutSensorSelected = "Filter by Parameter - Sensor to view many sessions at once";
  };

  MobileSessions.prototype = {
    sessionsChanged: function (newIds, oldIds) {
      _(newIds).chain().difference(oldIds).each(_(this.selectSession).bind(this));
      _(oldIds).chain().difference(newIds).each(_(this.deselectSession).bind(this));
    },
    get: function(){
      return this.sessions;
    },
    allSessionIds: function() {
      return _(this.get()).pluck("id");
    },
    noOfSelectedSessions : function() {
      return this.allSelected().length;
    },

    canSelectThatSession: function(session) {
      return (this.totalMeasurementsSelectedCount() + this.measurementsCount(session)) <= this.maxPoints;
    },

    canSelectAllSessions: function(session) {
      return this.totalMeasurementsCount() <= this.maxPoints;
    },

    empty: function() {
      return this.noOfSelectedSessions() === 0;
    },

    export: function() {
      sessionsExporter(this.allSessionIds());
    },

    fetch: function() {
      var viewport = map.viewport();
      var data = params.get('data');
      var sessionIds = _.values(params.get('sessionsIds') || [])
      var self = this;
      if(!data.time) {
        return;
      }
      var reqData = {
        time_from: data.time.timeFrom - utils.timeOffset,
        time_to:  data.time.timeTo - utils.timeOffset,
        day_from:  data.time.dayFrom,
        day_to:  data.time.dayTo,
        year_from:  data.time.yearFrom,
        year_to:  data.time.yearTo,
        tags:  data.tags,
        usernames:  data.usernames,
        session_ids: sessionIds
      };
      var location = data.location;
      if(location.limit){
        _(reqData).extend({
          west: viewport.west,
          east: viewport.east,
          south: viewport.south,
          north: viewport.north
        });
      }

      if(!location.limit && location.address) {
        _(reqData).extend({
          location:  location.address,
          distance:  location.distance
        });
      }
      if(sensors.selected()){
        _(reqData).extend({
          sensor_name:  sensors.selected().sensor_name,
          measurement_type:  sensors.selected().measurement_type,
          unit_symbol:  sensors.selected().unit_symbol,
        });
      }

      this.clear();
      this.sessions = [];
      spinner.startDownloadingSessions();

      sessionsDownloader('/api/sessions.json', reqData, this.sessions, params, _(this.onSessionsFetch).bind(this),
          _(this.onSessionsFetchError).bind(this));
    },

    onSessionsFetchError: function(data){
      spinner.stopDownloadingSessions();
      errorMsg = data.error || 'There was an error, sorry' ;
      flash.set(errorMsg);
    },

    onSessionsFetch: function(data, status, headers, config) {
      spinner.stopDownloadingSessions();
      this.reSelectAllSessions();
    },

    find: function(id) {
      return _(this.sessions || []).detect(function(session){
        return session.id === id;
      });
    },

    redraw: function() {
      var self = this;
      this.clear();
      _(this.allSelected()).each(_(this.draw).bind(this));
    },

    clear: function() {
      _(this.sessions).each(_(this.undoDraw).bind(this));
    },

    deselectSession: function(id) {
      var session = this.find(id);
      if(!session){
        return;
      }
      session.$selected = false;
      session.alreadySelected = false;
      this.undoDraw(session);
    },

    deselectAllSessions: function() {
      params.update({sessionsIds: []});
    },

    selectAllSessions: function() {
      params.update({sessionsIds: this.allSessionIds()});
    },

    selectSession: function(id) {
      var self = this;
      var session = this.find(id);
      if(!session || session.alreadySelected){
        return;
      }
      var sensorId = params.get("data", {}).sensorId || sensors.tmpSelectedId();
      var sensor = sensors.sensors[sensorId] || {};
      var sensorName = sensor.sensor_name;
      if (!sensorName) return;
      spinner.show();
      session.alreadySelected = true;
      session.$selected = true;
      $http.get('/api/sessions/' +  id,
          {cache : true,
           params: {sensor_id: sensorName
        }}).success(function(data, status, headers, config){
        self.onSingleSessionFetch(session, data);
      });
    },

    reSelectAllSessions: function(){
      var self = this;
      _(params.get('sessionsIds')).each(function(id){
        self.selectSession(id);
      });
    },

    isSelected: function(session) {
      return _(this.allSelected()).include(session);
    },

    allSelected: function(){
      var self = this;
      return _(this.allSelectedIds()).chain().map(function(id){
        return self.find(id);
      }).compact().value();
    },

    allSelectedIds: function() {
      return params.get('sessionsIds');
    },

    measurementsCount: function(session) {
      return session.streams[sensors.selected().sensor_name].measurements_count;
    },

    totalMeasurementsSelectedCount: function() {
      var self = this;
      return _(this.allSelected()).reduce(function(memo, session){
        return memo + self.measurementsCount(session);
      }, 0);
    },

    totalMeasurementsCount: function() {
      var self = this;
      return _(this.get()).reduce(function(memo, session){
        return memo + self.measurementsCount(session);
      }, 0);
    },

    measurementsForSensor: function(session, sensor_name){
      if (!session.streams[sensor_name]) { return empty.array; }
      return session.streams[sensor_name].measurements;
    },

    measurements: function(session){
      if (!session) { return empty.array; }
      if (!sensors.anySelected()) { return empty.array; }
      return this.measurementsForSensor(session, sensors.anySelected().sensor_name);
    },

    allStreams: function(sensor_name){
      var self = this;
      return _(this.allSelected()).map(function(session){
        return session.streams[sensor_name];
      });
    },

    onSingleSessionFetch: function(session, data) {
      var streams = data.streams;
      delete data.streams;
      _(session).extend(data);
      _(session.streams).extend(streams);
      session.loaded = true;
      this.draw(session);
      $timeout(function(){
        spinner.hide();
      });
    },

    draw: function(session) {
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
        if(level){
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
      map.appendViewport(this.getBounds());
    },

    undoDraw: function(session, noMove) {
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
        map.appendViewport(this.getBounds());
      }
    },

    getBounds: function() {
      var north,  east, south, west, lat, lng;
      var maxLat = [], minLat = [], maxLong = [], minLong = [];
      var self = this;
      var sensor = sensors.anySelected();
      if(!sensor) {
       return;
      }
      var streams = this.allStreams(sensor.sensor_name);

      if(!_.isEmpty(streams)){
        _(streams).each(function(s){
          maxLat.push(s.max_latitude);
          minLat.push(s.min_latitude);
          maxLong.push(s.max_longitude);
          minLong.push(s.min_longitude);
        });

        north = Math.max.apply(null, maxLat);
        south = Math.min.apply(null, minLat);
        west = Math.min.apply(null, minLong);
        east = Math.max.apply(null, maxLong);
      }

      if(!north){
        return;
      }
      return {north: north, east: east, south : south, west: west};
     }
  };
  return new MobileSessions();
}]);
