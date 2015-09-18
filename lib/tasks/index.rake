require 'benchmark'
require 'progress'

namespace :index do
  desc 'index measurements'
  task :measurements => :environment do
    Benchmark.realtime do
      ActiveRecord::Base.logger = Logger.new(STDOUT)
      Elastic::Measurement.create_index!

      Stream.pluck(:id).with_progress do |stream_id|
        Elastic::Measurement.import(query: -> { where(stream_id: stream_id) })
      end
    end
  end
end
