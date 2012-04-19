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

class AirCasting.Views.Maps.SessionListItemView extends Backbone.View
  tagName: 'li'
  template: JST["backbone/templates/maps/session_list_item"]

  events:
    'change input:checkbox': 'onChange'

  initialize: (options) ->
    super options
    @parent = options.parent

  render: ->
    console.log @model
    $(@el).html @template(session: @model, selected: @options.selected, timeframe: @model.timeframe())
    @lightUp() if @options.selected
    return this

  lightUp: ->
    $(@el).addClass("selected")

  lightDown: ->
    $(@el).removeClass("selected")

  onChange: ->
    if @$(":checkbox:checked").size() > 0 then @lightUp() else @lightDown()
    @parent.onChildSelected(this, @$(':checkbox:checked').size() > 0)

  unselect: ->
    $(@el).removeClass("selected")
    $(@el).children(":checkbox").attr("checked", false)
