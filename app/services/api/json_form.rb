class Api::JsonForm < Api::Form
  include AirCasting::DeepSymbolize

  def initialize(json:, schema:, struct:)
    @json = json || '{}'
    super(schema: schema, struct: struct)
  end

  private

  def parsed_params
    @parsed_params ||= deep_symbolize(ActiveSupport::JSON.decode(@json))
  rescue JSON::ParserError
    raise Errors::Api::CouldNotParseJsonParams
  end
end
