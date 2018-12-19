desc "Populate start coordinates of stream with data from first measurement"
task :populate_start_coordinates => [:environment] do
  Stream.all.each do |stream|
    first_measurement = stream.measurements.order(time: :asc).first
    if first_measurement
      puts stream.id
      stream.start_longitude = first_measurement.longitude
      stream.start_latitude = first_measurement.latitude
    else
      puts "#{stream.id} has no measurements"
    end
    stream.save!
  end
end
