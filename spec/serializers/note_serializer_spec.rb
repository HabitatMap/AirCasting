require 'rails_helper'

RSpec.describe NoteSerializer, type: :serializer do
  subject { described_class.new }

  describe '#call' do
    context 'when the note has a photo attached' do
      it 'serializes the note' do
        note = create(:note, :with_photo)
        expected_photo_url =
          Rails.application.routes.url_helpers.rails_blob_url(
            note.s3_photo,
            only_path: true,
          )
        expected_photo_thumbnail_url =
          Rails.application.routes.url_helpers.rails_representation_url(
            note.s3_photo.variant(resize_to_limit: [100, 100]).processed,
            only_path: true,
          )
        expected_photo_location_url =
          Rails.application.routes.url_helpers.rails_representation_url(
            note.s3_photo.variant(resize_to_limit: [600, 600]).processed,
            host: A9n.host_,
          )

        result = subject.call(note: note)

        expect(result).to include(
          id: note.id,
          text: note.text,
          date: note.date,
          latitude: note.latitude,
          longitude: note.longitude,
          number: note.number,
          photo: expected_photo_url,
          photo_thumbnail: expected_photo_thumbnail_url,
          photo_location: expected_photo_location_url,
        )
      end
    end

    context 'when the note does not have a photo attached' do
      it 'serializes the note' do
        note = create(:note)

        result = subject.call(note: note)

        expect(result).to include(
          id: note.id,
          text: note.text,
          date: note.date,
          latitude: note.latitude,
          longitude: note.longitude,
          number: note.number,
          photo: nil,
          photo_thumbnail: nil,
          photo_location: nil,
        )
      end
    end
  end
end
