require 'rails_helper'

describe 'GET /api/v3/fixed_polling/sessions' do
  include Devise::Test::IntegrationHelpers

  let(:user) { create(:user) }
  before { sign_in(user) }

  context 'when last_measurement_sync is less than 24h before session end time' do
    it 'returns session with streams and measurements since last_measurement_sync' do
      last_measurement_time = Time.parse('2025-07-22T10:00:00')
      session =
        create(
          :fixed_session,
          uuid: 'abc123',
          end_time_local: last_measurement_time,
        )
      stream_1 = create(:stream, session: session, sensor_name: 'PM1')
      stream_2 = create(:stream, session: session, sensor_name: 'PM2.5')
      new_measurement_1 =
        create(
          :fixed_measurement,
          stream: stream_1,
          time: last_measurement_time,
        )
      new_measurement_2 =
        create(
          :fixed_measurement,
          stream: stream_2,
          time: last_measurement_time,
        )
      old_measurement_1 =
        create(
          :fixed_measurement,
          stream: stream_1,
          time: last_measurement_time - 2.hours,
        )
      old_measurement_2 =
        create(
          :fixed_measurement,
          stream: stream_2,
          time: last_measurement_time - 2.hours,
        )
      last_measurement_sync = last_measurement_time - 1.hour

      expected_response = {
        id: session.id,
        type: session.type,
        uuid: session.uuid,
        title: session.title,
        tag_list: session.tag_list.join(' '),
        start_time: session.start_time_local.iso8601(3),
        end_time: session.end_time_local.iso8601(3),
        version: session.version,
        streams: {
          stream_1.sensor_name.to_sym => {
            id: stream_1.id,
            sensor_name: stream_1.sensor_name,
            sensor_package_name: stream_1.sensor_package_name,
            unit_name: stream_1.unit_name,
            measurement_type: stream_1.measurement_type,
            measurement_short_type: stream_1.measurement_short_type,
            unit_symbol: stream_1.unit_symbol,
            threshold_very_low: stream_1.threshold_set.threshold_very_low,
            threshold_low: stream_1.threshold_set.threshold_low,
            threshold_medium: stream_1.threshold_set.threshold_medium,
            threshold_high: stream_1.threshold_set.threshold_high,
            threshold_very_high: stream_1.threshold_set.threshold_very_high,
            measurements: [
              {
                id: new_measurement_1.id,
                stream_id: new_measurement_1.stream_id,
                value: new_measurement_1.value,
                time: new_measurement_1.time.utc.iso8601(3),
                latitude: session.latitude,
                longitude: session.longitude,
                milliseconds: 0,
              },
            ],
          },
          stream_2.sensor_name.to_sym => {
            id: stream_2.id,
            sensor_name: stream_2.sensor_name,
            sensor_package_name: stream_2.sensor_package_name,
            unit_name: stream_2.unit_name,
            measurement_type: stream_2.measurement_type,
            measurement_short_type: stream_2.measurement_short_type,
            unit_symbol: stream_2.unit_symbol,
            threshold_very_low: stream_2.threshold_set.threshold_very_low,
            threshold_low: stream_2.threshold_set.threshold_low,
            threshold_medium: stream_2.threshold_set.threshold_medium,
            threshold_high: stream_2.threshold_set.threshold_high,
            threshold_very_high: stream_2.threshold_set.threshold_very_high,
            measurements: [
              {
                id: new_measurement_2.id,
                stream_id: new_measurement_2.stream_id,
                value: new_measurement_2.value,
                time: new_measurement_2.time.utc.iso8601(3),
                latitude: session.latitude,
                longitude: session.longitude,
                milliseconds: 0,
              },
            ],
          },
        },
      }

      get '/api/realtime/sync_measurements',
          params: {
            uuid: 'abc123',
            last_measurement_sync: CGI.escape(last_measurement_sync.to_s),
          }

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).deep_symbolize_keys).to eq(
        expected_response,
      )
    end
  end

  context 'when last_measurement_sync is more than 24h before session end time' do
    it 'returns session with streams and last 24 hours of measurements' do
      last_measurement_time = Time.parse('2025-07-22T10:00:00')
      session =
        create(
          :fixed_session,
          uuid: 'abc123',
          end_time_local: last_measurement_time,
        )
      stream_1 = create(:stream, session: session, sensor_name: 'PM1')
      stream_2 = create(:stream, session: session, sensor_name: 'PM2.5')
      last_24h_measurement_1 =
        create(
          :fixed_measurement,
          stream: stream_1,
          time: last_measurement_time,
        )
      last_24h_measurement_2 =
        create(
          :fixed_measurement,
          stream: stream_2,
          time: last_measurement_time,
        )
      older_measurement_1 =
        create(
          :fixed_measurement,
          stream: stream_1,
          time: last_measurement_time - 30.hours,
        )
      older_measurement_2 =
        create(
          :fixed_measurement,
          stream: stream_2,
          time: last_measurement_time - 30.hours,
        )
      last_measurement_sync = last_measurement_time - 50.hours

      expected_response = {
        id: session.id,
        type: session.type,
        uuid: session.uuid,
        title: session.title,
        tag_list: session.tag_list.join(' '),
        start_time: session.start_time_local.iso8601(3),
        end_time: session.end_time_local.iso8601(3),
        version: session.version,
        streams: {
          stream_1.sensor_name.to_sym => {
            id: stream_1.id,
            sensor_name: stream_1.sensor_name,
            sensor_package_name: stream_1.sensor_package_name,
            unit_name: stream_1.unit_name,
            measurement_type: stream_1.measurement_type,
            measurement_short_type: stream_1.measurement_short_type,
            unit_symbol: stream_1.unit_symbol,
            threshold_very_low: stream_1.threshold_set.threshold_very_low,
            threshold_low: stream_1.threshold_set.threshold_low,
            threshold_medium: stream_1.threshold_set.threshold_medium,
            threshold_high: stream_1.threshold_set.threshold_high,
            threshold_very_high: stream_1.threshold_set.threshold_very_high,
            measurements: [
              {
                id: last_24h_measurement_1.id,
                stream_id: last_24h_measurement_1.stream_id,
                value: last_24h_measurement_1.value,
                time: last_24h_measurement_1.time.utc.iso8601(3),
                latitude: session.latitude,
                longitude: session.longitude,
                milliseconds: 0,
              },
            ],
          },
          stream_2.sensor_name.to_sym => {
            id: stream_2.id,
            sensor_name: stream_2.sensor_name,
            sensor_package_name: stream_2.sensor_package_name,
            unit_name: stream_2.unit_name,
            measurement_type: stream_2.measurement_type,
            measurement_short_type: stream_2.measurement_short_type,
            unit_symbol: stream_2.unit_symbol,
            threshold_very_low: stream_2.threshold_set.threshold_very_low,
            threshold_low: stream_2.threshold_set.threshold_low,
            threshold_medium: stream_2.threshold_set.threshold_medium,
            threshold_high: stream_2.threshold_set.threshold_high,
            threshold_very_high: stream_2.threshold_set.threshold_very_high,
            measurements: [
              {
                id: last_24h_measurement_2.id,
                stream_id: last_24h_measurement_2.stream_id,
                value: last_24h_measurement_2.value,
                time: last_24h_measurement_2.time.utc.iso8601(3),
                latitude: session.latitude,
                longitude: session.longitude,
                milliseconds: 0,
              },
            ],
          },
        },
      }

      get '/api/realtime/sync_measurements',
          params: {
            uuid: 'abc123',
            last_measurement_sync: CGI.escape(last_measurement_sync.to_s),
          }

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).deep_symbolize_keys).to eq(
        expected_response,
      )
    end
  end

  context 'when session does not exists' do
    it 'returns bad request' do
      last_measurement_sync = Time.parse('2025-07-22T10:00:00')

      get '/api/realtime/sync_measurements',
          params: {
            uuid: 'abc123',
            last_measurement_sync: CGI.escape(last_measurement_sync.to_s),
          }

      expect(response).to have_http_status(:bad_request)
    end
  end

  context 'when invalid params' do
    it 'returns bad request' do
      get '/api/realtime/sync_measurements',
          params: {
            uuid: '',
            last_measurement_sync: 'e34',
          }

      expect(response).to have_http_status(:bad_request)
      expect(JSON.parse(response.body)).to eq(
        {
          'uuid' => ['must be filled'],
          'last_measurement_sync' => ['must be a date time'],
        },
      )
    end
  end

  context 'when there is no new measurements since last_measurement_sync' do
    it 'returns session with streams and measurements since last_measurement_sync' do
      last_measurement_time = Time.parse('2025-07-22 10:00')
      session =
        create(
          :fixed_session,
          uuid: 'abc123',
          end_time_local: last_measurement_time,
        )
      stream_1 = create(:stream, session: session, sensor_name: 'PM1')
      stream_2 = create(:stream, session: session, sensor_name: 'PM2.5')

      expected_response = {
        id: session.id,
        type: session.type,
        uuid: session.uuid,
        title: session.title,
        tag_list: session.tag_list.join(' '),
        start_time: session.start_time_local.iso8601(3),
        end_time: session.end_time_local.iso8601(3),
        version: session.version,
        streams: {
          stream_1.sensor_name.to_sym => {
            id: stream_1.id,
            sensor_name: stream_1.sensor_name,
            sensor_package_name: stream_1.sensor_package_name,
            unit_name: stream_1.unit_name,
            measurement_type: stream_1.measurement_type,
            measurement_short_type: stream_1.measurement_short_type,
            unit_symbol: stream_1.unit_symbol,
            threshold_very_low: stream_1.threshold_set.threshold_very_low,
            threshold_low: stream_1.threshold_set.threshold_low,
            threshold_medium: stream_1.threshold_set.threshold_medium,
            threshold_high: stream_1.threshold_set.threshold_high,
            threshold_very_high: stream_1.threshold_set.threshold_very_high,
            measurements: [],
          },
          stream_2.sensor_name.to_sym => {
            id: stream_2.id,
            sensor_name: stream_2.sensor_name,
            sensor_package_name: stream_2.sensor_package_name,
            unit_name: stream_2.unit_name,
            measurement_type: stream_2.measurement_type,
            measurement_short_type: stream_2.measurement_short_type,
            unit_symbol: stream_2.unit_symbol,
            threshold_very_low: stream_2.threshold_set.threshold_very_low,
            threshold_low: stream_2.threshold_set.threshold_low,
            threshold_medium: stream_2.threshold_set.threshold_medium,
            threshold_high: stream_2.threshold_set.threshold_high,
            threshold_very_high: stream_2.threshold_set.threshold_very_high,
            measurements: [],
          },
        },
      }

      get '/api/realtime/sync_measurements',
          params: {
            uuid: 'abc123',
            last_measurement_sync: CGI.escape(last_measurement_time.to_s),
          }

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).deep_symbolize_keys).to eq(
        expected_response,
      )
    end
  end
end
