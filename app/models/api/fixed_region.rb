require 'dry-validation'
require 'dry-struct'

module Api::FixedRegion
  module Types
    include Dry::Types.module
  end

  Schema =
    Dry::Validation.Schema do
      required(:sensor_name).filled(:str?)
      optional(:session_ids).each(:int?)
    end

  class Struct < Dry::Struct
    attribute :sensor_name, Types::Strict::String
    attribute :session_ids,
              Types::Strict::Array.of(Types::Strict::Integer).default([])
  end
end
