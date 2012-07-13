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
window.AirCasting.G =
  names: ["threshold_very_low", "threshold_low", "threshold_medium", "threshold_high", "threshold_very_high"]

  levelKey: (sensor, name) ->
    [sensor.get("measurement_type"), sensor.get("sensor_name"), name].join("-")

  getFromCookie: (name) ->
    $.cookie(name)

  getThresholds: (sensor) ->
    if !@getFromCookie(@levelKey(sensor, _(@names).last()))
      return
    @names.map (name) =>
      value = @getFromCookie(@levelKey(sensor, name))
      parseInt(value) || sensor.get(name)

  thresholdsObjToArray: (obj) ->
    @names.map (name) =>
      value = obj[name] 
      parseInt(value)

  thresholdsModelToArray: (obj) ->
    @names.map (name) =>
      value = obj.get(name)
      parseInt(value) 

  saveThresholds: (sensor, thresholds) ->
    for i in [0..4]
      $.cookie(@levelKey(sensor, @names[i]), thresholds[i], expires: 365)

  resetThresholds: (sensor) ->
    values = @names.map (name) -> undefined
    @saveThresholds(sensor, values)

window.AirCasting.util =
  colors: [
    [0x00, 0xA2, 0x3C]
    [0xFF, 0xD7, 0x00]
    [0xFF, 0x7E, 0x00]
    [0xFF, 0x00, 0x00]
  ]

  dbToColor: (levels, value) ->
    result =
      if value < levels[0]
        null
      else if value < levels[1]
        @colors[0]
      else if value < levels[2]
        @colors[1]
      else if value < levels[3]
        @colors[2]
      else if value < levels[4]
        @colors[3]
      else
        null

    if result
      "rgb(" + parseInt(result[0]) + "," + parseInt(result[1]) + "," + parseInt(result[2]) + ")"

  dbToIcon: (levels, value) ->
    result =
      if value < levels[0]
        null
      else if value < levels[1]
        window.marker1_path
      else if value < levels[2]
        window.marker2_path
      else if value < levels[3]
        window.marker3_path
      else if value < levels[4]
        window.marker4_path
      else
        null

  dbRangePercentages: (levels) ->
    range = _.last(levels) - _.first(levels)
    ranges = _.map([0..2], (i) => Math.round((levels[i+1] - levels[i]) / range * 100))
    ranges.push 100 - _.reduce(ranges, (sum, x) -> sum + x)
    ranges

  parseTime: (timeStr) -> Date.parse timeStr

  normalizeTimeSpan: (from, to) ->
    normalize = (value) ->
      MINUTES_IN_DAY = 1440
      if value < 0
        MINUTES_IN_DAY + value
      else
        value % MINUTES_IN_DAY

    from += new Date().getTimezoneOffset()
    to += new Date().getTimezoneOffset()
    [normalize(from), normalize(to)]

  viewport: (map) ->
    bounds = map.map.getBounds()
    if bounds
      {
        west: bounds.getSouthWest().lng(),
        east: bounds.getNorthEast().lng(),
        south: bounds.getSouthWest().lat(),
        north: bounds.getNorthEast().lat()
      }

  mapReady: (map) ->
    map.map.getBounds()

  parseMinutesHours: (value) ->
    date = Date.parse(value)
    if date
      date.getMinutes() + 60 * date.getHours()

  notice: (text) ->
    box = "<div class=\"notice\">#{text}</div>"
    $('body').append(box)
    $('.notice').delay(3000).slideUp()

  spinner: {
    initialize: ->
      @spinnerTarget = document.getElementById('ajax-loader')

      spinnerOpts = {
        lines: 12,
        length: 0,
        width: 15,
        radius: 34,
        color: '#000',
        speed: 1.5,
        trail: 42,
        shadow: true
      }

      @spinner = new Spinner(spinnerOpts)
      @activeTasks = 0

    startTask: ->
      if @activeTasks == 0
        @spinner.spin(@spinnerTarget)
      @activeTasks += 1

    stopTask: ->
      @activeTasks -= 1
      if @activeTasks <= 0
        @activeTasks = 0
        @spinner.stop()
  }

  sortedShortTypes: (session) ->
    streams = session.getStreams()
    types = _(streams).map (stream) -> stream.measurement_short_type
    _(types).
      sortBy((type) -> type.toLowerCase() ).
      map( (type) -> "<span class='#{type.toLowerCase()}'>#{type.toLowerCase()}</span>" ).join('/')
