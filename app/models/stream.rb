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
        south: data[:south],
        north: data[:north]
      ).where(
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
        west: data[:west],
        east: data[:east]
      )
    end
  )

  scope(
    :with_tags,
    lambda do |tags|
      if tags.present?
        session_ids =
          Session
            .tagged_with(tags)
            .where('sessions.id IS NOT NULL')
            .pluck('DISTINCT sessions.id')
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

  scope(:mobile, -> { joins(:session).merge(Session.mobile) })
  scope(:fixed, -> { joins(:session).merge(Session.fixed) })

  scope(
    :with_usernames,
    lambda do |usernames|
      if usernames.present?
        user_ids =
          User
            .select('users.id')
            .where('users.username IN (?)', usernames)
            .map(&:id)
        joins(:session).where(sessions: { user_id: user_ids })
      end
    end
  )

  def fixed?
    session.fixed?
  end

  def sensor_id
    "#{measurement_type}-#{sensor_name.downcase} (#{unit_symbol})"
  end

  def self.build_or_update!(data = {})
    measurements_attributes = data.delete(:measurements)
    stream = where(data).first_or_initialize
    latitude = measurements_attributes.first.fetch(:latitude)
    longitude = measurements_attributes.first.fetch(:longitude)

    stream.set_bounding_box(latitude, longitude) unless stream.has_bounds?
    stream.average_value = measurements_attributes.last.fetch(:value)
    stream.save!

    MeasurementsCreator.new.call(stream, measurements_attributes)
    stream
  end

  def build_measurements!(data = [])
    measurements = data.
      map { |params| Measurement.new(params.merge(stream: self)) }
    result = Measurement.import measurements
    if result.failed_instances.any?
      Rails.logger.warn "Measurement.import failed for: #{result.failed_instances}"
    end
    Stream.update_counters(self.id, measurements_count: measurements.size - result.failed_instances.size)
  end

  # this change for migration mysql->posgres needs to be tested
  def self.thresholds(sensor_name, unit_symbol)

    subquery = select(
      "ARRAY_TO_STRING(ARRAY[threshold_very_low, threshold_low, threshold_medium, threshold_high, threshold_very_high], '-') as thresholds, COUNT(*) as thresholds_count"
    )
    .where('LOWER(sensor_name) IN (?) AND unit_symbol = ?', Sensor.sensor_name(sensor_name), unit_symbol)
    .group("ARRAY_TO_STRING(ARRAY[threshold_very_low, threshold_low, threshold_medium, threshold_high, threshold_very_high], '-')")
    .to_sql

    result = Stream.select("subquery.thresholds, subquery.thresholds_count")
      .from("(#{subquery}) as subquery")
      .order('subquery.thresholds_count DESC')
      .first

    if result
      result.thresholds.split('-')
    else
      []
    end
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
