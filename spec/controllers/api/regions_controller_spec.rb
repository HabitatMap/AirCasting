require 'spec_helper'

describe Api::RegionsController do
  describe "GET 'show'" do
    it "should delegate to RegionInfo" do
      RegionInfo.should_receive(:new).
        with(:north => 10.0, :east => 10.5, :west => 10.9, :south => 11.0,
             :sensor_name => "foo", :controller => "api/regions", :action => "show")

      get :show, "north" => "10", "east" => "10.5", "west" => "10.9",
                 "south" => "11", "sensor_name" => "foo"
    end
  end
end
