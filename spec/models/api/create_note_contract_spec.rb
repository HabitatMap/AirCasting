require 'rails_helper'

RSpec.describe Api::CreateNoteContract do
  subject(:contract) { described_class.new }

  def payload(overrides = {})
    {
      text: 'Smells like smoke',
      date: '2026-08-14T10:00:00',
      latitude: 40.0,
      longitude: -74.0,
    }.merge(overrides)
  end

  def photo_base64
    Base64.strict_encode64(File.binread(Rails.root.join('spec/fixtures/test.jpg')))
  end

  it 'accepts a note without a photo' do
    expect(contract.call(payload)).to be_success
  end

  %i[text date latitude longitude].each do |field|
    it "requires #{field}" do
      expect(contract.call(payload.except(field))).to be_failure
    end
  end

  it 'rejects blank text so the client gets a field error, not a raw AR message' do
    expect(contract.call(payload(text: ' '))).to be_failure
  end

  # `number` was client-allocated when notes lived in the session payload, and
  # the two apps disagreed about how. The server owns it now, so anything the
  # client sends is dropped rather than trusted.
  it 'drops a client-supplied number' do
    result = contract.call(payload(number: 99))

    expect(result).to be_success
    expect(result.to_h).not_to have_key(:number)
  end

  it 'drops route and wrapper params' do
    result = contract.call(payload(controller: 'notes', action: 'create', mobile_session_uuid: 'abc'))

    expect(result.to_h.keys).to match_array(%i[text date latitude longitude])
  end

  describe 'date' do
    it 'accepts the local wall clock both apps send' do
      expect(contract.call(payload(date: '2026-08-14T10:00:00'))).to be_success
    end

    it 'accepts an offset form' do
      expect(contract.call(payload(date: '2026-08-14T10:00:00+02:00'))).to be_success
    end

    it 'rejects a date that is not ISO 8601' do
      result = contract.call(payload(date: 'garbage'))

      expect(result).to be_failure
      expect(result.errors.to_h[:date]).to be_present
    end
  end

  describe 'photo' do
    it 'accepts a base64 image' do
      expect(contract.call(payload(photo: photo_base64))).to be_success
    end

    # Both shipping clients wrap their base64 at 76 columns — iOS
    # `.lineLength76Characters` (SessionUploadService.swift:86), Android
    # `Base64.DEFAULT` (extensions.kt:115) — and the legacy server decodes it
    # with the lenient Base64.decode64.
    it 'accepts line-wrapped base64, which is what both clients emit' do
      wrapped = Base64.encode64(File.binread(Rails.root.join('spec/fixtures/test.jpg')))
      expect(wrapped).to include("\n")

      expect(contract.call(payload(photo: wrapped))).to be_success
    end

    it 'rejects a photo that is not base64' do
      result = contract.call(payload(photo: 'not base64 at all!!'))

      expect(result).to be_failure
      expect(result.errors.to_h[:photo]).to be_present
    end

    it 'rejects a photo that decodes to something other than an image' do
      result = contract.call(payload(photo: Base64.strict_encode64('plain text')))

      expect(result).to be_failure
      expect(result.errors.to_h[:photo].first).to include('must be an image')
    end

    it 'rejects a photo over the size cap' do
      oversized = Base64.strict_encode64('x' * (Api::NotePhotoValidation::MAX_PHOTO_BYTES + 1))

      expect(contract.call(payload(photo: oversized))).to be_failure
    end
  end
end
