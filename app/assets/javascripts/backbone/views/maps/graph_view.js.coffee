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

class AirCasting.Views.Maps.GraphView extends Backbone.View
  events:
    'click #graph-arrow': 'toggleGraph'

  initialize: (options) ->
    super(options)
    @googleMap = options.googleMap
    @parent = options.parent

    $(window).resize(@resizeGraph)
    @resizeGraph()
    @disableGraph()

  drawGraph: ->
    [id, session] = _.first([id, session] for id, session of @parent.selectedSessions)
    measurements = @parent.downloadedData[id].measurements

    @graphAvailable = true
    @drawGraphBackground()

    calibrate = (value) -> AC.util.calibrateValue(session.get('calibration'), session.get('offset_60_db'), value)
    data = ([AC.util.parseTime(m.time).getTime(), calibrate(m.value)] for m in measurements)

    $.plot("#graph", [{data: data}], @graphOptions(measurements))
    @$("#graph-label-top").html(_.last(AC.G.db_levels) + " dB")
    @$("#graph-label-bottom").html(_.first(AC.G.db_levels) + " dB")

    $("#graph").unbind("plothover")
    $("#graph").bind("plothover", (event, pos, item) =>
      if item == null then @hideHighlight() else @highlightLocation(measurements, data, pos.x))

  drawGraphBackground: ->
    [low, mid, midHigh, high] = AC.util.dbRangePercentages()

    $("#graph-background .low").css(height: "100%")
    $("#graph-background .mid").css(height: mid + "%")
    $("#graph-background .midhigh").css(height: midHigh + "%")
    $("#graph-background .high").css(height: high + "%")

  highlightLocation: (measurements, data, time) ->
    index = _.sortedIndex(data, [time, null], (d) -> _.first(d))
    measurement = measurements[index]

    latlng = new google.maps.LatLng(measurement.latitude, measurement.longitude)
    if @location
      @location.setPosition(latlng)
    else
      @location = new google.maps.Marker(
        position: latlng
        zIndex: 300000
      )
      @location.setMap(@googleMap.map)

  hideHighlight: ->
    if @location
      @location.setMap(null)
      delete @location

  graphOptions: (measurements) ->
    first = AC.util.parseTime(_.first(measurements).time).getTime()
    last = AC.util.parseTime(_.last(measurements).time).getTime()

    xaxis:
      show: false
      mode: "time"
      panRange: [first, last]
      zoomRange: [null, last - first]
    yaxis:
      show: false
      zoomRange: false
      panRange: false
      min: _.first(AC.G.db_levels)
      max: _.last(AC.G.db_levels)
    grid:
      show: false
      hoverable: true
      mouseActiveRadius: Infinity
      autoHighlight: false
    zoom:
      interactive: true
    pan:
      interactive: true
    crosshair:
      mode: "x"
      color: "white"
    colors: ["white"]
    series:
      shadowSize: 0

  resizeGraph: ->
    width = window.innerWidth - 608
    $("section.graph").css(width: width)

  toggleGraph: ->
    if @parent.numberOfSelected() == 1
      @$("#graph-box").toggle()
      @drawGraph()
    else
      AC.util.notice("Select one session to view the graph")

  disableGraph: ->
    @$("#graph-box").hide()
