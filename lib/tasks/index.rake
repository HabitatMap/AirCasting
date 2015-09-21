require 'benchmark'
require 'progress'

namespace :index do
  desc 'index measurements'
  task :measurements => :environment do
    Benchmark.realtime do
      ActiveRecord::Base.logger = Logger.new(STDOUT)

      Stream.pluck(:id).with_progress do |stream_id|
        stream = Stream.find(stream_id)
        index_name = "#{stream.sensor_name.parameterize.underscore}_#{stream.measurement_type.parameterize.underscore}"
        Elastic::Measurement.create_index!(index: index_name)
        Elastic::Measurement.import(index: index_name, query: -> { where(stream_id: stream_id) })
      end
    end
  end
end
