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
  sensorItem: JST["backbone/templates/maps/sensor_item"]

  events: _({
    'click #reset-resolution': 'resetResolution'
    'click #show-location': 'showLocation'
    'change #sensor': 'selectSensor'
  }).extend(AirCasting.Views.Maps.FilteredMapView.prototype.events)

  initialize: (options) ->
    super options
    @rectangles = []
    @minResolution = 10
    @maxResolution = 50
    @defaultResolution = 25

    @gridResolution = options.mapState.crowdMap?.resolution || @defaultResolution
    @sensors = new AirCasting.Collections.SensorCollection()
    if options.mapState.crowdMap?
      @selectedSensorFromParams = options.mapState.crowdMap.selectedSensor
    @geocoder = new google.maps.Geocoder()

    @sensors.bind("reset", => @populateSensors())

    @infoWindow = new google.maps.InfoWindow()
    google.maps.event.addListener(@googleMap.map, "zoom_changed", => @hideRegionInfo())

  render: ->
    super()

    @showSection("resolution") if @gridResolution != @defaultResolution

    @sensors.fetch()

    return this

  selectSensor: (evt) ->
    cid = $(@el).find("#sensor :selected").attr("value")
    @selectedSensor = @sensors.getByCid cid
    @hideRegionInfo()
    @heatLegendSensor = @selectedSensor
    @initializeHeatLegend(false)

    @fetch()

  populateSensors: ->
    selectedSensors = @sensors.where(@selectedSensorFromParams)
    if selectedSensors.length > 0
      @selectedSensor ||= selectedSensors[0]
    @selectedSensor ||= @sensors.max((sensor) -> sensor.get("session_count"))
    @heatLegendSensor = @selectedSensor
    @initializeHeatLegend(true)

    @sensors.each (sensor) =>
      rendered = @sensorItem(sensor: sensor, selected: _(@selectedSensor.attributes).isEqual(sensor.attributes))
      $(@el).find("#sensor").append(rendered)
    @fetch()

  getHandles: ->
    super()
    @resolutionSlider = @$('#resolution-slider')
    @resolutionLabel = @$('#resolution-label')

  location: -> @$("#show-location-input").val()

  permalinkData: ->
    _(super()).extend {
      crowdMap:
        resolution: @gridResolution
        selectedSensor: @selectedSensor.toParams()
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
    viewport = AC.util.viewport(@googleMap)
    if(!(viewport && @selectedSensor))
      return

    AC.util.spinner.startTask()

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
        sensor_name: @selectedSensor.get("sensor_name")
        measurement_type: @selectedSensor.get("measurement_type")
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
      fillColor = AC.util.dbToColor(@selectedSensor, element.value)
      if fillColor
        rectOptions =
          strokeWeight: 0
          fillColor: AC.util.dbToColor(@selectedSensor, element.value)
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
      @regionView = new AirCasting.Views.Maps.RegionView(el: $("#region-info"), region: region, sensor: @selectedSensor).render())

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

