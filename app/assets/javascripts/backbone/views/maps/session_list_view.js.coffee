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
  initialize: (options) ->
    super(options)
    @googleMap = options.googleMap
    @collection.bind('reset', @render.bind(this))
    @selectedSessions = {}
    @downloadedData = {}
    @markers = []
    @notes = []
    @fetchingData = 0

    @infoWindow = new google.maps.InfoWindow()
    google.maps.event.addListener(@infoWindow, "domready", =>
      $(".lightbox").lightBox()
      $(".prev-note").unbind("click")
      $(".next-note").unbind("click")
      $(".prev-note").click( => @prevNote())
      $(".next-note").click( => @nextNote())
    )

  render: ->
    $(@el).empty()

    @collection.each (session) =>
      itemView = new AirCasting.Views.Maps.SessionListItemView(
        model: session,
        parent: this,
        selected: @selectedSessions[session.get('id')]?
      )
      $(@el).append itemView.render().el

    this

  onChildSelected: (childView, selected) ->
    sessionId = childView.model.get('id')

    if selected && @sumOfSelected() > 5000
      @tooManySessions()
      childView.unselect()
    else if selected
      @selectedSessions[sessionId] = childView.model
      if @downloadedData[sessionId]
        @drawSession(sessionId)
      else
        @fetchData(sessionId)
    else
      delete @selectedSessions[sessionId]
      @hideSession(sessionId)
    @updateToggleAll()

  sumOfSelected: ->
    sessions = (session for key, session of @selectedSessions)
    @sumOfSizes(sessions)

  hideSession: (sessionId) ->
    for marker in @markers when marker.sessionId == sessionId
      marker.setMap(null)

    oldNotes = @notes
    @notes = []
    for note in oldNotes when note.sessionId == sessionId
      note.setMap(null)
    for note in oldNotes when note.sessionId != sessionId
      @notes.push(note)

  fetchData: (sessionId, callback) ->
    AC.util.spinner.startTask()

    $.getJSON "/api/sessions/#{sessionId}", (data) =>
      @downloadedData[sessionId] = data
      if @selectedSessions[sessionId]
        @drawSession(sessionId)

      AC.util.spinner.stopTask()

  selectSessionByToken: (data) ->
    @selectedSessions[data.id] = new AirCasting.Models.Session(data)

  reset: ->
    @$(':checkbox').attr('checked', null)
    @$(':checkbox').trigger('change')
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
    if size > 5000
      @tooManySessions()
    else
      @$(':checkbox').attr('checked', true)
      @$(':checkbox').trigger('change')

  tooManySessions: ->
    AC.util.notice("You are trying to select too many sessions")

  sumOfSizes: (sessions) ->
    sum = (acc, session) -> acc + session.size()
    sessions.reduce(sum, 0)

  updateToggleAll: ->
    if @noneSelected()
      $("#toggle-all-sessions").text("all")
    else
      $("#toggle-all-sessions").text("none")

  clear: ->
    for marker in @markers
      marker.setMap null
    @markers.length = 0
    @notes.length = []

  adjustViewport: ->
    north = undefined
    east = undefined
    south = undefined
    west = undefined

    for id, session of @selectedSessions when session and @downloadedData[id]
      for m in @downloadedData[id].measurements
        lat = parseFloat(m.latitude)
        lng = parseFloat(m.longitude)

        north = lat if !north or lat > north
        east = lng if !east or lng > east
        south = lat if !south or lat < south
        west = lng if !west or lng < west

    if north and east
      @googleMap.adjustViewport(north, east, south, west)

  draw: ->
    @adjustViewport()
    for id, session of @selectedSessions when session and @downloadedData[id]
      @drawSession(id)

  drawSession: (id) ->
    AC.util.spinner.startTask()

    session = @selectedSessions[id]
    for element in @downloadedData[id].measurements || []
      @drawMeasurement(session, element)
    for note in @downloadedData[id].notes || []
      @drawNote(session, note)
    @adjustViewport()

    AC.util.spinner.stopTask()

  drawMeasurement: (session, element) ->
    icon = AC.util.dbToIcon(session.get('calibration'), session.get('offset_60_db'), element.value)

    if icon
      markerOptions =
        map: @googleMap.map
        position: new google.maps.LatLng(element.latitude, element.longitude)
        title: '' + parseInt(AC.util.calibrateValue(session.get('calibration'), session.get('offset_60_db'), element.value)) + ' dB'
        icon: icon
        flat: true
        zIndex: 1

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
      zIndex: 2

    marker = new google.maps.Marker
    marker.setOptions(markerOptions)
    marker.sessionId = session.get('id')

    @notes.push({note: note, marker: marker})
    noteNumber = @notes.length - 1
    google.maps.event.addListener(marker, 'click', => @displayNote(session, noteNumber))

    @markers.push marker

  displayNote: (session, noteNumber) ->
    note = @notes[noteNumber].note
    marker = @notes[noteNumber].marker
    timezone = session.get('timezone_offset')

    @currentNote = noteNumber
    content = JST["backbone/templates/maps/note"]
    rendered = content({note: note, timezoneOffset: timezone, noteNumber: noteNumber, notesLength: @notes.length})
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
