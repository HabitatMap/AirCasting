module Elastic
  class StreamObserver < ActiveRecord::Observer
    observe :stream

    def after_create(record)
      Elastic::StreamIndexer.perform_async(record.id, 'index_document')
    end

    def after_update(record)
      Elastic::StreamIndexer.perform_async(record.id, 'update_document')
    end

    def after_destroy(record)
      Elastic::StreamIndexer.perform_async(record.id, 'delete_document')
    end
  end
end
