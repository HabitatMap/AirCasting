module Elastic
  class Indexer
    include Sidekiq::Worker

    sidekiq_options retry: false

    Client = Elasticsearch::Client.new host: 'localhost:9200', logger: Sidekiq.logger

    def perform(record_type, record_id, operation)
      klass = record_type.constantize
      index = record_type.downcase.pluralize
      type = record_type.downcase

      case operation
      when 'index_document', 'update_document'
        record = klass.find(record_id)
        Client.index(index: index, type: type, id: record.id, body: record.as_indexed_json)
      when 'delete_document'
        Client.delete(index: index, type: type, id: record_id)
      else
        raise ArgumentError, "Unknown operation '#{operation}'"
      end
    end
  end
end
