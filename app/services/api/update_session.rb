class Api::UpdateSession
  def initialize(form:)
    @form = form
  end

  def call
    return Failure.new(form.errors) if form.invalid?

    session = Session.find_by_uuid(data[:uuid])
    unless session
      return Failure.new("Session with uuid: #{data[:uuid]} doesn't exist")
    end

    session.sync(data)
    session.reload

    Success.new(session)
  end

  private

  attr_reader :form

  def data
    form.to_h.to_h
  end
end
