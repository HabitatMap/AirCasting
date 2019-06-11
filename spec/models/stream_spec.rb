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

require 'rails_helper'

describe Stream do
  let(:stream) { FactoryBot.create(:stream) }
  let!(:measurement) { FactoryBot.create(:measurement, stream: stream) }

  describe '#build_measurements!' do
    let(:measurement_data) { double('measurement data') }

    before do
      expect(Measurement).to receive(:new).with(measurement_data).and_return(
        measurement
      )
      expect(measurement).to receive(:stream=).with(any_args) { |x|
        x.id == stream.id
      }
      expect(Measurement).to receive(:import).with(any_args) do |measurements|
        expect(measurements).to include measurement
        import_result
      end
    end

    context 'the measurements are valid' do
      let(:import_result) { double(failed_instances: []) }

      it 'should import the measurements' do
        expect(Stream).to receive(:update_counters).with(
          stream.id,
          measurements_count: 1
        )

        stream.build_measurements!([measurement_data])
      end
    end

    context 'the measurements are invalid' do
      let(:import_result) { double(failed_instances: [1, 2, 3]) }

      it 'should cause an error' do
        expect {
          stream.build_measurements!([measurement_data])
        }.to raise_error('Measurement import failed!')
      end
    end
  end

  describe '#sensors' do
    before { Stream.destroy_all }
    let!(:stream1) do
      FactoryBot.create(
        :stream,
        unit_symbol: '%', sensor_name: 's1', measurement_type: 'm1'
      )
    end
    let!(:stream2) do
      FactoryBot.create(
        :stream,
        unit_symbol: '%', sensor_name: 's2', measurement_type: 'm2'
      )
    end
    let!(:stream3) do
      FactoryBot.create(
        :stream,
        unit_symbol: '%', sensor_name: 's1', measurement_type: 'm1'
      )
    end

    subject { Stream.sensors }

    it 'should return all sensors' do
      thresholds =
        FactoryBot.attributes_for(:stream).select { |k, v| k =~ /^threshold/ }
      expect(subject).to include(
        {
          id: nil,
          unit_symbol: '%',
          sensor_name: 's1',
          measurement_type: 'm1',
          session_count: 2
        }.merge(thresholds)
      )
      expect(subject).to include(
        {
          id: nil,
          unit_symbol: '%',
          sensor_name: 's2',
          measurement_type: 'm2',
          session_count: 1
        }.merge(thresholds)
      )
    end

    it 'should return unique sensors' do
      expect(subject.size).to eq(2)
    end
  end

  describe '#destroy' do
    it 'should destroy measurements' do
      stream.reload.destroy

      expect(Measurement.exists?(measurement.id)).to be(false)
    end
  end

  describe '.as_json' do
    subject { stream.as_json(methods: %i[measurements]) }

    it 'should include stream size and measurements' do
      expect(subject['size']).not_to be_nil
      expect(subject['measurements']).not_to be_nil
    end
  end

  describe 'scope' do
    let(:user) { FactoryBot.create(:user) }
    let(:user2) { FactoryBot.create(:user) }
    let(:session) { FactoryBot.create(:mobile_session, user: user) }
    let(:session2) { FactoryBot.create(:mobile_session, user: user2) }
    let(:stream) do
      FactoryBot.create(:stream, sensor_name: 'Sensor1', session: session)
    end
    let(:stream2) do
      FactoryBot.create(:stream, sensor_name: 'Sensor2', session: session2)
    end

    describe '#with_sensor' do
      it 'returns sensor with specified name' do
        streams = Stream.with_sensor(stream.sensor_name)
        expect(streams).to include stream
        expect(streams).not_to include stream2
      end
    end

    describe '#with_usernames' do
      context 'no user names' do
        it 'returns all streams' do
          expect(Stream.with_usernames([])).to include stream, stream2
        end
      end

      context 'one user name' do
        it 'returns on streams with that user associated' do
          streams = Stream.with_usernames([user.username])
          expect(streams).to include stream
          expect(streams).not_to include stream2
        end
      end

      context 'multiple user names' do
        it 'returns all streams with those usernames' do
          expect(
            Stream.with_usernames([user.username, user2.username])
          ).to include stream, stream2
        end
      end
    end
  end
end
