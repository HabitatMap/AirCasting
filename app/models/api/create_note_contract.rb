module Api
  # A single note being added to a mobile session.
  #
  # `number` is deliberately not accepted. It used to be client-allocated, and
  # the two apps disagreed about how: iOS uses max+1 (NotesHandler.swift:51),
  # Android uses last-in-list+1 off an unordered Room relation
  # (AddNoteBottomSheet.kt:127). Now that the note's identity is its server-side
  # `id`, `number` is only a legacy correlation key for the v1 sync path, so the
  # server allocates it and the client has one less thing to get wrong.
  class CreateNoteContract < Dry::Validation::Contract
    include NotePhotoValidation

    params do
      required(:text).filled(:string)
      required(:date).filled(:string)
      required(:latitude).filled(:float)
      required(:longitude).filled(:float)
      optional(:photo).maybe(:string)
    end

    rule(:text) do
      validate_text(key, value) if key?
    end

    rule(:date) do
      validate_date(key, value)
    end

    rule(:photo) do
      validate_photo(key, value) if key?
    end
  end
end
