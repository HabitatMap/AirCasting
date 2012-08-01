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

module AirCasting
  module DeepSymbolize
    def deep_symbolize(obj)
      if obj.respond_to?(:symbolize_keys)
        data = obj.symbolize_keys.map { |k, v| [k, deep_symbolize(v)]}
        Hash[data]
      elsif obj.respond_to?(:map)
        obj.map { |x| deep_symbolize(x) }
      else
        obj
      end
    end
  end
end
