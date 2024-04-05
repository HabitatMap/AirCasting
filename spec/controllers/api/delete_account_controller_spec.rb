require 'rails_helper'

RSpec.describe Api::DeleteAccountController, type: :controller do
  let(:user) { FactoryBot.create(:user) }

  before do
    sign_in(user)
    allow(controller).to receive(:current_user).and_return(user)
  end

  describe '#request_account_deletion' do
    it 'sends a confirmation code to the user email' do
      expect(UserMailer).to receive(:account_delete_email).with(user.email, text).and_call_original
      post :request_account_deletion, format: :json
      expect(response).to have_http_status(:ok)
    end
  end

  describe '#delete_account_with_confirmation_code' do
    context 'with a valid confirmation code' do
      before do
        user.update(deletion_confirmation_code: '1234', deletion_code_valid_until: 30.minutes.from_now)
      end

      it 'successfully deletes the user account' do
        expect { post :delete_account_with_confirmation_code, params: { code: '1234' }, format: :json }
        .to change(User, :count).by(-1)
        expect(response).to have_http_status(:ok)
        expect(json_response['message']).to eq('Account successfully deleted.')
      end
    end

    context 'with an invalid or expired confirmation code' do
      it 'returns an error message' do
        post :delete_account_with_confirmation_code, params: { code: 'wrong_code' }, format: :json
        expect(response).to have_http_status(:unauthorized)
        expect(json_response['error']).to eq('Invalid or expired confirmation code.')
      end
    end
  end
end
