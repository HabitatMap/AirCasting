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
    $("<div id='test'>
         <div id='graph-box'>
           <div id='graph-label-top'></div>
           <div id='graph-label-bottom'></div>
           <div id='graph-label-left'></div>
           <div id='graph-label-right'></div>
           <div id='graph'>
           </div>
           <div id='graph-background'>
             <div class='low'></div>
             <div class='mid'></div>
             <div class='midhigh'></div>
             <div class='high'></div>
           </div>
         </div>
       </div>"
    ).appendTo("body")
    $("#graph").css(width: 100, height: 100)

  beforeEach ->
    @collection = new Backbone.Collection()
    @googleMap = {}
    @session = { get: (key) -> { calibration: 100, offset_60_db: 10 }[key] }
    @measurements = [{time: new Date(1000), value: 10}, {time: new Date(2000), value: 20}]
    @parent = {
      downloadedData: { 1: { measurements: [] }, 2: { measurements: @measurements } }
      selectedSessions: { 2: @session }
    }
    @view = new AirCasting.Views.Maps.GraphView({ el: $("#test"), collection: @collection, googleMap: @googleMap, parent: @parent})
    @plot = { getData: -> [{ xaxis: { min: 10, max: 20 } }] }

  describe "drawGraph", ->
    beforeEach ->
      @graphOptions = { some: "options" }

    afterEach ->
      $("#test").remove()

    it "should create the graph", ->
      spyOn($, "plot").andReturn(@plot)
      spyOn(@view, "graphOptions").andCallFake => @graphOptions
      spyOn(@view, "updateLabels")

      @view.drawGraph()

      expectedData = ([m.time.getTime(), AC.util.calibrateValue(100, 10, m.value)] for m in @measurements)
      expect($.plot).toHaveBeenCalledWith("#graph", [{data: expectedData}], @graphOptions)
      expect(@view.graphOptions).toHaveBeenCalledWith(@measurements)
      expect(@view.updateLabels).toHaveBeenCalledWith(@plot)

    it "should setup the background", ->
      $("#graph-background").css(height: 100)
      spyOn(AC.util, "dbRangePercentages").andReturn([10, 20, 30, 40])

      @view.drawGraph()

      expect($(".low").height()).toEqual(100)
      expect($(".mid").height()).toEqual(20)
      expect($(".midhigh").height()).toEqual(30)
      expect($(".high").height()).toEqual(40)

    it "should enable the graph", ->
      @view.drawGraph()
      expect(@view.graphAvailable).toBeTruthy()

    it "should setup the top label", ->
      AC.G.db_levels = [10, 20, 30, 40, 50]
      @view.drawGraph()
      expect($("#graph-label-top").html()).toEqual("50 dB")

    it "should setup the bottom label", ->
      AC.G.db_levels = [10, 20, 30, 40, 50]
      @view.drawGraph()
      expect($("#graph-label-bottom").html()).toEqual("10 dB")

  describe "updateLabels", ->
    it "should update the left label", ->
      @view.updateLabels(@plot)
      expect($("#graph-label-left").html()).toEqual(new Date(10).toString("HH:mm:ss"))

    it "should update the right label", ->
      @view.updateLabels(@plot)
      expect($("#graph-label-right").html()).toEqual(new Date(20).toString("HH:mm:ss"))

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

  describe "graph toggling", ->
    it "should not allow expanding the graph if many sessions are selected", ->
      @parent.numberOfSelected = -> 2

      @view.toggleGraph()

      expect($("#graph-box").css('display')).toEqual("none")

    it "should display a message if it is not available", ->
      spyOn(AC.util, "notice")
      @parent.numberOfSelected = -> 2

      @view.toggleGraph()

      expect(AC.util.notice).toHaveBeenCalledWith("Select one session to view the graph")

    it "should draw the graph if it is available", ->
      spyOn(@view, "drawGraph")
      @parent.numberOfSelected = -> 1

      @view.toggleGraph()

      expect(@view.drawGraph).toHaveBeenCalled()

  describe "disableGraph", ->
    beforeEach ->
      @view.graphAvailable = true

    it "should hide the graph", ->
      $("#graph-box").show()
      @view.disableGraph()
      expect($("#graph-box").css("display")).toEqual("none")

