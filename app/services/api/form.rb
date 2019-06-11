class Api::Form
  def initialize(schema:, struct:)
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
    raise '#to_h should not be called if form is invalid' if invalid?

    @struct.new(validated_params.to_h)
  end

  def add_error(error)
    @errors << error
  end

  private

  def parsed_params
    raise NotImplementedError
  end

  def validated_params
    @validated_params ||= @schema.call(parsed_params)
  end

  def validation_errors
    validated_params.messages(full: true).values.flatten
  end
end
