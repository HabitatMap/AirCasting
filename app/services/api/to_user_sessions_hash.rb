class Api::ToUserSessionsHash
  def initialize(form:)
    @form = form
  end

  def call(user)
    return Failure.new(form.errors) if form.invalid?

    Success.new(user.sync(form.to_h.data.map(&:to_h)))
  end

  private

  attr_reader :form
end
