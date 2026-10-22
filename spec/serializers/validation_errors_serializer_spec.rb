require 'rails_helper'

describe ValidationErrorsSerializer do
  subject(:serialize) { described_class.call(errors) }

  # Real contracts, not doubles: the point of this class is that it survives
  # what dry-validation actually emits, and a double would pin our guess at
  # that rather than the thing itself.
  describe 'a dry-validation message set' do
    let(:contract) do
      Class.new(Dry::Validation::Contract) do
        params do
          required(:sensor_name).filled(:string)
          optional(:page).value(:integer, gteq?: 1)
          optional(:order).value(included_in?: %w[asc desc])
          optional(:start_time).filled(:integer)
          optional(:end_time).filled(:integer)
        end

        rule(:end_time, :start_time) do
          next unless values[:start_time] && values[:end_time]

          if values[:end_time] <= values[:start_time]
            key(:end_time).failure(
              text: 'must be greater than start_time',
              code: 'greater_than',
              params: { other: 'start_time' },
            )
          end
        end

        rule(:sensor_name) do
          key.failure('is not a supported sensor') if value == 'nope'
        end
      end.new
    end

    def serialized(input)
      described_class.call(contract.call(input).errors)
    end

    it 'codes a missing key' do
      expect(serialized({})).to eq(
        sensor_name: [{ code: 'missing', message: 'is missing' }],
      )
    end

    it 'codes an empty value' do
      expect(serialized(sensor_name: '')).to eq(
        sensor_name: [{ code: 'blank', message: 'must be filled' }],
      )
    end

    it 'codes a type mismatch' do
      expect(serialized(sensor_name: 'AirBeam-PM2.5', start_time: 'soon')).to eq(
        start_time: [{ code: 'not_an_integer', message: 'must be an integer' }],
      )
    end

    # The bound is the whole point: a client cannot translate "must be greater
    # than or equal to 1" without knowing the 1.
    it 'carries a numeric bound as params' do
      expect(serialized(sensor_name: 'AirBeam-PM2.5', page: 0)).to eq(
        page: [
          {
            code: 'too_small',
            message: 'must be greater than or equal to 1',
            params: { min: 1 },
          },
        ],
      )
    end

    it 'carries an allowed-values list as params' do
      expect(serialized(sensor_name: 'AirBeam-PM2.5', order: 'sideways')).to eq(
        order: [
          {
            code: 'not_included',
            message: 'must be one of: asc, desc',
            params: { allowed: %w[asc desc] },
          },
        ],
      )
    end

    it "takes a rule's own code and params over anything inferred" do
      expect(
        serialized(sensor_name: 'AirBeam-PM2.5', start_time: 2_000, end_time: 1_000),
      ).to eq(
        end_time: [
          {
            code: 'greater_than',
            message: 'must be greater than start_time',
            params: { other: 'start_time' },
          },
        ],
      )
    end

    # The state every unconverted `key.failure` site is in. It has to produce
    # the same shape as a converted one, or the migration is a breaking change
    # on every contract it has not reached yet.
    it 'falls back to invalid for a rule that carries only prose' do
      expect(serialized(sensor_name: 'nope')).to eq(
        sensor_name: [{ code: 'invalid', message: 'is not a supported sensor' }],
      )
    end

    it 'keeps every failure on a field' do
      result = serialized(sensor_name: '', page: 0)

      expect(result.keys).to contain_exactly(:sensor_name, :page)
    end

    it 'is empty when nothing failed' do
      expect(serialized(sensor_name: 'AirBeam-PM2.5')).to eq({})
    end
  end

  describe 'nested failures' do
    let(:contract) do
      Class.new(Dry::Validation::Contract) do
        params do
          required(:streams).array(:hash) do
            required(:sensor_name).filled(:string)
            required(:unit_symbol).filled(:string)
          end
        end
      end.new
    end

    # Integer path segments render as JSON object keys ("0"), which is the
    # shape v3 already returns for a bad stream in a session payload.
    it 'rebuilds the path into nested objects' do
      errors = contract.call(streams: [{ sensor_name: 'ok', unit_symbol: 'µg/m³' }, { sensor_name: '' }]).errors

      expect(described_class.call(errors)).to eq(
        streams: {
          1 => {
            sensor_name: [{ code: 'blank', message: 'must be filled' }],
            unit_symbol: [{ code: 'missing', message: 'is missing' }],
          },
        },
      )
    end

    it 'survives the round trip through JSON' do
      errors = contract.call(streams: [{ sensor_name: '' }]).errors

      expect(JSON.parse(described_class.call(errors).to_json)).to eq(
        'streams' => {
          '0' => {
            'sensor_name' => [{ 'code' => 'blank', 'message' => 'must be filled' }],
            'unit_symbol' => [{ 'code' => 'missing', 'message' => 'is missing' }],
          },
        },
      )
    end
  end

  # Several services call `contract.errors.to_h` before handing the result to
  # `Failure.new`, which throws the predicate away upstream of us. The shape
  # still has to come out uniform.
  describe 'a hash that has already lost its predicates' do
    let(:errors) { { sensor_name: ['must be filled'], page: ['must be an integer'] } }

    it 'wraps each string as an entry with no code' do
      expect(serialize).to eq(
        sensor_name: [{ code: 'invalid', message: 'must be filled' }],
        page: [{ code: 'invalid', message: 'must be an integer' }],
      )
    end

    it 'recurses into nested hashes' do
      expect(described_class.call(streams: { 0 => { sensor_name: ['must be filled'] } })).to eq(
        streams: { 0 => { sensor_name: [{ code: 'invalid', message: 'must be filled' }] } },
      )
    end

    # `to_h` on an already-converted rule yields `text`, not `message`.
    it 'normalises an entry that kept its code through to_h' do
      input = { end_time: [{ text: 'must be greater', code: 'greater_than', params: { other: 'start_time' } }] }

      expect(described_class.call(input)).to eq(
        end_time: [
          { code: 'greater_than', message: 'must be greater', params: { other: 'start_time' } },
        ],
      )
    end
  end

  describe 'input that is not a validation result at all' do
    it 'puts a bare string under base' do
      expect(described_class.call('session not found')).to eq(
        base: [{ code: 'invalid', message: 'session not found' }],
      )
    end

    it 'puts a bare array under base' do
      expect(described_class.call(['something went wrong'])).to eq(
        base: [{ code: 'invalid', message: 'something went wrong' }],
      )
    end

    it 'renders an empty hash as an empty hash' do
      expect(described_class.call({})).to eq({})
    end
  end
end
