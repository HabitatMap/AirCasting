class FixedSession < Session
  ACTIVE_FOR = 24.hour

  validates :is_indoor, inclusion: { in: [true, false] }
  validates :latitude, :longitude, presence: true

  def self.active
    where('last_measurement_at > ?', Time.current - ACTIVE_FOR)
  end

  def self.dormant
    where('last_measurement_at <= ?', Time.current - ACTIVE_FOR)
  end

  def after_measurements_created
    update_end_time!
  end

  def update_end_time!
    self.end_time_local = self.measurements.maximum('time')
    self.last_measurement_at = DateTime.current
    self.save!
  end

  def as_synchronizable(
    stream_measurements = false,
    last_measurement_sync = nil
  )
    as_json(
      methods: %i[streams],
      stream_measurements: stream_measurements,
      last_measurement_sync: last_measurement_sync,
    )
  end

  def as_json(opts = nil)
    opts ||= {}

    methods = opts[:methods] || %i[notes]
    methods << :type

    res = super(opts.merge(methods: methods))
  end

  def fixed?
    true
  end

  def generate_link(stream)
    threshold_min = stream.threshold_set.threshold_very_low.to_i
    threshold_low = stream.threshold_set.threshold_low.to_i
    threshold_middle = stream.threshold_set.threshold_medium.to_i
    threshold_high = stream.threshold_set.threshold_high.to_i
    threshold_max = stream.threshold_set.threshold_very_high.to_i

    session_id = stream.session_id
    stream_id = stream.id
    measurement_type = stream.measurement_type
    sensor_name = stream.sensor_name
    unit_symbol = stream.unit_symbol

    query_string = {
      sessionId: session_id,
      streamId: stream_id,
      thresholdMin: threshold_min,
      thresholdLow: threshold_low,
      thresholdMiddle: threshold_middle,
      thresholdHigh: threshold_high,
      thresholdMax: threshold_max,
      currentUserSettings: 'MODAL_VIEW',
      mapType: 'hybrid',
      sessionType: 'fixed',
      measurementType: URI.encode_www_form_component(measurement_type).gsub('%20', '+'),
      sensorName: URI.encode_www_form_component(sensor_name).gsub('%20', '+'),
      unitSymbol: URI.encode_www_form_component(unit_symbol)
    }.to_query

    "#{Rails.application.routes.url_helpers.root_path}?#{query_string}"
  end

  # http://172.104.20.165/?sessionId=1850290&streamId=2496390&thresholdMin=0&thresholdLow=9&thresholdMiddle=35&thresholdHigh=55&thresholdMax=150&currentUserSettings=MODAL_VIEW&mapType=hybrid&sessionType=fixed&measurementType=Particulate+Matter&sensorName=Government-PM2.5&unitSymbol=%C2%B5g%2Fm%C2%B3
                          # /?currentUserSettings=MODAL_VIEW&mapType=hybrid&measurementType=Particulate%2BMatter&sensorName=AirBeam3-PM2.5&sessionId=1852929&sessionType=fixed&streamId=2499069&thresholdHigh=55&thresholdLow=12&thresholdMax=150&thresholdMiddle=35&thresholdMin=0&unitSymbol=%25C2%25B5g%252Fm%25C2%25B3
  def is_active
    last_measurement_at > (Time.current - ACTIVE_FOR)
  end
end
