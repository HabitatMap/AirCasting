class Api::Form
  def initialize(json:, schema:, struct:)
    @json = json || "{}"
    @schema = schema
    @struct = struct
    @errors = []
  end

  def invalid?
    errors.any?
  end

  def errors
    validation_errors + @errors
  end

  def to_h
    raise "#to_h should not be called if form is invalid" if invalid?

    @struct.new(validated_params.to_h)
  end

  def add_error(error)
    @errors << error
  end

  private

  def params
    @params ||= ActiveSupport::JSON.decode(@json).symbolize_keys
  rescue JSON::ParserError
    raise Errors::Api::CouldNotParseJsonParams
  end

  def validated_params
    @validated_params ||= @schema.call(params)
  end

  def validation_errors
    validated_params.messages(full: true).values.flatten
  end
end
