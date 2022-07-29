require 'rails_helper'

shared_examples_for 'action returning user as json' do
  it "returns user's id, email and auth token" do
    expect(json_response).to have_key('id')
    expect(json_response).to have_key('email')
    expect(json_response).to have_key('authentication_token')
  end
end

describe Api::UsersController do
  describe '#show' do
    let(:user) { FactoryBot.create(:user) }

    before do
      sign_in user
      get :show, format: :json
    end

    it_should_behave_like 'action returning user as json'
  end

  describe '#create' do
    let!(:user) { FactoryBot.build(:user) }
    let(:attrs) { { lolz: 'rotfl' } }

    before do
      expect(User).to receive(:new).with(attrs.stringify_keys).and_return(user)
      allow(user).to receive_messages(save: success)

      post :create, params: { user: attrs }, format: :json
    end

    context 'when user creation succeeds' do
      let(:success) { true }

      it { is_expected.to respond_with(:created) }

      it_should_behave_like 'action returning user as json'
    end

    context 'when user creation fails' do
      let(:success) { false }

      it { is_expected.to respond_with(:unprocessable_entity) }
    end
  end

  describe '#create with session_stopped_alert' do
    let(:email) { 'sdfgv@dsfg.dfg' }
    let(:attrs) { { username: 'sdfg', email: email, password: 'password', session_stopped_alert: true } }

    it 'creates a user with alerts set to true' do
      post :create, params: { user: attrs }, format: :json

      user = User.last
      expect(user.email).to eq email
      expect(user.session_stopped_alert).to be true
    end
  end

  describe '#destroy' do
    it 'deletes the user' do
      user = create_user!
      sign_in(user)

      expect {
        delete :destroy, format: :json
      }.to change { User.count }.from(1).to(0)
    end

    it 'deletes all user sessions' do
      user = create_user!
      other_user = create_user!
      sign_in(user)

      session1 = create_session!(user: user)
      session2 = create_session!(user: user)
      session3 = create_session!(user: other_user)
      stream = create_stream!(session: session1)
      measurement = create_measurement!(stream: stream)

      delete :destroy, format: :json

      expect(Session.count).to eq 1
      expect(Stream.count).to eq 0
      expect(Measurement.count).to eq 0
    end
  end

  describe '#settings' do
    let!(:user) { create_user!(session_stopped_alert: false) }

    before { sign_in(user) }
    before { allow(controller).to receive(:current_user) { user } }

    it 'changes session stopped alert setting' do
      post :settings,
           format: :json,
           params: {
             data: { session_stopped_alert: true }.to_json
           }

      expect(json_response).to eq(
        { 'action' => 'session_stopped_alert was set to true' }.as_json
      )
      expect(user.session_stopped_alert).to eq(true)
    end
  end
end
