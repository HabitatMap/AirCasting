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
end
