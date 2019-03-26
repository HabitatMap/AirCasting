require 'rails_helper'
require 'dry-validation'
require 'dry-struct'

module Test
  module Types
    include Dry::Types.module
  end

  Schema = Dry::Validation.Schema do
    required(:name).filled(:str?)
  end

  class Struct < Dry::Struct
    attribute :name, Types::Strict::String
  end
end

describe Api::Form do
  context "when json is invalid" do
    it "raises" do
      expect do
        json = "{"
        schema = Test::Schema
        struct = Test::Struct

        form = Api::Form.new(json: json, schema: schema, struct: struct)

        form.invalid?
      end.to raise_error(Errors::Api::CouldNotParseJsonParams)
    end
  end

  describe "#invalid?" do
    context "when required param is missing" do
      it "returns true" do
        json = "{}"
        schema = Test::Schema
        struct = Test::Struct

        form = Api::Form.new(json: json, schema: schema, struct: struct)

        expect(form.invalid?).to eq(true)
      end
    end

    context "when required param is present" do
      it "returns true" do
        json = "{\"name\":\"name\"}"
        schema = Test::Schema
        struct = Test::Struct

        form = Api::Form.new(json: json, schema: schema, struct: struct)

        expect(form.invalid?).to eq(false)
      end
    end
  end

  describe "#errors" do
    context "when required param is missing" do
      it "returns proper errors" do
        json = "{}"
        schema = Test::Schema
        struct = Test::Struct

        form = Api::Form.new(json: json, schema: schema, struct: struct)

        expect(form.errors).to eq([ "name is missing" ])
      end
    end

    context "required param is present" do
      it "returns no errors" do
        json = "{\"name\":\"name\"}"
        schema = Test::Schema
        struct = Test::Struct

        form = Api::Form.new(json: json, schema: schema, struct: struct)

        expect(form.errors).to eq([])
      end
    end
  end

  describe "#to_h" do
    context "required param is present" do
      it "returns no errors" do
        json = "{\"name\":\"name\"}"
        schema = Test::Schema
        struct = Test::Struct

        form = Api::Form.new(json: json, schema: schema, struct: struct)

        expect(form.to_h).to eq(Test::Struct.new(name: "name"))
      end
    end
  end

  describe "#add_error" do
    it "adds errors to the form" do
      json = "{}"
      schema = Test::Schema
      struct = Test::Struct

      form = Api::Form.new(json: json, schema: schema, struct: struct)
      form.add_error("added error")

      expect(form.errors).to eq([ "name is missing", "added error" ])
    end
  end
end
