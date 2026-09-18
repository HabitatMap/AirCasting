require 'swagger_helper'

# Mobile apps (iOS/Android): email a CSV export of a session. Works for both
# AirBeam mobile and AirBeam fixed sessions — the lookup is on ::Session.
RSpec.describe 'Mobile app — export', type: :request do
  path '/api/sessions/export_by_uuid.json' do
    get 'Email a CSV export of one session by UUID' do
      tags 'Mobile app: Export & sharing'
      produces 'application/json'
      security []
      parameter name: :uuid, in: :query, type: :string, required: true
      parameter name: :email, in: :query, type: :string, required: true

      response '200', 'export scheduled' do
        schema type: :object, required: %w[success_message],
               properties: { success_message: { type: :string, example: 'Export scheduled successfully.' } }
        let(:session) { create(:mobile_session, uuid: 'export-uuid-1') }
        let(:uuid) { session.uuid }
        let(:email) { 'user@example.com' }
        run_test!
      end

      response '400', 'unknown uuid or invalid params' do
        schema type: :object, additionalProperties: true,
               properties: { error: { type: :string } },
               example: { error: "Session with uuid: abc doesn't exist" }
        let(:uuid) { 'does-not-exist' }
        let(:email) { 'user@example.com' }
        run_test!
      end
    end
  end
end
