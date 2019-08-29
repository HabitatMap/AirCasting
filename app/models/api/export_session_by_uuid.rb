require 'dry-validation'
require 'dry-struct'

module Api::ExportSessionByUuid
  module Types
    include Dry::Types.module
  end

  Schema =
    Dry::Validation.Schema do
      required(:email).filled(:str?)
      required(:uuid).filled(:str?)
    end

  class Struct < Dry::Struct
    transform_keys(&:to_sym)

    attribute :email, Types::Strict::String
    attribute :uuid, Types::Strict::String
  end
end
