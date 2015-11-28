require 'benchmark'
require 'progress'
require 'colored'

namespace :elastic do
  namespace :indices do
    desc 'delete all indices'
    task :delete_all => :environment do
      time = Benchmark.realtime do
        client = Elasticsearch::Client.new(host: 'localhost:9200', logger: Logger.new(STDOUT))
        indices = client.indices.status['indices'].keys
        indices.each do |index|
          client.indices.delete(index: index)
        end
      end

      puts "#{time}".red
    end
  end
end


