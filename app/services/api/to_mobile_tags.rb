class Api::ToMobileTags
  def initialize(form:)
    @form = form
    @redis_cache = Rails.application.config.custom_cache_stores[:redis_store]
  end

  def call
    return Failure.new(form.errors) if form.invalid?

    cached_sessions = redis_cache.read("mobile_tags_#{data[:sensor_name]}")

    unless cached_sessions.nil?
      sessions = cached_sessions
      # filter cached sessions with west/east/south/north, tags, usernames
      sessions = sessions.filter_(data)
    else
      sessions = MobileSession.filter_(data)
    end

    tags = sessions.tag_counts.where(['tags.name ILIKE ?', "#{data[:input]}%"])

    Success.new(tags.map(&:name).sort_by { |word| words_first(word) })
  end

  private

  attr_reader :form, :redis_cache

  def data
    form.to_h.to_h
  end

  def words_first(str)
    str[0] =~ /[[:alpha:]]/ ? '0' + str.downcase : '1' + str.downcase
  end
end
