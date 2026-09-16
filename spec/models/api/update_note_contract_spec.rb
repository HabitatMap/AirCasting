require 'rails_helper'

RSpec.describe Api::UpdateNoteContract do
  subject(:contract) { described_class.new }

  def photo_base64
    Base64.strict_encode64(File.binread(Rails.root.join('spec/fixtures/test.jpg')))
  end

  it 'rejects an empty payload — a no-op PATCH would bump the session version for nothing' do
    result = contract.call({})

    expect(result).to be_failure
    expect(result.errors.to_h[nil] || result.errors.to_h[:base]).to be_present
  end

  it 'accepts a text-only edit' do
    result = contract.call(text: 'edited')

    expect(result).to be_success
    expect(result.to_h).to eq(text: 'edited')
  end

  it 'accepts a photo-only edit' do
    expect(contract.call(photo: photo_base64)).to be_success
  end

  # The distinction the whole three-way photo contract rests on: an absent key
  # is "leave it alone", an explicit null is "remove it".
  it 'keeps an explicit null photo in to_h, distinct from an absent key' do
    result = contract.call(photo: nil)

    expect(result).to be_success
    expect(result.to_h).to have_key(:photo)
    expect(result.to_h[:photo]).to be_nil
  end

  it 'rejects blank text' do
    expect(contract.call(text: ' ')).to be_failure
  end

  # `date`, `latitude` and `longitude` describe where the recording was when the
  # note was taken, so letting them move would make the note lie. Neither app
  # edits them either.
  it 'drops date, latitude, longitude and number — not editable' do
    result = contract.call(
      text: 'edited',
      date: '2026-08-14T10:00:00',
      latitude: 1.0,
      longitude: 2.0,
      number: 7,
    )

    expect(result).to be_success
    expect(result.to_h.keys).to eq([:text])
  end

  it 'drops route and wrapper params' do
    result = contract.call(text: 'edited', controller: 'notes', action: 'update', id: '5')

    expect(result.to_h.keys).to eq([:text])
  end

  describe 'photo' do
    it 'accepts line-wrapped base64, which is what both clients emit' do
      wrapped = Base64.encode64(File.binread(Rails.root.join('spec/fixtures/test.jpg')))

      expect(contract.call(photo: wrapped)).to be_success
    end

    it 'rejects a photo that is not base64' do
      result = contract.call(photo: 'not base64 at all!!')

      expect(result).to be_failure
      expect(result.errors.to_h[:photo]).to be_present
    end

    it 'rejects a photo that decodes to something other than an image' do
      result = contract.call(photo: Base64.strict_encode64('plain text'))

      expect(result).to be_failure
      expect(result.errors.to_h[:photo].first).to include('must be an image')
    end

    it 'rejects a photo over the size cap' do
      oversized = Base64.strict_encode64('x' * (Api::NotePhotoValidation::MAX_PHOTO_BYTES + 1))

      expect(contract.call(photo: oversized)).to be_failure
    end
  end
end
