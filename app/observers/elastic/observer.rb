module Elastic
  class Observer < ActiveRecord::Observer
    observe :measurement

    def after_create(record)
      Elastic::Indexer.perform_async(record.class.name, record.id, 'index_document')
    end

    def after_update(record)
      Elastic::Indexer.perform_async(record.class.name, record.id, 'update_document')
    end

    def after_destroy(record)
      Elastic::Indexer.perform_async(record.class.name, record.id, 'delete_document')
    end
  end
end
