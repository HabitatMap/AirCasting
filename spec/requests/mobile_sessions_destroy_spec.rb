require 'rails_helper'

describe 'DELETE /api/v3/mobile_sessions/:uuid' do
  include Devise::Test::IntegrationHelpers

  let(:user) { create(:user) }

  def delete_session(uuid, headers = {})
    delete "/api/v3/mobile_sessions/#{uuid}",
           headers: {
             'ACCEPT' => 'application/json',
             'CONTENT_TYPE' => 'application/json',
           }.merge(headers)
  end

  def bearer(token) = { 'Authorization' => "Bearer #{token}" }

  before { sign_in user }

  it 'deletes the session, cascades its data, and writes a tombstone' do
    session = create(:mobile_session, user: user)
    stream = create(:stream, session: session)
    stream.build_measurements!([{ time: Time.current, value: 1.0, latitude: 40.0, longitude: -74.0 }])
    create(:note, session: session)

    expect { delete_session(session.uuid) }
      .to change(Session, :count).by(-1)
      .and change(Stream, :count).by(-1)
      .and change(Measurement, :count).by(-1)
      .and change(Note, :count).by(-1)
      .and change(DeletedSession, :count).by(1)

    expect(response).to have_http_status(:no_content)
    expect(DeletedSession.last.uuid).to eq(session.uuid)
  end

  it 'cascades the rest of the per-stream tables' do
    session = create(:mobile_session, user: user)
    stream = create(:stream, session: session)
    create(:stream_daily_average, stream: stream)
    create(:fixed_measurement, stream: stream)
    create(:threshold_alert, stream: stream, user_id: user.id)

    expect { delete_session(session.uuid) }
      .to change(StreamDailyAverage, :count).by(-1)
      .and change(FixedMeasurement, :count).by(-1)
      .and change(ThresholdAlert, :count).by(-1)

    expect(response).to have_http_status(:no_content)
  end

  # Guards the foreign key streams.last_hourly_average_id -> stream_hourly_averages.
  it 'deletes a session whose stream points at its own hourly average' do
    session = create(:mobile_session, user: user)
    stream = create(:stream, session: session)
    average = create(:stream_hourly_average, stream: stream)
    stream.update!(last_hourly_average_id: average.id)

    delete_session(session.uuid)

    expect(response).to have_http_status(:no_content)
    expect(Session.where(id: session.id)).to be_empty
  end

  it 'purges the photo of every note it deletes' do
    session = create(:mobile_session, user: user)
    create(:note, :with_photo, session: session)

    expect { delete_session(session.uuid) }
      .to change(ActiveStorage::Attachment, :count).by(-1)

    expect(response).to have_http_status(:no_content)
  end

  # A client that loses the response and retries must not be told its session is
  # missing — the tombstone proves the delete already happened.
  it 'answers 204 when the session was already deleted' do
    session = create(:mobile_session, user: user)
    delete_session(session.uuid)
    expect(response).to have_http_status(:no_content)

    expect { delete_session(session.uuid) }.not_to change(DeletedSession, :count)

    expect(response).to have_http_status(:no_content)
  end

  it 'answers 204 on a retry that differs only in uuid case' do
    session = create(:mobile_session, user: user, uuid: SecureRandom.uuid)
    delete_session(session.uuid)

    delete_session(session.uuid.upcase)

    expect(response).to have_http_status(:no_content)
  end

  it 'answers 404 for a uuid that was never this user\'s' do
    delete_session('never-existed')

    expect(response).to have_http_status(:not_found)
    expect(response.parsed_body['error_code']).to eq('session_not_found')
  end

  it "does not let one user's tombstone answer for another" do
    other_user = create(:user)
    other_session = create(:mobile_session, user: other_user, uuid: SecureRandom.uuid)
    create(:deleted_session, uuid: other_session.uuid, user_id: other_user.id)

    delete_session(other_session.uuid)

    expect(response).to have_http_status(:not_found)
    expect(response.parsed_body['error_code']).to eq('session_not_found')
  end

  it 'refuses a fixed session through the mobile route' do
    fixed = create(:fixed_session, user: user)

    expect { delete_session(fixed.uuid) }.not_to change(Session, :count)

    expect(response).to have_http_status(:not_found)
    expect(response.parsed_body['error_code']).to eq('session_not_found')
  end

  it "returns 404 for another user's session (and does not delete it)" do
    other = create(:mobile_session)

    expect { delete_session(other.uuid) }.not_to change(Session, :count)
    expect(response).to have_http_status(:not_found)
    expect(response.parsed_body['error_code']).to eq('session_not_found')
  end

  it 'accepts the bearer token the mobile app sends' do
    sign_out user
    session = create(:mobile_session, user: user)

    expect { delete_session(session.uuid, bearer(user.authentication_token)) }
      .to change(Session, :count).by(-1)

    expect(response).to have_http_status(:no_content)
  end

  it 'returns unauthorized without authentication' do
    sign_out user
    session = create(:mobile_session, user: user)
    delete_session(session.uuid)
    expect(response).to have_http_status(:unauthorized)
  end

  # Every v3 endpoint answers errors as { error_code, message }; a raised
  # exception here would hand the client an HTML 500 instead.
  describe 'when the delete fails' do
    let(:session) { create(:mobile_session, user: user) }

    it 'answers internal_error in the v3 error shape' do
      allow_any_instance_of(MobileSessions::Destroyer)
        .to receive(:call)
        .and_return(
          Failure.new(error_code: 'internal_error', message: 'Could not delete this session'),
        )

      delete_session(session.uuid)

      expect(response).to have_http_status(:internal_server_error)
      expect(response.parsed_body['error_code']).to eq('internal_error')
    end

    it 'answers try_again_later with a Retry-After when the rows are locked' do
      allow_any_instance_of(MobileSessions::Destroyer)
        .to receive(:call)
        .and_return(
          Failure.new(error_code: 'try_again_later', message: 'Could not delete this session, please retry'),
        )

      delete_session(session.uuid)

      expect(response).to have_http_status(:service_unavailable)
      expect(response.parsed_body['error_code']).to eq('try_again_later')
      expect(response.headers['Retry-After']).to eq('5')
    end
  end
end
