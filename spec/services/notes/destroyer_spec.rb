require 'rails_helper'

RSpec.describe Notes::Destroyer do
  include ActiveJob::TestHelper

  around do |example|
    previous = ActiveJob::Base.queue_adapter
    ActiveJob::Base.queue_adapter = :test
    example.run
    ActiveJob::Base.queue_adapter = previous
  end

  subject(:destroyer) { described_class.new }

  let(:user) { create(:user) }
  let(:session) { create(:mobile_session, user: user, version: 3) }

  it 'deletes the note and bumps the session version' do
    note = create(:note, session: session, number: 0)

    result = destroyer.call(session: session, note: note)

    expect(result).to be_success
    expect(Note.where(id: note.id)).to be_empty
    expect(session.reload.version).to eq(4)
  end

  # Nothing assumes note numbers are contiguous, and `number` is still the key
  # the legacy v1 sync path matches on (Session#sync) — renumbering would
  # rewrite it underneath a client that had not synced yet.
  it 'leaves a hole rather than renumbering' do
    create(:note, session: session, number: 0)
    middle = create(:note, session: session, number: 1)
    create(:note, session: session, number: 2)

    destroyer.call(session: session, note: middle)

    expect(session.reload.notes.map(&:number).sort).to eq([0, 2])
  end

  # destroy, not delete_all: the has_one_attached dependent callback is what
  # purges the blob and the S3 object.
  it 'purges the attached photo' do
    note = create(:note, :with_photo, session: session, number: 0)
    blob = note.s3_photo.blob

    perform_enqueued_jobs do
      destroyer.call(session: session, note: note)
    end

    expect(ActiveStorage::Blob.exists?(blob.id)).to be(false)
  end
end
