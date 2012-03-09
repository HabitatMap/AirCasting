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

describe "GraphView", ->
  beforeEach ->
    @collection = new Backbone.Collection()
    @googleMap = {}
    @view = new AirCasting.Views.Maps.SessionListView({ collection: @collection, googleMap: @googleMap })
    @session = "session"
    @measurements = "measurements"
    @view.downloadedData = { 1: { measurements: @measurements } }
    @view.selectedSessions = { 1: @session }
    @view.graphView = { drawGraph: -> }

  describe "drawSession", ->
    beforeEach ->
      @view.drawMeasurement = ->

    it "should draw the graph", ->
      spyOn(@view.graphView, "drawGraph")
      @view.drawSession(1)
      expect(@view.graphView.drawGraph).toHaveBeenCalledWith(@session, @measurements)
