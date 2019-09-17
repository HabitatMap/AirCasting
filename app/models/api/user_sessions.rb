require 'dry-validation'
require 'dry-struct'

module Api::UserSessions
  module Types
    include Dry::Types.module
  end

  StreamSchema =
    Dry::Validation.Schema do
      required(:deleted).filled(:bool?)
      required(:average_value).filled(:float?)
      required(:measurement_type).filled(:str?)
    end

  Schema =
    Dry::Validation.Schema do
      configure do
        def self.messages
          super.merge(en: { errors: { valid_streams: 'streams is not valid' } })
        end
      end

      required(:data).each do
        schema do
          required(:uuid).filled(:str?)
          required(:deleted).filled(:bool?)
          optional(:tag_list)
          optional(:title)
          required(:contribute).filled(:bool?)
          required(:drawable).filled(:int?)
          required(:start_time).filled(:str?)
          required(:end_time).filled(:str?)
          required(:is_indoor).filled(:bool?)
          required(:latitude).filled(:float?)
          required(:longitude).filled(:float?)
          required(:type).filled(:str?)
          required(:notes).each do
            schema do
              required(:number).filled(:int?)
              required(:latitude).filled(:float?)
              required(:longitude).filled(:float?)
              required(:date).filled(:str?)
              required(:text).filled(:str?)
            end
          end
          validate(valid_streams: :streams) do |stream|
            stream.all? do |sensor_name, stream_data|
              StreamSchema.call(stream_data).success?
            end
          end
        end
      end
    end

  class Struct < Dry::Struct
    attribute :data, Types::Array do
      attribute :uuid, Types::Strict::String
      attribute :title, Types::Strict::String.default('')
      attribute :deleted, Types::Strict::Bool
      attribute :tag_list, Types::Strict::String.default('')
      attribute :contribute, Types::Strict::Bool
      attribute :drawable, Types::Strict::Integer
      attribute :end_time, Types::Strict::String
      attribute :start_time, Types::Strict::String
      attribute :is_indoor, Types::Strict::Bool
      attribute :latitude, Types::Strict::Float
      attribute :longitude, Types::Strict::Float
      attribute :type, Types::Strict::String
      attribute :notes, Types::Strict::Array do
        attribute :number, Types::Strict::Integer
        attribute :latitude, Types::Strict::Float
        attribute :longitude, Types::Strict::Float
        attribute :date, Types::Strict::String
        attribute :text, Types::Strict::String
      end
      attribute :streams, Types::Strict::Hash
    end
  end
end
