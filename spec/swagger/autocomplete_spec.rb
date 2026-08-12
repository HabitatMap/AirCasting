require 'swagger_helper'

# Web filter autocomplete: tag names (fixed/mobile) and usernames.
# These use NESTED query params (q[input], q[west], ...) — NOT a JSON string —
# and return a JSON array of strings.
RSpec.describe 'Autocomplete', type: :request do
  STRING_ARRAY = { type: :array, items: { type: :string } }.freeze

  path '/api/fixed/autocomplete/tags' do
    get 'Autocomplete fixed-session tag names' do
      tags 'Web app: Autocomplete'
      produces 'application/json'
      security []
      description 'Returns matching fixed-session tag names as a string array. Public (no auth). Uses nested q[...] params.'

      parameter name: 'q[input]', in: :query, type: :string, required: false, description: 'Search prefix (may be empty)'
      parameter name: 'q[time_from]', in: :query, type: :integer, required: true, description: 'Epoch seconds'
      parameter name: 'q[time_to]', in: :query, type: :integer, required: true, description: 'Epoch seconds'
      parameter name: 'q[sensor_name]', in: :query, type: :string, required: true
      parameter name: 'q[unit_symbol]', in: :query, type: :string, required: true
      parameter name: 'q[usernames]', in: :query, type: :string, required: false, description: 'Cross-filter usernames (may be empty)'
      parameter name: 'q[west]', in: :query, type: :number, required: true
      parameter name: 'q[east]', in: :query, type: :number, required: true
      parameter name: 'q[south]', in: :query, type: :number, required: true
      parameter name: 'q[north]', in: :query, type: :number, required: true
      parameter name: 'q[is_indoor]', in: :query, type: :boolean, required: true
      parameter name: 'q[is_active]', in: :query, type: :boolean, required: true

      response '200', 'tag names' do
        schema STRING_ARRAY
        let(:'q[input]') { '' }
        let(:'q[time_from]') { 1.day.ago.to_i }
        let(:'q[time_to]') { Time.current.to_i }
        let(:'q[sensor_name]') { 'AirBeam2-PM2.5' }
        let(:'q[unit_symbol]') { 'µg/m³' }
        let(:'q[usernames]') { '' }
        let(:'q[west]') { -180.0 }
        let(:'q[east]') { 180.0 }
        let(:'q[south]') { -90.0 }
        let(:'q[north]') { 90.0 }
        let(:'q[is_indoor]') { false }
        let(:'q[is_active]') { true }
        run_test!
      end
    end
  end

  path '/api/mobile/autocomplete/tags' do
    get 'Autocomplete mobile-session tag names' do
      tags 'Web app: Autocomplete'
      produces 'application/json'
      security []
      description 'Returns matching mobile-session tag names as a string array. Public (no auth). Uses nested q[...] params.'

      parameter name: 'q[input]', in: :query, type: :string, required: false, description: 'Search prefix (may be empty)'
      parameter name: 'q[time_from]', in: :query, type: :integer, required: true, description: 'Epoch seconds'
      parameter name: 'q[time_to]', in: :query, type: :integer, required: true, description: 'Epoch seconds'
      parameter name: 'q[sensor_name]', in: :query, type: :string, required: true
      parameter name: 'q[unit_symbol]', in: :query, type: :string, required: true
      parameter name: 'q[usernames]', in: :query, type: :string, required: false
      parameter name: 'q[west]', in: :query, type: :number, required: true
      parameter name: 'q[east]', in: :query, type: :number, required: true
      parameter name: 'q[south]', in: :query, type: :number, required: true
      parameter name: 'q[north]', in: :query, type: :number, required: true

      response '200', 'tag names' do
        schema STRING_ARRAY
        let(:'q[input]') { '' }
        let(:'q[time_from]') { 1.day.ago.to_i }
        let(:'q[time_to]') { Time.current.to_i }
        let(:'q[sensor_name]') { 'AirBeam2-PM2.5' }
        let(:'q[unit_symbol]') { 'µg/m³' }
        let(:'q[usernames]') { '' }
        let(:'q[west]') { -180.0 }
        let(:'q[east]') { 180.0 }
        let(:'q[south]') { -90.0 }
        let(:'q[north]') { 90.0 }
        run_test!
      end
    end
  end

  path '/api/autocomplete/usernames' do
    get 'Autocomplete usernames' do
      tags 'Web app: Autocomplete'
      produces 'application/json'
      security []
      description 'Returns matching contributor usernames as a sorted, unique string array. Public (no auth). Uses nested q[...] params. Note: is_dormant is a string "true"/"false", session_type is "fixed" or "mobile".'

      parameter name: 'q[input]', in: :query, type: :string, required: false, description: 'Search prefix (may be empty)'
      parameter name: 'q[time_from]', in: :query, type: :integer, required: true, description: 'Epoch seconds'
      parameter name: 'q[time_to]', in: :query, type: :integer, required: true, description: 'Epoch seconds'
      parameter name: 'q[sensor_name]', in: :query, type: :string, required: true
      parameter name: 'q[unit_symbol]', in: :query, type: :string, required: true
      parameter name: 'q[tags]', in: :query, type: :string, required: false, description: 'Cross-filter tags (may be empty)'
      parameter name: 'q[west]', in: :query, type: :number, required: true
      parameter name: 'q[east]', in: :query, type: :number, required: true
      parameter name: 'q[south]', in: :query, type: :number, required: true
      parameter name: 'q[north]', in: :query, type: :number, required: true
      parameter name: 'q[session_type]', in: :query, type: :string, required: true, description: '"fixed" or "mobile"'
      parameter name: 'q[is_dormant]', in: :query, type: :string, required: true, description: '"true" or "false"'

      response '200', 'usernames' do
        schema STRING_ARRAY
        let(:'q[input]') { '' }
        let(:'q[time_from]') { 1.day.ago.to_i }
        let(:'q[time_to]') { Time.current.to_i }
        let(:'q[sensor_name]') { 'AirBeam2-PM2.5' }
        let(:'q[unit_symbol]') { 'µg/m³' }
        let(:'q[tags]') { '' }
        let(:'q[west]') { -180.0 }
        let(:'q[east]') { 180.0 }
        let(:'q[south]') { -90.0 }
        let(:'q[north]') { 90.0 }
        let(:'q[session_type]') { 'mobile' }
        let(:'q[is_dormant]') { 'false' }
        run_test!
      end
    end
  end
end
