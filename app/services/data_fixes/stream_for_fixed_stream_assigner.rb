module DataFixes
  class StreamForFixedStreamAssigner
    def call
      user = User.find_by!(username: 'eea_importer')
      eea_source_id = Source.find_by!(name: 'EEA').id
      threshold_set_id = ThresholdSet.find_by!(is_default: true).id
      current_time = Time.current

      session =
        Session.find_or_create_by!(uuid: 'eea_temp_session') do |session|
          session.user = user
          session.title = 'EEA TEMP session'
          session.type = 'FixedSession'
          session.latitude = 200
          session.longitude = 200
          session.is_indoor = true
          session.start_time_local = current_time
          session.end_time_local = current_time
        end

      FixedStream
        .where(source_id: eea_source_id)
        .where(stream_id: nil)
        .in_batches(of: 1000) do |batch|
          fixed_stream_ids = batch.pluck(:id)

          stream_rows =
            fixed_stream_ids.map do
              {
                session_id: session.id,
                threshold_set_id: threshold_set_id,
                sensor_name: 'test',
                unit_name: 'test',
                unit_symbol: 'test',
                measurement_type: 'test',
                measurement_short_type: 'test',
              }
            end

          inserted = Stream.insert_all!(stream_rows, returning: %w[id])
          stream_ids = inserted.rows.flatten

          case_sql = +'CASE id '
          fixed_stream_ids
            .zip(stream_ids)
            .each do |fs_id, s_id|
              case_sql <<
                ActiveRecord::Base.send(
                  :sanitize_sql_array,
                  ['WHEN ? THEN ? ', fs_id, s_id],
                )
            end
          case_sql << 'END'

          FixedStream
            .where(id: fixed_stream_ids)
            .update_all(
              ["stream_id = #{case_sql}, updated_at = ?", current_time],
            )
        end
    end
  end
end
