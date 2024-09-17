class Api::ToMobileTags
  def initialize(form:)
    @form = form
  end

  def call
    return Failure.new(form.errors) if form.invalid?

    sessions = MobileSession.filter_(data)

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

  attr_reader :form

  def data
    form.to_h.to_h
  end
end
