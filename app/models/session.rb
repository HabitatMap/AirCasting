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

require_dependency 'aircasting/wrong_coordinates_error'
require_dependency 'aircasting/username_param'

class Session < ActiveRecord::Base
  self.skip_time_zone_conversion_for_attributes = [:start_time_local, :end_time_local]
  include AirCasting::FilterRange

  MINUTES_IN_DAY = 60 * 24

  belongs_to :user
  has_many :measurements, :through => :streams, :inverse_of => :session
  has_many :notes, :inverse_of => :session, :dependent => :destroy
  has_many :streams, :inverse_of => :session, :dependent => :destroy

  validates :user, :uuid, :url_token, :calibration, :offset_60_db, :presence => true
  validates :start_time, :presence => true
  validates :start_time_local, :presence => true
  validates :end_time, :presence => true
  validates :end_time_local, :presence => true
  validates :url_token, :uuid, :uniqueness => true
  validates_inclusion_of :offset_60_db, :in => -5..5
  validates :type, :presence => :true

  prepare_range(:start_year_range, :start_time)

  accepts_nested_attributes_for :notes, :streams

  before_validation :set_url_token, :unless => :url_token

  delegate :username, :to => :user

  acts_as_taggable

  attr_accessible :uuid, :calibration, :offset_60_db, :title, :description, :tag_list,
  :contribute, :notes_attributes, :data_type, :instrument, :phone_model,
  :os_version, :user, :start_time, :end_time, :start_time_local, :end_time_local, :type,
  :is_indoor, :latitude, :longitude
  attr_accessible :title, :description, :tag_list, :as => :sync

  scope :local_time_range_by_minutes, lambda { |start_minutes, end_minutes|
    field_in_minutes = lambda { |field|
      "(EXTRACT(HOUR FROM #{field}) * 60 + EXTRACT(MINUTE FROM #{field}))"
    }

    where "
      (#{field_in_minutes.call('start_time_local')} BETWEEN :start_minutes AND :end_minutes)
      OR
      (#{field_in_minutes.call('end_time_local')} BETWEEN :start_minutes AND :end_minutes)
      OR
      (:start_minutes BETWEEN #{field_in_minutes.call('start_time_local')} AND #{field_in_minutes.call('end_time_local')})
    ", :start_minutes => start_minutes, :end_minutes => end_minutes
  }

  prepare_range(:day_range, "(DAYOFYEAR(start_time))")

  def self.filter(data={})
    sessions = order("sessions.created_at DESC").
    where("contribute = true OR sessions.id IN (?)", data[:session_ids]).
    day_range(data[:day_from], data[:day_to]).
    joins(:user)

    tags = data[:tags].to_s.split(/[\s,]/)
    if tags.present?
      sessions = sessions.tagged_with(tags)
    end

    usernames = AirCasting::UsernameParam.split(data[:usernames])
    if usernames.present?
      sessions = sessions.joins(:user).where(:users => {:username => usernames})
    end

    location = data[:location]
    sensor_name = data[:sensor_name]
    unit_symbol = data[:unit_symbol]

    sessions = sessions.where(is_indoor: data[:is_indoor]) unless data[:is_indoor].nil?

    if data[:east] && data[:west] && data[:north] && data[:south]
      session_ids = Measurement.joins(:session).
        latitude_range(data[:south], data[:north]).
        longitude_range(data[:west], data[:east]).
        select("DISTINCT session_id").map(&:session_id)
      sessions = sessions.where(:id => session_ids.uniq)
    elsif location.present?
      sessions = sessions.joins(:streams)
      if location.present?
        point = Geocoder.coordinates(location)
        box = Geocoder::Calculations.bounding_box(point, data[:distance])

        validate_box_coordinates!(box)

        data = {
          :south => box[0],
          :north => box[2],
          :west  => box[1],
          :east  => box[3]
        }

        streams_ids = Stream.
          select('streams.id').
          joins(:session).
          where('sessions.contribute' => true).
          in_rectangle(data).
          map(&:id)

        sessions = sessions.where(:streams => {:id => streams_ids.uniq})
      end
    end

    if sensor_name.present?
      sessions = sessions.joins(:streams).where(:streams => {:sensor_name =>  sensor_name})
    end

    if unit_symbol.present?
      sessions = sessions.joins(:streams).where(:streams => {:unit_symbol =>  unit_symbol})
    end

    if data[:time_from] && data[:time_to] && !whole_day?(data[:time_from], data[:time_to])
      sessions = sessions.
        local_time_range_by_minutes(data[:time_from], data[:time_to])
    end

    if data[:year_from] && data[:year_to]
      sessions = sessions.start_year_range(
        Date.new(data[:year_from]),
        Date.new(data[:year_to].to_i + 1) - 1
      )
    end

    if (id = data[:include_session_id]).present?
      sessions = (sessions + [Session.find(id)]).uniq
    end

    sessions
  end

  # time is in minutes from 00:00 to 23:59
  def self.whole_day?(time_from, time_to)
    time_from == 0 && time_to == 1439
  end

  def self.filtered_json(data, page, page_size)
    methods = [:username, :streams]

    methods << :measurements if data[:measurements]

    offset(page.to_i * page_size.to_i)
    .limit(page_size)
    .includes(:user)
    .includes(:streams)
    .filter(data).as_json(
      only: filtered_json_fields,
      methods: methods
    )
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

    methods = opts[:methods] || [:notes, :calibration]
    methods << :type
    with_measurements = opts[:methods].delete(:measurements)
    sensor_id = opts.delete(:sensor_id)

    res = super(opts.merge(:methods => methods))

    map_of_streams = {}
    strs = sensor_id ? streams.where(sensor_name: sensor_id) : streams.all
    strs.each do |stream|
      if with_measurements
        map_of_streams[stream.sensor_name] = stream.as_json(:methods => [:measurements])
      else
        map_of_streams[stream.sensor_name] = stream.as_json
      end
    end

    res.merge!(:streams => map_of_streams)

    res
  end

  def sync(session_data)
    tag_list = session_data[:tag_list] || ""
    session_data = session_data.merge(:tag_list => SessionBuilder.normalize_tags(tag_list))

    transaction do
      update_attributes(session_data, :as => :sync)

      (session_data[:streams] || []).each do |key, stream_data|
        if stream_data[:deleted]
          streams.where(
            :sensor_package_name => stream_data[:sensor_package_name],
            :sensor_name => stream_data[:sensor_name]
          ).each(&:destroy)
        end
      end

     notes.destroy_all if session_data[:notes].empty?

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

  private

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

  def self.validate_box_coordinates!(box)
    raise WrongCoordinatesError if box.any?{ |e| e.nan? }
  end

  after_destroy :insert_into_deleted_sessions

  def insert_into_deleted_sessions
    DeletedSession.where(:uuid => uuid, :user_id => user.id).first_or_create!
  end
end
