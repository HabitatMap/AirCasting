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

describe "CrowdMapView", ->
  beforeEach ->
    @googleMap = new jasmine.Spy("MapWrapper")
    @googleMap.map = new jasmine.Spy("Map")
    @options = { googleMap: @googleMap, mapState: {} }
    @view = new AirCasting.Views.Maps.CrowdMapView(@options)

  describe "#initialize", ->
    it "should hide the info window on zoom change", ->
      spyOn(@view, "hideRegionInfo")
      spyOn(google.maps.event, "addListener").andCallFake (map, event, listener) =>
        expect(map).toEqual(@googleMap.map)
        listener() if event == "zoom_changed"

      @view.initialize(@options)

      expect(@view.hideRegionInfo).toHaveBeenCalled()

  describe "#hideRegionInfo", ->
    it "should hide the region info bubble", ->
      spyOn(@view.infoWindow, "close")
      @view.hideRegionInfo()
      expect(@view.infoWindow.close).toHaveBeenCalled()
