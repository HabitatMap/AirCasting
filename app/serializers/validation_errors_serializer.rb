# Builds the `fields` half of a v3 error body.
#
# Every leaf is an object, never a bare string:
#
#   { sensor_name: [{ code: 'blank', message: 'must be filled' }] }
#
# `code` is what a client switches on to pick its own translated sentence;
# `message` is English prose it should only fall back to. `params` carries the
# values interpolated into that prose, so the client can rebuild the sentence
# in its own language rather than parse ours.
#
# Takes any of three inputs and answers the same shape for all of them:
#
# - a dry-validation message set — rich, the failing predicate still attached;
# - an `ActiveModel::Errors` — also rich, carrying its own type symbol and the
#   values interpolated into the message;
# - a hash that has already been through `to_h` upstream, which has lost both
#   and so degrades to `invalid` codes.
#
# The two rich inputs are the same bug twice over: `Dry::Schema#to_h` drops the
# predicate and `ActiveModel::Errors#to_hash` drops the type, and both leave a
# client holding English prose it cannot switch on. Callers pass the error
# object itself so neither is thrown away before it gets here.
class ValidationErrorsSerializer
  # dry-schema's predicate names are an implementation detail. These codes are
  # the published contract, so they are mapped deliberately rather than derived
  # from the predicate — renaming one here must be a conscious API change.
  CODE_BY_PREDICATE = {
    key?: 'missing',
    filled?: 'blank',
    str?: 'not_a_string',
    int?: 'not_an_integer',
    float?: 'not_a_float',
    bool?: 'not_a_boolean',
    time?: 'not_a_time',
    date?: 'not_a_date',
    date_time?: 'not_a_date_time',
    array?: 'not_an_array',
    hash?: 'not_a_hash',
    gteq?: 'too_small',
    gt?: 'too_small',
    lteq?: 'too_large',
    lt?: 'too_large',
    included_in?: 'not_included',
    format?: 'invalid_format',
    size?: 'wrong_size',
    min_size?: 'too_short',
    max_size?: 'too_long',
  }.freeze

  # What each predicate interpolates into its message, under a name that means
  # something without knowing dry-schema. `gteq?` carries its bound in
  # `args.first`, so `must be greater than or equal to 1` becomes
  # `{ code: 'too_small', params: { min: 1 } }`.
  PARAM_BY_PREDICATE = {
    gteq?: :min,
    gt?: :min,
    min_size?: :min,
    lteq?: :max,
    lt?: :max,
    max_size?: :max,
    included_in?: :allowed,
    size?: :size,
    format?: :format,
  }.freeze

  # ActiveModel's type symbols, mapped onto the same published vocabulary the
  # predicates use — a too-short value is `too_short` whichever library caught
  # it, so a client needs one branch, not one per backend.
  #
  # `:invalid` stays generic on purpose. ActiveModel uses it both for a value
  # that failed a format (an unparseable email) and, by convention, for one
  # that was simply wrong — `UpdateUserAccount` adds it to `current_password`
  # to mean "that is not your password". Mapping it to `invalid_format` would
  # be a lie half the time, so the client falls back to `message` and the
  # services that want better say so with a type of their own.
  CODE_BY_ACTIVE_MODEL_TYPE = {
    blank: 'blank',
    empty: 'empty',
    present: 'must_be_blank',
    taken: 'taken',
    confirmation: 'confirmation_mismatch',
    accepted: 'not_accepted',
    too_short: 'too_short',
    too_long: 'too_long',
    wrong_length: 'wrong_size',
    not_a_number: 'not_a_number',
    not_an_integer: 'not_an_integer',
    greater_than: 'too_small',
    greater_than_or_equal_to: 'too_small',
    less_than: 'too_large',
    less_than_or_equal_to: 'too_large',
    equal_to: 'wrong_value',
    other_than: 'wrong_value',
    inclusion: 'not_included',
    exclusion: 'reserved',
    invalid: 'invalid',
  }.freeze

  # Which option each type interpolates, under the same name the predicate
  # path uses: `{ min: 8 }`, never `{ count: 8 }`.
  #
  # A whitelist rather than a filter, and that is a security property, not
  # tidiness: `options` also carries `:value` — the input that was rejected.
  # Passing the hash through would echo a rejected password back in the
  # response body the first time anyone puts a `format:` validator on one.
  #
  # `:inclusion` has no entry because ActiveModel deletes `:in` from the
  # options before adding the error, so the allowed set is not available here.
  PARAM_BY_ACTIVE_MODEL_TYPE = {
    too_short: { min: :count },
    too_long: { max: :count },
    wrong_length: { size: :count },
    greater_than: { min: :count },
    greater_than_or_equal_to: { min: :count },
    less_than: { max: :count },
    less_than_or_equal_to: { max: :count },
    equal_to: { expected: :count },
    other_than: { rejected: :count },
  }.freeze

  # A rule that wrote prose but no code yet. Not a failure state: a client
  # switching on `code` falls through to `message`, which is exactly what it
  # has to do today. Lets the 40 `key.failure` sites convert one at a time
  # instead of in one unreviewable change.
  UNSPECIFIED_CODE = 'invalid'.freeze

  def self.call(errors)
    new(errors).call
  end

  def initialize(errors)
    @errors = errors
  end

  def call
    return from_active_model if errors.is_a?(ActiveModel::Errors)
    return from_messages if message_set?

    from_hash(coerced_hash)
  end

  private

  attr_reader :errors

  # Duck-typed rather than `is_a?(Dry::Validation::MessageSet)` so a bare
  # dry-schema result works too. An empty set has no first message and falls
  # through to the hash path, which renders it as `{}`.
  def message_set?
    return false if errors.is_a?(Hash) || errors.is_a?(String)
    return false unless errors.respond_to?(:each)

    errors.first.respond_to?(:path)
  end

  def from_messages
    errors.each_with_object({}) do |message, acc|
      *parents, leaf = message.path
      bucket = descend(acc, parents)
      (bucket[leaf] ||= []) << entry_for(message)
    end
  end

  # Rebuilds nesting from the message path: `[:streams, 0, :sensor_name]`
  # becomes `{ streams: { 0 => { sensor_name: [...] } } }`. Integer keys render
  # as JSON object keys (`"0"`), which is the shape v3 already returns.
  #
  # The `is_a?(Hash)` guard covers one field carrying both its own error and a
  # nested one. dry-validation does not currently produce that — a failed
  # `array?` stops the member schema running — but the guard keeps a future
  # contract from raising here.
  def descend(acc, parents)
    parents.reduce(acc) do |node, key|
      node[key] = {} unless node[key].is_a?(Hash)
      node[key]
    end
  end

  def entry_for(message)
    entry = { code: code_for(message), message: message.text }
    params = params_for(message)
    entry[:params] = params if params.present?
    entry
  end

  # A rule's own `code:` wins over anything inferred: it was chosen for this
  # specific failure, where the predicate is only ever a generic shape error.
  def code_for(message)
    explicit = meta_for(message)[:code]
    return explicit.to_s if explicit.present?

    predicate = predicate_for(message)
    return UNSPECIFIED_CODE if predicate.nil?

    CODE_BY_PREDICATE.fetch(predicate) { predicate.to_s.delete_suffix('?') }
  end

  def params_for(message)
    explicit = meta_for(message)[:params]
    return explicit if explicit.present?

    name = PARAM_BY_PREDICATE[predicate_for(message)]
    return nil if name.nil?

    args = message.respond_to?(:args) ? message.args : nil
    return nil if args.blank?

    { name => args.first }
  end

  # `Dry::Validation::Message` answers both of these — with `nil` and `{}` —
  # so the `respond_to?` guards are for anything else that reaches here.
  def predicate_for(message)
    message.respond_to?(:predicate) ? message.predicate : nil
  end

  def meta_for(message)
    (message.respond_to?(:meta) ? message.meta : nil) || {}
  end

  # Flat, because ActiveModel attributes are flat. A nested resource reports as
  # the single attribute `:"streams.sensor_name"`, and splitting that into a
  # tree would invent nesting the model itself does not claim.
  def from_active_model
    errors.each_with_object({}) do |error, acc|
      (acc[error.attribute] ||= []) << active_model_entry_for(error)
    end
  end

  def active_model_entry_for(error)
    entry = { code: active_model_code_for(error), message: error.message }
    params = active_model_params_for(error)
    entry[:params] = params if params.present?
    entry
  end

  # `errors.add(:base, 'No attributes given')` makes the sentence itself the
  # type. Only a symbol was ever chosen as a code, so anything else falls back
  # rather than publishing a whole sentence as one.
  def active_model_code_for(error)
    type = error.type
    return UNSPECIFIED_CODE unless type.is_a?(Symbol)

    CODE_BY_ACTIVE_MODEL_TYPE.fetch(type) { type.to_s }
  end

  def active_model_params_for(error)
    mapping = PARAM_BY_ACTIVE_MODEL_TYPE[error.type]
    return nil if mapping.nil?

    options = error.options || {}
    mapping.each_with_object({}) do |(name, option), acc|
      value = options[option]
      acc[name] = value unless value.nil?
    end
  end

  def coerced_hash
    case errors
    when Hash then errors
    when String, Symbol then { base: [errors.to_s] }
    when Array then { base: errors }
    else errors.respond_to?(:to_h) ? errors.to_h : { base: [errors.to_s] }
    end
  end

  def from_hash(hash)
    hash.each_with_object({}) do |(key, value), acc|
      acc[key] =
        case value
        when Hash then from_hash(value)
        when Array then value.map { |element| leaf_for(element) }
        else [leaf_for(value)]
        end
    end
  end

  # A hash element means the failure already carried a code and went through
  # `to_h` on the way here — dry-validation writes the prose under `text`.
  def leaf_for(value)
    return { code: UNSPECIFIED_CODE, message: value.to_s } unless value.is_a?(Hash)

    attributes = value.symbolize_keys
    entry = {
      code: attributes[:code].presence&.to_s || UNSPECIFIED_CODE,
      message: (attributes[:text] || attributes[:message]).to_s,
    }
    entry[:params] = attributes[:params] if attributes[:params].present?
    entry
  end
end
