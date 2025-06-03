module Api
  class AutocompleteController < ApplicationController
    def usernames
      q = params.to_unsafe_hash[:q].symbolize_keys
      render json: [] unless q.present?

      q[:time_from] = Time.strptime(q[:time_from].to_s, '%s')
      q[:time_to] = Time.strptime(q[:time_to].to_s, '%s')

      contract = Api::UsernamesParamsContract.new.call(q)
      result = Usernames::IndexInteractor.new(contract: contract).call

      if result.success?
        render json: result.value, status: :ok
      else
        render json: result.errors, status: :bad_request
      end
    end
  end
end
