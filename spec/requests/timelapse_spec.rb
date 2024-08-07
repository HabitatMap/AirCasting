require 'rails_helper'
require 'httparty'
require 'webmock/rspec'

describe 'GET api/v3/timelapse', type: :request do
  context 'with correct params' do
    it 'returns stream averages for selected 24h period for one session in params' do
      session = create_fixed_session!
      stream = create_stream!({ session: session })
      measurement_values_hash = {}
      last_measurement_at = Time.current.end_of_hour - 1.minute

      48.times do |measurement_number|
        measurement = create_measurement!({
          stream: stream,
          latitude: session.latitude,
          longitude: session.longitude,
          time_with_time_zone: last_measurement_at - 30.minutes * measurement_number,
          value: rand(100)
        })
        measurement_values_hash[measurement_number] = measurement.value
      end

      post '/api/v3/timelapse', params: {
        clusters: {
          0 => [stream.id]
        },
        time_period: '1'
      }.to_json, headers: { 'Content-Type' => 'application/json' }

      first_slice_time = Time.current.beginning_of_hour + 1.hour

      hourly_averages = (0..23).map do |hour|
        {
          "time" => (first_slice_time - 1.hour * hour).iso8601(3),
          "value" => (measurement_values_hash[hour * 2] + measurement_values_hash[hour * 2 + 1]) / 2.0
        }
      end

      expected_response = [{"0" => hourly_averages.reverse}]

      expect(JSON.parse(response.body)).to eq(expected_response)
    end

    it 'returns stream averages for selected 24h period for two sessions in one cluster' do
      session1 = create_fixed_session!
      session2 = create_fixed_session!
      stream1 = create_stream!({ session: session1 })
      stream2 = create_stream!({ session: session2 })
      measurement_values_hash1 = {}
      measurement_values_hash2 = {}
      last_measurement_at = Time.current.end_of_hour - 1.minute

      48.times do |measurement_number|
        measurement1 = create_measurement!({
          stream: stream1,
          latitude: session1.latitude,
          longitude: session1.longitude,
          time_with_time_zone: last_measurement_at - 30.minutes * measurement_number,
          value: rand(100)
        })

        measurement2 = create_measurement!({
          stream: stream2,
          latitude: session2.latitude,
          longitude: session2.longitude,
          time_with_time_zone: last_measurement_at - 30.minutes * measurement_number,
          value: rand(100)
        })

        measurement_values_hash1[measurement_number] = measurement1.value
        measurement_values_hash2[measurement_number] = measurement2.value
      end

      post '/api/v3/timelapse', params: {
        clusters: {
          0 => [stream1.id, stream2.id]
        },
        time_period: '1'
      }.to_json, headers: { 'Content-Type' => 'application/json' }

      first_slice_time = Time.current.beginning_of_hour + 1.hour

      hourly_averages = 24.times.map do |hour|
        {
          "time" => (first_slice_time - 1.hour * hour).iso8601(3),
          "value" => (measurement_values_hash1[hour * 2] + measurement_values_hash1[hour * 2 + 1] + measurement_values_hash2[hour * 2] + measurement_values_hash2[hour * 2 + 1]) / 4.0
        }
      end

      expected_response = [{"0" => hourly_averages.reverse}]

      expect(JSON.parse(response.body)).to eq(expected_response)
    end

    it 'returns stream averages for selected 24h period for two sessions in two clusters' do
      session1 = create_fixed_session!
      session2 = create_fixed_session!
      stream1 = create_stream!({ session: session1 })
      stream2 = create_stream!({ session: session2 })
      measurement_values_hash1 = {}
      measurement_values_hash2 = {}
      last_measurement_at = Time.current.end_of_hour - 1.minute

      48.times do |measurement_number|
        measurement1 = create_measurement!({
          stream: stream1,
          latitude: session1.latitude,
          longitude: session1.longitude,
          time_with_time_zone: last_measurement_at - 30.minutes * measurement_number,
          value: rand(100)
        })

        measurement2 = create_measurement!({
          stream: stream2,
          latitude: session2.latitude,
          longitude: session2.longitude,
          time_with_time_zone: last_measurement_at - 30.minutes * measurement_number,
          value: rand(100)
        })

        measurement_values_hash1[measurement_number] = measurement1.value
        measurement_values_hash2[measurement_number] = measurement2.value
      end

      post '/api/v3/timelapse', params: {
        clusters: {
          0 => [stream1.id],
          1 => [stream2.id]
        },
        time_period: '1'
      }.to_json, headers: { 'Content-Type' => 'application/json' }

      first_slice_time = Time.current.beginning_of_hour + 1.hour
      hourly_averages = []

      hourly_averages[0] = 24.times.map do |hour|
        {
          "time" => (first_slice_time - 1.hour * hour).iso8601(3),
          "value" => (measurement_values_hash1[hour * 2] + measurement_values_hash1[hour * 2 + 1]) / 2.0
        }
      end

      hourly_averages[1] = 24.times.map do |hour|
        {
          "time" => (first_slice_time - 1.hour * hour).iso8601(3),
          "value" => (measurement_values_hash2[hour * 2] + measurement_values_hash2[hour * 2 + 1]) / 2.0
        }
      end

      expected_response = [{"0" => hourly_averages[0].reverse}, {"1" => hourly_averages[1].reverse}]

      expect(JSON.parse(response.body)).to match_array(expected_response)
    end

    it 'returns stream averages for a stream for 7 days time period' do
      session = create_fixed_session!
      stream = create_stream!({ session: session })
      measurement_values_hash = {}
      last_measurement_at = Time.current.end_of_hour - 1.minute

      336.times do |measurement_number|
        measurement = create_measurement!({
          stream: stream,
          latitude: session.latitude,
          longitude: session.longitude,
          time_with_time_zone: last_measurement_at - 30.minutes * measurement_number,
          value: rand(100)
        })
        measurement_values_hash[measurement_number] = measurement.value
      end

      post '/api/v3/timelapse', params: {
        clusters: {
          0 => [stream.id]
        },
        time_period: '7'
      }.to_json, headers: { 'Content-Type' => 'application/json' }

      first_slice_time = Time.current.beginning_of_hour + 1.hour

      hourly_averages = 168.times.map do |time_slice_number|
        {
          "time" => (first_slice_time - 1.hour * time_slice_number).iso8601(3),
          "value" => (measurement_values_hash[time_slice_number * 2] + measurement_values_hash[time_slice_number * 2 + 1]) / 2.0
        }
      end

      expected_response = [{"0" => hourly_averages.reverse}]

      expect(JSON.parse(response.body)).to match_array(expected_response)
    end

    it 'returns stream averages for multiple clusters with multiple streams for 3 days period' do
      session1 = create_fixed_session!
      session2 = create_fixed_session!
      session3 = create_fixed_session!
      session4 = create_fixed_session!
      session5 = create_fixed_session!
      stream1 = create_stream!({ session: session1 })
      stream2 = create_stream!({ session: session2 })
      stream3 = create_stream!({ session: session3 })
      stream4 = create_stream!({ session: session4 })
      stream5 = create_stream!({ session: session5 })
      measurement_values_hash1 = {}
      measurement_values_hash2 = {}
      measurement_values_hash3 = {}
      measurement_values_hash4 = {}
      measurement_values_hash5 = {}
      last_measurement_at = Time.current.end_of_hour - 1.minute

      144.times do |measurement_number|
        measurement1 = create_measurement!({
          stream: stream1,
          latitude: session1.latitude,
          longitude: session1.longitude,
          time_with_time_zone: last_measurement_at - 30.minutes * measurement_number,
          value: rand(100)
        })

        measurement2 = create_measurement!({
          stream: stream2,
          latitude: session2.latitude,
          longitude: session2.longitude,
          time_with_time_zone: last_measurement_at - 30.minutes * measurement_number,
          value: rand(100)
        })

        measurement3 = create_measurement!({
          stream: stream3,
          latitude: session3.latitude,
          longitude: session3.longitude,
          time_with_time_zone: last_measurement_at - 30.minutes * measurement_number,
          value: rand(100)
        })

        measurement4 = create_measurement!({
          stream: stream4,
          latitude: session4.latitude,
          longitude: session4.longitude,
          time_with_time_zone: last_measurement_at - 30.minutes * measurement_number,
          value: rand(100)
        })

        measurement5 = create_measurement!({
          stream: stream5,
          latitude: session5.latitude,
          longitude: session5.longitude,
          time_with_time_zone: last_measurement_at - 30.minutes * measurement_number,
          value: rand(100)
        })

        measurement_values_hash1[measurement_number] = measurement1.value
        measurement_values_hash2[measurement_number] = measurement2.value
        measurement_values_hash3[measurement_number] = measurement3.value
        measurement_values_hash4[measurement_number] = measurement4.value
        measurement_values_hash5[measurement_number] = measurement5.value
      end

      post '/api/v3/timelapse', params: {
        clusters: {
          0 => [stream1.id, stream2.id],
          1 => [stream3.id, stream4.id, stream5.id]
        },
        time_period: '3'
      }.to_json, headers: { 'Content-Type' => 'application/json' }

      first_slice_time = Time.current.beginning_of_hour + 1.hour
      hourly_averages = []

      hourly_averages[0] = 72.times.map do |hour|
        {
          "time" => (first_slice_time - 1.hour * hour).iso8601(3),
          "value" => (measurement_values_hash1[hour * 2] + measurement_values_hash1[hour * 2 + 1] + measurement_values_hash2[hour * 2] + measurement_values_hash2[hour * 2 + 1]) / 4.0
        }
      end

      hourly_averages[1] = 72.times.map do |hour|
        {
          "time" => (first_slice_time - 1.hour * hour).iso8601(3),
          "value" => (measurement_values_hash3[hour * 2] + measurement_values_hash3[hour * 2 + 1] + measurement_values_hash4[hour * 2] + measurement_values_hash4[hour * 2 + 1] + measurement_values_hash5[hour * 2] + measurement_values_hash5[hour * 2 + 1]) / 6.0
        }
      end

      expected_response = [{"0" => hourly_averages[0].reverse}, {"1" => hourly_averages[1].reverse}]

      expect(JSON.parse(response.body)).to match_array(expected_response)
    end


    # performance test using map data and experimental server API - delete before merging

    it 'extracts stream IDs from response and uses them in another request' do
      VCR.turned_off do
        WebMock.allow_net_connect!

        get_url = 'http://172.104.20.165/api/fixed/active/sessions2.json?q=%7B%22time_from%22%3A%221691366400%22%2C%22time_to%22%3A%221723075199%22%2C%22tags%22%3A%22%22%2C%22usernames%22%3A%22%22%2C%22west%22%3A-107.35689196096888%2C%22east%22%3A36.08060803903112%2C%22south%22%3A-28.57512537074147%2C%22north%22%3A68.60841646435796%2C%22limit%22%3A1322%2C%22offset%22%3A0%2C%22sensor_name%22%3A%22government-pm2.5%22%2C%22measurement_type%22%3A%22Particulate%20Matter%22%2C%22unit_symbol%22%3A%22%C2%B5g%2Fm%C2%B3%22%7D'

        response = HTTParty.get(get_url)
        expect(response.code).to eq(200)
        parsed_response = JSON.parse(response.body)

        puts "Parsed Response: #{parsed_response}"

        stream_ids = parsed_response['sessions'].map { |session| session['streams']['Government-PM2.5']['id'] }

        puts "Extracted Stream IDs: #{stream_ids}"

        clusters = {}
        stream_ids.each_slice(15).each_with_index.map { |slice, index| clusters[index] = slice }

        puts "Created Clusters: #{clusters}"

        request_body = {
          clusters: clusters,
          time_period: '7'
        }.to_json

        post_url = 'http://172.104.20.165/api/v3/timelapse'

        puts "POST Request URL: #{post_url}"
        puts "POST Request Body: #{request_body}"

        post_request_sent_at = Time.current
        post_response = HTTParty.post(post_url, body: request_body, headers: { 'Content-Type' => 'application/json' })
        response_time = Time.current - post_request_sent_at

        puts "POST Response Code: #{post_response.code}"
        puts "POST Response Body: #{post_response.body}"

        puts "-------------------------------------"
        puts "Response Time in seconds: #{response_time}"

        expect(post_response.code).to eq(200)

        WebMock.disable_net_connect!(allow_localhost: true)
      end
    end
  end
end

# Example GET request with two clusters with two sessions inside each
# GET "/api/v3/timelapse?clusters[0][session_ids][]=#{session1.id}&clusters[0][session_ids][]=#{session2.id}&clusters[1][session_ids][]=#{session3.id}&clusters[1][session_ids][]=#{session4.id}&time_period=1"
