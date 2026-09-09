require 'rails_helper'

RSpec.describe Device do
  subject { build(:device) }

  describe 'validations' do
    it { is_expected.to validate_presence_of(:mac_address) }
    it { is_expected.to validate_presence_of(:model) }
    it { is_expected.to validate_uniqueness_of(:mac_address).scoped_to(:user_id).case_insensitive }
  end

  describe 'associations' do
    it { is_expected.to have_many(:sessions) }
    it { is_expected.to belong_to(:user) }
  end

  describe 'mac_address identity' do
    it 'lets two users hold the same mac_address' do
      create(:device, user: create(:user), mac_address: 'AA:BB:CC:DD:EE:FF')
      other = build(:device, user: create(:user), mac_address: 'AA:BB:CC:DD:EE:FF')

      expect(other).to be_valid
    end

    it 'rejects the same mac_address twice for one user' do
      user = create(:user)
      create(:device, user: user, mac_address: 'AA:BB:CC:DD:EE:FF')

      expect(build(:device, user: user, mac_address: 'AA:BB:CC:DD:EE:FF')).not_to be_valid
    end

    it 'normalizes case and surrounding whitespace on write' do
      device = create(:device, mac_address: '  aa:bb:cc:dd:ee:0a ')

      expect(device.mac_address).to eq('AA:BB:CC:DD:EE:0A')
    end

    it 'treats a differently-cased mac_address as the same device for one user' do
      user = create(:user)
      create(:device, user: user, mac_address: 'AA:BB:CC:DD:EE:0A')

      expect(build(:device, user: user, mac_address: 'aa:bb:cc:dd:ee:0a')).not_to be_valid
    end
  end
end
