require 'rails_helper'

describe 'GET api/v3/timelapse', type: :request do
  context 'with correct params' do
    it 'returns clustered information about sessions with measurements from last 7 days' do
      reference_time = DateTime.current
      reference_latitude = 50.0
      reference_longitude = 19.0

      active_session =
        create(
          :fixed_session,
          last_measurement_at: reference_time,
          start_time_local: reference_time - 1.day,
          end_time_local: reference_time,
          latitude: reference_latitude,
          longitude: reference_longitude,
        )
      active_stream =
        create(
          :stream,
          session: active_session,
          min_latitude: reference_latitude,
          max_latitude: reference_latitude,
          min_longitude: reference_longitude,
          max_longitude: reference_longitude,
        )

      create(
        :fixed_measurement,
        stream: active_stream,
        time: reference_time - 2.hours,
        time_with_time_zone: reference_time - 2.hours,
        value: 2,
      )

      create(
        :fixed_measurement,
        stream: active_stream,
        time: reference_time - 3.hours,
        time_with_time_zone: reference_time - 3.hours,
        value: 4,
      )

      # Session close to the original active session (should be clustered together)
      close_session =
        create(
          :fixed_session,
          last_measurement_at: reference_time,
          latitude: reference_latitude + 0.0001,
          longitude: reference_longitude + 0.0001,
          start_time_local: reference_time - 1.day,
          end_time_local: reference_time,
        )

      close_stream =
        create(
          :stream,
          session: close_session,
          min_latitude: close_session.latitude,
          max_latitude: close_session.latitude,
          min_longitude: close_session.longitude,
          max_longitude: close_session.longitude,
        )

      create(
        :fixed_measurement,
        stream: close_stream,
        time: reference_time - 2.hours - 1.minute,
        time_with_time_zone: reference_time - 2.hours - 1.minute,
        value: 4,
      )

      create(
        :fixed_measurement,
        stream: close_stream,
        time: reference_time - 3.hours,
        time_with_time_zone: reference_time - 3.hours,
        value: 6,
      )

      # Session far away (should be isolated)
      far_session =
        create(
          :fixed_session,
          last_measurement_at: reference_time,
          latitude: active_session.latitude + 10,
          longitude: active_session.longitude + 10,
          start_time_local: reference_time - 1.day,
          end_time_local: reference_time,
        )

      far_stream =
        create(
          :stream,
          session: far_session,
          min_latitude: far_session.latitude,
          max_latitude: far_session.latitude,
          min_longitude: far_session.longitude,
          max_longitude: far_session.longitude,
        )

      create(
        :fixed_measurement,
        stream: far_stream,
        time: reference_time - 2.hours,
        time_with_time_zone: reference_time - 2.hours,
        value: 10,
      )

      get '/api/v3/timelapse',
          params: {
            q: {
              time_from: (10.days.ago.to_datetime.strftime('%Q').to_i / 1_000),
              time_to: (Time.now.to_datetime.strftime('%Q').to_i / 1_000),
              tags: '',
              usernames: '',
              session_ids: [],
              west: reference_longitude - 10,
              east: reference_longitude + 10,
              south: reference_latitude - 10,
              north: reference_latitude + 10,
              sensor_name: active_stream.sensor_name,
              measurement_type: active_stream.measurement_type,
              unit_symbol: active_stream.unit_symbol,
            }.to_json,
          }

      expected = {
        (reference_time.beginning_of_hour - 1.hour).utc.strftime(
          '%Y-%m-%d %H:%M:%S +0000',
        ) => [
          {
            'latitude' => 50.00005,
            'longitude' => 19.00005,
            'sessions' => 2,
            'value' => 3.0,
          },
          {
            'value' => 10.0,
            'latitude' => 60.0,
            'longitude' => 29.0,
            'sessions' => 1,
          },
        ],
        (reference_time.beginning_of_hour - 2.hour).utc.strftime(
          '%Y-%m-%d %H:%M:%S +0000',
        ) => [
          {
            'latitude' => 50.00005,
            'longitude' => 19.00005,
            'sessions' => 2,
            'value' => 5.0,
          },
        ],
      }

      expect(JSON.parse(response.body)).to eq(expected)
    end
  end

  context 'with government sensor data using new data model' do
    it 'returns clustered timelapse data from station_streams' do
      source = create(:source, name: 'EEA')
      config =
        create(
          :stream_configuration,
          measurement_type: 'PM2.5',
          canonical: true,
        )

      reference_latitude = 50.0
      reference_longitude = 19.0

      # Two nearby station_streams (should cluster)
      stream_a =
        create(
          :station_stream,
          source: source,
          stream_configuration: config,
          location:
            "SRID=4326;POINT(#{reference_longitude} #{reference_latitude})",
          last_measured_at: 1.hour.ago,
        )
      stream_b =
        create(
          :station_stream,
          source: source,
          stream_configuration: config,
          location:
            "SRID=4326;POINT(#{reference_longitude + 0.0001} #{reference_latitude + 0.0001})",
          last_measured_at: 1.hour.ago,
        )

      measurement_hour = 2.hours.ago.beginning_of_hour
      create(
        :station_measurement,
        station_stream: stream_a,
        measured_at: measurement_hour,
        value: 10.0,
      )
      create(
        :station_measurement,
        station_stream: stream_b,
        measured_at: measurement_hour,
        value: 20.0,
      )

      # Far station_stream (should be separate)
      far_stream =
        create(
          :station_stream,
          source: source,
          stream_configuration: config,
          location:
            "SRID=4326;POINT(#{reference_longitude + 10} #{reference_latitude + 5})",
          last_measured_at: 1.hour.ago,
        )
      create(
        :station_measurement,
        station_stream: far_stream,
        measured_at: measurement_hour,
        value: 30.0,
      )

      get '/api/v3/timelapse',
          params: {
            q: {
              time_from: (10.days.ago.to_datetime.strftime('%Q').to_i / 1_000),
              time_to: (Time.now.to_datetime.strftime('%Q').to_i / 1_000),
              tags: '',
              usernames: '',
              west: reference_longitude - 20,
              east: reference_longitude + 20,
              south: reference_latitude - 10,
              north: reference_latitude + 10,
              sensor_name: 'government-pm2.5',
              measurement_type: 'Particulate Matter',
              unit_symbol: 'µg/m³',
              zoom_level: 10,
            }.to_json,
          }

      body = JSON.parse(response.body)
      expected_timestamp =
        measurement_hour.utc.strftime('%Y-%m-%d %H:%M:%S +0000')

      expect(response.status).to eq(200)
      expect(body.keys).to eq([expected_timestamp])

      entries = body[expected_timestamp]
      expect(entries.length).to eq(2)

      clustered =
        entries.find { |e| e['sessions'] == 2 }
      isolated =
        entries.find { |e| e['sessions'] == 1 }

      expect(clustered['value']).to eq(15.0)
      expect(isolated['value']).to eq(30.0)
    end
  end
end
