require 'rails_helper'

describe TokenGenerator do
  describe '#generate' do
    it 'should generate token of given length' do
      [1, 3, 5, 7].each { |n| expect(subject.generate(n).size).to eq(n) }
    end
  end

  describe '#generate_unique' do
    let(:gen) { TokenGenerator.new }
    let(:length) { 5 }
    let(:uniq_verifier) { double }

    subject { gen.generate_unique(length) { uniq_verifier.verify } }

    before do
      expect(uniq_verifier).to receive(:verify).and_return(false, false, true)
    end

    describe '#size' do
      subject { super().size }
      it { is_expected.to eq(length + 2) }
    end
  end
end
