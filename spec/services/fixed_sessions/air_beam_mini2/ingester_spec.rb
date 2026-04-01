require 'rails_helper'

RSpec.describe FixedSessions::AirBeamMini2::Ingester do
  subject(:ingester) { described_class.new }

  let(:user) { create(:user) }
  let(:session) { create(:fixed_session, user: user, time_zone: 'UTC') }
  let(:threshold_set) { create(:threshold_set) }
  let(:stream) do
    Stream.create!(
      session: session,
      sensor_name: 'AirBeam-PM2.5',
      sensor_package_name: 'AA:BB:CC:DD:EE:FF',
      unit_name: 'micrograms per cubic meter',
      unit_symbol: 'µg/m³',
      measurement_type: 'Particulate Matter',
      measurement_short_type: 'PM',
      threshold_set: threshold_set,
      sensor_type_id: 2,
      min_latitude: session.latitude,
      max_latitude: session.latitude,
      min_longitude: session.longitude,
      max_longitude: session.longitude,
    )
  end

  let(:epoch) { 1_711_619_400 }

  def build_binary(measurements)
    count = measurements.size
    header = ['ABBA', count].pack('a4n')
    body = measurements.map { |m| [m[:epoch], m[:sensor_type_id], m[:value]].pack('NCg') }.join
    payload = header + body
    checksum = payload.bytes.inject(0, :^)
    payload + [checksum].pack('C')
  end

  before { stream }

  describe '#call' do
    context 'with valid binary payload' do
      let(:binary) { build_binary([{ epoch: epoch, sensor_type_id: 2, value: 25.5 }]) }

      it 'returns Success' do
        result = ingester.call(session: session, binary: binary)
        expect(result).to be_success
      end

      it 'creates a FixedMeasurement' do
        expect {
          ingester.call(session: session, binary: binary)
        }.to change(FixedMeasurement, :count).by(1)
      end

      it 'stores the value correctly' do
        ingester.call(session: session, binary: binary)
        expect(FixedMeasurement.last.value).to be_within(0.01).of(25.5)
      end

      it 'stores local time in the time column' do
        ingester.call(session: session, binary: binary)
        measurement = FixedMeasurement.last
        expected_local = Time.at(epoch).in_time_zone('UTC')
        expect(measurement.time.utc).to be_within(1.second).of(expected_local)
      end

      it 'updates session end_time_local and last_measurement_at' do
        ingester.call(session: session, binary: binary)
        session.reload
        expect(session.last_measurement_at).not_to be_nil
      end
    end

    context 'when the same measurement is sent twice' do
      let(:binary) { build_binary([{ epoch: epoch, sensor_type_id: 2, value: 25.5 }]) }

      it 'does not create a duplicate' do
        ingester.call(session: session, binary: binary)
        expect {
          ingester.call(session: session, binary: binary)
        }.not_to change(FixedMeasurement, :count)
      end
    end

    context 'with unknown sensor_type_id' do
      let(:binary) { build_binary([{ epoch: epoch, sensor_type_id: 9, value: 1.0 }]) }

      it 'returns Failure' do
        result = ingester.call(session: session, binary: binary)
        expect(result).to be_failure
        expect(result.errors[:base]).to include(match(/unknown sensor_type_id/))
      end
    end

    context 'with invalid binary (bad checksum)' do
      let(:binary) do
        good = build_binary([{ epoch: epoch, sensor_type_id: 2, value: 1.0 }])
        good[0..-2] + [(good.bytes.last ^ 0xFF)].pack('C')
      end

      it 'returns Failure' do
        result = ingester.call(session: session, binary: binary)
        expect(result).to be_failure
      end
    end
  end
end
