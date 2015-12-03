module Elastic
  class Measurement < ::Measurement
    include Elasticsearch::Model

    index_name 'measurements'
    document_type 'measurement'

    def self.create_index!(options={})
      __elasticsearch__.create_index!(options)
    end

    def self.import(*args)
      __elasticsearch__.import(*args)
    end

    def self.search(*args)
      __elasticsearch__.search(*args)
    end

    settings index: { number_of_shards: 1, number_of_replicas: 0 } do
      mappings dynamic: 'false' do
        indexes :id, type: 'long'
        indexes :latitude, type: 'double'
        indexes :longitude, type: 'double'
        indexes :measured_value, type: 'double'
        indexes :milliseconds, type: 'long'
        indexes :stream_id, type: 'long'
        indexes :time, type: 'date', format: 'dateOptionalTime'
        indexes :timezone_offset, type: 'long'
        indexes :value, type: 'double'

        indexes :day_of_year, type: 'integer'
        indexes :minutes_of_day, type: 'integer'
        indexes :year, type: 'integer'
      end
    end
  end
end
