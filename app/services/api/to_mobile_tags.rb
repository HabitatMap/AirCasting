class Api::ToMobileTags
  def initialize(form:)
    @form = form
    @redis_cache = Rails.application.config.custom_cache_stores[:redis_store]
  end

  def call
    return Failure.new(form.errors) if form.invalid?

    cached_sessions = redis_cache.read("mobile_sessions_#{data[:sensor_name]}")

    unless cached_sessions.nil?
      sessions = cached_sessions
      # filter cached sessions with west/east/south/north, tags, usernames
      sessions = sessions.filter_(data)
    else
      sessions = MobileSession.filter_(data)
    end

    session_ids = sessions.pluck(:id)
    return Success.new([]) if session_ids.empty?

    tags = TagsRepository.new
      .sessions_tags(
        session_ids: session_ids,
        input: data[:input]
      )

    Success.new(tags.rows.map { |row| row[0] })
  end

  private

  attr_reader :form, :redis_cache

  def data
    form.to_h.to_h
  end
end
