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

require_dependency 'average_info'

module Api
  class AveragesController < BaseController
    FLOAT_Q_ATTRS = %i[north south east west]
    INT_Q_ATTRS = %i[time_from time_to grid_size_x grid_size_y]

    def index
      if params[:q].is_a?(String)
        data = ActiveSupport::JSON.decode(params[:q]).symbolize_keys
      else
        data = params.to_unsafe_hash[:q].symbolize_keys
      end
      FLOAT_Q_ATTRS.each { |key| data[key] = data[key].to_f if data.key?(key) }
      INT_Q_ATTRS.each { |key| data[key] = data[key].to_i if data.key?(key) }

      data[:time_from] = data[:time_from] || Time.new(2_010).to_i
      data[:time_to] = data[:time_to] || Time.new(2_100).end_of_year.to_i

      data[:session_ids] ||= []

      respond_with AverageInfo.new(data)
    end
  end
end
