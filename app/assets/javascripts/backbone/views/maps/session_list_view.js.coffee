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

class AirCasting.Views.Maps.SessionListView extends Backbone.View
  MAX_POINTS = 30000

  stream_option: JST["backbone/templates/maps/sensor_item"]

  initialize: (options) ->
    super(options)
    @googleMap = options.googleMap
    @collection.bind('reset', @render.bind(this))
    @selectedSessions = {}
    @downloadedData = {}
    @markers = []
    @notes = []
    @lines = []
    @fetchingData = 0
    @selectedSensor = options.selectedSensor
    @parent = options.parent

    @infoWindow = new google.maps.InfoWindow()
    google.maps.event.addListener(@infoWindow, "domready", =>
      $(".lightbox").lightBox()
      $(".prev-note").unbind("click")
      $(".next-note").unbind("click")
      $(".prev-note").click( => @prevNote())
      $(".next-note").click( => @nextNote())
    )

    @graphView = new AirCasting.Views.Maps.GraphView(el: $("section.graph"), googleMap: @googleMap, parent: this)

  sensorFiltered: ->
    @selectedSensor || @parent.allSensor

  sensorUsed: ->
    @viewSensor || @selectedSensor

  getThresholds: -> 
    @parent.getThresholds()

  render: ->
    $(@el).empty()

    @itemViews = {}

    filtered = @collection.filterBySensor(@sensorFiltered())
    filtered.each (session) =>
      id = session.get("id")
      if id in @options.selectedIds
        @selectedSessions[id] = session
        @fetchData(id, true)

      itemView = new AirCasting.Views.Maps.SessionListItemView(
        model: session,
        parent: this,
        selected: @selectedSessions[id]?
      )
      @itemViews[id] = itemView
      $(@el).append itemView.render().el

    @updateToggleAll()
    @options.selectedIds = _.filter(@options.selectedIds, (x) => !@selectedSessions[x])

    this

  onChildSelected: (childView, selected) ->
    session = childView.model
    sessionId = session.get('id')

    if @numberOfSelectedSessions() != 1
      @graphView.disableGraph()

    if selected && @numberOfSelectedSessions() == 0
      @selectSensor(session)
      @selectedSessions[sessionId] = childView.model
      if !@downloadedData[sessionId]
        @fetchData(sessionId, @sensorFiltered() != @parent.allSensor)
    else if selected && @sumOfSelected() > MAX_POINTS
      @undoSelection(childView, "You are trying to select too many sessions")
    else if selected && @numberOfSelectedSessions() > 0 && @sensorFiltered() == @parent.allSensor
      @undoSelection(childView, "Filter by sensor to view many sessions at once")
    else if selected
      @selectedSessions[sessionId] = childView.model
      @fetchAndDraw(sessionId)
    else
      @hideSession(sessionId)

    @updateToggleAll()

  undoSelection: (childView, reason) ->
    childView.unselect()
    AC.util.notice(reason)

  sensor: (stream) ->
    sensor = new AirCasting.Models.Sensor(measurement_type: stream.measurement_type, sensor_name: stream.sensor_name)
    attrs = {}
    _(window.AirCasting.G.names).each (name) ->
      attrs[name] = stream[name]
    sensor.set attrs
    sensor.set unit_symbol: stream.unit_symbol
    sensor

  useSensor: (sensor) ->
    @viewSensor = sensor
    @parent.heatLegendSensor = sensor
    @parent.initializeHeatLegend()

  selectSensor: (session) ->
    streams = session.get("streams")
    if @sensorFiltered() != @parent.allSensor
      @useSensor(@sensorFiltered())
      @fetchAndDraw(session.get('id'))
    else if streams.length == 1
      @useSensor(@sensor(_.first(streams)))
      @fetchAndDraw(session.get('id'))
    else
      @displaySensorDialog(session)

  displaySensorDialog: (session) ->
    content = $('<div><p>Select sensor stream to display</p><select id="sensors"></select></div>')

    sensors = new AirCasting.Collections.SensorCollection()
    sensors.add(@sensor(stream)) for stream in session.getStreams()

    sensors.each (sensor) =>
      rendered = @stream_option(sensor: sensor, selected: false)
      content.find("#sensors").append(rendered)

    dialog = $(content).dialog(modal: true, title: "Select sensor", close: => @unselectSession(session.get('id')))
    dialog.dialog("option", "buttons", {
      "OK": =>
        cid = dialog.find(":selected").attr("value")
        @useSensor(sensors.getByCid(cid))

        dialog.dialog("destroy")

        @fetchAndDraw(session.get('id'))
    })

  unselectSession: (sessionId) ->
    delete @selectedSessions[sessionId]
    @itemViews[sessionId].unselect()

  fetchAndDraw: (sessionId) ->
    if @downloadedData[sessionId]
      @drawSession(sessionId)
      @adjustViewport()
    else
      @fetchData(sessionId, @sensorFiltered() != @parent.allSensor, => @adjustViewport())

  sumOfSelected: ->
    sessions = (session for key, session of @selectedSessions)
    @sumOfSizes(sessions)

  numberOfSelectedSessions: ->
    Object.keys(@selectedSessions).length

  hideSessions: () ->
    @hideSession(session) for session in @selectedSessions

  hideSession: (sessionId) ->
    delete @selectedSessions[sessionId]
    sessionLines = _(@lines).select (line) -> line.sessionId.toString() == sessionId.toString()
    sessionMarkers = _(@markers).select (marker) -> marker.sessionId.toString() == sessionId.toString()
    for line in sessionLines 
      line.setMap(null)
    for marker in sessionMarkers
      marker.setMap(null)

    @lines = _(@lines).without(sessionLines)
    @markers = _(@markers).without(sessionMarkers)

    oldNotes = @notes
    @notes = []
    for note in oldNotes
      if note.note.session_id == sessionId
        note.marker.setMap(null)
      else
        @notes.push(note)

    @adjustViewport()

  fetchData: (sessionId, withDraw, callback) ->
    AC.util.spinner.startTask()
    $.getJSON "/api/sessions/#{sessionId}", (data) =>
      @downloadedData[sessionId] = data
      callback(data) if callback

      if @selectedSessions[sessionId] && withDraw
        @drawSession(sessionId)
        @adjustViewport()
      AC.util.spinner.stopTask()

  selectSessionByToken: (sessionData) ->
    session = new AirCasting.Models.Session(sessionData)
    @selectedSessions[sessionData.id] = session
    @selectSensor(session)

  reset: ->
    @$(':checkbox').attr('checked', null).trigger('change')
    @selectedSessions = {}
    @clear()
    @draw()

  noneSelected: ->
    Object.keys(@selectedSessions).length == 0

  toggleAll: ->
    if @noneSelected()
      @selectAll()
    else
      @reset()
    @updateToggleAll()

  selectAll: ->
    size = @sumOfSizes(@collection)
    if size > MAX_POINTS
      @tooManySessions()
    else
      @$(':checkbox').attr('checked', true)
      @$(':checkbox').trigger('change')

  sumOfSizes: (sessions) ->
    sum = (acc, session) -> acc + session.size()
    sessions.reduce(sum, 0)

  updateToggleAll: ->
    if @noneSelected()
      $("#toggle-all-sessions").text("all")
    else
      $("#toggle-all-sessions").text("none")

  clear: ->
    marker.setMap(null) for marker in @markers
    line.setMap(null) for line in @lines
    @markers.length = 0
    @lines.length = 0
    @notes.length = 0

  adjustViewport: ->
    north = undefined
    east = undefined
    south = undefined
    west = undefined

    for id, session of @selectedSessions when session and @downloadedData[id]
      measurements = _(@downloadedData[id].streams).map((x) -> x.measurements)
      measurements = _(measurements).flatten()
      for m in measurements
        lat = parseFloat(m.latitude)
        lng = parseFloat(m.longitude)

        north = lat if !north or lat > north
        east = lng if !east or lng > east
        south = lat if !south or lat < south
        west = lng if !west or lng < west

    if north and east
      @googleMap.adjustViewport(north, east, south, west)

  draw: ->
    for id, session of @selectedSessions when session and @downloadedData[id]
      @drawSession(id)

  currentStream: (id) ->
    id ||= _.first(Object.keys(@selectedSessions))

    streams = @downloadedData[id].streams
    _(streams).find (stream) =>
      stream.measurement_type == @sensorUsed().get("measurement_type") &&
        stream.sensor_name == @sensorUsed().get("sensor_name")

  drawSession: (id) ->
    AC.util.spinner.startTask()

    session = @selectedSessions[id]
    measurements = @currentStream(id)?.measurements || []
    @drawTrace(id, measurements)

    for index in [0...measurements.length]
      element = measurements[index]
      @drawMeasurement(session, element, index)
    for note in @downloadedData[id].notes || []
      @drawNote(session, note)

    if @numberOfSelectedSessions() == 1
      @graphView.drawGraph()

    AC.util.spinner.stopTask()

  drawTrace: (sessionId, measurements) ->
    points = (new google.maps.LatLng(m.latitude, m.longitude) for m in measurements)

    lineOptions =
      map: @googleMap.map
      path: points
      strokeColor: "#007bf2"
      geodesic: true

    line = new google.maps.Polyline(lineOptions)
    line.sessionId = sessionId
    @lines.push(line)

  drawMeasurement: (session, element, zIndex) ->
    icon = AC.util.dbToIcon(@getThresholds(), element.value)

    if icon
      markerOptions =
        map: @googleMap.map
        position: new google.maps.LatLng(element.latitude, element.longitude)
        title: '' + parseInt(element.value) + ' ' + @currentStream().unit_symbol
        icon: icon
        flat: true
        zIndex: zIndex

      marker = new google.maps.Marker()
      marker.setOptions markerOptions
      marker.sessionId = session.get('id')
      @markers.push marker

  drawNote: (session, note) ->
    markerOptions =
      map: @googleMap.map
      position: new google.maps.LatLng(note.latitude, note.longitude)
      title: note.text
      icon: window.marker_note_path
      zIndex: 200000

    marker = new google.maps.Marker
    marker.setOptions(markerOptions)
    marker.sessionId = session.get('id')

    @notes.push({note: note, marker: marker})
    noteNumber = @notes.length - 1
    google.maps.event.addListener(marker, 'click', => @displayNote(noteNumber))

    @markers.push marker

  displayNote: (noteNumber) ->
    note = @notes[noteNumber].note
    marker = @notes[noteNumber].marker

    @currentNote = noteNumber
    content = JST["backbone/templates/maps/note"]
    rendered = content({note: note, noteNumber: noteNumber, notesLength: @notes.length})
    @infoWindow.setContent(rendered)

    @infoWindow.open(@googleMap.map, marker)

  prevNote: ->
    noteNumber = @currentNote - 1
    if noteNumber < 0
      noteNumber = @notes.length - 1
    @displayNote(noteNumber)

  nextNote: ->
    noteNumber = (@currentNote + 1) % @notes.length
    @displayNote(noteNumber)
