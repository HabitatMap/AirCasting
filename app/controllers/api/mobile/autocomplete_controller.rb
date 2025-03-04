module Api
  class Mobile::AutocompleteController < ApplicationController
    def tags
      q = params.to_unsafe_hash[:q].symbolize_keys

      q[:time_from] = Time.strptime(q[:time_from].to_s, '%s')
      q[:time_to] = Time.strptime(q[:time_to].to_s, '%s')

      contract = Api::MobileTagsParamsContract.new.call(q)
      result = Api::ToMobileTags.new(contract: contract).call

      if result.success?
        render json: result.value, status: :ok
      else
        render json: result.errors, status: :bad_request
      end
    end
  end
end
