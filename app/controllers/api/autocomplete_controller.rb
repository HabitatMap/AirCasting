module Api
  class AutocompleteController < ApplicationController
    def usernames
      GoogleAnalyticsWorker::RegisterEvent.async_call('Autocomplete#usernames')
      q = params.to_unsafe_hash[:q].symbolize_keys
      render json: [] unless q.present?

      q[:time_from] = Time.strptime(q[:time_from].to_s, '%s')
      q[:time_to] = Time.strptime(q[:time_to].to_s, '%s')

      form =
        Api::ParamsForm.new(
          params: q,
          schema: Api::UsernamesParams::Schema,
          struct: Api::UsernamesParams::Struct
        )

      result = Usernames::IndexInteractor.new(form: form).call

      if result.success?
        render json: result.value, status: :ok
      else
        render json: result.errors, status: :bad_request
      end
    end
  end
end
