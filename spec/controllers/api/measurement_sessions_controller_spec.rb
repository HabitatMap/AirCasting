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

shared_examples_for "session creation" do
  let(:session) { mock_model(Session, :notes => [note]) }
  let(:note) { FactoryGirl.create(:note, :photo => photo, :number => 10) }
  let(:photo) { File.new(Rails.root + "spec" + "fixtures" + "test.jpg") }
  let(:photos) { :some_files }

  context "when session creation fails" do
    let(:create_result) { nil }

    it { should respond_with(:bad_request) }
  end

  context "when session creation succeeds" do
    let(:create_result) { session }

    it { should respond_with(:ok) }

    it 'returns JSON with location of created session' do
      json_response.should have_key('location')
    end

    it 'returns JSON with locations of note photos' do
      json_response["notes"].first.should ==
        { "photo_location" => "http://test.host:80" + note.photo.url(:medium), "number" => note.number }
    end
  end
end

describe Api::MeasurementSessionsController do
  let(:user) { FactoryGirl.create(:user) }

  before { sign_in user }

  describe "GET 'index'" do
    let(:json) { [] }

    before do
      Session.should_receive(:filtered_json).and_return(json)
      get :index, :format => :json, :q => {}
    end

    it { should respond_with(:ok) }
  end

  describe "POST 'create'" do
    let(:builder) { stub }
    let(:data) { {type: "MobileSession"} }

    before do
      ActiveSupport::JSON.should_receive(:decode).with(:session).and_return(data)
      SessionBuilder.should_receive(:new).with(data, :some_files, user).and_return(builder)
      builder.should_receive(:build!).and_return(create_result)
    end

    context "when the session is sent without compression" do
      before do
        post :create, :format => :json, :session => :session, :compression => false, :photos => photos
      end

      it_should_behave_like "session creation"
    end

    context "when the session is sent compressed" do
      before do
        Base64.should_receive(:decode64).with(:zipped_and_encoded).and_return(:zipped)
        AirCasting::GZip.should_receive(:inflate).with(:zipped).and_return(:session)

        post :create, :format => :json, :session => :zipped_and_encoded, :compression => true, :photos => photos
      end

      it_should_behave_like "session creation"
    end
  end

  describe "GET 'show'" do
    let(:session) { FactoryGirl.create(:mobile_session) }

    before do
      get :show, :id => session.id, :format => :json
    end

    it { should respond_with(:ok) }
    it "should contain notes" do
      json_response['notes'].should == jsonized(session.notes)
    end
  end
end
