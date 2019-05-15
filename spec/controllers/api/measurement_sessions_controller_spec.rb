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

shared_examples_for "session creation" do
  let(:session) { double("session", :notes => [note]) }
  let(:note) { FactoryGirl.create(:note, :photo => photo, :number => 10) }
  let(:photo) { File.new(Rails.root + "spec" + "fixtures" + "test.jpg") }
  let(:photos) { :some_files }

  context "when session creation fails" do
    let(:create_result) { nil }

    it { is_expected.to respond_with(:bad_request) }
  end

  context "when session creation succeeds" do
    let(:create_result) { session }

    it { is_expected.to respond_with(:ok) }

    it 'returns JSON with location of created session' do
      expect(json_response).to have_key('location')
    end

    it 'returns JSON with locations of note photos' do
      expect(json_response["notes"].first).to eq(
        { "photo_location" => "http://test.host:80" + note.photo.url(:medium), "number" => note.number }
      )
    end
  end
end

describe Api::MeasurementSessionsController do
  let(:user) { FactoryGirl.create(:user) }

  before { sign_in user }

  describe "GET 'show_multiple'" do
    let(:session1) { FactoryGirl.create(:mobile_session) }
    let(:session2) { FactoryGirl.create(:mobile_session) }

    before do
      get :show_multiple, q: { session_ids: [session1.id, session2.id] }, format: :json
    end

    it { expect(response.status).to eq 200 }
    it 'returns multiple sessions' do
      expect(response.body).to eq ({ sessions: MobileSession.selected_sessions_json(session_ids: [session1.id, session2.id]) }).to_json
    end
  end

  describe "POST 'create'" do
    let(:builder) { double }
    let(:data) { {type: "MobileSession"} }

    before do
      expect(ActiveSupport::JSON).to receive(:decode).with(:session).and_return(data)
      expect(SessionBuilder).to receive(:new).with(data, :some_files, user).and_return(builder)
      expect(builder).to receive(:build!).and_return(create_result)
    end

    context "when the session is sent without compression" do
      before do
        post :create, :format => :json, :session => :session, :compression => false, :photos => photos
      end

      it_should_behave_like "session creation"
    end

    context "when the session is sent compressed" do
      before do
        expect(Base64).to receive(:decode64).with(:zipped_and_encoded).and_return(:zipped)
        expect(AirCasting::GZip).to receive(:inflate).with(:zipped).and_return(:session)

        post :create, :format => :json, :session => :zipped_and_encoded, :compression => true, :photos => photos
      end

      it_should_behave_like "session creation"
    end
  end
end
