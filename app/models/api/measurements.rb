require 'dry-validation'
require 'dry-struct'

module Api::Measurements
  module Types
    include Dry::Types.module
  end

  Schema = Dry::Validation.Schema do
    required(:stream_id).filled(:str?)
    optional(:start_time).filled(:str?)
    optional(:end_time).filled(:str?)
  end

  class Struct < Dry::Struct
    transform_keys(&:to_sym)

    attribute :stream_id, Types::Coercible::Integer
    attribute :start_time, Types::Coercible::Integer.default(0)
    attribute :end_time, Types::Coercible::Integer.default(0)
  end
end
