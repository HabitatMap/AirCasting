import _ from 'underscore';
import { debounce } from 'debounce';
import constants from '../constants';
import * as Session from '../values/session'
import { clusterer } from '../clusterer'

export const mobileSessions = (
  params,
  $http,
  map,
  sensors,
  $rootScope,
  sessionsDownloader,
  drawSession,
  boundsCalculator,
  sessionsUtils,
  $location,
  storage,
  heat
) => {
  var MobileSessions = function() {
    this.sessions = [];
    this.scope = $rootScope.$new();
    this.scope.params = params;
  };

  let prevMapPosition = {
    bounds: map.getBounds(),
    zoom: map.getZoom()
  };

  MobileSessions.prototype = {
    sessionIds: function() {
      return this.sessions.map(x => x.id);
    },
    hasSelectedSessions: function() {
      return this.noOfSelectedSessions() > 0;
    },

    allSelected: function() { return sessionsUtils.allSelected(this); },

    allSelectedIds: function() { return sessionsUtils.allSelectedIds(); },

    allSessionIds: function() { return sessionsUtils.allSessionIds(this) },

    deselectAllSessions: function() { sessionsUtils.deselectAllSessions(); },

    export: function() { sessionsUtils.export(this); },

    find: function(id) { return sessionsUtils.find(this, id); },

    get: function(){ return sessionsUtils.get(this); },

    isSelected: function(session) { return sessionsUtils.isSelected(this, session); },

    noOfSelectedSessions : function() { return sessionsUtils.noOfSelectedSessions(this); },

    onSessionsFetchError: function(data){ sessionsUtils.onSessionsFetchError(data); },

    reSelectAllSessions: function(){ sessionsUtils.reSelectAllSessions(this); },

    selectAllSessions: function() { sessionsUtils.selectAllSessions(this); },

    sessionsChanged: function (newIds, oldIds) { sessionsUtils.sessionsChanged(this, newIds, oldIds); },


    onSessionsFetch: function() {
      if (!storage.isCrowdMapLayerOn()) {
        this.drawSessionsInLocation();
      };
      sessionsUtils.onSessionsFetch(this);
    },

    onSessionsFetchWithCrowdMapLayerUpdate: function() {
      this.onSessionsFetch();
      sessionsUtils.updateCrowdMapLayer(this.sessionIds());
    },

    deselectSession: function(id) {
      const session = this.find(id);
      if (!session) return;
      session.loaded = false;
      session.$selected = false;
      session.alreadySelected = false;
      drawSession.undoDraw(session, prevMapPosition);
    },

    selectSession: function(id) {
      const callback = (session, allSelected) => (data) => {
        drawSession.clear(this.sessions);
        prevMapPosition = {
          bounds: map.getBounds(),
          zoom: map.getZoom()
        };
        const drawSessionStartingMarker = (session, sensorName) => this.drawSessionWithLabel(session, sensorName);
        const draw = () => drawSession.drawMobileSession(session, drawSessionStartingMarker);
        map.fitBounds(boundsCalculator(allSelected));
        sessionsUtils.onSingleSessionFetch(session, data, draw);
      }
      this._selectSession(id, callback);
    },

    reSelectSession: function(id) {
      // this is called when refreshing a page with selected session
      drawSession.clear(this.sessions);
      setTimeout(() => {
        const callback = (session, allSelected) => (data) => {
          const drawSessionStartingMarker = (session, sensorName) => this.drawSessionWithLabel(session, sensorName);
          const draw = () => drawSession.drawMobileSession(session, drawSessionStartingMarker);
          sessionsUtils.onSingleSessionFetch(session, data, draw);
        }
        this._selectSession(id, callback);
      }, 3000);
    },

    redrawSelectedSession: function(id) {
      const session = this.find(id);
      if (!session) return;

      const drawSessionStartingMarker = (session, sensorName) => this.drawSessionWithLabel(session, sensorName);

      drawSession.drawMobileSession(session, drawSessionStartingMarker);
    },

    drawSessionsInLocation: function() {
      if (!sensors.anySelected()) return;

      const sessions = this.get();
      const sessionsToCluster = []
      sessions.forEach((session) => {
        sessionsToCluster.push({
          latLng: Session.startingLatLng(session, sensors.selectedSensorName()),
          object: session
        });
      });

      const clusteredSessions = clusterer(sessionsToCluster, map);
      const lonelySessions = sessions.filter(isNotIn(clusteredSessions));

      clusteredSessions.forEach(session => {
        this.drawSessionWithoutLabel(session, sensors.selectedSensorName())
      });
      lonelySessions.forEach(session => {
        this.drawSessionWithLabel(session, sensors.selectedSensorName())
      });
    },

    drawSessionWithoutLabel: function(session, selectedSensor) {
      drawSession.undoDraw(session);
      session.markers = [];

      const heatLevel = heat.levelName(Session.roundedAverage(session, selectedSensor));
      const latLng = Session.startingLatLng(session, selectedSensor);
      const callback = (id) => () => $rootScope.$broadcast('markerSelected', {session_id: id});

      const marker = map.drawCustomMarker({
          latLng: latLng,
          colorClass: heatLevel,
          callback: callback(Session.id(session)),
          type: 'marker'
        });
      session.markers.push(marker);
    },

    drawSessionWithLabel: function(session, selectedSensor) {
      drawSession.undoDraw(session);
      session.markers = [];

      const content = Session.averageValueAndUnit(session, selectedSensor);
      const heatLevel = heat.levelName(Session.roundedAverage(session, selectedSensor));
      const latLng = Session.startingLatLng(session, selectedSensor);
      const callback = (id) => () => $rootScope.$broadcast('markerSelected', {session_id: id});

      const marker = map.drawCustomMarker({
          latLng: latLng,
          content: content,
          colorClass: heatLevel,
          callback: callback(Session.id(session)),
          type: 'data-marker'
        });
      session.markers.push(marker);
    },

    _selectSession: function(id, callback) {
      const allSelected = this.allSelected();
      var session = this.find(id);
      if(!session || session.alreadySelected) return;
      var sensorId = sensors.selectedId() || sensors.tmpSelectedId();
      var sensor = sensors.sensors[sensorId] || {};
      var sensorName = sensor.sensor_name;
      if (!sensorName) return;
      session.alreadySelected = true;
      session.$selected = true;
      $http.get('/api/sessions/' + id, {
        cache : true,
        params: { sensor_id: sensorName }
      }).success(callback(session, allSelected));
    },

    _fetch: function(page) {
      // if _fetch is called after the route has changed (eg debounced)
      if ($location.path() !== constants.mobileMapRoute) return;

      var bounds = map.getBounds();
      var data = params.get('data');
      var sessionIds = _.values(params.get('selectedSessionIds') || []);
      if (!data.timeFrom || !data.timeTo) return;
      var reqData = {
        time_from:  data.timeFrom,
        time_to:  data.timeTo,
        tags:  data.tags,
        usernames:  data.usernames,
        session_ids: sessionIds
      };

      _(reqData).extend({
        west: bounds.west,
        east: bounds.east,
        south: bounds.south,
        north: bounds.north
      });

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
        // seems to be called for selected sessions; thus, only when loading the app with selections in the url
        sessionsDownloader('/api/multiple_sessions.json', reqData, this.sessions, params, _(this.onSessionsFetch).bind(this),
          _(this.onSessionsFetchError).bind(this));
      }

      sessionsDownloader('/api/sessions.json', reqData, this.sessions, params, _(this.onSessionsFetchWithCrowdMapLayerUpdate).bind(this),
        _(this.onSessionsFetchError).bind(this));

    },

    fetch: debounce(function(page) { this._fetch(page) }, 750)
  };
  return new MobileSessions();
}

const isNotIn = arr => x => !(arr.includes(x))
