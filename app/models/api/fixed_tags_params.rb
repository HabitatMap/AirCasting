require 'dry-validation'
require 'dry-struct'

module Api::FixedTagsParams
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
      required(:usernames)
      required(:west).filled(:str?)
      required(:east).filled(:str?)
      required(:south).filled(:str?)
      required(:north).filled(:str?)
      required(:is_indoor).filled(:str?)
      required(:is_active).filled(:str?)
    end

  class Struct < Dry::Struct
    transform_keys(&:to_sym)

    attribute :input, Types::Strict::String
    attribute :time_from, Types::Strict::Time
    attribute :time_to, Types::Strict::Time
    attribute :sensor_name, Types::Strict::String
    attribute :unit_symbol, Types::Strict::String
    attribute :usernames, Types::Strict::String
    attribute :west, Types::Coercible::Float
    attribute :east, Types::Coercible::Float
    attribute :south, Types::Coercible::Float
    attribute :north, Types::Coercible::Float
    attribute :is_indoor, Types::Params::Bool
    attribute :is_active, Types::Params::Bool
  end
end
