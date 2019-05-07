require 'dry-validation'
require 'dry-struct'

module Api::DormantSessions
  module Types
    include Dry::Types.module
  end

  Schema = Dry::Validation.Schema do
    required(:time_from).filled(:time?)
    required(:time_to).filled(:time?)
    required(:west).filled(:float?)
    required(:east).filled(:float?)
    required(:south).filled(:float?)
    required(:north).filled(:float?)
    required(:limit).filled(:int?)
    required(:offset).filled(:int?)
    required(:sensor_name).filled(:str?)
    required(:measurement_type).filled(:str?)
    required(:unit_symbol).filled(:str?)
    required(:tags)
    required(:usernames)
    required(:session_ids).each(:str?)
    optional(:is_indoor).filled(:bool?)
  end

  class Struct < Dry::Struct
    transform_keys(&:to_sym)

    attribute :time_from, Types::Strict::Time
    attribute :time_to, Types::Strict::Time
    attribute :west, Types::Coercible::Float
    attribute :east, Types::Coercible::Float
    attribute :south, Types::Coercible::Float
    attribute :north, Types::Coercible::Float
    attribute :limit, Types::Coercible::Integer
    attribute :offset, Types::Coercible::Integer
    attribute :sensor_name, Types::Strict::String
    attribute :measurement_type, Types::Strict::String
    attribute :unit_symbol, Types::Strict::String
    attribute :tags, Types::Strict::String
    attribute :usernames, Types::Strict::String
    attribute :session_ids, Types::Strict::Array.of(Types::Coercible::Integer)
    attribute :is_indoor, Types::Bool.meta(omittable: true)
  end
end
