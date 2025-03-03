module Api
  class ExportSessionsContract < Dry::Validation::Contract
    params do
      required(:email).filled(:string)
      required(:session_ids).array(:integer)
    end
  end
end
