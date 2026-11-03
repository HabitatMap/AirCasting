require 'swagger_helper'

RSpec.describe 'Explore station detail', type: :request do
  stream_schema = {
    type: :object,
    required: %w[stream_id sensor_name measurement_type unit_symbol update_frequency
                 last_measurement last_24h],
    properties: {
      stream_id: {
        type: :integer, example: 35_404,
        description: '`streams.id` for AirBeam, `station_streams.id` for government, so it is ' \
                     'unique only within a `source`. The same id `GET /api/v3/explore/map` sends',
      },
      sensor_name: {
        type: :string, example: 'AirBeam-PM1',
        description: 'The sensor the reading comes from, as in `/api/sensors`',
      },
      measurement_type: {
        type: :string, example: 'Particulate Matter',
        description: 'As `/api/sensors` spells it. Every stream is listed, so a pollutant that ' \
                     "is not one of the map's filter chips appears under its own spelling",
      },
      unit_symbol: {
        type: :string, example: 'µg/m³',
        description: 'The unit the value is in. Temperature is Fahrenheit',
      },
      update_frequency: {
        type: :string, enum: [Explore::AirbeamStationQuery::UPDATE_FREQUENCY,
                              Explore::GovStationQuery::UPDATE_FREQUENCY],
        example: '1 minute',
        description: 'How often this stream reports. Display text, not a duration to parse',
      },
      last_measurement: {
        type: :object, nullable: true,
        required: %w[value time],
        description: 'Same shape as `last_measurement` on `GET /api/v3/explore/map`. Null when ' \
                     'the stream has never reported',
        properties: {
          value: {
            type: :integer, example: 8,
            description: 'Rounded to a whole number. AirBeam: the last hourly average, or the ' \
                         'newest reading while there is none. Government: the newest reading',
          },
          time: {
            type: :integer, format: :int64, example: 1_793_282_400_000,
            description: 'Epoch milliseconds, UTC. May be days old on a station that stopped ' \
                         'reporting',
          },
        },
      },
      last_24h: {
        type: :object, nullable: true,
        required: %w[min max],
        description: "This stream's lowest and highest reading over the last 24 hours, from raw " \
                     'readings rather than hourly averages. Null when it reported nothing in ' \
                     'that window',
        properties: {
          min: { type: :integer, example: 3, description: 'Rounded to a whole number' },
          max: { type: :integer, example: 10, description: 'Rounded to a whole number' },
        },
      },
    },
  }

  path '/api/v3/explore/stations/{uuid}' do
    get '[ALPHA] One AirBeam fixed session or government station in full' do
      tags 'Mobile app: Explore map'
      produces 'application/json'
      security []
      description <<~DESC
        One station in full, behind a marker on `GET /api/v3/explore/map`: the same item, plus
        `device_model`, `share_url`, `time_zone`, `is_active` and each stream's
        `update_frequency` and 24-hour range.

        **Every stream is returned**, not only those matching the map's filter chips — an
        AirBeam session lists PM1 and PM10 next to PM2.5.

        **A station that stopped reporting still answers.** The map shows only what reported in
        the last 24 hours; this endpoint has no such filter, so a station that went quiet still
        opens, with `is_active: false`, its last reading at its real age, and `last_24h: null`.

        `uuid` alone addresses both sources: `sessions.uuid` for AirBeam, `stations.uuid` for
        government. The two never overlap, so a client can follow a marker without carrying its
        `source` back.
      DESC

      parameter name: :uuid, in: :path, required: true,
                schema: { type: :string },
                description: 'The `uuid` of an item returned by `GET /api/v3/explore/map`'

      response '200', 'the station detail' do
        schema type: :object,
               required: %w[uuid source title provider latitude longitude time_zone device_model
                            is_active streams],
               properties: {
                 uuid: {
                   type: :string, example: '0b7e3f5a-6c1d-4e2f-9a8b-3c4d5e6f7a8b',
                   description: '`sessions.uuid` for AirBeam, `stations.uuid` for government',
                 },
                 source: { type: :string, enum: Explore::Map::SOURCES, example: 'airbeam' },
                 title: { type: :string, example: 'Home AirBeam Garden' },
                 provider: {
                   type: :string, example: 'jane',
                   description: "AirBeam: the owner's username. Government: the source's full name",
                 },
                 latitude: { type: :number, format: :double, example: 40.1 },
                 longitude: { type: :number, format: :double, example: -73.2 },
                 time_zone: {
                   type: :string, example: 'America/New_York',
                   description: 'IANA zone of the station. Use it to render ' \
                                '`last_measurement.time` as local time at the sensor',
                 },
                 device_model: {
                   type: :string, nullable: true, example: 'AirBeamMini',
                   description: 'The AirBeam model, where it is known — never the MAC address, ' \
                                "and never the owner's own name for their device. Null for a " \
                                'government station, and for an AirBeam session whose streams ' \
                                'name no model the server recognises',
                 },
                 share_url: {
                   type: :string, example: 'https://aircasting.org/s/ab12c',
                   description: 'A link to this item on the web map: `/s/<token>` for an AirBeam ' \
                                'session, `/g/<token>` for a government station. Append ' \
                                '`?sensor_name=<stream>` — both routes require it, because the ' \
                                'web shows one stream at a time. **May be absent** for a ' \
                                'government station that has no token yet; treat absent as ' \
                                '"not shareable", not as an error',
                 },
                 is_active: {
                   type: :boolean, example: true,
                   description: 'Whether the station reported within the last 24 hours and was ' \
                                'not finished by its owner',
                 },
                 streams: {
                   type: :array,
                   minItems: 1,
                   description: 'Every stream of the station, catalogue order first and the rest ' \
                                'by sensor name',
                   items: stream_schema,
                 },
               }

        let(:measured_at) { 1.hour.ago.change(usec: 0) }
        let!(:session) do
          create(
            :fixed_session,
            title: 'Home AirBeam Garden',
            latitude: 40.1,
            longitude: -73.2,
            time_zone: 'America/New_York',
            last_measurement_at: 5.minutes.ago,
          ).tap do |session|
            stream =
              create(
                :stream,
                session: session,
                sensor_name: 'AirBeamMini-PM2.5',
                measurement_type: 'Particulate Matter',
                unit_symbol: 'µg/m³',
                sensor_package_name: 'AirBeamMini:00189610719f',
              )
            create(:fixed_measurement, stream: stream, value: 8.4,
                   time: measured_at, time_with_time_zone: measured_at)
            create(:fixed_measurement, stream: stream, value: 3.2,
                   time: measured_at - 4.hours, time_with_time_zone: measured_at - 4.hours)
          end
        end
        let(:uuid) { session.uuid }

        run_test! do |response|
          json = JSON.parse(response.body)

          expect(json).to include(
            'uuid' => session.uuid,
            'source' => 'airbeam',
            'title' => 'Home AirBeam Garden',
            'provider' => session.user.username,
            'time_zone' => 'America/New_York',
            'device_model' => 'AirBeamMini',
            'is_active' => true,
          )
          expect(json['share_url']).to end_with("/s/#{session.url_token}")
          expect(json['streams']).to eq(
            [
              {
                'stream_id' => session.streams.first.id,
                'sensor_name' => 'AirBeamMini-PM2.5',
                'measurement_type' => 'Particulate Matter',
                'unit_symbol' => 'µg/m³',
                'update_frequency' => '1 minute',
                'last_measurement' => { 'value' => 8, 'time' => measured_at.to_i * 1_000 },
                'last_24h' => { 'min' => 3, 'max' => 8 },
              },
            ],
          )
        end
      end

      response '404', 'no public item of either source has this uuid' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'not_found' },
                 message: { type: :string, example: 'Station not found' },
               }

        let(:uuid) { '0b7e3f5a-6c1d-4e2f-9a8b-3c4d5e6f7a8b' }

        run_test! do |response|
          expect(JSON.parse(response.body)['error_code']).to eq('not_found')
        end
      end
    end
  end
end
