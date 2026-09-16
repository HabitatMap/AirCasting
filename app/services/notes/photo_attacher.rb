module Notes
  # The three-way `photo` semantics, in one place: key absent keeps whatever is
  # attached, nil removes it, a base64 string replaces it. Returns whether
  # anything changed, which is what decides the session version bump.
  class PhotoAttacher
    def call(note, data)
      return false unless data.key?(:photo)

      encoded = data[:photo]

      if encoded.nil?
        return false unless note.s3_photo.attached?

        # Assigning nil, not `purge_later`. purge_later enqueues PurgeJob the
        # instant it is called, inside the open transaction: Sidekiq can run it
        # before the commit, still see the attachment row, hit the blob_id
        # foreign key and give up silently — leaking the blob and its S3 object.
        # Assigning nil destroys the attachment through the `dependent: :destroy`
        # has_one, whose purge rides after_destroy_commit. Same path a photo
        # replacement already takes.
        note.s3_photo = nil
        note.save!
        return true
      end

      # Already validated as base64 decoding to an image
      # (Api::NotePhotoValidation#validate_photo). decode64 is the lenient form,
      # matching the line-wrapped base64 both clients emit.
      decoded = Base64.decode64(encoded)
      content_type = Marcel::MimeType.for(StringIO.new(decoded))

      # The S3 upload itself is not in the transaction: `has_one_attached`
      # registers it on `after_commit`, so `save` only writes the blob and
      # attachment rows here and the bytes go up once the commit lands.
      note.s3_photo.attach(
        io: StringIO.new(decoded),
        filename: "photo_#{SecureRandom.hex(8)}.#{extension_for(content_type)}",
        content_type: content_type,
      )
      true
    end

    private

    # Rails only registers a symbol for the formats it renders, so
    # `Mime::Type.lookup('image/heic').symbol` is nil and the filename would end
    # in a bare dot. Fall back to the content type's subtype, which is the
    # conventional extension for every image type we accept.
    def extension_for(content_type)
      Mime::Type.lookup(content_type).symbol || content_type.to_s.split('/').last
    end
  end
end
