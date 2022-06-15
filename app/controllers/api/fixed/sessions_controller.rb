module Api
  class Fixed::SessionsController < BaseController
    respond_to :json

    def show
      GoogleAnalyticsWorker::RegisterEvent.async_call('Fixed Sessions#show')

      if form.invalid?
        render json: form.errors, status: :bad_request
      else
        hash = Api::ToFixedSessionHash.new(measurements_limit: form.to_h.measurements_limit, stream: stream).call
        render json: hash, status: :ok
      end
    end

    def show_all_streams
      GoogleAnalyticsWorker::RegisterEvent.async_call('Fixed Sessions#show_all_streams')
      hash = Api::ToFixedSessionWithStreamsHash.new(session: session, measurements_limit: measurements_limit).call
      render json: hash, status: :ok
    end

    def show2
      GoogleAnalyticsWorker::RegisterEvent.async_call('Fixed Sessions#show2')

      if form.invalid?
        render json: form.errors, status: :bad_request
      else
        hash = Api::ToFixedSessionHash2.new(stream: stream).call
        render json: hash, status: :ok
      end
    end

    private

    def stream
      @stream ||= Stream
        .joins(:session)
        .find_by!(sensor_name: form.to_h.sensor_name, sessions: { id: form.to_h.id })
    end

    def form
      @form ||= Api::ParamsForm.new(
        params: params.to_unsafe_hash,
        schema: Api::Session::Schema,
        struct: Api::Session::Struct
      )
    end

    def id
      @id ||= params.fetch(:id)
    end

    def session
      @session ||= ::Session.find(id)
    end

    def measurements_limit
      @measurements_limit ||= params.fetch(:measurements_limit, nil)
    end
  end
end
