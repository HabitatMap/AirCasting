module Api
  class UsersController < BaseController
    # TokenAuthenticatable was removed from Devise in 3.1
    # https://gist.github.com/josevalim/fb706b1e933ef01e4fb6
    before_action :authenticate_user_from_token!, except: :create
    before_action :authenticate_user!, except: :create

    respond_to :json

    def show
      respond_with current_user
    end

    def create
      user = User.new(user_params.to_unsafe_hash)

      if user.save
        respond_with user, location: api_user_url
      else
        render json: user.errors, status: 422
      end
    end

    def destroy
      current_user.destroy
      head :no_content
    end

    def delete_account_with_confirmation_code
      if confirmation_code_valid?
        current_user.destroy
        render_success_message('Account successfully deleted.')
      else
        render_error_message('Invalid or expired confirmation code.')
      end
    end

    def settings
      contract =
        Api::UserSettingsContract.new.call(params.to_unsafe_hash[:data])
      result =
        Api::UpdateUserSettings.new(contract: contract, user: current_user).call

      if result.success?
        render json: result.value, status: :ok
      else
        render json: result.errors, status: :bad_request
      end
    end

    def user_params
      params.require(:user).permit!
    end

    private

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
