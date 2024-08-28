class Api::ToSensorsArray
  def initialize(form:)
    @form = form
  end

  def call
    return Failure.new(form.errors) if form.invalid?

    Success.new(aggregated + sensors(data.session_type))
  end

  private

  attr_reader :form

  def data
    form.to_h
  end

  def aggregated
    Sensor.aggregated.map do |sensor|
      {
        id: nil,
        session_count: 0,
        sensor_name: sensor.fetch(:sensor_name),
        measurement_type: sensor.fetch(:measurement_type),
        unit_symbol: sensor.fetch(:unit_symbol),
      }
    end
  end

  def sensors(session_type)
    excluded_sensors = [
      "AirBeam2-PM1", "AirBeam3-PM1", "AirBeamMini-PM1",
      "AirBeam2-PM2.5", "AirBeam3-PM2.5", "AirBeamMini-PM2.5",
      "AirBeam2-PM10", "AirBeam3-PM10", "AirBeamMini-PM10",
    ]

    Stream
      .joins(:session)
      .where('sessions.contribute' => true)
      .where('sessions.type' => session_type)
      .select(
        :sensor_name,
        :measurement_type,
        :unit_symbol,
        'count(*) as session_count'
      )
      .group(:sensor_name, :measurement_type, :unit_symbol)
      .map { |stream| stream.attributes.symbolize_keys }
  end
end
