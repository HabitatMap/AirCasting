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
# Place all the behaviors and hooks related to the matching controller here.
# All this logic will automatically be available in application.js.
# You can use CoffeeScript in this file: http://jashkenas.github.com/coffee-script/

class AirCasting.GoogleMap
  constructor: (north, east, south, west) ->
    @minZoom = 3
    @mapElementId = "mapview"

    lat = $.cookie('vp_lat') || 38.693861956002024
    lng = $.cookie('vp_lng') || -87.5
    latlng = new google.maps.LatLng(lat, lng)
    zoom = $.cookie('vp_zoom') || 5

    options =
      zoom: parseInt(zoom)
      minZoom: @minZoom
      center: latlng
      mapTypeId: google.maps.MapTypeId.TERRAIN
      mapTypeControl: true
      mapTypeControlOptions:
        position: google.maps.ControlPosition.TOP_CENTER
        mapTypeIds: [
          google.maps.MapTypeId.ROADMAP
          google.maps.MapTypeId.SATELLITE
          google.maps.MapTypeId.TERRAIN
          google.maps.MapTypeId.HYBRID
        ]
      zoomControl: false
      panControl: false
      streetViewControl: false

    @map = new google.maps.Map(document.getElementById(@mapElementId), options)
    @adjustViewport(north, east, south, west)
    google.maps.event.addListener @map, "zoom_changed", @adjustMapType.bind(this)
    google.maps.event.addListener @map, "idle", @saveViewport.bind(this)

  adjustViewport: (north, east, south, west) ->
    if east and west and north and south
      northeast = new google.maps.LatLng(north, east)
      southwest = new google.maps.LatLng(south, west)
      bounds = new google.maps.LatLngBounds(southwest, northeast)
      @map.fitBounds(bounds)

  adjustMapType: ->
    # if zoom is too high for terrain map, switch to hybrid map (but remember last used type)
    if @map.getZoom() >= 15 && @map.getMapTypeId() == google.maps.MapTypeId.TERRAIN
      @map.setMapTypeId(google.maps.MapTypeId.HYBRID)
      @previousMapTypeId = google.maps.MapTypeId.TERRAIN

    # if zoom is low enough for terrain map, switch to it if it was used before zooming in
    else if @map.getZoom() < 15 && @previousMapTypeId
      @map.setMapTypeId(@previousMapTypeId)
      @previousMapTypeId = null

  saveViewport: ->
    zoom = @map.getZoom()
    lat = @map.getCenter().lat()
    lng = @map.getCenter().lng()

    $.cookie('vp_zoom', zoom, expires: 365)
    $.cookie('vp_lat', lat, expires: 365)
    $.cookie('vp_lng', lng, expires: 365)


initializeSignInForm = ->
  $('#sign-in-link').click ->
    $('#sign-in').slideToggle('fast')
    false

  $('#cancel-sign-in-link').click ->
    $('#sign-in').slideUp('fast')
    false

  $('#sign-in-form').bind 'ajax:success', (evt, data, status, xhr) ->
    $('#sign-in').hide()
    window.location = window.location

  $('#sign-in-form').bind 'ajax:error', (evt, data, status, xhr) ->
    if data.status == 401
      $('#sign-in-form .errors').text('Wrong email or password')

  $('#sign-out-link').click ->
    $.ajax
      url: '/users/sign_out'
      type: 'DELETE'
      success: ->
        window.location = window.location
    false

initializeAccordion = ->
  $('.accordion h4').live('click', ->
    $(this).toggleClass('expanded')
    $(this).next().toggle()
    return false
  ).next().hide()

initializePanel = ->
  $('.panel-arrow').live('click', ->
    $(this).toggleClass('collapsed')
    $(this).next().animate({opacity:'toggle'},350)
    return false
  )

initializePickers = ->
  datepickerOptions = {
    dateFormat: "mm/dd"
  }
  $( -> $('.month-day').datepicker(datepickerOptions))
  $( -> $('.timepicker').timepicker())

initializeSpinner = ->
  spinnerTarget = document.getElementById('ajax-loader')

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

  spinner = new Spinner(spinnerOpts);

  $.ajaxSetup
    beforeSend: -> spinner.spin(spinnerTarget)
    complete: -> spinner.stop()


initialize = ->
  initializeSignInForm()
  initializeAccordion()
  initializePanel()
  initializePickers()
  AC.util.spinner.initialize()

$(document).ready(initialize)
