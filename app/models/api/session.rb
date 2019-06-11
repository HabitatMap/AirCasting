require 'dry-validation'
require 'dry-struct'

module Api::Session
  module Types
    include Dry::Types.module
  end

  Schema =
    Dry::Validation.Schema do
      required(:id).filled(:str?)
      required(:sensor_name).filled(:str?)
    end

  class Struct < Dry::Struct
    transform_keys(&:to_sym)

    attribute :id, Types::Coercible::Integer
    attribute :sensor_name, Types::Strict::String
  end
end
