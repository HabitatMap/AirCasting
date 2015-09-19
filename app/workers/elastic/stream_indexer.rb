module Elastic
  class StreamIndexer
    include Sidekiq::Worker

    sidekiq_options retry: false

    Client = Elasticsearch::Client.new(host: 'localhost:9200', logger: Sidekiq.logger)

    def perform(stream_id, operation)
      Sidekiq.logger.info("[Stream, id: #{stream_id}, operation: #{operation}]")

      case operation
      when 'index_document', 'update_document'
        Elastic::Measurement.create_index!
        Elastic::Measurement.import(query: -> { where(stream_id: stream_id) })
      when 'delete_document'
        query = lambda { Elastic::Measurement.search(query: {term: {stream_id: stream_id}}, size: 1000) }
        while query.call.results.total > 0
          actions = query.call.results.map do |result|
            { delete: { _index: 'measurements', _type: 'measurement', _id: result._id } }
          end
          Client.bulk(body: actions)
        end
      else
        raise ArgumentError, "Unknown operation '#{operation}'"
      end
    end
  end
end
