class Measurement < ApplicationRecord
  self.skip_time_zone_conversion_for_attributes = %i[time]

  include AirCasting::FilterRange

  Y_SIZES = (1..300).map { |i| 1.2**i * 0.000001 }
  FIXED_MEASUREMENTS_IN_A_DAY = 1_440

  belongs_to :stream, inverse_of: :measurements, counter_cache: true
  has_one :session, through: :stream
  has_one :user, through: :session

  validates :stream_id, :value, :longitude, :latitude, :location, :time, presence: true
  validate :time_not_in_the_future


  prepare_range(:longitude_range, 'measurements.longitude')
  prepare_range(:latitude_range, 'measurements.latitude')

  geocoded_by :address # field doesn't exist, call used for .near scope inclusion only

  default_scope { order('time ASC') }

  scope(
    :belonging_to_sessions_with_ids,
    lambda do |session_ids|
      joins(:stream).where(streams: { session_id: session_ids })
    end
  )

  scope(
    :with_tags,
    lambda do |tags|
      if tags.present?
        sessions_ids = Session.select('sessions.id').tagged_with(tags).map(&:id)
        if sessions_ids.present?
          joins(:stream).where(
            streams: {
              session_id: sessions_ids.compact.uniq
            }
          )
        end
      end
    end
  )

  scope(:with_streams, ->(stream_ids) { where(stream_id: stream_ids) })

  scope(
    :last_24_hours,
    lambda do |stream_ids|
      with_streams(stream_ids)
        .order('time DESC')
        .limit(FIXED_MEASUREMENTS_IN_A_DAY)
    end
  )

  scope(
    :since,
    lambda do |data|
      with_streams(data[:stream_id])
        .order('time DESC')
        .where('time > ?', data[:since_date])
    end
  )

  scope(
    :in_rectangle,
    lambda do |data|
      if data[:west] > data[:east]
        west_box = "ST_MakeEnvelope(#{data[:west]}, #{data[:south]}, 180, #{data[:north]}, 4326)"
        east_box = "ST_MakeEnvelope(-180, #{data[:south]}, #{data[:east]}, #{data[:north]}, 4326)"

        where("ST_Intersects(location, #{west_box}) OR ST_Intersects(location, #{east_box})")
      else
        bounding_box = "ST_MakeEnvelope(#{data[:west]}, #{data[:south]}, #{data[:east]}, #{data[:north]}, 4326)"
        where("ST_Intersects(location, #{bounding_box})")
      end
    end
  )

  scope(
    :with_time,
    lambda do |data|
      time_from = Time.strptime(data[:time_from].to_s, '%s')
      time_to = Time.strptime(data[:time_to].to_s, '%s')

      where('DATE(time) >= ?', time_from.beginning_of_day)
        .where('DATE(time) <= ?', time_to.end_of_day)
        .minutes_range(
          Utils.minutes_of_day(time_from),
          Utils.minutes_of_day(time_to)
        )
    end
  )

  scope(
    :with_time2,
    lambda do |data|
      time_from = Time.strptime(data[:time_from].to_s, '%s')
      time_to = Time.strptime(data[:time_to].to_s, '%s')

      where(time: time_from..time_to)
    end
  )
  prepare_range(
    :time_range,
    '(EXTRACT(HOUR FROM time) * 60 + EXTRACT(MINUTE FROM time))'
  )
  prepare_range(
    :day_range,
    '(DAYOFYEAR(DATE_ADD(time, INTERVAL (YEAR(NOW()) - YEAR(time)) YEAR)))'
  )
  prepare_range(:year_range, :time)

  scope(
    :minutes_range,
    lambda do |minutes_from, minutes_to|
      unless Utils.whole_day?(minutes_from, minutes_to)
        field_in_minutes =
          lambda do |field|
            "(EXTRACT(HOUR FROM #{field}) * 60 + EXTRACT(MINUTE FROM #{field}))"
          end

        where("#{field_in_minutes.call('time')} >= ?", minutes_from).where(
          "#{field_in_minutes.call('time')} <= ?",
          minutes_to
        )
      end
    end
  )

  def as_indexed_json(options = {})
    as_json(options).merge(
      day_of_year: time.yday,
      minutes_of_day: (time.seconds_since_midnight / 60).to_i,
      year: time.year
    )
  end

  def as_json(options = {})
    # temporary solution until columns are removed from schema
    super(options.merge(except: %i[timezone_offset]))
  end

    # due to a firmware bug in AirBeams some measurements come in with a future timestamp
    # please refer to: https://trello.com/c/HjEIuSYU/1616-fixed-ab-future-timestamps-problem
  def time_not_in_the_future
    if self.time && self.time > 48.hours.from_now
      errors.add(:time, 'time cannot be more than 48 hours in the future')
    end
  end
end
