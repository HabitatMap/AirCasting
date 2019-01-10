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
  it { is_expected.to validate_presence_of :value }
  it { is_expected.to validate_presence_of :longitude }
  it { is_expected.to validate_presence_of :latitude }
  it { is_expected.to validate_presence_of :time }

  describe "scopes" do
    let(:session) { FactoryGirl.create(:mobile_session) }
    let(:stream) { FactoryGirl.create(:stream, :session => session) }
    let(:stream2) { FactoryGirl.create(:stream, :session => session) }
    let(:measurement) { FactoryGirl.create(:measurement, :stream => stream) }
    let(:measurement2) { FactoryGirl.create(:measurement, :stream => stream2) }

    describe "#with_tags" do
      it "returns all measurements belonging to stream id after since_date ordered by time" do
        now = DateTime.current
        stream = create_stream!(session: create_session!)
        measurement1 = create_measurement!(stream: stream, time: now)
        measurement2 = create_measurement!(stream: stream, time: now + 2.second)
        measurement3 = create_measurement!(stream: stream, time: now + 1.second)

        actual = Measurement.since(stream_id: stream.id, since_date: now)

        expect(actual).to eq([measurement3, measurement2])
      end
    end

    describe "#with_tags" do
      context "no tags" do
        it "returns all measurements" do
          expect(Measurement.with_tags([])).to include measurement, measurement2
        end
      end

      context "multiple tags" do
        it "returns measurements in stream sessions that have associated tags" do
          expect(Measurement.with_tags(["quiet", "boring"])).to include measurement, measurement2
        end
      end
    end

    describe "#with_streams" do
      context "no stream ids" do
        it "returns no measurements" do
          expect(Measurement.with_streams([]).blank?).to be(true)
        end
      end

      context "one stream id" do
        it "returns only measurements in that stream" do
          measurements = Measurement.with_streams([stream.id])
          expect(measurements).to include measurement
          expect(measurements).not_to include measurement2
        end
      end

      context "multiple stream ids" do
        it "returns measurements in those streams" do
          expect(Measurement.with_streams([stream.id, stream2.id])).to include measurement, measurement2
        end
      end
    end

    describe "#in_rectangle" do
      let(:measurement) { FactoryGirl.create(:measurement, :longitude => 0, :latitude => 0) }

      it "does not return measurement not in range" do
        data = {:north => 10, :south => 5, :east => 10, :west => 5}
        expect(Measurement.in_rectangle(data)).not_to include measurement
      end

      it "returns measurement in range" do
        data = {:north => 10, :south => -10, :east => 10, :west => -10}
        expect(Measurement.in_rectangle(data)).to include measurement
      end
    end

    describe "#with_time" do
      let!(:measurement) { FactoryGirl.create(:measurement, :time => Time.now) }

      it "does not return measurement not in time range" do
        data = {:day_from => -1, :day_to => -1,
                :time_from => -120, :time_to => 1319,
                :year_from => Date.today.year,
                :year_to => Date.today.year}

        expect(Measurement.with_time(data)).not_to include measurement
      end

      it "returns measurement in time range" do
        data = {:day_from => 0, :day_to => 365,
                :time_from => -120, :time_to => 1319,
                :year_from => Date.today.year,
                :year_to => Date.today.year}

        expect(Measurement.with_time(data)).to include measurement
      end
    end

    describe "#belonging_to_sessions_with_ids" do
      it "returns measurements belonging to the sessions with the passed ids" do
        session1 = create_session!
        session2 = create_session!
        stream1 = create_stream!(session: session1)
        stream2 = create_stream!(session: session2)
        create_measurement!(stream: stream1)
        measurement2 = create_measurement!(stream: stream2)
        measurement3 = create_measurement!(stream: stream2)

        actual = Measurement.belonging_to_sessions_with_ids([session2.id])

        expect(actual).to match_array([measurement2, measurement3])
      end
    end
  end

  private

  def create_session!
    Session.create!(
      title: "abc",
      user: User.new,
      uuid: SecureRandom.uuid,
      calibration: 100,
      offset_60_db: 0,
      start_time: DateTime.current,
      start_time_local: DateTime.current,
      end_time: DateTime.current,
      end_time_local: DateTime.current,
      type: "MobileSession"
    )
  end

  def create_stream!(attributes)
    Stream.create!(
      sensor_package_name: "abc",
      sensor_name: "abc",
      measurement_type: "abc",
      unit_name: "abc",
      session: attributes[:session],
      measurement_short_type: "dB",
      unit_symbol: "dB",
      threshold_very_low: 20,
      threshold_low: 60,
      threshold_medium: 70,
      threshold_high: 80,
      threshold_very_high: 100
    )
  end

  def create_measurement!(attributes)
    Measurement.create!(
      time: attributes.fetch(:time, DateTime.current),
      latitude: 123,
      longitude: 123,
      value: 123,
      milliseconds: 123,
      stream: attributes.fetch(:stream)
    )
  end
end
