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

  # A real ActiveModel class for the same reason the contracts above are real:
  # the option keys and type symbols are the thing under test, and a double
  # would only assert our memory of them.
  describe 'an ActiveModel::Errors' do
    let(:model_class) do
      Class.new do
        include ActiveModel::Model

        attr_accessor :username, :email, :password, :password_confirmation, :age, :role

        def self.name = 'Account'

        validates :username, presence: true
        validates :password, length: { minimum: 8 }, confirmation: true, allow_nil: true
        validates :email, format: { with: /@/ }, allow_nil: true
        validates :age, numericality: { greater_than_or_equal_to: 18 }, allow_nil: true
        validates :role, inclusion: { in: %w[admin user] }, allow_nil: true
      end
    end

    def serialized(attributes)
      model = model_class.new(**attributes)
      model.valid?
      described_class.call(model.errors)
    end

    it 'names a missing value blank' do
      expect(serialized({})[:username])
        .to eq([{ code: 'blank', message: "can't be blank" }])
    end

    it 'carries the bound of a length failure as min' do
      expect(serialized(username: 'a', password: 'short')[:password])
        .to include(code: 'too_short',
                    message: 'is too short (minimum is 8 characters)',
                    params: { min: 8 })
    end

    it 'maps a numeric bound onto the same code a predicate would give' do
      expect(serialized(username: 'a', age: 5)[:age])
        .to eq([{ code: 'too_small',
                  message: 'must be greater than or equal to 18',
                  params: { min: 18 } }])
    end

    it 'names a mismatched confirmation' do
      errors = serialized(
        username: 'a',
        password: 'long-enough',
        password_confirmation: 'something-else',
      )

      expect(errors[:password_confirmation])
        .to eq([{ code: 'confirmation_mismatch', message: "doesn't match Password" }])
    end

    it 'leaves a format failure generic, because ActiveModel does' do
      expect(serialized(username: 'a', email: 'nope')[:email])
        .to eq([{ code: 'invalid', message: 'is invalid' }])
    end

    # ActiveModel drops `:in` from the options before adding the error, so
    # there is no allowed set to publish — only the code.
    it 'names an inclusion failure without inventing an allowed list' do
      expect(serialized(username: 'a', role: 'nope')[:role])
        .to eq([{ code: 'not_included', message: 'is not included in the list' }])
    end

    it 'maps a type added by hand' do
      model = model_class.new(username: 'a')
      model.errors.add(:email, :taken)

      expect(described_class.call(model.errors)[:email])
        .to eq([{ code: 'taken', message: 'has already been taken' }])
    end

    # `errors.add(:base, 'a sentence')` makes the sentence the type. Publishing
    # that as a code would be worse than having none.
    it 'does not publish a literal message as a code' do
      model = model_class.new(username: 'a')
      model.errors.add(:base, 'No attributes given to update')

      expect(described_class.call(model.errors)[:base])
        .to eq([{ code: 'invalid', message: 'No attributes given to update' }])
    end

    it 'keeps every failure on one attribute' do
      model = model_class.new(username: 'a', password: 'short')
      model.valid?
      model.errors.add(:password, :taken)

      expect(described_class.call(model.errors)[:password].map { |e| e[:code] })
        .to eq(%w[too_short taken])
    end

    # `options` also carries `:value` — the input that was rejected. Echoing
    # it back would publish a rejected password the first time anyone puts a
    # format validator on one.
    it 'never echoes the rejected value back' do
      serialized(username: 'a', email: 'nope', age: 5).each_value do |entries|
        entries.each do |entry|
          expect(entry).not_to have_key(:value)
          expect(entry.fetch(:params, {})).not_to have_key(:value)
        end
      end
    end

    it 'survives a JSON round trip with the keys a client reads' do
      body = JSON.parse(serialized(username: 'a', password: 'short').to_json)

      expect(body.dig('password', 0))
        .to eq('code' => 'too_short',
               'message' => 'is too short (minimum is 8 characters)',
               'params' => { 'min' => 8 })
    end

    it 'renders a model with no errors as an empty hash' do
      model = model_class.new(username: 'a')
      model.valid?

      expect(described_class.call(model.errors)).to eq({})
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
