require 'rails_helper'

RSpec.describe FixedStreaming::ParamsParser do
  subject { described_class.new }

  let(:user) { create(:user) }
  let(:valid_data) do
    {
      measurement_type: 'Particulate Matter',
      measurements: [
        {
          longitude: -73.976343,
          latitude: 40.680356,
          time: '2025-02-10T08:55:32',
          timezone_offset: 0,
          milliseconds: 0,
          measured_value: 0,
          value: 0,
        },
      ],
      sensor_package_name: 'AirBeam3-94e686f5a350',
      sensor_name: 'AirBeam3-PM1',
      session_uuid: 'session-uuid',
      measurement_short_type: 'PM',
      unit_symbol: 'µg/m³',
      threshold_high: 55,
      threshold_low: 9,
      threshold_medium: 35,
      threshold_very_high: 150,
      threshold_very_low: 0,
      unit_name: 'microgram per cubic meter',
    }
  end

  describe '#call' do
    context 'when params are valid and session exists' do
      let(:expected_parsed_data) do
        {
          measurement_type: 'Particulate Matter',
          measurements: [
            {
              longitude: -73.976343,
              latitude: 40.680356,
              time: '2025-02-10T08:55:32',
              value: 0,
            },
          ],
          sensor_package_name: 'AirBeam3-94e686f5a350',
          sensor_name: 'AirBeam3-PM1',
          session_uuid: 'session-uuid',
          measurement_short_type: 'PM',
          unit_symbol: 'µg/m³',
          threshold_high: 55,
          threshold_low: 9,
          threshold_medium: 35,
          threshold_very_high: 150,
          threshold_very_low: 0,
          unit_name: 'microgram per cubic meter',
        }
      end

      context 'with compression' do
        it 'returns success with session, data, and data_flow' do
          session = create(:fixed_session, user: user, uuid: 'session-uuid')
          compressed_data =
            Base64.encode64(AirCasting::GZip.deflate(valid_data.to_json))

          result =
            subject.call(
              data: compressed_data,
              compression: true,
              user_id: user.id,
            )

          expect(result).to be_a(Success)
          expect(result.value[:session]).to eq(session)
          expect(result.value[:data]).to eq(expected_parsed_data)
          expect(result.value[:data_flow]).to eq(:sync)
        end
      end

      context 'without compression' do
        it 'returns success with session, data, and data_flow' do
          session = create(:fixed_session, user: user, uuid: 'session-uuid')

          result =
            subject.call(
              data: valid_data.to_json,
              compression: false,
              user_id: user.id,
            )

          expect(result).to be_a(Success)
          expect(result.value[:session]).to eq(session)
          expect(result.value[:data]).to eq(expected_parsed_data)
          expect(result.value[:data_flow]).to eq(:live)
        end
      end
    end

    context 'when some measurements have invalid time' do
      it 'returns success with valid measurements only' do
        session = create(:fixed_session, user: user, uuid: 'session-uuid')
        invalid_data =
          valid_data.merge(
            measurements: [
              {
                longitude: -73.976343,
                latitude: 40.680356,
                time: Time.now + 49.hours,
                timezone_offset: 0,
                milliseconds: 0,
                measured_value: 0,
                value: 0,
              },
              {
                longitude: -73.976343,
                latitude: 40.680356,
                time: '2025-02-10T08:55:32',
                timezone_offset: 0,
                milliseconds: 0,
                measured_value: 0,
                value: 0,
              },
            ],
          )
        compressed_data =
          Base64.encode64(AirCasting::GZip.deflate(invalid_data.to_json))

        result =
          subject.call(
            data: compressed_data,
            compression: true,
            user_id: user.id,
          )

        expect(result).to be_a(Success)
        expect(result.value[:session]).to eq(session)
        expect(result.value[:data][:measurements].size).to eq(1)
        expect(result.value[:data][:measurements].first[:time]).to eq(
          '2025-02-10T08:55:32',
        )
        expect(result.value[:data_flow]).to eq(:sync)
      end
    end

    context 'when session does not exist' do
      it 'returns failure with session not found error' do
        result =
          subject.call(
            data: valid_data.to_json,
            compression: false,
            user_id: user.id,
          )

        expect(result).to be_a(Failure)
        expect(result.errors).to eq('session not found')
      end
    end

    context 'when params are invalid' do
      context 'when required fields are missing' do
        it 'returns failure with validation errors' do
          invalid_data = valid_data.except(:measurement_type)

          result =
            subject.call(
              data: invalid_data.to_json,
              compression: false,
              user_id: user.id,
            )

          expect(result).to be_a(Failure)
          expect(result.errors).to eq(measurement_type: ['is missing'])
        end
      end

      context 'when there is no measurements with valid time' do
        it 'returns failure with validation errors' do
          invalid_data =
            valid_data.merge(
              measurements: [
                {
                  longitude: -73.976343,
                  latitude: 40.680356,
                  time: (Time.now + 48.hours + 1.second).iso8601,
                  timezone_offset: 0,
                  milliseconds: 0,
                  measured_value: 0,
                  value: 0,
                },
              ],
            )

          result =
            subject.call(
              data: invalid_data.to_json,
              compression: false,
              user_id: user.id,
            )

          expect(result).to be_a(Failure)
          expect(result.errors).to eq('no measurements with valid time found')
        end
      end
    end
  end
end
