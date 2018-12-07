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

require_dependency 'region_info'
require_dependency 'region_info2'

module Api
  class RegionsController < BaseController
    def show
      data = params.symbolize_keys
      [:north, :south, :east, :west].each do |direction|
        data[direction] = params[direction].to_f
      end

      respond_with RegionInfo.new(data)
    end

    FLOAT_Q_ATTRS = [:north, :south, :east, :west]
    INT_Q_ATTRS = [
      :time_from, :time_to,
      :day_from, :day_to,
      :year_from, :year_to,
      :grid_size_x, :grid_size_y
    ]

    def show2
      data = ActiveSupport::JSON.decode(params[:q]).symbolize_keys

      FLOAT_Q_ATTRS.each { |key| data[key] = data[key].to_f if data.key?(key) }
      INT_Q_ATTRS.each { |key| data[key] = data[key].to_i if data.key?(key) }

      data[:time_from] = data[:time_from] || 0
      data[:time_to] = data[:time_to] || 2359

      data[:day_from] = data[:day_from] || 0
      data[:day_to] = data[:day_to] || 365

      data[:year_from] = data[:year_from] || 2010
      data[:year_to] = data[:year_to] || 2050

      data[:session_ids] ||= []

      respond_with RegionInfo2.new(data)
    end
  end
end
