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
