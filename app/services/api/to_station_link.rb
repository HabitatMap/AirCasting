# `/g/:url_token?sensor_name=...` -> the web map, opened on one government
# stream. The counterpart of Api::ToLink, which does the same for a session
# behind `/s/:url_token`.
#
# `sensor_name` is required for the same reason it is on `/s/`: the web shows
# one stream at a time and has no station view to land on and switch parameter
# from. A station carries several streams, so the link has to name one.
#
# The web map's unit of selection for government data is a *station stream*,
# not a station -- StationStreamsSerializer sends `id` and `streams[].id` both
# as `station_streams.id`, and the calendar page routes to
# `/station_streams/:id` whenever the sensor name starts with "Government".
# So both id slots below carry the station stream's id. The station is only how
# the token resolves.
class Api::ToStationLink
  SENSOR_PREFIX = 'Government-'.freeze

  def initialize(contract:)
    @contract = contract
  end

  def call
    return Failure.new(contract.errors.to_h) if contract.failure?

    station = ::Station.shown.find_by(url_token: data[:url_token]) or raise NotFound
    stream = stream_for(station, data[:sensor_name]) or raise NotFound

    Success.new(link(stream))
  end

  private

  attr_reader :contract

  def data
    contract.to_h
  end

  # Canonical streams only, matching what the map draws: a station can hold a
  # non-canonical duplicate of the same measurement type in another unit.
  def stream_for(station, sensor_name)
    station
      .station_streams
      .joins(:stream_configuration)
      .where(stream_configurations: { canonical: true })
      .find { |candidate| sensor_name_for(candidate).casecmp?(sensor_name.to_s) }
  end

  def sensor_name_for(stream)
    "#{SENSOR_PREFIX}#{stream.stream_configuration.measurement_type}"
  end

  def link(stream)
    config = stream.stream_configuration

    params = {
      sessionId: stream.id,
      streamId: stream.id,
      thresholdMin: config.threshold_very_low,
      thresholdLow: config.threshold_low,
      thresholdMiddle: config.threshold_medium,
      thresholdHigh: config.threshold_high,
      thresholdMax: config.threshold_very_high,
      currentUserSettings: 'MODAL_VIEW',
      sessionType: 'fixed',
      # The catalogue name the map filters on ("Particulate Matter"), not the
      # source's own spelling ("PM2.5") which is what the sensor name carries.
      measurementType: CGI.escape(Explore::Parameters.government_key(config.measurement_type)),
      sensorName: sensor_name_for(stream),
      previousUserSettings: 'MAP_VIEW',
    }

    "#{Rails.application.routes.url_helpers.root_path}?#{params.map { |k, v| "#{k}=#{v}" }.join('&')}"
  end
end
