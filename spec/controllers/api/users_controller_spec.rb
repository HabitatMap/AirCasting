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

  describe '#settings' do
    let!(:user) { create_user!(session_stopped_alert: false) }

    before { sign_in(user) }
    before { allow(controller).to receive(:current_user) { user } }

    it 'changes session stopped alert setting' do
      post :settings,
           format: :json,
           params: { data: { session_stopped_alert: true }.to_json }

      expect(json_response).to eq(
        { 'action' => 'session_stopped_alert was set to true' }.as_json
      )
      expect(user.session_stopped_alert).to eq(true)
    end
  end
end
