module Api
  class UserSettingsContract < Dry::Validation::Contract
    params { required(:session_stopped_alert).filled(:bool) }
  end
end
