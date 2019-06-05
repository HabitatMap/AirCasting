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

describe User do
  let(:user) { FactoryBot.create(:user) }
  subject { user }

  describe "#before_save" do
    it 'chomps username attr, so there is no new lines chars at the end' do
      username = "FooBoo\n"
      user = User.new(:username => username, :email => 'foo@boo.biz',
                      :password => '12345678')
      expect(user.save).to be(true)
      expect(user.username).to eq(username.chomp)
    end
  end

  describe "#as_json" do
    subject { user.as_json }

    it { is_expected.to include("username" => user.username) }
  end

  describe "#sync" do
    let(:session1) { FactoryBot.create(:mobile_session, :user => user) }
    let(:session2) { FactoryBot.create(:mobile_session, :user => user, :notes => [note1, note2]) }
    let(:session4) { FactoryBot.create(:mobile_session, :user => user, :notes => [note3]) }
    let(:session5) { FactoryBot.create(:mobile_session, :user => user) }
    let(:note1) { FactoryBot.create(:note, :number => 1, :text => "Old text") }
    let(:note2) { FactoryBot.create(:note, :number => 2, :text => "Old text") }

    let(:note3) { FactoryBot.create(:note, :number => 3, :text => "Old text") }

    let(:data) do
      [
       { :uuid => session1.uuid, :deleted => true },
       { :uuid => session2.uuid, :title => "New title", :notes =>
         [{ :number => 2, :text => "Bye" }, { :number => 1, :text => "Hi" }] },
       { :uuid => "something" },
       { :uuid => session4.uuid, :notes => [note3.attributes.symbolize_keys.merge(:text => "New text")] }
      ]
    end

    before do
      @result = user.sync(data)
    end

    it "should tell phone a session it contains has been deleted" do
      expect(@result[:deleted]).to eq([session1.uuid])
      expect(@result[:upload]).not_to include [session1.uuid]
    end

    it "should delete sessions" do
      expect(Session.exists?(session1.id)).to be(false)
    end

    it "should update sessions" do
      expect(session2.reload.title).to eq("New title")
    end

    it "should return a list of session uuids to upload" do
      expect(@result[:upload]).to eq(["something"])
    end

    it "should update notes matching numbers" do
      expect(session2.notes.find_by_number(1).text).to eq("Hi")
      expect(session2.notes.find_by_number(2).text).to eq("Bye")
    end

    it "should replace notes when there are no numbers" do
      expect(session4.reload.notes.size).to eq(1)
      expect(session4.notes.first.text).to eq("New text")
    end
  end

  describe "#sync downloaded sessions" do
    it "should return a list of session ids to download" do
      session = create_session!(user: user)
      stream = create_stream!(session: session)
      create_measurements!(stream: stream)

      expected = user.sync([{ uuid: [] }])[:download]

      expect(expected).to eq([session.id])
    end

    it "should return a list of session ids to download that doesn't include sessions without sterams" do
      session = create_session!(user: user)

      expected = user.sync([{ uuid: [] }])[:download]

      expect(expected).to eq([])
    end

    it "should return a list of session ids to download that doesn't include sessions with at least one sterams without any measurements" do
      session = create_session!(user: user)
      stream1 = create_stream!(session: session)
      create_measurements!(stream: stream1)
      stream2 = create_stream!(session: session)

      expected = user.sync([{ uuid: [] }])[:download]

      expect(expected).to eq([])
    end
  end
end
