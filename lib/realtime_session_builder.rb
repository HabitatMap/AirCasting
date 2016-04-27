class RealtimeSessionBuilder
  attr_reader :user

  def initialize(session_data, photos, user)
    @session_data = session_data
    @user = user
  end

  def build!
    Session.transaction do
      session = build_session!
    end
  end

  def build_session!
    data = @session_data.clone
    data.delete(:notes)
    data[:tag_list] = RealtimeSessionBuilder.normalize_tags(data[:tag_list])
    data[:user] = @user
    stream_data = data.delete(:streams)

    data = build_local_start_and_end_time(data)

    begin
      session = RealtimeSession.create!(data)
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
    session_data[:end_time_local] = nil
    session_data
  end

  def self.normalize_tags(tags)
    tags.to_s.split(/[\s,]/).reject(&:empty?).join(',')
  end
end
