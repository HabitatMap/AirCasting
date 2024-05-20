class Stream < ApplicationRecord
  belongs_to :session

  has_many :measurements, dependent: :delete_all
  has_many :stream_daily_averages, dependent: :delete_all

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
      window_box =
        "ST_MakeEnvelope(#{data[:west]}, #{data[:south]}, #{data[:east]}, #{data[:north]}, 4326)"
      stream_box =
        'ST_MakeEnvelope(min_longitude, min_latitude, max_longitude, max_latitude, 4326)'

      where("ST_Contains(#{window_box}, #{stream_box})")
    end,
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
    end,
  )

  scope(:with_sensor, ->(sensor_name) { where(sensor_name: sensor_name) })

  scope(
    :with_unit_symbol,
    ->(unit_symbol) { where(unit_symbol: unit_symbol) if unit_symbol.present? },
  )

  scope(
    :with_measurement_type,
    ->(measurement_type) { where(measurement_type: measurement_type) },
  )

  scope(
    :only_contributed,
    -> { joins(:session).where('sessions.contribute = ?', true) },
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
    end,
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
    data = data.map(&:deep_symbolize_keys)
    factory = RGeo::Geographic.spherical_factory(srid: 4326)
    time_zone = time_zone(data)

    measurements =
      data.map do |params|
        longitude = params[:longitude].to_f
        latitude = params[:latitude].to_f
        location = factory.point(longitude, latitude)
        time_with_time_zone =
          params[:time].in_time_zone.change(zone: time_zone) if params[:time]

        Measurement.new(
          params.merge(
            stream: self,
            location: location,
            time_with_time_zone: time_with_time_zone,
          ),
        )
      end

    result = Measurement.import measurements
    if result.failed_instances.any?
      Rails
        .logger.warn "Measurement.import failed for: #{result.failed_instances}"
    end
    Stream.update_counters(
      self.id,
      measurements_count: measurements.size - result.failed_instances.size,
    )
  end

  # this change for migration mysql->posgres needs to be tested
  def self.thresholds(sensor_name, unit_symbol)
    subquery =
      select(
          "ARRAY_TO_STRING(ARRAY[threshold_very_low, threshold_low, threshold_medium, threshold_high, threshold_very_high], '-') as thresholds, COUNT(*) as thresholds_count",
        )
        .where(
          'LOWER(sensor_name) IN (?) AND unit_symbol = ?',
          Sensor.sensor_name(sensor_name),
          unit_symbol,
        )
        .group(
          "ARRAY_TO_STRING(ARRAY[threshold_very_low, threshold_low, threshold_medium, threshold_high, threshold_very_high], '-')",
        )
        .to_sql

    result =
      Stream
        .select('subquery.thresholds, subquery.thresholds_count')
        .from("(#{subquery}) as subquery")
        .order('subquery.thresholds_count DESC')
        .first

    result ? result.thresholds.split('-') : []
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

  private

  def time_zone(data)
    latitude = data.first[:latitude].to_f
    longitude = data.first[:longitude].to_f

    TimeZoneFinderWrapper.instance.time_zone_at(lat: latitude, lng: longitude)
  end
end
