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

describe "RegionView", ->
  beforeEach ->
    $("<div id='test'></div>").appendTo('body')
    @data = "Some data"
    @view = new AirCasting.Views.Maps.RegionView(el: $("#test"), region: @data)

  afterEach ->
    $("#test").remove()

  describe "render", ->
    it "it should fetch the proper region", ->
      spyOn(@view.region, "setUrlParams")
      spyOn(@view.region, "fetch")

      @view.render()

      expect(@view.region.setUrlParams).toHaveBeenCalledWith(@data)

    it "should render it's template", ->
      spyOn(@view, "template").andReturn("Some html")
      spyOn(@view.region, "fetch").andCallFake (option) =>
        option.success("Model after response", "Some response")

      @view.render()

      expect(@view.template).toHaveBeenCalledWith(region: "Model after response")
      expect($("#test").html()).toEqual("Some html")

