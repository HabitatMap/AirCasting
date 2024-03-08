class AirNow::CreateSaveableObjects
  def initialize(measurements)
    @measurements = measurements
  end

  def call
    measurements.map do |measurement|
      time_utc = convert_datetime(measurement[:time], measurement[:date])
      time_local = time_utc - measurement[:timezone].to_i.hours

      AirNow::Measurement.new(
        sensor_name: measurement[:parameter],
        value: measurement[:value],
        latitude: measurement[:latitude],
        longitude: measurement[:longitude],
        time_local: time_local,
        time_utc: time_utc,
        location: measurement[:location],
        title: measurement[:location].force_encoding("ASCII-8BIT").encode("UTF-8", invalid: :replace, undef: :replace, replace: "?"),
      )
    end
  end

  private

  attr_accessor :measurements

  def convert_datetime(time, date)
    full_year_date = Date.strptime(date, "%m/%d/%y").strftime("%Y-%m-%d")
    Time.parse("#{full_year_date} #{time}")
  end
end
