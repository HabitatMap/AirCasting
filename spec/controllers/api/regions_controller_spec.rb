require 'spec_helper'

describe Api::RegionsController do
  describe "GET 'show'" do
    it "should delegate to RegionInfo" do
      RegionInfo.should_receive(:new).
        with(:north => 10, :south => 11, :east => 10.5, :west => 10.9,
             :sensor_name => 'foo').
        and_return("some" => "data")

      get :show, :north => "10", :east => "10.5", :west => "10.9",
                 :south => "11", :sensor_name => 'foo', :format => :json

      json_response.should == { "some" => "data" }
    end
  end
end
