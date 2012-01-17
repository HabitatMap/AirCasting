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

describe Measurement do
  it { should validate_presence_of :value }
  it { should validate_presence_of :longitude }
  it { should validate_presence_of :latitude }
  it { should validate_presence_of :time }

  describe ".averages" do
    before { Measurement.destroy_all }
    let(:data) { {south: 10.0, north: 10.1, west: -9.0, east: 0.0, grid_size_x: 2, grid_size_y: 10} }

    subject { Measurement.averages(data) }

    context "when there is no data inside the grid" do
      before { Factory.create(:measurement, latitude: 20, longitude: -5) }

      it { should == [] }
    end

    context "when there is some data inside the grid" do
      let(:private_session) { Factory.create(:session, contribute: false) }
      let!(:private_measurement) { Factory.create(:measurement, latitude: 10.015, longitude: -8, value: -100, session: private_session) }

      let!(:m1) { Factory.create(:measurement, latitude: 10.005, longitude: -4, value: -10) }
      let!(:m2) { Factory.create(:measurement, latitude: 10.005, longitude: -3, value: -5) }
      let!(:m3) { Factory.create(:measurement, latitude: 10.015, longitude: -8, value: -10) }
      let!(:m4) { Factory.create(:measurement, latitude: 10.005, longitude: 20, value: 100) }
      let(:calibration) { m1.calibration }

      it "should average data in grid elements" do
        expected_value1 = ((-10 + -5) / 2.0 + calibration)

        node1 = subject.find { |x| (x[:value] - expected_value1).abs < 0.001 }
        node1.should_not be_nil

        # Accept a pretty wide margin on the y-axis because
        # we are snapping the grid to a size of 1.2^n * 0.000001
        node1[:south].should be_within(0.01).of(10)
        node1[:north].should be_within(0.01).of(10.01)
        node1[:west].should be_within(0.0001).of(-6.75)
        node1[:east].should be_within(0.0001).of(-2.25)

        expected_value2 = (-10 + calibration)

        node2 = subject.find { |x| (x[:value] - expected_value2).abs < 0.001 }
        node2.should_not be_nil

        # Ditto
        node2[:south].should be_within(0.01).of(10.01)
        node2[:north].should be_within(0.01).of(10.02)
        node2[:west].should be_within(0.0001).of(-11.25)
        node2[:east].should be_within(0.0001).of(-6.75)
      end

      it "should exclude data from outside the area" do
        subject.size.should == 2
      end
    end

    context "when the grid includes meridian 180" do
      let(:data) { { south: 10.0, north: 10.1, east: -170.0, west: 170.0, grid_size_x: 2, grid_size_y: 2 } }

      let!(:measurement) { Factory(:measurement, latitude: 10.05, longitude: 180) }

      it "should still work" do
        subject.should_not be_empty
      end
    end
  end
end
