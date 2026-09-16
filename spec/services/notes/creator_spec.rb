require 'rails_helper'

RSpec.describe Notes::Creator do
  subject(:creator) { described_class.new }

  let(:user) { create(:user) }
  let(:session) { create(:mobile_session, user: user, version: 3) }

  def data(overrides = {})
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

  it 'creates the note and returns it' do
    result = creator.call(session: session, data: data)

    expect(result).to be_success
    expect(result.value[:note]).to eq(session.reload.notes.first)
  end

  it 'bumps the session version so other devices re-download' do
    creator.call(session: session, data: data)

    expect(session.reload.version).to eq(4)
  end

  it 'stores the date as the wall clock the client sent' do
    creator.call(session: session, data: data(date: '2026-08-14T10:00:00'))

    expect(session.reload.notes.first.date.strftime('%Y-%m-%dT%H:%M:%S'))
      .to eq('2026-08-14T10:00:00')
  end

  it 'attaches a photo' do
    creator.call(session: session, data: data(photo: photo_base64))

    expect(session.reload.notes.first.s3_photo).to be_attached
  end

  describe 'number allocation' do
    it 'starts at 0 — the apps are 0-based and the existing data is too' do
      creator.call(session: session, data: data)

      expect(session.reload.notes.first.number).to eq(0)
    end

    it 'carries on from the highest existing number' do
      create(:note, session: session, number: 4)

      creator.call(session: session, data: data)

      expect(session.reload.notes.maximum(:number)).to eq(5)
    end

    # Nothing renumbers after a delete, here or in either app, so gaps are
    # normal. Filling them would hand out a number a client may still be
    # holding for a note it has not synced yet.
    it 'does not fill a hole left by a deletion' do
      create(:note, session: session, number: 0)
      create(:note, session: session, number: 3)

      creator.call(session: session, data: data)

      expect(session.reload.notes.map(&:number).sort).to eq([0, 3, 4])
    end

    # Two 2012 sessions have notes with number NULL. MAX() ignores them, so a
    # session holding nothing but those starts at 0 like an empty one — it must
    # not silently skip 0 just because rows exist.
    it 'starts at 0 when every existing note is a legacy one with no number' do
      legacy = create(:note, session: session, number: 1)
      legacy.update_column(:number, nil)

      creator.call(session: session, data: data)

      expect(session.reload.notes.where.not(number: nil).map(&:number)).to eq([0])
    end

    it 'ignores unnumbered legacy notes when numbers are also present' do
      create(:note, session: session, number: 2)
      create(:note, session: session, number: 1).update_column(:number, nil)

      creator.call(session: session, data: data)

      expect(session.reload.notes.where.not(number: nil).map(&:number).sort).to eq([2, 3])
    end
  end

  it 'returns a validation failure (not a raise) when the model rejects the note' do
    result = creator.call(session: session, data: data(text: ' '))

    expect(result).to be_failure
    expect(result.errors[:error_code]).to eq('validation_error')
    expect(session.reload.version).to eq(3)
  end
end
