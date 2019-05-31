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

require_dependency 'aircasting/username_param'

class Session < ActiveRecord::Base
  self.skip_time_zone_conversion_for_attributes = [:start_time_local, :end_time_local]
  include AirCasting::FilterRange

  belongs_to :user
  has_many :measurements, :through => :streams, :inverse_of => :session
  has_many :notes, :inverse_of => :session, :dependent => :destroy
  has_many :streams, :inverse_of => :session, :dependent => :destroy

  validates :user, :uuid, :url_token, :presence => true
  validates :start_time, :presence => true
  validates :start_time_local, :presence => true
  validates :end_time, :presence => true
  validates :end_time_local, :presence => true
  validates :url_token, :uuid, :uniqueness => true
  validates :type, :presence => :true

  accepts_nested_attributes_for :notes, :streams

  before_validation :set_url_token, :unless => :url_token

  delegate :username, :to => :user

  acts_as_taggable

  scope :local_minutes_range, lambda { |minutes_from, minutes_to|
    unless Utils.whole_day?(minutes_from, minutes_to)
      field_in_minutes = lambda { |field|
        "(EXTRACT(HOUR FROM #{field}) * 60 + EXTRACT(MINUTE FROM #{field}))"
      }

      where "
        (#{field_in_minutes.call('start_time_local')} BETWEEN :minutes_from AND :minutes_to)
        OR
        (#{field_in_minutes.call('end_time_local')} BETWEEN :minutes_from AND :minutes_to)
        OR
        (:minutes_from BETWEEN #{field_in_minutes.call('start_time_local')} AND #{field_in_minutes.call('end_time_local')})
      ", :minutes_from => minutes_from, :minutes_to => minutes_to
    end
  }

  def self.filter(data={})
    sessions = order("sessions.created_at DESC")
    .where("contribute = true OR sessions.id in (?)", data[:session_ids])
    .joins(:user)

    tags = data[:tags].to_s.split(/[\s,]/)
    if tags.present?
      sessions = sessions.tagged_with(tags, :any => true)
    end

    usernames = AirCasting::UsernameParam.split(data[:usernames])
    if usernames.present?
      sessions = sessions.joins(:user).where(:users => {:username => usernames})
    end

    sessions = sessions.where(is_indoor: data[:is_indoor]) unless data[:is_indoor].nil?

    if data[:east] && data[:west] && data[:north] && data[:south]
      sessions = sessions.joins(:streams).merge(Stream.in_rectangle(data))
    end

    sensor_name = data[:sensor_name]
    if sensor_name.present?
      sessions = sessions.joins(:streams).where(:streams => {:sensor_name =>  sensor_name})
    end

    unit_symbol = data[:unit_symbol]
    if unit_symbol.present?
      sessions = sessions.joins(:streams).where(:streams => {:unit_symbol =>  unit_symbol})
    end

    if data[:time_from] && data[:time_to]
      sessions = filter_by_time_range(sessions, data[:time_from], data[:time_to])
    end

    sessions.joins(:streams).where("streams.measurements_count > 0")
  end

  def self.filter_sessions_ids_and_streams(data={})
    sessions = where("sessions.id IN (?)", data[:session_ids])

    sensor_name = data[:sensor_name]
    if sensor_name.present?
      sessions = sessions.joins(:streams).where(:streams => {:sensor_name =>  sensor_name})
    end

    unit_symbol = data[:unit_symbol]
    if unit_symbol.present?
      sessions = sessions.joins(:streams).where(:streams => {:unit_symbol =>  unit_symbol})
    end

    sessions
  end

  def self.filter_by_time_range(sessions, time_from, time_to)
    sessions.where(
      "(start_time_local BETWEEN :time_from AND :time_to)
      OR
      (end_time_local BETWEEN :time_from AND :time_to)
      OR
      (:time_from BETWEEN start_time_local AND end_time_local)",
      :time_from => time_from, :time_to => time_to)
      .local_minutes_range(Utils.minutes_of_day(time_from), Utils.minutes_of_day(time_to))
  end

  def self.selected_sessions_json(data)
    where("id IN (?)", data[:session_ids])
    .with_user_and_streams
    .as_json(
      only: filtered_json_fields,
      methods: session_methods
    )
  end

  def self.session_methods
    [:username, :streams]
  end

  def self.with_user_and_streams
    includes(:user).includes(:streams)
  end

  def to_param
    url_token
  end

  def west
    direction("MIN", "longitude")
  end

  def east
    direction("MAX", "longitude")
  end

  def north
    direction("MAX", "latitude")
  end

  def south
    direction("MIN", "latitude")
  end

  def as_json(opts=nil)
    opts ||= {}

    methods = opts[:methods] || [:notes]
    methods << :type
    sensor_id = opts.delete(:sensor_id)

    # temporary solution until columns are removed from schema
    except = [:calibration, :offset_60_db, :description, :phone_model, :os_version, :timezone_offset]
    res = super(opts.merge(:methods => methods).merge(except: except))

    map_of_streams = {}
    strs = sensor_id ? streams.where(sensor_name: sensor_id) : streams.all

    strs.to_a.each do |stream|
      if opts[:stream_measurements]
        if type == "FixedSession"
          measurements_to_send = get_measurement_scope(stream.id, opts[:last_measurement_sync])
          map_of_streams[stream.sensor_name] = stream.as_json.merge("measurements" => measurements_to_send).as_json
        else
          map_of_streams[stream.sensor_name] = stream.as_json(include: { measurements: { only: [:time, :value, :latitude, :longitude] } })
        end
      else
        map_of_streams[stream.sensor_name] = stream.as_json
      end
    end

    res.merge!("streams" => map_of_streams)

    res
  end

  def sync(session_data)
    tag_list = session_data[:tag_list] || ""
    session_data = session_data.merge(:tag_list => SessionBuilder.normalize_tags(tag_list))

    transaction do
      self.title = session_data[:title]
      self.tag_list = session_data[:tag_list]
      self.save!

      (session_data[:streams] || []).each do |key, stream_data|
        if stream_data[:deleted]
          streams.where(
            :sensor_package_name => stream_data[:sensor_package_name],
            :sensor_name => stream_data[:sensor_name]
          ).each(&:destroy)
        end
      end

      notes.where.not({ number: note_numbers(session_data) }).destroy_all

      session_data[:notes].each do |note_data|
        if note = notes.find_by_number(note_data[:number])
          note.update_attributes(note_data)
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

  def after_measurements_created
  end

  def fixed?
    raise NotImplementedError, "subclass did not define #fixed?"
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
    if time.respond_to?(:strftime)
      time = TimeToLocalInUTC.convert(time)
    end
    time
  end

  def direction(min_or_max, longitude_or_latitude)
    measurements.select("#{min_or_max}(#{longitude_or_latitude}) AS val").to_a.first.val.to_f
  end

  def set_url_token
    tg = TokenGenerator.new

    token = tg.generate_unique(5) do |token|
      Session.where(:url_token => token).count.zero?
    end

    self.url_token = token
  end

  after_destroy :insert_into_deleted_sessions

  def insert_into_deleted_sessions
    DeletedSession.where(:uuid => uuid, :user_id => user.id).first_or_create!
  end

  def note_numbers(session_data)
    session_data[:notes].map{ |note| note[:number] }
  end
end
