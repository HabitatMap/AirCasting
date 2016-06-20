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

class Measurement < ActiveRecord::Base
  self.skip_time_zone_conversion_for_attributes = [:time]

  include AirCasting::FilterRange

  Y_SIZES = (1..300).map { |i| 1.2 ** i * 0.000001 }
  SECONDS_IN_MINUTE = 60

  # belongs_to :session, :through => :stream, :inverse_of => :measurements, :counter_cache => true
  belongs_to :stream, :inverse_of =>:measurements, :counter_cache => true
  has_one :session, :through => :stream
  has_one :user, :through => :session

  validates :stream_id, :value, :longitude, :latitude, :time, :presence => true

  prepare_range(:longitude_range, 'measurements.longitude')
  prepare_range(:latitude_range, 'measurements.latitude')
  prepare_range(:time_range, "(EXTRACT(HOUR FROM time) * 60 + EXTRACT(MINUTE FROM time))")
  prepare_range(:day_range, "(DAYOFYEAR(time))")
  prepare_range(:year_range, :time)

  geocoded_by :address # field doesn't exist, call used for .near scope inclusion only

  before_validation :set_timezone_offset

  default_scope { order("time ASC") }

  scope(:with_tags, lambda do |tags|
    if tags.present?
      sessions_ids = Session.select("sessions.id").tagged_with(tags).map(&:id)
      if sessions_ids.present?
        joins(:stream).where(:streams => {:session_id => sessions_ids.compact.uniq})
      end
    end
  end)

  scope(:with_streams, lambda do |stream_ids|
    where(:stream_id => stream_ids)
  end)

  scope(:in_rectangle, lambda do |data|
    latitude_range(data[:south], data[:north]).
      longitude_range(data[:west], data[:east])
  end)

  scope(:with_time, lambda do |data|
    day_range(data[:day_from], data[:day_to]).
      time_range(data[:time_from], data[:time_to]).
      year_range(Date.new(data[:year_from].to_i),Date.new(data[:year_to].to_i + 1) - 1)
  end)

  def set_timezone_offset
    if time_before_type_cast
      self.timezone_offset = time_before_type_cast.to_datetime.utc_offset / SECONDS_IN_MINUTE
    end
  end

  def as_indexed_json(options={})
    as_json(options).merge(
      day_of_year: time.yday,
      minutes_of_day: (time.seconds_since_midnight / 60).to_i,
      year: time.year
    )
  end
end
