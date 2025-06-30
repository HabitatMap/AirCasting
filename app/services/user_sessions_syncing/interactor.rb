module UserSessionsSyncing
  class Interactor
    def initialize(
      contract: Contract.new,
      deleting_handler: DeletingHandler.new,
      uploading_downloading_handler: UploadingDownloadingHandler.new
    )
      @contract = contract
      @deleting_handler = deleting_handler
      @uploading_downloading_handler = uploading_downloading_handler
    end

    def call(params:, user_id:)
      contract_result = contract.call(params)

      if contract_result.failure?
        return Failure.new(contract_result.errors.to_h)
      end

      sessions_from_mobile_app = contract_result.to_h[:data]

      to_upload_uuids, to_download_uuids, deleted_uuids = nil
      ActiveRecord::Base.transaction do
        deleted_uuids = handle_deleting(sessions_from_mobile_app, user_id)
        to_upload_uuids, to_download_uuids =
          handle_uploading_downloading(
            sessions_from_mobile_app,
            deleted_uuids,
            user_id,
          )
      end

      Success.new(
        {
          upload: to_upload_uuids,
          download: to_download_uuids,
          deleted: deleted_uuids,
        },
      )
    end

    private

    attr_reader :contract, :deleting_handler, :uploading_downloading_handler

    def handle_deleting(sessions_from_mobile_app, user_id)
      deleting_handler.call(
        sessions_from_mobile_app: sessions_from_mobile_app,
        user_id: user_id,
      )
    end

    def handle_uploading_downloading(
      sessions_from_mobile_app,
      deleted_uuids,
      user_id
    )
      sessions_from_mobile_app_without_deleted =
        sessions_from_mobile_app.reject do |session|
          deleted_uuids.include?(session[:uuid])
        end

      UserSessionsSyncing::UploadingDownloadingHandler.new.call(
        sessions_from_mobile_app: sessions_from_mobile_app_without_deleted,
        user_id: user_id,
      )
    end
  end
end
