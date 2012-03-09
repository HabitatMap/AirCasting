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

describe "SessionListView", ->
  beforeEach ->
    @collection = new Backbone.Collection()
    @googleMap = {}
    @view = new AirCasting.Views.Maps.SessionListView({ collection: @collection, googleMap: @googleMap })
    @session = { get: (key) -> {}[key] }
    @measurements = "measurements"
    @view.downloadedData = { 1: { measurements: @measurements } }
    @view.selectedSessions = { 1: @session }
    @view.graphView =
      drawGraph: ->
      disableGraph: ->

  describe "drawSession", ->
    beforeEach ->
      spyOn(@view.graphView, "disableGraph")
      @view.drawMeasurement = ->

    it "should not disable the view if one session is selected", ->
      @view.selectedSessions = { 1: @session }
      @view.drawSession(1)
      expect(@view.graphView.disableGraph).not.toHaveBeenCalled()

    it "should disable the graph if many sessions are selected", ->
      @view.selectedSessions = { 1: @session, 2: @session }
      @view.drawSession(1)
      expect(@view.graphView.disableGraph).toHaveBeenCalled()

    it "should disable the graph if no sessions are selected", ->
      @view.selectedSessions = { }
      @view.drawSession(1)
      expect(@view.graphView.disableGraph).toHaveBeenCalled()
