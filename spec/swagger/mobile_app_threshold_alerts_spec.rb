require 'swagger_helper'

# Mobile apps (iOS/Android): threshold (push-notification) alerts. Token auth.
RSpec.describe 'Mobile app — threshold alerts', type: :request do
  # Satisfies the global token_auth security scheme (test env: token check is a
  # no-op, warden sign_in provides current_user).
  let(:Authorization) { "Token token=#{user.authentication_token}" }

  ALERT_SCHEMA = {
    type: :object,
    required: %w[id session_uuid sensor_name threshold_value frequency timezone_offset],
    properties: {
      id: { type: :integer },
      session_uuid: { type: :string },
      sensor_name: { type: :string, example: 'AirBeam2-PM2.5' },
      threshold_value: { type: :number, format: :float, example: 35.0 },
      frequency: { type: :integer, description: 'Minimum minutes between alert emails', example: 60 },
      timezone_offset: { type: :integer, description: 'Seconds offset from UTC', example: -18_000 },
    },
  }.freeze

  path '/api/fixed/threshold_alerts' do
    get 'List the current user\'s threshold alerts' do
      tags 'Mobile app: Threshold alerts'
      produces 'application/json'
      description 'Returns all threshold alerts for the authenticated user. Auth: `Token token=<user_token>` (HTTP Basic; token as username).'

      response '200', 'alerts' do
        schema type: :array, items: ALERT_SCHEMA

        let(:user) { create(:user) }
        let(:session) { create(:mobile_session, user: user, uuid: 'sess-uuid-1') }
        let(:stream) { create(:stream, session: session, sensor_name: 'AirBeam2-PM2.5') }
        before do
          create(:threshold_alert, user_id: user.id, stream: stream,
                 session_uuid: 'sess-uuid-1', sensor_name: 'AirBeam2-PM2.5',
                 threshold_value: 35.0, frequency: 60, timezone_offset: -18_000)
          sign_in user
        end
        run_test!
      end
    end

    post 'Create a threshold alert' do
      tags 'Mobile app: Threshold alerts'
      consumes 'application/json'
      produces 'application/json'
      description 'Creates a threshold alert for a stream identified by `session_uuid` + `sensor_name`. Auth required.'

      parameter name: :body, in: :body, required: true, schema: {
        type: :object,
        required: %w[data],
        properties: {
          data: {
            type: :object,
            required: %w[sensor_name session_uuid threshold_value frequency timezone_offset],
            properties: {
              sensor_name: { type: :string, example: 'AirBeam2-PM2.5' },
              session_uuid: { type: :string },
              threshold_value: { type: :number, format: :float, example: 35.0 },
              frequency: { type: :integer, example: 60 },
              timezone_offset: { type: :integer, example: -18_000 },
            },
          },
        },
      }

      response '201', 'created' do
        schema type: :object, required: %w[id], properties: { id: { type: :integer } }

        let(:user) { create(:user) }
        let(:session) { create(:mobile_session, user: user, uuid: 'sess-uuid-2') }
        let(:stream) { create(:stream, session: session, sensor_name: 'AirBeam2-PM2.5') }
        let(:body) do
          { data: { sensor_name: 'AirBeam2-PM2.5', session_uuid: 'sess-uuid-2',
                    threshold_value: 35.0, frequency: 60, timezone_offset: -18_000 } }
        end
        before { stream; sign_in user }
        run_test!
      end

      response '400', 'validation error' do
        schema type: :object, additionalProperties: { type: :array, items: { type: :string } }, example: { field_name: ['error message'] }
        let(:user) { create(:user) }
        let(:body) { { data: { sensor_name: '' } } }
        before { sign_in user }
        run_test!
      end
    end
  end

  path '/api/fixed/threshold_alerts/{id}' do
    delete 'Delete a threshold alert' do
      tags 'Mobile app: Threshold alerts'
      produces 'application/json'
      description 'Deletes one of the current user\'s threshold alerts. Auth required.'

      parameter name: :id, in: :path, type: :integer, required: true

      response '204', 'deleted' do
        let(:user) { create(:user) }
        let(:session) { create(:mobile_session, user: user, uuid: 'sess-uuid-3') }
        let(:stream) { create(:stream, session: session) }
        let(:alert) { create(:threshold_alert, user_id: user.id, stream: stream) }
        let(:id) { alert.id }
        before { sign_in user }
        run_test!
      end

      response '401', 'alert not found for this user' do
        let(:user) { create(:user) }
        let(:id) { 0 }
        before { sign_in user }
        run_test!
      end
    end
  end
end
