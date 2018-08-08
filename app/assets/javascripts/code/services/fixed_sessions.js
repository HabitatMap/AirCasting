angular.module("aircasting").factory('fixedSessions', [
  'params',
  '$http',
  'map',
  'sensors',
  '$rootScope',
  'spinner',
  'utils',
  'sessionsDownloader',
  'drawSession',
  'boundsCalculator',
  'markersClusterer',
  'markerSelected',
  'sessionsUtils',
  function(
    params,
    $http,
    map,
    sensors,
    $rootScope,
    spinner,
    utils,
    sessionsDownloader,
    drawSession,
    boundsCalculator,
    markersClusterer,
    markerSelected,
    sessionsUtils
  ) {
    var FixedSessions = function() {
      this.sessions = [];
      this.scope = $rootScope.$new();
      this.scope.params = params;
      this.scope.canNotSelectSessionWithSensorSelected = "You can't select multiple fixed-location sessions";
      this.scope.canNotSelectSessionWithoutSensorSelected = "You can't select multiple fixed-location sessions";
    };

    FixedSessions.prototype = {
      allSelected: function() { return sessionsUtils.allSelected(this); },

      allSelectedIds: function() { return sessionsUtils.allSelectedIds(); },

      allSessionIds: function() { return sessionsUtils.allSessionIds(this) },

      deselectAllSessions: function() { sessionsUtils.deselectAllSessions(); },

      empty: function() { return sessionsUtils.empty(this); },

      export: function() { sessionsUtils.export(this); },

      find: function(id) { return sessionsUtils.find(this, id); },

      get: function(){ return sessionsUtils.get(this); },

      isSelected: function(session) { return sessionsUtils.isSelected(this, session); },

      measurementsCount: function(session) { return sessionsUtils.measurementsCount(session); },

      noOfSelectedSessions : function() { return sessionsUtils.noOfSelectedSessions(this); },

      onSessionsFetchError: function(data){ sessionsUtils.onSessionsFetchError(data); },

      reSelectAllSessions: function() { sessionsUtils.reSelectAllSessions(this); },

      selectAllSessions: function() { sessionsUtils.selectAllSessions(this); },

      sessionsChanged: function (newIds, oldIds) { sessionsUtils.sessionsChanged(this, newIds, oldIds); },

      totalMeasurementsCount: function() { return sessionsUtils.totalMeasurementsCount(this); },

      totalMeasurementsSelectedCount: function() { return sessionsUtils.totalMeasurementsSelectedCount(this); },



      canSelectThatSession: function() { return this.empty(); },

      canSelectAllSessions: function() { return false; },

      onSessionsFetch: function() {
        this.drawSessionsInLocation();
        sessionsUtils.onSessionsFetch(this);
      },

      deselectSession: function(id) {
        var session = this.find(id);
        if(!session) return;
        session.loaded = false;
        session.$selected = false;
        session.alreadySelected = false;
      },

      selectSession: function(id) {
        const session = this.find(id);
        const allSelected = this.allSelected();
        const fitBounds = () => {
          if (!markerSelected.get() && !session.is_indoor) {
            map.fitBounds(boundsCalculator(allSelected));
          }
        };
        this._selectSession(id, fitBounds);
      },

      reSelectSession: function(id) {
        const noop = () => {};
        this._selectSession(id, noop);
      },

      _selectSession: function(id, callback) {
        var self = this;
        var session = this.find(id);
        if(!session || session.alreadySelected) return;
        var sensorId = params.get("data", {}).sensorId || sensors.tmpSelectedId();
        var sensor = sensors.sensors[sensorId] || {};
        var sensorName = sensor.sensor_name;
        if (!sensorName) return;
        spinner.show();
        session.alreadySelected = true;
        session.$selected = true;
        $http.get('/api/realtime/sessions/' + id, {
          cache : true,
          params: { sensor_id: sensorName }
        }).success(function(data){
          sessionsUtils.onSingleSessionFetch(session, data, callback);
        });
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

      downloadSessions: function(url, reqData) {
        sessionsDownloader(url, reqData, this.sessions, params, _(this.onSessionsFetch).bind(this),
          _(this.onSessionsFetchError).bind(this));
      },

      drawSessionsInLocation: function() {
        map.markers = [];
        markersClusterer.clear();
        _(this.get()).each(session => drawSession.drawFixedSession(session, boundsCalculator(this.sessions)));
        markersClusterer.draw(map.get(), map.markers);
      },

      shouldUpdateWithMapPanOrZoom: function() {
        return true;
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
          session_ids: sessionIds
        };

        if(data.location.outdoorOnly){
          _(reqData).extend({
            is_indoor: false
          });
        }

        if(data.location.address) {
          _(reqData).extend({
            location:  data.location.address,
            distance:  data.location.distance
          });
        } else {
          _(reqData).extend({
            west: viewport.west,
            east: viewport.east,
            south: viewport.south,
            north: viewport.north
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
      }
    };
    return new FixedSessions();
  }]);
