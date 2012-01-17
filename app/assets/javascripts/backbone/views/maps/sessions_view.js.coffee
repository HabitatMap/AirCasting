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
  }).extend(AirCasting.Views.Maps.FilteredMapView.prototype.events)

  initialize: (options) ->
    super options
    @sessions = new AirCasting.Collections.SessionsCollection()
    @includeSessionId = options.includeSessionId || ''

  render: ->
    super()
    @sessionListView = new AirCasting.Views.Maps.SessionListView(
      el: $('#session-list'),
      collection: @sessions,
      googleMap: @googleMap
    ).render()
    @fetch()

    this

  activate: (options) ->
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
    location = @$('#location').val()
    distance = @$('#distance').val()
    viewport = if @$("#limit-to-viewport").attr("checked") then AC.util.viewport(@googleMap)
    @sessions.setUrlParams(@timeFrom, @timeTo, @dayFrom, @dayTo, @includeSessionId, tags, usernames, location, distance, viewport)
    @sessions.fetch()

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
