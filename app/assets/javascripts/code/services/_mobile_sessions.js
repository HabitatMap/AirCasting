import _ from 'underscore';
import { debounce } from 'debounce';
import constants from '../constants';
import * as Session from '../values/session'

export const mobileSessions = (
  params,
  $http,
  map,
  sensors,
  $rootScope,
  utils,
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
        drawSession.clearOtherSessions(this.sessions, session);
        prevMapPosition = {
          bounds: map.getBounds(),
          zoom: map.getZoom()
        };
        const draw = () => drawSession.drawMobileSession(session);
        map.fitBounds(boundsCalculator(allSelected));
        sessionsUtils.onSingleSessionFetch(session, data, draw);
      }
      this._selectSession(id, callback);
    },

    reSelectSession: function(id) {
      // I think this is never used since we blocked the button to select all sessions
      drawSession.clear(this.sessions);
      const callback = (session, allSelected) => (data) => {
        const draw = () => drawSession.drawMobileSession(session);
        sessionsUtils.onSingleSessionFetch(session, data, draw);
      }
      this._selectSession(id, callback);
    },

    drawSessionsInLocation: function() {
      map.markers = [];
      if(sensors.anySelected()) {
        const sensorId = sensors.selectedId() || sensors.tmpSelectedId();
        const sensor = sensors.sensors[sensorId] || {};
        const selectedSensor = sensor.sensor_name;
        (this.get()).forEach(session => this.drawSessionInLocation(session, selectedSensor));
      }
    },

    drawSessionInLocation: function(session, selectedSensor) {
      session.markers = [];
      drawSession.undoDraw(session);

      const content = Session.averageVauleAndUnit(session, selectedSensor);
      const heatLevel = heat.levelName(Session.average(session));
      const latLng = new google.maps.LatLng(Session.startingLat(session, selectedSensor), Session.startingLng(session, selectedSensor));

      if (!heat.outsideOfScope()) {
        const popup = map.drawCustomMarker({
            latLng: latLng,
            content: content,
            colorClass: heatLevel,
            clicableObject: session.id
          });
        session.markers.push(popup);
      }
      session.drawed = true;
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
      if (!data.time) return;
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
