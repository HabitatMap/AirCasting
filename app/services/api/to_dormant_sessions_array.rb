class Api::ToDormantSessionsArray
  def initialize(form:)
    @form = form
  end

  def call
    return Failure.new(form.errors) if form.invalid?

    Success.new(
      sessions: FixedSession.all_dormant(data, limit, offset),
      fetchableSessionsCount: FixedSession.dormant.filter(data).count
    )
  end

  private

  attr_reader :form

  def data
    # dry-struct allows for missing key using `meta(omittable: true)`
    # This `form` has such a key named `is_indoor`. Unfortunately, when
    # `is_indoor` in `nil` if accessed with `form.to_h[:is_indoor]`, the
    # library raises. The solutions are:
    #   - Using `form.is_indoor`; this in not viable at the moment cause
    #     the code that is accessing the struct (Session.filter) is used
    #     by other callers that are passing a vanilla Ruby hash.
    #   - Passing a vanilla Ruby hash with `form.to_h.to_h`
    form.to_h.to_h
  end

  def limit
    data[:limit]
  end

  def offset
    data[:offset]
  end
end
