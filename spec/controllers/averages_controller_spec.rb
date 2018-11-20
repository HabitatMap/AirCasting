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
    let(:expected) { {north: 1.5, south: 2.5, west: 3.5, east: 4.5, grid_size_x: 5, grid_size_y: 6,
                      time_from: 0, time_to: 2359, day_from: 0, day_to: 365, year_from: 2010, year_to: 2050} }
    let(:result) { ["Result"] }

    subject { get "index", :q => args, :format => :json }

    before(:each) do
      info = double
      expect(AverageInfo).to receive(:new).with(expected).and_return(info)
      expect(info).to receive(:as_json).and_return(result)
    end

    it { is_expected.to be_successful }

    it "should get its data from Measurement.averages" do
      subject
    end

    describe '#body' do
      subject { super().body }
      it { is_expected.to eq(result.to_json) }
    end
  end
end
