require 'dry-validation'
require 'dry-struct'

module Api::UserSessions2
  module Types
    include Dry::Types.module
  end

  Schema =
    Dry::Validation.Schema do
      required(:data).each do
        schema do
          required(:uuid).filled(:str?)
          required(:deleted).filled(:bool?)
          required(:version).filled(:int?)
        end
      end
    end

  class Struct < Dry::Struct
    attribute :data, Types::Array do
      attribute :uuid, Types::Strict::String
      attribute :deleted, Types::Strict::Bool
      attribute :version, Types::Strict::Integer
    end
  end
end
