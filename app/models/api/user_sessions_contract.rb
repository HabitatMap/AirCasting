module Api
  class UserSessionsContract < Dry::Validation::Contract
    params do
      required(:data).array do
        hash do
          required(:uuid).filled(:string)
          required(:deleted).filled(:bool)
          optional(:tag_list).maybe(:string)
          optional(:title).maybe(:string)
          required(:contribute).filled(:bool)
          required(:drawable).filled(:integer)
          required(:start_time).filled(:string)
          required(:end_time).filled(:string)
          required(:is_indoor).filled(:bool)
          required(:latitude).filled(:float)
          required(:longitude).filled(:float)
          required(:type).filled(:string)
          required(:notes).array do
            hash do
              required(:number).filled(:integer)
              required(:latitude).filled(:float)
              required(:longitude).filled(:float)
              required(:date).filled(:string)
              required(:text).filled(:string)
            end
          end
        end
      end
    end
  end
end
