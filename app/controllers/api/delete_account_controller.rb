module Api
  class DeleteAccountController < BaseController
    before_action :authenticate_user_from_token!
    before_action :authenticate_user!

    respond_to :json

    def request_account_deletion
      code = generate_confirmation_code
      send_confirmation_code(code)
      head :ok
    end

    def delete_account_with_confirmation_code
      if confirmation_code_valid?
        current_user.destroy
        render_success_message('Account successfully deleted.')
      else
        render_error_message('Invalid or expired confirmation code.')
      end
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

    def confirmation_code_valid?
      current_user.deletion_confirmation_code == params[:code] &&
        current_user.deletion_code_valid_until.future?
    end

    def render_success_message(message)
      render json: { message: message }, status: :ok
    end

    def render_error_message(error)
      render json: { error: error }, status: :unauthorized
    end
  end
end
