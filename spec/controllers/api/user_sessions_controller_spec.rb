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

describe Api::UserSessionsController do
  let(:user) { FactoryGirl.create(:user) }

  before { sign_in(user) }
  before { controller.stub(:current_user) { user } }

  describe "#sync" do
    let(:data) { [{ "something" => "value", :notes => [{ "key" => "value" }] }].to_json }

    before do
      user.should_receive(:sync).
        with([{:something => "value", :notes => [{ :key => "value" }] }]).
        and_return(["Result"])
    end

    before { post :sync, :format => :json, :data => data }

    it { should respond_with(:created) }
    it "should return results" do
      json_response.should == ["Result"]
    end
  end

  describe "#show" do
    let(:stream) { FactoryGirl.create(:stream) }

    before { get :show, :id => session.id, :format => :json }

    context "getting own session" do
      let(:session) { FactoryGirl.create(:mobile_session, :user => user, :streams => [stream], :tag_list => "hello world") }

      it { should respond_with(:ok) }

      it "should return the session" do
        json_response.should include jsonized(session.reload, :methods => [:streams, :measurements])
      end

      it "should return a location for the session" do
        json_response.should include jsonized(:location => short_session_url(session))
      end

      it "should contain notes" do
        json_response["notes"].first.should include jsonized(session.notes.first)
      end

      it "should contain a tag list" do
        json_response["tag_list"].should == "hello world"
      end
    end

    context "session has notes with photos" do
      let(:note) { FactoryGirl.create(:note, :photo => File.new(Rails.root + "spec" + "fixtures" + "test.jpg")) }
      let(:session) { FactoryGirl.create(:mobile_session, :user => user, :notes => [note]) }

      it "should provide paths to note photos" do
        expected = "http://test.host:80" + note.photo.url(:medium)
        json_response["notes"].first["photo_location"].should == expected
      end
    end

    context "getting other user's session" do
      let(:session) { FactoryGirl.create(:mobile_session) }

      it { should respond_with(:not_found) }
    end
  end
end
