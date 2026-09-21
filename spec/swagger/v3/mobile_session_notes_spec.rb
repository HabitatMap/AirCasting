require 'swagger_helper'

# Notes on a mobile session, as their own resource.
#
# They were previously a declarative-full array inside
# PATCH /api/v3/mobile_sessions/{uuid}. Editing one note meant resending all of
# them, and the only handle a client had was the client-assigned `number` —
# which both apps allocate as "highest + 1", so deleting the highest-numbered
# note makes the next one reuse it. Addressed by the server-side `id`, that
# collision is gone.
RSpec.describe 'AirBeam Mobile Session Notes', type: :request do
  PHOTO_DESCRIPTION = <<~DESC.freeze
    The `photo` bytes must decode to an `image/*`; the declared content type is
    ignored. Read it back as `photo_location`. An oversized `Content-Length` is
    refused with `413` before the body is parsed.
  DESC

  path '/api/v3/mobile_sessions/{uuid}/notes' do
    get "[ALPHA] List a session's notes" do
      tags 'Mobile app: Mobile sessions'
      produces 'application/json'
      parameter name: :uuid, in: :path, type: :string, required: true

      response '200', 'the notes' do
        schema type: :array, items: V3_NOTE_SCHEMA

        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let(:session_record) { create(:mobile_session, user: user) }
        let(:uuid) { session_record.uuid }
        before { create(:note, session: session_record, number: 0) }
        run_test!
      end

      response '404', 'session not found' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'session_not_found' },
                 message: { type: :string, example: 'Session not found' }
               }
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let(:uuid) { 'does-not-exist' }
        run_test!
      end

      response '401', 'unauthorized' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'unauthorized' },
                 message: { type: :string, example: 'Unauthorized' }
               }
        let(:uuid) { 'any-uuid' }
        let(:Authorization) { 'Bearer invalid' }
        run_test!
      end
    end

    post '[ALPHA] Add a note to a session' do
      tags 'Mobile app: Mobile sessions'
      consumes 'application/json'
      produces 'application/json'
      description <<~DESC
        `number` is server-allocated (highest existing plus one, 0-based) and ignored
        if you send it. It is an ordering key, not an address: deleting a note leaves
        a gap and nothing renumbers. Address a note by its `id`.

        Bumps the session's `version`.

        #{PHOTO_DESCRIPTION}
      DESC

      parameter name: :uuid, in: :path, type: :string, required: true
      parameter name: :body, in: :body, required: true, schema: {
        type: :object,
        required: %w[text date latitude longitude],
        properties: {
          text: { type: :string, example: 'Smells like smoke' },
          date: { type: :string, example: '2026-08-14T10:00:00',
                  description: 'ISO 8601; the wall clock the phone saw' },
          latitude: { type: :number, format: :float, example: 40.7128 },
          longitude: { type: :number, format: :float, example: -74.006 },
          photo: {
            type: :string, nullable: true,
            description: 'Base64 image (line breaks allowed), max 5 MB decoded'
          }
        }
      }

      response '201', 'note created' do
        schema V3_NOTE_SCHEMA

        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let(:session_record) { create(:mobile_session, user: user) }
        let(:uuid) { session_record.uuid }
        let(:body) do
          { text: 'Smells like smoke', date: '2026-08-14T10:00:00',
            latitude: 40.7128, longitude: -74.006 }
        end
        run_test!
      end

      response '400', 'validation error — `fields` names the offending key' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'validation_error' },
                 message: { type: :string, example: 'Request body is invalid' },
                 fields: { type: :object, additionalProperties: true,
                           example: { date: ['must be an ISO 8601 date-time (e.g. 2026-08-14T10:00:00)'] } }
               }

        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let(:session_record) { create(:mobile_session, user: user) }
        let(:uuid) { session_record.uuid }
        let(:body) do
          { text: 'x', date: 'garbage', latitude: 40.0, longitude: -74.0 }
        end
        run_test!
      end

      response '413', 'body too large for one photo' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'payload_too_large' },
                 message: { type: :string, example: 'Request body exceeds 7056046 bytes; a photo may be at most 5242880 bytes once decoded' }
               }
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let(:session_record) { create(:mobile_session, user: user) }
        let(:uuid) { session_record.uuid }
        let(:body) do
          { text: 'x', date: '2026-08-14T10:00:00', latitude: 40.0, longitude: -74.0,
            photo: 'A' * (Api::V3::MobileSessions::NotesController::MAX_BODY_BYTES + 1) }
        end
        run_test!
      end

      response '404', 'session not found' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'session_not_found' },
                 message: { type: :string, example: 'Session not found' }
               }
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let(:uuid) { 'does-not-exist' }
        let(:body) do
          { text: 'x', date: '2026-08-14T10:00:00', latitude: 40.0, longitude: -74.0 }
        end
        run_test!
      end

      response '401', 'unauthorized' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'unauthorized' },
                 message: { type: :string, example: 'Unauthorized' }
               }
        let(:uuid) { 'any-uuid' }
        let(:Authorization) { 'Bearer invalid' }
        let(:body) { {} }
        run_test!
      end
    end
  end

  path '/api/v3/mobile_sessions/{uuid}/notes/{id}' do
    patch '[ALPHA] Edit a note' do
      tags 'Mobile app: Mobile sessions'
      consumes 'application/json'
      produces 'application/json'
      description <<~DESC
        **PATCH only — `PUT` is not routed.** An omitted field is left alone.

        The session's `version` moves only when something actually changed, so
        re-sending the text a note already has does not trigger a sync across the
        account.

        #{PHOTO_DESCRIPTION}
      DESC

      parameter name: :uuid, in: :path, type: :string, required: true
      parameter name: :id, in: :path, type: :integer, required: true,
                description: "The note's `id`, not its `number`"
      parameter name: :body, in: :body, required: true, schema: {
        type: :object,
        description: 'At least one of text, photo',
        properties: {
          text: { type: :string, example: 'Smells like smoke' },
          photo: {
            type: :string, nullable: true,
            description: 'Base64 image (line breaks allowed), max 5 MB decoded. ' \
                         'Absent keeps the current photo, null deletes it, base64 replaces it.'
          }
        }
      }

      response '200', 'updated note' do
        schema V3_NOTE_SCHEMA

        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let(:session_record) { create(:mobile_session, user: user) }
        let(:uuid) { session_record.uuid }
        let(:note_record) { create(:note, session: session_record, number: 0) }
        let(:id) { note_record.id }
        let(:body) { { text: 'Smells like smoke' } }
        run_test!
      end

      response '400', 'validation error' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'validation_error' },
                 message: { type: :string, example: 'Request body is invalid' },
                 fields: { type: :object, additionalProperties: true,
                           example: { base: ['must contain at least one of: text, photo'] } }
               }

        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let(:session_record) { create(:mobile_session, user: user) }
        let(:uuid) { session_record.uuid }
        let(:note_record) { create(:note, session: session_record, number: 0) }
        let(:id) { note_record.id }
        let(:body) { {} }
        run_test!
      end

      response '413', 'body too large for one photo' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'payload_too_large' },
                 message: { type: :string, example: 'Request body exceeds 7056046 bytes; a photo may be at most 5242880 bytes once decoded' }
               }
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let(:session_record) { create(:mobile_session, user: user) }
        let(:uuid) { session_record.uuid }
        let(:note_record) { create(:note, session: session_record, number: 0) }
        let(:id) { note_record.id }
        let(:body) do
          { photo: 'A' * (Api::V3::MobileSessions::NotesController::MAX_BODY_BYTES + 1) }
        end
        run_test!
      end

      response '404', 'session or note not found — `error_code` says which' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'note_not_found' },
                 message: { type: :string, example: 'Note not found' }
               }
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let(:session_record) { create(:mobile_session, user: user) }
        let(:uuid) { session_record.uuid }
        let(:id) { 0 }
        let(:body) { { text: 'x' } }
        run_test!
      end

      response '401', 'unauthorized' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'unauthorized' },
                 message: { type: :string, example: 'Unauthorized' }
               }
        let(:uuid) { 'any-uuid' }
        let(:id) { 1 }
        let(:Authorization) { 'Bearer invalid' }
        let(:body) { { text: 'x' } }
        run_test!
      end
    end

    delete '[ALPHA] Delete a note' do
      tags 'Mobile app: Mobile sessions'
      produces 'application/json'
      description <<~DESC
        Deletes the stored photo file too. The remaining notes keep their `number`s —
        a gap is left rather than renumbering. Bumps the session's `version`.
      DESC

      parameter name: :uuid, in: :path, type: :string, required: true
      parameter name: :id, in: :path, type: :integer, required: true,
                description: "The note's `id`, not its `number`"

      response '204', 'note deleted' do
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let(:session_record) { create(:mobile_session, user: user) }
        let(:uuid) { session_record.uuid }
        let(:note_record) { create(:note, session: session_record, number: 0) }
        let(:id) { note_record.id }
        run_test!
      end

      response '404', 'session or note not found — `error_code` says which' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'note_not_found' },
                 message: { type: :string, example: 'Note not found' }
               }

        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let(:session_record) { create(:mobile_session, user: user) }
        let(:uuid) { session_record.uuid }
        let(:id) { 0 }
        run_test!
      end

      response '401', 'unauthorized' do
        schema type: :object,
               required: %w[error_code message],
               properties: {
                 error_code: { type: :string, example: 'unauthorized' },
                 message: { type: :string, example: 'Unauthorized' }
               }

        let(:uuid) { 'any-uuid' }
        let(:id) { 1 }
        let(:Authorization) { 'Bearer invalid' }
        run_test!
      end
    end
  end
end
