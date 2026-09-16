module Api
  module V3
    module MobileSessions
      # Notes as their own resource, keyed on the server-side `id`.
      #
      # They were previously a declarative-full array inside
      # PATCH /mobile_sessions/:uuid, which meant editing one note resent all of
      # them and the only handle a client had was the client-assigned `number` —
      # which is not stable, because deleting the highest-numbered note makes the
      # next one reuse it on both apps.
      class NotesController < BaseController
        ErrorCodes = ::MobileSessions::ErrorCodes
        NoteErrorCodes = ::Notes::ErrorCodes

        # The contract refuses a photo over 5 MB decoded, but only after Rails
        # has parsed the whole JSON body to find it. This is the same number
        # plus room for the envelope and the note's text, checked against the
        # declared Content-Length so an oversized upload costs the headers and
        # nothing more. A chunked request declares no length and falls through
        # to the contract, which is correct if slower.
        MAX_BODY_BYTES = ::Api::NotePhotoValidation::MAX_PHOTO_BASE64_BYTES + 64.kilobytes

        before_action :authenticate_user_from_bearer_token
        before_action :require_authentication!
        before_action :reject_oversized_body, only: %i[create update]
        before_action :load_session
        before_action :load_note, only: %i[update destroy]

        def index
          render json: serializer.call_many(@session.notes.with_attached_s3_photo), status: :ok
        end

        def create
          contract = Api::CreateNoteContract.new.call(payload)
          return render_validation_error(contract.errors) if contract.failure?

          result = ::Notes::Creator.new.call(session: @session, data: contract.to_h)
          return render_failure(result) unless result.success?

          render json: serializer.call(result.value[:note]), status: :created
        end

        def update
          contract = Api::UpdateNoteContract.new.call(payload)
          return render_validation_error(contract.errors) if contract.failure?

          result = ::Notes::Updater.new.call(
            session: @session,
            note: @note,
            data: contract.to_h,
          )
          return render_failure(result) unless result.success?

          render json: serializer.call(result.value[:note].reload), status: :ok
        end

        def destroy
          result = ::Notes::Destroyer.new.call(session: @session, note: @note)
          return render_failure(result) unless result.success?

          head :no_content
        end

        private

        # Route and wrapper params are stripped by the contracts, but `payload`
        # is also what `photo` arrives in, so it is read unfiltered from the
        # request rather than through strong parameters.
        def payload
          params.to_unsafe_h.deep_symbolize_keys
        end

        def reject_oversized_body
          return if request.content_length.to_i <= MAX_BODY_BYTES

          render_error(
            ::Api::V3::ErrorCodes::PAYLOAD_TOO_LARGE,
            "Request body exceeds #{MAX_BODY_BYTES} bytes; " \
            "a photo may be at most #{::Api::NotePhotoValidation::MAX_PHOTO_BYTES} bytes once decoded",
          )
        end

        def load_session
          @session = current_user
                     .mobile_sessions
                     .by_uuid(params[:mobile_session_uuid])
                     .first
          return if @session

          render_error(ErrorCodes::SESSION_NOT_FOUND, 'Session not found')
        end

        # Scoped to the session, so a note id from another session reads as
        # absent rather than forbidden — a 403 would confirm it exists.
        def load_note
          @note = @session.notes.find_by(id: params[:id])
          return if @note

          render_error(NoteErrorCodes::NOTE_NOT_FOUND, 'Note not found')
        end

        def serializer
          @serializer ||= ::Notes::Serializer.new
        end
      end
    end
  end
end
