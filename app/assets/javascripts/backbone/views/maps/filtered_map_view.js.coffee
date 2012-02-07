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

class AirCasting.Views.Maps.FilteredMapView extends Backbone.View
  heatLegend: JST["backbone/templates/maps/heat_legend"]()

  events:
    'click .submit': 'refilter'
    'click #reset-time': 'resetTime'
    'click #reset-tags': 'resetTags'
    'click #reset-usernames': 'resetUsernames'
    'click #reset-location': 'resetLocation'
    'click #reset-heat-legend': 'resetHeatLegend'
    'click #save-heat-legend': 'saveHeatLegend'

  initialize: (options) ->
    @googleMap = options.googleMap

    if map = options.mapState?.map
      latLng = new google.maps.LatLng(map.lat, map.lng)
      @googleMap.map.setCenter(latLng)
      @googleMap.map.setZoom(map.zoom)

    @minTime = 0
    @maxTime = 24 * 60 - 1
    @minDay = 1
    @maxDay = 365
    @minYear = 2011
    @maxYear = 2012

    @timeFrom = options.mapState?.timeFrom || @minTime
    @timeTo = options.mapState?.timeTo || @maxTime
    @dayFrom = options.mapState?.dayFrom || @minDay
    @dayTo = options.mapState?.dayTo || @maxDay
    @yearFrom = options.mapState?.yearFrom || @minYear
    @yearTo = options.mapState?.yearTo || @maxYear

    @initListeners()

  usernames: -> @$("#usernames").val()
  tags: -> @$("#tags").val()

  initListeners: ->
    google.maps.event.addListenerOnce @googleMap.map, "bounds_changed", @onMapLoaded.bind(this)

  showSection: (name) ->
    @$("h4.#{name}").addClass("expanded")
    @$("section.#{name}").show()

  render: ->
    $(@el).html @template()
    @$(".accordion").append @heatLegend

    @$("#usernames").val(@options.mapState?.usernames)
    @$("#tags").val(@options.mapState?.tags)

    @showSection("tags") if @tags()
    @showSection("time") if @timeFiltersAdjusted()

    @googleMap.map.setMapTypeId(@options.mapState.map.type) if @options.mapState.map

    @getHandles()
    @initSliders()
    @initTagAutocomplete()
    @initUsernameAutocomplete()

    return this

  timeFiltersAdjusted: ->
    @timeFrom != @minTime ||
      @timeTo != @maxTime ||
      @dayFrom != @minDay ||
      @dayTo != @maxDay ||
      @yearFrom != @minYear ||
      @yearTo != @maxYear

  permalinkData: ->
    heatLegend = {}
    heatLegend[key] = @currentLegendValue(key) for key in ["low", "midLow", "mid", "midHigh", "high"]

    {
      usernames: @usernames()
      tags: @tags()
      timeFrom: @timeFrom
      timeTo: @timeTo
      dayFrom: @dayFrom
      dayTo: @dayTo
      yearFrom: @yearFrom
      yearTo: @yearTo
      map:
        lat: @googleMap.map.getCenter().lat()
        lng: @googleMap.map.getCenter().lng()
        zoom: @googleMap.map.getZoom()
        type: @googleMap.map.getMapTypeId()
      heatLegend:
        heatLegend
    }

  initTagAutocomplete: ->
    @$('#tags').autocomplete('/autocomplete/tags', multiple: true, delay: 100)

  initUsernameAutocomplete: ->
    @$('#usernames').autocomplete('/autocomplete/usernames', multiple: true, delay: 100)

  getHandles: ->
    @timeSlider = @$('#time-slider')
    @timeFromLabel = @$('.time-from-label')
    @timeToLabel = @$('.time-to-label')

    @daySlider = @$('#day-slider')
    @dayFromLabel = @$('.day-from-label')
    @dayToLabel = @$('.day-to-label')

    @yearSlider = @$('#year-slider')
    @yearFromLabel = @$('#year-from-label')
    @yearToLabel = @$('#year-to-label')

    @heatLegendSliders = {
      midHigh: @$('#mid-high-slider')
      mid: @$('#mid-slider')
      midLow: @$('#mid-low-slider')
    }

    @heatLegendInputs = {
      high: @$('#high-input')
      midHigh: @$('#mid-high-input')
      mid: @$('#mid-input')
      midLow: @$('#mid-low-input')
      low: @$('#low-input')
    }

  initializeHeatLegend: (first) ->
    for key, input of @heatLegendInputs
      value = @initialLegendValue(key)
      if first
        value = @options.mapState.heatLegend?[key] || value

      input.val(value)
      @heatLegendSliders[key]?.slider {
        min: @initialLegendValue("low")
        max: @initialLegendValue("high")
        value: value
      }

    @saveHeatLegend()

  resetHeatLegend: ->
    AC.G.resetDBLevels()

    @initializeHeatLegend()
    @heatLegendUpdated()

  updateLegendDisplay: ->
    [low, midLow, mid, midHigh, high] = AC.G.db_levels

    @$(".low").css(width: (midLow - low) / (high - low) * 100 + "%")
    @$(".mid").css(width: (mid - midLow) / (high - low) * 100 + "%")
    @$(".midhigh").css(width: (midHigh - mid) / (high - low) * 100 + "%")
    @$(".high").css(width: (high - midHigh) / (high - low) * 100 + "%")

    @$(".low .start").html(low + " dB")
    @$(".mid .start").html(midLow + " dB")
    @$(".midhigh .start").html(mid + " dB")
    @$(".high .start").html(midHigh + " dB")
    @$(".high .end").html(high + " dB")

  saveHeatLegend: ->
    AC.G.saveDBLevels(@currentLegendValues())

    @updateLegendDisplay()
    @heatLegendUpdated()

  currentLegendValues: ->
    @currentLegendValue(key) for key in ["low", "midLow", "mid", "midHigh", "high"]

  currentLegendValue: (key) ->
    value = parseInt(@heatLegendInputs[key].val(), 10)
    if value? then value else @initialLegendValue(key)

  updateLegendValues: (fixed, value) ->
    @heatLegendInputs[fixed].val value

    level = @nextLegendLevel[fixed]
    while level
      previous = @previousLegendLevel[level]
      previousVal = @currentLegendValue(previous)
      nextVal = @currentLegendValue(level)
      if nextVal <= previousVal
        @heatLegendInputs[level].val(previousVal + 1)
      level = @nextLegendLevel[level]

    level = @previousLegendLevel[fixed]
    while level
      next = @nextLegendLevel[level]
      nextVal = @currentLegendValue(next)
      previousVal  = @currentLegendValue(level)
      if nextVal <= previousVal
        @heatLegendInputs[level].val(nextVal - 1)
      level = @previousLegendLevel[level]

    for key, slider of @heatLegendSliders
      slider.slider {
        value: @currentLegendValue(key)
        min: @currentLegendValue("low")
        max: @currentLegendValue("high")
      }

  nextLegendLevel: {
    midHigh: "high"
    mid: "midHigh"
    midLow: "mid"
    low: "midLow"
  }

  previousLegendLevel: {
    high: "midHigh"
    midHigh: "mid"
    mid: "midLow"
    midLow: "low"
  }

  initialLegendValue: (key) -> {
    high: AC.G.db_levels[4]
    midHigh: AC.G.db_levels[3]
    mid: AC.G.db_levels[2]
    midLow: AC.G.db_levels[1]
    low: AC.G.db_levels[0]
  }[key]

  initSliders: ->
    @initializeHeatLegend(true)

    for key, slider of @heatLegendSliders
      do (key) =>
        slider.slider(
          slide: (event, ui) =>
            @updateLegendValues(key, ui.value)
        )

    for key, input of @heatLegendInputs
      do(input, key) =>
        input.change =>
          value = @currentLegendValue(key)
          @updateLegendValues(key, value)

    @timeSlider.slider(
      range: true
      min: @minTime
      max: @maxTime
      step: 10
      values: [@timeFrom, @timeTo]
      slide: (event, ui) =>
        @timeFrom = ui.values[0]
        @timeTo   = ui.values[1]
        @updateTimeLabels()
    )

    @daySlider.slider(
      range: true
      min: @minDay
      max: @maxDay
      values: [@dayFrom, @dayTo]
      slide: (event, ui) =>
        @dayFrom = ui.values[0]
        @dayTo   = ui.values[1]
        @updateDayLabels()
    )

    @yearSlider.slider(
      range: true
      min: @minYear
      max: @maxYear
      values: [@yearFrom, @yearTo]
      slide: (event, ui) =>
        @yearFrom = ui.values[0]
        @yearTo   = ui.values[1]
        @updateYearLabels()
    )
    @updateLabels()

    @timeFromLabel.bind "change keyup", (event) =>
      value = @timeFromLabel.val()
      value = AC.util.parseMinutesHours(value)
      if value && value >= @minTime && value <= @maxTime && value <= @timeTo
        @setTimeFrom(value)
        @timeFromLabel.removeClass("error")
      else
        @timeFromLabel.addClass("error")

    @timeToLabel.bind "change keyup", (event) =>
      value = @timeToLabel.val()
      value = AC.util.parseMinutesHours(value)
      if value && value >= @minTime && value <= @maxTime && value >= @timeFrom
        @setTimeTo(value)
        @timeToLabel.removeClass("error")
      else
        @timeToLabel.addClass("error")

    @dayToLabel.bind "change keyup", (event) =>
      value = @dayToLabel.val()
      date = Date.parse(value)
      dayOfYear = @dayOfYear(date)
      if dayOfYear >= @minDay && dayOfYear <= @maxDay && dayOfYear >= @dayFrom
        @setDayTo(dayOfYear)
        @dayToLabel.removeClass("error")
      else
        @dayToLabel.addClass("error")

    @dayFromLabel.bind "change keyup", (event) =>
      value = @dayFromLabel.val()
      date = Date.parse(value)
      dayOfYear = @dayOfYear(date)
      if dayOfYear >= @minDay && dayOfYear <= @maxDay && dayOfYear <= @dayTo
        @setDayFrom(dayOfYear)
        @dayFromLabel.removeClass("error")
      else
        @dayFromLabel.addClass("error")

  updateTimeLabels: ->
    @timeFromLabel.val @formatTimeLabel(@timeFrom)
    @timeToLabel.val @formatTimeLabel(@timeTo)
    @timeToLabel.removeClass("error")
    @timeFromLabel.removeClass("error")

  updateDayLabels: ->
    @dayFromLabel.val @formatDayLabel(@dayFrom)
    @dayToLabel.val @formatDayLabel(@dayTo)
    @dayToLabel.removeClass("error")
    @dayFromLabel.removeClass("error")

  updateYearLabels: ->
    @yearFromLabel.val @formatYearLabel(@yearFrom)
    @yearToLabel.val @formatYearLabel(@yearTo)

  formatTimeLabel: (minutes) ->
    "#{@padInt(Math.floor(minutes / 60))}:#{@padInt(minutes % 60)}"

  formatDayLabel: (days) ->
    Date.parse('January 1').addDays(days - 1).toString('MM/dd')

  dayOfYear: (date) ->
    MILIS_IN_DAY = 60 * 60 * 24 * 1000
    (date - Date.parse("January 1")) / MILIS_IN_DAY + 1

  formatYearLabel: (year) ->
    '' + year

  activate: ->
    throw 'activate() not implemented'

  deactivate: ->
    throw 'deactivate() not implemented'

  onMapLoaded: ->
    @mapLoaded = true

  refilter: ->
    return unless @mapLoaded
    @fetch()

  fetch: ->
    throw 'fetch() not implemented'

  clear: ->
    throw 'clear() not implemented'

  heatLegendUpdated: ->
    throw 'heatLegendUpdated() not implemented'

  setTimeFrom: (value) ->
    @timeFrom = value
    @timeSlider.slider 'values', 0, [value]

  setTimeTo: (value) ->
    @timeTo = value
    @timeSlider.slider 'values', 1, [value]

  setDayFrom: (value) ->
    @dayFrom = value
    @daySlider.slider 'values', 0, [value]

  setDayTo: (value) ->
    @dayTo = value
    @daySlider.slider 'values', 1, [value]

  setYearFrom: (value) ->
    @yearFrom = value
    @yearSlider.slider 'values', 0, [value]

  setYearTo: (value) ->
    @yearTo = value
    @yearSlider.slider 'values', 1, [value]

  updateLabels: ->
    @updateTimeLabels()
    @updateDayLabels()
    @updateYearLabels()

  resetTime: (skipRefilter) ->
    @setTimeFrom @minTime
    @setTimeTo @maxTime

    @setDayFrom @minDay
    @setDayTo @maxDay

    @setYearFrom @minYear
    @setYearTo @maxYear

    @updateLabels()

    @refilter() unless skipRefilter is true

  resetTags: (skipRefilter) ->
    @$('#tags').val('')
    @refilter() unless skipRefilter is true

  resetUsernames: (skipRefilter) ->
    @$('#usernames').val('')
    @refilter() unless skipRefilter is true

  resetLocation: (skipRefilter) ->
    @$('#location').val('')
    @$('#limit-to-viewport').attr('checked', false)
    @refilter() unless skipRefilter is true

  padInt: (n) ->
    if n < 10 then '0' + n else '' + n
