class SessionBuilder
  attr_reader :user

  def initialize(session_data, photos, user)
    @session_data = session_data
    @user = user
    @photos = photos
  end

  def build!
    data = @session_data.clone
    session = nil
    jobs = []

    data[:notes_attributes] =
      SessionBuilder.prepare_notes(data.delete(:notes), @photos)
    data[:tag_list] = SessionBuilder.normalize_tags(data[:tag_list])
    data[:user] = @user
    stream_data = data.delete(:streams)

    data = build_local_start_and_end_time(data)
    data[:time_zone] =
      TimeZoneFinderWrapper.instance.time_zone_at(
        lat: data[:latitude],
        lng: data[:longitude],
      )

    allowed = Session.attribute_names + %w[notes_attributes tag_list user]
    filtered = data.select { |k, _| allowed.include?(k.to_s) }

    Session.transaction do
      session = Session.create!(filtered)

      stream_data.values.each do |a_stream|
        measurements = a_stream.delete(:measurements)
        next unless measurements.any?
        a_stream.merge!(session: session)
        stream = Stream.build_with_threshold_set!(a_stream)
        jobs.push([stream, measurements])
      end
    end

    jobs.each do |(stream, measurements)|
      MeasurementsCreator.new.call(stream, measurements)
    end

    session
  rescue ActiveRecord::RecordInvalid => invalid
    Rails.logger.warn("[SessionBuilder] data: #{data}")
    Rails.logger.warn(invalid.record.errors.full_messages)
    nil
  end

  def build_local_start_and_end_time(session_data)
    session_data[:start_time_local] = DateTime.iso8601 session_data[:start_time]
    session_data[:end_time_local] = DateTime.iso8601 session_data[:end_time]
    session_data
  end

  def self.prepare_notes(note_data, photos)
    note_data
      .zip(photos)
      .map do |datum, photo|
        if photo.blank?
          datum
        else
          decoded = Base64.decode64(photo)
          content_type = Marcel::MimeType.for(StringIO.new(decoded))
          mime_type = Mime::Type.lookup(content_type)
          extension = mime_type.symbol.to_s
          filename = "photo_#{SecureRandom.hex(8)}.#{extension}"

          attached_photo =
            ActiveStorage::Blob.create_and_upload!(
              io: StringIO.new(decoded),
              filename: filename,
              content_type: content_type,
            )

          datum.merge(s3_photo: attached_photo)
        end
      end
  end

  def self.normalize_tags(tags)
    tags.to_s.split(/[\s,]/).reject(&:empty?).join(',')
  end
end
