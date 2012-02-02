class SessionBuilder
  def initialize(session_data, photos, user)
    @session_data = session_data
    @user = user
    @photos = photos
  end

  def build!
    Session.transaction do
      session = build_session
      build_measurements(session)

      session
    end
  end

  def build_session!
    data = @session_data.clone
    data[:notes_attributes] = SessionBuilder.prepare_notes(data.delete(:notes), @photos)
    data[:tag_list] = SessionBuilder.normalize_tags(data[:tag_list])
    data.delete(:measurements)
    data[:user] = @user

    Session.new(data).tap(&:save!)
  end

  def build_measurements!(session)
    measurement_data = @session_data[:measurements] || []
    measurements = measurement_data.map { |datum| Measurement.new(datum) }
    measurements.each { |m| m.session = session }

    result = Measurement.import(measurements)

    raise "Failed to import measurements" unless result.failed_instances.empty?

    Session.update_counters(session.id, :measurements_count => measurements.size)
    session.set_timeframe!
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
