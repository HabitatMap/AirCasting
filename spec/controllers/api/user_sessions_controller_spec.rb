require 'rails_helper'

describe Api::UserSessionsController do
  let(:user) { FactoryBot.create(:user) }

  before { sign_in(user) }
  before { allow(controller).to receive(:current_user) { user } }

  describe "#sync" do
    it "returns session for upload when it's not present in the db" do
      post :sync, :format => :json, :data => session_data(uuid: "abc")

      expected = { "download" => [], "upload" => ["abc"], "deleted" => [] }

      expect(json_response).to eq(expected)
    end

    it "returns session as deleted when it's already deleted in the db" do
      session = create_session!(user: user, uuid: "abc")
      session.destroy

      post :sync, :format => :json, :data => session_data(uuid: "abc")

      expected = { "download" => [], "upload" => [], "deleted" => ["abc"] }

      expect(json_response).to eq(expected)
    end

    it "deletes a session and returns it as deleted if it was mark for deletion" do
      session = create_session!(user: user, uuid: "abc")

      post :sync, :format => :json, :data => session_data(uuid: "abc", deleted: true)

      expected = { "download" => [], "upload" => [], "deleted" => ["abc"] }

      expect(user.sessions.count).to eq(0)
      expect(json_response).to eq(expected)
    end

    it "returns session for download when present it's in the db, but not in the mobile app" do
      session = create_session!(user: user)
      stream = create_stream!(session: session)
      create_measurements!(stream: stream)

      post :sync, :format => :json, :data => "[]"

      expected = { "download" => [session.id], "upload" => [], "deleted" => [] }

      expect(json_response).to eq(expected)
    end

    it "syncs the session data if it's present in db and wasn't mark for deletion" do
      session = create_session!(user: user, uuid: "abc", title: "old title", tag_list: "old")
      stream = create_stream!(session: session)
      create_measurements!(stream: stream)

      post :sync, :format => :json, :data => session_data(uuid: "abc", title: "new title", tag_list: "new other")

      expected = { "download" => [], "upload" => [], "deleted" => [] }

      synced_session = user.sessions.first

      expect(json_response).to eq(expected)
      expect(synced_session.title).to eq("new title")
      expect(synced_session.tags.map { |tag| tag.name } ).to match_array(["new", "other"])
    end
  end

  describe "#show" do
    let(:stream) { FactoryBot.create(:stream) }

    context "getting own session" do
      let(:session) { FactoryBot.create(:mobile_session, :user => user, :streams => [stream], :tag_list => "hello world") }

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
      let(:note) { FactoryBot.create(:note, :photo => File.new(Rails.root + "spec" + "fixtures" + "test.jpg")) }
      let(:session) { FactoryBot.create(:mobile_session, :user => user, :notes => [note]) }

      it "should provide paths to note photos" do
        get :show, :id => session.id, :format => :json
        expected = "http://test.host:80" + note.photo.url(:medium)
        expect(json_response["notes"].first["photo_location"]).to eq(expected)
      end
    end

    context "getting other user's session" do
      let(:session) { FactoryBot.create(:mobile_session) }

      it "should respond with not found" do
        get :show, :id => session.id, :format => :json
        is_expected.to respond_with(:not_found)
      end
    end
  end

  private
  
  def session_data(attributes)
    "[
    {\"calibration\":0,
      \"contribute\":true,
      \"drawable\":2131165435,
      \"end_time\":\"2019-05-24T11:37:19\",
      \"is_indoor\":false,
      \"latitude\":0.0,
      \"location\":\"http://localhost/s/4oefo\",
      \"longitude\":0.0,
      \"deleted\":#{attributes.fetch(:deleted, false)},
      \"notes\":[],
      \"start_time\":\"2019-05-24T11:37:16\",
      \"streams\":{\"Phone Microphone\"
        :{\"average_value\":0.0,
          \"deleted\":false,
          \"measurement_type\":\"Sound Level\",
          \"measurements\":[],
          \"sensor_package_name\":\"Builtin\",
          \"sensor_name\":\"Phone Microphone\",
          \"measurement_short_type\":\"dB\",
          \"unit_symbol\":\"dB\",
          \"threshold_high\":80,
          \"threshold_low\":60,
          \"threshold_medium\":70,
          \"threshold_very_high\":100,
          \"threshold_very_low\":20,
          \"unit_name\":\"decibels\"}
        },
      \"tag_list\":\"#{attributes.fetch(:tag_list, "")}\",
      \"title\":\"#{attributes.fetch(:title, "title")}\",
      \"type\":\"MobileSession\",
      \"uuid\":\"#{attributes.fetch(:uuid, "uuid")}\"}
    ]"
  end
end
