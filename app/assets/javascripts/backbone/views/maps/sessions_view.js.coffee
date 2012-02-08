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

class AirCasting.Views.Maps.SessionsView extends AirCasting.Views.Maps.FilteredMapView
  template: JST["backbone/templates/maps/sessions"]

  events: _({
    'click #toggle-all-sessions': 'toggleAllSessions'
    'click #limit-to-viewport': 'updateLocationDisabled'
  }).extend(AirCasting.Views.Maps.FilteredMapView.prototype.events)

  initialize: (options) ->
    super options

    @sessions = new AirCasting.Collections.SessionsCollection()
    @sessions.bind("reset", @pulseSessions)
    @sessions.bind("reset", -> AC.util.spinner.stopTask())

    $(window).resize(@resizeSessions)

    @includeSessionId = options.includeSessionId || ''

    google.maps.event.addListenerOnce @googleMap.map, "idle", => @refilterViewport()

  limitToViewport: ->  @$("#limit-to-viewport").is(":checked")

  refilterViewport: -> @refilter() if @limitToViewport()

  permalinkData: ->
    _(super()).extend {
      sessions:
        location:
          text: @$("#location").val() unless @limitToViewport()
          distance: @$("#distance").val() unless @limitToViewport()
          limitToViewport: @limitToViewport()
        selectedIds:
          parseInt(id) for id, session of @sessionListView.selectedSessions
    }

  resetLocation: ->
    super()
    @updateLocationDisabled()

  updateLocationDisabled: ->
    @$("#location").attr("disabled", @limitToViewport())
    @$("#distance").attr("disabled", @limitToViewport())

  resizeSessions: ->
    height = Math.max(window.innerHeight - 340, 100)
    $(".sessions-container").css({height: height})

  pulseSessions: ->
    $("section.sessions").css({opacity: 1})
    $("section.sessions").pulse({opacity: 0.65}, 350, 2)

  render: ->
    super()

    data = @options.mapState.sessions
    @$("#location").val(data?.location.text)
    @$("#distance").val(data?.location.distance || 10)
    @$("#limit-to-viewport").attr("checked", !!data?.location.limitToViewport)
    @updateLocationDisabled()

    @resizeSessions()
    @sessionListView = new AirCasting.Views.Maps.SessionListView(
      el: $('#session-list'),
      collection: @sessions,
      googleMap: @googleMap
      selectedIds: @options.mapState.sessions?.selectedIds || []
    ).render()
    @fetch()

    this

  activate: (options) ->
    @initializeHeatLegend()
    @draw(options?.selectedSessionId)

  deactivate: ->
    @clear()

  resetSessions: (skipRefilter) ->
    @sessionListView.reset()

  toggleAllSessions: (skipRefilter) ->
    @sessionListView.toggleAll()

  fetch: ->
    tags = @$('#tags').val()
    usernames = @$('#usernames').val()
    location = if @limitToViewport() then "" else @$('#location').val()
    distance = if @limitToViewport() then 0  else @$('#distance').val()
    viewport = AC.util.viewport(@googleMap) if @limitToViewport()
    @sessions.setUrlParams(@timeFrom, @timeTo, @dayFrom, @dayTo, @includeSessionId, tags, usernames, location, distance, viewport)

    AC.util.spinner.startTask()
    @sessions.fetch()

  heatLegendUpdated: ->
    if @sessionListView
      @sessionListView.clear()
      @sessionListView.draw()

  clear: ->
    @sessionListView.clear()

  draw: (selectedSessionId) ->
    if selectedSessionId
      @sessionListView.fetchData(selectedSessionId, (data) =>
        @sessionListView.selectSessionByToken(data)
        @sessionListView.render()
        $(@sessionListView.el).parent().scrollTop(
          $(@sessionListView.el).find(':checked').parents('li').position().top -
            $(@sessionListView.el).position().top
        )
      )
