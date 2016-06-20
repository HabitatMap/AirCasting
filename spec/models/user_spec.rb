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

describe User do
  let(:user) { FactoryGirl.create(:user) }
  subject { user }

  it { should validate_presence_of(:username) }
  it { should validate_uniqueness_of(:username).case_insensitive }
  it { should validate_presence_of(:email) }
  it { should validate_uniqueness_of(:email).case_insensitive }

  describe "#before_save" do
    it 'chomps username attr, so there is no new lines chars at the end' do
      username = "FooBoo\n"
      user = User.new(:username => username, :email => 'foo@boo.biz',
                      :password => 'BizBar')
      user.save.should be_true
      user.username.should == username.chomp
    end
  end

  describe "#as_json" do
    subject { user.as_json }

    it { should include("username" => user.username) }
  end

  describe "#sync" do
    let(:session1) { FactoryGirl.create(:mobile_session, :user => user) }
    let(:session2) { FactoryGirl.create(:mobile_session, :user => user, :notes => [note1, note2]) }
    let!(:session3) { FactoryGirl.create(:mobile_session, :user => user) }
    let(:session4) { FactoryGirl.create(:mobile_session, :user => user, :notes => [note3]) }
    let(:session5) { FactoryGirl.create(:mobile_session, :user => user) }
    let(:note1) { FactoryGirl.create(:note, :number => 1, :text => "Old text") }
    let(:note2) { FactoryGirl.create(:note, :number => 2, :text => "Old text") }

    let(:note3) { FactoryGirl.create(:note, :number => 3, :text => "Old text") }

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
      @result[:deleted].should == [session1.uuid]
      @result[:upload].should_not include [session1.uuid]
    end

    it "should delete sessions" do
      Session.exists?(session1.id).should be_false
    end

    it "should update sessions" do
      session2.reload.title.should == "New title"
    end

    it "should return a list of session uuids to upload" do
      @result[:upload].should == ["something"]
    end

    it "should return a list of session ids to download" do
      @result[:download].should == [session3.id]
    end

    it "should update notes matching numbers" do
      session2.notes.find_by_number(1).text.should == "Hi"
      session2.notes.find_by_number(2).text.should == "Bye"
    end

    it "should replace notes when there are no numbers" do
      session4.reload.notes.size.should == 1
      session4.notes.first.text.should == "New text"
    end
  end
end
