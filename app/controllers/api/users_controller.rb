module Api
  class UsersController < BaseController
    # TokenAuthenticatable was removed from Devise in 3.1
    # https://gist.github.com/josevalim/fb706b1e933ef01e4fb6
    before_action :authenticate_user_from_token!, except: :create
    # Additive: bearer is what v3 and the account-settings screens use. Basic
    # `<token>:X` still works and is what every shipped build sends.
    before_action :authenticate_user_from_bearer_token, except: :create
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

    # Serves all three account-settings sheets. Any subset of the fields may
    # arrive; a password change additionally requires `current_password`.
    def update
      result =
        Api::UpdateUserAccount.new(
          user: current_user,
          params: account_params,
        ).call

      if result.success?
        render json: result.value, status: :ok
      else
        render json: result.errors, status: 422
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

    # Explicitly *not* `user_params`. That one is `permit!`, which on an update
    # would accept `authentication_token` — the value AirBeams hold in EEPROM
    # and send as their HTTP Basic username, with no way to refresh it short of
    # re-pairing each device over BLE — and `admin`.
    # `fetch`, not `require`: a body with an empty or missing `user` is a client
    # bug worth a readable 422 from the service, not the bare 400 `require`
    # raises. A `user` that is a scalar rather than an object has no `permit`
    # and would 500, so it takes the same route as an empty one.
    def account_params
      user = params[:user]
      return ActionController::Parameters.new.permit! unless user.is_a?(ActionController::Parameters)

      user.permit(:username, :email, :password, :password_confirmation, :current_password)
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
