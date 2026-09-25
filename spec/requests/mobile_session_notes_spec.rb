require 'rails_helper'

# Notes are their own resource, keyed on the server-side `id`.
#
# They used to be a declarative-full array inside PATCH /mobile_sessions/:uuid,
# which meant editing one note resent all of them and the only handle a client
# had was the client-assigned `number`. That handle is not stable: iOS allocates
# max+1 (NotesHandler.swift:51) and Android last+1 (AddNoteBottomSheet.kt:127),
# so deleting the highest note makes the next one reuse its number. Keyed on
# `id`, the delete-then-add sequence can no longer address the wrong row.
describe 'Notes on a mobile session' do
  let(:user) { create(:user) }
  let(:session_record) { create(:mobile_session, user: user, version: 2) }

  def headers(token: user.authentication_token)
    {
      'CONTENT_TYPE' => 'application/json',
      'ACCEPT' => 'application/json',
      'Authorization' => "Bearer #{token}",
    }
  end

  def note_body(overrides = {})
    {
      text: 'Smells like smoke',
      date: '2026-08-14T10:00:00',
      latitude: 40.0,
      longitude: -74.0,
    }.merge(overrides)
  end

  def photo_base64
    Base64.strict_encode64(File.binread(Rails.root.join('spec/fixtures/test.jpg')))
  end

  def notes_path(uuid = session_record.uuid)
    "/api/v3/mobile_sessions/#{uuid}/notes"
  end

  describe 'GET index' do
    it 'lists the notes with their ids' do
      create(:note, session: session_record, number: 1, text: 'second')
      create(:note, session: session_record, number: 0, text: 'first')

      get notes_path, headers: headers

      expect(response).to have_http_status(:ok)
      notes = response.parsed_body
      expect(notes.map { |n| n['text'] }).to eq(%w[first second])
      expect(notes.map { |n| n['id'] }).to all(be_present)
      expect(notes.first.keys).to include('id', 'number', 'text', 'date', 'latitude', 'longitude', 'photo_location')
    end

    # The serializer asks whether each note has a photo, and then asks the blob
    # whether it is variable. Without `with_attached_s3_photo` that is two
    # queries per note.
    it 'does not query more as notes are added' do
      def attachment_queries
        sql = []
        collect = ->(_, _, _, _, payload) { sql << payload[:sql] if payload[:sql].to_s.include?('active_storage') }
        ActiveSupport::Notifications.subscribed(collect, 'sql.active_record') do
          get notes_path, headers: headers
        end
        sql.size
      end

      create(:note, session: session_record, number: 0)
      one = attachment_queries

      2.times { |i| create(:note, session: session_record, number: i + 1) }

      expect(attachment_queries).to eq(one)
    end

    it 'returns an empty array for a session with no notes' do
      get notes_path, headers: headers

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to eq([])
    end

    it "returns 404 for another user's session" do
      other = create(:mobile_session, user: create(:user))

      get notes_path(other.uuid), headers: headers

      expect(response).to have_http_status(:not_found)
      expect(response.parsed_body['error_code']).to eq('session_not_found')
    end

    it 'returns 401 without a valid token' do
      get notes_path, headers: headers(token: 'invalid')

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe 'POST create' do
    it 'creates a note and returns it with its id' do
      post notes_path, params: note_body.to_json, headers: headers

      expect(response).to have_http_status(:created)
      body = response.parsed_body
      expect(body['id']).to eq(session_record.notes.first.id)
      expect(body['text']).to eq('Smells like smoke')
      expect(body['photo_location']).to be_nil
    end

    # The client no longer allocates this. Both apps got it subtly wrong in
    # different ways, and it is not identity any more, so the server owns it.
    it 'assigns number itself, 0-based, ignoring anything the client sends' do
      post notes_path, params: note_body(number: 99).to_json, headers: headers
      expect(response.parsed_body['number']).to eq(0)

      post notes_path, params: note_body.to_json, headers: headers
      expect(response.parsed_body['number']).to eq(1)
    end

    it 'carries on from the highest existing number, leaving holes alone' do
      create(:note, session: session_record, number: 0)
      create(:note, session: session_record, number: 5)

      post notes_path, params: note_body.to_json, headers: headers

      expect(response.parsed_body['number']).to eq(6)
    end

    it 'attaches a photo' do
      post notes_path, params: note_body(photo: photo_base64).to_json, headers: headers

      expect(response).to have_http_status(:created)
      expect(response.parsed_body['photo_location']).to be_present
      expect(session_record.notes.first.s3_photo).to be_attached
    end

    it 'bumps the session version so other devices re-download' do
      post notes_path, params: note_body.to_json, headers: headers

      expect(session_record.reload.version).to eq(3)
    end

    it 'returns 400 with field detail when the date is not ISO 8601' do
      post notes_path, params: note_body(date: 'garbage').to_json, headers: headers

      expect(response).to have_http_status(:bad_request)
      expect(response.parsed_body['error_code']).to eq('validation_error')
      expect(response.parsed_body.dig('fields', 'date')).to be_present
      expect(session_record.reload.version).to eq(2)
    end

    it 'returns 413 for a body larger than one photo plus its envelope' do
      oversized = 'A' * (Api::V3::MobileSessions::NotesController::MAX_BODY_BYTES + 1)

      post notes_path, params: note_body(photo: oversized).to_json, headers: headers

      expect(response).to have_http_status(:payload_too_large)
      expect(response.parsed_body['error_code']).to eq('payload_too_large')
      expect(session_record.notes).to be_empty
    end

    it 'returns 400 when the photo is not an image' do
      post notes_path,
           params: note_body(photo: Base64.strict_encode64('not an image')).to_json,
           headers: headers

      expect(response).to have_http_status(:bad_request)
      expect(response.parsed_body.dig('fields', 'photo')).to be_present
    end

    it "returns 404 for another user's session" do
      other = create(:mobile_session, user: create(:user))

      post notes_path(other.uuid), params: note_body.to_json, headers: headers

      expect(response).to have_http_status(:not_found)
      expect(other.notes).to be_empty
    end
  end

  describe 'PATCH update' do
    let!(:note) { create(:note, session: session_record, number: 0, text: 'original') }

    def note_path(id = note.id)
      "#{notes_path}/#{id}"
    end

    it 'edits the text' do
      patch note_path, params: { text: 'edited' }.to_json, headers: headers

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['text']).to eq('edited')
      expect(note.reload.text).to eq('edited')
      expect(session_record.reload.version).to eq(3)
    end

    it 'leaves the photo alone when the key is absent' do
      note.s3_photo.attach(
        io: StringIO.new(File.binread(Rails.root.join('spec/fixtures/test.jpg'))),
        filename: 'photo.jpg',
        content_type: 'image/jpeg',
      )
      blob_id = note.s3_photo.blob.id

      patch note_path, params: { text: 'edited' }.to_json, headers: headers

      expect(note.reload.s3_photo.blob.id).to eq(blob_id)
      expect(response.parsed_body['photo_location']).to be_present
    end

    it 'removes the photo, and only the photo, when photo is null' do
      note.s3_photo.attach(
        io: StringIO.new(File.binread(Rails.root.join('spec/fixtures/test.jpg'))),
        filename: 'photo.jpg',
        content_type: 'image/jpeg',
      )

      patch note_path, params: { photo: nil }.to_json, headers: headers

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['photo_location']).to be_nil
      expect(response.parsed_body['text']).to eq('original')
      expect(note.reload.s3_photo).not_to be_attached
    end

    it 'adds a photo to a note that had none — something neither app can do today' do
      patch note_path, params: { photo: photo_base64 }.to_json, headers: headers

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body['photo_location']).to be_present
    end

    it 'returns 400 for an empty payload instead of bumping the version' do
      patch note_path, params: {}.to_json, headers: headers

      expect(response).to have_http_status(:bad_request)
      expect(response.parsed_body['error_code']).to eq('validation_error')
      expect(session_record.reload.version).to eq(2)
    end

    it 'returns 404 for a note id belonging to another session' do
      foreign = create(:note, session: create(:mobile_session, user: user), number: 0)

      patch note_path(foreign.id), params: { text: 'edited' }.to_json, headers: headers

      expect(response).to have_http_status(:not_found)
      expect(response.parsed_body['error_code']).to eq('note_not_found')
      expect(foreign.reload.text).not_to eq('edited')
    end

    # Rejected from the declared Content-Length, before the body is parsed.
    it 'returns 413 for a body larger than one photo plus its envelope' do
      oversized = 'A' * (Api::V3::MobileSessions::NotesController::MAX_BODY_BYTES + 1)

      patch note_path, params: { text: 'x', photo: oversized }.to_json, headers: headers

      expect(response).to have_http_status(:payload_too_large)
      expect(response.parsed_body['error_code']).to eq('payload_too_large')
      expect(session_record.reload.version).to eq(2)
    end
  end

  describe 'DELETE destroy' do
    let!(:note) { create(:note, session: session_record, number: 0) }

    it 'deletes the note and bumps the session version' do
      delete "#{notes_path}/#{note.id}", headers: headers

      expect(response).to have_http_status(:no_content)
      expect(Note.where(id: note.id)).to be_empty
      expect(session_record.reload.version).to eq(3)
    end

    # Nothing in the codebase assumes note numbers are contiguous — no
    # `maximum(:number)`, no arithmetic on it, no array indexed by it — and
    # neither client renumbers after its own local delete. Renumbering here
    # would rewrite the correlation key the legacy v1 sync path still matches on
    # (Session#sync, app/models/session.rb:271).
    it 'leaves a hole in the numbering rather than renumbering' do
      create(:note, session: session_record, number: 1)
      create(:note, session: session_record, number: 2)

      delete "#{notes_path}/#{session_record.notes.find_by(number: 1).id}", headers: headers

      expect(session_record.reload.notes.map(&:number).sort).to eq([0, 2])
    end

    it 'returns 404 for an unknown note id' do
      delete "#{notes_path}/0", headers: headers

      expect(response).to have_http_status(:not_found)
      expect(response.parsed_body['error_code']).to eq('note_not_found')
    end

    it "returns 404 for another user's session" do
      other_note = create(:note, session: create(:mobile_session, user: create(:user)), number: 0)

      delete "/api/v3/mobile_sessions/#{other_note.session.uuid}/notes/#{other_note.id}",
             headers: headers

      expect(response).to have_http_status(:not_found)
      expect(Note.where(id: other_note.id)).to be_present
    end
  end
end
