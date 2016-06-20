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

  describe ".create" do
    it "should save timezone info" do
      attributes = FactoryGirl.attributes_for(:measurement).merge(:time => "10/11/12 10:11:12 +0600")
      measurement = Measurement.create(attributes)

      measurement.timezone_offset.should == 360
    end
  end

  describe ".averages" do
    before do
      pending "Measurement.averages is not being used anymore"
      Measurement.destroy_all
    end
    let(:type) { FactoryGirl.attributes_for(:stream)[:measurement_type] }
    let(:name) { FactoryGirl.attributes_for(:stream)[:sensor_name] }
    let(:data) { {south: 10.0, north: 10.1, west: -9.0, east: 0.0, grid_size_x: 2, grid_size_y: 10,
      measurement_type: type, sensor_name: name } }

    subject { Measurement.averages(data) }

    context "when there is no data inside the grid" do
      before { FactoryGirl.create(:measurement, latitude: 20, longitude: -5) }

      it { should == [] }
    end

    context "when there is some data inside the grid" do
      let(:private_session) { FactoryGirl.create(:mobile_session, contribute: false) }
      let(:private_stream) { FactoryGirl.create(:stream, session: private_session)} 
      let!(:private_measurement) do 
        FactoryGirl.create(:measurement, latitude: 10.015, longitude: -8, value: -100, stream: private_stream)
      end

      let!(:m1) { FactoryGirl.create(:measurement, latitude: 10.005, longitude: -4, value: -10) }
      let!(:m2) { FactoryGirl.create(:measurement, latitude: 10.005, longitude: -3, value: -5) }
      let!(:m3) { FactoryGirl.create(:measurement, latitude: 10.015, longitude: -8, value: -10) }
      let!(:m4) { FactoryGirl.create(:measurement, latitude: 10.005, longitude: 20, value: 100) }
 
      it "should average data in grid elements" do
        expected_value1 = (m1.value + m2.value) / 2.0

        node1 = subject.find { |x| (x[:value] - expected_value1).abs < 0.001 }
        node1.should_not be_nil

        # Accept a pretty wide margin on the y-axis because
        # we are snapping the grid to a size of 1.2^n * 0.000001
        node1[:south].should be_within(0.01).of(10)
        node1[:north].should be_within(0.01).of(10.01)
        node1[:west].should be_within(0.0001).of(-6.75)
        node1[:east].should be_within(0.0001).of(-2.25)

        expected_value2 = m3.value

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

    context "when there are many sensor streams" do
      let(:stream_a) { FactoryGirl.create(:stream)} 
      let(:stream_b) { FactoryGirl.create(:stream, :measurement_type => "some other type")} 
      let(:stream_c) { FactoryGirl.create(:stream, :sensor_name => "some other name")} 
      let!(:measurement_a) { FactoryGirl.create(:measurement, latitude: 10.005, longitude: -4, value: 0, stream: stream_a) }
      let!(:measurement_b) { FactoryGirl.create(:measurement, latitude: 10.005, longitude: -4, value: 5, stream: stream_b) }
      let!(:measurement_c) { FactoryGirl.create(:measurement, latitude: 10.005, longitude: -4, value: 10, stream: stream_c) }

      let(:data) { { south: 10.0, north: 10.1, west: -9.0, east: 0.0, grid_size_x: 2, grid_size_y: 10,
        measurement_type: stream_a.measurement_type, :sensor_name => stream_a.sensor_name } }

      it "should choose stream with correct measurement type" do
        subject.first[:value].should == 0
      end
    end

    context "when the grid includes meridian 180" do
      let(:data) { { south: 10.0, north: 10.1, east: -170.0, west: 170.0, grid_size_x: 2, grid_size_y: 2,
        measurement_type: type, sensor_name: name } }

      let!(:measurement) { FactoryGirl.create(:measurement, latitude: 10.05, longitude: 180) }

      it "should still work" do
        subject.should_not be_empty
      end
    end
  end

  describe "scopes" do
    let(:session) { FactoryGirl.create(:mobile_session) }
    let(:stream) { FactoryGirl.create(:stream, :session => session) }
    let(:stream2) { FactoryGirl.create(:stream, :session => session) }
    let(:measurement) { FactoryGirl.create(:measurement, :stream => stream) }
    let(:measurement2) { FactoryGirl.create(:measurement, :stream => stream2) }

    describe "#with_tags" do
      context "no tags" do
        it "returns all measurements" do
          Measurement.with_tags([]).should include measurement, measurement2
        end
      end

      context "multiple tags" do
        it "returns measurements in stream sessions that have associated tags" do
          Measurement.with_tags(["quiet", "boring"]).should include measurement, measurement2
        end
      end
    end

    describe "#with_streams" do
      context "no stream ids" do
        it "returns no measurements" do
          Measurement.with_streams([]).blank?.should be_true
        end
      end

      context "one stream id" do
        it "returns only measurements in that stream" do
          measurements = Measurement.with_streams([stream.id])
          measurements.should include measurement
          measurements.should_not include measurement2
        end
      end

      context "multiple stream ids" do
        it "returns measurements in those streams" do
          Measurement.with_streams([stream.id, stream2.id]).should include measurement, measurement2
        end
      end
    end

    describe "#in_rectangle" do
      let(:measurement) { FactoryGirl.create(:measurement, :longitude => 0, :latitude => 0) }

      it "does not return measurement not in range" do
        data = {:north => 10, :south => 5, :east => 10, :west => 5}
        Measurement.in_rectangle(data).should_not include measurement
      end

      it "returns measurement in range" do
        data = {:north => 10, :south => -10, :east => 10, :west => -10}
        Measurement.in_rectangle(data).should include measurement
      end
    end

    describe "#with_time" do
      let!(:measurement) { FactoryGirl.create(:measurement, :time => Time.now) }

      it "does not return measurement not in time range" do
        data = {:day_from => -1, :day_to => -1,
                :time_from => -120, :time_to => 1319,
                :year_from => Date.today.year,
                :year_to => Date.today.year}

        Measurement.with_time(data).should_not include measurement
      end

      it "returns measurement in time range" do
        data = {:day_from => 0, :day_to => 365,
                :time_from => -120, :time_to => 1319,
                :year_from => Date.today.year,
                :year_to => Date.today.year}

        Measurement.with_time(data).should include measurement
      end
    end
  end
end
