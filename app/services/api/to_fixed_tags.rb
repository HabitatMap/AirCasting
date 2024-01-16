class Api::ToFixedTags
  def initialize(form:)
    @form = form
  end

  def call
    return Failure.new(form.errors) if form.invalid?

    sessions =
      (data[:is_active] ? FixedSession.active : FixedSession.dormant)
        .with_user_and_streams
        .order('sessions.start_time_local DESC')
        .where(contribute: true)
        .where(is_indoor: data[:is_indoor])
        .joins(:streams)
        .where(streams: { sensor_name: data[:sensor_name] })
        .where(streams: { unit_symbol: data[:unit_symbol] })
        .where('streams.measurements_count > 0')
        .merge(Stream.in_rectangle(data))

    sessions2 =
      Session.filter_by_time_range(sessions, data[:time_from], data[:time_to])

    usernames = AirCasting::UsernameParam.split(data[:usernames])
    if usernames.present?
      sessions2 = sessions2.joins(:user).where(users: { username: usernames })
    end

    # tag_counts is a method from the gem acts-as-taggable-on and the query inside it is not compatible with postgres
    tags = sessions2.tag_counts.where(['tags.name LIKE ?', "#{data[:input]}%"])

    Success.new(tags.map(&:name))
  end

  private

  attr_reader :form

  def data
    form.to_h
  end
end
