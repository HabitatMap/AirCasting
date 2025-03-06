module Api
  class UserSessionContract < Dry::Validation::Contract
    params do
      required(:uuid).filled(:string)
      required(:tag_list).value(:string)
      required(:title).value(:string)
      required(:notes).array do
        hash do
          required(:number).filled(:integer)
          required(:text).filled(:string)
        end
      end
      required(:streams).hash do
        hash do
          required(:deleted).filled(:bool)
          required(:average_value).filled(:float)
          required(:measurement_type).filled(:string)
          required(:sensor_package_name).filled(:string)
          required(:sensor_name).filled(:string)
        end
      end
    end
  end
end
