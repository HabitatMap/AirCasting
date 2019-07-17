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

    def settings
      form =
        Api::JsonForm.new(
          json: params.to_unsafe_hash[:data],
          schema: Api::UserSettings::Schema,
          struct: Api::UserSettings::Struct
        )
      result = Api::UpdateUserSettings.new(form: form, user: current_user).call

      if result.success?
        render json: result.value, status: :ok
      else
        render json: result.errors, status: :bad_request
      end
    end

    def user_params
      params.require(:user).permit!
    end
  end
end
