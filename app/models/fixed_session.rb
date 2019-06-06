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

class FixedSession < Session
  validates :is_indoor, inclusion: { in: [true, false] }
  validates :latitude, :longitude, presence: true

  def self.streaming
    where("last_measurement_at > ?", Time.current - 1.hour)
  end

  def self.dormant
    where("last_measurement_at <= ?", Time.current - 1.hour)
  end

  def self.all_dormant(data, limit, offset)
    dormant
    .offset(offset)
    .limit(limit)
    .with_user_and_streams
    .filter_(data)
    .as_json(
      only: filtered_json_fields,
      methods: [:username, :streams]
    )
  end

  def self.filtered_json_fields
    [:id, :title, :start_time_local, :end_time_local, :is_indoor, :latitude, :longitude]
  end

  def self.filtered_streaming_json(data)
    streaming
    .with_user_and_streams
    .filter_(data)
    .as_json(
      only: filtered_json_fields,
      methods: [:username, :streams, :last_hour_average]
    )
  end

  def self.selected_sessions_json(data)
    filter_sessions_ids_and_streams(data)
    .with_user_and_streams
    .as_json(
      only: filtered_json_fields,
      methods: [:username, :streams, :last_hour_average]
    )
  end

  def after_measurements_created
    update_end_time!
  end

  def update_end_time!
    # Measurement.time is a local time, so this are both local end times:
    self.end_time = self.measurements.maximum('time')
    self.end_time_local = self.measurements.maximum('time')
    self.last_measurement_at = DateTime.current
    self.save!
  end

  def last_hour_average
    stream = self.streams.length >= 1 ? self.streams.first : nil
    return unless stream

    last_measurement_time = stream.measurements.last.time
    measurements = stream.measurements.where(time: last_measurement_time - 1.hour..last_measurement_time)
    measurements.average(:value)
  end

  def as_synchronizable(stream_measurements=false, last_measurement_sync=nil)
    as_json(
      methods: [:streams],
      stream_measurements: stream_measurements,
      last_measurement_sync: last_measurement_sync
    )
  end

  def as_json(opts=nil)
    opts ||= {}

    methods = opts[:methods] || [:notes]
    methods << :type

    res = super(opts.merge(methods: methods))
  end

  def fixed?
    true
  end
end
