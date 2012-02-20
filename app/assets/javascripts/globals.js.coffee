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
  default_db_levels: [20, 60, 70, 80, 100]
  db_levels: []

  initialize: ->
    for i in [0..4]
      value = $.cookie("db_levels_" + i)
      value = parseInt(value)
      @db_levels[i] = value || @default_db_levels[i]

  resetDBLevels: ->
    @saveDBLevels(@default_db_levels)

  saveDBLevels: (levels) ->
    @db_levels = levels
    for i in [0..4]
      $.cookie("db_levels_" + i, levels[i], expires: 365)

window.AirCasting.G.initialize()

window.AirCasting.util =
  colors: [
    [0x00, 0xA2, 0x3C]
    [0xFF, 0xD7, 0x00]
    [0xFF, 0x7E, 0x00]
    [0xFF, 0x00, 0x00]
  ]

  dbToColor: (value) ->
    result =
      if value < AC.G.db_levels[0]
        null
      else if value < AC.G.db_levels[1]
        @colors[0]
      else if value < AC.G.db_levels[2]
        @colors[1]
      else if value < AC.G.db_levels[3]
        @colors[2]
      else if value < AC.G.db_levels[4]
        @colors[3]
      else
        null

    if result
      "rgb(" + parseInt(result[0]) + "," + parseInt(result[1]) + "," + parseInt(result[2]) + ")"

  dbToIcon: (calibration, offset_60_db, value) ->
    value = @calibrateValue(calibration, offset_60_db, value)

    result =
      if value < AC.G.db_levels[0]
        null
      else if value < AC.G.db_levels[1]
        window.marker1_path
      else if value < AC.G.db_levels[2]
        window.marker2_path
      else if value < AC.G.db_levels[3]
        window.marker3_path
      else if value < AC.G.db_levels[4]
        window.marker4_path
      else
        null

  calibrateValue: (calibration, offset_60_db, value) ->
    (value + (calibration - 60 + offset_60_db)) / (calibration - 60 + offset_60_db) * (calibration - 60) + 60

  parseTime: (timeStr) ->
    Date.parse timeStr

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

  showDialog: (title, content) ->
    $('<div></div>')
      .html(content)
      .dialog(title: title)

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
