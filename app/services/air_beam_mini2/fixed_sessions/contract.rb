module AirBeamMini2
  module FixedSessions
    class Contract < Dry::Validation::Contract
      params do
        required(:uuid).filled(:string)
        required(:title).filled(:string)
        required(:latitude).filled(:float)
        required(:longitude).filled(:float)
        required(:contribute).filled(:bool)
        required(:airbeam).hash do
          required(:mac_address).filled(:string)
          required(:model).filled(:string)
          optional(:name).maybe(:string)
        end
        required(:streams).array(:hash) do
          required(:measurement_type).filled(:string)
          required(:unit).filled(:string)
          optional(:measurement_type_id).maybe(:integer)
        end
      end

      rule(:streams) do
        key.failure('must have at least one stream') if value.empty?
      end
    end
  end
end
