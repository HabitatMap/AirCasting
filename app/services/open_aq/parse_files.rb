class OpenAq::ParseFiles
  def initialize(logger: Sidekiq.logger)
    @logger = logger
  end

  def call(files:)
    files
      .flat_map { |file| file.split("\n") }
      .map do |line|
        JSON.parse(line)
      rescue JSON::ParserError => e
        @logger.error(e)
        {}
      end
      .filter { |hash| hash.key?('coordinates') }
      .map { |hash| measurement(hash) }
  end

  private

  def measurement(hash)
    OpenAq::Measurement.new(
      sensor_name: hash['parameter'],
      value: hash['value'],
      latitude: to_big_decimal(hash['coordinates']['latitude']),
      longitude: to_big_decimal(hash['coordinates']['longitude']),
      time_local: to_date_time_with_no_timezone(hash['date']['local']),
      time_utc: to_date_time_with_no_timezone(hash['date']['utc']),
      location: hash['location'],
      city: hash['city'],
      country: hash['country'],
      unit: hash['unit']
    )
  end

  # In AirCasting we do not use timezones. All times are considered UTC.
  def to_date_time_with_no_timezone(string)
    DateTime.parse(string).change(offset: 0)
  end

  def to_big_decimal(number)
    BigDecimal(number.to_s).round(9)
  end
end
