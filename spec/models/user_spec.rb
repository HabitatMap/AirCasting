require 'rails_helper'

describe User do
  let(:user) { FactoryBot.create(:user) }
  subject { user }

  describe '#before_save' do
    it 'chomps username attr, so there is no new lines chars at the end' do
      username = "FooBoo\n"
      user =
        User.new(username: username, email: 'foo@boo.biz', password: '12345678')
      expect(user.save).to be(true)
      expect(user.username).to eq(username.chomp)
    end
  end

  describe '#as_json' do
    subject { user.as_json }

    it { is_expected.to include('username' => user.username) }
  end

  describe '#sync' do
    let(:session1) { FactoryBot.create(:mobile_session, user: user) }
    let(:session2) do
      FactoryBot.create(:mobile_session, user: user, notes: [note1, note2])
    end
    let(:session4) do
      FactoryBot.create(:mobile_session, user: user, notes: [note3])
    end
    let(:session5) { FactoryBot.create(:mobile_session, user: user) }
    let(:note1) { FactoryBot.create(:note, number: 1, text: 'Old text') }
    let(:note2) { FactoryBot.create(:note, number: 2, text: 'Old text') }

    let(:note3) { FactoryBot.create(:note, number: 3, text: 'Old text') }

    let(:data) do
      [
        { uuid: session1.uuid, deleted: true },
        {
          uuid: session2.uuid,
          title: 'New title',
          notes: [{ number: 2, text: 'Bye' }, { number: 1, text: 'Hi' }]
        },
        { uuid: 'something' },
        {
          uuid: session4.uuid,
          notes: [note3.attributes.symbolize_keys.merge(text: 'New text')]
        }
      ]
    end

    before { @result = user.sync(data) }

    it 'should tell phone a session it contains has been deleted' do
      expect(@result[:deleted]).to eq([session1.uuid])
      expect(@result[:upload]).not_to include [session1.uuid]
    end

    it 'should delete sessions' do
      expect(Session.exists?(session1.id)).to be(false)
    end

    it 'should update sessions' do
      expect(session2.reload.title).to eq('New title')
    end

    it 'should return a list of session uuids to upload' do
      expect(@result[:upload]).to eq(%w[something])
    end

    it 'should update notes matching numbers' do
      expect(session2.notes.find_by_number(1).text).to eq('Hi')
      expect(session2.notes.find_by_number(2).text).to eq('Bye')
    end

    it 'should replace notes when there are no numbers' do
      expect(session4.reload.notes.size).to eq(1)
      expect(session4.notes.first.text).to eq('New text')
    end
  end

  describe '#sync downloaded sessions' do
    it 'should return a list of session ids to download' do
      session = create_session!(user: user)
      stream = create_stream!(session: session)
      create_measurements!(stream: stream)

      expected = user.sync([{ uuid: [] }])[:download]

      expect(expected).to eq([session.id])
    end

    it "should return a list of session ids to download that doesn't include sessions without sterams" do
      session = create_session!(user: user)

      expected = user.sync([{ uuid: [] }])[:download]

      expect(expected).to eq([])
    end

    it "should return a list of session ids to download that doesn't include sessions with at least one sterams without any measurements" do
      session = create_session!(user: user)
      stream1 = create_stream!(session: session)
      create_measurements!(stream: stream1)
      stream2 = create_stream!(session: session)

      expected = user.sync([{ uuid: [] }])[:download]

      expect(expected).to eq([])
    end
  end
end
