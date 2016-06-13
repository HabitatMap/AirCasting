class SessionBuilder
  attr_reader :user

  def initialize(session_data, photos, user)
    @session_data = session_data
    @user = user
    @photos = photos
  end

  def build!
    Session.transaction do
      session = build_session!
    end
  end

  def build_session!
    data = @session_data.clone

    data[:notes_attributes] = SessionBuilder.prepare_notes(data.delete(:notes), @photos)
    data[:tag_list] = SessionBuilder.normalize_tags(data[:tag_list])
    data[:user] = @user
    stream_data = data.delete(:streams)

    data = build_local_start_and_end_time(data)

    begin
      session = Session.create!(data)
    rescue ActiveRecord::RecordInvalid
      Rails.logger.warn("[SessionBuilder] data: #{data}")

      return nil
    end

    stream_data.values.each do |a_stream|
      a_stream.merge!(:session => session)
      Stream.build!(a_stream)
    end

    session
  end

  def build_local_start_and_end_time(session_data)
    session_data[:start_time_local] = DateTime.iso8601 session_data[:start_time]
    session_data[:end_time_local] = DateTime.iso8601 session_data[:end_time]
    session_data
  end

  def self.prepare_notes(note_data, photos)
    note_data.zip(photos).map do |datum, photo|
      datum.merge(:photo => photo)
    end
  end

  def self.normalize_tags(tags)
    tags.to_s.split(/[\s,]/).reject(&:empty?).join(',')
  end
end
