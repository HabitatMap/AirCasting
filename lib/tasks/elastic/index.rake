require 'benchmark'
require 'progress'
require 'colored'

namespace :elastic do
  namespace :index do
    desc 'index measurements'
    task :measurements => :environment do
      time = Benchmark.realtime do
        ActiveRecord::Base.logger = Logger.new(STDOUT)

        Stream.pluck(:id).reverse.with_progress do |stream_id|
          stream = Stream.find(stream_id)
          index_name = "#{stream.measurement_type.parameterize.underscore}_#{stream.sensor_name.parameterize.underscore}"
          Elastic::Measurement.create_index!(index: index_name)
          Elastic::Measurement.import(index: index_name, query: -> { where(stream_id: stream_id) })
        end
      end

      puts "#{time}".red
    end
  end
end
