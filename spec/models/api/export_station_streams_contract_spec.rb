# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Api::ExportStationStreamsContract do
  subject(:contract) { described_class.new }

  it 'accepts up to STATION_STREAM_IDS_MAX ids' do
    stub_const('Api::ExportLimits::STATION_STREAM_IDS_MAX', 2)
    result =
      contract.call(email: 'a@b.com', station_stream_ids: [1, 2])

    expect(result.success?).to be true
  end

  it 'rejects more than STATION_STREAM_IDS_MAX ids' do
    stub_const('Api::ExportLimits::STATION_STREAM_IDS_MAX', 2)
    result =
      contract.call(email: 'a@b.com', station_stream_ids: [1, 2, 3])

    expect(result.success?).to be false
    expect(result.errors.to_h[:station_stream_ids]).to include(
      a_string_matching(/cannot export more than 2/),
    )
  end
end
