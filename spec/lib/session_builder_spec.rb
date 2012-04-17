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

require './lib/session_builder'

describe SessionBuilder do
  let(:session_data) { { :some => :data, :notes => :note_data, :tag_list => :denormalized_tags, :streams => {:some_stream => {:some => :data}} } }
  let(:session) { stub("session", :id => :session_id) }
  let(:user) { stub("user") }
  let(:photos) { stub("photos") }

  subject { SessionBuilder.new(session_data, photos, user) }

  before do
    ::Stream = stub("Stream") unless Module.const_defined?(:Stream)
    ::Session = stub("Session") unless Module.const_defined?(:Session)
  end

  describe "#build!" do
    before { Session.should_receive(:transaction).and_yield }

    it "should build all the parts" do
      subject.should_receive(:build_session!).and_return(session)

      subject.build!.should == session
    end
  end

  describe "#build_session!" do
    it "should process the data" do
      SessionBuilder.should_receive(:prepare_notes).with(:note_data, photos).and_return(:prepared_notes)
      SessionBuilder.should_receive(:normalize_tags).with(:denormalized_tags).and_return(:normalized_tags)
      Session.should_receive(:create!).with(:some => :data, :notes_attributes => :prepared_notes,
                                        :tag_list => :normalized_tags, :user => user).
                                        and_return(session)
      Stream.should_receive(:build!).with(:some => :data, :session => session)

      subject.build_session!.should == session
    end
  end

  describe ".prepare_notes" do
    it "should match the photos" do
      SessionBuilder.prepare_notes([{:note => :one}, {:note => :two}], [:photo1, :photo2]).
        should == [{:note => :one, :photo => :photo1}, {:note => :two, :photo => :photo2}]
    end
  end

  describe '.normalize_tags' do
    it 'should replace spaces and commas with commas as tag delimiters' do
      SessionBuilder.normalize_tags('jola misio, foo').should == 'jola,misio,foo'
    end
  end
end

