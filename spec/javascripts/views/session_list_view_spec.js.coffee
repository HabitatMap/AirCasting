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
    @session = { get: (key) -> { calibration: 100, offset_60_db: 10 }[key] }
    @measurements = [{time: new Date(1000), value: 10}, {time: new Date(2000), value: 20}]
    @view.downloadedData = { 1: { measurements: @measurements } }
    @view.selectedSessions = { 1: @session }

  describe "drawSession", ->
    beforeEach ->
      @view.drawMeasurement = ->

    it "should draw the graph", ->
      spyOn(@view, "drawGraph")
      @view.drawSession(1)
      expect(@view.drawGraph).toHaveBeenCalledWith(@session, @measurements)

  describe "drawGraph", ->
    beforeEach ->
      $("<div id='test'>
           <div id='graph'>
           </div>
           <div id='graph-background'>
             <div class='low'></div>
             <div class='mid'></div>
             <div class='midhigh'></div>
             <div class='high'></div>
           </div>
         </div>"
      ).appendTo("body")
      $("#graph").css(width: 100, height: 100)
      @graphOptions = { some: "options" }

    afterEach ->
      $("#test").remove()

    it "should create the graph", ->
      spyOn($, "plot")
      spyOn(@view, "graphOptions").andCallFake => @graphOptions

      @view.drawGraph(@session, @measurements)

      expectedData = ([m.time.getTime(), AC.util.calibrateValue(100, 10, m.value)] for m in @measurements)
      expect($.plot).toHaveBeenCalledWith("#graph", [{data: expectedData}], @graphOptions)
      expect(@view.graphOptions).toHaveBeenCalledWith(@measurements)

    it "should setup the background", ->
      $("#graph-background").css(height: 100)
      spyOn(AC.util, "dbRangePercentages").andReturn([10, 20, 30, 40])

      @view.drawGraph(@session, @measurements)

      expect($(".low").height()).toEqual(10)
      expect($(".mid").height()).toEqual(20)
      expect($(".midhigh").height()).toEqual(30)
      expect($(".high").height()).toEqual(40)

  describe "graphOptions", ->
    beforeEach ->
      @options = @view.graphOptions(@measurements)

    it "should set xaxis panRange", ->
      expected = [
        _.first(@measurements).time.getTime(),
        _.last(@measurements).time.getTime()
      ]

      expect(@options.xaxis.panRange).toEqual(expected)

    it "should set xaxis zoomRange", ->
      expected = _.last(@measurements).time.getTime() - _.first(@measurements).time.getTime()

      expect(@options.xaxis.zoomRange).toEqual([null, expected])

    it "should set yaxis min", ->
      expect(@options.yaxis.min).toEqual(_.first(AC.G.db_levels))

    it "should set yaxis max", ->
      expect(@options.yaxis.max).toEqual(_.last(AC.G.db_levels))

