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

describe Stream do

  describe "validations" do
    [:sensor_name,
     :sensor_package_name,
     :unit_name,
     :measurement_type,
     :measurement_short_type,
     :unit_symbol,
     :threshold_very_low,
     :threshold_low,
     :threshold_medium,
     :threshold_high,
     :threshold_very_high].each do |field|
      it { should validate_presence_of field }
    end
  end

  let(:stream) { FactoryGirl.create(:stream) }
  let!(:measurement) { FactoryGirl.create(:measurement, :stream => stream) }

  describe "#build_measurements!" do
    let(:measurement_data) { stub("measurement data") }

    before do
      Measurement.should_receive(:new).with(measurement_data).and_return(measurement)
      measurement.should_receive(:stream=).with(any_args) { |x| x.id == stream.id }
      measurement.should_receive(:set_timezone_offset)
      Measurement.should_receive(:import).with(any_args) do |measurements|
        measurements.should include measurement
        import_result
      end
    end

    context "the measurements are valid" do
      let(:import_result) { stub(:failed_instances => []) }

      it "should import the measurements" do
        Stream.should_receive(:update_counters).with(stream.id, :measurements_count => 1)

        stream.build_measurements!([measurement_data])
      end
    end

    context "the measurements are invalid" do
      let(:import_result) { stub(:failed_instances => [1,2,3]) }

      it "should cause an error" do
        lambda { stream.build_measurements!([measurement_data]) }.should raise_error
      end
    end
  end

  describe "#sensors" do
    before { Stream.destroy_all }
    let!(:stream1) { FactoryGirl.create(:stream, :unit_symbol => "%", :sensor_name => "s1", :measurement_type => "m1") }
    let!(:stream2) { FactoryGirl.create(:stream, :unit_symbol => "%", :sensor_name => "s2", :measurement_type => "m2") }
    let!(:stream3) { FactoryGirl.create(:stream, :unit_symbol => "%", :sensor_name => "s1", :measurement_type => "m1") }

    subject { Stream.sensors }

    it "should return all sensors" do
      thresholds = FactoryGirl.attributes_for(:stream).select { |k,v| k =~ /^threshold/ }
      subject.should include({ :unit_symbol => "%", :sensor_name => "s1", :measurement_type => "m1", :session_count => 2 }.merge(thresholds))
      subject.should include({ :unit_symbol => "%", :sensor_name => "s2", :measurement_type => "m2", :session_count => 1 }.merge(thresholds))
    end

    it "should return unique sensors" do 
      subject.size.should == 2
    end
  end

  describe "#destroy" do
    it "should destroy measurements" do
      stream.reload.destroy

      Measurement.exists?(measurement.id).should be_false
    end
  end

  describe ".as_json" do
    subject { stream.as_json(:methods => [:measurements]) }

    it "should include stream size and measurements" do
      subject[:size].should_not be_nil
      subject[:measurements].should_not be_nil
      #subject[:size].should == stream.reload.measurements.size
    end
  end

  describe "scope" do
    let(:user) { FactoryGirl.create(:user) }
    let(:user2) { FactoryGirl.create(:user) }
    let(:session) { FactoryGirl.create(:mobile_session, :user => user) }
    let(:session2) { FactoryGirl.create(:mobile_session, :user => user2) }
    let(:stream) { FactoryGirl.create(:stream, :sensor_name => "Sensor1", :session => session) }
    let(:stream2) { FactoryGirl.create(:stream, :sensor_name => "Sensor2", :session => session2) }

    describe "#with_sensor" do
      it "returns sensor with specified name" do
        streams = Stream.with_sensor(stream.sensor_name)
        streams.should include stream
        streams.should_not include stream2
      end
    end

    describe "#with_usernames" do
      context "no user names" do
        it "returns all streams" do
          Stream.with_usernames([]).should include stream, stream2
        end
      end

      context "one user name" do
        it "returns on streams with that user associated" do
          streams = Stream.with_usernames([user.username])
          streams.should include stream
          streams.should_not include stream2
        end
      end

      context "multiple user names" do
        it "returns all streams with those usernames" do
          Stream.with_usernames([user.username, user2.username]).should include stream, stream2
        end
      end
    end
  end
end
