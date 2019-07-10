require 'dry-validation'
require 'dry-struct'

module Api::UserSession
  module Types
    include Dry::Types.module
  end

  StreamSchema =
    Dry::Validation.Schema do
      required(:deleted).filled(:bool?)
      required(:average_value).filled(:float?)
      required(:measurement_type).filled(:str?)
      required(:sensor_package_name).filled(:str?)
      required(:sensor_name).filled(:str?)
    end

  Schema =
    Dry::Validation.Schema do
      configure do
        def self.messages
          super.merge(en: { errors: { valid_streams: 'streams is not valid' } })
        end
      end

      required(:uuid).filled(:str?)
      required(:tag_list)
      required(:title)
      required(:notes).each do
        schema do
          required(:number).filled(:int?)
          required(:text).filled(:str?)
        end
      end
      validate(valid_streams: :streams) do |stream|
        stream.all? do |sensor_name, stream_data|
          StreamSchema.call(stream_data).success?
        end
      end
    end

  class Struct < Dry::Struct
    attribute :uuid, Types::Strict::String
    attribute :title, Types::Strict::String
    attribute :tag_list, Types::Strict::String
    attribute :notes, Types::Strict::Array do
      attribute :number, Types::Strict::Integer
      attribute :text, Types::Strict::String
    end
    attribute :streams, Types::Strict::Hash
  end
end
