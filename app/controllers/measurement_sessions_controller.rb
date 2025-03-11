class MeasurementSessionsController < ApplicationController
  def show
    GoogleAnalyticsWorker::RegisterEvent.async_call('Measurement Sessions#show')
    form =
      Api::ParamsForm.new(
        params: params.to_unsafe_hash,
        schema: Api::Links::Schema,
        struct: Api::Links::Struct,
      )
    result = Api::ToLink.new(form: form).call

    if result.success?
      redirect_to result.value
    else
      render json: result.errors, status: :bad_request
    end
  end
end
