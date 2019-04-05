class Api::ParamsForm < Api::Form
  def initialize(params:, schema:, struct:)
    @params = params
    super(schema: schema, struct: struct)
  end

  private

  def parsed_params
    @params
  end
end
