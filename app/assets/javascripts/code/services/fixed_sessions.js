angular.module("aircasting").factory('fixedSessions',
       ['params', '$http', 'map', 'note', 'sensors', '$rootScope', 'heat',
       'spinner',  'utils', "$timeout", 'flash', 'sessionsDownloader',
       'sessionsExporter', 'drawSession', 'boundsCalculator', 'markersClusterer', 'markerSelected',
        function(params, $http, map, note, sensors, $rootScope, heat, spinner,
          utils, $timeout, flash, sessionsDownloader, sessionsExporter, drawSession,
          boundsCalculator, markersClusterer, markerSelected) {
  var FixedSessions = function() {
    this.sessions = [];
    this.scope = $rootScope.$new();
    this.scope.params = params;
    this.scope.canNotSelectSessionWithSensorSelected = "You can't select multiple fixed-location sessions";
    this.scope.canNotSelectSessionWithoutSensorSelected = "You can't select multiple fixed-location sessions";
  };

  FixedSessions.prototype = {
    sessionsChanged: function (newIds, oldIds) {
      _(newIds).chain().difference(oldIds).each(_(this.selectSession).bind(this));
      _(oldIds).chain().difference(newIds).each(_(this.deselectSession).bind(this));
    },

    get: function(){
      return _.uniq(this.sessions, 'id');
    },

    allSessionIds: function() {
      return _(this.get()).pluck("id");
    },

    noOfSelectedSessions: function() {
      return this.allSelected().length;
    },

    canSelectThatSession: function() {
      return this.empty();
    },

    canSelectAllSessions: function() {
      return false;
    },

    empty: function() {
      return this.noOfSelectedSessions() === 0;
    },

    export: function() {
      sessionsExporter(this.allSessionIds());
    },

    fetch: function(page) {
      var viewport = map.viewport();
      var data = params.get('data');
      var sessionIds = _.values(params.get('sessionsIds') || []);
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
        session_ids: sessionIds,
        page_size: 1000
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

      if(location.outdoorOnly){
        _(reqData).extend({
          is_indoor: false
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

      _(params).extend({page: page});

      drawSession.clear(this.sessions);

      if (page === 0) {
        this.sessions = [];
        this.downloadSessions('/api/realtime/multiple_sessions.json', reqData);
      }

      spinner.startDownloadingSessions();

      if (data.location.streaming) {
        this.downloadSessions('/api/realtime/streaming_sessions.json', reqData);
      } else {
        this.downloadSessions('/api/realtime/sessions.json', reqData);
      }
    },

    downloadSessions: function(url, reqData) {
      sessionsDownloader(url, reqData, this.sessions, params, _(this.onSessionsFetch).bind(this),
        _(this.onSessionsFetchError).bind(this));
    },

    drawSessionsInLocation: function() {
      map.markers = [];
      markersClusterer.clear();
      _(this.get()).each(function(session) {
        drawSession.drawFixedSession(session, boundsCalculator(this.sessions.get()));
      });
      markersClusterer.draw(map.get(), map.markers);
    },

    onSessionsFetch: function() {
      this.drawSessionsInLocation();
      this.reSelectAllSessions();
      spinner.stopDownloadingSessions();
    },

    onSessionsFetchError: function(data){
      spinner.stopDownloadingSessions();
      var errorMsg = data.error || 'There was an error, sorry' ;
      flash.set(errorMsg);
    },

    find: function(id) {
      return _(this.sessions || []).detect(function(session){
        return session.id === id;
      });
    },

    deselectSession: function(id) {
      var session = this.find(id);
      if(!session){
        return;
      }
      session.loaded = false;
      session.$selected = false;
      session.hasBeenDrawn = false;
    },

    deselectAllSessions: function() {
      params.update({sessionsIds: []});
    },

    selectAllSessions: function() {
      params.update({sessionsIds: this.allSessionIds()});
    },

    selectSession: function(id) {
      var session = this.find(id);
      if(!session || session.hasBeenDrawn) return;

      var sensorId = params.get("data", {}).sensorId || sensors.tmpSelectedId();
      var sensor = sensors.sensors[sensorId] || {};
      var sensorName = sensor.sensor_name;
      if (!sensorName) return;
      spinner.show();
      session.hasBeenDrawn = true;
      session.$selected = true;
      var self = this;
      $http.get('/api/realtime/sessions/' +  id,
          {cache : true,
           params: {sensor_id: sensorName
        }}).success(function(data){
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

    allStreamsWithLocation: function(sensor_name){
      var self = this;
      return _(this.allSelected()).chain().map(function(session){
        if (session.is_indoor == true)
          return null;
        else
          return session.streams[sensor_name];
      }).compact().value();
    },

    onSingleSessionFetch: function(session, data) {
      var streams = data.streams;
      delete data.streams;
      _(session).extend(data);
      _(session.streams).extend(streams);
      session.loaded = true;
      if (!markerSelected.get() && !session.is_indoor) {
        map.appendViewport(boundsCalculator(this.allSelected()));
      }
      $timeout(function(){
        spinner.hide();
      });
    }
  };
  return new FixedSessions();
}]);
