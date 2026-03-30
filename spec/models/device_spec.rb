require 'rails_helper'

RSpec.describe Device do
  subject { build(:device) }

  describe 'validations' do
    it { is_expected.to validate_presence_of(:mac_address) }
    it { is_expected.to validate_presence_of(:model) }
    it { is_expected.to validate_uniqueness_of(:mac_address) }
  end

  describe 'associations' do
    it { is_expected.to have_many(:sessions) }
  end
end
