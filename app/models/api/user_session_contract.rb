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

      required(:streams_to_delete).array do
        hash do
          required(:sensor_name).filled(:string)
          required(:sensor_package_name).filled(:string)
        end
      end

      before(:key_coercer) do |r|
        result = r.to_h
        result['streams_to_delete'] =
          result['streams'].values.select { |stream| stream['deleted'] == true }

        result
      end
    end
  end
end
