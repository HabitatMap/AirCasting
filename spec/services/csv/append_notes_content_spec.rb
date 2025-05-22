require 'rails_helper'

describe Csv::AppendNotesContent do
  let(:host) { 'http://example.com' }
  let(:lines) { [] }

  let(:subject) { described_class.new(host: host) }

  it 'appends correct headers' do
    note = build_stubbed(:note)
    expected_headers = %w[Note Time Latitude Longitude Photo_Url]

    subject.call(lines, [note])

    actual_headers = lines.first
    expect(actual_headers).to eq(expected_headers)
  end

  it 'appends note and image info' do
    latitude = BigDecimal('40.68038924')
    longitude = BigDecimal('-73.97631499')
    note =
      create(
        :note,
        :with_photo,
        date: DateTime.new(2_018, 8, 20, 11, 16, 44),
        text: 'Example Note',
        latitude: latitude,
        longitude: longitude,
      )
    photo_url =
      Rails.application.routes.url_helpers.rails_blob_url(
        note.s3_photo,
        host: host,
      )
    expected_note = [
      'Example Note',
      '2018-08-20T11:16:44',
      latitude,
      longitude,
      photo_url,
    ]

    subject.call(lines, [note])

    actual_note = lines.second
    expect(actual_note).to eq(expected_note)
  end
end
