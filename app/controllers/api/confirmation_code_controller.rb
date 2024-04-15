module Api
  class ConfirmationCodeController < BaseController
    before_action :authenticate_user_from_token!
    before_action :authenticate_user!

    respond_to :json

    def request_account_deletion
      code = generate_confirmation_code
      send_confirmation_code(code)
      head :ok
    end

    private

    def generate_confirmation_code
      code = SecureRandom.random_number(1000).to_s.rjust(4, '0')
      UsersRepository.new.save_confirmation_data(user_id: current_user.id, code: code, expiration_date: 30.minutes.from_now)

      code
    end

    def send_confirmation_code(code)
      UserMailer.account_delete_email(current_user.email, code).deliver_now
    end
  end
end
