require 'rails_helper'

describe MapsController do
  describe "#show" do
    context "with valid map state" do
      before { expect(ActiveSupport::JSON).to receive(:decode).with("value").and_return(:result) }

      it "validates map state" do
        get :show, :map_state => "value"
        expect(assigns[:map_state]).to eq("value")
      end
    end

    context "with invalid map state" do
      before { expect(ActiveSupport::JSON).to receive(:decode).with("value").and_raise("some error") }

      it "should fail" do
        get :show, :map_state => "value"
        is_expected.to respond_with(:not_acceptable)
      end
    end
  end
end
