module Api
  class MeasurementSessionsController < BaseController
    # TokenAuthenticatable was removed from Devise in 3.1
    # https://gist.github.com/josevalim/fb706b1e933ef01e4fb6
    before_action :authenticate_user_from_token!, only: :create
    before_action :authenticate_user!, only: :create

    respond_to :json

    def create
      if ActiveModel::Type::Boolean.new.cast(params[:compression])
        decoded = Base64.decode64(params[:session])
        unzipped = AirCasting::GZip.inflate(decoded)
      else
        unzipped = params[:session]
      end
      photos = params[:photos] || []

      data = deep_symbolize ActiveSupport::JSON.decode(unzipped)
      data[:type] = 'MobileSession' # backward compatibility

      session = SessionBuilder.new(data, photos, current_user).build!

      if session
        render json: session_json(session), status: :ok
      else
        head :bad_request
      end
    end

    def export
      contract = Api::ExportSessionsContract.new.call(params.to_unsafe_hash)
      result = Api::ScheduleSessionsExport.new(contract: contract).call

      if result.success?
        render json: result.value, status: :ok
      else
        render json: result.errors, status: :bad_request
      end
    end

    def export_by_uuid
      form =
        Api::ParamsForm.new(
          params: params.to_unsafe_hash,
          schema: Api::ExportSessionByUuid::Schema,
          struct: Api::ExportSessionByUuid::Struct,
        )

      result = Api::ScheduleSessionsExportByUuid.new(form: form).call

      if result.success?
        render json: result.value, status: :ok
      else
        render json: result.errors, status: :bad_request
      end
    end

    private

    def session_json(session)
      {
        location: short_session_url(session, host: A9n.host_),
        notes:
          session.notes.map do |note|
            { number: note.number, photo_location: photo_location(note) }
          end,
      }
    end
  end
end
