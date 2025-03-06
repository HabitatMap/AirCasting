module Api
  class UserSessions2Contract < Dry::Validation::Contract
    params do
      required(:data).array do
        hash do
          required(:uuid).filled(:string)
          required(:deleted).filled(:bool)
          required(:version).filled(:integer)
        end
      end
    end
  end
end
