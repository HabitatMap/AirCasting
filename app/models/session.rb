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

class Session < ActiveRecord::Base
  self.skip_time_zone_conversion_for_attributes = [:local_start_time, :local_end_time]
  include AirCasting::FilterRange

  MINUTES_IN_DAY = 60 * 24

  belongs_to :user
  has_many :measurements, :through => :streams, :inverse_of => :session
  has_many :notes, :inverse_of => :session, :dependent => :destroy
  has_many :streams, :inverse_of => :session, :dependent => :destroy

  validates :user, :uuid, :url_token, :calibration, :offset_60_db, :presence => true
  validates :start_time, :end_time, :presence => true
  validates :local_start_time, :local_end_time, :presence => true
  validates :url_token, :uuid, :uniqueness => true
  validates_inclusion_of :offset_60_db, :in => -5..5

  accepts_nested_attributes_for :notes, :streams

  before_validation :set_url_token, :unless => :url_token

  delegate :username, :to => :user

  acts_as_taggable

  attr_accessible :uuid, :calibration, :offset_60_db, :title, :description, :tag_list,
  :contribute, :notes_attributes, :data_type, :instrument, :phone_model,
  :os_version, :user, :start_time, :end_time, :local_start_time, :local_end_time
  attr_accessible :title, :description, :tag_list, :as => :sync

  scope :local_time_range_by_minutes, lambda { |start_minutes, end_minutes|
    field_in_minutes = lambda { |field|
      "(EXTRACT(HOUR FROM #{field}) * 60 + EXTRACT(MINUTE FROM #{field}))"
    }

    where "
      (#{field_in_minutes.call('local_start_time')} BETWEEN :start_minutes AND :end_minutes)
      OR
      (#{field_in_minutes.call('local_end_time')} BETWEEN :start_minutes AND :end_minutes)
      OR
      (:start_minutes BETWEEN #{field_in_minutes.call('local_start_time')} AND #{field_in_minutes.call('local_end_time')})
    ", :start_minutes => start_minutes, :end_minutes => end_minutes
  }

  prepare_range(:day_range, "(DAYOFYEAR(start_time))")

  def self.filter(data={})
    sessions = order("sessions.created_at DESC").
    where(:contribute => true).
    day_range(data[:day_from], data[:day_to]).
    joins(:user)

    tags = data[:tags].to_s.split(/[\s,]/)
    if tags.present?
      sessions = sessions.tagged_with(tags)
    end

    usernames = data[:usernames].to_s.split(/[\s,]/)
    if usernames.present?
      sessions = sessions.joins(:user).where("users.username IN (?)", usernames)
    end

    if (location = data[:location]).present?
      session_ids = Measurement.near(location, data[:distance]).select('session_id').map(&:session_id)
      sessions = sessions.where(:id => session_ids)
    end

    if data[:east] && data[:west] && data[:north] && data[:south]
      session_ids = Measurement.joins(:session).
      latitude_range(data[:south], data[:north]).
      longitude_range(data[:west], data[:east]).
      select("DISTINCT session_id").map(&:session_id)

      sessions = sessions.where(:id => session_ids)
    end

    if data[:time_from] && data[:time_to] && !whole_day?(data[:time_from], data[:time_to])
      sessions = sessions.
        local_time_range_by_minutes(data[:time_from], data[:time_to])
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

  def self.filtered_json(data)
    includes(:user).
      includes(:streams).
      filter(data).as_json(
        :only => [:id, :created_at, :title, :calibration, :offset_60_db, :local_start_time, :local_end_time, :timezone_offset],
        :methods => [:username, :streams, :no_of_measurements]
    )
  end

  def no_of_measurements
    measurements_count || 0 #measurements.count
  end

  def to_param
    url_token
  end

  def west
    measurements.select('MIN(longitude) AS val').to_a.first.val.to_f
  end

  def east
    measurements.select('MAX(longitude) AS val').to_a.first.val.to_f
  end

  def north
    measurements.select('MAX(latitude) AS val').to_a.first.val.to_f
  end

  def south
    measurements.select('MIN(latitude) AS val').to_a.first.val.to_f
  end

  def as_json(opts=nil)
    opts ||= {}

    methods = opts[:methods] || [:notes, :calibration]
    with_measurements = opts[:methods].delete(:measurements)

    res = super(opts.merge(:methods => methods))

    map_of_streams = {}
    streams.each do |stream|
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

      session_data[:streams] || [].each do |key, stream_data|
        if stream_data[:deleted]
          session = Session.find_by_uuid(session_data[:uuid])
          session.streams.where( "sensor_package_name = ? AND sensor_name = ?",
                                 stream_data[:sensor_package_name],
                                 stream_data[:sensor_name] ).each(&:destroy)
        end
      end

      if session_data[:notes].all? { |n| n.include? :number } && notes.all? { |n| n.number }
        session_data[:notes].each do |note_data|
          note = notes.find_by_number(note_data[:number])
          note.update_attributes(note_data)
        end

        if session_data[:notes].empty?
          notes.destroy_all
        else
          notes.
          where("number NOT IN (?)", session_data[:notes].map { |n| n[:number] }).
          destroy_all
        end
      else
        self.notes = session_data[:notes].map { |n| Note.new(n) }
      end
    end
  end

  def local_end_time=(time)
    if time.respond_to?(:strftime)
      time = TimeToLocalInUTC.convert(time)
    end
    super(time)
  end

  def local_start_time=(time)
    if time.respond_to?(:strftime)
      time = TimeToLocalInUTC.convert(time)
    end
    super(time)
  end

  private

  def set_url_token
    tg = TokenGenerator.new

    token = tg.generate_unique(5) do |token|
      Session.where(:url_token => token).count == 0
    end

    self.url_token = token
  end
end
