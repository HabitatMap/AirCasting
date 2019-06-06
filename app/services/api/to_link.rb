class Api::ToLink
  def initialize(form:)
    @form = form
  end

  def call
    return Failure.new(form.errors) if form.invalid?

    session = ::Session.find_by_url_token(params[:url_token]) or raise NotFound
    stream = session.streams.where(sensor_name: params[:sensor_name]).first!

    Success.new(session.generate_link(stream))
  end

  private

  attr_reader :form

  def params
    form.to_h
  end
end
