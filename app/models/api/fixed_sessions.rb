require 'dry-validation'
require 'dry-struct'

module Api::FixedSessions
  module Types
    include Dry::Types.module
  end

  Schema =
    Dry::Validation.Schema do
      required(:time_from).filled(:time?)
      required(:time_to).filled(:time?)
      required(:sensor_name).filled(:str?)
      required(:measurement_type).filled(:str?)
      required(:unit_symbol).filled(:str?)
      required(:tags)
      required(:usernames)
      optional(:is_indoor).filled(:bool?)
      optional(:west).filled(:float?)
      optional(:east).filled(:float?)
      optional(:south).filled(:float?)
      optional(:north).filled(:float?)
      optional(:limit).filled(:int?)
      optional(:offset).filled(:int?)
    end

  class Struct < Dry::Struct
    transform_keys(&:to_sym)

    attribute :time_from, Types::Strict::Time
    attribute :time_to, Types::Strict::Time
    attribute :sensor_name, Types::Strict::String
    attribute :measurement_type, Types::Strict::String
    attribute :unit_symbol, Types::Strict::String
    attribute :tags, Types::Strict::String
    attribute :usernames, Types::Strict::String
    attribute :is_indoor, Types::Bool.meta(omittable: true)
    attribute :west, Types::Coercible::Float.meta(omittable: true)
    attribute :east, Types::Coercible::Float.meta(omittable: true)
    attribute :south, Types::Coercible::Float.meta(omittable: true)
    attribute :north, Types::Coercible::Float.meta(omittable: true)
    attribute :limit, Types::Coercible::Integer.meta(omittable: true)
    attribute :offset, Types::Coercible::Integer.meta(omittable: true)
  end
end
