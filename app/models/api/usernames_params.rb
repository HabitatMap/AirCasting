require 'dry-validation'
require 'dry-struct'

module Api::UsernamesParams
  module Types
    include Dry::Types.module
  end

  Schema =
    Dry::Validation.Schema do
      required(:input)
      required(:time_from).filled(:time?)
      required(:time_to).filled(:time?)
      required(:sensor_name).filled(:str?)
      required(:unit_symbol).filled(:str?)
      required(:tags)
      required(:west).filled(:str?)
      required(:east).filled(:str?)
      required(:south).filled(:str?)
      required(:north).filled(:str?)
      required(:session_type).filled(:str?)
      required(:is_dormant).filled(:str?)
    end

  class Struct < Dry::Struct
    transform_keys(&:to_sym)

    attribute :input, Types::Strict::String
    attribute :time_from, Types::Strict::Time
    attribute :time_to, Types::Strict::Time
    attribute :sensor_name, Types::Strict::String
    attribute :unit_symbol, Types::Strict::String
    attribute :tags, Types::Strict::String
    attribute :west, Types::Coercible::Float
    attribute :east, Types::Coercible::Float
    attribute :south, Types::Coercible::Float
    attribute :north, Types::Coercible::Float
    attribute :session_type, Types::Strict::String
    attribute :is_dormant, Types::Strict::String
  end
end
