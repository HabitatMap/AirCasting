require 'rails_helper'
  describe Api::Realtime::SessionsController do
    describe 'sync_measurements' do
      title = 'session title'
      user = create_user!
      start_time_local = DateTime.new(2_000, 10, 1, 2, 3)
      end_time_local = DateTime.new(2_001, 11, 4, 5, 6)
      session = create_fixed_session!
      stream = create_stream!(session: session, sensor_name: 'sensor-name')
      other_stream =
        create_stream!(session: session, sensor_name: 'yet another-sensor-name')
      measurement = create_measurement!(stream: stream, time: start_time_local)
      other_measurement = create_measurement!(stream: other_stream, time: start_time_local)

      last_measurement_sync = '2016-05-11T17:09:02'

      before do
        allow(FixedSession).to receive(:find_by_uuid).and_return(session)
      end

      expected_response = {
        id: session.id,
        created_at: session.created_at.iso8601(3),
        updated_at: session.updated_at.iso8601(3),
        user_id: session.user_id,
        uuid: session.uuid,
        url_token: session.url_token,
        title: session.title,
        contribute: session.contribute,
        start_time_local: session.start_time_local.iso8601(3),
        end_time_local: session.end_time_local.iso8601(3),
        is_indoor: session.is_indoor,
        latitude: session.latitude.to_f,
        longitude: session.longitude.to_f,
        last_measurement_at: session.last_measurement_at.iso8601(3),
        version: session.version,
        time_zone: session.time_zone,
        tag_list: session.tag_list,
        type: session.type,
        streams: {
          stream.sensor_name.to_sym => {
            id: stream.id,
            sensor_name: stream.sensor_name,
            unit_name: stream.unit_name,
            measurement_type: stream.measurement_type,
            measurement_short_type: stream.measurement_short_type,
            unit_symbol: stream.unit_symbol,
            threshold_very_low: stream.threshold_set.threshold_very_low,
            threshold_low: stream.threshold_set.threshold_low,
            threshold_high: stream.threshold_set.threshold_high,
            threshold_very_high: stream.threshold_set.threshold_very_high,
            threshold_medium: stream.threshold_set.threshold_medium,
            session_id: stream.session_id,
            sensor_package_name: stream.sensor_package_name,
            measurements_count: stream.measurements_count,
            min_latitude: stream.min_latitude.to_f,
            max_latitude: stream.max_latitude.to_f,
            min_longitude: stream.min_longitude.to_f,
            max_longitude: stream.max_longitude.to_f,
            average_value: stream.average_value,
            start_longitude: stream.start_longitude,
            start_latitude: stream.start_latitude,
            size: stream.size,
            measurements: [
              {
                id: measurement.id,
                value: measurement.value,
                latitude: measurement.latitude.to_f,
                longitude: measurement.longitude.to_f,
                time: measurement.time.utc.iso8601(3),
                stream_id: measurement.stream_id,
                milliseconds: measurement.milliseconds,
                measured_value: measurement.measured_value,
                location: measurement.location.to_s,
                time_with_time_zone: measurement.time_with_time_zone.iso8601(3),
              },
            ],
          },
          other_stream.sensor_name.to_sym => {
            id: other_stream.id,
            sensor_name: other_stream.sensor_name,
            unit_name: other_stream.unit_name,
            measurement_type: other_stream.measurement_type,
            measurement_short_type: other_stream.measurement_short_type,
            unit_symbol: other_stream.unit_symbol,
            threshold_very_low: other_stream.threshold_set.threshold_very_low,
            threshold_low: other_stream.threshold_set.threshold_low,
            threshold_high: other_stream.threshold_set.threshold_high,
            threshold_very_high: other_stream.threshold_set.threshold_very_high,
            threshold_medium: other_stream.threshold_set.threshold_medium,
            session_id: other_stream.session_id,
            sensor_package_name: other_stream.sensor_package_name,
            measurements_count: other_stream.measurements_count,
            min_latitude: other_stream.min_latitude.to_f,
            max_latitude: other_stream.max_latitude.to_f,
            min_longitude: other_stream.min_longitude.to_f,
            max_longitude: other_stream.max_longitude.to_f,
            average_value: other_stream.average_value,
            start_longitude: other_stream.start_longitude,
            start_latitude: other_stream.start_latitude,
            size: other_stream.size,
            measurements: [
              {
                id: other_measurement.id,
                value: other_measurement.value,
                latitude: other_measurement.latitude.to_f,
                longitude: other_measurement.longitude.to_f,
                time: other_measurement.time.utc.iso8601(3),
                stream_id: other_measurement.stream_id,
                milliseconds: other_measurement.milliseconds,
                measured_value: other_measurement.measured_value,
                location: other_measurement.location.to_s,
                time_with_time_zone: other_measurement.time_with_time_zone.iso8601(3),
              },
            ],
          },
        },
      }

      it 'returns session as synchronizable' do
        get :sync_measurements, params: { uuid: session.uuid, last_measurement_sync: last_measurement_sync }

        actual_response = json_response.deep_symbolize_keys
        actual_response[:streams] = actual_response[:streams].transform_keys(&:to_sym)

        expect(actual_response).to eq(expected_response)
      end
    end

    private

    def create_fixed_session!(attr)
      FixedSession.create!(
        title: attr.fetch(:title, 'title'),
        user: attr.fetch(:user),
        uuid: SecureRandom.uuid,
        start_time_local: attr.fetch(:start_time_local, DateTime.current),
        end_time_local: attr.fetch(:end_time_local, DateTime.current),
        is_indoor: false,
        latitude: 123,
        longitude: 123,
      )
    end
  end
