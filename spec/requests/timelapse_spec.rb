require 'rails_helper'
require 'httparty'
require 'webmock/rspec'

describe 'GET api/v3/timelapse', type: :request do
  context 'with correct params' do
    it 'returns active sessions json with clustering' do
      session_time = DateTime.new(2_000, 10, 1, 2, 3, 4)

      # Active session
      active_session = create_fixed_session!(
        contribute: true,
        time: session_time,
        last_measurement_at: DateTime.current,
      )

      active_stream = create_stream!(
        session: active_session,
        latitude: active_session.latitude,
        longitude: active_session.longitude,
      )

      create_measurement!(
        stream: active_stream,
        time: Time.current.end_of_hour - 2.hours - 1.minute,
        time_with_time_zone: Time.current.end_of_hour - 2.hours - 1.minute,
        latitude: active_session.latitude,
        longitude: active_session.longitude,
      )

      # Dormant session (should be clustered together)
      dormant_session = create_fixed_session!(
        user: active_session.user,
        contribute: true,
        time: session_time,
        last_measurement_at: DateTime.current - (FixedSession::ACTIVE_FOR + 1.second),
        latitude: active_session.latitude,
        longitude: active_session.longitude,
      )

      dormant_stream = create_stream!(
        session: dormant_session,
        latitude: active_session.latitude,
        longitude: active_session.longitude,
      )

      create_measurement!(stream: dormant_stream)

      # Session close to the original active session (should be clustered together)
      close_session = create_fixed_session!(
        contribute: true,
        time: session_time,
        last_measurement_at: DateTime.current,
        latitude: active_session.latitude + 0.0001,
        longitude: active_session.longitude + 0.0001,
      )

      close_stream = create_stream!(
        session: close_session,
        latitude: close_session.latitude,
        longitude: close_session.longitude,
      )

      create_measurement!(
        stream: close_stream,
        time: Time.current.end_of_hour - 2.hours - 1.minute,
        time_with_time_zone: Time.current.end_of_hour - 2.hours - 1.minute,
      )

      # Session far away (should be isolated)
      far_session = create_fixed_session!(
        contribute: true,
        time: session_time,
        last_measurement_at: DateTime.current,
        latitude: active_session.latitude + 10.0,
        longitude: active_session.longitude + 10.0,
      )

      far_stream = create_stream!(
        session: far_session,
        latitude: far_session.latitude,
        longitude: far_session.longitude,
      )

      create_measurement!(
        stream: far_stream,
        time: Time.current.end_of_hour - 2.hours - 1.minute,
        time_with_time_zone: Time.current.end_of_hour - 2.hours - 1.minute,
        latitude: far_session.latitude,
        longitude: far_session.longitude,
      )

      # Making the request
      get '/api/v3/timelapse2',
          params: {
            q: {
              time_from: (10.days.ago.to_datetime.strftime('%Q').to_i / 1_000),
              time_to: (Time.now.to_datetime.strftime('%Q').to_i / 1_000),
              tags: '',
              usernames: '',
              session_ids: [],
              west: active_session.longitude - 1,
              east: active_session.longitude + 1,
              south: active_session.latitude - 1,
              north: active_session.latitude + 1,
              limit: 2,
              offset: 0,
              sensor_name: active_stream.sensor_name,
              measurement_type: active_stream.measurement_type,
              unit_symbol: active_stream.unit_symbol,
            }.to_json,
          }

          expected = {
            (Time.current.beginning_of_hour - 1.hour).utc.strftime("%Y-%m-%d %H:%M:%S UTC") => [
              {
                "latitude" => 1.0,
                "longitude" => 1.0,
                "sessions" => 3,
                "value" => 123.0
              },
              {
                "latitude" => 11.0,
                "longitude" => 11.0,
                "sessions" => 1,
                "value" => 123.0
              }
            ]
          }

      expect(JSON.parse(response.body)).to eq(expected)
    end










    # performance test using map data and experimental server API - delete before merging

    # it 'extracts stream IDs from response and uses them in another request' do
    #   VCR.turned_off do
    #     WebMock.allow_net_connect!

    #     get_url = 'http://172.104.20.165/api/fixed/active/sessions2.json?q=%7B%22time_from%22%3A%221691366400%22%2C%22time_to%22%3A%221723075199%22%2C%22tags%22%3A%22%22%2C%22usernames%22%3A%22%22%2C%22west%22%3A-107.35689196096888%2C%22east%22%3A36.08060803903112%2C%22south%22%3A-28.57512537074147%2C%22north%22%3A68.60841646435796%2C%22limit%22%3A1322%2C%22offset%22%3A0%2C%22sensor_name%22%3A%22government-pm2.5%22%2C%22measurement_type%22%3A%22Particulate%20Matter%22%2C%22unit_symbol%22%3A%22%C2%B5g%2Fm%C2%B3%22%7D'

    #     response = HTTParty.get(get_url)
    #     expect(response.code).to eq(200)
    #     parsed_response = JSON.parse(response.body)

    #     puts "Parsed Response: #{parsed_response}"

    #     stream_ids = parsed_response['sessions'].map { |session| session['streams']['Government-PM2.5']['id'] }

    #     puts "Extracted Stream IDs: #{stream_ids}"

    #     clusters = {}
    #     stream_ids.each_slice(15).each_with_index.map { |slice, index| clusters[index] = slice }

    #     puts "Created Clusters: #{clusters}"

    #     request_body = {
    #       clusters: clusters,
    #       time_period: '7'
    #     }.to_json

    #     post_url = 'http://172.104.20.165/api/v3/timelapse'

    #     puts "POST Request URL: #{post_url}"
    #     puts "POST Request Body: #{request_body}"

    #     post_request_sent_at = Time.current
    #     post_response = HTTParty.post(post_url, body: request_body, headers: { 'Content-Type' => 'application/json' })
    #     response_time = Time.current - post_request_sent_at

    #     puts "POST Response Code: #{post_response.code}"
    #     puts "POST Response Body: #{post_response.body}"

    #     puts "-------------------------------------"
    #     puts "Response Time in seconds: #{response_time}"

    #     expect(post_response.code).to eq(200)

    #     WebMock.disable_net_connect!(allow_localhost: true)
    #   end
    # end
  end
end
