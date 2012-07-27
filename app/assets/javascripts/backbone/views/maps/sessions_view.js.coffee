###
# AirCasting - Share your Air!
# Copyright (C) 2011-2012 HabitatMap, Inc.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
# You can contact the authors by email at <info@habitatmap.org>
###
AirCasting.Views.Maps ||= {}

class AirCasting.Views.Maps.SessionsView extends AirCasting.Views.Maps.FilteredMapView
  template: JST["backbone/templates/maps/sessions"]
  sensor_template: JST["backbone/templates/maps/sensor_item"]

  events: _({
    'click #toggle-all-sessions': 'toggleAllSessions'
    'click #limit-to-viewport': 'updateLocationDisabled'
    'change #sensor': 'selectSensor'
  }).extend(AirCasting.Views.Maps.FilteredMapView.prototype.events)

  initialize: (options) ->
    super options
    @sessions = new AirCasting.Collections.SessionsCollection()
    @sessions.bind("reset", @pulseSessions)
    @sessions.bind("reset", -> AC.util.spinner.stopTask())

    $(window).resize(@resizeSessions)

    @allSensor = new AirCasting.Models.Sensor(sensor_name: "All", measurement_type: "All")
    if options.mapState.sessions?
      sensorFromParams = new AirCasting.Models.Sensor(options.mapState.sessions.selectedSensor)
      if options.mapState.sessions.usedAllSensor
        @selectedSensor = @allSensor
        @sensorFromParams = sensorFromParams
      else
        @selectedSensor = @sensorFromParams = sensorFromParams
    
    @selectedSensor ||= @allSensor
    @sensors = new AirCasting.Collections.SensorCollection()

    @sensors.fetch()
    @sensors.bind("reset", => @populateSensors())

    @includeSessionId = options.includeSessionId || ''

    google.maps.event.addListenerOnce @googleMap.map, "idle", => @refilterViewport()

  limitToViewport: ->  @$("#limit-to-viewport").is(":checked")

  refilterViewport: -> @refilter() if @limitToViewport()

  populateSensors: ->
    sensorSelector = $(@el).find("#sensor")
    sensorSelector.children().remove()

    @selectedSensor ||= @allSensor 

    rendered = @sensor_template(sensor: @allSensor, selected: @selectedSensor.matches(@allSensor))
    sensorSelector.append(rendered)
    @sensors.each (sensor) =>
      rendered = @sensor_template(sensor: sensor, selected: @selectedSensor.matches(sensor))
      sensorSelector.append(rendered)

  getThresholds: ->
    standardThresholds = AC.G.getThresholds(@heatLegendSensor)
    if standardThresholds
      return standardThresholds
    sessions = _(@sessionListView.selectedSessions).values()
    if sessions.length > 0
      AC.G.thresholdsObjToArray(sessions[0].get("streams")[@heatLegendSensor.get("sensor_name")])
    else
      AC.G.thresholdsModelToArray(@heatLegendSensor)

  isAllSensor: () ->
    @selectedSensor.cid == @allSensor.cid

  selectSensor: (evt) ->
    @sessionListView.reset()
    cid = $(@el).find("#sensor :selected").attr("value")
    if(@allSensor.cid == cid)
      @selectedSensor = @allSensor
    else
      @selectedSensor = @sensors.getByCid cid
    @render()
    @heatLegendSensor = @selectedSensor
    @initializeHeatLegend(false)

  setHeatLegendSensor: (sensor) ->
    @heatLegendSensor = sensor
    @updateLegendDisplay()

  permalinkData: ->
    _(super()).extend {
      sessions:
        selectedSensor: @sessionListView.sensorUsed().toParams()
        usedAllSensor: @isAllSensor()
        location:
          text: @$("#location").val() unless @limitToViewport()
          distance: @$("#distance").val() unless @limitToViewport()
          limitToViewport: @limitToViewport()
        selectedIds:
          parseInt(id) for id, session of @sessionListView.selectedSessions
    }

  resetLocation: ->
    super()
    @updateLocationDisabled()

  updateLocationDisabled: ->
    @$("#location").attr("disabled", @limitToViewport())
    @$("#distance").attr("disabled", @limitToViewport())

  resizeSessions: ->
    height = Math.max(window.innerHeight - 300, 100)
    $(".sessions-container").css({height: height})

  pulseSessions: ->
    $("section.sessions").css({opacity: 1})
    $("section.sessions").pulse({opacity: 0.65}, 350, 2)

  render: ->
    super()

    data = @options.mapState.sessions
    @$("#location").val(data?.location.text)
    @$("#distance").val(data?.location.distance || 10)
    @$("#limit-to-viewport").attr("checked", !!data?.location.limitToViewport)
    @updateLocationDisabled()

    @resizeSessions()
    @sessionListView = new AirCasting.Views.Maps.SessionListView(
      el: $('#session-list'),
      collection: @sessions,
      selectedSensor: @selectedSensor,
      viewSensor: @sensorFromParams,
      googleMap: @googleMap
      selectedIds: @options.mapState.sessions?.selectedIds || []
      parent: this
    ).render()
    if @sensorFromParams
      @updateLegendDisplay()
    @fetch()
    @populateSensors()

    this

  activate: (options) ->
    @draw(options?.selectedSessionId)

  deactivate: ->
    @clear()

  resetSessions: (skipRefilter) ->
    @sessionListView.reset()

  toggleAllSessions: (skipRefilter) ->
    @sessionListView.toggleAll()

  clearSelectedSessions: ->
    @sessionListView.clearSelectedSessions()

  fetch: ->
    tags = @$('#tags').val()
    usernames = @$('#usernames').val()
    location = if @limitToViewport() then "" else @$('#location').val()
    distance = if @limitToViewport() then 0  else @$('#distance').val()
    viewport = AC.util.viewport(@googleMap) if @limitToViewport()
    @sessions.setUrlParams(@timeFrom, @timeTo, @dayFrom, @dayTo, @includeSessionId, tags, usernames, location, distance, viewport)

    AC.util.spinner.startTask()
    @sessions.fetch()

  heatLegendUpdated: ->
    if @sessionListView
      @sessionListView.clear()
      @sessionListView.draw()

  clear: ->
    @sessionListView.clear()

  draw: (selectedSessionId) ->
    if selectedSessionId
      @sessionListView.fetchData(selectedSessionId, true, (data) =>
        @sessionListView.selectSessionByToken(data)
        @sessionListView.render()
        @sessionListView.adjustViewport()
        $(@sessionListView.el).parent().scrollTop(
          $(@sessionListView.el).find(':checked').parents('li').position().top -
            $(@sessionListView.el).position().top
        )
      )
