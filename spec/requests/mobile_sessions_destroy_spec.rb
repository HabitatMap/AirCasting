require 'rails_helper'

describe 'DELETE /api/v3/mobile_sessions/:uuid' do
  include Devise::Test::IntegrationHelpers

  let(:user) { create(:user) }

  def delete_session(uuid)
    delete "/api/v3/mobile_sessions/#{uuid}",
           headers: { 'ACCEPT' => 'application/json', 'CONTENT_TYPE' => 'application/json' }
  end

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

  it "returns 404 for another user's session (and does not delete it)" do
    other = create(:mobile_session)

    expect { delete_session(other.uuid) }.not_to change(Session, :count)
    expect(response).to have_http_status(:not_found)
    expect(response.parsed_body['error_code']).to eq('session_not_found')
  end

  it 'returns unauthorized without authentication' do
    sign_out user
    session = create(:mobile_session, user: user)
    delete_session(session.uuid)
    expect(response).to have_http_status(:unauthorized)
  end
end
