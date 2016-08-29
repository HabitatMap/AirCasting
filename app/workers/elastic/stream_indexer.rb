module Elastic
  class StreamIndexer
    include Sidekiq::Worker

    sidekiq_options retry: false, unique: true,
      unique_unlock_order: :never, unique_job_expiration: 5.minute

    Client = Elasticsearch::Client.new(host: 'localhost:9200', logger: Sidekiq.logger)

    def perform(stream_id, operation)
      return unless Feature[:elasticsearch].enabled?

      Sidekiq.logger.info("[Stream, id: #{stream_id}, operation: #{operation}]")

      stream = Stream.find(stream_id)
      index_name = "#{stream.measurement_type.parameterize.underscore}_#{stream.sensor_name.parameterize.underscore}"

      case operation
      when 'index_document', 'update_document'
        Elastic::Measurement.create_index!(index: index_name)
        Elastic::Measurement.import(index: index_name, query: -> { where(stream_id: stream_id) })
      when 'delete_document'
        query = lambda { Elastic::Measurement.search({query: {term: {stream_id: stream_id}}, size: 1000}, {index: index_name}) }
        while query.call.results.total > 0
          actions = query.call.results.map do |result|
            { delete: { _index: index_name, _type: 'measurement', _id: result._id } }
          end
          Client.bulk(body: actions)
        end
      else
        raise ArgumentError, "Unknown operation '#{operation}'"
      end
    end
  end
end
