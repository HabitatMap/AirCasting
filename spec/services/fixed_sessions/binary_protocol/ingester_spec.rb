require 'rails_helper'

RSpec.describe FixedSessions::BinaryProtocol::Ingester do
  let(:daily_recalculator) { instance_double(FixedStreaming::StreamDailyAveragesRecalculator, call: nil) }
  let(:hourly_recalculator) { instance_double(FixedStreaming::StreamHourlyAveragesRecalculator, call: nil) }
  let(:monitor) { instance_double(FixedSessions::BinaryProtocol::Monitor, report_parse_error: nil, report_unknown_sensor_type: nil, report_transaction_error: nil) }
  subject(:ingester) do
    described_class.new(
      daily_averages_recalculator: daily_recalculator,
      hourly_averages_recalculator: hourly_recalculator,
      monitor: monitor,
    )
  end

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
    header = ["\xAB\xBA", count].pack('a2n')
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

      describe 'averages recalculation heuristic' do
        # Pin time to 14:30 so we can construct epochs relative to it reliably
        around { |example| travel_to(Time.zone.parse('2026-04-07 14:30:00')) { example.run } }

        context 'when measurement is from the current hour (live push)' do
          let(:binary) { build_binary([{ epoch: Time.current.to_i - 30, sensor_type_id: 2, value: 1.0 }]) }

          it 'does not recalculate hourly averages' do
            expect(hourly_recalculator).not_to receive(:call)
            ingester.call(session: session, binary: binary)
          end

          it 'does not recalculate daily averages' do
            expect(daily_recalculator).not_to receive(:call)
            ingester.call(session: session, binary: binary)
          end
        end

        context 'when measurement is at exactly the current hour boundary (belongs to previous bucket)' do
          let(:binary) { build_binary([{ epoch: Time.current.beginning_of_hour.to_i, sensor_type_id: 2, value: 1.0 }]) }

          it 'recalculates hourly averages' do
            expect(hourly_recalculator).to receive(:call).with(hash_including(stream_id: stream.id))
            ingester.call(session: session, binary: binary)
          end
        end

        context 'when measurement is from a previous hour but the same day' do
          let(:binary) { build_binary([{ epoch: Time.current.beginning_of_hour.to_i - 60, sensor_type_id: 2, value: 1.0 }]) }

          it 'recalculates hourly averages' do
            expect(hourly_recalculator).to receive(:call).with(hash_including(stream_id: stream.id))
            ingester.call(session: session, binary: binary)
          end

          it 'does not recalculate daily averages' do
            expect(daily_recalculator).not_to receive(:call)
            ingester.call(session: session, binary: binary)
          end
        end

        context 'when measurement is at exactly the day boundary (belongs to previous day)' do
          let(:binary) { build_binary([{ epoch: Time.current.beginning_of_day.to_i, sensor_type_id: 2, value: 1.0 }]) }

          it 'recalculates daily averages' do
            expect(daily_recalculator).to receive(:call).with(hash_including(stream_id: stream.id))
            ingester.call(session: session, binary: binary)
          end
        end

        context 'when measurement is from a previous day' do
          let(:binary) { build_binary([{ epoch: Time.current.beginning_of_day.to_i - 60, sensor_type_id: 2, value: 1.0 }]) }

          it 'recalculates hourly averages' do
            expect(hourly_recalculator).to receive(:call).with(hash_including(stream_id: stream.id))
            ingester.call(session: session, binary: binary)
          end

          it 'recalculates daily averages' do
            expect(daily_recalculator).to receive(:call).with(hash_including(stream_id: stream.id))
            ingester.call(session: session, binary: binary)
          end
        end
      end

      context 'when measurements are earlier than session start_time_local' do
        let(:early_epoch) { session.start_time_local.to_i - 3600 }
        let(:binary) { build_binary([{ epoch: early_epoch, sensor_type_id: 2, value: 5.0 }]) }

        it 'updates start_time_local to the earlier measurement time' do
          ingester.call(session: session, binary: binary)
          expect(session.reload.start_time_local).to be_within(1.second).of(Time.at(early_epoch).utc)
        end
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

      it 'returns Success (unknown streams are silently ignored)' do
        result = ingester.call(session: session, binary: binary)
        expect(result).to be_success
      end

      it 'does not create any measurements' do
        expect {
          ingester.call(session: session, binary: binary)
        }.not_to change(FixedMeasurement, :count)
      end

      it 'reports unknown sensor type to monitor' do
        expect(monitor).to receive(:report_unknown_sensor_type).with(
          session: session,
          sensor_type_id: 9,
          known_sensor_type_ids: [stream.sensor_type_id],
        )
        ingester.call(session: session, binary: binary)
      end

    end

    context 'with a mix of known and unknown sensor_type_ids' do
      let(:binary) do
        build_binary([
          { epoch: epoch, sensor_type_id: 2, value: 25.5 },
          { epoch: epoch + 1, sensor_type_id: 99, value: 10.0 },
        ])
      end

      it 'reports unknown sensor type for the unrecognized one' do
        expect(monitor).to receive(:report_unknown_sensor_type).with(
          session: session,
          sensor_type_id: 99,
          known_sensor_type_ids: [stream.sensor_type_id],
        )
        ingester.call(session: session, binary: binary)
      end

      it 'still ingests the known sensor type' do
        expect {
          ingester.call(session: session, binary: binary)
        }.to change(FixedMeasurement, :count).by(1)
      end

    end

    context 'with invalid binary (bad checksum)' do
      let(:binary) do
        good = build_binary([{ epoch: epoch, sensor_type_id: 2, value: 1.0 }])
        good[0..-2] + [(good.bytes.last ^ 0xFF)].pack('C')
      end

      it 'returns Failure with error_code from the parser' do
        result = ingester.call(session: session, binary: binary)
        expect(result).to be_failure
        expect(result.errors[:error_code]).to eq('invalid_checksum')
      end

      it 'reports parse error to monitor' do
        expect(monitor).to receive(:report_parse_error).with(
          error_code: 'invalid_checksum',
          message: 'XOR checksum does not match payload',
          session: session,
          binary_size: binary.bytesize,
        )
        ingester.call(session: session, binary: binary)
      end
    end

    context 'monitoring on successful ingestion without issues' do
      let(:binary) { build_binary([{ epoch: epoch, sensor_type_id: 2, value: 25.5 }]) }

      it 'does not report parse errors' do
        expect(monitor).not_to receive(:report_parse_error)
        ingester.call(session: session, binary: binary)
      end

      it 'does not report unknown sensor types' do
        expect(monitor).not_to receive(:report_unknown_sensor_type)
        ingester.call(session: session, binary: binary)
      end
    end
  end
end
