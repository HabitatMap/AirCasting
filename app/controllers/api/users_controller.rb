module Api
  class UsersController < BaseController
    # TokenAuthenticatable was removed from Devise in 3.1
    # https://gist.github.com/josevalim/fb706b1e933ef01e4fb6
    before_action :authenticate_user_from_token!, except: :create
    before_action :authenticate_user!, except: :create

    respond_to :json

    def show
      GoogleAnalyticsWorker::RegisterEvent.async_call('User#show')
      respond_with current_user
    end

    def create
      GoogleAnalyticsWorker::RegisterEvent.async_call('User#create')
      user = User.new(user_params.to_unsafe_hash)

      if user.save
        respond_with user, location: api_user_url
      else
        render json: user.errors, status: 422
      end
    end

    def destroy
      GoogleAnalyticsWorker::RegisterEvent.async_call('User#destroy')
      current_user.destroy
      head :no_content
    end

    def settings
      GoogleAnalyticsWorker::RegisterEvent.async_call('User#settings')
      data = params.to_unsafe_hash[:data].deep_symbolize_keys
      cast_data = cast_bool_params(data)
      form =
        Api::ParamsForm.new(
          params: cast_data,
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

    def cast_bool_params(data)
      data.transform_values do |v|
        if ["true", "false"].include? v
          ActiveModel::Type::Boolean.new.cast(v)
        else
          v
        end
      end
    end
  end
end
