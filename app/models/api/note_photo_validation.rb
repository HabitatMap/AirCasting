module Api
  # Photo and date checks shared by the note contracts. Extracted when notes
  # moved out of the session PATCH payload into their own resource: create and
  # update both accept a photo, and a photo that is validated one way on create
  # and another on update is a bug waiting to happen.
  module NotePhotoValidation
    # Above anything either app produces (Android compresses before upload) and
    # far below the point where one note in one body becomes a problem.
    MAX_PHOTO_BYTES = 5 * 1024 * 1024
    # base64 is 4 bytes per 3, plus padding — lets an oversized photo be refused
    # without decoding it into memory first.
    MAX_PHOTO_BASE64_BYTES = (MAX_PHOTO_BYTES * 4 / 3) + 4

    private

    # `filled(:string)` only rejects the empty string, so " " would get through
    # the schema and then fail Note's presence validation as a raw ActiveRecord
    # message. Caught here instead, so the client gets a `text` field error.
    def validate_text(error_key, value)
      error_key.failure('must not be blank') if value.to_s.strip.empty?
    end

    # Both apps send `yyyy-MM-dd'T'HH:mm:ss` in the phone's local wall clock;
    # DateTime.iso8601 accepts that as well as the `Z` / `+02:00` forms. Rejected
    # here so the client gets a `date` error, not "Date can't be blank" from
    # ActiveRecord after the string silently casts to nil.
    def validate_date(error_key, value)
      DateTime.iso8601(value)
    rescue ArgumentError, TypeError
      error_key.failure('must be an ISO 8601 date-time (e.g. 2026-08-14T10:00:00)')
    end

    def validate_photo(error_key, encoded)
      return if encoded.nil? # explicit removal

      # Both shipping clients wrap at 76 columns — iOS `.lineLength76Characters`
      # (SessionUploadService.swift:86), Android `Base64.DEFAULT`
      # (extensions.kt:115) — and the legacy server decodes with the lenient
      # Base64.decode64. Strip the wrapping, then decode strictly: wrapped input
      # is accepted like legacy, but something that is not base64 at all still
      # gets that message rather than silently decoding to garbage.
      compact = encoded.gsub(/\s+/, '')

      if compact.bytesize > MAX_PHOTO_BASE64_BYTES
        return error_key.failure("must be at most #{MAX_PHOTO_BYTES} bytes once decoded")
      end

      begin
        decoded = Base64.strict_decode64(compact)
      rescue ArgumentError
        return error_key.failure('must be base64-encoded')
      end

      if decoded.bytesize > MAX_PHOTO_BYTES
        return error_key.failure("must be at most #{MAX_PHOTO_BYTES} bytes once decoded")
      end

      # Sniffed from the bytes, never taken from the client: this blob is served
      # back under a URL, so anything that is not an image has no business here.
      content_type = Marcel::MimeType.for(StringIO.new(decoded))
      return if content_type.to_s.start_with?('image/')

      error_key.failure("must be an image, got '#{content_type}'")
    end
  end
end
