class AirNow::ImportMeasurements
  def initialize
    @import_data = AirNow::ImportData.new
    @parse_files = AirNow::ParseFiles
    @save_measurements = SaveMeasurements.new(user: User.where(username: 'US EPA AirNow').first!)
    @process_measurements = AirNow::ProcessMeasurements
  end

  def call
    locations_data, hourly_data = import_data.call
    locations = parse_files.parse_locations(locations_data)
    measurements = parse_files.parse_hourly_data(hourly_data, locations)
    saveable_measurements = process_measurements.new.call(measurements)
    streams = GroupByStream.new.call(measurements: saveable_measurements)
    save_measurements.call(streams: streams)
  end

  private

  attr_reader :import_data, :save_measurements, :parse_files, :process_measurements
end
