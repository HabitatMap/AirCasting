require 'rails_helper'

RSpec.describe MobileSessions::Updater do
  subject(:updater) { described_class.new }

  let(:user) { create(:user) }
  let(:session) { create(:mobile_session, user: user, title: 'Old title', tag_list: 'a, b', version: 3) }

  it 'renames the title and bumps the version' do
    result = updater.call(session: session, data: { title: 'New title' })

    expect(result).to be_success
    session.reload
    expect(session.title).to eq('New title')
    expect(session.version).to eq(4)
  end

  it 'is partial — omitting a field leaves it unchanged' do
    updater.call(session: session, data: { title: 'Renamed' })
    expect(session.reload.tag_list).to match_array(%w[a b])
  end

  it 'updates tag_list' do
    updater.call(session: session, data: { tag_list: 'x, y, z' })
    expect(session.reload.tag_list).to match_array(%w[x y z])
  end

  it 'clears every tag when tag_list is null' do
    updater.call(session: session, data: { tag_list: nil })
    expect(session.reload.tag_list).to be_empty
  end

  it 'starts version at 1 when it was nil' do
    session.update_column(:version, nil)
    updater.call(session: session, data: { title: 'x' })
    expect(session.reload.version).to eq(1)
  end

  # Notes are their own resource now, so nothing this endpoint does may touch
  # them — not even to reconcile a stale array a client still sends.
  it 'leaves notes alone' do
    note = create(:note, session: session, number: 0, text: 'untouched')

    updater.call(session: session, data: { title: 'Renamed' })

    expect(note.reload.text).to eq('untouched')
    expect(session.reload.notes.count).to eq(1)
  end

  describe 'version churn' do
    it 'does not bump the version when the payload changes nothing' do
      updater.call(session: session, data: { title: 'Old title' })
      expect(session.reload.version).to eq(3)
    end

    it 'does not bump the version when the tags are the same set in another order' do
      updater.call(session: session, data: { tag_list: 'b a' })
      expect(session.reload.version).to eq(3)
    end
  end
end
