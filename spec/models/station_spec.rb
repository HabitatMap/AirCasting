require 'rails_helper'

describe Station do
  describe 'excluded_reason' do
    it 'is valid without a reason' do
      expect(build(:station, excluded_reason: nil)).to be_valid
    end

    it 'accepts every listed reason' do
      described_class::EXCLUDED_REASONS.each_value do |reason|
        expect(build(:station, excluded_reason: reason)).to be_valid
      end
    end

    it 'rejects a reason that is not listed' do
      station = build(:station, excluded_reason: 'mobile')

      expect(station).not_to be_valid
      expect(station.errors[:excluded_reason]).to be_present
    end
  end

  describe '.shown' do
    it 'returns only stations without an excluded reason' do
      shown = create(:station)
      create(:station, excluded_reason: described_class::EXCLUDED_REASONS[:temporary])

      expect(described_class.shown).to contain_exactly(shown)
    end
  end
end
