require 'rails_helper'

RSpec.describe Notes::Updater do
  # The app runs ActiveJob on the :async adapter, which hands jobs to a thread
  # pool — useless for asserting on them. Swap in the test adapter so
  # perform_enqueued_jobs runs the blob purge inline.
  include ActiveJob::TestHelper

  around do |example|
    previous = ActiveJob::Base.queue_adapter
    ActiveJob::Base.queue_adapter = :test
    example.run
    ActiveJob::Base.queue_adapter = previous
  end

  subject(:updater) { described_class.new }

  let(:user) { create(:user) }
  let(:session) { create(:mobile_session, user: user, version: 3) }
  let(:note) { create(:note, session: session, number: 0, text: 'original') }

  def photo_base64
    Base64.strict_encode64(File.binread(Rails.root.join('spec/fixtures/test.jpg')))
  end

  # purge_later enqueues ActiveStorage::PurgeJob the moment it is called, with
  # no regard for the open transaction, so a rollback used to leave the note
  # attached to a blob already queued for deletion. Removal goes through the
  # `dependent: :destroy` has_one instead, whose purge is after_destroy_commit.
  it 'does not queue the photo purge when the transaction rolls back' do
    note.s3_photo.attach(
      io: StringIO.new(File.binread(Rails.root.join('spec/fixtures/test.jpg'))),
      filename: 'photo.jpg',
      content_type: 'image/jpeg',
    )
    allow(session).to receive(:save!).and_raise(ActiveRecord::StatementInvalid, 'boom')

    expect {
      expect { updater.call(session: session, note: note, data: { photo: nil }) }
        .to raise_error(ActiveRecord::StatementInvalid)
    }.not_to have_enqueued_job(ActiveStorage::PurgeJob)

    expect(note.reload.s3_photo).to be_attached
  end

  it 'edits the text and bumps the session version' do
    updater.call(session: session, note: note, data: { text: 'edited' })

    expect(note.reload.text).to eq('edited')
    expect(session.reload.version).to eq(4)
  end

  it 'does not bump the version when the text is unchanged' do
    updater.call(session: session, note: note, data: { text: 'original' })

    expect(session.reload.version).to eq(3)
  end

  it 'leaves the text alone when only a photo is sent' do
    updater.call(session: session, note: note, data: { photo: photo_base64 })

    expect(note.reload.text).to eq('original')
    expect(note.s3_photo).to be_attached
  end

  describe 'photos' do
    let(:note) { create(:note, :with_photo, session: session, number: 0, text: 'original') }

    it 'keeps the existing photo when the key is absent' do
      blob_id = note.s3_photo.blob.id

      updater.call(session: session, note: note, data: { text: 'edited' })

      expect(note.reload.s3_photo.blob.id).to eq(blob_id)
    end

    it 'replaces the photo' do
      original = note.s3_photo.blob.id

      updater.call(session: session, note: note, data: { photo: photo_base64 })

      expect(note.reload.s3_photo.blob.id).not_to eq(original)
    end

    it 'removes the photo when it is explicitly null' do
      updater.call(session: session, note: note, data: { photo: nil })

      expect(note.reload.s3_photo).not_to be_attached
    end

    # Detaching alone would leave the blob row and the S3 object behind forever:
    # nothing in this app collects unattached blobs.
    it 'enqueues the blob for deletion, not just detachment' do
      blob = note.s3_photo.blob

      perform_enqueued_jobs do
        updater.call(session: session, note: note, data: { photo: nil })
      end

      expect(ActiveStorage::Blob.exists?(blob.id)).to be(false)
    end

    it 'bumps the version when only the photo changed' do
      updater.call(session: session, note: note, data: { photo: photo_base64 })

      expect(session.reload.version).to eq(4)
    end

    it 'does not bump the version when a removal removes nothing' do
      note.s3_photo.purge

      updater.call(session: session, note: note, data: { photo: nil })

      expect(session.reload.version).to eq(3)
    end
  end

  it 'attaches a line-wrapped base64 photo, which is what both clients emit' do
    wrapped = Base64.encode64(File.binread(Rails.root.join('spec/fixtures/test.jpg')))

    updater.call(session: session, note: note, data: { photo: wrapped })

    expect(note.reload.s3_photo.blob.byte_size)
      .to eq(File.size(Rails.root.join('spec/fixtures/test.jpg')))
  end

  it 'gives the blob a real extension even for a type Rails has no symbol for' do
    heic = "\x00\x00\x00\x18ftypheic\x00\x00\x00\x00mif1heic".b + ("\x00" * 64)

    updater.call(session: session, note: note, data: { photo: Base64.strict_encode64(heic) })

    expect(note.reload.s3_photo.filename.to_s).to end_with('.heic')
  end

  it 'returns a validation failure (not a raise) when the model rejects the note' do
    result = updater.call(session: session, note: note, data: { text: ' ' })

    expect(result).to be_failure
    expect(result.errors[:error_code]).to eq('validation_error')
    expect(session.reload.version).to eq(3)
  end
end
