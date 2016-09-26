module Elastic
  class StreamObserver < ActiveRecord::Observer
    observe :stream

    def after_create(record)
      indexer_callback(record, 'index_document')
    end

    def after_update(record)
      indexer_callback(record, 'update_document')
    end

    def after_destroy(record)
      indexer_callback(record, 'delete_document')
    end

    private

    def indexer_callback(stream, action)
      return if stream.session.type == 'FixedSession'

      Elastic::StreamIndexer.perform_async(stream.id, action)
    end
  end
end
