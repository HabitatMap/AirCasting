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
  ERROR_SCHEMA = {
    type: :object,
    required: %w[error_code message],
    properties: {
      error_code: { type: :string },
      message: { type: :string }
    }
  }.freeze

  PHOTO_DESCRIPTION = <<~DESC.freeze
    ## photo

    The note's image as **base64**, decoded and sniffed server-side — the content
    type you declare is never trusted. Must decode to an `image/*` of at most
    5 MB. Line-wrapped base64 is accepted (both apps wrap at 76 columns).

    | you send | what happens |
    |---|---|
    | absent | keeps whatever is attached — an unchanged note costs no upload |
    | `null` | deletes the photo, file included |
    | base64 | replaces the photo; the old file is deleted |

    Read it back as `photo_location`. A request whose `Content-Length` exceeds
    one photo plus a small envelope is refused with `413` before the body is
    parsed.
  DESC

  path '/api/v3/mobile_sessions/{uuid}/notes' do
    get "List a session's notes" do
      tags 'Mobile app: Mobile sessions'
      produces 'application/json'
      description <<~DESC
        Every note on the session, ordered by `number` and then `id`.

        The same array appears inline on `GET /api/v3/mobile_sessions/{uuid}`.
        This endpoint exists so a client can refresh its notes after an edit
        without refetching the session's stream metadata — and so a second
        device can pick up notes it did not create itself.
      DESC

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
        schema ERROR_SCHEMA
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let(:uuid) { 'does-not-exist' }
        run_test!
      end

      response '401', 'unauthorized' do
        schema ERROR_SCHEMA
        let(:uuid) { 'any-uuid' }
        let(:Authorization) { 'Bearer invalid' }
        run_test!
      end
    end

    post 'Add a note to a session' do
      tags 'Mobile app: Mobile sessions'
      consumes 'application/json'
      produces 'application/json'
      description <<~DESC
        Creates one note. Answers with the created note, including the `id` you
        need to edit or delete it later.

        `number` is **server-allocated** and ignored if you send it. It is the
        highest existing number plus one, 0-based, and is only an ordering key
        for the legacy sync path — not an address. Deleting a note leaves a gap,
        deliberately: nothing renumbers, here or in either app.

        Creating a note bumps the session's `version`, which is what tells the
        user's other devices to re-download it.

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
        schema ERROR_SCHEMA.merge(
          properties: ERROR_SCHEMA[:properties].merge(
            fields: { type: :object, additionalProperties: true,
                      example: { date: ['must be an ISO 8601 date-time (e.g. 2026-08-14T10:00:00)'] } }
          )
        )

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
        schema ERROR_SCHEMA
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
        schema ERROR_SCHEMA
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let(:uuid) { 'does-not-exist' }
        let(:body) do
          { text: 'x', date: '2026-08-14T10:00:00', latitude: 40.0, longitude: -74.0 }
        end
        run_test!
      end

      response '401', 'unauthorized' do
        schema ERROR_SCHEMA
        let(:uuid) { 'any-uuid' }
        let(:Authorization) { 'Bearer invalid' }
        let(:body) { {} }
        run_test!
      end
    end
  end

  path '/api/v3/mobile_sessions/{uuid}/notes/{id}' do
    patch 'Edit a note' do
      tags 'Mobile app: Mobile sessions'
      consumes 'application/json'
      produces 'application/json'
      description <<~DESC
        Edits one note's `text`, its `photo`, or both. At least one of the two
        must be sent; anything else in the body is ignored.

        **PATCH only — `PUT` is not routed.** The update is partial: a field you
        omit is left alone, which is not what `PUT` promises.

        `date`, `latitude`, `longitude` and `number` are **not editable**. They
        record where the recording was when the note was taken, so moving them
        would make the note lie — and neither app edits them.

        To remove a photo without touching the text, send `{"photo": null}`.

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
                         'Absent keeps, null removes.'
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
        schema ERROR_SCHEMA.merge(
          properties: ERROR_SCHEMA[:properties].merge(
            fields: { type: :object, additionalProperties: true,
                      example: { nil => ['must contain at least one of: text, photo'] } }
          )
        )

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
        schema ERROR_SCHEMA
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
        schema ERROR_SCHEMA
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let(:session_record) { create(:mobile_session, user: user) }
        let(:uuid) { session_record.uuid }
        let(:id) { 0 }
        let(:body) { { text: 'x' } }
        run_test!
      end

      response '401', 'unauthorized' do
        schema ERROR_SCHEMA
        let(:uuid) { 'any-uuid' }
        let(:id) { 1 }
        let(:Authorization) { 'Bearer invalid' }
        let(:body) { { text: 'x' } }
        run_test!
      end
    end

    delete 'Delete a note' do
      tags 'Mobile app: Mobile sessions'
      produces 'application/json'
      description <<~DESC
        Removes the note and its photo, the stored file included.

        The remaining notes keep their `number`s — a gap is left rather than
        renumbering. Renumbering would rewrite the key the legacy sync path
        still matches on, underneath a client that had not synced yet.

        Bumps the session's `version`.
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
        schema ERROR_SCHEMA
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{user.authentication_token}" }
        let(:session_record) { create(:mobile_session, user: user) }
        let(:uuid) { session_record.uuid }
        let(:id) { 0 }
        run_test!
      end

      response '401', 'unauthorized' do
        schema ERROR_SCHEMA
        let(:uuid) { 'any-uuid' }
        let(:id) { 1 }
        let(:Authorization) { 'Bearer invalid' }
        run_test!
      end
    end
  end
end
