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

describe "AC.util", ->
  describe "dbRangePercentages", ->
    it "should return ranges as percentages", ->
      AC.G.db_levels = [20, 40, 80, 200, 220]
      expect(AC.util.dbRangePercentages()).toEqual([10, 20, 60, 10])

    it "should round", ->
      AC.G.db_levels = [0, 25, 50, 75, 103]
      expect(AC.util.dbRangePercentages()).toEqual([24, 24, 24, 27])
