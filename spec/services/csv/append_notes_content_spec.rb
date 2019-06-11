require 'spec_helper'

describe Csv::AppendNotesContent do
  let(:subject) { described_class.new(host: 'http://expample.com/') }
  let(:lines) { [] }
  let(:date) { DateTime.new(2_018, 8, 20, 11, 16, 44) }
  let(:latitude) { BigDecimal('40.68038924') }
  let(:longitude) { BigDecimal('-73.97631499') }
  let(:photo_url_regexp) { %r{http:\/\/expample.com\/\/system\/.+jpg\?\d+$} }

  it 'appends correct headers' do
    note = create_note!
    subject.call(lines, [note])

    actual_headers = lines.first

    expected_headers = %w[Note Time Latitude Longitude Photo_Url]
    expect(actual_headers).to eq(expected_headers)
  end

  it 'appends note and image info' do
    note = create_note!
    subject.call(lines, [note])

    actual_note = lines.second

    expected_first_part_of_row = [
      'Example Note',
      '2018-08-20T11:16:44',
      latitude,
      longitude
    ]
    expect(actual_note[0..-2]).to eq(expected_first_part_of_row)
    expect(actual_note[-1]).to match(photo_url_regexp)
  end

  private

  def create_note!
    Note.create!(
      session: Session.new,
      text: 'Example Note',
      date: date,
      latitude: latitude,
      longitude: longitude,
      photo: File.new("#{Rails.root}/spec/fixtures/test.jpg")
    )
  end
end
