module Api
  class UsersController < BaseController
    # `create` is the exception: it answers the envelope *and* the flat shape
    # it shipped with, side by side. See `render_signup_errors`. Everything
    # else here has no client reading the body and answers the envelope alone.
    include Api::ErrorRendering

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
        render_signup_errors(user.errors)
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
        # 422, not the envelope's default 400: the body parsed fine, it is the
        # account the server will not accept.
        render_validation_error(
          result.errors,
          message: 'Account could not be updated',
          status: :unprocessable_entity,
        )
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
        render_error(ErrorCodes::UNAUTHORIZED, 'Invalid or expired confirmation code.')
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
        render_validation_error(result.errors, message: 'Settings are invalid')
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

    # The one endpoint whose error body is read by shipped builds, so the one
    # that cannot simply move to the envelope.
    #
    # Android decodes this into `CreateAccountErrorResponse(email, password,
    # username)` with Gson and puts each list straight under the matching form
    # field; iOS decodes `username`/`email` and tests the string for the exact
    # substring "has already been taken". Both parsers date from 2022, both
    # would quietly lose every per-field message if the leaves became objects
    # or moved under `fields`, and sign-up is a first-run screen — so the
    # oldest installed build still hits it. Assume the flat keys stay forever.
    #
    # Both parsers ignore keys they do not declare, so the envelope is added
    # alongside rather than wrapped around. This endpoint therefore answers
    # more keys than any other, on purpose. New clients read `fields` and
    # ignore the rest.
    #
    # Three things must not change here: the flat leaves stay arrays of plain
    # strings, the uniqueness message keeps the literal "has already been
    # taken", and the status stays 422.
    def render_signup_errors(errors)
      render json: errors.to_hash.merge(
        error_code: ErrorCodes::VALIDATION_ERROR,
        message: 'Account could not be created',
        fields: ValidationErrorsSerializer.call(errors),
      ), status: 422
    end

    def confirmation_code_valid?
      current_user.deletion_confirmation_code == params[:code] &&
        current_user.deletion_code_valid_until.future?
    end

    def render_success_message(message)
      render json: { message: message }, status: :ok
    end
  end
end
