require 'rails_helper'

describe 'GET api/v3/timelapse' do
  context 'with correct params' do
    it 'returns stream averages for selected 24h period for one session in params' do
      session = create_fixed_session!
      stream = create_stream!({ session: session })
      measurement_values_hash = {}
      48.times do |measurement_number|
        measurement = create_measurement!({
                        stream: stream,
                        latitude: session.latitude,
                        longitude: session.longitude,
                        time: Time.current.beginning_of_hour - 30.minutes * measurement_number
                        value: rand(100)
                      })

        measurements_values_hash = measurement_values_hash.merge({ measurement_number => measurement.value })
      end

      get "/api/v3/timelapse?clusters[0][session_ids][]=#{session.id}&time_period=1.day"

      hourly_averages_hash = {
        24.times do |hour|
          {
            cluster_id: 0,
            time: Time.current.beginning_of_hour - 1.hour * hour,
            value: (measurement_values_hash[hour] + measurement_values_hash[hour + 1]) / 2
          }
        end
      }


      expected_response = {
        session.id => hourly_averages_hash
      }

      expect(JSON.parse(response.body)).to eq(expected_response)
    end

    it 'returns stream averages for selected 24h period for two sessions in one cluster' do
      session1 = create_fixed_session!
      session2 = create_fixed_session!
      stream1 = create_stream!({ session: session1 })
      stream2 = create_stream!({ session: session2 })
      measurement_values_hash1 = {}
      measurement_values_hash2 = {}
      48.times do |measurement_number|
        measurement1 = create_measurement!({
                        stream: stream1,
                        latitude: session1.latitude,
                        longitude: session1.longitude,
                        time: Time.current.beginning_of_hour - 30.minutes * measurement_number
                        value: rand(100)
                      })

        measurement2 = create_measurement!({
                        stream: stream2,
                        latitude: session2.latitude,
                        longitude: session2.longitude,
                        time: Time.current.beginning_of_hour - 30.minutes * measurement_number
                        value: rand(100)
                      })

        measurements_values_hash1 = measurement_values_hash1.merge({ measurement_number => measurement1.value })
        measurements_values_hash2 = measurement_values_hash2.merge({ measurement_number => measurement2.value })
      end

      get "/api/v3/timelapse?clusters[0][session_ids][]=#{session1.id}&clusters[0][session_ids][]=#{session2.id}&time_period=1.day"

      hourly_averages_hash1 = {
        24.times do |hour|
          {
            cluster_id: 0,
            time: Time.current.beginning_of_hour - 1.hour * hour,
            value: (measurement_values_hash1[hour] + measurement_values_hash1[hour + 1]) / 2
          }
        end
      }

      hourly_averages_hash2 = {
        24.times do |hour|
          {
            cluster_id: 0,
            time: Time.current.beginning_of_hour - 1.hour * hour,
            value: (measurement_values_hash2[hour] + measurement_values_hash2[hour + 1]) / 2
          }
        end
      }

      expected_response = {
        session1.id => hourly_averages_hash1,
        session2.id => hourly_averages_hash2
      }

      expect(JSON.parse(response.body)).to eq(expected_response)
    end
  end
end


# get two clusters with two sessions inside each

# get "/api/v3/timelapse?clusters[0][session_ids][]=#{session.id}&clusters[0][session_ids][]=#{session.id}&clusters[1][session_ids][]=#{session.id}&clusters[1][session_ids][]=#{session.id}&time_period=1.day"
