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

class Stream < ApplicationRecord
  belongs_to :session

  has_many :measurements, dependent: :delete_all

  delegate :size, to: :measurements

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
            :threshold_very_high,
            presence: true

  attr_accessor :deleted

  scope(
    :in_rectangle,
    lambda do |data|
      latitude_operator = data[:south] < data[:north] ? 'AND' : 'OR'
      longitude_operator = data[:west] < data[:east] ? 'AND' : 'OR'

      where(
        '(:south >= min_latitude AND :south <= max_latitude) ' \
          'OR ' \
          '(:north >= min_latitude AND :north <= max_latitude) ' \
          'OR ' \
          "(min_latitude >= :south #{
            latitude_operator
          } min_latitude <= :north) " \
          'OR ' \
          "(max_latitude >= :south #{
            latitude_operator
          } max_latitude <= :north)",
        south: data[:south], north: data[:north]
      )
        .where(
        '(:west >= min_longitude AND :west <= max_longitude) ' \
          'OR ' \
          '(:east >= min_longitude AND :east <= max_longitude) ' \
          'OR ' \
          "(min_longitude >= :west #{
            longitude_operator
          } min_longitude <= :east) " \
          'OR ' \
          "(max_longitude >= :west #{
            longitude_operator
          } max_longitude <= :east)",
        west: data[:west], east: data[:east]
      )
    end
  )

  scope(
    :with_tags,
    lambda do |tags|
      if tags.present?
        session_ids =
          Session.tagged_with(tags).where('sessions.id IS NOT NULL').pluck(
            'DISTINCT sessions.id'
          )
        where(session_id: session_ids) if session_ids.present?
      end
    end
  )

  scope(:with_sensor, ->(sensor_name) { where(sensor_name: sensor_name) })

  scope(
    :with_unit_symbol,
    ->(unit_symbol) { where(unit_symbol: unit_symbol) if unit_symbol.present? }
  )

  scope(
    :with_measurement_type,
    ->(measurement_type) { where(measurement_type: measurement_type) }
  )

  scope(
    :only_contributed,
    -> { joins(:session).where('sessions.contribute = ?', true) }
  )

  scope(
    :belong_to_mobile_sessions,
    -> { joins(:session).where('sessions.type = ?', 'MobileSession') }
  )

  scope(
    :with_usernames,
    lambda do |usernames|
      if usernames.present?
        user_ids =
          User.select('users.id').where('users.username IN (?)', usernames).map(
            &:id
          )
        joins(:session).where(sessions: { user_id: user_ids })
      end
    end
  )

  def sensor_id
    "#{measurement_type}-#{sensor_name.downcase} (#{unit_symbol})"
  end

  def self.build!(data = {})
    measurements = data.delete(:measurements)
    stream = create!(data)
    MeasurementsCreator.new.call(stream, measurements)
    stream
  end

  def self.build_or_update!(data = {})
    measurements_attributes = data.delete(:measurements)
    stream = where(data).first_or_initialize
    latitude = measurements_attributes.first.fetch(:latitude)
    longitude = measurements_attributes.first.fetch(:longitude)

    stream.set_bounding_box(latitude, longitude) unless stream.has_bounds?
    stream.save!

    MeasurementsCreator.new.call(stream, measurements_attributes)
    stream
  end

  def build_measurements!(data = [], jid = nil)
    measurements =
      data.map do |measurement_data|
        m = Measurement.new(measurement_data)
        m.stream = self
        m
      end

    ActiveRecord::Base.transaction do
      result = Measurement.import measurements
      raise 'Measurement import failed!' unless result.failed_instances.empty?
    end

    Stream.update_counters(self.id, { measurements_count: measurements.size })
  end

  def self.sensors
    joins(:session).where('sessions.contribute' => true).select(
      :sensor_name,
      :measurement_type,
      'MIN(threshold_very_low) as threshold_very_low',
      'MIN(threshold_low) as threshold_low',
      :unit_symbol,
      'MIN(threshold_medium) as threshold_medium',
      'MAX(threshold_high) as threshold_high',
      'MAX(threshold_very_high) as threshold_very_high',
      'count(*) as session_count'
    )
      .group(:sensor_name, :measurement_type, :unit_symbol)
      .map { |stream| stream.attributes.symbolize_keys }
  end

  def self.thresholds(sensor_name, unit_symbol)
    select(
      "CONCAT_WS('-', threshold_very_low, threshold_low, threshold_medium, threshold_high, threshold_very_high) as thresholds, COUNT(*) as thresholds_count"
    )
      .where(sensor_name: sensor_name, unit_symbol: unit_symbol)
      .order('thresholds_count DESC')
      .group(:thresholds)
      .first
      .thresholds
      .split('-')
  end

  def as_json(opts = nil)
    opts ||= {}

    methods = opts[:methods] || []
    methods += %i[size]

    super(opts.merge(methods: methods))
  end

  def after_measurements_created
    self.session.after_measurements_created
  end

  def set_bounding_box(latitude, longitude)
    self.min_latitude = latitude
    self.max_latitude = latitude
    self.min_longitude = longitude
    self.max_longitude = longitude
  end

  def has_bounds?
    max_latitude.present? && min_latitude.present? && max_longitude.present? &&
      min_longitude.present?
  end
end
