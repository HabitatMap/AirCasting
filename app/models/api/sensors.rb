require 'dry-validation'
require 'dry-struct'

module Api::Sensors
  module Types
    include Dry::Types.module
  end

  Schema = Dry::Validation.Schema { required(:session_type).filled(:str?) }

  class Struct < Dry::Struct
    transform_keys(&:to_sym)

    attribute :session_type, Types::Strict::String
  end
end
