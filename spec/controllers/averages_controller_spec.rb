# AirCasting - Share your Air!
# Copyright (C) 2011-2012 HabitatMap, Inc.
# 
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
# 
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
# 
# You can contact the authors by email at <info@habitatmap.org>

require 'spec_helper'

describe Api::AveragesController do
  describe "#index" do
    let(:args) { {north: "1.5", south: "2.5", west: "3.5", east: "4.5", grid_size_x: "5", grid_size_y: "6"} }
    let(:expected) { {north: 1.5, south: 2.5, west: 3.5, east: 4.5, grid_size_x: 5, grid_size_y: 6} }
    let(:result) { ["Result"] }

    subject { get "index", :q => args, :format => :json }

    before(:each) { Measurement.should_receive(:averages).with(expected).and_return(result) }

    it { should be_successful }

    it "should get its data from Measurement.averages" do
      subject
    end

    its(:body) { should == result.to_json }
  end
end
