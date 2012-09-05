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

  validates :sensor_name,
     :sensor_package_name,
     :unit_name,
     :measurement_type,
     :measurement_short_type,
     :unit_symbol,
     :threshold_very_low,
     :threshold_low,
     :threshold_medium,
     :threshold_high,
     :threshold_very_high, :presence => true

  attr_accessor :deleted

  scope(:in_rectangle, lambda do |data|
    where(
      "(min_latitude >= ? AND min_latitude <= ? OR " \
      "max_latitude >= ? AND max_latitude <= ?)",
      data[:south], data[:north],
      data[:south], data[:north]
    ).
    where(
      "(min_longitude >= ? AND min_longitude <= ? OR " \
      "max_longitude >= ? AND max_longitude <= ?)",
      data[:west], data[:east],
      data[:west], data[:east]
    )
  end)

  def self.build!(data = {})
    measurements = data.delete(:measurements)

    Stream.transaction do
      stream = create!(data)
      stream.build_measurements!(measurements)

      if stream.measurements.count > 0
        stream.calc_bounding_box! if stream.min_latitude.nil?
        stream.calc_average_value! if stream.average_value.nil?
      end

      stream
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

  def self.sensors
    select("sensor_name, measurement_type, threshold_very_low, threshold_low, unit_symbol,
           threshold_medium, threshold_high, threshold_very_high, count(*) as session_count").
      group(:sensor_name, :measurement_type).
      map { |stream| stream.attributes.symbolize_keys }
  end

  def self.thresholds(sensor_name)
    select("CONCAT_WS('-', threshold_very_low, threshold_low, threshold_medium, threshold_high, threshold_very_high) as thresholds, COUNT(*) as thresholds_count").
    where(:sensor_name => sensor_name).
    order("thresholds_count DESC").
    group(:thresholds).first.thresholds.split("-")
  end

  def as_json(opts=nil)
    opts ||= {}

    methods = opts[:methods] || []
    methods += [:size]

    super(opts.merge(:methods => methods))
  end

  def calc_bounding_box!
    self.min_latitude = measurements.minimum(:latitude)
    self.max_latitude = measurements.maximum(:latitude)
    self.min_longitude = measurements.minimum(:longitude)
    self.max_longitude = measurements.maximum(:longitude)
    save!
  end

  def calc_average_value!
    self.average_value = measurements.average(:value)
    save!
  end
end
