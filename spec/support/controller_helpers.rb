module Aircasting
  module ControllerHelpers
    def self.included(base)
      base.class_eval { let(:json_response) { JSON.parse(response.body.to_s) } }
    end
  end
end
