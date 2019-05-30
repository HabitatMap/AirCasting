desc "Sync measurements count on streams"
task :sync_measurements_counter => [:environment] do
  Stream.find_in_batches do |streams|
      streams.each do |stream|
        Stream.reset_counters(stream.id, :measurements)
    end
  end
end
