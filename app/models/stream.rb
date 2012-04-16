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

class Stream < ActiveRecord::Base
	belongs_to :session

	has_many :measurements, :dependent => :destroy

	delegate :size, :to => :measurements

	def self.build!(data = {})
		measurements = data.delete(:measurements)
		Stream.transaction do
			result = create!(data)
			result.build_measurements!(measurements)
			result
		end
	end

	def build_measurements!(data = [])
		measurements = data.map do |measurement_data| 
			m = Measurement.new(measurement_data)
			m.stream = self
			m.set_timezone_offset
			m
		end

		result = Measurement.import measurements
		raise "Measurement import failed!" unless result.failed_instances.empty?
		Stream.update_counters(self.id, { :measurements_count => measurements.size })
	end

	def as_json(opts=nil)
		opts ||= {}

		methods = opts[:methods] || []
		methods += [:size]

		super(opts.merge(:methods => methods))
	end

end