module Api
  # Partial update for a mobile session: any subset of title, tag_list, notes,
  # streams (to delete), and airbeam (device) info may be sent.
  class UpdateMobileSessionContract < Dry::Validation::Contract
    params do
      optional(:title).filled(:string)
      optional(:tag_list).maybe(:string)
      optional(:notes).array(:hash) do
        required(:number).filled(:integer)
        optional(:text).maybe(:string)
        optional(:date).maybe(:string)
        optional(:latitude).maybe(:float)
        optional(:longitude).maybe(:float)
      end
      optional(:streams).array(:hash) do
        required(:sensor_name).filled(:string)
        optional(:sensor_package_name).maybe(:string)
        optional(:deleted).maybe(:bool)
      end
      optional(:airbeam).hash do
        optional(:mac_address).filled(:string)
        optional(:model).filled(:string)
        optional(:name).maybe(:string)
      end
    end
  end
end
