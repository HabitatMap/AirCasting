require 'rails_helper'

# GET /api/v3/mobile_sessions/:uuid — one session with its stream aggregates and
# its notes. This and PATCH are the only endpoints that carry the notes inline,
# and the only way a second device learns a note's photo, so the notes and the
# `sensor_type_id` a client needs to upload measurements are both asserted here.
describe 'GET /api/v3/mobile_sessions/:uuid' do
  let(:user) { create(:user) }
  let(:device) { create(:device, user: user, name: 'My AirBeam') }
  let(:session_record) do
    create(
      :mobile_session,
      user: user,
      device: device,
      time_zone: 'America/New_York',
      title: 'Morning bike ride',
    )
  end

  def bearer(token) = { 'Authorization' => "Bearer #{token}" }

  def show(uuid, token: user.authentication_token)
    get "/api/v3/mobile_sessions/#{uuid}", headers: bearer(token)
  end

  it 'returns the session metadata, its device and its stream aggregates' do
    create(
      :stream,
      session: session_record,
      sensor_name: 'AirBeamMini-PM2.5',
      sensor_type_id: 2,
      measurements_count: 1440,
      average_value: 12.5,
    )

    show(session_record.uuid)

    expect(response).to have_http_status(:ok)
    body = response.parsed_body
    expect(body['uuid']).to eq(session_record.uuid)
    expect(body['title']).to eq('Morning bike ride')
    expect(body['type']).to eq('MobileSession')
    expect(body['time_zone']).to eq('America/New_York')
    # Present and null until the recording is declared over — the key is what a
    # client decodes, so it must not appear only on finished sessions.
    expect(body).to include('finished_at' => nil)
    expect(body['share_url']).to include('/s/')
    expect(body['device']).to eq(
      'mac_address' => device.mac_address, 'model' => 'AirBeamMini', 'name' => 'My AirBeam',
    )

    stream = body.fetch('streams').fetch('AirBeamMini-PM2.5')
    expect(stream['measurements_count']).to eq(1440)
    expect(stream['average_value']).to eq(12.5)
  end

  # The binary measurements upload addresses a stream by sensor_type_id, and for
  # a custom sensor it is allocated per session — so a client that no longer has
  # the create response has no other way to recover it.
  it 'returns each stream\'s sensor_type_id' do
    create(:stream, session: session_record, sensor_name: 'AirBeamMini-PM2.5', sensor_type_id: 2)
    create(:stream, session: session_record, sensor_name: 'Custom-Pressure', sensor_type_id: 100)

    show(session_record.uuid)

    streams = response.parsed_body.fetch('streams')
    expect(streams.fetch('AirBeamMini-PM2.5')['sensor_type_id']).to eq(2)
    expect(streams.fetch('Custom-Pressure')['sensor_type_id']).to eq(100)
  end

  describe 'notes' do
    it 'embeds them ordered by number then id, each with its id' do
      create(:note, session: session_record, number: 1, text: 'second')
      create(:note, session: session_record, number: 0, text: 'first')

      show(session_record.uuid)

      notes = response.parsed_body.fetch('notes')
      expect(notes.map { |note| note['text'] }).to eq(%w[first second])
      expect(notes.map { |note| note['id'] }).to all(be_present)
      expect(notes.first.keys)
        .to include('id', 'number', 'text', 'date', 'latitude', 'longitude', 'photo_location')
    end

    it 'carries the photo url for a note that has one, and null for one that does not' do
      create(:note, :with_photo, session: session_record, number: 0)
      create(:note, session: session_record, number: 1)

      show(session_record.uuid)

      with_photo, without_photo = response.parsed_body.fetch('notes')
      expect(with_photo['photo_location']).to be_present
      expect(without_photo['photo_location']).to be_nil
    end

    it 'is an empty array for a session with no notes' do
      show(session_record.uuid)

      expect(response.parsed_body.fetch('notes')).to eq([])
    end

    # The serializer reaches the notes through `with_attached_s3_photo`, which is
    # a scope and therefore a fresh relation — a preload set up by the controller
    # would be silently discarded and every note read twice.
    it 'does not read the notes or their attachments twice' do
      create(:stream, session: session_record, sensor_name: 'AirBeamMini-PM2.5')
      create(:note, :with_photo, session: session_record, number: 0)

      sql = []
      collect = lambda do |_name, _start, _finish, _id, payload|
        sql << payload[:sql] unless payload[:name] == 'SCHEMA'
      end
      ActiveSupport::Notifications.subscribed(collect, 'sql.active_record') do
        show(session_record.uuid)
      end

      note_reads = sql.count { |query| query.start_with?('SELECT "notes"') }
      attachment_reads = sql.count { |query| query.include?('active_storage_attachments') }
      expect(note_reads).to eq(1)
      expect(attachment_reads).to eq(1)
    end

    # One threshold_set query for all of them, not one per stream.
    it 'does not query a threshold_set per stream' do
      3.times do |i|
        create(:stream, session: session_record, sensor_name: "Sensor-#{i}", sensor_type_id: 100 + i)
      end

      sql = []
      collect = lambda do |_name, _start, _finish, _id, payload|
        sql << payload[:sql] unless payload[:name] == 'SCHEMA'
      end
      ActiveSupport::Notifications.subscribed(collect, 'sql.active_record') do
        show(session_record.uuid)
      end

      expect(sql.count { |query| query.start_with?('SELECT "threshold_sets"') }).to eq(1)
    end
  end

  describe 'scoping' do
    # 404 rather than 403: a 403 would confirm the session exists.
    it "returns 404 for another user's session" do
      other = create(:mobile_session, user: create(:user))

      show(other.uuid)

      expect(response).to have_http_status(:not_found)
      expect(response.parsed_body['error_code']).to eq('session_not_found')
    end

    it 'returns 404 for a fixed session, which this endpoint does not serve' do
      fixed = create(:fixed_session, user: user)

      show(fixed.uuid)

      expect(response).to have_http_status(:not_found)
      expect(response.parsed_body['error_code']).to eq('session_not_found')
    end

    it 'returns 404 for an unknown uuid' do
      show('does-not-exist')

      expect(response).to have_http_status(:not_found)
      expect(response.parsed_body['error_code']).to eq('session_not_found')
    end

    it 'returns 401 for a bad token, without disclosing whether the session exists' do
      show(session_record.uuid, token: 'nonsense')

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body['error_code']).to eq('unauthorized')
    end

    it 'returns 401 with no Authorization header' do
      get "/api/v3/mobile_sessions/#{session_record.uuid}"

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
