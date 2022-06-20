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
      ).to eq([{ note: :one, photo: "data:image/jpeg;base64,photo1" }, { note: :two, photo: "data:image/jpeg;base64,photo2" }])
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
        streams: {
          some_stream: {
            some: :data
          }
        }
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
