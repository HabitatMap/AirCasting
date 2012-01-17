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
  events:
    'click .submit': 'refilter'
    'click #reset-time': 'resetTime'
    'click #reset-tags': 'resetTags'
    'click #reset-usernames': 'resetUsernames'
    'click #reset-location': 'resetLocation'

  initialize: (options) ->
    @googleMap = options.googleMap

    @minTime = @timeFrom = 0
    @maxTime = @timeTo = 24 * 60 - 1
    @minDay  = @dayFrom = 1
    @maxDay  = @dayTo = 365
    @minYear = @yearFrom = 2011
    @maxYear = @yearTo = 2012

    @initListeners()

  initListeners: ->
    google.maps.event.addListenerOnce @googleMap.map, "bounds_changed", @onMapLoaded.bind(this)

  render: ->
    $(@el).html @template()
    @getHandles()
    @initSliders()
    @resetSliders()
    @initTagAutocomplete()
    @initUsernameAutocomplete()

    return this

  initTagAutocomplete: ->
    @$('#tags').autocomplete('/autocomplete/tags', multiple: true, delay: 100)

  initUsernameAutocomplete: ->
    @$('#usernames').autocomplete('/autocomplete/usernames', multiple: true, delay: 100)

  getHandles: ->
    @timeSlider = @$('#time-slider')
    @timeFromLabel = @$('#time-from-label')
    @timeToLabel = @$('#time-to-label')

    @daySlider = @$('#day-slider')
    @dayFromLabel = @$('#day-from-label')
    @dayToLabel = @$('#day-to-label')

    @yearSlider = @$('#year-slider')
    @yearFromLabel = @$('#year-from-label')
    @yearToLabel = @$('#year-to-label')

  initSliders: ->
    @timeSlider.slider(
      range: true
      min: @minTime
      max: @maxTime
      step: 10
      values: [@minTime, @maxTime]
      slide: (event, ui) =>
        @timeFrom = ui.values[0]
        @timeTo   = ui.values[1]
        @updateTimeLabels()
    )

    @daySlider.slider(
      range: true
      min: @minDay
      max: @maxDay
      values: [@minDay, @maxDay]
      slide: (event, ui) =>
        @dayFrom = ui.values[0]
        @dayTo   = ui.values[1]
        @updateDayLabels()
    )

    @yearSlider.slider(
      range: true
      min: @minYear
      max: @maxYear
      values: [@minYear, @maxYear]
      slide: (event, ui) =>
        @yearFrom = ui.values[0]
        @yearTo   = ui.values[1]
        @updateYearLabels()
    )

    @timeFromLabel.keyup (event) =>
      value = @timeFromLabel.val()
      value = AC.util.parseMinutesHours(value)
      if value && value >= @minTime && value <= @maxTime && value <= @timeTo
        @setTimeFrom(value)
        @timeFromLabel.removeClass("error")
      else
        @timeFromLabel.addClass("error")
        
    @timeToLabel.keyup (event) =>
      value = @timeToLabel.val()
      value = AC.util.parseMinutesHours(value)
      if value && value >= @minTime && value <= @maxTime && value >= @timeFrom
        @setTimeTo(value)
        @timeToLabel.removeClass("error")
      else
        @timeToLabel.addClass("error")
    
    @dayToLabel.keyup (event) =>
      value = @dayToLabel.val()
      date = Date.parse(value)
      dayOfYear = @dayOfYear(date)
      if dayOfYear >= @minDay && dayOfYear <= @maxDay && value >= @dayFrom
        @setDayTo(dayOfYear)
        @dayToLabel.removeClass("error")
      else
        @dayToLabel.addClass("error")

    @dayFromLabel.keyup (event) =>
      value = @dayFromLabel.val()
      date = Date.parse(value)
      dayOfYear = @dayOfYear(date)
      if dayOfYear >= @minDay && dayOfYear <= @maxDay && value <= @dayTo
        @setDayTo(dayOfYear)
        @dayFromLabel.removeClass("error")
      else
        @dayFromLabel.addClass("error")

  resetSliders: ->
    @resetTime true
    @resetTags true

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

  resetTime: (skipRefilter) ->
    @setTimeFrom @minTime
    @setTimeTo @maxTime

    @setDayFrom @minDay
    @setDayTo @maxDay

    @setYearFrom @minYear
    @setYearTo @maxYear

    @updateTimeLabels()
    @updateDayLabels()
    @updateYearLabels()

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
