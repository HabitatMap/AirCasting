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

describe Api::Realtime::MeasurementsController do
  describe 'POST #create' do
    subject { post :create, data: data }

    let(:user) { FactoryGirl.create(:user) }
    let(:session_uuid) { '36cfd811-dc1b-430f-a647-bfc88921bf4c' }

    let(:data) do
      %(
        {"measurement_type":"Sound Level","measurements":[{"longitude":25.4356212,"latitude":56.4523456,
        "time":"2016-05-11T17:09:02","timezone_offset":0,"milliseconds":925,"measured_value":59.15683475380729,
        "value":59.15683475380729}],"sensor_package_name":"Builtin","sensor_name":"Phone Microphone",
        "session_uuid":"#{session_uuid}","measurement_short_type":"dB","unit_symbol":"dB","threshold_high":80,
        "threshold_low":60,"threshold_medium":70,"threshold_very_high":100,"threshold_very_low":20,
        "unit_name":"decibels"}
      )
    end

    before { sign_in(user) }

    context 'when the session with requested `uuid` and `user` exists' do
      before { FactoryGirl.create(:fixed_session, user: user, uuid: session_uuid) }

      it 'returns `success`' do
        subject
        expect(response.status).to eq(200)
      end

      it 'creates stream' do
        expect { subject }.to change(Stream, :count).by(1)
      end

      it 'runs the background worker to create measurement' do
        StreamsWorker.should_receive(:perform_async).once
        subject
      end
    end

    context 'when the session with requested `uuid` does not exist' do
      before { FactoryGirl.create(:fixed_session, user: user, uuid: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx') }

      it 'returns `bad request`' do
        subject
        expect(response.status).to eq(400)
      end

      it 'does not create stream' do
        expect { subject }.to_not change(Stream, :count)
      end
    end
  end
end
