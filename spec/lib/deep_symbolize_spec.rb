require './lib/aircasting/deep_symbolize'
require 'active_support/core_ext'

include AirCasting

describe DeepSymbolize do
  describe '.deep_symbolize' do
    let(:data) do
      {
        'some' => 'data',
        'nested' => {
          'nested_key' => 'nested_val',
          'nested_hash' => {
            'deep_key' => 'deep_value'
          },
          'array' => [{ 'key' => 'val' }]
        }
      }
    end

    subject { Object.new.extend(DeepSymbolize).deep_symbolize(data) }

    it 'should symbolize keys' do
      expect(subject).to include(some: 'data')
    end

    it 'should symbolize keys in nested hashes' do
      expect(subject[:nested]).to include(nested_key: 'nested_val')
    end

    it 'should symbolize keys in deeply nested hashes' do
      expect(subject[:nested][:nested_hash]).to include(deep_key: 'deep_value')
    end

    it 'should symbolize arrays' do
      expect(subject[:nested][:array]).to include(key: 'val')
    end
  end
end
