require 'dry-validation'
require 'dry-struct'

module Api::Links
  module Types
    include Dry::Types.module
  end

  Schema =
    Dry::Validation.Schema do
      required(:url_token).filled(:str?)
      required(:sensor_name).filled(:str?)
    end

  class Struct < Dry::Struct
    transform_keys(&:to_sym)

    attribute :url_token, Types::Coercible::String
    attribute :sensor_name, Types::Strict::String
  end
end
