require 'dry-validation'
require 'dry-struct'

module Api::ThresholdAlerts
  module Types
    include Dry::Types.module
  end

  Schema =
    Dry::Validation.Schema do
      required(:sensor_name).filled(:str?)
      required(:session_uuid).filled(:str?)
      required(:threshold_value).filled(:float?)
      required(:frequency).filled(:int?)
    end

  class Struct < Dry::Struct
    attribute :sensor_name, Types::Strict::String
    attribute :session_uuid, Types::Strict::String
    attribute :threshold_value, Types::Strict::Float
    attribute :frequency, Types::Strict::Integer
  end
end
