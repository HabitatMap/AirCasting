require 'dry-validation'
require 'dry-struct'

module Api::ExportSessions
  module Types
    include Dry::Types.module
  end

  Schema =
    Dry::Validation.Schema do
      required(:email).filled(:str?)
      required(:session_ids).each(:str?)
    end

  class Struct < Dry::Struct
    transform_keys(&:to_sym)

    attribute :email, Types::Strict::String
    attribute :session_ids,
              Types::Strict::Array.of(Types::Strict::String).default([])
  end
end
