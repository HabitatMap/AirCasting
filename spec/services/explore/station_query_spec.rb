require 'rails_helper'

describe Explore::StationQuery do
  let(:gov_query) { instance_double(Explore::GovStationQuery, call: nil) }
  let(:airbeam_query) { instance_double(Explore::AirbeamStationQuery, call: nil) }
  let(:uuid) { '0b7e3f5a-6c1d-4e2f-9a8b-3c4d5e6f7a8b' }

  subject { described_class.new(gov_query: gov_query, airbeam_query: airbeam_query) }

  it 'asks government first and does not ask AirBeam when it answers' do
    station = Explore::StationItem.new(source: 'government')
    allow(gov_query).to receive(:call).with(uuid: uuid).and_return(station)

    expect(subject.call(uuid: uuid)).to eq(station)
    expect(airbeam_query).not_to have_received(:call)
  end

  it 'falls through to AirBeam when no station has the uuid' do
    session = Explore::StationItem.new(source: 'airbeam')
    allow(airbeam_query).to receive(:call).with(uuid: uuid).and_return(session)

    expect(subject.call(uuid: uuid)).to eq(session)
  end

  # stations.uuid is a uuid column; Postgres raises on a malformed literal
  # rather than returning no rows, so the probe has to be skipped, not rescued.
  it 'skips the government probe for a value that is not a uuid' do
    session = Explore::StationItem.new(source: 'airbeam')
    allow(airbeam_query).to receive(:call).with(uuid: 'fixed-uuid-1').and_return(session)

    expect(subject.call(uuid: 'fixed-uuid-1')).to eq(session)
    expect(gov_query).not_to have_received(:call)
  end

  it 'is nil when neither source has it' do
    expect(subject.call(uuid: uuid)).to be_nil
  end
end
