class NoteSerializer
  include Rails.application.routes.url_helpers

  def call(note:)
    {
      id: note.id,
      text: note.text,
      date: note.date,
      latitude: note.latitude,
      longitude: note.longitude,
      photo: photo_url(note),
      photo_thumbnail: photo_thumbnail_url(note),
      photo_location: photo_location(note),
      number: note.number,
    }
  end

  private

  def photo_url(note)
    return unless note.s3_photo.attached?

    rails_blob_url(note.s3_photo, only_path: true)
  end

  def photo_thumbnail_url(note)
    return unless note.s3_photo.attached?

    rails_representation_url(
      note.s3_photo.variant(resize_to_limit: [100, 100]).processed,
      only_path: true,
    )
  end

  def photo_location(note)
    return unless note.s3_photo.attached?

    rails_representation_url(
      note.s3_photo.variant(resize_to_limit: [600, 600]).processed,
      host: A9n.host_,
    )
  end
end
