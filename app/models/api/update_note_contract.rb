module Api
  # Editing a note after the fact. Partial: an omitted key is left alone.
  #
  # Only `text` and `photo` are editable, which is what the apps actually do —
  # `date`, `latitude`, `longitude` and `number` are never changed after
  # creation on either platform, and they describe where the recording was when
  # the note was taken, so letting them move would make the note lie.
  class UpdateNoteContract < Dry::Validation::Contract
    include NotePhotoValidation

    EDITABLE_KEYS = %i[text photo].freeze

    params do
      optional(:text).filled(:string)
      # Absent: keep whatever is attached. nil: remove it. A base64 string:
      # replace it. See Notes::PhotoAttacher.
      optional(:photo).maybe(:string)
    end

    # An empty body would otherwise bump the session `version` and make every
    # other device re-download for no change at all.
    rule do
      if EDITABLE_KEYS.none? { |key| values.key?(key) }
        key(:base).failure("must contain at least one of: #{EDITABLE_KEYS.join(', ')}")
      end
    end

    rule(:text) do
      validate_text(key, value) if key?
    end

    rule(:photo) do
      validate_photo(key, value) if key?
    end
  end
end
