require 'spec_helper'

describe MapsController do
  describe "#show" do
    context "with valid map state" do
      before { ActiveSupport::JSON.should_receive(:decode).with("value").and_return(:result) }

      it "validates map state" do
        get :show, :map_state => "value"
        assigns[:map_state].should == "value"
      end
    end

    context "with invalid map state" do
      before { ActiveSupport::JSON.should_receive(:decode).with("value").and_raise("some error") }

      it "should fail" do
        get :show, :map_state => "value"
        should respond_with(:not_acceptable)
      end
    end
  end
end
