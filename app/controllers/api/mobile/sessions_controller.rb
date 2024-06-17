module Api
  class Mobile::SessionsController < BaseController
    respond_to :json

    def index
      GoogleAnalyticsWorker::RegisterEvent.async_call('Mobile sessions#index')
      q = ActiveSupport::JSON.decode(params.to_unsafe_hash[:q]).symbolize_keys
      q[:time_from] = Time.strptime(q[:time_from].to_s, '%s')
      q[:time_to] = Time.strptime(q[:time_to].to_s, '%s')

      form =
        Api::ParamsForm.new(
          params: q,
          schema: Api::MobileSessions::Schema,
          struct: Api::MobileSessions::Struct
        )
      result = Api::ToMobileSessionsArray.new(form: form).call

      if result.success?
        render json: result.value, status: :ok
      else
        render json: result.errors, status: :bad_request
      end
    end

    def show
      GoogleAnalyticsWorker::RegisterEvent.async_call('Mobile sessions#show')

      if show_form.invalid?
        render json: show_form.errors, status: :bad_request
      else
        hash = Api::ToMobileSessionHash.new(stream: stream).call
        render json: hash, status: :ok
      end
    end

    def show2
      GoogleAnalyticsWorker::RegisterEvent.async_call('Mobile sessions#show2')

      if show_form.invalid?
        render json: show_form.errors, status: :bad_request
      else
        hash = Api::ToSessionHash2.new(stream: stream).call
        render json: hash, status: :ok
      end
    end

    private

    def stream
      @stream ||= Stream
        .includes(:threshold_set)
        .joins(:session)
        .find_by!(sensor_name: show_form.to_h.sensor_name, sessions: { id: show_form.to_h.id })
    end

    def show_form
      @show_form ||= Api::ParamsForm.new(
        params: params.to_unsafe_hash,
        schema: Api::Session::Schema,
        struct: Api::Session::Struct
      )
    end
  end
end
