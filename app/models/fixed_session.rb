include Rails.application.routes.url_helpers

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

  def generate_link(stream)
    data =
      { sensorId: stream.sensor_id,
        usernames: user.username,
        isIndoor: is_indoor,
        isStreaming: is_steaming,
        heat: { highest: stream.threshold_very_high,
                high: stream.threshold_high,
                mid: stream.threshold_medium,
                low: stream.threshold_low,
                lowest: stream.threshold_very_low },
      }

    fixed_map_path(:anchor => "?selectedSessionIds=#{[id].to_json}&data=#{data.to_json}")
  end

  private

  def is_steaming
    last_measurement_at > (Time.current - 1.hour)
  end
end
