module Notes
  # One note as v3 returns it, from the note endpoints and from the session
  # show/update response alike. Extracted from MobileSessions::SessionSerializer
  # when notes became their own resource — two serializations of the same record
  # would drift, and `id` has to appear in both or the client cannot address the
  # note it just read.
  class Serializer
    # Not `.processed`: generating the variant inline would make the response
    # wait on image processing. The URL is resolved lazily on first fetch.
    PHOTO_VARIANT = { resize_to_limit: [600, 600] }.freeze

    def call(note)
      {
        id: note.id,
        number: note.number,
        text: note.text,
        date: note.date,
        latitude: note.latitude,
        longitude: note.longitude,
        photo_location: photo_location(note),
      }
    end

    # Sorted by `number`, which is allocation order and therefore creation
    # order, with `id` breaking ties: numbers are not unique by any constraint,
    # and a legacy note can have none at all (`to_i` puts those first).
    def call_many(notes)
      notes.sort_by { |note| [note.number.to_i, note.id] }.map { |note| call(note) }
    end

    private

    def photo_location(note)
      return nil unless note.s3_photo.attached?

      url_helpers = Rails.application.routes.url_helpers

      if note.s3_photo.variable?
        url_helpers.rails_representation_url(
          note.s3_photo.variant(**PHOTO_VARIANT),
          host: A9n.host_,
        )
      else
        url_helpers.rails_blob_url(note.s3_photo, host: A9n.host_)
      end
    end
  end
end
