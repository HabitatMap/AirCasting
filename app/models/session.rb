require_dependency 'aircasting/username_param'

class Session < ApplicationRecord
  self.skip_time_zone_conversion_for_attributes = %i[
    start_time_local
    end_time_local
  ]
  include AirCasting::FilterRange

  belongs_to :user
  has_many :streams, inverse_of: :session, dependent: :destroy
  has_many :measurements, through: :streams, inverse_of: :session
  has_many :notes, inverse_of: :session, dependent: :destroy

  validates :user, :uuid, :url_token, presence: true
  validates :start_time_local, presence: true
  validates :end_time_local, presence: true
  validates :type, presence: :true
  validates :url_token, :uuid, uniqueness: { case_sensitive: false }

  accepts_nested_attributes_for :notes, :streams

  before_validation :set_url_token, unless: :url_token

  delegate :username, to: :user

  acts_as_taggable

  scope :local_minutes_range,
        lambda { |minutes_from, minutes_to|
          unless Utils.whole_day?(minutes_from, minutes_to)
            field_in_minutes =
              lambda { |field|
                "(EXTRACT(HOUR FROM #{field}) * 60 + EXTRACT(MINUTE FROM #{
                  field
                }))"
              }

            where "
        (#{
                    field_in_minutes.call('start_time_local')
                  } BETWEEN :minutes_from AND :minutes_to)
        OR
        (#{
                    field_in_minutes.call('end_time_local')
                  } BETWEEN :minutes_from AND :minutes_to)
        OR
        (:minutes_from BETWEEN #{
                    field_in_minutes.call('start_time_local')
                  } AND #{field_in_minutes.call('end_time_local')})
      ",
                  minutes_from: minutes_from,
                  minutes_to: minutes_to
          end
        }

  scope :mobile, -> { where('sessions.type = ?', 'MobileSession') }
  scope :fixed, -> { where('sessions.type = ?', 'FixedSession') }

  def self.filter_(data = {})
    sessions =
      order('sessions.start_time_local DESC')
        .where(contribute: true)
        .joins(:user)

    tags = data[:tags].to_s.split(/[\s,]/)
    sessions = sessions.tagged_with(tags, any: true) if tags.present?

    usernames = AirCasting::UsernameParam.split(data[:usernames])
    if usernames.present?
      sessions = sessions.joins(:user).where(users: { username: usernames })
    end

    unless data[:is_indoor].nil?
      sessions = sessions.where(is_indoor: data[:is_indoor])
    end

    if data[:east] && data[:west] && data[:north] && data[:south]
      sessions = sessions.joins(:streams).merge(Stream.in_rectangle(data))
    end

    sensor_name = data[:sensor_name]
    if sensor_name.present?
      # this change in mysql->postgres affects performance, cause we need to compare lowercased strings
      # we can create a column with lowercased sensor_name and use it for comparison so its faster
      sessions = sessions.joins(:streams).where('LOWER(streams.sensor_name) IN (?)', Sensor.sensor_name(sensor_name))
    end

    unit_symbol = data[:unit_symbol]
    if unit_symbol.present?
      sessions =
        sessions.joins(:streams).where(streams: { unit_symbol: unit_symbol })
    end

    if data[:time_from] && data[:time_to]
      sessions =
        filter_by_time_range(sessions, data[:time_from], data[:time_to])
    end

    sessions.joins(:streams).where('streams.measurements_count > 0')
  end

  def self.filter_sessions_ids_and_streams(data = {})
    sessions = where('sessions.id IN (?)', data[:session_ids])

    sensor_name = data[:sensor_name]
    if sensor_name.present?
      sessions =
        sessions.joins(:streams).where(streams: { sensor_name: sensor_name })
    end

    unit_symbol = data[:unit_symbol]
    if unit_symbol.present?
      sessions =
        sessions.joins(:streams).where(streams: { unit_symbol: unit_symbol })
    end

    sessions
  end

  def self.filter_by_time_range(sessions, time_from, time_to)
    sessions
      .where(
        '(start_time_local BETWEEN :time_from AND :time_to)
      OR
      (end_time_local BETWEEN :time_from AND :time_to)
      OR
      (:time_from BETWEEN start_time_local AND end_time_local)',
        time_from: time_from,
        time_to: time_to,
      )
      .local_minutes_range(
        Utils.minutes_of_day(time_from),
        Utils.minutes_of_day(time_to),
      )
  end

  def self.session_methods
    %i[username streams]
  end

  def self.with_user_and_streams
    includes(:user, streams: [:threshold_set])
  end

  def to_param
    url_token
  end

  def west
    direction('MIN', 'longitude')
  end

  def east
    direction('MAX', 'longitude')
  end

  def north
    direction('MAX', 'latitude')
  end

  def south
    direction('MIN', 'latitude')
  end

  def as_json(opts = nil)
    opts ||= {}

    methods = opts[:methods] || %i[notes]
    methods << :type
    sensor_id = opts.delete(:sensor_id)

    res = super(opts.merge(methods: methods))

    map_of_streams = {}
    strs = sensor_id ? streams.includes(:threshold_set).where(sensor_name: sensor_id) : streams.includes(:threshold_set).all

    strs.each do |stream|
      stream_json = stream.as_json
      thresholds_json = stream.threshold_set.as_json(only: [:threshold_very_low, :threshold_low, :threshold_medium, :threshold_high, :threshold_very_high])

      stream_json.merge!(thresholds_json)

      if opts[:stream_measurements]
        if type == 'FixedSession'
          measurements_to_send =
            get_measurement_scope(stream.id, opts[:last_measurement_sync])
          map_of_streams[stream.sensor_name] =
            stream_json.merge('measurements' => measurements_to_send)
        else
          map_of_streams[stream.sensor_name] =
            stream_json.merge(
              'measurements' => stream.measurements.as_json(
                only: %i[time value latitude longitude]
              )
            )
        end
      else
        map_of_streams[stream.sensor_name] = stream_json
      end
    end

    res.merge!(
      'streams' => map_of_streams,
      'start_time' => self.start_time_local,
      'end_time' => self.end_time_local,
    )

    res
  end

  def sync(session_data)
    tag_list = session_data[:tag_list] || ''
    session_data =
      session_data.merge(tag_list: SessionBuilder.normalize_tags(tag_list))

    transaction do
      self.title = session_data[:title]
      self.tag_list = session_data[:tag_list]
      self.version += 1
      self.save!

      (session_data[:streams] || []).each do |key, stream_data|
        if stream_data[:deleted]
          streams
            .where(
              sensor_package_name: stream_data[:sensor_package_name],
              sensor_name: stream_data[:sensor_name],
            )
            .each(&:destroy)
        end
      end

      notes.where.not({ number: note_numbers(session_data) }).destroy_all

      session_data[:notes].each do |note_data|
        if note = notes.find_by_number(note_data[:number])
          note.update(note_data)
        else
          note = Note.new(note_data)
          note.session = self
          note.save
        end
      end
    end
  end

  def end_time_local=(time)
    super(convert_time(time))
  end

  def start_time_local=(time)
    super(convert_time(time))
  end

  def after_measurements_created; end

  def fixed?
    raise NotImplementedError, 'subclass did not define #fixed?'
  end

  private

  def get_measurement_scope(stream_id, since_date)
    if since_date
      data = { stream_id: stream_id, since_date: since_date }
      Measurement.unscoped.since(data).reverse.as_json
    else
      Measurement.unscoped.last_24_hours([stream_id]).reverse.as_json
    end
  end

  def convert_time(time)
    time = TimeToLocalInUTC.convert(time) if time.respond_to?(:strftime)
    time
  end

  def direction(min_or_max, longitude_or_latitude)
    measurements
      .select("#{min_or_max}(#{longitude_or_latitude}) AS val")
      .to_a
      .first
      .val
      .to_f
  end

  def set_url_token
    tg = TokenGenerator.new

    token =
      tg.generate_unique(5) do |token|
        Session.where(url_token: token).count.zero?
      end

    self.url_token = token
  end

  after_destroy :insert_into_deleted_sessions

  def insert_into_deleted_sessions
    DeletedSession.where(uuid: uuid, user_id: user.id).first_or_create!
  end

  def note_numbers(session_data)
    session_data[:notes].map { |note| note[:number] }
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
    session_type =
      case stream.session.type
      when 'MobileSession'
        'mobile'
      when 'FixedSession'
        'fixed'
      end

    encoded_params = {
      sessionId: session_id,
      streamId: stream_id,
      thresholdMin: threshold_min,
      thresholdLow: threshold_low,
      thresholdMiddle: threshold_middle,
      thresholdHigh: threshold_high,
      thresholdMax: threshold_max,
      sessionType: session_type,
      currentUserSettings: 'MODAL_VIEW',
      measurementType: CGI.escape(measurement_type),
      sensorName: 'AirBeam-PM2.5',
      unitSymbol: 'µg%2Fm³&',
      previousUserSettings: 'MAP_VIEW',
    }

    query_string = encoded_params.map { |k, v| "#{k}=#{v}" }.join("&")

    "#{Rails.application.routes.url_helpers.root_path}?#{query_string}"
  end

  # http://172.104.20.165/?sessionId=1852927&streamId=2499059&thresholdMin=0&thresholdLow=9&thresholdMiddle=35&thresholdHigh=55&thresholdMax=150&mapType=hybrid&sessionType=mobile&currentUserSettings=MODAL_VIEW&measurementType=Particulate+Matter&sensorName=AirBeamMini-PM2.5&unitSymbol=%C2%B5g%2Fm%C2%B3&previousUserSettings=MAP_VIEW&boundEast=62.65529757975303&boundWest=-18.549665664866804&boundNorth=63.50758877911437&boundSouth=37.79560187903995&currentCenter=%7B%22lat%22%3A52.48445841177986%2C%22lng%22%3A22.052815957443116%7D&currentZoom=5.055247580796485&fetchedSessions=8&previousCenter=%7B%22lat%22%3A52.48445841177986%2C%22lng%22%3A22.052815957443116%7D&previousZoom=5.055247580796485
  # http://172.104.20.165/?sessionId=1852927&streamId=2499059&thresholdMin=0&thresholdLow=9&thresholdMiddle=35&thresholdHigh=55&thresholdMax=150&mapType=hybrid&sessionType=mobile&currentUserSettings=MODAL_VIEW&measurementType=Particulate+Matter&sensorName=AirBeamMini-PM2.5&unitSymbol=%C2%B5g%2Fm%C2%B3&previousUserSettings=MAP_VIEW&boundEast=19.926286943&     boundWest=19.92628832&        boundNorth=50.058210236&     boundSouth=50.058211089


  # http://172.104.20.165/?sessionId=1849182&streamId=2495168&thresholdMin=0&thresholdLow=9 &thresholdMiddle=35&thresholdHigh=55&thresholdMax=150&currentUserSettings=MODAL_VIEW&sessionType=mobile&measurementType=Particulate+Matter&sensorName=AirBeam-PM2.5&unitSymbol=µg%2Fm³&          previousUserSettings=MAP_VIEW
                      #  /?sessionId=1852928&streamId=2499063&thresholdMin=0&thresholdLow=12&thresholdMiddle=35&thresholdHigh=55&thresholdMax=150&sessionType=mobile&currentUserSettings=MODAL_VIEW&measurementType=Particulate+Matter&sensorName=AirBeam-PM2.5&unitSymbol=%C2%B5g%2Fm%C2%B3&previousUserSettings=MAP_VIEW

end
