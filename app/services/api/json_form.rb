class Api::JsonForm < Api::Form
  def initialize(json:, schema:, struct:)
    @json = json || "{}"
    super(schema: schema, struct: struct)
  end

  private

  def parsed_params
    @parsed_params ||= ActiveSupport::JSON.decode(@json).symbolize_keys
  rescue JSON::ParserError
    raise Errors::Api::CouldNotParseJsonParams
  end
end
