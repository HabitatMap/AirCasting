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
require './lib/session_builder'

describe SessionBuilder do
  let(:user) { double('user') }
  let(:photos) { double('photos') }
  subject { SessionBuilder.new(session_data, photos, user) }

  describe '.prepare_notes' do
    it 'should match the photos' do
      expect(
        SessionBuilder.prepare_notes(
          [{ note: :one }, { note: :two }],
          %i[photo1 photo2]
        )
      ).to eq([{ note: :one, photo: :photo1 }, { note: :two, photo: :photo2 }])
    end
  end

  describe '.normalize_tags' do
    it 'should replace spaces and commas with commas as tag delimiters' do
      expect(SessionBuilder.normalize_tags('jola misio, foo')).to eq(
        'jola,misio,foo'
      )
    end
  end

  describe '#build_local_start_and_end_time' do
    let(:start_time_iso8601) { '2012-07-17T07:37:37+02:00' }
    let(:end_time_iso8601) { '2012-07-17T07:37:37+02:00' }
    let(:start_time) { DateTime.iso8601 start_time_iso8601 }
    let(:end_time) { DateTime.iso8601 end_time_iso8601 }

    let(:session_data) do
      {
        start_time: start_time_iso8601,
        end_time: end_time_iso8601,
        some: :data,
        notes: :note_data,
        tag_list: :denormalized_tags,
        streams: { some_stream: { some: :data } }
      }
    end

    it 'adds timezone offset to start_time and end_time and saves it as a local time' do
      data = subject.build_local_start_and_end_time(session_data)

      expect(data[:start_time_local]).to eq(start_time)
      expect(data[:end_time_local]).to eq(end_time)
      expect(data[:some]).to eq(:data)
      expect(data[:notes]).to eq(:note_data)
    end
  end
end
