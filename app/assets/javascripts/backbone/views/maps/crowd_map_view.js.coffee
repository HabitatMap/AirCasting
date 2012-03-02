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

class AirCasting.Views.Maps.CrowdMapView extends AirCasting.Views.Maps.FilteredMapView
  template: JST["backbone/templates/maps/crowd_map"]

  events: _({
    'click #reset-resolution': 'resetResolution'
    'click #show-location': 'showLocation'
  }).extend(AirCasting.Views.Maps.FilteredMapView.prototype.events)

  initialize: (options) ->
    super options
    @rectangles = []
    @minResolution = 10
    @maxResolution = 50
    @defaultResolution = 25
    @gridResolution = options.mapState.crowdMap?.resolution || @defaultResolution
    @geocoder = new google.maps.Geocoder()

    @infoWindow = new google.maps.InfoWindow()
    google.maps.event.addListener(@googleMap.map, "zoom_changed", => @hideRegionInfo())

  render: ->
    super()

    @showSection("resolution") if @gridResolution != @defaultResolution

    return this

  getHandles: ->
    super()
    @resolutionSlider = @$('#resolution-slider')
    @resolutionLabel = @$('#resolution-label')

  location: -> @$("#show-location-input").val()

  permalinkData: ->
    _(super()).extend {
      crowdMap:
        resolution: @gridResolution
    }

  initSliders: ->
    super()
    @resolutionSlider.slider(
      min: @minResolution
      max: @maxResolution
      value: @gridResolution
      slide: (event, ui) =>
        @gridResolution = ui.value
        @updateResolutionLabel()
    )
    @updateResolutionLabel()

  activate: ->
    @refilter()
    @idleListener = google.maps.event.addListener @googleMap.map, "idle", @refilter.bind(this)
    @initializeHeatLegend()

  deactivate: ->
    @clear()
    google.maps.event.removeListener @idleListener if @idleListener

  showLocation: ->
    AC.util.spinner.startTask()

    address = @location()
    @geocoder.geocode { address: address }, (results, status) =>
      if (status == google.maps.GeocoderStatus.OK)
        @googleMap.map.fitBounds(results[0].geometry.viewport)
      AC.util.spinner.stopTask()

  heatLegendUpdated: ->
    if AC.util.mapReady(@googleMap)
      @fetch()

  resetSliders: ->
    super()
    @resetResolution true

  updateResolutionLabel: ->
    @resolutionLabel.text '' + @gridResolution

  fetch: ->
    AC.util.spinner.startTask()

    viewport = AC.util.viewport(@googleMap)

    [timeFrom, timeTo] = AC.util.normalizeTimeSpan(@timeFrom, @timeTo)

    $.getJSON "/api/averages",
      q:
        west: viewport.west
        east: viewport.east
        south: viewport.south
        north: viewport.north
        time_from: timeFrom
        time_to: timeTo
        day_from: @dayFrom
        day_to: @dayTo
        year_from: @yearFrom
        year_to: @yearTo
        grid_size_x: parseInt(@gridResolution) * ($(window).width() / $(window).height())
        grid_size_y: @gridResolution
        tags: @tags()
        usernames: @usernames()
      (data, status, jqXHR) =>
        @data = data
        @draw()
        AC.util.spinner.stopTask()

  clear: ->
    for rectangle in @rectangles
      rectangle.setMap null
    @rectangles.length = 0

  draw: ->
    @clear()

    for element in @data
      fillColor = AC.util.dbToColor(element.value)
      if fillColor
        rectOptions =
          strokeWeight: 0
          fillColor: AC.util.dbToColor(element.value)
          fillOpacity: 0.35
          map: @googleMap.map
          bounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(element.south, element.west),
            new google.maps.LatLng(element.north, element.east)
          )

        rectangle = new google.maps.Rectangle()
        rectangle.setOptions rectOptions
        @rectangles.push rectangle

        do (element) => google.maps.event.addListener(rectangle, 'click', => @showRegionInfo(element))

  showRegionInfo: (region) ->
    lat = (region.south + region.north) / 2
    lng = (region.east + region.west) / 2
    position = new google.maps.LatLng(lat, lng)

    @infoWindow.setContent('<div id="region-info">Working...</div>')
    @infoWindow.setPosition(position)

    google.maps.event.addListenerOnce(@infoWindow, "domready", =>
      @regionView = new AirCasting.Views.Maps.RegionView(el: $("#region-info"), region: region).render())

    @infoWindow.open(@googleMap.map)

  hideRegionInfo: ->
    @infoWindow.close()

  setResolution: (value) ->
    @gridResolution = value
    @resolutionSlider.slider 'value', value

  resetResolution: (skipRefilter) ->
    @setResolution @defaultResolution
    @updateResolutionLabel()
    @refilter() unless skipRefilter is true

