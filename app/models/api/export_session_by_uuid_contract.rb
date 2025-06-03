module Api
  class ExportSessionByUuidContract < Dry::Validation::Contract
    params do
      required(:email).filled(:string)
      required(:uuid).filled(:string)
    end
  end
end
