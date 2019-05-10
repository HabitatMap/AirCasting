class Api::ToMobileSessionsArray
  def initialize(form:)
    @form = form
  end

  def call
    return Failure.new(form.errors) if form.invalid?

    Success.new(
      sessions: MobileSession.filtered_json(data, limit, offset),
      fetchableSessionsCount: MobileSession.filter(data).count
    )
  end

  private

  attr_reader :form

  def data
    # `Session.filter` checks for the presence of `is_indoor`.
    # In this case, `is_indoor` is always `nil` therefore
    # `form.to_h[:is_indoor]` fails. For now, we can pass
    # a vanilla Ruby hash with `form.to_h.to_h`.
    form.to_h.to_h
  end

  def limit
    data[:limit]
  end

  def offset
    data[:offset]
  end
end
