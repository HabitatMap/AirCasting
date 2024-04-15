require 'rails_helper'

RSpec.describe Api::ConfirmationCodeController, type: :controller do
  let(:user) { FactoryBot.create(:user) }

  before do
    sign_in(user)
    allow(controller).to receive(:current_user).and_return(user)
  end

  describe '#request_account_deletion' do
    it 'sends a confirmation code to the user email' do
      expect(UserMailer).to receive(:account_delete_email).with(user.email, anything).and_call_original
      post :request_account_deletion, format: :json
      expect(response).to have_http_status(:ok)
    end
  end
end
