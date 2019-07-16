require 'dry-validation'
require 'dry-struct'

module Api::UserSettings
  module Types
    include Dry::Types.module
  end

  Schema =
    Dry::Validation.Schema { required(:session_stopped_alert).filled(:bool?) }

  class Struct < Dry::Struct
    attribute :session_stopped_alert, Types::Strict::Bool
  end
end
