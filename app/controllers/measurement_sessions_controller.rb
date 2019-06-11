class MeasurementSessionsController < ApplicationController
  layout 'map'

  def show
    form =
      Api::ParamsForm.new(
        params: params.to_unsafe_hash,
        schema: Api::Links::Schema,
        struct: Api::Links::Struct
      )
    result = Api::ToLink.new(form: form).call

    if result.success?
      redirect_to result.value
    else
      render json: result.errors, status: :bad_request
    end
  end

  def show_old
    # supports legacy mobile apps relesed before 06.2019
    session = Session.find_by_url_token(params.to_unsafe_hash[:url_token]) or
      raise NotFound
    stream = session.streams.first!

    redirect_to session.generate_link(stream)
  end
end
