require 'rails_helper'

RSpec.describe FixedStreamSerializer do
  describe '#call' do
    let!(:session) { create_fixed_session! }
    let!(:stream) { create_stream!({ session: session }) }
    let!(:measurement_1) { create_measurement!({ stream: stream }) }
    let!(:measurement_2) { create_measurement!({ stream: stream }) }
    let!(:stream_daily_average_1) do
      create_stream_daily_average!(
        { stream: stream, date: Date.current, value: 10 },
      )
    end
    let!(:stream_daily_average_2) do
      create_stream_daily_average!(
        { stream: stream, date: Date.current.prev_day, value: 9 },
      )
    end

    context 'username is not US EPA AirNow' do
      it 'returns fixed stream data' do
        expected_response = {
          stream: {
            session_id: session.id,
            active: session.is_active,
            title: session.title,
            latitude: session.latitude,
            longitude: session.longitude,
            profile: session.username,
            sensor_name: stream.sensor_name,
            unit_symbol: stream.unit_symbol,
            update_frequency: '1 minute',
            last_update: stream.session.last_measurement_at,
            start_time: session.end_time_local,
            end_time: session.start_time_local,
            min: stream.threshold_set.threshold_very_low,
            low: stream.threshold_set.threshold_low,
            middle: stream.threshold_set.threshold_medium,
            high: stream.threshold_set.threshold_high,
            max: stream.threshold_set.threshold_very_high,
          },
          measurements: [
            {
              time: measurement_1.time.to_i * 1_000,
              value: measurement_1.value,
            },
            {
              time: measurement_2.time.to_i * 1_000,
              value: measurement_2.value,
            },
          ],
          stream_daily_averages: [
            {
              date: stream_daily_average_1.date.strftime('%Y-%m-%d'),
              value: stream_daily_average_1.value.round,
            },
            {
              date: stream_daily_average_2.date.strftime('%Y-%m-%d'),
              value: stream_daily_average_2.value.round,
            },
          ],
        }

        expect(
          described_class.new.call(
            stream: stream,
            measurements: [measurement_1, measurement_2],
            stream_daily_averages: [
              stream_daily_average_1,
              stream_daily_average_2,
            ],
          ),
        ).to eq(expected_response)
      end
    end

    context 'username is US EPA AirNow' do
      it 'returns data with correct update frequency for AirNow streams' do
        session.user.update!(username: 'US EPA AirNow')
        expected_response = {
          stream: {
            session_id: session.id,
            active: session.is_active,
            title: session.title,
            latitude: session.latitude,
            longitude: session.longitude,
            profile: session.username,
            sensor_name: stream.sensor_name,
            unit_symbol: stream.unit_symbol,
            update_frequency: '1 hour',
            last_update: stream.session.last_measurement_at,
            start_time: session.end_time_local,
            end_time: session.start_time_local,
            min: stream.threshold_set.threshold_very_low,
            low: stream.threshold_set.threshold_low,
            middle: stream.threshold_set.threshold_medium,
            high: stream.threshold_set.threshold_high,
            max: stream.threshold_set.threshold_very_high,
          },
          measurements: [
            {
              time: measurement_1.time.to_i * 1_000,
              value: measurement_1.value,
            },
            {
              time: measurement_2.time.to_i * 1_000,
              value: measurement_2.value,
            },
          ],
          stream_daily_averages: [
            {
              date: stream_daily_average_1.date.strftime('%Y-%m-%d'),
              value: stream_daily_average_1.value.round,
            },
            {
              date: stream_daily_average_2.date.strftime('%Y-%m-%d'),
              value: stream_daily_average_2.value.round,
            },
          ],
        }

        expect(
          described_class.new.call(
            stream: stream,
            measurements: [measurement_1, measurement_2],
            stream_daily_averages: [
              stream_daily_average_1,
              stream_daily_average_2,
            ],
          ),
        ).to eq(expected_response)
      end
    end
  end
end
