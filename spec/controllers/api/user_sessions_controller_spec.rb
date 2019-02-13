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

describe Api::UserSessionsController do
  let(:user) { FactoryGirl.create(:user) }

  before { sign_in(user) }
  before { allow(controller).to receive(:current_user) { user } }

  describe "#sync" do
    let(:data) { [{ "something" => "value", :notes => [{ "key" => "value" }] }].to_json }

    before do
      expect(user).to receive(:sync).
        with([{:something => "value", :notes => [{ :key => "value" }] }]).
        and_return(["Result"])
    end

    before { post :sync, :format => :json, :data => data }

    it { is_expected.to respond_with(:created) }
    it "should return results" do
      expect(json_response).to eq(["Result"])
    end
  end

  describe "#show" do
    let(:stream) { FactoryGirl.create(:stream) }

    context "getting own session" do
      let(:session) { FactoryGirl.create(:mobile_session, :user => user, :streams => [stream], :tag_list => "hello world") }

      it "should respond with ok" do
        get :show, :id => session.id, :format => :json
        is_expected.to respond_with(:ok)
       end

      it "should return a location for the session" do
        get :show, :id => session.id, :format => :json
        expect(json_response).to include jsonized(:location => short_session_url(session))
      end

      it "should contain notes" do
        get :show, :id => session.id, :format => :json
        expect(json_response["notes"].first).to include jsonized(session.notes.first)
      end

      it "should contain a tag list" do
        get :show, :id => session.id, :format => :json
        expect(json_response["tag_list"]).to eq("hello world")
      end

      it "finds sessions by uuid" do
        get :show, :uuid => session.uuid, :format => :json
        is_expected.to respond_with(:ok)
      end
    end

    context "session has notes with photos" do
      let(:note) { FactoryGirl.create(:note, :photo => File.new(Rails.root + "spec" + "fixtures" + "test.jpg")) }
      let(:session) { FactoryGirl.create(:mobile_session, :user => user, :notes => [note]) }

      it "should provide paths to note photos" do
        get :show, :id => session.id, :format => :json
        expected = "http://test.host:80" + note.photo.url(:medium)
        expect(json_response["notes"].first["photo_location"]).to eq(expected)
      end
    end

    context "getting other user's session" do
      let(:session) { FactoryGirl.create(:mobile_session) }

      it "should respond with not found" do
        get :show, :id => session.id, :format => :json
        is_expected.to respond_with(:not_found)
      end
    end
  end
end
