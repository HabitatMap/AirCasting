require 'rails_helper'

describe Csv::Repository do
  subject { described_class.new }

  describe '#find_measurements' do
    context 'when MobileSession' do
      it 'returns records from measurements table ' do
        session = create(:mobile_session)
        stream =
          create(
            :stream,
            session: session,
            sensor_package_name: 'Package_A',
            sensor_name: 'Sensor_A',
            measurement_type: 'Type_A',
            unit_name: 'Unit_A',
          )
        create(
          :measurement,
          stream: stream,
          value: 42.0,
          time: Time.zone.parse('2023-01-01T10:00:00Z'),
          milliseconds: 123,
          latitude: 1.23,
          longitude: 4.56,
        )
        create(
          :measurement,
          stream: stream,
          value: 43.0,
          time: Time.zone.parse('2023-01-01T11:00:00Z'),
          milliseconds: 123,
          latitude: 1.23,
          longitude: 4.56,
        )

        expected_result = [
          {
            'stream_sensor_package_name' => 'Package_A',
            'stream_sensor_name' => 'Sensor_A',
            'stream_measurement_type' => 'Type_A',
            'stream_unit_name' => 'Unit_A',
            'session_title' => session.title,
            'measurement_time' => Time.zone.parse('2023-01-01T10:00:00Z'),
            'measurement_milliseconds' => 123,
            'measurement_latitude' => 1.23,
            'measurement_longitude' => 4.56,
            'measurement_value' => 42.0,
          },
          {
            'stream_sensor_package_name' => 'Package_A',
            'stream_sensor_name' => 'Sensor_A',
            'stream_measurement_type' => 'Type_A',
            'stream_unit_name' => 'Unit_A',
            'session_title' => session.title,
            'measurement_time' => Time.zone.parse('2023-01-01T11:00:00Z'),
            'measurement_milliseconds' => 123,
            'measurement_latitude' => 1.23,
            'measurement_longitude' => 4.56,
            'measurement_value' => 43.0,
          },
        ]

        result = subject.find_measurements(session.id, 'Package_A')

        expect(result).to match_array(expected_result)
      end
    end

    context 'when FixedSession' do
      it 'returns records from fixed_measurements table' do
        session = create(:fixed_session, latitude: 50, longitude: 19)
        stream =
          create(
            :stream,
            session: session,
            sensor_package_name: 'Package_A',
            sensor_name: 'Sensor_A',
            measurement_type: 'Type_A',
            unit_name: 'Unit_A',
          )
        create(
          :fixed_measurement,
          stream: stream,
          value: 99.0,
          time: Time.zone.parse('2023-01-01T12:00:00Z'),
        )
        create(
          :fixed_measurement,
          stream: stream,
          value: 100.0,
          time: Time.zone.parse('2023-01-01T13:00:00Z'),
        )

        expected_result = [
          {
            'stream_sensor_package_name' => 'Package_A',
            'stream_sensor_name' => 'Sensor_A',
            'stream_measurement_type' => 'Type_A',
            'stream_unit_name' => 'Unit_A',
            'session_title' => session.title,
            'measurement_time' => Time.zone.parse('2023-01-01T12:00:00Z'),
            'measurement_milliseconds' => 0,
            'measurement_latitude' => 50,
            'measurement_longitude' => 19,
            'measurement_value' => 99.0,
          },
          {
            'stream_sensor_package_name' => 'Package_A',
            'stream_sensor_name' => 'Sensor_A',
            'stream_measurement_type' => 'Type_A',
            'stream_unit_name' => 'Unit_A',
            'session_title' => session.title,
            'measurement_time' => Time.zone.parse('2023-01-01T13:00:00Z'),
            'measurement_milliseconds' => 0,
            'measurement_latitude' => 50,
            'measurement_longitude' => 19,
            'measurement_value' => 100.0,
          },
        ]

        result = subject.find_measurements(session.id, 'Package_A')

        expect(result).to match_array(expected_result)
      end

      # This is to handle some legacy cases
      context 'when sensor_package_name includes special characters' do
        it 'when sensor_package_name includes a " it does not raise' do
          session = create(:fixed_session)
          create(:stream, session: session, sensor_package_name: '"')

          expect {
            subject.find_measurements(session.id, '"')
          }.not_to raise_error
        end

        it "when sensor_package_name includes a ' it does not raise" do
          session = create(:fixed_session)
          create(:stream, session: session, sensor_package_name: "'")

          expect {
            subject.find_measurements(session.id, "'")
          }.not_to raise_error
        end
      end
    end
  end

  describe '#find_stream_parameters' do
    it 'returns correct sensor names, measurement types, and units for a session and sensor package' do
      session = create(:fixed_session)
      stream_1 =
        create(
          :stream,
          session: session,
          sensor_name: 'Sensor_A',
          measurement_type: 'Type_A',
          unit_name: 'Unit_A',
          sensor_package_name: 'Package_1',
        )
      stream_2 =
        create(
          :stream,
          session: session,
          sensor_name: 'Sensor_B',
          measurement_type: 'Type_B',
          unit_name: 'Unit_B',
          sensor_package_name: 'Package_1',
        )

      create(
        :stream,
        session: session,
        sensor_name: 'Sensor_C',
        measurement_type: 'Type_C',
        unit_name: 'Unit_C',
        sensor_package_name: 'Other_Package',
      )

      result = subject.find_stream_parameters(session.id, 'Package_1')

      expect(result['sensor_names']).to match_array(%w[Sensor_A Sensor_B])
      expect(result['measurement_types']).to match_array(%w[Type_A Type_B])
      expect(result['measurement_units']).to match_array(%w[Unit_A Unit_B])
    end
  end

  describe '#count_streams' do
    it 'returns the correct number of streams for a session and sensor package' do
      session = create(:fixed_session)
      create(
        :stream,
        session: session,
        sensor_package_name: 'Package_1',
        measurement_type: 'Type_A',
        unit_name: 'Unit_A',
      )
      create(
        :stream,
        session: session,
        sensor_package_name: 'Package_1',
        measurement_type: 'Type_B',
        unit_name: 'Unit_B',
      )

      create(:stream, session: session, sensor_package_name: 'OtherPackage')

      expect(subject.count_streams(session.id, 'Package_1')).to eq(2)
    end
  end

  describe '#find_sensor_package_names' do
    it 'returns unique and sorted sensor package names for a session' do
      session = create(:fixed_session)
      create(:stream, session: session, sensor_package_name: 'Package_B')
      create(:stream, session: session, sensor_package_name: 'Package_A')
      create(:stream, session: session, sensor_package_name: 'Package_A')
      create(:stream, session: session, sensor_package_name: 'Package_C')

      result = subject.find_sensor_package_names(session.id)

      expect(result).to eq(%w[Package_A Package_B Package_C])
    end
  end

  private

  def random_int
    rand(1_000)
  end
end
