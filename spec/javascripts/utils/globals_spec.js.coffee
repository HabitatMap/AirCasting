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

describe "AC.G", ->
  beforeEach ->
    @sensor = new AirCasting.Models.Sensor(
      measurement_type: "hadrons"
      sensor_name: "LHC"
      threshold_very_low: 1
      threshold_low: 2
      threshold_medium: 3
      threshold_high: 4
      threshold_very_high: 5
    )
    AC.G.resetThresholds(@sensor)
  describe "getThreshold", ->
    it "should return values from the sensor by default", ->
      expect(AC.G.getThresholds(@sensor)).toEqual([1,2,3,4,5])

  describe "saveThresholds", ->
    it "should override the defaults", ->
      AC.G.saveThresholds(@sensor, [2,3,4,5,6])
      expect(AC.G.getThresholds(@sensor)).toEqual([2,3,4,5,6])

    it "should override the defaults per sensor", ->
      AC.G.saveThresholds(@sensor, [2,3,4,5,6])
      @sensor.set("sensor_name", "LHC2")
      expect(AC.G.getThresholds(@sensor)).toEqual([1,2,3,4,5])

describe "AC.util", ->
  describe "dbRangePercentages", ->
    it "should return ranges as percentages", ->
      spyOn(AC.G, "getThresholds").andReturn([20, 40, 80, 200, 220])
      expect(AC.util.dbRangePercentages()).toEqual([10, 20, 60, 10])

    it "should round", ->
      spyOn(AC.G, "getThresholds").andReturn([20, 60, 70, 80, 100])
      expect(AC.util.dbRangePercentages()).toEqual([50, 13, 13, 24])
